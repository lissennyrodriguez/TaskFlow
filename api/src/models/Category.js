
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        type: {
            type: String,
            enum: ['income', 'expense'],
            required: true
        },
        color: {
            type: String,
            default: '#83A58E'
        },
        icon: {
            type: String,
            default: 'wallet'
        }
    },
    {
        timestamps: true
    }
);

categorySchema.index({ name: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);
