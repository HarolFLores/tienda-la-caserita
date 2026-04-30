const mongoose = require('mongoose');

const pedidoSchema = new mongoose.Schema({
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    productos: [{
        productoId: { type: Number, required: true }, // ID numérico de tu producto
        titulo: String,
        cantidad: Number,
        precioUnitario: Number,
        subtotal: Number
    }],
    total: {
        type: Number,
        required: true
    },
    estado: {
        type: String,
        enum: ['pendiente', 'pagado', 'enviado', 'entregado'],
        default: 'pendiente'
    },
    metodoPago: {
        type: String
    },
    direccionEnvio: {
        type: String
    },
    fecha: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Pedido', pedidoSchema);
