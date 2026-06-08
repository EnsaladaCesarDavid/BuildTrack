let idProyectoSeleccionado = null;

document.addEventListener('DOMContentLoaded', () => {
    renderizarProyectosAdmin();
    
    const btnGestionar = document.getElementById('btn-gestionar-proyecto-lateral');
    if (btnGestionar) {
        btnGestionar.addEventListener('click', () => {
            if (!idProyectoSeleccionado) {
                alert('Por favor, selecciona un proyecto de la lista primero.');
                return;
            }
            window.location.href = `./gestionarproyecto.html?id=${idProyectoSeleccionado}`;
        });
    }
});

function renderizarProyectosAdmin() {
    const adminActual = localStorage.getItem('usuarioActivo') || 'Administrador';
    const contenedorLista = document.querySelector('.sublista-proyectos') || document.getElementById('sublista-proyectos');
    
    if (!contenedorLista) return;

    contenedorLista.innerHTML = '';

    const proyectosGlobales = JSON.parse(localStorage.getItem('buildtrack_proyectos')) || [];
    const proyectosDelAdmin = proyectosGlobales.filter(proyecto => proyecto.admin === adminActual);

    if (proyectosDelAdmin.length === 0) {
        const liVacio = document.createElement('li');
        liVacio.textContent = 'Sin proyectos activos';
        liVacio.style.color = '#94a3b8';
        liVacio.style.padding = '6px 12px';
        liVacio.style.fontSize = '0.85rem';
        liVacio.style.fontStyle = 'italic';
        contenedorLista.appendChild(liVacio);
        return;
    }

    proyectosDelAdmin.forEach(proyecto => {
        const li = document.createElement('li');
        const span = document.createElement('span');
        
        span.textContent = `${proyecto.nombre}`;
        span.title = `ID: ${proyecto.id}`;
        span.style.cursor = 'pointer';
        span.style.display = 'block';
        span.style.padding = '6px 12px';
        span.style.transition = 'all 0.2s ease';
        
        span.addEventListener('click', function() {
            document.querySelectorAll('.sublista-proyectos span').forEach(s => {
                s.style.textDecoration = 'none';
                s.style.fontWeight = 'normal';
                s.style.color = 'inherit';
            });
            span.style.textDecoration = 'underline';
            span.style.fontWeight = 'bold';
            span.style.color = '#f59e0b';
            idProyectoSeleccionado = proyecto.id;
            
            window.location.href = `./gestionarproyecto.html?id=${idProyectoSeleccionado}`;
        });
        
        li.appendChild(span);
        contenedorLista.appendChild(li);
    });
}