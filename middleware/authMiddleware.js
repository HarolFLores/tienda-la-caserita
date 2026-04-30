const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
    const cabecera = req.header('Authorization');
    if (!cabecera) return res.status(401).json({ error: 'Acceso denegado, falta token' });

    try {
        const token = cabecera.split(" ")[1]; // "Bearer TOKEN"
        const verificado = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = verificado;
        next();
    } catch (error) {
        res.status(400).json({ error: 'Token inválido' });
    }
};

module.exports = verificarToken;
