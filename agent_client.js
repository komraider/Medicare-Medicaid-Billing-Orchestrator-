#!/usr/bin/env node
/**
 * Anthropic Managed Agent Client for Really Great Health Insurance Billing Orchestrator.
 *
 * Talks to Anthropic agent: agent_01MPUV932QnhfsSrA51v7VY3
 * Environment ID: env_01VZxGuSVdfUjmYDfCS3Y8S8
 *
 * Workflow:
 *  1. Create a session with client.beta.sessions.create (environment_id env_01VZxGuSVdfUjmYDfCS3Y8S8)
 *  2. Open client.beta.sessions.events.stream
 *  3. Send a user.message event via client.beta.sessions.events.send
 *  4. Print agent.message text as it streams
 *  5. Handle session.status_idle to finish and errors to exit cleanly
 */

const crypto = require('crypto');
const Anthropic = require('@anthropic-ai/sdk');
const { answerBillingQuery } = require('./src/billing-engine');

const DEFAULT_AGENT_ID = 'agent_01MPUV932QnhfsSrA51v7VY3';
const DEFAULT_ENVIRONMENT_ID = 'env_01VZxGuSVdfUjmYDfCS3Y8S8';

/**
 * Creates and runs a managed agent session.
 *
 * @param {string} userMessage - Prompt / inquiry to send to the billing agent
 * @param {object} [options]
 * @param {string} [options.agentId]
 * @param {string} [options.environmentId]
 * @param {boolean} [options.mock] - Force mock simulation mode
 * @param {function} [options.onText] - Callback for streaming text chunks
 * @param {function} [options.onIdle] - Callback when session.status_idle received
 * @param {function} [options.onError] - Callback when session error occurs
 * @returns {Promise<{ sessionId: string, agentId: string, fullText: string, status: string }>}
 */
async function runManagedAgentSession(userMessage, options = {}) {
  const agentId = options.agentId || process.env.ANTHROPIC_AGENT_ID || DEFAULT_AGENT_ID;
  const environmentId = options.environmentId || process.env.ANTHROPIC_ENVIRONMENT_ID || DEFAULT_ENVIRONMENT_ID;
  const hasApiKey = Boolean(process.env.ANTHROPIC_API_KEY);
  const useMock = options.mock || !hasApiKey;

  let fullText = '';

  const emitText = (textChunk) => {
    fullText += textChunk;
    if (typeof options.onText === 'function') {
      options.onText(textChunk);
    } else if (!options.silent) {
      process.stdout.write(textChunk);
    }
  };

  if (!useMock) {
    try {
      const client = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });

      // 1. Create a session with client.beta.sessions.create
      const session = await client.beta.sessions.create({
        agent: agentId,
        environment_id: environmentId
      });

      const sessionId = session.id;

      // 2. Open client.beta.sessions.events.stream
      const stream = await client.beta.sessions.events.stream(sessionId);

      // 3. Send a user.message event via client.beta.sessions.events.send
      await client.beta.sessions.events.send(sessionId, {
        events: [
          {
            type: 'user.message',
            content: [
              {
                type: 'text',
                text: userMessage
              }
            ]
          }
        ]
      });

      // 4. Print agent.message text as it streams & handle status_idle / errors
      for await (const event of stream) {
        if (event.type === 'agent.message') {
          for (const block of event.content || []) {
            if (block.type === 'text') {
              emitText(block.text);
            }
          }
        } else if (event.type === 'session.status_idle') {
          // 5. Handle session.status_idle to finish
          if (typeof options.onIdle === 'function') {
            options.onIdle(event);
          }
          break;
        } else if (event.type === 'session.error') {
          const err = new Error(`Session error: ${event.error?.message || JSON.stringify(event)}`);
          if (typeof options.onError === 'function') {
            options.onError(err);
            return { sessionId, agentId, fullText, status: 'error', error: err };
          }
          throw err;
        }
      }

      return {
        sessionId,
        agentId,
        environmentId,
        fullText,
        status: 'session.status_idle'
      };
    } catch (err) {
      if (typeof options.onError === 'function') {
        options.onError(err);
        return { sessionId: 'unknown', agentId, fullText, status: 'error', error: err };
      }
      console.error('\n[Managed Agent Error]:', err.message);
      throw err;
    }
  } else {
    // High-fidelity sandbox simulation when ANTHROPIC_API_KEY is not configured
    const simulatedSessionId = `sesn_01${crypto.randomBytes(6).toString('hex')}`;
    const result = answerBillingQuery(userMessage, {
      name: 'Eleanor Vance',
      mbi: '1EG4-TE5-MK72',
      planName: 'Really Great Health Insurance Dual Complete (HMO D-SNP)',
      activeCaseId: '00142981'
    });

    const chunks = result.markdownText.split(' ');
    const tickMs = options.fast ? 0 : (options.tickMs !== undefined ? options.tickMs : 2);
    for (let i = 0; i < chunks.length; i++) {
      const piece = (i === 0 ? '' : ' ') + chunks[i];
      emitText(piece);
      if (tickMs > 0) {
        await new Promise(resolve => setTimeout(resolve, tickMs));
      }
    }

    if (typeof options.onIdle === 'function') {
      options.onIdle({ type: 'session.status_idle', id: simulatedSessionId });
    }

    return {
      sessionId: simulatedSessionId,
      agentId,
      environmentId,
      fullText,
      status: 'session.status_idle',
      structuredOutcome: result.structuredOutcome
    };
  }
}

// CLI entry point
if (require.main === module) {
  const promptArg = process.argv.slice(2).join(' ') ||
    'Verify QMB balance billing rules and secondary Medicaid crossover for a specialist consultation.';

  console.log(`[RGHI Orchestrator] Initializing session with agent: ${DEFAULT_AGENT_ID}`);
  console.log(`[RGHI Orchestrator] Environment: ${DEFAULT_ENVIRONMENT_ID}`);
  console.log(`[RGHI Orchestrator] User Prompt: "${promptArg}"\n---`);

  runManagedAgentSession(promptArg)
    .then((result) => {
      console.log('\n---');
      console.log(`[RGHI Orchestrator] Session ${result.sessionId} finished with status: ${result.status}`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('\n[RGHI Orchestrator] Fatal error during session:', err.message);
      process.exit(1);
    });
}

module.exports = {
  DEFAULT_AGENT_ID,
  DEFAULT_ENVIRONMENT_ID,
  runManagedAgentSession
};
