const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { Roles } = require("../../constants");
const { requireAdmin } = require("../middleware/requireAdmin");
const { requireSuperAdmin } = require("../middleware/requireSuperAdmin");
const { verifySuperAdminCountGuard, validateRoleInput, enforceNoSelfAction } = require("../utils/guards");
const { writeAuditLog } = require("../utils/auditLogger");
const { sendBestEffortUserNotification } = require("../utils/notifications");

exports.setUserRoleHandler = async (data, context) => {
  // 1. Authentication check
  requireAdmin(context);

  const callerUid = context.auth.uid;
  const callerEmail = context.auth.token.email || "";
  const isCallerSuperAdmin = !!context.auth.token.superadmin;

  const payload = data ?? {};
  const targetUid = (payload.targetUid || "").trim();
  const targetRole = (payload.targetRole || "").trim().toLowerCase();
  const reason = (payload.reason || "").trim();
  const userAgent = context.rawRequest ? (context.rawRequest.headers["user-agent"] || "") : "";

  if (!targetUid) {
    throw new functions.https.HttpsError("invalid-argument", "targetUid is required.");
  }

  // 2. Validate input role
  validateRoleInput(targetRole);

  // 3. Get target user profile from Firestore
  const userRef = admin.firestore().collection("users").doc(targetUid);
  const adminRef = admin.firestore().collection("admins").doc(targetUid);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    throw new functions.https.HttpsError("not-found", `User document '${targetUid}' not found in Firestore.`);
  }

  const userData = userDoc.data();
  const currentRole = (userData.role || Roles.USER).toLowerCase();
  const targetEmail = userData.email || "";

  // 4. Idempotency Check: Return early if role is unchanged
  if (currentRole === targetRole) {
    return { message: `User '${targetUid}' is already in role '${targetRole}'.`, role: targetRole };
  }

  // 5. Authorization & Guard Checks
  // A. Promoting to SuperAdmin requires caller to be a SuperAdmin
  if (targetRole === Roles.SUPERADMIN && !isCallerSuperAdmin) {
    await writeAuditLog({
      action: "PROMOTE_TO_SUPERADMIN",
      result: "BLOCKED",
      performedByUid: callerUid,
      performedByEmail: callerEmail,
      targetUid,
      targetEmail,
      oldRole: currentRole,
      newRole: targetRole,
      reason: "Blocked: SuperAdmin authorization required to grant SuperAdmin role.",
      userAgent
    });
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only a SuperAdmin can promote a user to SuperAdmin."
    );
  }

  // B. Demoting from SuperAdmin requires caller to be a SuperAdmin
  if (currentRole === Roles.SUPERADMIN && !isCallerSuperAdmin) {
    await writeAuditLog({
      action: "DEMOTE_SUPERADMIN",
      result: "BLOCKED",
      performedByUid: callerUid,
      performedByEmail: callerEmail,
      targetUid,
      targetEmail,
      oldRole: currentRole,
      newRole: targetRole,
      reason: "Blocked: Only a SuperAdmin can modify or demote a SuperAdmin.",
      userAgent
    });
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only a SuperAdmin can demote an existing SuperAdmin."
    );
  }

  // C. Admin cannot promote/demote other Admins
  if (currentRole === Roles.ADMIN && !isCallerSuperAdmin) {
    await writeAuditLog({
      action: "MODIFY_ADMIN_ROLE",
      result: "BLOCKED",
      performedByUid: callerUid,
      performedByEmail: callerEmail,
      targetUid,
      targetEmail,
      oldRole: currentRole,
      newRole: targetRole,
      reason: "Blocked: Regular Admins cannot demote or modify other Admins.",
      userAgent
    });
    throw new functions.https.HttpsError(
      "permission-denied",
      "Regular Admins cannot modify or demote other Admins."
    );
  }

  // D. Self-demotion guard
  if ((currentRole === Roles.SUPERADMIN || currentRole === Roles.ADMIN) && targetRole !== currentRole) {
    enforceNoSelfAction(callerUid, targetUid, "demotion");
  }

  // E. Last SuperAdmin guard if demoting a SuperAdmin
  if (currentRole === Roles.SUPERADMIN && targetRole !== Roles.SUPERADMIN) {
    try {
      await verifySuperAdminCountGuard(targetUid);
    } catch (guardErr) {
      await writeAuditLog({
        action: "DEMOTE_SUPERADMIN",
        result: "BLOCKED",
        performedByUid: callerUid,
        performedByEmail: callerEmail,
        targetUid,
        targetEmail,
        oldRole: currentRole,
        newRole: targetRole,
        reason: "Blocked: Cannot demote the final SuperAdmin in the system.",
        userAgent
      });
      throw guardErr;
    }
  }

  // 6. Update Custom Claims
  let customClaims = { admin: false, superadmin: false };
  if (targetRole === Roles.SUPERADMIN) {
    customClaims = { admin: true, superadmin: true };
  } else if (targetRole === Roles.ADMIN) {
    customClaims = { admin: true, superadmin: false };
  }

  await admin.auth().setCustomUserClaims(targetUid, customClaims);

  // 7. Atomic Transaction: Update Firestore docs & write audit log
  const actionName = targetRole === Roles.SUPERADMIN ? "PROMOTE_TO_SUPERADMIN"
    : targetRole === Roles.ADMIN ? (currentRole === Roles.SUPERADMIN ? "DEMOTE_TO_ADMIN" : "PROMOTE_TO_ADMIN")
    : "DEMOTE_TO_USER";

  await admin.firestore().runTransaction(async (transaction) => {
    // Re-verify current role inside transaction for optimistic concurrency
    const freshUserSnap = await transaction.get(userRef);
    if (!freshUserSnap.exists) {
      throw new functions.https.HttpsError("not-found", "User document deleted during transaction.");
    }

    transaction.update(userRef, {
      role: targetRole,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    if (targetRole === Roles.ADMIN || targetRole === Roles.SUPERADMIN) {
      transaction.set(adminRef, {
        email: targetEmail,
        role: targetRole,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    } else {
      // Remove from admins collection when demoted to User
      transaction.delete(adminRef);
    }

    writeAuditLog({
      action: actionName,
      result: "SUCCESS",
      performedByUid: callerUid,
      performedByEmail: callerEmail,
      targetUid,
      targetEmail,
      oldRole: currentRole,
      newRole: targetRole,
      reason,
      userAgent,
      transaction
    });
  });

  // 8. Best-effort User Notification
  const notifMessage = targetRole === Roles.SUPERADMIN
    ? "Congratulations! Your account has been promoted to SuperAdmin."
    : targetRole === Roles.ADMIN
    ? "Your account has been promoted to Administrator."
    : "Your administrative permissions have been updated to regular user.";

  sendBestEffortUserNotification(targetUid, "Account Role Updated", notifMessage, "ROLE_CHANGE");

  return {
    success: true,
    targetUid,
    oldRole: currentRole,
    newRole: targetRole,
    message: `User '${targetUid}' successfully assigned role '${targetRole}'.`
  };
};
