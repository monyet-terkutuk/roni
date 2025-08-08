const express = require('express');
const router = express.Router();
const Capster = require('../model/Capster');
const Booking = require('../model/Booking');
const moment = require('moment');

router.get('/booking-summary', async (req, res) => {
    try {
        const todayStart = moment().startOf('day').toDate();
        const todayEnd = moment().endOf('day').toDate();

        // 1. Jumlah capster aktif
        const capster_active = await Capster.countDocuments();

        // 2. Total booking hari ini
        const total_booking_today = await Booking.countDocuments({
            date: { $gte: todayStart, $lte: todayEnd },
        });

        // 3. Daftar booking hari ini
        const bookings = await Booking.find({
            date: { $gte: todayStart, $lte: todayEnd },
        })
            .populate('capster_id')
            .sort({ hour: 1 });

        // 4. Group bookings by capster
        const grouped = {};

        bookings.forEach((booking, index) => {
            const capsterName = booking.capster_id?.username || 'Unknown';

            if (!grouped[capsterName]) {
                grouped[capsterName] = [];
            }

            grouped[capsterName].push({
                customer: booking.name,
                jam: `${booking.hour}:00`,
                antrian_ke: grouped[capsterName].length + 1,
            });
        });

        // 5. Convert to list format
        const list = Object.entries(grouped).map(([capster, booking]) => ({
            capster,
            booking,
        }));

        // 6. Response
        res.json({
            capster_active,
            total_booking_today,
            list,
        });
    } catch (error) {
        res.status(500).json({
            message: 'Server error',
            error: error.message,
        });
    }
});

module.exports = router;
