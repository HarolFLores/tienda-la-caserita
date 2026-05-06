const Pedido = require('../models/Pedido');
const Usuario = require('../models/Usuario');

exports.createPedido = async (req, res) => {
    try {
        const { productos, total, metodoPago, direccionEnvio } = req.body;
        const usuarioId = req.usuario.id; // Viene del token middleware

        // Validaciones básicas
        if (!productos || productos.length === 0) {
            return res.status(400).json({ error: 'El pedido no tiene productos' });
        }
        if (!total) {
            return res.status(400).json({ error: 'Falta el total del pedido' });
        }
        if (!direccionEnvio) {
            return res.status(400).json({ error: 'Falta la dirección de envío' });
        }

        // Crear el pedido
        const nuevoPedido = new Pedido({
            usuario: usuarioId,
            productos,
            total,
            metodoPago,
            direccionEnvio
        });

        const pedidoGuardado = await nuevoPedido.save();

        res.status(201).json({ 
            message: 'Pedido creado exitosamente', 
            pedido: pedidoGuardado 
        });

    } catch (error) {
        console.error("Error al crear pedido:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.getMisPedidos = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const pedidos = await Pedido.find({ usuario: usuarioId }).sort({ fecha: -1 });
        res.json(pedidos);
    } catch (error) {
        console.error("Error al obtener pedidos:", error);
        res.status(500).json({ error: error.message });
    }
};
