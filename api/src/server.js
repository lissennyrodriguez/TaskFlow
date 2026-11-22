
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config({ path: '../.env' });

// Importar rutas
const categoryRoutes = require('./routes/categoryRoutes');
const transactionRoutes = require('./routes/transactionRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas principales
app.use('/api/categories', categoryRoutes);
app.use('/api/transactions', transactionRoutes);

// Ruta de prueba
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'TaskFlow API',
        database: mongoose.connection.readyState === 1
            ? 'connected'
            : 'disconnected'
    });
});

// Conectar MongoDB e iniciar servidor
async function startServer() {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error('La variable MONGO_URI no está configurada');
        }

        await mongoose.connect(process.env.MONGO_URI);

        console.log('MongoDB conectado correctamente');

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`TaskFlow API ejecutándose en el puerto ${PORT}`);
        });

    } catch (error) {
        console.error('Error al iniciar TaskFlow:', error.message);
        process.exit(1);
    }
}

startServer();
