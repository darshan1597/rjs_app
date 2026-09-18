import { performance } from 'node:perf_hooks';
import { accountRequestScope, endpointRequestScope } from './rate-limits.js';

export function createRequestMonitoring() {
  const startedAt = new Date();
  const counters = new Map();
  return {
    middleware(req, res, next) {
      const start = performance.now();
      res.once('finish', () => {
        // Fixed scope names prevent unbounded metric cardinality or storing personal data.
        const scope = req.originalUrl.startsWith('/api/v1/payments/razorpay/webhook') ? 'webhook'
          : endpointRequestScope(req.method, req.originalUrl) ?? accountRequestScope(req.method, req.originalUrl);
        const key = `${scope}:${res.statusCode >= 500 ? '5xx' : res.statusCode >= 400 ? '4xx' : 'success'}`;
        const counter = counters.get(key) ?? { scope, outcome: key.split(':')[1], requests: 0, rateLimited: 0, totalLatencyMs: 0, maxLatencyMs: 0 };
        const latency = performance.now() - start;
        counter.requests++;
        counter.rateLimited += res.statusCode === 429 ? 1 : 0;
        counter.totalLatencyMs += latency;
        counter.maxLatencyMs = Math.max(counter.maxLatencyMs, latency);
        counters.set(key, counter);
      });
      next();
    },
    snapshot() {
      return { startedAt, processUptimeSeconds: Math.round(process.uptime()), storage: 'process-memory', counters: [...counters.values()].map(({ totalLatencyMs, ...counter }) => ({ ...counter, averageLatencyMs: Math.round(totalLatencyMs / counter.requests) })) };
    },
  };
}
