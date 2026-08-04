const functions = require("firebase-functions");

function requireAdmin(context) {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required. Please sign in to access admin operations."
    );
  }
  if (!context.auth.token || !context.auth.token.admin) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Permission denied. Admin authorization claims are required for this action."
    );
  }
}

module.exports = {
  requireAdmin
};
