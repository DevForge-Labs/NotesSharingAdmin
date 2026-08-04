const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { AccountStatus } = require("../../constants");
const { requireAdmin } = require("../middleware/requireAdmin");
const { writeAuditLog } = require("../utils/auditLogger");
const { sendBestEffortUserNotification } = require("../utils/notifications");

exports.enableUserHandler = async (data, context) => {
  requireAdmin(context);

  const callerUid = context.auth.uid;
  const callerEmail = context.auth.token.email || "";

  const payload = data ?? {};
  const targetUid = (payload.targetUid || "").trim();
  const reason = (payload.reason || "").trim();
  const userAgent = context.rawRequest ? (context.rawRequest.headers["user-agent"] || "") : "";

  if (!targetUid) {
    throw new functions.https.HttpsError("invalid-argument", "targetUid is required.");
  }

  const userRef = admin.firestore().collection("users").doc(targetUid);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    throw new functions.https.HttpsError("not-found", `User document '${targetUid}' not found in Firestore.`);
  }

  const userData = userDoc.data();
  const currentStatus = userData.accountStatus || AccountStatus.ACTIVE;
  const currentRole = userData.role || "user";
  const targetEmail = userData.email || "";

  // Idempotency check
  if (currentStatus === AccountStatus.ACTIVE) {
    return { message: `User '${targetUid}' is already active.`, status: AccountStatus.ACTIVE };
  }

  await admin.firestore().runTransaction(async (transaction) => {
    transaction.update(userRef, {
      accountStatus: AccountStatus.ACTIVE,
      enabledBy: callerUid,
      enabledAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    writeAuditLog({
      action: "ENABLE_USER",
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

  sendBestEffortUserNotification(targetUid, "Account Reactivated", "Your account has been reactivated. You may now sign in.", "ACCOUNT_STATUS");

  return {
    success: true,
    targetUid,
    status: AccountStatus.ACTIVE,
    message: `User '${targetUid}' has been re-enabled successfully.`
  };
};
