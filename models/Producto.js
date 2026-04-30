const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema({
    id: {
        type: Number,
        unique: true,
        required: true
        // Mantenemos tu ID numérico original para compatibilidad
    },
    titulo: {
        type: String,
        required: true
    },
    precio: {
        type: Number,
        required: true
    },
    stock: {
        type: Number,
        default: 0
    },
    img: {
        type: String,
        default: 'https://via.placeholder.com/150'
    },
    // Clasificación
    cat: { // ID de la categoría (ej: 'carnes', 'lacteos')
        type: String,
        ref: 'Categoria'
    },
    subcat: { // Subcategoría (ej: 'carnes_aves')
        type: String
    },
    momento: { // (ej: 'almuerzo', 'desayuno') - Puede ser null si es producto general
        type: String
    },

    // Flags especiales
    esSugerencia: { // Si es true, aparece en "Sugerencias del día"
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('Producto', productoSchema);
