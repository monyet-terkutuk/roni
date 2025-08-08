const express = require('express');
const Transaction = require('../model/Booking'); // Assuming the model is stored in the model directory
const router = express.Router();
const ExcelJS = require('exceljs');

// CREATE - Create a new booking/transaction
router.post('', async (req, res) => {
    try {
        const { name, email, phone, date, hour, capster_id, payment_id, rating, image, haircut_type, service_id, status } = req.body;

        // Check if the transaction already exists (optional validation)
        const existingTransaction = await Transaction.findOne({ email, date, hour, capster_id });
        if (existingTransaction) {
            return res.status(400).json({
                code: 400,
                status: 'error',
                data: {
                    error: 'Booking already exists for this time and capster.',
                },
            });
        }

        const newTransaction = new Transaction({
            name,
            email,
            phone,
            date,
            hour,
            capster_id,
            payment_id,
            rating,
            image,
            haircut_type,
            service_id,
            status,
        });

        await newTransaction.save();

        return res.status(201).json({
            code: 201,
            status: 'success',
            data: newTransaction,
        });
    } catch (error) {
        return res.status(500).json({
            code: 500,
            status: 'error',
            data: {
                error: error.message,
            },
        });
    }
});

router.get('/export', async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        // Build filter
        const filter = { status: 'Selesai' };

        if (start_date && end_date) {
            filter.date = {
                $gte: new Date(start_date),
                $lte: new Date(end_date),
            };
        } else if (start_date) {
            filter.date = { $gte: new Date(start_date) };
        } else if (end_date) {
            filter.date = { $lte: new Date(end_date) };
        }

        const transactions = await Transaction.find(filter)
            .sort({ date: -1 })
            .populate('capster_id', 'username')
            .populate('payment_id', 'name')
            .populate('service_id', 'name price');

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Daftar Booking Selesai');

        // Header kolom
        worksheet.columns = [
            { header: 'No', key: 'no', width: 25 },
            { header: 'Nama Customer', key: 'name', width: 20 },
            { header: 'Telepon', key: 'phone', width: 15 },
            { header: 'Tanggal Booking', key: 'date', width: 20 },
            { header: 'Jam Booking', key: 'hour', width: 10 },
            { header: 'Capster', key: 'capster', width: 20 },
            { header: 'Metode Pembayaran', key: 'payment', width: 20 },
            { header: 'Layanan', key: 'service', width: 25 },
            { header: 'Harga', key: 'price', width: 15 },
            { header: 'Status', key: 'status', width: 20 },
        ];

        const paymentTotals = {};
        let totalPendapatan = 0;

        // Isi baris data
        transactions.forEach((trx) => {
            worksheet.addRow({
                no: transactions.indexOf(trx) + 1,
                name: trx.name,
                phone: trx.phone,
                date: trx.date.toISOString().split('T')[0],
                hour: trx.hour,
                capster: trx.capster_id?.username || '-',
                payment: trx.payment_id?.name || '-',
                service: trx.service_id?.name || '-',
                price: trx.service_id?.price || 0,
                status: trx.status,
            });

            const paymentName = trx.payment_id?.name || 'Tanpa Metode';
            const price = trx.service_id?.price || 0;

            if (!paymentTotals[paymentName]) {
                paymentTotals[paymentName] = {
                    total: 0,
                    count: 0
                };
            }

            paymentTotals[paymentName].total += price;
            paymentTotals[paymentName].count += 1;

            totalPendapatan += price;
        });

        // // Spacer row
        // worksheet.addRow([]);

        // // === Ringkasan 1: Total Pendapatan per Metode Pembayaran ===
        // worksheet.addRow(['', 'Metode Pembayaran', 'Jumlah Transaksi', 'Total Harga']);

        // Dua baris kosong
        worksheet.addRow([]);
        worksheet.addRow([]);

        // Header untuk bagian rekap metode pembayaran
        worksheet.addRow(['', 'Metode Pembayaran', 'Jumlah Transaksi', 'Total Pendapatan (Rp)']);

        // Data rekap per metode pembayaran
        for (const [method, data] of Object.entries(paymentTotals)) {
            worksheet.addRow(['', method, data.count, data.total]);
        }


        // Spacer row
        worksheet.addRow([]);

        // === Ringkasan 2: Total Pendapatan Keseluruhan ===
        worksheet.addRow(['', 'Total Pendapatan', totalPendapatan]);

        // Spacer row
        worksheet.addRow([]);

        // === Ringkasan 3: Total Customer per Capster ===
        worksheet.addRow(['', 'Capster', 'Total Customer']);

        const capsterTotals = {};
        transactions.forEach(trx => {
            const capsterName = trx.capster_id?.username || 'Tanpa Capster';
            capsterTotals[capsterName] = (capsterTotals[capsterName] || 0) + 1;
        });
        for (const [capster, total] of Object.entries(capsterTotals)) {
            worksheet.addRow(['', capster, total]);
        }

        // Set response headers untuk download Excel
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            'attachment; filename=booking_selesai.xlsx'
        );

        await workbook.xlsx.write(res);
        res.status(200).end();
    } catch (error) {
        console.error('Export error:', error);
        return res.status(500).json({
            code: 500,
            status: 'error',
            message: 'Gagal mengekspor data',
            error: error.message,
        });
    }
});

// READ - Get all bookings/transactions
router.get('', async (req, res) => {
    try {
        const { date_from, date_to } = req.query;
        const filter = {};

        // Tambahkan filter tanggal jika tersedia
        if (date_from && date_to) {
            filter.date = {
                $gte: new Date(date_from),
                $lte: new Date(date_to)
            };
        } else if (date_from) {
            filter.date = { $gte: new Date(date_from) };
        } else if (date_to) {
            filter.date = { $lte: new Date(date_to) };
        }

        const transactions = await Transaction.find(filter)
            .sort({ date: -1 })
            .populate('capster_id', 'username')
            .populate('payment_id', 'name')
            .populate('service_id', 'name price');

        return res.status(200).json({
            code: 200,
            status: 'success',
            data: transactions,
        });
    } catch (error) {
        return res.status(500).json({
            code: 500,
            status: 'error',
            data: {
                error: error.message,
            },
        });
    }
});

// READ - Get a specific transaction by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const transaction = await Transaction.findById(id)
            .populate('capster_id', 'username')
            .populate('payment_id', 'name')
            .populate('service_id', 'name');

        if (!transaction) {
            return res.status(404).json({
                code: 404,
                status: 'error',
                data: {
                    error: 'Transaction not found',
                },
            });
        }

        return res.status(200).json({
            code: 200,
            status: 'success',
            data: transaction,
        });
    } catch (error) {
        return res.status(500).json({
            code: 500,
            status: 'error',
            data: {
                error: error.message,
            },
        });
    }
});

// UPDATE - Update a booking/transaction by ID
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, date, hour, capster_id, payment_id, rating, image, haircut_type, service_id, status } = req.body;

        const transaction = await Transaction.findById(id);
        if (!transaction) {
            return res.status(404).json({
                code: 404,
                status: 'error',
                data: {
                    error: 'Transaction not found',
                },
            });
        }

        transaction.name = name || transaction.name;
        transaction.email = email || transaction.email;
        transaction.phone = phone || transaction.phone;
        transaction.date = date || transaction.date;
        transaction.hour = hour || transaction.hour;
        transaction.capster_id = capster_id || transaction.capster_id;
        transaction.payment_id = payment_id || transaction.payment_id;
        transaction.rating = rating || transaction.rating;
        transaction.image = image || transaction.image;
        transaction.haircut_type = haircut_type || transaction.haircut_type;
        transaction.service_id = service_id || transaction.service_id;
        transaction.status = status || transaction.status;

        await transaction.save();

        return res.status(200).json({
            code: 200,
            status: 'success',
            data: transaction,
        });
    } catch (error) {
        return res.status(500).json({
            code: 500,
            status: 'error',
            data: {
                error: error.message,
            },
        });
    }
});

// DELETE - Delete a transaction by ID
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const transaction = await Transaction.findById(id);
        if (!transaction) {
            return res.status(404).json({
                code: 404,
                status: 'error',
                data: {
                    error: 'Transaction not found',
                },
            });
        }

        await transaction.deleteOne();

        return res.status(200).json({
            code: 200,
            status: 'success',
            data: {
                message: 'Transaction deleted successfully',
            },
        });
    } catch (error) {
        return res.status(500).json({
            code: 500,
            status: 'error',
            data: {
                error: error.message,
            },
        });
    }
});

// GET - List waktu booking berdasarkan capster
router.get('/time/:capsterId', async (req, res) => {
    try {
        const { capsterId } = req.params;

        const bookedTimes = await Transaction.find({
            capster_id: capsterId,
            status: { $in: ['Menunggu', 'Di Konfirmasi', 'Sedang Di Layani'] }
        }).select('date hour -_id'); // hanya ambil field date & hour

        return res.status(200).json({
            code: 200,
            status: 'success',
            data: bookedTimes,
        });
    } catch (error) {
        return res.status(500).json({
            code: 500,
            status: 'error',
            data: {
                error: error.message,
            },
        });
    }
});


module.exports = router;
