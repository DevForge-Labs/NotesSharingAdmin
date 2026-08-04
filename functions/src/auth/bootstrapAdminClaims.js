const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { Roles } = require("../../constants");
const { writeAuditLog } = require("../utils/auditLogger");

exports.bootstrapAdminClaimsHandler = async (data, context) => {
  // 1. Authenticated check
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required. Please sign in to run bootstrap claims."
    );
  }

  const payload = data ?? {};
  const callerUid = context.auth.uid;
  const callerEmail = context.auth.token ? (context.auth.token.email || "") : "";

  // 2. Self-retire check: Refuse if already completed
  const systemRef = admin.firestore().collection("app_config").doc("system");
  const systemSnap = await systemRef.get();

  if (systemSnap.exists && systemSnap.data().bootstrapCompleted === true) {
    return {
      success: true,
      message: "Bootstrap migration already completed. System is locked.",
      bootstrapCompleted: true,
      version: systemSnap.data().bootstrapVersion || 1
    };
  }

  // 3. Authorize caller via admins/{callerUid} document OR custom claim
  let isCallerSuperAdmin = !!(context.auth.token && context.auth.token.superadmin);

  if (!isCallerSuperAdmin) {
    const callerAdminDoc = await admin.firestore().collection("admins").doc(callerUid).get();
    if (callerAdminDoc.exists) {
      const role = (callerAdminDoc.data().role || "").toLowerCase();
      if (role === Roles.SUPERADMIN) {
        isCallerSuperAdmin = true;
      }
    }
  }

  if (!isCallerSuperAdmin) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Permission denied. Only an existing SuperAdmin in admins/{uid} can execute initial bootstrap."
    );
  }

  // 4. Scan existing admins/{uid} collection for SuperAdmins
  const adminsSnap = await admin.firestore().collection("admins")
    .where("role", "==", Roles.SUPERADMIN)
    .get();

  const migratedUids = [];

  for (const doc of adminsSnap.docs) {
    const adminUid = doc.id;
    const adminData = doc.data();

    // Grant Custom Claims
    await admin.auth().setCustomUserClaims(adminUid, { admin: true, superadmin: true });

    // Sync users/{uid} document
    const userRef = admin.firestore().collection("users").doc(adminUid);
    const userSnap = await userRef.get();

    if (userSnap.exists) {
      await userRef.update({
        role: Roles.SUPERADMIN,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    migratedUids.push(adminUid);

    // Audit log
    await writeAuditLog({
      action: "BOOTSTRAP_CLAIMS",
      result: "SUCCESS",
      performedByUid: callerUid,
      performedByEmail: callerEmail,
      targetUid: adminUid,
      targetEmail: adminData.email || "",
      oldRole: adminData.role || "",
      newRole: Roles.SUPERADMIN,
      reason: "Initial SuperAdmin bootstrap claim assignment."
    });
  }

  // Lock bootstrap permanently
  await systemRef.set({
    bootstrapCompleted: true,
    bootstrapVersion: 1,
    bootstrapCompletedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  return {
    success: true,
    migratedCount: migratedUids.length,
    migratedUids,
    message: `Bootstrap complete! Granted SuperAdmin custom claims to ${migratedUids.length} existing admin account(s).`
  };
};
