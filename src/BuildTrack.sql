-- Asegura que NO borre la base de datos si ya existe
CREATE DATABASE IF NOT EXISTS buildtrack_db;
USE buildtrack_db;

-- Usa siempre "IF NOT EXISTS" para que respete los datos existentes
CREATE TABLE IF NOT EXISTS administradores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    telefono VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS proyectos (
    id_proyecto VARCHAR(255) PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    presupuesto FLOAT NOT NULL DEFAULT 0,
    material FLOAT NOT NULL DEFAULT 0,
    gastos FLOAT NOT NULL DEFAULT 0,
    cimentacion FLOAT NOT NULL DEFAULT 0,
    muros FLOAT NOT NULL DEFAULT 0,
    piso FLOAT NOT NULL DEFAULT 0,
    tipo_proyecto_id VARCHAR(255) NOT NULL,
    fecha_salida DATE NOT NULL,
    fecha_instalacion DATE NOT NULL,
    administrador_id INT NOT NULL,
    cliente_id INT NULL DEFAULT NULL, -- 🌟 Columna para asociar al dueño del proyecto de forma privada
    CONSTRAINT fk_proyectos_administradores
        FOREIGN KEY (administrador_id) 
        REFERENCES administradores(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_proyectos_clientes -- 🌟 Relación segura: si un cliente se borra, el proyecto queda libre (NULL)
        FOREIGN KEY (cliente_id) 
        REFERENCES clientes(id)
        ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS documentos_proyecto (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_proyecto VARCHAR(255) NOT NULL,
    nombre_contrato VARCHAR(255) NOT NULL,
    fecha_firma DATE NOT NULL,
    vigencia DATE NOT NULL,
    archivo_nombre_original VARCHAR(255) NOT NULL,
    ruta_archivo VARCHAR(255) NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_documentos_proyectos
        FOREIGN KEY (id_proyecto) 
        REFERENCES proyectos(id_proyecto)
        ON DELETE CASCADE
);