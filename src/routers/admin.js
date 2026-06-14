const express = require('express');
const router = express.Router();
const db = require('../db/database');

// RUTA: Inicio de Sesión de Administradores
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

        // REGENERACIÓN DE SESIÓN (Protección Clave): 
        // Borra cualquier rastro o basura de cookies del usuario anterior (ej: Daniel) antes de asignar al nuevo (ej: Gael)
        req.session.regenerate((err) => {
            if (err) return next(err);

            // Asignamos las variables limpias a la nueva sesión
            req.session.isLoggedIn = true;
            req.session.user = {
                id: rows[0].id,
                nombre: rows[0].nombre,
                email: email,
                role: 'admin'
            };

            // MENSAJE DE CONTROL EN CONSOLA (Para Debugging del Desarrollador)
            console.log(`[BuildTrack Auth] ¡Sesión Guardada Exitosamente! Admin Logueado: ${rows[0].nombre} (ID: ${rows[0].id})`);

            req.session.save((saveErr) => {
                if (saveErr) return next(saveErr);
                res.status(200).json({ 
                    mensaje: 'Inicio de sesión exitoso', 
                    nombre: rows[0].nombre,
                    role: 'admin'
                });
            });
        });

    } catch (error) {
        next(error);
    }
});

// RUTA: Registro de Administradores (Modificada únicamente con la validación cruzada)
router.post('/admin/registro', async (req, res, next) => {
    try {
        const { nombre, email, password } = req.body;
        if (!nombre || !email || !password) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios' });
        }

        // 1. Validar que no exista en la tabla de administradores
        const [existe] = await db.execute('SELECT id FROM administradores WHERE email = ?', [email]);
        if (existe.length > 0) {
            return res.status(400).json({ error: 'El correo ya está registrado como administrador' });
        }

        // 2. Validar que tampoco exista en la tabla de clientes (Protección agregada)
        const [existeCliente] = await db.execute('SELECT id FROM clientes WHERE email = ?', [email]);
        if (existeCliente.length > 0) {
            return res.status(400).json({ error: 'Este correo ya está siendo utilizado por un cliente registrado.' });
        }

        // Inserción segura si pasa ambas validaciones
        const [resultado] = await db.execute(
            'INSERT INTO administradores (nombre, email, password) VALUES (?, ?, ?)',
            [nombre, email, password]
        );

        res.status(201).json({ mensaje: 'Administrador creado exitosamente', id: resultado.insertId });
    } catch (error) {
        next(error);
    }
});

// RUTA: Cierre de Sesión Completo
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'No se pudo cerrar la sesión' });
        }
        // Limpiamos la cookie del navegador para dejar el sistema 100% en ceros
        res.clearCookie('connect.sid'); 
        res.status(200).json({ mensaje: 'Sesión destruida y cerrada correctamente.' });
    });
});

module.exports = router;