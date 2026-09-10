const mongoose = require('mongoose');
const { model, Schema } = mongoose;

const paymentMethodSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
        },
    },
    { timestamps: true },
);

module.exports = model('PaymentMethod', paymentMethodSchema);
