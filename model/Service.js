const mongoose = require('mongoose');
const { model, Schema } = mongoose;

const serviceSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
        },
        image: {
            type: String,
            required: false, // Assuming image is required, adjust as necessary
        },
        description: {
            type: String,
            required: false,
        },
        price: {
            type: Number,
            required: true,
        },
    },
    { timestamps: true },
);

module.exports = model('Service', serviceSchema);
