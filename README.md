# Medicare-Medicaid-Billing-Orchestrator-
A production-grade front end and orchestration platform for **Really Great Health Insurance** Medicare & Medicaid billing, connecting operations managers, developers, customer service representatives (CSRs), and member support.

## Overview & Key Features

1. **Operations Manager Integrations Hub**
   - Provides operational visibility into all upstream and downstream connections: Salesforce Health Cloud, Anthropic Managed Agent, CMS Blue Button 2.0 FHIR API, State Medicaid EDI 837/835 Gateway, DaVinci PAS Prior Auth Engine, and Core Claims Adjudication.
   - Every integration has a **customizable friendly name** that operations managers can inspect, verify, and update directly in the UI.
   - Real-time health check pings, latency tracking, and operational audit trail.

2. **Developer-Friendly API Directory**
   - Interactive endpoint directory detailing HTTP methods, paths, request headers, JSON parameter schemas, response examples, and copyable cURL commands.
   - Built-in interactive **API runner** allowing developers to test requests live from the browser.

3. **Salesforce / CRM Connection & CSR Outcomes View**
   - Live demo of how the orchestrator integrates with Salesforce Health Cloud and company CRM systems via Platform Events (`Billing_Agent_Outcome__e`).
   - CSR Member 360 view displaying beneficiary demographics, Medicare MBI, Medicaid ID, and QMB dual-eligible balance billing protections.
   - **Real-Time Agent Outcomes for CSRs**: When the AI agent processes an inquiry, structured clinical outcomes (adjudication finding, CPT/HCPCS codes, financial impact, and CSR recommended scripts) are automatically pushed to the CSR's CRM workspace.

4. **Chat Console (AI Billing Concierge)**
   - Conversational assistant for Medicare (Part A, B, C, D) and Medicaid dual-eligibility billing inquiries for Really Great Health Insurance.
   - Instant answers on QMB balance billing, prior authorization for DME (CPAP), physical therapy KX modifier rules, low-income subsidy (LIS) prescription copays, and CMS Part C appeals.
   - Automatically synchronizes outcomes to the CSR CRM view upon completion.

5. **Anthropic Managed Agent Client (`agent_01MPUV932QnhfsSrA51v7VY3`)**
   - Standalone CLI scripts (`agent_client.js` and `agent_client.py`) and backend service utilizing the Anthropic SDK Managed Agents beta API (`client.beta.sessions`).
   - Connects to agent `agent_01MPUV932QnhfsSrA51v7VY3` in environment `env_01VZxGuSVdfUjmYDfCS3Y8S8`.
   - Creates a session via `client.beta.sessions.create`, opens `client.beta.sessions.events.stream`, sends `user.message` events via `client.beta.sessions.events.send`, streams `agent.message` text, and handles `session.status_idle` and errors cleanly.
   - Includes seamless sandbox fallback simulation when running offline or without an API key.

---

## Getting Started

### Prerequisites
- Node.js v18+ (tested on Node v22)
- npm v9+
- (Optional) Python 3.10+ for Python agent client

### Installation
```bash
npm install
```

### Running the Orchestrator Web Application
Start the front end and API server:
```bash
npm start
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

### Running Automated Tests
Run the test suite:
```bash
npm test
```

### Running the Anthropic Managed Agent Client
Execute the standalone agent client CLI:

#### In Node.js:
```bash
npm run agent
# Or with a custom question:
node agent_client.js "Does Really Great Health Insurance cover CPAP machine E0601?"
```

#### In Python:
```bash
python3 agent_client.py "Can a provider balance bill a QMB member?"
```

---

## API Summary

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check endpoint |
| `GET` | `/api/integrations` | List integrations with friendly names & statuses |
| `PUT` | `/api/integrations/:id` | Update integration friendly name or status |
| `POST` | `/api/integrations/:id/test` | Ping integration health and roundtrip latency |
| `GET` | `/api/integrations/audit` | Retrieve operations manager audit log |
| `GET` | `/api/developer/endpoints` | Retrieve developer API directory |
| `GET` | `/api/crm/status` | Check Salesforce / CRM connection status |
| `GET` | `/api/crm/member` | Get active Member 360 profile |
| `GET` | `/api/crm/outcomes` | List agent outcomes synced to CSR workspace |
| `POST` | `/api/crm/outcomes` | Push an agent outcome to Salesforce Health Cloud |
| `POST` | `/api/crm/test-sync` | Verify CRM platform event bus connectivity |
| `POST` | `/api/orchestrator/chat` | Submit billing question and auto-sync outcome to CRM |
| `POST` | `/api/agent/managed-session` | Invoke Anthropic Managed Agent session |
