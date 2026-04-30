const mongoose = require('mongoose');

const categoriaSchema = new mongoose.Schema({
    id: { // El ID string que usas (ej: 'carnes')
        type: String,
        required: true,
        unique: true
    },
    nombre: {
        type: String,
        required: true
    },
    desc: {
        type: String
    },
    img: {
        type: String
    }
});

module.exports = mongoose.model('Categoria', categoriaSchema);
