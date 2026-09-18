const Usuario = require('../models/Usuario');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const nodemailer = require('nodemailer');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});


exports.register = async (req, res) => {
    try {
        const { nombre, email, password, telefono } = req.body;

        const existe = await Usuario.findOne({ email });
        if (existe) return res.status(400).json({ error: 'El correo ya está registrado' });

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        
        const codigoVerificacion = Math.floor(100000 + Math.random() * 900000).toString();

        const usuario = new Usuario({
            nombre, email, password: passwordHash, telefono,
            tokenVerificacion: codigoVerificacion,
            verificado: false 
        });

        await usuario.save();

        
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


exports.verifyEmail = async (req, res) => {
    try {
        const { email, codigo } = req.body;
        const usuario = await Usuario.findOne({ email });

        if (!usuario) return res.status(400).json({ error: 'Usuario no encontrado' });
        if (usuario.tokenVerificacion !== codigo) return res.status(400).json({ error: 'Código incorrecto' });

        usuario.verificado = true;
        usuario.tokenVerificacion = null; 
        await usuario.save();

        
        const token = jwt.sign(
            { id: usuario._id, rol: usuario.rol, nombre: usuario.nombre },
            process.env.JWT_SECRET
        );

        res.json({ message: 'Cuenta verificada correctamente', token, usuario });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const usuario = await Usuario.findOne({ email });

        if (!usuario) return res.status(400).json({ error: 'Usuario no encontrado' });

        
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
            
            if (!usuario.googleId) {
                usuario.googleId = sub;
                await usuario.save();
            }
        } else {
            
            usuario = new Usuario({
                nombre: name,
                email: email,
                googleId: sub,
                verificado: true 
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


exports.getMe = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.usuario.id).select('-password');
        res.json(usuario);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const usuario = await Usuario.findOne({ email });

        if (!usuario) return res.status(404).json({ error: 'No existe usuario con ese correo' });

        
        const codigo = Math.floor(100000 + Math.random() * 900000).toString();
        usuario.tokenVerificacion = codigo; 
        await usuario.save();

        
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


exports.resetPassword = async (req, res) => {
    try {
        const { email, codigo, newPassword } = req.body;
        const usuario = await Usuario.findOne({ email });

        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
        if (usuario.tokenVerificacion !== codigo) return res.status(400).json({ error: 'Código incorrecto o expirado' });

        const salt = await bcrypt.genSalt(10);
        usuario.password = await bcrypt.hash(newPassword, salt);
        usuario.tokenVerificacion = null; 
        await usuario.save();

        res.json({ message: 'Contraseña actualizada exitosamente' });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.addAddress = async (req, res) => {
    console.log("Adding address. User:", req.usuario?.id);
    console.log("Payload:", req.body);

    try {
        const { titulo, calle, ciudad, referencia } = req.body;

        
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
            { new: true } 
        );

        if (!usuario) {
            
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


exports.updateProfile = async (req, res) => {
    console.log("Updating profile:", req.usuario.id);
    try {
        const { nombre, email, currentPassword, newPassword } = req.body;
        const usuario = await Usuario.findById(req.usuario.id);

        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

        
        if (nombre) usuario.nombre = nombre;
        if (email) usuario.email = email;

        
        if (newPassword && newPassword.trim() !== "") {
            if (!currentPassword) return res.status(400).json({ error: 'Debes ingresar tu contraseña actual para establecer una nueva' });

            const isMatch = await bcrypt.compare(currentPassword, usuario.password);
            if (!isMatch) return res.status(400).json({ error: 'La contraseña actual es incorrecta' });

            const salt = await bcrypt.genSalt(10);
            usuario.password = await bcrypt.hash(newPassword, salt);
        }

        await usuario.save();

        
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


exports.getMyOrders = async (req, res) => {
    
    res.json([]);
};

module.exports = exports;
