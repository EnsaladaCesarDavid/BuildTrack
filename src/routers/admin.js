const express = require('express');
const router = express.Router();
const db = require('../db/database');

router.post('/login-admin', async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
        }

        const [rows] = await db.execute(
            'SELECT id, nombre, password FROM administradores WHERE email = ?', 
            [email]
        );
        
        if (rows.length === 0 || rows[0].password !== password) {
            return res.status(401).json({ error: 'Correo electrónico o contraseña incorrectos.' });
        }

        req.session.isLoggedIn = true;
        req.session.user = {
            id: rows[0].id,
            nombre: rows[0].nombre,
            email: email,
            role: 'admin'
        };

        req.session.save((err) => {
            if (err) {
                return next(err);
            }
            
            res.status(200).json({ 
                mensaje: 'Inicio de sesión exitoso', 
                nombre: rows[0].nombre,
                role: 'admin'
            });
        });

    } catch (error) {
        next(error);
    }
});

router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'No se pudo cerrar la sesión' });
        }
        res.clearCookie('connect.sid');
        return res.status(200).json({ mensaje: 'Sesión cerrada exitosamente' });
    });
});

module.exports = router;