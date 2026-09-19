const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: false 
    },
    rol: {
        type: String,
        enum: ['cliente', 'admin'],
        default: 'cliente'
    },
    telefono: { type: String },
    
    direcciones: [{
        titulo: { type: String, required: true }, 
        calle: { type: String, required: true },
        ciudad: { type: String, required: true },
        referencia: { type: String }
    }],
    fechaRegistro: {
        type: Date,
        default: Date.now
    },
    
    googleId: { type: String },
    verificado: { type: Boolean, default: false },
    tokenVerificacion: { type: String }
});

module.exports = mongoose.model('Usuario', usuarioSchema);

