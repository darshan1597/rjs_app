import { AuditLog } from './audit-log.model.js';

async function listAuditLogs(req, res, next) {
  try {
    const { page, limit, action, actorId, targetType, from, to } = req.validated.query;
    const filter = {};
    if (action) filter.action = action;
    if (actorId) filter.actorId = actorId;
    if (targetType) filter.targetType = targetType;
    if (from || to) filter.createdAt = { ...(from && { $gte: from }), ...(to && { $lte: to }) };
    const [items, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('actorId', 'name email accountType')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      AuditLog.countDocuments(filter),
    ]);
    return res.json({ success: true, data: { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } });
  } catch (error) { return next(error); }
}

export { listAuditLogs };
