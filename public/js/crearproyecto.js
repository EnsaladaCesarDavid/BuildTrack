document.addEventListener('DOMContentLoaded', () => {
    const datosTemporales = localStorage.getItem('proyecto_temporal');
    if (datosTemporales) {
        const datos = JSON.parse(datosTemporales);
        
        if (datos.nombre) document.getElementById('proj-nombre').value = datos.nombre;
        if (datos.fecha_inicio) document.getElementById('proj-inicio').value = datos.fecha_inicio;
        if (datos.fecha_fin) document.getElementById('proj-fin').value = datos.fecha_fin;
        if (datos.presupuesto) document.getElementById('proj-presupuesto').value = datos.presupuesto;
        
        if (datos.tipo_proyecto_texto) {
            const indicador = document.getElementById('txt-modelo-seleccionado');
            if (indicador) {
                indicador.textContent = `✓ Seleccionado: ${datos.tipo_proyecto_texto}`;
                indicador.style.color = "#059669";
                indicador.style.fontWeight = "bold";
            }
        }
    }
});

document.getElementById('link-tipo-proyecto').addEventListener('click', function(e) {
    const nombre = document.getElementById('proj-nombre').value.trim();
    const fecha_inicio = document.getElementById('proj-inicio').value;
    const fecha_fin = document.getElementById('proj-fin').value;
    const presupuesto = document.getElementById('proj-presupuesto').value.trim();

    let datosExistentes = {};
    const temporal = localStorage.getItem('proyecto_temporal');
    if (temporal) datosExistentes = JSON.parse(temporal);

    datosExistentes.nombre = nombre;
    datosExistentes.fecha_inicio = fecha_inicio;
    datosExistentes.fecha_fin = fecha_fin;
    datosExistentes.presupuesto = presupuesto;

    localStorage.setItem('proyecto_temporal', JSON.stringify(datosExistentes));
});

document.getElementById('proj-presupuesto').addEventListener('blur', function() {
    let valor = this.value.trim();
    if (valor !== '' && !isNaN(valor)) {
        this.value = parseFloat(valor).toFixed(2);
    }
});

document.getElementById('form-nuevo-proyecto').addEventListener('submit', function(e) {
    e.preventDefault();

    const nombre = document.getElementById('proj-nombre').value.trim();
    const fecha_inicio_str = document.getElementById('proj-inicio').value;
    const fecha_fin_str = document.getElementById('proj-fin').value;
    const presupuesto = document.getElementById('proj-presupuesto').value.trim();

    // Obtener información adicional de transporte que guardamos en localStorage
    const temporal = localStorage.getItem('proyecto_temporal');
    let datosAdicionales = temporal ? JSON.parse(temporal) : {};

    if (!nombre || !fecha_inicio_str || !fecha_fin_str || !presupuesto) {
        alert("Por favor, rellena todos los campos del proyecto.");
        return;
    }

    if (!datosAdicionales.tipo_proyecto_id) {
        alert("Por favor, debes hacer clic en 'Configurar Modelo y Transporte' para asociar el tipo de proyecto e instalación antes de guardar.");
        return;
    }

    if (nombre.length < 3) {
        alert("El nombre del proyecto debe tener al menos 3 caracteres.");
        return;
    }

    const regexNumero = /^\d+(\.\d+)?$/;
    if (!regexNumero.test(presupuesto)) {
        alert("El campo de presupuesto solo acepta caracteres numéricos válidos.");
        return;
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fechaInicio = new Date(fecha_inicio_str + 'T00:00:00');
    const fechaFin = new Date(fecha_fin_str + 'T00:00:00');

    if (fechaInicio < hoy) {
        alert("La fecha de inicio no puede ser anterior al día actual.");
        return;
    }

    if (fechaFin < hoy) {
        alert("La fecha de finalización no puede ser anterior al día actual.");
        return;
    }

    if (fechaInicio.getTime() === fechaFin.getTime()) {
        alert("La fecha de inicio y la fecha de finalización no pueden ser el mismo día.");
        return;
    }

    if (fechaFin < fechaInicio) {
        alert("La fecha estimada de finalización no puede ser anterior a la fecha de inicio.");
        return;
    }

    const payload = {
        nombre: nombre,
        fecha_inicio: fecha_inicio_str,
        fecha_fin: fecha_fin_str,
        presupuesto: presupuesto,
        tipo_proyecto_id: datosAdicionales.tipo_proyecto_id,
        fecha_salida_transporte: datosAdicionales.fecha_salida,
        fecha_instalacion_transporte: datosAdicionales.fecha_instalacion
    };

    fetch('http://localhost:3000/api/crear-proyecto', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            alert(`¡Proyecto creado con éxito!\nCódigo asignado: ${data.id}`);

            const sublistaAdmin = document.getElementById('sublista-proyectos-admin');
            if (sublistaAdmin) {
                const nuevoElemento = document.createElement('li');
                nuevoElemento.textContent = `- ${nombre}`;
                sublistaAdmin.appendChild(nuevoElemento);
            }

            document.getElementById('form-nuevo-proyecto').reset();
            localStorage.removeItem('proyecto_temporal');
            
            const indicador = document.getElementById('txt-modelo-seleccionado');
            if (indicador) {
                indicador.textContent = "(Ningún modelo seleccionado)";
                indicador.style.color = "#4b5563";
                indicador.style.fontWeight = "normal";
            }
        }
    })
    .catch(error => {
        alert("Error de conexión con el servidor");
    });
});

document.getElementById('btn-borrar-datos').addEventListener('click', function() {
    const confirmar = confirm("¿Estás seguro de que deseas borrar todos los datos ingresados y la configuración de transporte?");
    if (!confirmar) return;

    document.getElementById('form-nuevo-proyecto').reset();
    localStorage.removeItem('proyecto_temporal');
    
    const indicador = document.getElementById('txt-modelo-seleccionado');
    if (indicador) {
        indicador.textContent = "(Ningún modelo seleccionado)";
        indicador.style.color = "#64748b";
        indicador.style.fontWeight = "normal";
    }
});