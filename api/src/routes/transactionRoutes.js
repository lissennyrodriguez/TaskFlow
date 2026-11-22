
const express = require('express');

const router = express.Router();

const {
    createTransaction,
    getTransactions,
    getTransactionById,
    updateTransaction,
    deleteTransaction
} = require('../controllers/transactionController');

// Registrar un gasto o ingreso
router.post('/', createTransaction);

// Consultar todos los movimientos
router.get('/', getTransactions);

// Consultar un movimiento específico
router.get('/:id', getTransactionById);

// Actualizar un movimiento
router.put('/:id', updateTransaction);

// Eliminar un movimiento
router.delete('/:id', deleteTransaction);

module.exports = router;
