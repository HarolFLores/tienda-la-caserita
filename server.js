const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // Cargar variables de entorno

// --- CONFIGURACIÓN ---
const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/BDTiendaCaserita'; // Usa local si no hay nube definida

// --- MIDDLEWARE ---
app.use(cors()); // Permite que tu HTML se conecte al servidor
app.use(express.json()); // Permite recibir datos en formato JSON
app.use(express.static('../')); // <--- NUEVO: Sirve tus archivos HTML/CSS/JS desde aqui

// --- CONEXIÓN A BASE DE DATOS ---
mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ Conectado exitosamente a MongoDB: BDTiendaCaserita'))
    .catch(err => console.error('❌ Error conectando a MongoDB:', err));

// --- IMPORTAR MODELOS ---
const Producto = require('./models/Producto');
const Categoria = require('./models/Categoria');
const Usuario = require('./models/Usuario');
const Pedido = require('./models/Pedido');

// --- IMPORTAR RUTAS ---
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// --- RUTAS DE PRUEBA (API) ---

// 1. Obtener todos los productos
app.get('/api/productos', async (req, res) => {
    try {
        const productos = await Producto.find();
        res.json(productos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 2. Obtener sugerencias del día
app.get('/api/sugerencias', async (req, res) => {
    try {
        // Buscamos productos marcados como sugerencia
        const sugerencias = await Producto.find({ esSugerencia: true });
        res.json(sugerencias);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 2.5 Obtener todas las categorías
app.get('/api/categorias', async (req, res) => {
    try {
        const categorias = await Categoria.find();
        res.json(categorias);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 2.6 Crear Categoría
app.post('/api/categorias', async (req, res) => {
    try {
        const nuevaCat = new Categoria(req.body);
        await nuevaCat.save();
        res.status(201).json(nuevaCat);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// 2.6 Eliminar Categoria
app.delete('/api/categorias/:id', async (req, res) => {
    try {
        await Categoria.deleteOne({ id: req.params.id });
        res.json({ message: 'Categoría eliminada' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 2.6 Eliminar un producto
app.delete('/api/productos/:id', async (req, res) => {
    try {
        await Producto.deleteOne({ id: req.params.id });
        res.json({ message: 'Producto eliminado' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 3. Crear un nuevo producto (Para tu admin)
app.post('/api/productos', async (req, res) => {
    console.log("📥 Recibiendo producto:", req.body); // Log para debug

    try {
        const prod = new Producto({
            id: req.body.id || Date.now(),
            titulo: req.body.titulo,
            precio: req.body.precio,
            stock: req.body.stock,
            img: req.body.img,
            cat: req.body.cat,
            subcat: req.body.subcat, // Asegurar que subcat se guarde
            momento: req.body.momento,
            esSugerencia: req.body.esSugerencia || false
        });

        const nuevoProducto = await prod.save();
        console.log("✅ Producto guardado:", nuevoProducto.titulo);
        res.status(201).json(nuevoProducto);
    } catch (error) {
        console.error("❌ Error guardando producto:", error);
        res.status(400).json({ message: error.message });
    }
});

// --- INICIAR SERVIDOR ---
app.listen(PORT, () => {
    console.log(`🚀 Servidor backend escuchando en http://localhost:${PORT}`);
});
