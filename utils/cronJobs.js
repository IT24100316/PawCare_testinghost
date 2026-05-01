const cron = require('node-cron');
const Booking = require('../models/Booking');
const { sendNotification } = require('./notificationService');

const initCronJobs = () => {
  // Run everyday at 8:00 AM
  cron.schedule('0 8 * * *', async () => {
    console.log('[Cron Job] Checking for upcoming appointments tomorrow...');
    
    try {
      const tomorrowStart = new Date();
      tomorrowStart.setDate(tomorrowStart.getDate() + 1);
      tomorrowStart.setHours(0, 0, 0, 0);

      const tomorrowEnd = new Date(tomorrowStart);
      tomorrowEnd.setHours(23, 59, 59, 999);

      const upcomingBookings = await Booking.find({
        appointmentDate: { $gte: tomorrowStart, $lte: tomorrowEnd },
        status: 'Approved' // only send reminders for approved appointments
      }).populate('userId');

      let reminderCount = 0;
      upcomingBookings.forEach(booking => {
        if (booking.userId) {
          sendNotification(
            booking.userId._id,
            'Appointment Reminder',
            `Reminder: You have a ${booking.serviceType.toLowerCase()} appointment tomorrow at ${booking.timeSlot}.`
          );
          reminderCount++;
        }
      });
      
      console.log(`[Cron Job] Sent ${reminderCount} reminder notifications.`);
    } catch (error) {
      console.error('[Cron Job] Error checking upcoming appointments:', error.message);
    }
  });
};

module.exports = { initCronJobs };
