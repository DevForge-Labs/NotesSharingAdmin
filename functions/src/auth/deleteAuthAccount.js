const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { Roles, AccountStatus } = require("../../constants");
const { requireSuperAdmin } = require("../middleware/requireSuperAdmin");
const { verifySuperAdminCountGuard, enforceNoSelfAction } = require("../utils/guards");
const { writeAuditLog } = require("../utils/auditLogger");

exports.deleteAuthAccountHandler = async (data, context) => {
  requireSuperAdmin(context);

  const callerUid = context.auth.uid;
  const callerEmail = context.auth.token.email || "";

  const payload = data ?? {};
  const targetUid = (payload.targetUid || "").trim();
  const reason = (payload.reason || "").trim();
  const userAgent = context.rawRequest ? (context.rawRequest.headers["user-agent"] || "") : "";

  if (!targetUid) {
    throw new functions.https.HttpsError("invalid-argument", "targetUid is required.");
  }

  enforceNoSelfAction(callerUid, targetUid, "permanent account deletion");

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
  if (currentStatus === AccountStatus.AUTH_DELETED) {
    return { message: `User '${targetUid}' authentication account is already deleted.`, status: AccountStatus.AUTH_DELETED };
  }

  // Last SuperAdmin Guard if deleting a SuperAdmin
  if (currentRole === Roles.SUPERADMIN) {
    try {
      await verifySuperAdminCountGuard(targetUid);
    } catch (guardErr) {
      await writeAuditLog({
        action: "DELETE_AUTH_ACCOUNT",
        result: "BLOCKED",
        performedByUid: callerUid,
        performedByEmail: callerEmail,
        targetUid,
        targetEmail,
        oldRole: currentRole,
        newRole: currentRole,
        reason: "Blocked: Cannot delete the authentication account of the final SuperAdmin.",
        userAgent
      });
      throw guardErr;
    }
  }

  // 1. Delete user from Firebase Authentication
  try {
    await admin.auth().deleteUser(targetUid);
  } catch (authErr) {
    if (authErr.code !== "auth/user-not-found") {
      throw new functions.https.HttpsError("internal", `Failed to delete Firebase Auth user: ${authErr.message}`);
    }
  }

  // 2. Transaction update on Firestore (preserves all uploaded files, resources, uploader fields)
  await admin.firestore().runTransaction(async (transaction) => {
    transaction.update(userRef, {
      accountStatus: AccountStatus.AUTH_DELETED,
      deletedBy: callerUid,
      deletedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    writeAuditLog({
      action: "DELETE_AUTH_ACCOUNT",
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

  return {
    success: true,
    targetUid,
    status: AccountStatus.AUTH_DELETED,
    message: `Firebase Authentication account for '${targetUid}' permanently deleted. Uploaded resources remain intact.`
  };
};
