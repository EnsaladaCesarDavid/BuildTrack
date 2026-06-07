const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db/database');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = './uploads/pdfs';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Formato inválido. Solo se permiten archivos .pdf'), false);
    }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

router.post('/proyectos/:id_proyecto/documento', upload.single('pdf_contrato'), async (req, res) => {
    try {
        const { id_proyecto } = req.params;
        const { nombre_contrato, fecha_firma, vigencia } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: 'Es obligatorio subir un archivo PDF.' });
        }

        // Insertar en la Base de Datos
        const [resultado] = await db.execute(
            `INSERT INTO documentos_proyecto 
            (id_proyecto, nombre_contrato, fecha_firma, vigencia, archivo_nombre_original, archivo_ruta) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [id_proyecto, nombre_contrato, fecha_firma, vigencia, req.file.originalname, req.file.path]
        );

        res.status(201).json({ 
            mensaje: 'Documento subido y vinculado con éxito', 
            id_documento: resultado.insertId 
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno al procesar el archivo' });
    }
});

router.put('/documento/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre_contrato, fecha_firma, vigencia } = req.body;

        await db.execute(
            `UPDATE documentos_proyecto 
             SET nombre_contrato = ?, fecha_firma = ?, vigencia = ? 
             WHERE id = ?`,
            [nombre_contrato, fecha_firma, vigencia, id]
        );

        res.status(200).json({ mensaje: 'Metadatos del documento actualizados con éxito' });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el documento' });
    }
});

router.get('/proyectos/:id_proyecto/documentos', async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT id, nombre_contrato, fecha_firma, vigencia, archivo_nombre_original FROM documentos_proyecto WHERE id_proyecto = ?',
            [req.params.id_proyecto]
        );
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener documentos' });
    }
});

router.get('/documento/:id/descargar', async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT archivo_ruta, archivo_nombre_original FROM documentos_proyecto WHERE id = ?',
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'El archivo solicitado no existe.' });
        }

        const { archivo_ruta, archivo_nombre_original } = rows[0];
        
        if (!fs.existsSync(archivo_ruta)) {
            return res.status(404).json({ error: 'El archivo físico fue eliminado del servidor.' });
        }

        res.download(archivo_ruta, archivo_nombre_original);

    } catch (error) {
        res.status(500).json({ error: 'Error al procesar la descarga' });
    }
});

module.exports = router;