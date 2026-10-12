// In-memory store and manager for Salesforce / CRM demo
// Empowers CSRs (Customer Service Representatives) to view AI Agent outcomes in real time.

const defaultMember = {
  id: 'RGHI-MED-98421',
  name: 'Eleanor Vance',
  dob: '1949-04-12',
  age: 77,
  gender: 'Female',
  phone: '(555) 382-9014',
  address: '142 Maplewood Terrace, Philadelphia, PA 19104',
  mbi: '1EG4-TE5-MK72',
  medicaidId: 'PA-MCD-998241',
  dualStatus: 'Full Dual (QMB - Qualified Medicare Beneficiary)',
  planName: 'Really Great Health Insurance Dual Complete (HMO D-SNP)',
  planId: 'H1024-002-2026',
  pcp: 'Dr. Marcus Brody, MD (Pine Valley Family Medicine)',
  effectiveDate: '2024-01-01',
  activeCaseId: '00142981',
  coverageSummary: {
    partA: 'Covered (Inpatient Hospital, Skilled Nursing)',
    partB: 'Covered (Physician, Outpatient, DME, Diagnostics)',
    partC: 'Really Great Health Insurance Advantage D-SNP',
    partD: 'Covered (Rx Tier 1-5, $0 copay for low-income subsidy)',
    qmbProtection: 'Active - Federal law prohibits providers from balance billing QMB members for Medicare deductibles/coinsurance'
  }
};

const initialOutcomes = [
  {
    id: 'OUT-2026-8801',
    caseNumber: '00142981',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    memberId: 'RGHI-MED-98421',
    memberName: 'Eleanor Vance',
    inquiryTopic: 'Specialist Balance Bill Dispute (Cardiology)',
    querySummary: 'Member received a $145.20 bill from an in-network cardiologist for Part B 20% coinsurance after a routine echocardiogram.',
    agentDetermination: 'Approved Claim Adjustment. Member is QMB Dual Eligible under Social Security Act § 1902(n)(3)(B). Balance billing is strictly illegal for Medicare deductibles and coinsurance.',
    billingCodes: {
      cpt: ['93306 - Echocardiogram complete with Doppler'],
      icd10: ['I10 - Essential Primary Hypertension', 'I50.9 - Heart Failure, unspecified'],
      modifiers: ['26 - Professional Component']
    },
    financialImpact: {
      billedAmount: 726.00,
      medicarePaid: 580.80,
      secondaryMedicaidCrossover: 145.20,
      memberResponsibility: 0.00
    },
    actionTaken: 'Triggered crossover payment adjustment to provider via State Medicaid EDI 835. Dispatched Form CMS-10651 notice to billing provider regarding QMB balance billing prohibition.',
    csrGuidance: 'Inform Ms. Vance that she owes $0.00. Advise her to disregard the cardiologist invoice and that RGHI has contacted the provider billing office directly.',
    crmSyncStatus: 'Synced to Salesforce Health Cloud (Case #00142981)',
    syncedAt: new Date(Date.now() - 7150000).toISOString()
  },
  {
    id: 'OUT-2026-8794',
    caseNumber: '00142978',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    memberId: 'RGHI-MED-98421',
    memberName: 'Eleanor Vance',
    inquiryTopic: 'DME Prior Authorization & Coverage (CPAP Machine)',
    querySummary: 'PCP submitted prior authorization request for Continuous Positive Airway Pressure (CPAP) device following sleep study diagnosis of severe obstructive sleep apnea (AHI: 34).',
    agentDetermination: 'Prior Authorization Auto-Approved. Meets CMS NCD 240.4 criteria: 12-week trial period authorized with compliance monitoring.',
    billingCodes: {
      cpt: ['95810 - Polysomnography sleep study'],
      hcpcs: ['E0601 - CPAP continuous positive airway pressure device', 'A7034 - Nasal interface mask'],
      icd10: ['G47.33 - Obstructive sleep apnea (adult)']
    },
    financialImpact: {
      monthlyRentalAllowance: 110.00,
      coveredMonths: 3,
      memberCopay: 0.00
    },
    actionTaken: 'Generated Prior Auth #PA-99201. Sent electronic order to In-Network DME supplier (Apria Healthcare) and updated Care Plan in Salesforce Health Cloud.',
    csrGuidance: 'Confirm to member that equipment is authorized. Apria Healthcare will contact her within 48 hours for delivery and fitting. Remind member of 4-hour nightly compliance tracking requirement.',
    crmSyncStatus: 'Synced to Salesforce Health Cloud (Case #00142978)',
    syncedAt: new Date(Date.now() - 86350000).toISOString()
  }
];

class CrmStore {
  constructor() {
    this.member = { ...defaultMember };
    this.outcomes = [...initialOutcomes];
    this.connection = {
      connected: true,
      provider: 'Salesforce Health Cloud',
      instanceUrl: 'https://rghi-healthcloud.my.salesforce.com',
      orgId: '00D5e000001RGHI_PROD',
      connectedUser: 'csr_orchestrator_integration@reallygreathealth.com',
      authType: 'OAuth 2.0 Web Server Flow (Platform Events)',
      channel: '/event/Billing_Agent_Outcome__e',
      lastPing: new Date().toISOString(),
      eventsSyncedCount: 144
    };
  }

  getConnection() {
    return this.connection;
  }

  getMember() {
    return this.member;
  }

  getOutcomes() {
    return this.outcomes;
  }

  getOutcomeById(id) {
    return this.outcomes.find(o => o.id === id);
  }

  recordOutcome(outcomeData) {
    const outcomeId = `OUT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOutcome = {
      id: outcomeId,
      caseNumber: outcomeData.caseNumber || this.member.activeCaseId,
      timestamp: new Date().toISOString(),
      memberId: outcomeData.memberId || this.member.id,
      memberName: outcomeData.memberName || this.member.name,
      inquiryTopic: outcomeData.inquiryTopic || 'Medicare/Medicaid Billing Assistance',
      querySummary: outcomeData.querySummary || '',
      agentDetermination: outcomeData.agentDetermination || '',
      billingCodes: outcomeData.billingCodes || { cpt: [], hcpcs: [], icd10: [] },
      financialImpact: outcomeData.financialImpact || {
        billedAmount: 0,
        medicarePaid: 0,
        secondaryMedicaidCrossover: 0,
        memberResponsibility: 0
      },
      actionTaken: outcomeData.actionTaken || 'Case updated in billing orchestrator.',
      csrGuidance: outcomeData.csrGuidance || 'Review agent notes and communicate determination to member.',
      crmSyncStatus: 'Synced to Salesforce Health Cloud',
      syncedAt: new Date().toISOString()
    };

    this.outcomes.unshift(newOutcome);
    this.connection.eventsSyncedCount += 1;
    this.connection.lastPing = new Date().toISOString();
    return newOutcome;
  }

  testSync() {
    this.connection.lastPing = new Date().toISOString();
    return {
      success: true,
      message: 'Salesforce Health Cloud connection verified. Webhook channel /event/Billing_Agent_Outcome__e active.',
      orgId: this.connection.orgId,
      timestamp: this.connection.lastPing
    };
  }
}

module.exports = new CrmStore();
