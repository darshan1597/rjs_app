import { AppError } from '../../common/errors/app-error.js';
import { customerLimiter } from '../../common/middleware/rate-limits.js';
import { verifyCustomerAccessToken } from '../../common/security/tokens.js';
import { Customer, CustomerSession } from './customer.model.js';

async function authenticateCustomer(req, res, next) {
  try {
    const authorization = req.get('authorization') || '';
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : null;
    if (!token) throw new AppError(401, 'AUTH_REQUIRED', 'Customer authentication is required');

    const payload = verifyCustomerAccessToken(token);
    if (payload.tokenType !== 'access' || payload.actorType !== 'customer') {
      throw new Error('Invalid token type');
    }

    const session = await CustomerSession.findById(payload.sid).select('revokedAt expiresAt customerId');
    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      throw new AppError(401, 'SESSION_UNAVAILABLE', 'The customer session is no longer active');
    }

    const customer = await Customer.findById(payload.sub);
    if (!customer || customer.status !== 'ACTIVE' || !customer.profileCompleted) {
      throw new AppError(401, 'ACCOUNT_UNAVAILABLE', 'The customer account is unavailable');
    }

    req.customer = customer;
    req.customerSessionId = session.id;
    return customerLimiter(req, res, next);
  } catch (error) {
    if (error instanceof AppError) return next(error);
    return next(new AppError(401, 'INVALID_TOKEN', 'The access token is invalid or expired'));
  }
}

export { authenticateCustomer };
