document.addEventListener('DOMContentLoaded', () => {
    const selectTipo = document.querySelector('.formulario-proyecto select');
    const inputSalida = document.querySelectorAll('.input-calendario')[0];
    const inputInstalacion = document.querySelectorAll('.input-calendario')[1];
    const botonesModelos = document.querySelectorAll('.btn-seleccionar-modelo');
    
    botonesModelos.forEach((boton, indice) => {
        const enlace = boton.querySelector('a');
        if (enlace) {
            enlace.addEventListener('click', (e) => e.preventDefault());
        }

        boton.addEventListener('click', function(e) {
            e.preventDefault();
            const valorAsociado = (indice + 1).toString(); 
            if (selectTipo) {
                selectTipo.value = valorAsociado;
                selectTipo.dispatchEvent(new Event('change'));
                alert(`Has seleccionado el Modelo de Construcción ${indice + 1}. Por favor, completa las fechas de transporte abajo para concluir.`);
                document.querySelector('.seccion-coordinar-transporte').scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    const btnGuardar = document.getElementById('btn-guardar-transporte');
    if (btnGuardar) {
        btnGuardar.addEventListener('click', function(e) {
            if (!selectTipo.value || !inputSalida.value || !inputInstalacion.value) {
                alert("Por favor, completa la selección del modelo y las fechas de transporte antes de continuar.");
                return;
            }

            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);

            const fechaSalida = new Date(inputSalida.value + 'T00:00:00');
            const fechaInstalacion = new Date(inputInstalacion.value + 'T00:00:00');

            if (fechaSalida < hoy) {
                alert("La fecha de salida del transporte no puede ser anterior al día actual.");
                return;
            }

            if (fechaInstalacion < hoy) {
                alert("La fecha de instalación no puede ser anterior al día actual.");
                return;
            }

            if (fechaSalida.getTime() === fechaInstalacion.getTime()) {
                alert("La fecha de salida y la fecha de instalación no pueden ocurrir el mismo día.");
                return;
            }

            if (fechaInstalacion < fechaSalida) {
                alert("La fecha de instalación de la obra no puede ser anterior a la fecha de salida del transporte.");
                return;
            }

            let datosExistentes = {};
            const temporal = localStorage.getItem('proyecto_temporal');
            if (temporal) datosExistentes = JSON.parse(temporal);

            datosExistentes.tipo_proyecto_id = selectTipo.value;
            datosExistentes.tipo_proyecto_texto = selectTipo.options[selectTipo.selectedIndex].text;
            datosExistentes.fecha_salida = inputSalida.value;
            datosExistentes.fecha_instalacion = inputInstalacion.value;

            localStorage.setItem('proyecto_temporal', JSON.stringify(datosExistentes));
            window.location.href = './menuprincipaladmin.html';
        });
    }

    const btnCancelar = document.getElementById('btn-cancelar-transporte');
    if (btnCancelar) {
        btnCancelar.addEventListener('click', function() {
            window.location.href = './menuprincipaladmin.html';
        });
    }
});