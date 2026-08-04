const admin = require("firebase-admin");

/**
 * Creates a best-effort user notification document in `notifications` collection
 */
async function sendBestEffortUserNotification(uid, title, message, type = "SYSTEM") {
  try {
    const notifRef = admin.firestore().collection("notifications").doc();
    await notifRef.set({
      uid,
      title,
      message,
      type,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.warn(`[Notification Warning] Non-blocking notification failure for user ${uid}:`, error);
  }
}

module.exports = {
  sendBestEffortUserNotification
};
