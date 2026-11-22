
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ['income', 'expense'],
            required: true
        },
        amount: {
            type: Number,
            required: true,
            min: [0.01, 'El monto debe ser mayor que cero']
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: true
        },
        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150
        },
        date: {
            type: Date,
            required: true,
            default: Date.now
        },
        paymentMethod: {
            type: String,
            trim: true,
            enum: [
                'Efectivo',
                'Tarjeta de débito',
                'Tarjeta de crédito',
                'Transferencia',
                'Otro',
                'No especificado'
            ],
            default: 'No especificado'
        }
    },
    {
        timestamps: true
    }
);

// Validar que la categoría corresponda al tipo de movimiento
transactionSchema.pre('validate', async function () {
    if (!this.category || !this.type) return;

    const Category = mongoose.model('Category');
    const category = await Category.findById(this.category);

    if (!category) {
        throw new Error('La categoría seleccionada no existe');
    }

    if (category.type !== this.type) {
        throw new Error('La categoría no corresponde al tipo de transacción');
    }
});

module.exports = mongoose.model('Transaction', transactionSchema);
