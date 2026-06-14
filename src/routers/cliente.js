const express = require('express');
const router = express.Router();
const db = require('../db/database');

router.post('/login-cliente', async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
        }

        const [rows] = await db.execute(
            'SELECT id, nombre, password FROM clientes WHERE email = ?', 
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
            role: 'cliente'
        };

        req.session.save((err) => {
            if (err) {
                return next(err);
            }
            
            res.status(200).json({ 
                mensaje: 'Inicio de sesión exitoso', 
                nombre: rows[0].nombre,
                role: 'cliente'
            });
        });

    } catch (error) {
        next(error);
    }
});

// RUTA: Registro de Clientes con validaciones estrictas
router.post('/cliente/registro', async (req, res, next) => {
    try {
        const { nombre, email, telefono, password } = req.body;
        if (!nombre || !email || !telefono || !password) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios' });
        }

        // 1. Validar formato del teléfono (10 dígitos exactos)
        const telefonoLimpio = telefono.replace(/\s+/g, '');
        if (!/^\d{10}$/.test(telefonoLimpio)) {
            return res.status(400).json({ error: 'El número telefónico debe tener exactamente 10 dígitos numéricos.' });
        }

        // 2. Validar correo duplicado en clientes
        const [existe] = await db.execute('SELECT id FROM clientes WHERE email = ?', [email]);
        if (existe.length > 0) {
            return res.status(400).json({ error: 'El correo ya está registrado como cliente' });
        }

        // 3. Validar correo duplicado en administradores
        const [existeAdmin] = await db.execute('SELECT id FROM administradores WHERE email = ?', [email]);
        if (existeAdmin.length > 0) {
            return res.status(400).json({ error: 'Este correo pertenece a una cuenta de administrador y no puede usarse aquí.' });
        }

        // 4. Validar teléfono duplicado en clientes
        const [existeTelefono] = await db.execute('SELECT id FROM clientes WHERE telefono = ?', [telefonoLimpio]);
        if (existeTelefono.length > 0) {
            return res.status(400).json({ error: 'Este número telefónico ya está registrado con otro cliente.' });
        }

        // Inserción segura
        const [resultado] = await db.execute(
            'INSERT INTO clientes (nombre, email, telefono, password) VALUES (?, ?, ?, ?)',
            [nombre, email, telefonoLimpio, password]
        );

        res.status(201).json({ mensaje: 'Cliente creado exitosamente', id: resultado.insertId });
    } catch (error) {
        next(error);
    }
});

router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'No se pudo cerrar la sesión' });
        }
        res.status(200).json({ mensaje: 'Sesión cerrada exitosamente' });
    });
});

module.exports = router;