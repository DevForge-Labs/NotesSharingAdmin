const admin = require("firebase-admin");
const { USER_MANAGEMENT_VERSION } = require("../../constants");

/**
 * Creates an immutable, append-only log entry in `admin_activity_logs`
 */
async function writeAuditLog({
  action,
  result = "SUCCESS",
  performedByUid,
  performedByEmail = "",
  targetUid,
  targetEmail = "",
  oldRole = "",
  newRole = "",
  reason = "",
  userAgent = "",
  transaction = null
}) {
  const logRef = admin.firestore().collection("admin_activity_logs").doc();
  const logData = {
    action,
    result,
    performedByUid,
    performedByEmail: performedByEmail || "",
    targetUid,
    targetEmail: targetEmail || "",
    oldRole: oldRole || "",
    newRole: newRole || "",
    reason: reason || "",
    userAgent: userAgent || "",
    systemVersion: USER_MANAGEMENT_VERSION,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  };

  if (transaction) {
    transaction.set(logRef, logData);
  } else {
    await logRef.set(logData);
  }
}

module.exports = {
  writeAuditLog
};
