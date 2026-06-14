const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Función interna existente para generar IDs únicos (MANTENIDA INTACTA)
async function generarIdUnicoProyecto() {
    let id;
    let existe = true;
    while (existe) {
        id = 'PROJ-' + Math.floor(10000 + Math.random() * 90000);
        const [rows] = await db.execute('SELECT id_proyecto FROM proyectos WHERE id_proyecto = ?', [id]);
        if (rows.length === 0) {
            existe = false;
        }
    }
    return id;
}

// RUTA GLOBAL: Obtener SOLAMENTE los proyectos del Administrador Logueado (MANTENIDA INTACTA)
router.get('/proyectos/mis-proyectos', async (req, res, next) => {
    try {
        if (!req.session.isLoggedIn || !req.session.user || !req.session.user.id) {
            return res.status(401).json({ error: 'Inicie sesión para visualizar sus proyectos.' });
        }

        const administrador_id = req.session.user.id;
        console.log(`[BuildTrack API] Administrador con ID #${administrador_id} solicitó sus proyectos.`);

        const [rows] = await db.execute(
            'SELECT id_proyecto, nombre, fecha_inicio, fecha_fin, presupuesto, administrador_id FROM proyectos WHERE administrador_id = ?',
            [administrador_id]
        );

        return res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
});

// RUTA: Registrar un nuevo proyecto desde el Panel de Administración (MANTENIDA INTACTA)
router.post('/proyecto/crear', async (req, res, next) => {
    try {
        if (!req.session.isLoggedIn || !req.session.user || !req.session.user.id) {
            return res.status(401).json({ error: 'No autorizado. Inicie sesión como administrador.' });
        }

        const { nombre, fecha_inicio, fecha_fin, presupuesto, tipo_proyecto_id, fecha_salida, fecha_instalacion } = req.body;

        if (!nombre || !fecha_inicio || !fecha_fin || !presupuesto || !tipo_proyecto_id || !fecha_salida || !fecha_instalacion) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios para dar de alta el proyecto.' });
        }

        const id_proyecto = await generarIdUnicoProyecto();
        const administrador_id = req.session.user.id;

        await db.execute(
            `INSERT INTO proyectos 
            (id_proyecto, nombre, fecha_inicio, fecha_fin, presupuesto, tipo_proyecto_id, fecha_salida, fecha_instalacion, administrador_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id_proyecto, nombre, fecha_inicio, fecha_fin, presupuesto, tipo_proyecto_id, fecha_salida, fecha_instalacion, administrador_id]
        );

        return res.status(201).json({ 
            mensaje: 'Proyecto creado exitosamente en el ecosistema BuildTrack.', 
            id_proyecto 
        });
    } catch (error) {
        next(error);
    }
});

// RUTA: Modificar métricas financieras y porcentajes físicos de avance (MANTENIDA INTACTA)
router.put('/proyecto/metricas/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { presupuesto, material, gastos, cimentacion, muros, piso } = req.body;

        const numPresupuesto = parseFloat(presupuesto) || 0;
        const numMaterial = parseFloat(material) || 0;
        const numGastos = parseFloat(gastos) || 0;
        const numCimentacion = parseFloat(cimentacion) || 0;
        const numMuros = parseFloat(muros) || 0;
        const numPiso = parseFloat(piso) || 0;

        if (numPresupuesto <= 0 || numMaterial < 0 || numGastos < 0) {
            return res.status(400).json({ error: 'Valores financieros inválidos.' });
        }
        if (numCimentacion > 100 || numMuros > 100 || numPiso > 100 || numCimentacion < 0 || numMuros < 0 || numPiso < 0) {
            return res.status(400).json({ error: 'Los porcentajes de desglose deben estar entre 0 y 100%.' });
        }
        if ((numMaterial + numGastos) > numPresupuesto) {
            return res.status(400).json({ error: 'La suma de materiales y gastos excede el presupuesto.' });
        }

        await db.execute(
            `UPDATE proyectos 
            SET presupuesto = ?, material = ?, gastos = ?, cimentacion = ?, muros = ?, piso = ? 
            WHERE id_proyecto = ?`,
            [numPresupuesto, numMaterial, numGastos, numCimentacion, numMuros, numPiso, id]
        );

        return res.status(200).json({ mensaje: 'Proyecto actualizado con éxito.' });
    } catch (error) {
        next(error);
    }
});

// RUTA: Obtener los detalles de un proyecto por su ID (MANTENIDA INTACTA)
router.get('/proyecto/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const [rows] = await db.execute('SELECT * FROM proyectos WHERE id_proyecto = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Proyecto no encontrado en los registros de BuildTrack.' });
        }

        return res.status(200).json(rows[0]);
    } catch (error) {
        next(error);
    }
});


// =========================================================================
// 🌟 RUTAS EXCLUSIVAS PARA EL CLIENTE (VINCULACIÓN ALFANUMÉRICA COMPLETA)
// =========================================================================

// 1️⃣ Enlazar un proyecto metiendo la clave alfanumérica (Ej: PROJ-62374)
router.post('/proyectos/vincular', async (req, res, next) => {
    try {
        // Validamos la sesión activa del usuario
        if (!req.session.isLoggedIn || !req.session.user || !req.session.user.id) {
            return res.status(401).json({ error: 'Debe iniciar sesión como cliente para vincular un proyecto.' });
        }

        const { clave_proyecto } = req.body;
        const cliente_id = req.session.user.id;

        if (!clave_proyecto) {
            return res.status(400).json({ error: 'La clave única del proyecto es obligatoria.' });
        }

        // Limpiamos espacios y pasamos a mayúsculas para evitar fallos tipográficos
        const claveLimpia = clave_proyecto.trim().toUpperCase();

        // Verificar si existe el proyecto en la base de datos
        const [proyecto] = await db.execute('SELECT id_proyecto, cliente_id FROM proyectos WHERE id_proyecto = ?', [claveLimpia]);
        if (proyecto.length === 0) {
            return res.status(404).json({ error: 'La clave introducida no coincide con ningún proyecto en BuildTrack.' });
        }

        // Evitar que el proyecto sea reclamado de forma duplicada o por otro usuario
        if (proyecto[0].cliente_id !== null) {
            if (proyecto[0].cliente_id === cliente_id) {
                return res.status(400).json({ error: 'Ya tienes este proyecto enlazado a tu cuenta actualmente.' });
            } else {
                return res.status(400).json({ error: 'Este proyecto ya se encuentra vinculado a otra cuenta de cliente.' });
            }
        }

        // Ligar el proyecto de forma definitiva al cliente en sesión asignando su cliente_id
        await db.execute('UPDATE proyectos SET cliente_id = ? WHERE id_proyecto = ?', [cliente_id, claveLimpia]);

        console.log(`[BuildTrack API] Proyecto ${claveLimpia} enlazado exitosamente al Cliente ID #${cliente_id}`);
        return res.status(200).json({ mensaje: '¡Proyecto enlazado con éxito a tu cuenta!' });
    } catch (error) {
        next(error);
    }
});

// 2️⃣ Obtener la sublista de proyectos pertenecientes al cliente logueado
router.get('/proyectos/mis-proyectos-cliente', async (req, res, next) => {
    try {
        if (!req.session.isLoggedIn || !req.session.user || !req.session.user.id) {
            return res.status(401).json({ error: 'No autorizado. Su sesión ha expirado.' });
        }

        const cliente_id = req.session.user.id;

        // Trae los proyectos filtrados de manera segura por la llave foránea cliente_id
        const [rows] = await db.execute(
            'SELECT id_proyecto, nombre, fecha_inicio, fecha_fin FROM proyectos WHERE cliente_id = ?',
            [cliente_id]
        );

        return res.status(200).json(rows);
    } catch (error) {
        next(error);
    }
});

module.exports = router;