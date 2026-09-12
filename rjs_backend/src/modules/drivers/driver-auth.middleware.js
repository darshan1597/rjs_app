import { AppError } from '../../common/errors/app-error.js';
import { verifyDriverAccessToken } from '../../common/security/tokens.js';
import { DriverSession } from './driver-auth.model.js';
import { Driver } from './driver.model.js';

async function authenticateDriver(req, res, next) {
  try {
    const authorization = req.get('authorization') || '';
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : null;

    if (!token) throw new AppError(401, 'AUTH_REQUIRED', 'Driver authentication is required');

    const payload = verifyDriverAccessToken(token);

    if (payload.actorType !== 'driver' || payload.tokenType !== 'access') throw new Error('Invalid token');

    const session = await DriverSession.findById(payload.sid);

    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      throw new AppError(401, 'SESSION_UNAVAILABLE', 'The driver session is no longer active');
    }

    const driver = await Driver.findById(payload.sub);

    if (!driver || driver.status !== 'ACTIVE') {
      throw new AppError(403, 'DRIVER_UNAVAILABLE', 'The driver account is not active');
    }

    req.driver = driver;
    req.driverSessionId = session.id;
    
    return next();
  } catch (error) {
    if (error instanceof AppError) return next(error);
    return next(new AppError(401, 'INVALID_TOKEN', 'The driver access token is invalid or expired'));
  }
}

export { authenticateDriver };
