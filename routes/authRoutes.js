const router = require('express').Router();
const authController = require('../controllers/authController');
const verificarToken = require('../middleware/authMiddleware');

router.post('/register', authController.register);
router.post('/verify', authController.verifyEmail); // Nuevo: verificar código
router.post('/login', authController.login);
router.post('/google', authController.googleLogin);
router.post('/forgot-password', authController.forgotPassword); // Nuevo
router.post('/verify-code', authController.verifyResetCode);   // Nuevo: Validar paso intermedio
router.post('/reset-password', authController.resetPassword);   // Nuevo
router.get('/me', verificarToken, authController.getMe);

// Rutas de Usuario (Direcciones, Pedidos, Perfil)
router.post('/address', verificarToken, authController.addAddress);
router.put('/address/:addressId', verificarToken, authController.updateAddress); // Nuevo: Editar
router.delete('/address/:addressId', verificarToken, authController.deleteAddress);
router.get('/orders', verificarToken, authController.getMyOrders);
router.put('/update-profile', verificarToken, authController.updateProfile);

module.exports = router;
