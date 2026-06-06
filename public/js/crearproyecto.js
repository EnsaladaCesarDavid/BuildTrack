document.addEventListener('DOMContentLoaded', () => {
    const formularioProyecto = document.querySelector('.menu-lateral form') || document.querySelector('form');
    
    if (!formularioProyecto) return;

    formularioProyecto.addEventListener('submit', (e) => {
        e.preventDefault();

        const inputNombre = formularioProyecto.querySelector('input[type="text"]:not([placeholder*="$"])') || formularioProyecto.querySelector('input');
        const inputPresupuesto = formularioProyecto.querySelector('input[placeholder*="$"]') || formularioProyecto.querySelectorAll('input')[1];

        const nombreProyecto = inputNombre ? inputNombre.value.trim() : '';
        const presupuestoProyecto = inputPresupuesto ? inputPresupuesto.value.trim() : '';

        if (!nombreProyecto) {
            alert('Por favor, asigne un nombre al proyecto antes de guardarlo.');
            return;
        }

        const adminActual = localStorage.getItem('usuarioActivo') || 'Administrador';
        const idUnico = 'PROJ-' + Math.floor(10000 + Math.random() * 90000);

        const nuevoProyecto = {
            id: idUnico,
            nombre: nombreProyecto,
            presupuesto: presupuestoProyecto,
            admin: adminActual,
            fechaCreacion: new Date().toISOString()
        };

        const proyectosExistentes = JSON.parse(localStorage.getItem('buildtrack_proyectos')) || [];
        proyectosExistentes.push(nuevoProyecto);

        localStorage.setItem('buildtrack_proyectos', JSON.stringify(proyectosExistentes));
        formularioProyecto.reset();

        alert(`¡Proyecto "${nombreProyecto}" asignado con éxito bajo el código ${idUnico}!`);

        if (typeof renderizarProyectosAdmin === 'function') {
            renderizarProyectosAdmin();
        }
    });
});