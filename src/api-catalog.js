// Developer-friendly API Catalog for Medicare-Medicaid Billing Orchestrator
// Provides interactive schemas, descriptions, and cURL snippets for engineers.

const API_ENDPOINTS = [
  {
    id: 'get-integrations',
    category: 'Integrations & Operations',
    method: 'GET',
    path: '/api/integrations',
    summary: 'List All Integrations & Operational Statuses',
    description: 'Retrieves all configured orchestrator integrations with current status, latencies, and friendly names editable by operations managers.',
    headers: [
      { name: 'Accept', value: 'application/json', required: true }
    ],
    parameters: [],
    requestBody: null,
    responseExample: {
      integrations: [
        {
          id: 'salesforce-crm',
          friendlyName: 'Salesforce CRM Connector',
          systemName: 'salesforce_health_cloud_adapter',
          category: 'CRM & Member 360',
          status: 'Active',
          latencyMs: 38,
          endpoint: 'https://rghi-healthcloud.my.salesforce.com/services/data/v59.0'
        }
      ]
    },
    curlSnippet: 'curl -X GET http://localhost:3000/api/integrations \\\n  -H "Accept: application/json"'
  },
  {
    id: 'update-integration',
    category: 'Integrations & Operations',
    method: 'PUT',
    path: '/api/integrations/:id',
    summary: 'Update Integration Friendly Name & Configuration',
    description: 'Allows operations managers to update the human-friendly display name or operational status of any connected integration.',
    headers: [
      { name: 'Content-Type', value: 'application/json', required: true }
    ],
    parameters: [
      { name: 'id', in: 'path', type: 'string', required: true, description: 'Unique integration identifier (e.g., salesforce-crm, anthropic-agent)' }
    ],
    requestBody: {
      friendlyName: 'Salesforce Health Cloud Production Link',
      status: 'Active'
    },
    responseExample: {
      success: true,
      integration: {
        id: 'salesforce-crm',
        friendlyName: 'Salesforce Health Cloud Production Link',
        status: 'Active',
        lastChecked: '2026-10-12T17:00:00.000Z'
      }
    },
    curlSnippet: 'curl -X PUT http://localhost:3000/api/integrations/salesforce-crm \\\n  -H "Content-Type: application/json" \\\n  -d \'{"friendlyName": "Salesforce Health Cloud Production Link"}\''
  },
  {
    id: 'test-integration',
    category: 'Integrations & Operations',
    method: 'POST',
    path: '/api/integrations/:id/test',
    summary: 'Test Integration Health & Latency',
    description: 'Executes an immediate roundtrip health check against the specified integration endpoint, reporting connectivity and latency in milliseconds.',
    headers: [
      { name: 'Content-Type', value: 'application/json', required: false }
    ],
    parameters: [
      { name: 'id', in: 'path', type: 'string', required: true, description: 'Integration ID to test' }
    ],
    requestBody: null,
    responseExample: {
      id: 'anthropic-agent',
      friendlyName: 'Anthropic Managed Billing Intelligence Agent',
      status: 'Active',
      latencyMs: 52,
      healthy: true,
      timestamp: '2026-10-12T17:00:00.000Z'
    },
    curlSnippet: 'curl -X POST http://localhost:3000/api/integrations/anthropic-agent/test'
  },
  {
    id: 'get-crm-status',
    category: 'CRM & Salesforce Connector',
    method: 'GET',
    path: '/api/crm/status',
    summary: 'Get Salesforce / CRM Connection Status',
    description: 'Returns real-time connection status, Salesforce Health Cloud org identifier, OAuth token validity, and event sync metrics.',
    headers: [
      { name: 'Accept', value: 'application/json', required: true }
    ],
    parameters: [],
    requestBody: null,
    responseExample: {
      connected: true,
      provider: 'Salesforce Health Cloud',
      instanceUrl: 'https://rghi-healthcloud.my.salesforce.com',
      orgId: '00D5e000001RGHI_PROD',
      channel: '/event/Billing_Agent_Outcome__e',
      eventsSyncedCount: 145
    },
    curlSnippet: 'curl -X GET http://localhost:3000/api/crm/status'
  },
  {
    id: 'get-crm-member',
    category: 'CRM & Salesforce Connector',
    method: 'GET',
    path: '/api/crm/member',
    summary: 'Fetch Active Member 360 Record',
    description: 'Retrieves the active Medicare/Medicaid member profile from the CRM including MBI, Medicaid ID, dual-eligibility status, and benefit accumulators.',
    headers: [
      { name: 'Accept', value: 'application/json', required: true }
    ],
    parameters: [],
    requestBody: null,
    responseExample: {
      id: 'RGHI-MED-98421',
      name: 'Eleanor Vance',
      mbi: '1EG4-TE5-MK72',
      medicaidId: 'PA-MCD-998241',
      dualStatus: 'Full Dual (QMB - Qualified Medicare Beneficiary)',
      planName: 'Really Great Health Insurance Dual Complete (HMO D-SNP)',
      activeCaseId: '00142981'
    },
    curlSnippet: 'curl -X GET http://localhost:3000/api/crm/member'
  },
  {
    id: 'get-crm-outcomes',
    category: 'CRM & Salesforce Connector',
    method: 'GET',
    path: '/api/crm/outcomes',
    summary: 'List Agent Outcomes Synced to CSR CRM',
    description: 'Returns the chronological feed of AI agent outcomes synced into the CSR Salesforce Health Cloud workspace.',
    headers: [
      { name: 'Accept', value: 'application/json', required: true }
    ],
    parameters: [],
    requestBody: null,
    responseExample: {
      outcomes: [
        {
          id: 'OUT-2026-8801',
          caseNumber: '00142981',
          inquiryTopic: 'Specialist Balance Bill Dispute (Cardiology)',
          agentDetermination: 'Approved Claim Adjustment. Member is QMB Dual Eligible under Social Security Act § 1902(n)(3)(B). Balance billing is strictly illegal.',
          financialImpact: { memberResponsibility: 0.00 },
          crmSyncStatus: 'Synced to Salesforce Health Cloud'
        }
      ]
    },
    curlSnippet: 'curl -X GET http://localhost:3000/api/crm/outcomes'
  },
  {
    id: 'post-crm-outcomes',
    category: 'CRM & Salesforce Connector',
    method: 'POST',
    path: '/api/crm/outcomes',
    summary: 'Sync Agent Outcome to Salesforce / CRM',
    description: 'Publishes a structured billing determination outcome directly to the CRM platform event bus, updating the CSR workspace and case history.',
    headers: [
      { name: 'Content-Type', value: 'application/json', required: true }
    ],
    parameters: [],
    requestBody: {
      caseNumber: '00142981',
      inquiryTopic: 'DME CPAP Coverage Verification',
      querySummary: 'Member asked if CPAP supplies are covered under Really Great Health Insurance.',
      agentDetermination: 'Covered under Part B DME benefit with prior auth.',
      billingCodes: {
        cpt: ['95810'],
        hcpcs: ['E0601'],
        icd10: ['G47.33']
      },
      csrGuidance: 'Advise member CPAP is 100% covered upon completion of prior authorization.'
    },
    responseExample: {
      success: true,
      outcome: {
        id: 'OUT-2026-9102',
        crmSyncStatus: 'Synced to Salesforce Health Cloud',
        syncedAt: '2026-10-12T17:05:00.000Z'
      }
    },
    curlSnippet: 'curl -X POST http://localhost:3000/api/crm/outcomes \\\n  -H "Content-Type: application/json" \\\n  -d \'{"inquiryTopic": "CPAP Coverage", "agentDetermination": "Covered 100%"}\''
  },
  {
    id: 'post-orchestrator-chat',
    category: 'Billing Orchestration & Chat',
    method: 'POST',
    path: '/api/orchestrator/chat',
    summary: 'Submit Medicare/Medicaid Billing Query',
    description: 'Submits a natural language query regarding Medicare/Medicaid billing for Really Great Health Insurance, generates clinical determinations, billing codes, and optionally auto-syncs the outcome to Salesforce CRM.',
    headers: [
      { name: 'Content-Type', value: 'application/json', required: true }
    ],
    parameters: [],
    requestBody: {
      query: 'A provider sent a balance bill for Medicare Part B coinsurance to a QMB member. What should I do?',
      autoSyncCrm: true
    },
    responseExample: {
      markdownText: '### Really Great Health Insurance Billing Determination\n...',
      structuredOutcome: {
        id: 'OUT-2026-9214',
        inquiryTopic: 'QMB Dual Eligible Balance Billing & Cost Sharing',
        memberResponsibility: 0.00,
        billingCodes: { cpt: ['99214'], hcpcs: [], icd10: ['Z76.89'] }
      },
      syncedToCrm: true
    },
    curlSnippet: 'curl -X POST http://localhost:3000/api/orchestrator/chat \\\n  -H "Content-Type: application/json" \\\n  -d \'{"query": "Is physical therapy covered under our Medicare Advantage plan?", "autoSyncCrm": true}\''
  },
  {
    id: 'post-managed-agent-session',
    category: 'Anthropic Managed Agents',
    method: 'POST',
    path: '/api/agent/managed-session',
    summary: 'Invoke Anthropic Managed Agent (agent_01MPUV932QnhfsSrA51v7VY3)',
    description: 'Creates a managed agent session in environment env_01VZxGuSVdfUjmYDfCS3Y8S8 via the Anthropic SDK client.beta.sessions API, sends a user.message event, and streams agent.message events until session.status_idle.',
    headers: [
      { name: 'Content-Type', value: 'application/json', required: true }
    ],
    parameters: [],
    requestBody: {
      prompt: 'Verify Medicare Part B deductible and secondary Medicaid crossover for a routine physician office visit.',
      agentId: 'agent_01MPUV932QnhfsSrA51v7VY3',
      environmentId: 'env_01VZxGuSVdfUjmYDfCS3Y8S8'
    },
    responseExample: {
      sessionId: 'sesn_019V6qJzX2dpNyB7HsEFoRfW',
      agentId: 'agent_01MPUV932QnhfsSrA51v7VY3',
      environmentId: 'env_01VZxGuSVdfUjmYDfCS3Y8S8',
      status: 'session.status_idle',
      text: 'Adjudication completed for Really Great Health Insurance beneficiary...',
      eventsCount: 4
    },
    curlSnippet: 'curl -X POST http://localhost:3000/api/agent/managed-session \\\n  -H "Content-Type: application/json" \\\n  -d \'{"prompt": "Verify billing codes for CPAP machine E0601"}\''
  }
];

module.exports = {
  API_ENDPOINTS
};
