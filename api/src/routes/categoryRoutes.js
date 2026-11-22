
const express = require('express');

const router = express.Router();

const {
    createCategory,
    getCategories,
    updateCategory,
    deleteCategory
} = require('../controllers/categoryController');

// Crear categoría
router.post('/', createCategory);

// Consultar categorías
router.get('/', getCategories);

// Actualizar categoría
router.put('/:id', updateCategory);

// Eliminar categoría
router.delete('/:id', deleteCategory);

module.exports = router;
