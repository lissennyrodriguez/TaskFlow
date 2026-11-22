
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

// Crear una categoría
const createCategory = async (req, res) => {
    try {
        const { name, type, color, icon } = req.body;

        if (!name?.trim() || !type) {
            return res.status(400).json({
                message: 'El nombre y el tipo son obligatorios'
            });
        }

        if (!['income', 'expense'].includes(type)) {
            return res.status(400).json({
                message: 'El tipo debe ser income o expense'
            });
        }

        const category = await Category.create({
            name: name.trim(),
            type,
            color,
            icon
        });

        return res.status(201).json({
            message: 'Categoría creada correctamente',
            category
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: 'Ya existe una categoría con ese nombre y tipo'
            });
        }

        return res.status(500).json({
            message: 'Error al crear la categoría',
            error: error.message
        });
    }
};

// Consultar categorías
const getCategories = async (req, res) => {
    try {
        const { type } = req.query;

        const filter = {};

        if (type) {
            if (!['income', 'expense'].includes(type)) {
                return res.status(400).json({
                    message: 'Tipo de categoría inválido'
                });
            }

            filter.type = type;
        }

        const categories = await Category.find(filter).sort({ name: 1 });

        return res.status(200).json(categories);
    } catch (error) {
        return res.status(500).json({
            message: 'Error al consultar las categorías',
            error: error.message
        });
    }
};

// Actualizar categoría
const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type, color, icon } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: 'Identificador de categoría inválido'
            });
        }

        if (name !== undefined && !name.trim()) {
            return res.status(400).json({
                message: 'El nombre no puede estar vacío'
            });
        }

        if (type !== undefined && !['income', 'expense'].includes(type)) {
            return res.status(400).json({
                message: 'Tipo de categoría inválido'
            });
        }

        const category = await Category.findById(id);

        if (!category) {
            return res.status(404).json({
                message: 'Categoría no encontrada'
            });
        }

        // Evitar cambiar el tipo si ya existen movimientos asociados
        if (type && type !== category.type) {
            const transactions = await Transaction.countDocuments({
                category: id
            });

            if (transactions > 0) {
                return res.status(409).json({
                    message: 'No puedes cambiar el tipo de una categoría que tiene movimientos asociados'
                });
            }
        }

        if (name !== undefined) category.name = name.trim();
        if (type !== undefined) category.type = type;
        if (color !== undefined) category.color = color;
        if (icon !== undefined) category.icon = icon;

        await category.save();

        return res.status(200).json({
            message: 'Categoría actualizada correctamente',
            category
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: 'Ya existe una categoría con ese nombre y tipo'
            });
        }

        return res.status(500).json({
            message: 'Error al actualizar la categoría',
            error: error.message
        });
    }
};

// Eliminar categoría
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: 'Identificador de categoría inválido'
            });
        }

        const category = await Category.findById(id);

        if (!category) {
            return res.status(404).json({
                message: 'Categoría no encontrada'
            });
        }

        const transactions = await Transaction.countDocuments({
            category: id
        });

        if (transactions > 0) {
            return res.status(409).json({
                message: 'No puedes eliminar una categoría que tiene movimientos asociados'
            });
        }

        await Category.findByIdAndDelete(id);

        return res.status(200).json({
            message: 'Categoría eliminada correctamente'
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Error al eliminar la categoría',
            error: error.message
        });
    }
};

module.exports = {
    createCategory,
    getCategories,
    updateCategory,
    deleteCategory
};
