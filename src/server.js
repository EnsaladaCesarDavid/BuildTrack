const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs'); 
const session = require('express-session');
const db = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use(session({
    secret: 'lic_cash',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24
    }
}));

const adminRouter = require('./routers/admin');
const clienteRouter = require('./routers/cliente');
const proyectoRouter = require('./routers/proyecto');

app.use('/api', adminRouter);
app.use('/api', clienteRouter);
app.use('/api', proyectoRouter);

async function inicializarBaseDeDatos() {
    try {
        await db.query('CREATE DATABASE IF NOT EXISTS buildtrack_db;');
        
        await db.query('USE buildtrack_db;');
        console.log('Conexión a buildtrack_db exitosa.');

        const rutaScript = path.join(__dirname, 'Script BuildTrack.sql');
        
        if (fs.existsSync(rutaScript)) {
            const contenidoSQL = fs.readFileSync(rutaScript, 'utf8');
            await db.query(contenidoSQL);
            console.log('Estructura de tablas verificada/creada correctamente desde el script.');
        } else {
            console.log('Script BuildTrack.sql no encontrado en la raíz, omitiendo inicialización automática.');
        }
        
    } catch (error) {
        console.error('Error al inicializar la base de datos:', error.message);
    }
}

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