// Store and manager for orchestrator integrations with customizable friendly names
// Designed for operations managers to monitor, configure, and inspect connections.

const initialIntegrations = [
  {
    id: 'salesforce-crm',
    systemName: 'salesforce_health_cloud_adapter',
    friendlyName: 'Salesforce CRM Connector',
    category: 'CRM & Member 360',
    type: 'REST / Webhook / Platform Events',
    endpoint: 'https://rghi-healthcloud.my.salesforce.com/services/data/v59.0',
    status: 'Active',
    latencyMs: 38,
    version: 'v59.0',
    description: 'Bridges orchestrator events with Salesforce Health Cloud. Pushes AI agent outcomes to CSR case records and pulls Member 360 eligibility data.',
    managedBy: 'Operations & Salesforce Admin',
    lastChecked: new Date().toISOString(),
    config: {
      connectedApp: 'RGHI_Billing_Orchestrator',
      instanceUrl: 'https://rghi-healthcloud.my.salesforce.com',
      authMethod: 'OAuth 2.0 JWT Bearer',
      platformEventChannel: '/event/Billing_Agent_Outcome__e',
      autoSyncOutcomes: true
    }
  },
  {
    id: 'anthropic-agent',
    systemName: 'anthropic_managed_agents_sdk',
    friendlyName: 'Anthropic Managed Billing Intelligence Agent',
    category: 'AI Agents',
    type: 'Anthropic Managed Agents Beta API',
    endpoint: 'agent_01MPUV932QnhfsSrA51v7VY3 (env_01VZxGuSVdfUjmYDfCS3Y8S8)',
    status: 'Active',
    latencyMs: 54,
    version: '2024-10-beta',
    description: 'Anthropic Managed Agent executing Medicare Part A/B/C/D and Medicaid dual eligibility adjudication reasoning via client.beta.sessions.',
    managedBy: 'AI Platform & Clinical Operations',
    lastChecked: new Date().toISOString(),
    config: {
      agentId: 'agent_01MPUV932QnhfsSrA51v7VY3',
      environmentId: 'env_01VZxGuSVdfUjmYDfCS3Y8S8',
      sessionStreaming: true,
      idleTimeoutSeconds: 60
    }
  },
  {
    id: 'cms-blue-button',
    systemName: 'cms_bluebutton_fhir_v2',
    friendlyName: 'CMS Medicare Claims & Eligibility API',
    category: 'Government & Regulatory',
    type: 'HL7 FHIR v4.0.1',
    endpoint: 'https://api.bluebutton.cms.gov/v2/fhir',
    status: 'Active',
    latencyMs: 112,
    version: 'FHIR R4',
    description: 'Retrieves official Medicare Part A (Inpatient), Part B (Outpatient/Medical), and Part D (Prescription) claims history for enrolled Medicare beneficiaries.',
    managedBy: 'Government Programs Operations',
    lastChecked: new Date().toISOString(),
    config: {
      syntheticDataMode: true,
      supportedResources: ['ExplanationOfBenefit', 'Coverage', 'Patient'],
      rateLimitRpm: 1200
    }
  },
  {
    id: 'state-medicaid-edi',
    systemName: 'state_medicaid_edi_gateway',
    friendlyName: 'State Medicaid EDI 837/835 Gateway',
    category: 'Government & Regulatory',
    type: 'X12 EDI 837P / 835',
    endpoint: 'https://edi.medicaid.state.gov/v1/gateway',
    status: 'Active',
    latencyMs: 135,
    version: 'HIPAA 5010',
    description: 'Direct EDI conduit to State Medicaid management systems for dual-eligible crossover claims, QMB remittance advices, and secondary payments.',
    managedBy: 'EDI Clearinghouse Operations',
    lastChecked: new Date().toISOString(),
    config: {
      tradingPartnerId: 'RGHI-PAYER-PA01',
      batchFrequency: 'Hourly & Realtime 270/271',
      supportedTransactions: ['837P', '835', '270', '271']
    }
  },
  {
    id: 'prior-auth-portal',
    systemName: 'davinci_pas_engine',
    friendlyName: 'Prior Auth & Clinical Review Engine',
    category: 'Clinical & Utilization',
    type: 'HL7 FHIR DaVinci PAS',
    endpoint: 'https://pas.reallygreathealth.com/fhir/Claim/$submit',
    status: 'Active',
    latencyMs: 82,
    version: 'DaVinci 1.1.0',
    description: 'Automates prior authorization determinations for DME (e.g. CPAP, wheelchairs), specialized imaging, and surgical procedures under CMS-0057-F rules.',
    managedBy: 'Utilization Management Operations',
    lastChecked: new Date().toISOString(),
    config: {
      cms0057Compliance: true,
      standardDecisionDays: 7,
      expeditedDecisionHours: 72
    }
  },
  {
    id: 'claims-adjudication-core',
    systemName: 'rghi_core_claims_engine',
    friendlyName: 'Core Claims Adjudication Engine',
    category: 'Core Billing',
    type: 'gRPC / Internal REST',
    endpoint: 'https://claims-core.internal.reallygreathealth.com/api/v2',
    status: 'Active',
    latencyMs: 22,
    version: 'v2.4.1',
    description: 'Internal payment calculation engine tracking Medicare deductibles, member accumulators, provider fee schedules, and coordination of benefit splits.',
    managedBy: 'Core Claims Operations',
    lastChecked: new Date().toISOString(),
    config: {
      currentPlanYear: 2026,
      feeScheduleVersion: 'CMS-PFS-2026-Q4',
      coordinationRule: 'MedicarePrimary_MedicaidSecondary'
    }
  }
];

class IntegrationsStore {
  constructor() {
    this.integrations = [...initialIntegrations];
    this.auditLog = [
      {
        id: 'audit-001',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        action: 'INITIALIZE',
        user: 'ops_manager_admin',
        integrationId: 'salesforce-crm',
        details: 'Configured friendly name "Salesforce CRM Connector" for operations visibility.'
      }
    ];
  }

  getAll() {
    return this.integrations;
  }

  getById(id) {
    return this.integrations.find(item => item.id === id);
  }

  updateFriendlyName(id, friendlyName, updatedBy = 'Operations Manager') {
    const item = this.getById(id);
    if (!item) return null;
    const oldName = item.friendlyName;
    item.friendlyName = friendlyName.trim();
    item.lastChecked = new Date().toISOString();

    this.auditLog.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'UPDATE_FRIENDLY_NAME',
      user: updatedBy,
      integrationId: id,
      details: `Changed friendly name from "${oldName}" to "${item.friendlyName}".`
    });

    return item;
  }

  updateStatus(id, status, updatedBy = 'Operations Manager') {
    const item = this.getById(id);
    if (!item) return null;
    const oldStatus = item.status;
    item.status = status;
    item.lastChecked = new Date().toISOString();

    this.auditLog.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'UPDATE_STATUS',
      user: updatedBy,
      integrationId: id,
      details: `Changed status from "${oldStatus}" to "${status}".`
    });

    return item;
  }

  testConnection(id) {
    const item = this.getById(id);
    if (!item) return null;
    // Simulate real-world roundtrip health check ping
    const variance = Math.floor(Math.random() * 20) - 10;
    const baseLatency = item.id === 'claims-adjudication-core' ? 22 : (item.id === 'salesforce-crm' ? 40 : 80);
    item.latencyMs = Math.max(12, baseLatency + variance);
    item.lastChecked = new Date().toISOString();
    return {
      id: item.id,
      friendlyName: item.friendlyName,
      status: item.status,
      latencyMs: item.latencyMs,
      timestamp: item.lastChecked,
      healthy: item.status === 'Active'
    };
  }

  getAuditLog() {
    return this.auditLog;
  }
}

module.exports = new IntegrationsStore();
