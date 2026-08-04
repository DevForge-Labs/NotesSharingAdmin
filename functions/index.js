const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const { setUserRoleHandler } = require("./src/auth/setUserRole");
const { disableUserHandler } = require("./src/auth/disableUser");
const { enableUserHandler } = require("./src/auth/enableUser");
const { deleteAuthAccountHandler } = require("./src/auth/deleteAuthAccount");
const { bootstrapAdminClaimsHandler } = require("./src/auth/bootstrapAdminClaims");

exports.setUserRole = functions.https.onCall(setUserRoleHandler);
exports.disableUser = functions.https.onCall(disableUserHandler);
exports.enableUser = functions.https.onCall(enableUserHandler);
exports.deleteAuthAccount = functions.https.onCall(deleteAuthAccountHandler);
exports.bootstrapAdminClaims = functions.https.onCall(bootstrapAdminClaimsHandler);
