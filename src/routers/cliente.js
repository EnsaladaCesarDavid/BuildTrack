const express = require('express');
const router = express.Router();
const db = require('../db/database');

router.post('/cliente/registro', async (req, res, next) => {
    try {
        const { nombre, email, telefono, password } = req.body;
        if (!nombre || !email || !telefono || !password) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios' });
        }

        const [existe] = await db.execute('SELECT id FROM clientes WHERE email = ?', [email]);
        if (existe.length > 0) {
            return res.status(400).json({ error: 'El correo ya está registrado como cliente' });
        }

        const [resultado] = await db.execute(
            'INSERT INTO clientes (nombre, email, telefono, password) VALUES (?, ?, ?, ?)',
            [nombre, email, telefono, password]
        );

        res.status(201).json({ mensaje: 'Cliente creado exitosamente', id: resultado.insertId });
    } catch (error) {
        next(error);
    }
});

module.exports = router;