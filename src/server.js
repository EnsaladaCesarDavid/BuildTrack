const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: false
});

const Administrador = sequelize.define('Administrador', {
    nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

const Cliente = sequelize.define('Cliente', {
    nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    telefono: {
        type: DataTypes.STRING,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

const Proyecto = sequelize.define('Proyecto', {
    id_proyecto: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    fecha_inicio: {
        type: DataTypes.STRING,
        allowNull: false
    },
    fecha_fin: {
        type: DataTypes.STRING,
        allowNull: false
    },
    presupuesto: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

async function generarIdUnicoProyecto() {
    let idGenerado = Math.floor(10000000 + Math.random() * 90000000).toString();
    const existeID = await Proyecto.findByPk(idGenerado);
    if (existeID) {
        return await generarIdUnicoProyecto();
    }
    return idGenerado;
}

sequelize.sync()
    .then(() => console.log('Bases de datos sincronizadas de forma correcta.'))
    .catch(err => console.error('Error al sincronizar bases de datos:', err));

app.post('/api/registro-admin', async (req, res) => {
    try {
        const { nombre, email, password } = req.body;
        const nuevoAdmin = await Administrador.create({ nombre, email, password });
        res.status(201).json({ mensaje: 'Administrador registrado con éxito', id: nuevoAdmin.id });
    } catch (error) {
        res.status(400).json({ error: 'El correo ya se encuentra registrado o los datos son inválidos' });
    }
});

app.post('/api/login-admin', async (req, res) => {
    try {
        const { email, password } = req.body;
        const admin = await Administrador.findOne({ where: { email } });

        if (!admin || admin.password !== password) {
            return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
        }

        res.status(200).json({ mensaje: 'Inicio de sesión exitoso', nombre: admin.nombre });
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.post('/api/registro-cliente', async (req, res) => {
    try {
        const { nombre, email, telefono, password } = req.body;
        const nuevoCliente = await Cliente.create({ nombre, email, telefono, password });
        res.status(201).json({ mensaje: 'Cliente registrado con éxito', id: nuevoCliente.id });
    } catch (error) {
        res.status(400).json({ error: 'El correo ya se encuentra registrado o los datos son inválidos' });
    }
});

app.post('/api/login-cliente', async (req, res) => {
    try {
        const { email, password } = req.body;
        const cliente = await Cliente.findOne({ where: { email } });

        if (!cliente || cliente.password !== password) {
            return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
        }

        res.status(200).json({ mensaje: 'Inicio de sesión exitoso', nombre: cliente.nombre });
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.post('/api/crear-proyecto', async (req, res) => {
    try {
        const { nombre, fecha_inicio, fecha_fin, presupuesto } = req.body;

        if (!nombre || !fecha_inicio || !fecha_fin || !presupuesto) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios' });
        }

        const id_proyecto = await generarIdUnicoProyecto();

        const nuevoProyecto = await Proyecto.create({
            id_proyecto,
            nombre,
            fecha_inicio,
            fecha_fin,
            presupuesto
        });

        res.status(201).json({ 
            mensaje: 'Proyecto creado exitosamente', 
            id: nuevoProyecto.id_proyecto 
        });
    } catch (error) {
        res.status(500).json({ error: 'Error interno al crear el proyecto' });
    }
});

app.get('/api/proyecto/:id', async (req, res) => {
    try {
        const proyecto = await Proyecto.findByPk(req.params.id);
        
        if (!proyecto) {
            return res.status(404).json({ error: 'El ID de proyecto no existe en el sistema.' });
        }
        
        return res.status(200).json({ nombre: proyecto.nombre });
    } catch (error) {
        return res.status(500).json({ error: 'Error interno al consultar la base de datos.' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor BuildTrack corriendo en http://localhost:${PORT}`);
});