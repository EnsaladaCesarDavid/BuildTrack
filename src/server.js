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
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    fecha_fin: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    presupuesto: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
    },
    material: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
    },
    gastos: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
    },
    cimentacion: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
    },
    muros: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
    },
    piso: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
    },
    tipo_proyecto_id: {
        type: DataTypes.STRING,
        allowNull: false
    },
    fecha_salida: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    fecha_instalacion: {
        type: DataTypes.DATEONLY,
        allowNull: false
    }
});

async function generarIdUnicoProyecto() {
    let id;
    let existe = true;
    while (existe) {
        id = 'PROJ-' + Math.floor(10000 + Math.random() * 90000);
        const proyecto = await Proyecto.findByPk(id);
        if (!proyecto) {
            existe = false;
        }
    }
    return id;
}

app.post('/api/administrador/registro', async (req, res) => {
    try {
        const { nombre, email, password } = req.body;
        if (!nombre || !email || !password) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios' });
        }
        const existeAdmin = await Administrador.findOne({ where: { email } });
        if (existeAdmin) {
            return res.status(400).json({ error: 'El correo ya está registrado como administrador' });
        }
        const nuevoAdmin = await Administrador.create({ nombre, email, password });
        res.status(201).json({ mensaje: 'Administrador creado exitosamente', id: nuevoAdmin.id });
    } catch (error) {
        res.status(500).json({ error: 'Error interno al registrar administrador' });
    }
});

app.post('/api/cliente/registro', async (req, res) => {
    try {
        const { nombre, email, telefono, password } = req.body;
        if (!nombre || !email || !telefono || !password) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios' });
        }
        const existeCliente = await Cliente.findOne({ where: { email } });
        if (existeCliente) {
            return res.status(400).json({ error: 'El correo ya está registrado como cliente' });
        }
        const nuevoCliente = await Cliente.create({ nombre, email, telefono, password });
        res.status(201).json({ mensaje: 'Cliente creado exitosamente', id: nuevoCliente.id });
    } catch (error) {
        res.status(500).json({ error: 'Error interno al registrar cliente' });
    }
});

app.post('/api/proyecto/crear', async (req, res) => {
    try {
        const { nombre, fecha_inicio, fecha_fin, presupuesto, tipo_proyecto_id, fecha_salida, fecha_instalacion } = req.body;

        if (!nombre || !fecha_inicio || !fecha_fin || !presupuesto || !tipo_proyecto_id || !fecha_salida || !fecha_instalacion) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios, incluyendo la configuración de transporte.' });
        }

        const id_proyecto = await generarIdUnicoProyecto();

        const nuevoProyecto = await Proyecto.create({
            id_proyecto,
            nombre,
            fecha_inicio,
            fecha_fin,
            presupuesto,
            tipo_proyecto_id,
            fecha_salida,
            fecha_instalacion
        });

        res.status(201).json({ 
            mensaje: 'Proyecto creado exitosamente',
            id: nuevoProyecto.id_proyecto 
        });
    } catch (error) {
        res.status(500).json({ error: 'Error interno al crear el proyecto' });
    }
});

app.post('/api/proyectos/actualizar', async (req, res) => {
    try {
        const { id, presupuesto, material, gastos, cimentacion, muros, piso } = req.body;

        if (!id) {
            return res.status(400).json({ error: 'El identificador del proyecto es requerido.' });
        }

        const proyecto = await Proyecto.findByPk(id);
        if (!proyecto) {
            return res.status(404).json({ error: 'El proyecto solicitado no existe.' });
        }

        if (presupuesto <= 0 || material < 0 || gastos < 0) {
            return res.status(400).json({ error: 'Los montos financieros deben ser valores válidos mayores o iguales a cero.' });
        }

        if (cimentacion > 100 || muros > 100 || piso > 100 || cimentacion < 0 || muros < 0 || piso < 0) {
            return res.status(400).json({ error: 'Los porcentajes de desglose de obra no pueden exceder el 100% ni ser menores a 0.' });
        }

        if ((material + gastos) > presupuesto) {
            return res.status(400).json({ error: 'La suma de materiales y gastos excede el presupuesto total asignado.' });
        }

        await proyecto.update({
            presupuesto,
            material,
            gastos,
            cimentacion,
            muros,
            piso
        });

        return res.status(200).json({ mensaje: 'Proyecto actualizado con éxito en la base de datos.' });
    } catch (error) {
        return res.status(500).json({ error: 'Error interno del servidor al procesar la actualización del proyecto.' });
    }
});

app.get('/api/proyecto/:id', async (req, res) => {
    try {
        const proyecto = await Proyecto.findByPk(req.params.id);
        
        if (!proyecto) {
            return res.status(404).json({ error: 'El ID de proyecto no existe en el sistema.' });
        }
        
        return res.status(200).json(proyecto);
    } catch (error) {
        return res.status(500).json({ error: 'Error interno al consultar el proyecto' });
    }
});

sequelize.sync({ alter: true }).then(() => {
    app.listen(3000, () => {
        console.log('Servidor BuildTrack escuchando en http://localhost:3000');
    });
}).catch(error => {
    console.error('Error al sincronizar la base de datos:', error);
});