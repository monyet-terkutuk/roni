const mongoose = require('mongoose');
const { model, Schema } = mongoose;

const capsterSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
        },
        phone: {
            type: String,
            required: true,
            unique: true,
        },
        spesialis: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        avatar: {
            type: String,
        },
        rating: {
            type: Number,
            default: 0,
        },
        schedule: {
            senin: {
                is_active: { type: Boolean, default: false },
                jam_kerja: { type: String, default: '08:00 - 17:00' },
                jam_istirahat: { type: String, default: '12:00 - 13:00' },
            },
            selasa: {
                is_active: { type: Boolean, default: false },
                jam_kerja: { type: String, default: '08:00 - 17:00' },
                jam_istirahat: { type: String, default: '12:00 - 13:00' },
            },
            rabu: {
                is_active: { type: Boolean, default: false },
                jam_kerja: { type: String, default: '08:00 - 17:00' },
                jam_istirahat: { type: String, default: '12:00 - 13:00' },
            },
            kamis: {
                is_active: { type: Boolean, default: false },
                jam_kerja: { type: String, default: '08:00 - 17:00' },
                jam_istirahat: { type: String, default: '12:00 - 13:00' },
            },
            jumat: {
                is_active: { type: Boolean, default: false },
                jam_kerja: { type: String, default: '08:00 - 17:00' },
                jam_istirahat: { type: String, default: '12:00 - 13:00' },
            },
            sabtu: {
                is_active: { type: Boolean, default: false },
                jam_kerja: { type: String, default: '08:00 - 17:00' },
                jam_istirahat: { type: String, default: '12:00 - 13:00' },
            },
            minggu: {
                is_active: { type: Boolean, default: false },
                jam_kerja: { type: String, default: '08:00 - 17:00' },
                jam_istirahat: { type: String, default: '12:00 - 13:00' },
            },
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        address: {
            type: String,
        },
        album: {
            type: [String], // Assuming album is an array of strings (URLs or paths to images)
            default: [],
        },
    },
    { timestamps: true },
);
module.exports = model('Capster', capsterSchema);
