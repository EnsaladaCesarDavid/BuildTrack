const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db/database');

// Resolver la ruta de uploads de forma ABSOLUTA desde la raíz del proyecto
const carpetaUploads = path.resolve(__dirname, '../../uploads');

if (!fs.existsSync(carpetaUploads)){
    fs.mkdirSync(carpetaUploads, { recursive: true });
    console.log("📁 Carpeta 'uploads/' verificada en:", carpetaUploads);
}

// Configurar almacenamiento físico absoluto para guardar los archivos PDF
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, carpetaUploads);
    },
    filename: (req, file, cb) => {
        const sufijoUnico = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'expediente-' + sufijoUnico + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Tipo de archivo no permitido. Solo se aceptan PDFs.'), false);
    }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

// Asegurar estructura limpia al iniciar y forzar uso de la base de datos
setTimeout(async () => {
    try {
        await db.query(`USE buildtrack_db;`); 
        await db.query(`
            CREATE TABLE IF NOT EXISTS documentos_proyecto (
                id_documento INT AUTO_INCREMENT PRIMARY KEY,
                id_proyecto VARCHAR(50) NOT NULL,
                nombre_contrato VARCHAR(255) NOT NULL,
                fecha_firma DATE,
                vigencia DATE,
                ruta_archivo VARCHAR(255) NOT NULL,
                archivo_nombre_original VARCHAR(255) NOT NULL,
                fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("⚙️ Tabla 'documentos_proyecto' lista y sincronizada.");
    } catch (err) {
        console.error("❌ Error inicializando tabla:", err.message);
    }
}, 500);


// --- ENDPOINT: SUBIR ARCHIVO PDF Y REGISTRAR ---
router.post('/documento/subir', upload.single('pdf_contrato'), async (req, res) => {
    try {
        const { id_proyecto, nombre_contrato, fecha_firma, vigencia } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: 'No se recibió ningún archivo PDF válido.' });
        }

        const rutaArchivoPublica = 'uploads/' + req.file.filename;
        const nombreOriginal = req.file.originalname;

        await db.query(`USE buildtrack_db;`); 

        const query = `
            INSERT INTO documentos_proyecto (id_proyecto, nombre_contrato, fecha_firma, vigencia, ruta_archivo, archivo_nombre_original)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        await db.query(query, [
            id_proyecto, 
            nombre_contrato, 
            fecha_firma || null, 
            vigencia || null, 
            rutaArchivoPublica,
            nombreOriginal
        ]);

        return res.status(201).json({ mensaje: 'Documento subido y registrado exitosamente.' });

    } catch (error) {
        console.error("❌ ERROR CRÍTICO EN EL ENDPOINT DE SUBIDA:", error);
        return res.status(500).json({ 
            error: 'Fallo interno en el servidor.',
            detalle: error.message 
        });
    }
});

// --- ENDPOINT: ENCONTRAR TODOS LOS DOCUMENTOS (Sincronizado con el Frontend) ---
router.get('/documentos-proyecto/:id_proyecto', async (req, res) => {
    try {
        let idProyecto = req.params.id_proyecto;
        
        if (idProyecto && typeof idProyecto === 'string') {
            idProyecto = idProyecto.replace(/['"]/g, '').trim();
        }

        await db.query(`USE buildtrack_db;`); 

        const query = `
            SELECT 
                id_documento, 
                id_proyecto, 
                nombre_contrato, 
                fecha_firma, 
                vigencia, 
                ruta_archivo,
                ruta_archivo AS archivo_ruta,
                archivo_nombre_original,
                fecha_registro 
            FROM documentos_proyecto 
            WHERE id_proyecto = ? 
            ORDER BY fecha_registro DESC
        `;
        
        const [documentos] = await db.query(query, [idProyecto]);
        return res.json(documentos);

    } catch (error) {
        console.error("❌ Error consultando documentos:", error);
        return res.status(500).json({ error: 'Error al consultar la base de datos.' });
    }
});

module.exports = router;