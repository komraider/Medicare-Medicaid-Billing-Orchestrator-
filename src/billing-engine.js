// Medicare & Medicaid Billing Adjudication & Knowledge Engine
// Specializes in Really Great Health Insurance policies, Dual-Eligible Special Needs Plans (D-SNP),
// CMS regulations, CPT/HCPCS codes, and automated outcome generation for CSRs.

const KNOWLEDGE_BASE = [
  {
    topic: 'QMB Dual Eligible Balance Billing & Cost Sharing',
    keywords: ['qmb', 'dual', 'balance bill', 'coinsurance', 'deductible', 'copay', 'secondary', 'crossover', 'specialist bill'],
    sampleMatch: 'balance bill',
    cptCodes: ['99213 - Office visit outpatient low complexity', '99214 - Office visit outpatient moderate complexity'],
    hcpcsCodes: [],
    icd10Codes: ['Z76.89 - Persons encountering health services in other circumstances'],
    determination: 'Prohibited Balance Billing. Member is a Qualified Medicare Beneficiary (QMB). Under Federal law (Social Security Act § 1902(n)(3)(B) and 42 CFR § 447.15), Medicare and Medicaid participating providers are strictly prohibited from billing QMB beneficiaries for Medicare deductibles, coinsurance, or copayments.',
    memberResponsibility: 0.00,
    actionTaken: 'Triggered crossover payment review to billing provider via State Medicaid EDI 835. Dispatched Form CMS-10651 notice to billing provider regarding QMB balance billing prohibition.',
    csrGuidance: 'Advise member: "As a Dual-Eligible QMB member of Really Great Health Insurance, federal law protects you from paying any Medicare copays or deductibles for covered services. You owe $0.00. Our team has contacted the provider\'s billing office to re-adjudicate this claim."'
  },
  {
    topic: 'Durable Medical Equipment & CPAP Prior Authorization',
    keywords: ['cpap', 'dme', 'equipment', 'e0601', 'prior auth', 'sleep apnea', 'machine', 'oxygen', 'wheelchair'],
    sampleMatch: 'cpap',
    cptCodes: ['95810 - Polysomnography sleep study'],
    hcpcsCodes: ['E0601 - Continuous positive airway pressure (CPAP) device', 'A7034 - CPAP nasal mask'],
    icd10Codes: ['G47.33 - Obstructive sleep apnea (adult)'],
    determination: 'Covered under Medicare Part B / RGHI Advantage Plan with Prior Authorization. Follows CMS National Coverage Determination (NCD 240.4). Requires documented polysomnography with AHI ≥ 15 (or AHI 5-14 with documented comorbidities like hypertension or stroke). Initial 12-week trial period with adherence monitoring (≥ 4 hours/night on 70% of nights).',
    memberResponsibility: 0.00,
    actionTaken: 'Prior Authorization workflow initiated in DaVinci PAS engine. Provider documentation linked to Case #00142981.',
    csrGuidance: 'Inform member: "CPAP equipment is 100% covered under your Really Great Health Insurance Dual plan once prior authorization is complete. Apria Healthcare will coordinate direct in-home delivery and setup."'
  },
  {
    topic: 'Physical Therapy & Outpatient Rehabilitation Benefits',
    keywords: ['therapy', 'physical therapy', 'pt', 'rehab', '97110', '97112', 'restorative'],
    sampleMatch: 'physical therapy',
    cptCodes: ['97110 - Therapeutic exercises', '97112 - Neuromuscular reeducation', '97161 - PT evaluation low complexity'],
    hcpcsCodes: [],
    icd10Codes: ['M54.5 - Low back pain', 'M25.561 - Pain in right knee'],
    determination: 'Covered under RGHI Medicare Advantage Plan. Therapy cap does not apply to Medicare Advantage in 2026 under the KX modifier rules when medically necessary. In-network therapy has $0 copayment for Dual Complete members; secondary Medicaid absorbs standard coinsurance.',
    memberResponsibility: 0.00,
    actionTaken: 'Benefit accumulator checked. Member has utilized 6 of 30 authorized restorative physical therapy visits this plan year.',
    csrGuidance: 'Inform member: "Outpatient physical therapy with an in-network therapist is fully covered under your plan with $0 out-of-pocket costs."'
  },
  {
    topic: 'Prescription Drug Coverage & Low Income Subsidy (LIS / Extra Help)',
    keywords: ['part d', 'prescription', 'drugs', 'rx', 'medication', 'formulary', 'pharmacy', 'tier', 'lis', 'extra help'],
    sampleMatch: 'part d',
    cptCodes: [],
    hcpcsCodes: ['J-codes (Physician-administered drugs)'],
    icd10Codes: ['Z51.81 - Encounter for therapeutic drug level monitoring'],
    determination: 'Covered under Really Great Health Insurance Part D Rx Rider. Member has Full Low Income Subsidy (LIS Category 1). Generic medications (Tier 1 & Tier 2) have a $0.00 to $1.55 maximum copay; preferred brand medications (Tier 3) have a $4.60 maximum copay in 2026, with Medicare Catastrophic coverage paying 100% after member reaches out-of-pocket cap.',
    memberResponsibility: 0.00,
    actionTaken: 'Real-time pharmacy benefit check executed through NCPDP D.0 portal.',
    csrGuidance: 'Advise member: "Your medications are covered under our Dual Complete formulary with $0 to minimal statutory copays. If your pharmacy is charging full price, ask them to verify your RGHI RxBIN 610014 and PCN RGHI01."'
  },
  {
    topic: 'Inpatient Hospital Stay & Part A Benefit Periods',
    keywords: ['inpatient', 'hospital', 'part a', 'admission', 'surgery', 'overnight', 'room and board', 'bed'],
    sampleMatch: 'inpatient',
    cptCodes: ['99222 - Initial hospital inpatient care moderate complexity'],
    hcpcsCodes: [],
    icd10Codes: ['Z51.89 - Other specified aftercare'],
    determination: 'Covered under Part A with Medicare Advantage enhancements. Traditional Medicare Part A deductible is $1,676 per benefit period, but under Really Great Health Insurance Dual Complete, hospital inpatient cost-sharing is covered 100% through plan benefits and State Medicaid dual coordination.',
    memberResponsibility: 0.00,
    actionTaken: 'Inpatient admission notification logged. Utilization Management nurse assigned for discharge planning.',
    csrGuidance: 'Inform member or family: "Inpatient hospital stays at in-network facilities are covered at 100% with $0 copay for days 1 through 90 under your Dual Complete plan."'
  },
  {
    topic: 'Prior Authorization Appeal & Dispute Procedures',
    keywords: ['appeal', 'dispute', 'denial', 'claim denied', 'grievance', 'organization determination', 'reconsideration'],
    sampleMatch: 'appeal',
    cptCodes: [],
    hcpcsCodes: [],
    icd10Codes: ['Z71.89 - Other specified counseling'],
    determination: 'CMS Part C Appeals process applies. Members and CSRs have 60 calendar days from the date of the written Denial Notice (CMS-10003) to file a Standard (30-day) or Expedited (72-hour) Reconsideration (Level 1 Appeal). If upheld, RGHI automatically forwards the file to the CMS Independent Review Entity (IRE / MAXIMUS).',
    memberResponsibility: 0.00,
    actionTaken: 'Appeals case packet auto-generated. Standard Appeal form prepopulated for member signature.',
    csrGuidance: 'Inform member: "You have the right to appeal any claim denial or prior authorization decision within 60 days. We can file an expedited appeal on your behalf right now if your doctor indicates delay would harm your health."'
  }
];

function answerBillingQuery(queryText, memberContext = {}) {
  const normalized = queryText.toLowerCase();

  // Find matching knowledge base entry based on keywords
  let bestMatch = null;
  let maxScore = 0;

  for (const entry of KNOWLEDGE_BASE) {
    let score = 0;
    for (const kw of entry.keywords) {
      if (normalized.includes(kw)) {
        score += 1;
      }
    }
    if (score > maxScore) {
      maxScore = score;
      bestMatch = entry;
    }
  }

  // If no specific match, use a rich default Medicare/Medicaid billing orchestration response
  if (!bestMatch || maxScore === 0) {
    bestMatch = {
      topic: 'General Medicare & Medicaid Billing Orchestration',
      cptCodes: ['99213 - Outpatient Medical Visit'],
      hcpcsCodes: [],
      icd10Codes: ['Z00.00 - General adult medical examination'],
      determination: `Covered under Really Great Health Insurance Medicare Advantage Dual Complete Plan. As a dual-eligible plan beneficiary (Medicare Part A/B + Medicaid), claims are first adjudicated against Medicare primary fee schedules, with remaining patient liability automatically submitted to State Medicaid for secondary crossover adjudication.`,
      memberResponsibility: 0.00,
      actionTaken: 'Query processed by Billing Orchestrator. Claims history cross-referenced with CMS Blue Button 2.0 and State Medicaid EDI gateway.',
      csrGuidance: 'Inform member that Really Great Health Insurance coordinates both Medicare and Medicaid benefits so that dual-eligible members typically experience $0 out-of-pocket costs for covered medical services.'
    };
  }

  const responseText = `### Really Great Health Insurance Billing Determination

**Topic:** ${bestMatch.topic}
**Beneficiary:** ${memberContext.name || 'Eleanor Vance'} (MBI: ${memberContext.mbi || '1EG4-TE5-MK72'})
**Plan:** ${memberContext.planName || 'Really Great Health Insurance Dual Complete (HMO D-SNP)'}

#### Clinical & Regulatory Finding
${bestMatch.determination}

#### Billing & Coding Standards
- **Applicable CPT Codes:** ${bestMatch.cptCodes.length ? bestMatch.cptCodes.join(', ') : 'Standard E/M or procedure-dependent'}
- **Applicable HCPCS Codes:** ${bestMatch.hcpcsCodes.length ? bestMatch.hcpcsCodes.join(', ') : 'None / Not DME'}
- **Relevant ICD-10 Diagnosis:** ${bestMatch.icd10Codes.join(', ')}

#### Financial & Cost-Sharing Summary
- **Plan Payment Adjudication:** Primary Medicare Advantage fee schedule applied.
- **Secondary Medicaid Crossover:** 100% of remaining cost-sharing covered via State EDI 835.
- **Member Responsibility:** **$${bestMatch.memberResponsibility.toFixed(2)}** (Zero out-of-pocket).

#### Action Taken by Billing Orchestrator
${bestMatch.actionTaken}

#### Recommended CSR Script & Next Steps
${bestMatch.csrGuidance}
`;

  const structuredOutcome = {
    caseNumber: memberContext.activeCaseId || '00142981',
    memberId: memberContext.id || 'RGHI-MED-98421',
    memberName: memberContext.name || 'Eleanor Vance',
    inquiryTopic: bestMatch.topic,
    querySummary: queryText,
    agentDetermination: bestMatch.determination,
    billingCodes: {
      cpt: bestMatch.cptCodes,
      hcpcs: bestMatch.hcpcsCodes,
      icd10: bestMatch.icd10Codes
    },
    financialImpact: {
      billedAmount: 250.00,
      medicarePaid: 200.00,
      secondaryMedicaidCrossover: 50.00,
      memberResponsibility: bestMatch.memberResponsibility
    },
    actionTaken: bestMatch.actionTaken,
    csrGuidance: bestMatch.csrGuidance
  };

  return {
    markdownText: responseText,
    structuredOutcome,
    topic: bestMatch.topic
  };
}

module.exports = {
  KNOWLEDGE_BASE,
  answerBillingQuery
};
