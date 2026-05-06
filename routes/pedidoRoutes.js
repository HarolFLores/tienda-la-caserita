const router = require('express').Router();
const pedidoController = require('../controllers/pedidoController');
const verificarToken = require('../middleware/authMiddleware');

router.post('/', verificarToken, pedidoController.createPedido);
router.get('/', verificarToken, pedidoController.getMisPedidos);

module.exports = router;
