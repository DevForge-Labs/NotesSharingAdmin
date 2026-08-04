const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { Roles } = require("../../constants");

/**
 * Checks if demoting or deleting/disabling a target SuperAdmin is safe.
 * Counts remaining active SuperAdmins using .count().get()
 */
async function verifySuperAdminCountGuard(targetUid) {
  const countSnapshot = await admin.firestore()
    .collection("admins")
    .where("role", "==", Roles.SUPERADMIN)
    .count()
    .get();

  const activeSuperAdminsCount = countSnapshot.data().count;

  if (activeSuperAdminsCount <= 1) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Operation blocked: Cannot demote or disable the final SuperAdmin in the system."
    );
  }
}

/**
 * Validates that targetRole belongs to allowed Roles set
 */
function validateRoleInput(targetRole) {
  const allowedRoles = new Set([Roles.USER, Roles.ADMIN, Roles.SUPERADMIN]);
  if (!allowedRoles.has(targetRole)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      `Invalid role '${targetRole}'. Allowed roles: user, admin, superadmin.`
    );
  }
}

/**
 * Server-side guard preventing self-action
 */
function enforceNoSelfAction(callerUid, targetUid, actionName) {
  if (callerUid === targetUid) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      `Self-action blocked: You cannot perform ${actionName} on your own account.`
    );
  }
}

module.exports = {
  verifySuperAdminCountGuard,
  validateRoleInput,
  enforceNoSelfAction
};
