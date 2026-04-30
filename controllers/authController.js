const Usuario = require('../models/Usuario');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const nodemailer = require('nodemailer');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Configurar Nodemailer (Gmail)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// --- REGISTRO NORMAL ---
exports.register = async (req, res) => {
    try {
        const { nombre, email, password, telefono } = req.body;

        const existe = await Usuario.findOne({ email });
        if (existe) return res.status(400).json({ error: 'El correo ya está registrado' });

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Generar código simple de 6 dígitos para verificar
        const codigoVerificacion = Math.floor(100000 + Math.random() * 900000).toString();

        const usuario = new Usuario({
            nombre, email, password: passwordHash, telefono,
            tokenVerificacion: codigoVerificacion,
            verificado: false // Debe verificar correo primero
        });

        await usuario.save();

        // Enviar Correo
        await transporter.sendMail({
            from: '"Tienda La Caserita" <' + process.env.EMAIL_USER + '>',
            to: email,
            subject: 'Verifica tu cuenta - La Caserita',
            text: `Tu código de verificación es: ${codigoVerificacion}`,
            html: `<b>Bienvenido a La Caserita!</b><br>Tu código de verificación es: <h1>${codigoVerificacion}</h1>`
        });

        res.json({ message: 'Usuario registrado. Revisa tu correo para el código de verificación.' });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- VERIFICAR CÓDIGO ---
exports.verifyEmail = async (req, res) => {
    try {
        const { email, codigo } = req.body;
        const usuario = await Usuario.findOne({ email });

        if (!usuario) return res.status(400).json({ error: 'Usuario no encontrado' });
        if (usuario.tokenVerificacion !== codigo) return res.status(400).json({ error: 'Código incorrecto' });

        usuario.verificado = true;
        usuario.tokenVerificacion = null; // Limpiar código
        await usuario.save();

        // Auto-login al verificar
        const token = jwt.sign(
            { id: usuario._id, rol: usuario.rol, nombre: usuario.nombre },
            process.env.JWT_SECRET
        );

        res.json({ message: 'Cuenta verificada correctamente', token, usuario });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- LOGIN NORMAL ---
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const usuario = await Usuario.findOne({ email });

        if (!usuario) return res.status(400).json({ error: 'Usuario no encontrado' });

        // Si tiene password (no es solo google) verificamos
        if (!usuario.password) return res.status(400).json({ error: 'Este usuario usa Google Login' });

        const validPass = await bcrypt.compare(password, usuario.password);
        if (!validPass) return res.status(400).json({ error: 'Contraseña incorrecta' });

        if (!usuario.verificado) return res.status(400).json({ error: 'Cuenta no verificada. Revisa tu correo.' });

        const token = jwt.sign(
            { id: usuario._id, rol: usuario.rol, nombre: usuario.nombre },
            process.env.JWT_SECRET
        );

        res.json({ token, usuario });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- LOGIN CON GOOGLE ---
exports.googleLogin = async (req, res) => {
    try {
        const { token } = req.body;
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const { name, email, sub } = ticket.getPayload();

        let usuario = await Usuario.findOne({ email });

        if (usuario) {
            // Si ya existe, actualizamos su googleId si no lo tenía
            if (!usuario.googleId) {
                usuario.googleId = sub;
                await usuario.save();
            }
        } else {
            // Crear nuevo usuario verificado por defecto
            usuario = new Usuario({
                nombre: name,
                email: email,
                googleId: sub,
                verificado: true // Google ya verificó el email
            });
            await usuario.save();
        }

        const jwtToken = jwt.sign(
            { id: usuario._id, rol: usuario.rol, nombre: usuario.nombre },
            process.env.JWT_SECRET
        );

        res.json({ token: jwtToken, usuario });

    } catch (error) {
        res.status(400).json({ error: 'Error de Google Auth: ' + error.message });
    }
};

// --- MI PERFIL ---
exports.getMe = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.usuario.id).select('-password');
        res.json(usuario);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- OLVIDÉ MI CONTRASEÑA (Solicitar Código) ---
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const usuario = await Usuario.findOne({ email });

        if (!usuario) return res.status(404).json({ error: 'No existe usuario con ese correo' });

        // Generar código de recuperación
        const codigo = Math.floor(100000 + Math.random() * 900000).toString();
        usuario.tokenVerificacion = codigo; // Reusamos campo para simplicidad
        await usuario.save();

        // Enviar Correo
        await transporter.sendMail({
            from: '"Tienda La Caserita" <' + process.env.EMAIL_USER + '>',
            to: email,
            subject: 'Recuperar Contraseña - La Caserita',
            text: `Tu código de recuperación es: ${codigo}`,
            html: `<b>Recuperación de Contraseña</b><br>Usa este código para crear una nueva clave: <h1>${codigo}</h1>`
        });

        res.json({ message: 'Código de recuperación enviado a su correo' });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- VERIFICAR CÓDIGO (Paso intermedio) ---
exports.verifyResetCode = async (req, res) => {
    try {
        const { email, codigo } = req.body;
        const usuario = await Usuario.findOne({ email });

        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
        if (usuario.tokenVerificacion !== codigo) return res.status(400).json({ error: 'Código incorrecto' });

        res.json({ message: 'Código válido' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- CAMBIAR CONTRASEÑA (Con Código) ---
exports.resetPassword = async (req, res) => {
    try {
        const { email, codigo, newPassword } = req.body;
        const usuario = await Usuario.findOne({ email });

        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
        if (usuario.tokenVerificacion !== codigo) return res.status(400).json({ error: 'Código incorrecto o expirado' });

        const salt = await bcrypt.genSalt(10);
        usuario.password = await bcrypt.hash(newPassword, salt);
        usuario.tokenVerificacion = null; // Limpiar código tras uso
        await usuario.save();

        res.json({ message: 'Contraseña actualizada exitosamente' });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- GESTIÓN DE DIRECCIONES ---
exports.addAddress = async (req, res) => {
    console.log("Adding address. User:", req.usuario?.id);
    console.log("Payload:", req.body);

    try {
        const { titulo, calle, ciudad, referencia } = req.body;

        // Validación básica
        if (!titulo || !calle) {
            console.log("Missing fields");
            return res.status(400).json({ error: 'Título y calle son obligatorios' });
        }

        const usuario = await Usuario.findById(req.usuario.id);
        if (!usuario) {
            console.error("User not found in DB");
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        usuario.direcciones.push({ titulo, calle, ciudad, referencia });
        await usuario.save();
        console.log("Address saved successfully");

        res.json({ message: 'Dirección agregada', direcciones: usuario.direcciones });
    } catch (error) {
        console.error("Error adding address:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.updateAddress = async (req, res) => {
    try {
        const { addressId } = req.params;
        const { titulo, calle, ciudad, referencia } = req.body;

        // Usamos findOneAndUpdate con el operador posicional $ para actualizaciones atómicas
        // Esto evita errores de versión (__v) y condiciones de carrera
        const usuario = await Usuario.findOneAndUpdate(
            { "_id": req.usuario.id, "direcciones._id": addressId },
            {
                "$set": {
                    "direcciones.$.titulo": titulo,
                    "direcciones.$.calle": calle,
                    "direcciones.$.ciudad": ciudad,
                    "direcciones.$.referencia": referencia
                }
            },
            { new: true } // Retornar el usuario actualizado
        );

        if (!usuario) {
            // Si retorna null, puede ser que el usuario no exista O la dirección no coincida
            return res.status(404).json({ error: 'Usuario o dirección no encontrados' });
        }

        res.json({ message: 'Dirección actualizada', direcciones: usuario.direcciones });
    } catch (error) {
        console.error("Error updateAddress:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.deleteAddress = async (req, res) => {
    try {
        const { addressId } = req.params;
        const usuario = await Usuario.findById(req.usuario.id);

        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

        usuario.direcciones = usuario.direcciones.filter(d => d._id.toString() !== addressId);
        await usuario.save();

        res.json({ message: 'Dirección eliminada', direcciones: usuario.direcciones });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- ACTUALIZAR PERFIL ---
exports.updateProfile = async (req, res) => {
    console.log("Updating profile:", req.usuario.id);
    try {
        const { nombre, email, currentPassword, newPassword } = req.body;
        const usuario = await Usuario.findById(req.usuario.id);

        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

        // Actualizar datos básicos
        if (nombre) usuario.nombre = nombre;
        if (email) usuario.email = email;

        // Cambiar contraseña si se solicita
        if (newPassword && newPassword.trim() !== "") {
            if (!currentPassword) return res.status(400).json({ error: 'Debes ingresar tu contraseña actual para establecer una nueva' });

            const isMatch = await bcrypt.compare(currentPassword, usuario.password);
            if (!isMatch) return res.status(400).json({ error: 'La contraseña actual es incorrecta' });

            const salt = await bcrypt.genSalt(10);
            usuario.password = await bcrypt.hash(newPassword, salt);
        }

        await usuario.save();

        // Generar nuevo token con datos actualizados
        const token = jwt.sign(
            { id: usuario._id, rol: usuario.rol, nombre: usuario.nombre },
            process.env.JWT_SECRET
        );

        res.json({ message: 'Perfil actualizado exitosamente', usuario, token });

    } catch (error) {
        console.error("Error updateProfile:", error);
        res.status(500).json({ error: error.message });
    }
};

// --- PEDIDOS (Placeholder) ---
exports.getMyOrders = async (req, res) => {
    // Retornamos array vacío
    res.json([]);
};

module.exports = exports;
