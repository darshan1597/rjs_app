import crypto from 'node:crypto';
import { rateLimit } from 'express-rate-limit';

export function rateLimitResponse(req, res) {
  const seconds = Math.max(1, Math.ceil(((req.rateLimit?.resetTime?.getTime() ?? Date.now() + 60000) - Date.now()) / 1000));
  res.set('Retry-After', String(seconds));
  res.set('X-RateLimit-Scope', req.appRateLimitScope ?? 'ip');
  req.log?.warn({ scope: req.appRateLimitScope ?? 'ip', method: req.method, retryAfterSeconds: seconds }, 'rate_limit_exceeded');
  return res.status(429).json({ success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: `Too many requests. Please try again in ${seconds} seconds.`, details: { retryAfterSeconds: seconds } } });
}

export const createLimiter = (options) => rateLimit({ standardHeaders: 'draft-8', legacyHeaders: false, handler: rateLimitResponse, ...options });

export const ACCOUNT_LIMITS = { tracking: 180, gps: 60, actions: 60, other: 120 };
export const ENDPOINT_LIMITS = { location_search: 30, fare_estimate: 20, create_booking: 5, cancel_booking: 5, driver_offer: 20, payment_creation: 5 };

export function endpointRequestScope(method, originalUrl) {
  const path = originalUrl.split('?')[0].replace(/\/$/, '');
  if (method === 'POST' && /^\/api\/v1\/customer\/wallet\/(topups(?:\/[^/]+\/reconcile)?|rides\/[^/]+\/pay)$/.test(path)) return 'payment_creation';
  if (method === 'GET' && /^\/api\/v1\/customer\/maps\/(autocomplete|places\/[^/]+|reverse-geocode)$/.test(path)) return 'location_search';
  if ((method === 'GET' && path === '/api/v1/customer/bookings/vehicle-catalog') || (method === 'POST' && path === '/api/v1/customer/maps/route')) return 'fare_estimate';
  if (method === 'POST' && /^\/api\/v1\/driver\/trips\/[^/]+\/pickup-preview$/.test(path)) return 'fare_estimate';
  if (method === 'POST' && path === '/api/v1/customer/bookings') return 'create_booking';
  if (method === 'POST' && /^\/api\/v1\/customer\/bookings\/[^/]+\/cancel$/.test(path)) return 'cancel_booking';
  if (method === 'POST' && /^\/api\/v1\/driver\/trips\/[^/]+\/(accept|reject)$/.test(path)) return 'driver_offer';
  if (method === 'POST' && (/^\/api\/v1\/customer\/bookings\/[^/]+\/payment-order$/.test(path) || /^\/api\/v1\/driver\/trips\/[^/]+\/payment-qr$/.test(path))) return 'payment_creation';
  return null;
}

export function accountRequestScope(method, originalUrl) {
  const path = originalUrl.split('?')[0].replace(/\/$/, '');
  if (method === 'PATCH' && path === '/api/v1/driver/trips/location') return 'gps';
  if (method === 'GET' && (/^\/api\/v1\/driver\/trips\/(active|offers|scheduled)$/.test(path)
    || /^\/api\/v1\/customer\/bookings\/[a-f\d]{24}$/i.test(path))) return 'tracking';
  if (method !== 'GET' && (/^\/api\/v1\/driver\/trips(?:\/|$)/.test(path)
    || /^\/api\/v1\/customer\/bookings(?:\/|$)/.test(path))) return 'actions';
  return 'other';
}

// Independent buckets keyed only by server-authenticated account ids.
export function createAccountLimiter(role, limits = ACCOUNT_LIMITS, endpointLimits = ENDPOINT_LIMITS) {
  const buckets = Object.fromEntries(Object.entries(limits).map(([scope, limit]) => [scope,
    createLimiter({ windowMs: 60000, limit, keyGenerator: (req) => `${role}:${req[role].id}` }),
  ]));
  const endpoints = Object.fromEntries(Object.entries(endpointLimits).map(([scope, limit]) => [scope,
    createLimiter({ windowMs: 60000, limit, requestPropertyName: 'endpointRateLimit', handler: (req, res) => {
      req.rateLimit = req.endpointRateLimit;
      req.appRateLimitScope = scope;
      return rateLimitResponse(req, res);
    }, keyGenerator: (req) => `${role}:${req[role].id}` }),
  ]));
  return (req, res, next) => {
    const scope = accountRequestScope(req.method, req.originalUrl);
    req.appRateLimitScope = scope;
    return buckets[scope](req, res, (error) => {
      if (error) return next(error);
      const endpoint = endpointRequestScope(req.method, req.originalUrl);
      return endpoint ? endpoints[endpoint](req, res, next) : next();
    });
  };
}
export const customerLimiter = createAccountLimiter('customer');
export const driverLimiter = createAccountLimiter('driver');

export function createOtpLimiters() {
  const keyGenerator = (req) => crypto.createHash('sha256').update(String(req.validated?.body?.phone ?? req.body?.phone ?? 'invalid').trim()).digest('hex');
  return {
    request: createLimiter({ windowMs: 15 * 60000, limit: 5, keyGenerator }),
    verify: createLimiter({ windowMs: 15 * 60000, limit: 15, keyGenerator }),
    ip: createLimiter({ windowMs: 15 * 60000, limit: 60 }),
  };
}
