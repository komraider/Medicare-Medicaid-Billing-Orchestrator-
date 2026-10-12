const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const { app } = require('../server');

describe('Really Great Health Insurance Billing Orchestrator API', () => {

  test('GET /api/health returns 200 and healthy status', async () => {
    const res = await request(app).get('/api/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'ok');
    assert.ok(res.body.service.includes('Really Great Health Insurance'));
  });

  describe('Operations Manager: Integrations API', () => {
    test('GET /api/integrations lists all integrations with friendly names', async () => {
      const res = await request(app).get('/api/integrations');
      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.body.integrations));
      assert.ok(res.body.integrations.length >= 6);

      const sf = res.body.integrations.find(i => i.id === 'salesforce-crm');
      assert.ok(sf);
      assert.strictEqual(sf.friendlyName, 'Salesforce CRM Connector');

      const anthropic = res.body.integrations.find(i => i.id === 'anthropic-agent');
      assert.ok(anthropic);
      assert.strictEqual(anthropic.friendlyName, 'Anthropic Managed Billing Intelligence Agent');
    });

    test('PUT /api/integrations/:id updates friendly name and logs audit entry', async () => {
      const updateRes = await request(app)
        .put('/api/integrations/salesforce-crm')
        .send({
          friendlyName: 'Salesforce Health Cloud Production Link',
          managedBy: 'Ops Manager Eleanor'
        });

      assert.strictEqual(updateRes.status, 200);
      assert.strictEqual(updateRes.body.success, true);
      assert.strictEqual(updateRes.body.integration.friendlyName, 'Salesforce Health Cloud Production Link');

      // Verify audit log has the update
      const auditRes = await request(app).get('/api/integrations/audit');
      assert.strictEqual(auditRes.status, 200);
      assert.ok(auditRes.body.auditLog.length > 0);
      const latestAudit = auditRes.body.auditLog[0];
      assert.ok(latestAudit.details.includes('Salesforce Health Cloud Production Link'));
    });

    test('POST /api/integrations/:id/test returns roundtrip ping and latency', async () => {
      const res = await request(app).post('/api/integrations/anthropic-agent/test');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(typeof res.body.result.latencyMs === 'number');
      assert.strictEqual(res.body.result.healthy, true);
    });

    test('PUT /api/integrations/:id returns 404 for invalid id', async () => {
      const res = await request(app)
        .put('/api/integrations/non-existent-system')
        .send({ friendlyName: 'Test' });
      assert.strictEqual(res.status, 404);
    });
  });

  describe('Developer Portal: API Catalog', () => {
    test('GET /api/developer/endpoints returns list of endpoints with cURL and schemas', async () => {
      const res = await request(app).get('/api/developer/endpoints');
      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.body.endpoints));
      assert.ok(res.body.endpoints.length >= 7);

      const chatEp = res.body.endpoints.find(e => e.path === '/api/orchestrator/chat');
      assert.ok(chatEp);
      assert.strictEqual(chatEp.method, 'POST');
      assert.ok(chatEp.curlSnippet.includes('curl -X POST'));
      assert.ok(chatEp.responseExample);
    });
  });

  describe('Salesforce / CRM & CSR View', () => {
    test('GET /api/crm/status returns Salesforce connection metadata', async () => {
      const res = await request(app).get('/api/crm/status');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.connected, true);
      assert.strictEqual(res.body.provider, 'Salesforce Health Cloud');
      assert.ok(res.body.instanceUrl);
    });

    test('GET /api/crm/member returns Eleanor Vance Dual Complete profile', async () => {
      const res = await request(app).get('/api/crm/member');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.name, 'Eleanor Vance');
      assert.strictEqual(res.body.mbi, '1EG4-TE5-MK72');
      assert.ok(res.body.dualStatus.includes('QMB'));
    });

    test('GET /api/crm/outcomes returns seeded CSR outcomes', async () => {
      const res = await request(app).get('/api/crm/outcomes');
      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.body.outcomes));
      assert.ok(res.body.outcomes.length >= 2);
    });

    test('POST /api/crm/outcomes records outcome and updates sync metrics', async () => {
      const newOutcome = {
        caseNumber: '00142981',
        inquiryTopic: 'Diabetic Shoe Coverage Verification',
        querySummary: 'Does Part B cover therapeutic shoes for diabetic neuropathy?',
        agentDetermination: 'Covered under Part B benefit A5500. One pair per calendar year.',
        billingCodes: {
          cpt: [],
          hcpcs: ['A5500 - Diabetic shoe for density insert'],
          icd10: ['E11.40 - Type 2 diabetes with diabetic neuropathy']
        },
        financialImpact: {
          memberResponsibility: 0.00
        },
        csrGuidance: 'Advise member that 1 pair per calendar year is covered with certifying physician order.'
      };

      const res = await request(app).post('/api/crm/outcomes').send(newOutcome);
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.outcome.inquiryTopic, 'Diabetic Shoe Coverage Verification');
      assert.ok(res.body.outcome.id.startsWith('OUT-'));
    });

    test('POST /api/crm/test-sync verifies Salesforce event channel ping', async () => {
      const res = await request(app).post('/api/crm/test-sync');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
    });
  });

  describe('Chat Console & Orchestrator Adjudication', () => {
    test('POST /api/orchestrator/chat adjudicates query and auto-syncs outcome to CRM', async () => {
      const res = await request(app)
        .post('/api/orchestrator/chat')
        .send({
          query: 'A provider sent a balance bill for Medicare Part B coinsurance to a QMB member. What should I do?',
          autoSyncCrm: true
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.syncedToCrm, true);
      assert.ok(res.body.markdownText.includes('Really Great Health Insurance Billing Determination'));
      assert.ok(res.body.structuredOutcome.agentDetermination.includes('Prohibited Balance Billing') || res.body.structuredOutcome.agentDetermination.includes('QMB'));

      // Check outcomes list has the new synced item
      const outcomesRes = await request(app).get('/api/crm/outcomes');
      const latest = outcomesRes.body.outcomes[0];
      assert.strictEqual(latest.inquiryTopic, 'QMB Dual Eligible Balance Billing & Cost Sharing');
    });

    test('POST /api/orchestrator/chat returns 400 for empty query', async () => {
      const res = await request(app).post('/api/orchestrator/chat').send({ query: '' });
      assert.strictEqual(res.status, 400);
    });
  });

  describe('Anthropic Managed Agent Session API', () => {
    test('POST /api/agent/managed-session executes session and returns agent outcome', async () => {
      const res = await request(app)
        .post('/api/agent/managed-session')
        .send({
          prompt: 'Verify CPAP machine prior authorization requirements for Eleanor Vance.',
          agentId: 'agent_01MPUV932QnhfsSrA51v7VY3',
          environmentId: 'env_01VZxGuSVdfUjmYDfCS3Y8S8'
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.agentId, 'agent_01MPUV932QnhfsSrA51v7VY3');
      assert.strictEqual(res.body.environmentId, 'env_01VZxGuSVdfUjmYDfCS3Y8S8');
      assert.strictEqual(res.body.status, 'session.status_idle');
      assert.ok(res.body.text.length > 0);
      assert.ok(res.body.crmOutcome);
    });
  });

  describe('Routing and Fallbacks', () => {
    test('Non-GET request to non-existent endpoint returns 404', async () => {
      const res = await request(app).post('/api/non-existent-endpoint').send({});
      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.error, 'Endpoint not found');
    });

    test('GET request to SPA route returns index.html', async () => {
      const res = await request(app).get('/dashboard');
      assert.strictEqual(res.status, 200);
      assert.ok(res.text.includes('Really Great Health Insurance'));
    });
  });
});
