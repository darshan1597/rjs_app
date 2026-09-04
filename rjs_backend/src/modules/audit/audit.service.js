import { AuditLog } from './audit-log.model.js';

function writeAuditLog({ req, action, targetType, targetId, metadata, actor }) {
  return AuditLog.create({
    actorType: actor?.accountType || 'SYSTEM', actorId: actor?.id,
    action, targetType, targetId, metadata,
    ip: req?.ip, userAgent: req?.get?.('user-agent'),
  });
}

export { writeAuditLog };
