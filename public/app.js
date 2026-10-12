// Really Great Health Insurance - Orchestrator Front-End Logic

document.addEventListener('DOMContentLoaded', () => {
  // Global State
  const state = {
    activeTab: 'tab-operations',
    integrations: [],
    endpoints: [],
    selectedEndpoint: null,
    outcomes: [],
    member: null,
    crmConnection: null,
    auditLog: []
  };

  // DOM Elements
  const tabs = document.querySelectorAll('.nav-tab');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const toast = document.getElementById('toastNotification');

  // Initialize
  initTabs();
  loadIntegrations();
  loadEndpoints();
  loadCrmData();
  initChat();
  initModal();

  // ==============================================================
  // Toast Helper
  // ==============================================================
  function showToast(message, duration = 3500) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, duration);
  }

  // ==============================================================
  // Tab Navigation
  // ==============================================================
  function initTabs() {
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetTab = tab.getAttribute('data-tab');
        switchTab(targetTab);
      });
    });
  }

  function switchTab(tabId) {
    state.activeTab = tabId;
    tabs.forEach(t => {
      t.classList.toggle('active', t.getAttribute('data-tab') === tabId);
    });
    tabPanes.forEach(pane => {
      pane.classList.toggle('active', pane.id === tabId);
    });
  }

  // ==============================================================
  // Operations Manager: Integrations
  // ==============================================================
  async function loadIntegrations() {
    try {
      const res = await fetch('/api/integrations');
      const data = await res.json();
      state.integrations = data.integrations || [];
      renderIntegrations();
      updateIntegrationsMetrics();

      const auditRes = await fetch('/api/integrations/audit');
      const auditData = await auditRes.json();
      state.auditLog = auditData.auditLog || [];
      renderAuditLog();
    } catch (err) {
      console.error('Failed to load integrations:', err);
      showToast('Error connecting to orchestrator backend');
    }
  }

  function updateIntegrationsMetrics() {
    const totalEl = document.getElementById('metricTotal');
    const badgeEl = document.getElementById('integrationsCountBadge');
    const auditCountEl = document.getElementById('metricAuditCount');

    if (totalEl) totalEl.textContent = state.integrations.length;
    if (badgeEl) badgeEl.textContent = state.integrations.length;
    if (auditCountEl) auditCountEl.textContent = state.auditLog.length;
  }

  function renderIntegrations() {
    const container = document.getElementById('integrationsList');
    if (!container) return;

    container.innerHTML = state.integrations.map(item => `
      <div class="integration-card" id="card-${item.id}">
        <div>
          <div class="integration-card-header">
            <div>
              <div class="friendly-name-display">
                <span>${escapeHtml(item.friendlyName)}</span>
              </div>
              <div class="system-name-sub">System ID: ${escapeHtml(item.systemName)}</div>
            </div>
            <span class="status-badge badge-${item.status.toLowerCase()}">
              <span class="status-dot"></span>
              ${escapeHtml(item.status)}
            </span>
          </div>

          <div class="integration-meta-grid">
            <div>
              <span class="meta-label">Category:</span>
              <div class="meta-val">${escapeHtml(item.category)}</div>
            </div>
            <div>
              <span class="meta-label">Protocol / Type:</span>
              <div class="meta-val">${escapeHtml(item.type)}</div>
            </div>
            <div>
              <span class="meta-label">Roundtrip Latency:</span>
              <div class="meta-val" id="latency-${item.id}">${item.latencyMs}ms</div>
            </div>
            <div>
              <span class="meta-label">Managed By:</span>
              <div class="meta-val">${escapeHtml(item.managedBy || 'Operations')}</div>
            </div>
          </div>

          <p class="integration-desc">${escapeHtml(item.description)}</p>
        </div>

        <div class="integration-card-actions">
          <button class="btn btn-secondary btn-sm btn-edit-friendly" data-id="${item.id}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
            Edit Friendly Name
          </button>
          <button class="btn btn-secondary btn-sm btn-ping-integration" data-id="${item.id}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
            Ping Health
          </button>
        </div>
      </div>
    `).join('');

    // Attach Event Listeners
    document.querySelectorAll('.btn-edit-friendly').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        openEditModal(id);
      });
    });

    document.querySelectorAll('.btn-ping-integration').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        btn.disabled = true;
        btn.textContent = 'Pinging...';
        try {
          const res = await fetch(`/api/integrations/${id}/test`, { method: 'POST' });
          const data = await res.json();
          if (data.success) {
            const latencyEl = document.getElementById(`latency-${id}`);
            if (latencyEl) latencyEl.textContent = `${data.result.latencyMs}ms`;
            showToast(`Health check passed for "${data.result.friendlyName}" (${data.result.latencyMs}ms)`);
          }
        } catch (e) {
          showToast(`Ping failed for integration ${id}`);
        } finally {
          btn.disabled = false;
          btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg> Ping Health`;
        }
      });
    });
  }

  function renderAuditLog() {
    const container = document.getElementById('auditLogList');
    if (!container) return;

    if (!state.auditLog.length) {
      container.innerHTML = `<div class="empty-state">No audit events recorded yet.</div>`;
      return;
    }

    container.innerHTML = state.auditLog.map(entry => `
      <div class="audit-entry">
        <div>
          <strong>${escapeHtml(entry.details)}</strong>
          <div class="audit-meta">User: ${escapeHtml(entry.user)} | Action: ${escapeHtml(entry.action)}</div>
        </div>
        <div class="audit-meta">${new Date(entry.timestamp).toLocaleTimeString()}</div>
      </div>
    `).join('');
  }

  document.getElementById('btnRefreshIntegrations')?.addEventListener('click', () => {
    loadIntegrations();
    showToast('Refreshed operational integrations status');
  });

  // Modal Editing
  function initModal() {
    const modal = document.getElementById('editModalOverlay');
    const closeBtn = document.getElementById('btnCloseModal');
    const cancelBtn = document.getElementById('btnCancelEdit');
    const form = document.getElementById('editFriendlyNameForm');

    const closeModal = () => modal.classList.remove('open');
    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('editIntegrationId').value;
      const friendlyName = document.getElementById('editFriendlyNameInput').value;
      const status = document.getElementById('editStatusSelect').value;

      try {
        const res = await fetch(`/api/integrations/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ friendlyName, status })
        });
        const data = await res.json();
        if (data.success) {
          showToast(`Saved friendly name: "${friendlyName}"`);
          closeModal();
          loadIntegrations();
        } else {
          showToast(data.error || 'Failed to update integration');
        }
      } catch (err) {
        showToast('Error saving integration friendly name');
      }
    });
  }

  function openEditModal(id) {
    const item = state.integrations.find(i => i.id === id);
    if (!item) return;

    document.getElementById('editIntegrationId').value = item.id;
    document.getElementById('editSystemName').value = item.systemName;
    document.getElementById('editFriendlyNameInput').value = item.friendlyName;
    document.getElementById('editStatusSelect').value = item.status;
    document.getElementById('modalTitle').textContent = `Edit Friendly Name (${item.friendlyName})`;

    document.getElementById('editModalOverlay').classList.add('open');
  }

  // ==============================================================
  // Developer Portal: API Directory
  // ==============================================================
  async function loadEndpoints() {
    try {
      const res = await fetch('/api/developer/endpoints');
      const data = await res.json();
      state.endpoints = data.endpoints || [];
      renderEndpointsSidebar();

      const badge = document.getElementById('apiCountBadge');
      if (badge) badge.textContent = state.endpoints.length;

      if (state.endpoints.length > 0) {
        selectEndpoint(state.endpoints[0].id);
      }
    } catch (err) {
      console.error('Failed to load API catalog:', err);
    }
  }

  function renderEndpointsSidebar(filter = '') {
    const sidebar = document.getElementById('endpointsSidebar');
    if (!sidebar) return;

    const filtered = state.endpoints.filter(ep => {
      if (!filter) return true;
      const q = filter.toLowerCase();
      return ep.path.toLowerCase().includes(q) ||
        ep.summary.toLowerCase().includes(q) ||
        ep.category.toLowerCase().includes(q) ||
        ep.method.toLowerCase().includes(q);
    });

    // Group by category
    const categories = {};
    filtered.forEach(ep => {
      if (!categories[ep.category]) categories[ep.category] = [];
      categories[ep.category].push(ep);
    });

    let html = '';
    for (const [cat, eps] of Object.entries(categories)) {
      html += `<div class="category-header">${escapeHtml(cat)}</div>`;
      eps.forEach(ep => {
        const isSelected = state.selectedEndpoint?.id === ep.id;
        html += `
          <div class="endpoint-list-item ${isSelected ? 'selected' : ''}" data-id="${ep.id}">
            <span class="method-tag method-${ep.method}">${ep.method}</span>
            <span class="endpoint-path">${escapeHtml(ep.path)}</span>
          </div>
        `;
      });
    }

    if (!html) {
      html = `<div style="padding: 1rem; color: #64748b; font-size: 0.85rem;">No endpoints match search.</div>`;
    }

    sidebar.innerHTML = html;

    sidebar.querySelectorAll('.endpoint-list-item').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.getAttribute('data-id');
        selectEndpoint(id);
      });
    });
  }

  document.getElementById('apiSearchInput')?.addEventListener('input', (e) => {
    renderEndpointsSidebar(e.target.value);
  });

  function selectEndpoint(id) {
    const ep = state.endpoints.find(e => e.id === id);
    if (!ep) return;
    state.selectedEndpoint = ep;

    // Update active highlight in sidebar
    document.querySelectorAll('.endpoint-list-item').forEach(el => {
      el.classList.toggle('selected', el.getAttribute('data-id') === id);
    });

    renderEndpointDetails(ep);
  }

  function renderEndpointDetails(ep) {
    const panel = document.getElementById('endpointDetailPanel');
    if (!panel) return;

    panel.innerHTML = `
      <div class="endpoint-title-row">
        <span class="method-tag method-${ep.method}">${ep.method}</span>
        <span class="endpoint-full-path">${escapeHtml(ep.path)}</span>
      </div>
      <h3 style="margin-bottom: 0.5rem;">${escapeHtml(ep.summary)}</h3>
      <p style="color: #475569; font-size: 0.9rem; margin-bottom: 1rem;">${escapeHtml(ep.description)}</p>

      <div style="margin-bottom: 1rem;">
        <h4 style="font-size: 0.85rem; text-transform: uppercase; color: #64748b; margin-bottom: 0.35rem;">cURL Request</h4>
        <div class="code-box">
          <button class="btn-copy" id="btnCopyCurl">Copy</button>
          <code>${escapeHtml(ep.curlSnippet)}</code>
        </div>
      </div>

      ${ep.requestBody ? `
        <div style="margin-bottom: 1rem;">
          <h4 style="font-size: 0.85rem; text-transform: uppercase; color: #64748b; margin-bottom: 0.35rem;">Sample Request Body (JSON)</h4>
          <div class="code-box">
            <code>${escapeHtml(JSON.stringify(ep.requestBody, null, 2))}</code>
          </div>
        </div>
      ` : ''}

      <div style="margin-bottom: 1rem;">
        <h4 style="font-size: 0.85rem; text-transform: uppercase; color: #64748b; margin-bottom: 0.35rem;">Sample Response (JSON)</h4>
        <div class="code-box">
          <code>${escapeHtml(JSON.stringify(ep.responseExample, null, 2))}</code>
        </div>
      </div>

      <div class="live-tester-section">
        <h4 style="font-size: 0.9rem; font-weight: 700; margin-bottom: 0.5rem;">Interactive API Runner</h4>
        <button class="btn btn-primary btn-sm" id="btnRunEndpointTest">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          Execute Live Request
        </button>
        <div id="liveResponseContainer" class="live-response-output" style="display: none;"></div>
      </div>
    `;

    document.getElementById('btnCopyCurl')?.addEventListener('click', () => {
      navigator.clipboard.writeText(ep.curlSnippet);
      showToast('cURL command copied to clipboard!');
    });

    document.getElementById('btnRunEndpointTest')?.addEventListener('click', async () => {
      const outputContainer = document.getElementById('liveResponseContainer');
      outputContainer.style.display = 'block';
      outputContainer.innerHTML = '<div style="color: #64748b; font-size: 0.85rem;">Sending request...</div>';

      const startTime = performance.now();
      try {
        let requestUrl = ep.path.replace(':id', 'salesforce-crm');
        const options = {
          method: ep.method,
          headers: { 'Content-Type': 'application/json' }
        };

        if (ep.method !== 'GET' && ep.requestBody) {
          options.body = JSON.stringify(ep.requestBody);
        }

        const res = await fetch(requestUrl, options);
        const duration = Math.round(performance.now() - startTime);
        const json = await res.json();

        outputContainer.innerHTML = `
          <div style="display: flex; gap: 0.75rem; align-items: center; margin-bottom: 0.35rem;">
            <span class="status-badge badge-active">HTTP ${res.status} ${res.statusText}</span>
            <span style="font-size: 0.75rem; color: #64748b;">Execution: ${duration}ms</span>
          </div>
          <div class="code-box">
            <code>${escapeHtml(JSON.stringify(json, null, 2))}</code>
          </div>
        `;
      } catch (err) {
        outputContainer.innerHTML = `
          <div class="code-box" style="border-left: 3px solid #ef4444;">
            <span style="color: #f87171;">Request failed: ${escapeHtml(err.message)}</span>
          </div>
        `;
      }
    });
  }

  // ==============================================================
  // Salesforce CRM & CSR View
  // ==============================================================
  async function loadCrmData() {
    try {
      const [statusRes, memberRes, outcomesRes] = await Promise.all([
        fetch('/api/crm/status'),
        fetch('/api/crm/member'),
        fetch('/api/crm/outcomes')
      ]);

      state.crmConnection = await statusRes.json();
      state.member = await memberRes.json();
      const outcomesData = await outcomesRes.json();
      state.outcomes = outcomesData.outcomes || [];

      renderCrmView();
    } catch (err) {
      console.error('Failed to load CRM data:', err);
    }
  }

  function renderCrmView() {
    // Render Member 360
    if (state.member) {
      document.getElementById('memberName').textContent = state.member.name;
      document.getElementById('memberId').textContent = state.member.id;
      document.getElementById('memberMbi').textContent = state.member.mbi;
      document.getElementById('memberMedicaidId').textContent = state.member.medicaidId;
      document.getElementById('memberPlanName').textContent = state.member.planName;
      document.getElementById('memberCaseId').textContent = `#${state.member.activeCaseId} - Billing & Claims Inquiries`;
    }

    // Render outcomes badge
    const badge = document.getElementById('outcomesCountBadge');
    if (badge) badge.textContent = state.outcomes.length;

    // Render outcomes list
    const container = document.getElementById('csrOutcomesList');
    if (!container) return;

    if (!state.outcomes.length) {
      container.innerHTML = `<div class="empty-state">No agent outcomes have been synced yet. Ask a question in the Chat Console to generate an outcome!</div>`;
      return;
    }

    container.innerHTML = state.outcomes.map(item => `
      <div class="outcome-card">
        <div class="outcome-card-header">
          <div class="outcome-case-badge">Salesforce Case #${escapeHtml(item.caseNumber || '00142981')}</div>
          <span style="font-size: 0.775rem; color: #64748b;">${new Date(item.timestamp).toLocaleString()}</span>
        </div>

        <div class="outcome-title">${escapeHtml(item.inquiryTopic)}</div>

        <div class="outcome-query-box">
          <strong>Inquiry Question:</strong> "${escapeHtml(item.querySummary)}"
        </div>

        <div class="outcome-determination">
          <strong>Agent Determination:</strong> ${escapeHtml(item.agentDetermination)}
        </div>

        ${renderCodesRow(item.billingCodes)}

        <div class="outcome-financial-box">
          <div>
            <span>Plan Cost-Sharing: <strong>Full Dual Coverage</strong></span>
          </div>
          <div>
            <span>Member Responsibility: <strong>$${(item.financialImpact?.memberResponsibility || 0).toFixed(2)}</strong></span>
          </div>
        </div>

        <div class="outcome-guidance-box">
          <strong>CSR Script / Next Step:</strong> ${escapeHtml(item.csrGuidance)}
        </div>

        <div style="margin-top: 0.75rem; display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: #64748b;">
          <span>Status: <strong style="color: #0176d3;">${escapeHtml(item.crmSyncStatus || 'Synced to Salesforce Health Cloud')}</strong></span>
          <span class="live-sync-indicator"><span class="status-dot"></span> Synced</span>
        </div>
      </div>
    `).join('');
  }

  function renderCodesRow(codes) {
    if (!codes) return '';
    const items = [];
    if (codes.cpt) codes.cpt.forEach(c => items.push(`<span class="code-chip">CPT: ${escapeHtml(c)}</span>`));
    if (codes.hcpcs) codes.hcpcs.forEach(h => items.push(`<span class="code-chip">HCPCS: ${escapeHtml(h)}</span>`));
    if (codes.icd10) codes.icd10.forEach(i => items.push(`<span class="code-chip">ICD-10: ${escapeHtml(i)}</span>`));

    if (!items.length) return '';
    return `<div class="outcome-codes-row">${items.join('')}</div>`;
  }

  document.getElementById('btnTestCrmSync')?.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/crm/test-sync', { method: 'POST' });
      const data = await res.json();
      showToast(data.message || 'Salesforce Health Cloud connection verified!');
    } catch (err) {
      showToast('CRM sync verification failed');
    }
  });

  // ==============================================================
  // Chat Console (AI Billing Concierge)
  // ==============================================================
  function initChat() {
    const chatForm = document.getElementById('chatForm');
    const chatInput = document.getElementById('chatInput');
    const autoSyncToggle = document.getElementById('autoSyncCrmToggle');
    const chipButtons = document.querySelectorAll('.chip-btn');

    chipButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const query = btn.getAttribute('data-query');
        if (query) {
          chatInput.value = query;
          chatForm.dispatchEvent(new Event('submit'));
        }
      });
    });

    chatForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = chatInput.value.trim();
      if (!text) return;

      appendChatMessage('user', text);
      chatInput.value = '';

      const autoSync = autoSyncToggle ? autoSyncToggle.checked : true;

      // Add temporary typing indicator
      const typingId = appendTypingIndicator();

      try {
        const res = await fetch('/api/orchestrator/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: text, autoSyncCrm: autoSync })
        });
        const data = await res.json();

        removeTypingIndicator(typingId);

        appendChatMessage('agent', data.markdownText, data.structuredOutcome);

        if (data.syncedToCrm) {
          showToast('Outcome auto-synced to Salesforce Health Cloud!');
          loadCrmData();
        }
      } catch (err) {
        removeTypingIndicator(typingId);
        appendChatMessage('agent', 'Error connecting to Billing Orchestrator. Please try again.');
      }
    });
  }

  function appendChatMessage(sender, content, outcome) {
    const container = document.getElementById('chatMessages');
    if (!container) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message-bubble ${sender}-message`;

    let html = `
      <div class="message-avatar">${sender === 'user' ? 'CSR' : 'AI'}</div>
      <div class="message-content">
        ${formatMarkdown(content)}
        ${outcome ? `
          <div style="margin-top: 0.75rem; padding: 0.65rem; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.8rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
              <strong style="color: #0176d3;">Salesforce Outcome Recorded</strong>
              <span class="status-badge badge-active" style="font-size: 0.7rem;">$0.00 Member Resp.</span>
            </div>
            <div style="color: #475569;">Case #00142981 updated with CPT/HCPCS codes and QMB dual protections.</div>
          </div>
        ` : ''}
      </div>
    `;

    messageDiv.innerHTML = html;
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
  }

  function appendTypingIndicator() {
    const container = document.getElementById('chatMessages');
    const id = `typing-${Date.now()}`;
    const div = document.createElement('div');
    div.id = id;
    div.className = 'message-bubble agent-message';
    div.innerHTML = `
      <div class="message-avatar">AI</div>
      <div class="message-content">
        <span style="color: #64748b; font-style: italic;">Adjudicating Medicare & Medicaid rules...</span>
      </div>
    `;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return id;
  }

  function removeTypingIndicator(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  function formatMarkdown(text) {
    if (!text) return '';
    let escaped = escapeHtml(text);
    // Simple markdown formatters for headers, bold, bullets
    escaped = escaped.replace(/### (.*$)/gim, '<h3 style="font-size: 1rem; color: #0284c7; margin-bottom: 0.35rem;">$1</h3>');
    escaped = escaped.replace(/#### (.*$)/gim, '<h4 style="font-size: 0.85rem; color: #1e293b; margin-top: 0.45rem; margin-bottom: 0.2rem;">$1</h4>');
    escaped = escaped.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
    escaped = escaped.replace(/^\- (.*$)/gim, '<li>$1</li>');
    escaped = escaped.replace(/(?:<li>.*?<\/li>\s*)+/gim, (match) => {
      return `<ul style="margin: 0.35rem 0 0.5rem 1rem;">${match}</ul>`;
    });
    escaped = escaped.replace(/\n\n/g, '<br/><br/>');
    return escaped;
  }

  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
