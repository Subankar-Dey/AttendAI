import AuditLog from '../models/AuditLog.js';

export const logAction = async (action, entity, entityId, user, details = {}, req = null) => {
  try {
    const logEntry = {
      action,
      entity,
      entityId,
      user,
      details,
      ip: req ? req.ip : null,
      userAgent: req ? req.get('user-agent') : null
    };
    await AuditLog.create(logEntry);
  } catch (error) {
    console.error('Audit log error:', error);
  }
};

export default logAction;