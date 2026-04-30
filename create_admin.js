const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Usuario = require('./models/Usuario');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/BDTiendaCaserita';

async function crearAdmin() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ Conectado a MongoDB");

        const email = "admin@caserita.com";
        const password = "admin"; // Contraseña simple para pruebas

        // Verificar si ya existe
        const existe = await Usuario.findOne({ email });

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        if (existe) {
            console.log("⚠️ El usuario admin ya existía. Actualizando credenciales...");
            existe.password = passwordHash;
            existe.rol = 'admin';
            existe.verificado = true;
            existe.nombre = "Administrador Principal";
            await existe.save();
            console.log("✅ Usuario Admin actualizado correctamente.");
        } else {
            console.log("🆕 Creando nuevo usuario admin...");
            const admin = new Usuario({
                nombre: "Administrador Principal",
                email: email,
                password: passwordHash,
                rol: "admin",
                verificado: true,
                telefono: "999999999",
                direcciones: [{
                    titulo: "Oficina Central",
                    calle: "Av. Principal 123",
                    ciudad: "Lima",
                    referencia: "Sede Central"
                }]
            });
            await admin.save();
            console.log("✅ Usuario Admin creado exitosamente.");
        }

        console.log(`
=========================================
      CREDENCIALES DE ADMINISTRADOR      
=========================================
📧 Email:    ${email}
🔑 Password: ${password}
=========================================
        `);

        process.exit();

    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
}

crearAdmin();
