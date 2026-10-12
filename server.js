// Medicare & Medicaid Billing Orchestrator - Main Server
// Serves REST APIs, Developer API catalog, Operations Manager controls, and Front-End UI

const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const fs = require('fs');

const INDEX_HTML = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');

const integrationsStore = require('./src/integrations-data');
const crmStore = require('./src/crm-store');
const { API_ENDPOINTS } = require('./src/api-catalog');
const { answerBillingQuery } = require('./src/billing-engine');
const { runManagedAgentSession, DEFAULT_AGENT_ID, DEFAULT_ENVIRONMENT_ID } = require('./agent_client');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Really Great Health Insurance Billing Orchestrator',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// ==========================================
// OPERATIONS MANAGER: INTEGRATIONS APIS
// ==========================================

// List all integrations with friendly names
app.get('/api/integrations', (req, res) => {
  const integrations = integrationsStore.getAll();
  res.json({
    count: integrations.length,
    integrations
  });
});

// Update friendly name or status for an integration
app.put('/api/integrations/:id', (req, res) => {
  const { id } = req.params;
  const { friendlyName, status, managedBy } = req.body;

  const existing = integrationsStore.getById(id);
  if (!existing) {
    return res.status(404).json({ error: `Integration "${id}" not found.` });
  }

  let updated = existing;
  if (friendlyName && typeof friendlyName === 'string') {
    updated = integrationsStore.updateFriendlyName(id, friendlyName, managedBy || 'Operations Manager');
  }

  if (status && ['Active', 'Degraded', 'Maintenance', 'Inactive'].includes(status)) {
    updated = integrationsStore.updateStatus(id, status, managedBy || 'Operations Manager');
  }

  res.json({
    success: true,
    message: `Integration "${updated.id}" successfully updated.`,
    integration: updated
  });
});

// Test connection ping for an integration
app.post('/api/integrations/:id/test', (req, res) => {
  const { id } = req.params;
  const result = integrationsStore.testConnection(id);
  if (!result) {
    return res.status(404).json({ error: `Integration "${id}" not found.` });
  }
  res.json({
    success: true,
    result
  });
});

// Get operations audit log
app.get('/api/integrations/audit', (req, res) => {
  res.json({
    auditLog: integrationsStore.getAuditLog()
  });
});

// ==========================================
// DEVELOPER PORTAL: API CATALOG
// ==========================================

app.get('/api/developer/endpoints', (req, res) => {
  res.json({
    title: 'Really Great Health Insurance Billing Orchestrator API Directory',
    version: 'v1.0',
    baseUrl: `${req.protocol}://${req.get('host')}`,
    count: API_ENDPOINTS.length,
    endpoints: API_ENDPOINTS
  });
});

// ==========================================
// SALESFORCE / COMPANY CRM CONNECTOR & CSR
// ==========================================

// CRM connection status
app.get('/api/crm/status', (req, res) => {
  res.json(crmStore.getConnection());
});

// Test CRM sync ping
app.post('/api/crm/test-sync', (req, res) => {
  res.json(crmStore.testSync());
});

// Active member 360 record
app.get('/api/crm/member', (req, res) => {
  res.json(crmStore.getMember());
});

// CSR agent outcomes feed
app.get('/api/crm/outcomes', (req, res) => {
  const outcomes = crmStore.getOutcomes();
  res.json({
    count: outcomes.length,
    outcomes
  });
});

// Push outcome to CRM
app.post('/api/crm/outcomes', (req, res) => {
  const outcomeData = req.body;
  if (!outcomeData || !outcomeData.inquiryTopic) {
    return res.status(400).json({ error: 'inquiryTopic is required to sync an outcome.' });
  }

  const recorded = crmStore.recordOutcome(outcomeData);
  res.status(201).json({
    success: true,
    message: 'Outcome successfully synced to Salesforce Health Cloud platform events.',
    outcome: recorded
  });
});

// ==========================================
// CHAT CONSOLE & ORCHESTRATION ENGINE
// ==========================================

app.post('/api/orchestrator/chat', async (req, res) => {
  const { query, autoSyncCrm = true } = req.body;

  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'A query string is required.' });
  }

  const member = crmStore.getMember();
  const result = answerBillingQuery(query, member);

  let syncedOutcome = null;
  if (autoSyncCrm) {
    syncedOutcome = crmStore.recordOutcome({
      ...result.structuredOutcome,
      querySummary: query
    });
  }

  res.json({
    query,
    markdownText: result.markdownText,
    topic: result.topic,
    structuredOutcome: syncedOutcome || result.structuredOutcome,
    syncedToCrm: Boolean(syncedOutcome)
  });
});

// Anthropic Managed Agent Session endpoint
app.post('/api/agent/managed-session', async (req, res) => {
  const { prompt, agentId = DEFAULT_AGENT_ID, environmentId = DEFAULT_ENVIRONMENT_ID } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required.' });
  }

  try {
    const sessionResult = await runManagedAgentSession(prompt, {
      agentId,
      environmentId,
      silent: true,
      fast: true
    });

    // Also auto-sync outcome to CRM
    const member = crmStore.getMember();
    const outcome = crmStore.recordOutcome({
      caseNumber: member.activeCaseId,
      inquiryTopic: 'Anthropic Managed Agent Ingestion',
      querySummary: prompt,
      agentDetermination: sessionResult.fullText.substring(0, 300) + '...',
      actionTaken: `Session ${sessionResult.sessionId} executed in environment ${environmentId}`,
      csrGuidance: 'Review transcript generated by Anthropic Managed Agent and verify member satisfaction.'
    });

    res.json({
      success: true,
      sessionId: sessionResult.sessionId,
      agentId: sessionResult.agentId,
      environmentId: sessionResult.environmentId,
      status: sessionResult.status,
      text: sessionResult.fullText,
      crmOutcome: outcome
    });
  } catch (err) {
    res.status(500).json({
      error: 'Failed to complete managed agent session',
      details: err.message
    });
  }
});

// Fallback to SPA for any unmatched GET route
app.use((req, res) => {
  if (req.method !== 'GET') {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  res.type('html').send(INDEX_HTML);
});

let serverInstance = null;
function startServer(port = PORT) {
  return new Promise((resolve) => {
    serverInstance = app.listen(port, () => {
      console.log(`[RGHI Orchestrator] Front-End & API server running at http://localhost:${port}`);
      resolve(serverInstance);
    });
  });
}

function stopServer() {
  return new Promise((resolve) => {
    if (serverInstance) {
      serverInstance.close(() => {
        resolve();
      });
    } else {
      resolve();
    }
  });
}

if (require.main === module) {
  startServer(PORT);
}

module.exports = {
  app,
  startServer,
  stopServer
};
