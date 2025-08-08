const express = require('express');
const Capster = require('../model/Capster');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../middleware/auth'); // Assuming you have authentication and authorization middleware


router.post('', async (req, res) => {
    try {
        const {
            username,
            spesialis,
            phone,
            description,
            avatar,
            email,
            address,
            schedule = {}, // optional from request
            album = [] // optional from request
        } = req.body;

        // Cek apakah username, email, atau phone sudah digunakan
        const existingCapster = await Capster.findOne({
            $or: [{ username }, { email }, { phone }]
        });

        if (existingCapster) {
            return res.status(400).json({
                code: 400,
                status: 'error',
                data: {
                    error: 'Username, email, or phone already in use.',
                },
            });
        }

        // Atur default schedule jika tidak dikirim
        const defaultDay = {
            is_active: false,
            jam_kerja: '08:00 - 17:00',
            jam_istirahat: '12:00 - 13:00'
        };

        const fullSchedule = {
            senin: { ...defaultDay, ...schedule.senin },
            selasa: { ...defaultDay, ...schedule.selasa },
            rabu: { ...defaultDay, ...schedule.rabu },
            kamis: { ...defaultDay, ...schedule.kamis },
            jumat: { ...defaultDay, ...schedule.jumat },
            sabtu: { ...defaultDay, ...schedule.sabtu },
            minggu: { ...defaultDay, ...schedule.minggu },
        };

        const newCapster = new Capster({
            username,
            spesialis,
            phone,
            description,
            avatar,
            email,
            address,
            schedule: fullSchedule,
            album
        });

        await newCapster.save();

        return res.status(201).json({
            code: 201,
            status: 'success',
            data: newCapster,
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



// List capsters with filters and pagination
router.post('/list', async (req, res, next) => {
    try {
        const { page = 1, limit = 10, filters = {} } = req.body;

        // Initialize filter conditions
        const filterConditions = { deletedAt: { $exists: false } };

        // Apply filters based on set flags
        if (filters.set_username && filters.username) {
            filterConditions.username = { $regex: filters.username, $options: 'i' };
        }

        if (filters.set_phone && filters.phone) {
            filterConditions.phone = { $regex: filters.phone, $options: 'i' };
        }

        if (filters.set_email && filters.email) {
            filterConditions.email = { $regex: filters.email, $options: 'i' };
        }

        if (filters.set_address && filters.address) {
            filterConditions.address = { $regex: filters.address, $options: 'i' };
        }

        if (filters.set_rating && filters.rating) {
            filterConditions.rating = filters.rating;
        }

        // Pagination setup
        const skip = (page - 1) * limit;
        const capsters = await Capster.find(filterConditions)
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 }); // Sort by createdAt, descending (newest first)

        const totalCapsters = await Capster.countDocuments(filterConditions); // Get the total number of capsters

        const totalPages = Math.ceil(totalCapsters / limit); // Calculate total pages

        return res.status(200).json({
            code: 200,
            status: 'success',
            data: {
                capsters,
                pagination: {
                    page,
                    limit,
                    totalCapsters,
                    totalPages,
                },
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


// READ - Get all capsters or a single capster by ID
router.get('/:id?', async (req, res, next) => {
    try {
        const { id } = req.params;
        if (id) {
            const capster = await Capster.findById(id);
            if (!capster) {
                return res.status(404).json({
                    code: 404,
                    status: 'error',
                    data: {
                        error: 'Capster not found',
                    },
                });
            }
            return res.status(200).json({
                code: 200,
                status: 'success',
                data: capster,
            });
        }

        const capsters = await Capster.find();
        return res.status(200).json({
            code: 200,
            status: 'success',
            data: capsters,
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

// UPDATE - Update a capster by ID
router.put('/:id', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            username,
            phone,
            description,
            avatar,
            email,
            address,
            spesialis, // ✅ tambahkan ini
            schedule = {}, // optional from request
            album = [] // optional from request
        } = req.body;

        const capster = await Capster.findById(id);
        if (!capster) {
            return res.status(404).json({
                code: 404,
                status: 'error',
                data: { error: 'Capster not found' },
            });
        }

        // Perbarui field jika tersedia
        if (username) capster.username = username;
        if (phone) capster.phone = phone;
        if (description) capster.description = description;
        if (avatar) capster.avatar = avatar;
        if (email) capster.email = email;
        if (address) capster.address = address;
        if (spesialis) capster.spesialis = spesialis; // ✅ penting
        if (schedule) capster.schedule = schedule;
        if (album) capster.album = album; // Update album if provided


        await capster.save();

        return res.status(200).json({
            code: 200,
            status: 'success',
            data: capster,
        });
    } catch (error) {
        return res.status(500).json({
            code: 500,
            status: 'error',
            data: { error: error.message },
        });
    }
});


// DELETE - Delete a capster by ID
router.delete('/:id', isAuthenticated, async (req, res, next) => {
    try {
        const { id } = req.params;

        const capster = await Capster.findById(id);
        if (!capster) {
            return res.status(404).json({
                code: 404,
                status: 'error',
                data: {
                    error: 'Capster not found',
                },
            });
        }

        await capster.deleteOne();

        return res.status(200).json({
            code: 200,
            status: 'success',
            data: {
                message: 'Capster deleted successfully',
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

module.exports = router;
