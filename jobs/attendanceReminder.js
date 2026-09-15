const moment = require('moment');
const Booking = require('../model/Booking');
const { sendAttendanceReminder } = require('../utils/sendMail');

const REMINDER_BEFORE_MS = 15 * 60 * 1000;
const SEND_WINDOW_MIN_MS = 14 * 60 * 1000;
const SEND_WINDOW_MAX_MS = 16 * 60 * 1000;

const SKIP_STATUSES = new Set([
  'Di Batalkan',
  'Expired',
  'Tidak Hadir',
  'Selesai',
  'Sedang Di Layani',
]);

/**
 * Gabungkan tanggal booking + jam (0-23) sebagai waktu Asia/Jakarta (+07:00).
 */
function getBookingStartMs(date, hour) {
  const day = moment(date).utcOffset(7).format('YYYY-MM-DD');
  const hourStr = String(Number(hour)).padStart(2, '0');
  return moment(`${day} ${hourStr}:00:00+07:00`).valueOf();
}

function formatDateLabel(date) {
  return moment(date).utcOffset(7).format('dddd, D MMMM YYYY');
}

function formatHourLabel(hour) {
  return `${String(Number(hour)).padStart(2, '0')}:00 WIB`;
}

async function sendReminderForBooking(bookingId) {
  try {
    const booking = await Booking.findById(bookingId)
      .populate('capster_id', 'username')
      .populate('service_id', 'name');

    if (!booking) {
      return;
    }

    if (!booking.email) {
      return;
    }

    if (booking.attendanceReminderSentAt) {
      return;
    }

    if (SKIP_STATUSES.has(booking.status)) {
      return;
    }

    const startMs = getBookingStartMs(booking.date, booking.hour);
    const msUntilStart = startMs - Date.now();

    // Hanya kirim jika masih dalam window ~14–16 menit sebelum jam booking
    if (msUntilStart < SEND_WINDOW_MIN_MS || msUntilStart > SEND_WINDOW_MAX_MS) {
      console.log(
        `[attendanceReminder] skip booking ${bookingId}: di luar window (msUntilStart=${msUntilStart})`
      );
      return;
    }

    await sendAttendanceReminder({
      email: booking.email,
      name: booking.name,
      dateLabel: formatDateLabel(booking.date),
      hourLabel: formatHourLabel(booking.hour),
      capsterName: booking.capster_id?.username || '-',
      serviceName: booking.service_id?.name || '-',
    });

    booking.attendanceReminderSentAt = new Date();
    await booking.save();

    console.log(`[attendanceReminder] terkirim ke ${booking.email} (booking ${bookingId})`);
  } catch (error) {
    console.error(`[attendanceReminder] gagal untuk booking ${bookingId}:`, error.message);
  }
}

/**
 * Jadwalkan pengingat 15 menit sebelum jam booking.
 */
function scheduleAttendanceReminder(bookingId) {
  Promise.resolve()
    .then(async () => {
      const booking = await Booking.findById(bookingId).select('email date hour attendanceReminderSentAt status');
      if (!booking) {
        return;
      }

      if (!booking.email) {
        return;
      }

      if (booking.attendanceReminderSentAt) {
        return;
      }

      if (SKIP_STATUSES.has(booking.status)) {
        return;
      }

      const startMs = getBookingStartMs(booking.date, booking.hour);
      const delay = startMs - REMINDER_BEFORE_MS - Date.now();

      if (delay <= 0) {
        console.log(
          `[attendanceReminder] skip schedule booking ${bookingId}: delay=${delay} (sudah lewat window)`
        );
        return;
      }

      console.log(
        `[attendanceReminder] dijadwalkan untuk booking ${bookingId} dalam ${Math.round(delay / 1000)}s`
      );

      setTimeout(() => {
        sendReminderForBooking(bookingId);
      }, delay);
    })
    .catch((error) => {
      console.error(`[attendanceReminder] gagal schedule booking ${bookingId}:`, error.message);
    });
}

module.exports = {
  scheduleAttendanceReminder,
  getBookingStartMs,
  sendReminderForBooking,
};
