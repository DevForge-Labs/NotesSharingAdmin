const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { Roles, AccountStatus } = require("../../constants");
const { requireAdmin } = require("../middleware/requireAdmin");
const { verifySuperAdminCountGuard, enforceNoSelfAction } = require("../utils/guards");
const { writeAuditLog } = require("../utils/auditLogger");
const { sendBestEffortUserNotification } = require("../utils/notifications");

exports.disableUserHandler = async (data, context) => {
  requireAdmin(context);

  const callerUid = context.auth.uid;
  const callerEmail = context.auth.token.email || "";
  const isCallerSuperAdmin = !!context.auth.token.superadmin;

  const payload = data ?? {};
  const targetUid = (payload.targetUid || "").trim();
  const reason = (payload.reason || "").trim();
  const userAgent = context.rawRequest ? (context.rawRequest.headers["user-agent"] || "") : "";

  if (!targetUid) {
    throw new functions.https.HttpsError("invalid-argument", "targetUid is required.");
  }

  if (!reason) {
    throw new functions.https.HttpsError("invalid-argument", "A reason is required when disabling an account.");
  }

  enforceNoSelfAction(callerUid, targetUid, "disable account");

  const userRef = admin.firestore().collection("users").doc(targetUid);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    throw new functions.https.HttpsError("not-found", `User document '${targetUid}' not found in Firestore.`);
  }

  const userData = userDoc.data();
  const currentRole = (userData.role || Roles.USER).toLowerCase();
  const currentStatus = userData.accountStatus || AccountStatus.ACTIVE;
  const targetEmail = userData.email || "";

  // Idempotency check
  if (currentStatus === AccountStatus.DISABLED) {
    return { message: `User '${targetUid}' is already disabled.`, status: AccountStatus.DISABLED };
  }

  // Permission checks: Admin cannot disable other Admins or SuperAdmins
  if (currentRole === Roles.SUPERADMIN && !isCallerSuperAdmin) {
    await writeAuditLog({
      action: "DISABLE_USER",
      result: "BLOCKED",
      performedByUid: callerUid,
      performedByEmail: callerEmail,
      targetUid,
      targetEmail,
      oldRole: currentRole,
      newRole: currentRole,
      reason: "Blocked: Only a SuperAdmin can disable a SuperAdmin.",
      userAgent
    });
    throw new functions.https.HttpsError("permission-denied", "Only a SuperAdmin can disable a SuperAdmin account.");
  }

  if (currentRole === Roles.ADMIN && !isCallerSuperAdmin) {
    await writeAuditLog({
      action: "DISABLE_USER",
      result: "BLOCKED",
      performedByUid: callerUid,
      performedByEmail: callerEmail,
      targetUid,
      targetEmail,
      oldRole: currentRole,
      newRole: currentRole,
      reason: "Blocked: Regular Admins cannot disable another Admin.",
      userAgent
    });
    throw new functions.https.HttpsError("permission-denied", "Regular Admins cannot disable another Admin account.");
  }

  // Last SuperAdmin Guard
  if (currentRole === Roles.SUPERADMIN) {
    try {
      await verifySuperAdminCountGuard(targetUid);
    } catch (guardErr) {
      await writeAuditLog({
        action: "DISABLE_USER",
        result: "BLOCKED",
        performedByUid: callerUid,
        performedByEmail: callerEmail,
        targetUid,
        targetEmail,
        oldRole: currentRole,
        newRole: currentRole,
        reason: "Blocked: Cannot disable the final SuperAdmin in the system.",
        userAgent
      });
      throw guardErr;
    }
  }

  // 1. Revoke Auth tokens instantly
  try {
    await admin.auth().revokeRefreshTokens(targetUid);
  } catch (authErr) {
    console.warn(`Token revocation warning for ${targetUid}:`, authErr);
  }

  // 2. Transaction update
  await admin.firestore().runTransaction(async (transaction) => {
    transaction.update(userRef, {
      accountStatus: AccountStatus.DISABLED,
      disabledReason: reason,
      disabledBy: callerUid,
      disabledAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    writeAuditLog({
      action: "DISABLE_USER",
      result: "SUCCESS",
      performedByUid: callerUid,
      performedByEmail: callerEmail,
      targetUid,
      targetEmail,
      oldRole: currentRole,
      newRole: currentRole,
      reason,
      userAgent,
      transaction
    });
  });

  sendBestEffortUserNotification(targetUid, "Account Suspended", `Your account has been disabled by an administrator. Reason: ${reason}`, "ACCOUNT_STATUS");

  return {
    success: true,
    targetUid,
    status: AccountStatus.DISABLED,
    message: `User '${targetUid}' has been disabled successfully.`
  };
};
