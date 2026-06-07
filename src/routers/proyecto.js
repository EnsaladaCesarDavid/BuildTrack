const express = require('express');
const router = express.Router();
const db = require('../db/database');

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

router.post('/proyecto/crear', async (req, res, next) => {
    try {
        const { nombre, fecha_inicio, fecha_fin, presupuesto, tipo_proyecto_id, fecha_salida, fecha_instalacion } = req.body;
        if (!nombre || !fecha_inicio || !fecha_fin || !presupuesto || !tipo_proyecto_id || !fecha_salida || !fecha_instalacion) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
        }

        const id_proyecto = await generarIdUnicoProyecto();

        await db.execute(
            `INSERT INTO proyectos (id_proyecto, nombre, fecha_inicio, fecha_fin, presupuesto, tipo_proyecto_id, fecha_salida, fecha_instalacion) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [id_proyecto, nombre, fecha_inicio, fecha_fin, presupuesto, tipo_proyecto_id, fecha_salida, fecha_instalacion]
        );

        res.status(201).json({ mensaje: 'Proyecto creado exitosamente', id: id_proyecto });
    } catch (error) {
        next(error);
    }
});

router.post('/proyectos/actualizar', async (req, res, next) => {
    try {
        const { id, presupuesto, material, gastos, cimentacion, muros, piso } = req.body;
        if (!id) return res.status(400).json({ error: 'El identificador del proyecto es requerido.' });
        
        const [rows] = await db.execute('SELECT * FROM proyectos WHERE id_proyecto = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ error: 'El proyecto solicitado no existe.' });

        const numPresupuesto = parseFloat(presupuesto);
        const numMaterial = parseFloat(material);
        const numGastos = parseFloat(gastos);
        const numCimentacion = parseFloat(cimentacion);
        const numMuros = parseFloat(muros);
        const numPiso = parseFloat(piso);

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

router.get('/proyecto/:id', async (req, res, next) => {
    try {
        const [rows] = await db.execute('SELECT * FROM proyectos WHERE id_proyecto = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'El ID de proyecto no existe.' });
        
        return res.status(200).json(rows[0]);
    } catch (error) {
        next(error);
    }
});

module.exports = router;