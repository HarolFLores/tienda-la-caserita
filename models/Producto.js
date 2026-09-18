const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema({
    id: {
        type: Number,
        unique: true,
        required: true
        
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
    
    cat: { 
        type: String,
        ref: 'Categoria'
    },
    subcat: { 
        type: String
    },
    momento: { 
        type: String
    },

    
    esSugerencia: { 
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('Producto', productoSchema);
