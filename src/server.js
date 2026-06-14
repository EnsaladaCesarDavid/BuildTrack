const express = require('express');
const cors = require('cors');
const path = require('path'); // Mantener para el manejo seguro de carpetas físicas
const fs = require('fs'); 
const session = require('express-session');
const db = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares estándar
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Agregado para soportar envío de formularios extendidos

// 🌟 CONFIGURACIÓN CLAVE AÑADIDA: Servir la carpeta 'uploads' como estática
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Servir los archivos de la interfaz de usuario (Frontend) de la carpeta pública
app.use(express.static(path.join(__dirname, '..', 'public')));

// Configuración de Sesiones de tu ecosistema
app.use(session({
    secret: 'lic_cash',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Cambiar a true si usas HTTPS en producción
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 // 1 día de vigencia
    }
}));

// Importación de enrutadores del ecosistema BuildTrack
const adminRouter = require('./routers/admin');
const clienteRouter = require('./routers/cliente');
const proyectoRouter = require('./routers/proyecto');
const documentosRouter = require('./routers/documentos'); 

// 🌟 SOLUCIÓN GLOBAL DE CONEXIÓN:
app.use(async (req, res, next) => {
    try {
        await db.query('USE buildtrack_db;');
        next();
    } catch (err) {
        console.error('❌ Error en el interceptor de Base de Datos:', err.message);
        next();
    }
});

// =========================================================================
// 🚀 ENDPOINT CORRECTO: ACTUALIZAR MÉTRICAS Y CRONOGRAMA DE GESTIÓN (MySQL)
// =========================================================================
app.post('/api/proyectos/actualizar', async (req, res) => {
    console.log("📥 [BuildTrack API] Recibida solicitud para actualizar proyecto:", req.body);
    
    const { 
        id_proyecto, id, presupuesto, material, gastos, 
        cimentacion, muros, piso, 
        fecha_inicio, fecha_fin, fecha_salida, fecha_instalacion 
    } = req.body;

    // Captura el ID de forma segura sin importar cuál envíe el cliente
    const targetId = id_proyecto || id;

    if (!targetId) {
        console.log("❌ Error: No se proporcionó un ID de proyecto válido.");
        return res.status(400).json({ error: "No se proporcionó un ID de proyecto válido." });
    }

    try {
        // CORRECCIÓN CLAVE: Se cambió 'WHERE id = ?' por 'WHERE id_proyecto = ?'
        const queryActualizar = `
            UPDATE proyectos 
            SET 
                presupuesto = ?, 
                material = ?, 
                gastos = ?, 
                cimentacion = ?, 
                muros = ?, 
                piso = ?, 
                fecha_inicio = ?, 
                fecha_fin = ?, 
                fecha_salida = ?, 
                fecha_instalacion = ?
            WHERE id_proyecto = ?
        `;

        const valores = [
            presupuesto || 0,
            material || 0,
            gastos || 0,
            cimentacion || 0,
            muros || 0,
            piso || 0,
            fecha_inicio || null,
            fecha_fin || null,
            fecha_salida || null,
            fecha_instalacion || null,
            targetId
        ];

        const [resultado] = await db.query(queryActualizar, valores);

        if (resultado.affectedRows === 0) {
            console.log(`⚠️ No se encontró ningún proyecto con el id_proyecto: ${targetId}`);
            return res.status(404).json({ error: "El proyecto especificado no existe en la base de datos." });
        }

        console.log(`✅ ¡Proyecto ${targetId} actualizado con éxito en MySQL!`);
        return res.status(200).json({ message: "Proyecto actualizado con éxito." });

    } catch (error) {
        console.error("❌ Error interno al ejecutar UPDATE en MySQL:", error.message);
        return res.status(500).json({ error: "Error interno del servidor al procesar la actualización en MySQL: " + error.message });
    }
});
// =========================================================================

// Registro de Rutas de la API adicionales
app.use('/api', adminRouter);
app.use('/api', clienteRouter);
app.use('/api', proyectoRouter);
app.use('/api', documentosRouter); 

// Ruta raíz para servir el index.html principal (Login / bienvenida)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// MANEJADOR GLOBAL DE ERRORES
app.use((err, req, res, next) => {
    console.error('Error no controlado en el servidor:', err.stack || err.message || err);
    res.status(500).json({ error: 'Ocurrió un error interno en el servidor.' });
});

// Lógica de validación estructural inicial del script SQL nativo
async function inicializarBaseDeDatos() {
    try {
        await db.query('CREATE DATABASE IF NOT EXISTS buildtrack_db;');
        await db.query('USE buildtrack_db;');
        console.log('Conexión a buildtrack_db exitosa.');

        const rutaScript = path.join(__dirname, 'BuildTrack.sql');
        
        if (fs.existsSync(rutaScript)) {
            const contenidoSQL = fs.readFileSync(rutaScript, 'utf8');
            const consultas = contenidoSQL
                .split(';')
                .map(q => q.trim())
                .filter(q => q.length > 0);

            for (const consulta of consultas) {
                await db.query(consulta);
            }
            console.log('Estructura de tablas verificada/creada correctamente desde el script.');
        } else {
            console.log('Script BuildTrack.sql no encontrado en la raíz, omitiendo inicialización automática.');
        }
        
    } catch (error) {
        console.error('Error al inicializar la base de datos:', error.message);
    }
}

// Conexión y Arranque Oficial del Servidor
db.getConnection()
    .then(async (connection) => {
        console.log('Conexión exitosa al servidor MySQL.');
        connection.release();

        await inicializarBaseDeDatos(); 
        
        app.listen(PORT, () => {
            console.log(`Servidor corriendo en http://localhost:${PORT}`);
        });
    })
    .catch(error => {
        console.error('Error crítico al conectar a MySQL:', error.message);
    });