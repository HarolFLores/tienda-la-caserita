const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); 


const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/BDTiendaCaserita'; 


app.use(cors()); 
app.use(express.json()); 
app.use(express.static('../')); 


mongoose.connect(MONGO_URI)
    .then(() => console.log('✓ Conectado exitosamente a MongoDB: BDTiendaCaserita'))
    .catch(err => console.error('× Error conectando a MongoDB:', err));


const Producto = require('./models/Producto');
const Categoria = require('./models/Categoria');
const Usuario = require('./models/Usuario');
const Pedido = require('./models/Pedido');


const authRoutes = require('./routes/authRoutes');
const pedidoRoutes = require('./routes/pedidoRoutes');
app.use('/api/auth', authRoutes);
app.use('/api/pedidos', pedidoRoutes);




app.get('/api/productos', async (req, res) => {
    try {
        const productos = await Producto.find();
        res.json(productos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


app.get('/api/sugerencias', async (req, res) => {
    try {
        
        const sugerencias = await Producto.find({ esSugerencia: true });
        res.json(sugerencias);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


app.get('/api/categorias', async (req, res) => {
    try {
        const categorias = await Categoria.find();
        res.json(categorias);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


app.post('/api/categorias', async (req, res) => {
    try {
        const nuevaCat = new Categoria(req.body);
        await nuevaCat.save();
        res.status(201).json(nuevaCat);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});


app.delete('/api/categorias/:id', async (req, res) => {
    try {
        await Categoria.deleteOne({ id: req.params.id });
        res.json({ message: 'Categoría eliminada' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


app.delete('/api/productos/:id', async (req, res) => {
    try {
        await Producto.deleteOne({ id: req.params.id });
        res.json({ message: 'Producto eliminado' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


app.post('/api/productos', async (req, res) => {
    console.log("Recibir Recibiendo producto:", req.body); 

    try {
        const prod = new Producto({
            id: req.body.id || Date.now(),
            titulo: req.body.titulo,
            precio: req.body.precio,
            stock: req.body.stock,
            img: req.body.img,
            cat: req.body.cat,
            subcat: req.body.subcat, 
            momento: req.body.momento,
            esSugerencia: req.body.esSugerencia || false
        });

        const nuevoProducto = await prod.save();
        console.log("✓ Producto guardado:", nuevoProducto.titulo);
        res.status(201).json(nuevoProducto);
    } catch (error) {
        console.error("× Error guardando producto:", error);
        res.status(400).json({ message: error.message });
    }
});


app.listen(PORT, () => {
    console.log(`Inicio Servidor backend escuchando en http://localhost:${PORT}`);
});
