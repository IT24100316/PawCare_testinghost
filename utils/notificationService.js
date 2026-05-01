const sendNotification = (userId, title, message) => {
  // In a production environment, this would integrate with a service like Firebase Cloud Messaging (FCM) or Expo Push Notifications.
  // We use simulated log outputs for demonstration purposes.
  console.log(`\n======================================================`);
  console.log(`🔔 [PUSH NOTIFICATION]`);
  console.log(`To User ID  : ${userId}`);
  console.log(`Title       : ${title}`);
  console.log(`Message     : ${message}`);
  console.log(`Time        : ${new Date().toLocaleString()}`);
  console.log(`======================================================\n`);
};

module.exports = { sendNotification };
