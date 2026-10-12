const { test, describe } = require('node:test');
const assert = require('node:assert');
const { runManagedAgentSession, DEFAULT_AGENT_ID, DEFAULT_ENVIRONMENT_ID } = require('../agent_client');

describe('Anthropic Managed Agent Client', () => {

  test('runs managed agent session with DEFAULT_AGENT_ID and DEFAULT_ENVIRONMENT_ID', async () => {
    assert.strictEqual(DEFAULT_AGENT_ID, 'agent_01MPUV932QnhfsSrA51v7VY3');
    assert.strictEqual(DEFAULT_ENVIRONMENT_ID, 'env_01VZxGuSVdfUjmYDfCS3Y8S8');

    let streamChunks = [];
    let idleCalled = false;

    const result = await runManagedAgentSession('What is the deductible for Medicare Part B under RGHI?', {
      mock: true,
      silent: true,
      fast: true,
      onText: (chunk) => {
        streamChunks.push(chunk);
      },
      onIdle: (event) => {
        idleCalled = true;
        assert.strictEqual(event.type, 'session.status_idle');
      }
    });

    assert.strictEqual(result.agentId, 'agent_01MPUV932QnhfsSrA51v7VY3');
    assert.strictEqual(result.environmentId, 'env_01VZxGuSVdfUjmYDfCS3Y8S8');
    assert.strictEqual(result.status, 'session.status_idle');
    assert.ok(result.fullText.length > 50);
    assert.ok(streamChunks.length > 0);
    assert.strictEqual(idleCalled, true);
  });

  test('handles errors cleanly when error callback provided', async () => {
    let errorHandled = false;
    const result = await runManagedAgentSession('Test prompt', {
      silent: true,
      fast: true,
      onError: (err) => {
        errorHandled = true;
      }
    });

    // Should complete cleanly or handle error without crashing
    assert.ok(result.status === 'session.status_idle' || errorHandled);
  });
});
