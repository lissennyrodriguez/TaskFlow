
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const mongoose = require('mongoose');

// Crear un gasto o ingreso
const createTransaction = async (req, res) => {
    try {
        const {
            type,
            amount,
            category,
            description,
            date,
            paymentMethod
        } = req.body;

        if (!type || !amount || !category || !description?.trim()) {
            return res.status(400).json({
                message: 'Tipo, monto, categoría y descripción son obligatorios'
            });
        }

        if (!['income', 'expense'].includes(type)) {
            return res.status(400).json({
                message: 'El tipo debe ser income o expense'
            });
        }

        if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
            return res.status(400).json({
                message: 'El monto debe ser mayor que cero'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(category)) {
            return res.status(400).json({
                message: 'Identificador de categoría inválido'
            });
        }

        const selectedCategory = await Category.findById(category);

        if (!selectedCategory) {
            return res.status(404).json({
                message: 'La categoría no existe'
            });
        }

        if (selectedCategory.type !== type) {
            return res.status(400).json({
                message: 'La categoría no corresponde al tipo de movimiento'
            });
        }

        const transaction = await Transaction.create({
            type,
            amount: Number(amount),
            category,
            description,
            date,
            paymentMethod
        });

        const populatedTransaction = await Transaction.findById(
            transaction._id
        ).populate('category', 'name color icon type');

        return res.status(201).json({
            message: 'Movimiento registrado correctamente',
            transaction: populatedTransaction
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Error al registrar el movimiento',
            error: error.message
        });
    }
};

// Consultar todos los movimientos
const getTransactions = async (req, res) => {
    try {
        const { type, category, startDate, endDate } = req.query;

        const filter = {};

        if (type) {
            if (!['income', 'expense'].includes(type)) {
                return res.status(400).json({
                    message: 'Tipo de movimiento inválido'
                });
            }

            filter.type = type;
        }

        if (category) {
            if (!mongoose.Types.ObjectId.isValid(category)) {
                return res.status(400).json({
                    message: 'Identificador de categoría inválido'
                });
            }

            filter.category = category;
        }

        if (startDate || endDate) {
            filter.date = {};

            if (startDate) filter.date.$gte = new Date(startDate);
            if (endDate) filter.date.$lte = new Date(endDate);
        }

        const transactions = await Transaction.find(filter)
            .populate('category', 'name color icon type')
            .sort({ date: -1, createdAt: -1 });

        return res.status(200).json(transactions);
    } catch (error) {
        return res.status(500).json({
            message: 'Error al consultar los movimientos',
            error: error.message
        });
    }
};

// Consultar un movimiento por ID
const getTransactionById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: 'Identificador inválido'
            });
        }

        const transaction = await Transaction.findById(id)
            .populate('category', 'name color icon type');

        if (!transaction) {
            return res.status(404).json({
                message: 'Movimiento no encontrado'
            });
        }

        return res.status(200).json(transaction);
    } catch (error) {
        return res.status(500).json({
            message: 'Error al consultar el movimiento',
            error: error.message
        });
    }
};

// Actualizar un movimiento
const updateTransaction = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: 'Identificador inválido'
            });
        }

        const transaction = await Transaction.findById(id);

        if (!transaction) {
            return res.status(404).json({
                message: 'Movimiento no encontrado'
            });
        }

        const { type, amount, category, description, date, paymentMethod } = req.body;

        const newType = type ?? transaction.type;
        const newCategory = category ?? transaction.category;

        if (!['income', 'expense'].includes(newType)) {
            return res.status(400).json({
                message: 'Tipo de movimiento inválido'
            });
        }

        if (amount !== undefined &&
            (!Number.isFinite(Number(amount)) || Number(amount) <= 0)) {
            return res.status(400).json({
                message: 'El monto debe ser mayor que cero'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(newCategory)) {
            return res.status(400).json({
                message: 'Identificador de categoría inválido'
            });
        }

        const selectedCategory = await Category.findById(newCategory);

        if (!selectedCategory || selectedCategory.type !== newType) {
            return res.status(400).json({
                message: 'La categoría no existe o no corresponde al tipo de movimiento'
            });
        }

        transaction.type = newType;
        transaction.category = newCategory;

        if (amount !== undefined) transaction.amount = Number(amount);
        if (description !== undefined) transaction.description = description;
        if (date !== undefined) transaction.date = date;
        if (paymentMethod !== undefined) transaction.paymentMethod = paymentMethod;

        await transaction.save();

        const updatedTransaction = await Transaction.findById(id)
            .populate('category', 'name color icon type');

        return res.status(200).json({
            message: 'Movimiento actualizado correctamente',
            transaction: updatedTransaction
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Error al actualizar el movimiento',
            error: error.message
        });
    }
};

// Eliminar un movimiento
const deleteTransaction = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: 'Identificador inválido'
            });
        }

        const transaction = await Transaction.findByIdAndDelete(id);

        if (!transaction) {
            return res.status(404).json({
                message: 'Movimiento no encontrado'
            });
        }

        return res.status(200).json({
            message: 'Movimiento eliminado correctamente'
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Error al eliminar el movimiento',
            error: error.message
        });
    }
};

module.exports = {
    createTransaction,
    getTransactions,
    getTransactionById,
    updateTransaction,
    deleteTransaction
};
