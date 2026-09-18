const router = require('express').Router();
const authController = require('../controllers/authController');
const verificarToken = require('../middleware/authMiddleware');

router.post('/register', authController.register);
router.post('/verify', authController.verifyEmail); 
router.post('/login', authController.login);
router.post('/google', authController.googleLogin);
router.post('/forgot-password', authController.forgotPassword); 
router.post('/verify-code', authController.verifyResetCode);   
router.post('/reset-password', authController.resetPassword);   
router.get('/me', verificarToken, authController.getMe);


router.post('/address', verificarToken, authController.addAddress);
router.put('/address/:addressId', verificarToken, authController.updateAddress); 
router.delete('/address/:addressId', verificarToken, authController.deleteAddress);
router.get('/orders', verificarToken, authController.getMyOrders);
router.put('/update-profile', verificarToken, authController.updateProfile);

module.exports = router;
