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

    if (!nombre || !fecha_inicio_str || !fecha_fin_str || !presupuesto) {
        alert("Por favor, rellena todos los campos del proyecto.");
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

    fetch('http://localhost:3000/api/crear-proyecto', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nombre, fecha_inicio: fecha_inicio_str, fecha_fin: fecha_fin_str, presupuesto })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            alert(`¡Proyecto creado con éxito!\nCódigo asignado: ${data.id}`);
            const sublistaAdmin = document.getElementById('sublista-proyectos-admin');
            const nuevoElemento = document.createElement('li');
            nuevoElemento.textContent = `- ${nombre}`;
            sublistaAdmin.appendChild(nuevoElemento);

            document.getElementById('form-nuevo-proyecto').reset();
        }
    })
    .catch(error => {
        alert("Error de conexión con el servidor");
    });
});