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
    const contenedorLista = document.querySelector('.sublista-proyectos') || document.getElementById('sublista-proyectos');
    if (!contenedorLista) return;

    contenedorLista.innerHTML = '';

    // Consultamos la API real del servidor que filtra los proyectos por sesión en MySQL
    fetch('http://localhost:3000/api/proyectos/mis-proyectos')
        .then(response => {
            if (!response.ok) {
                // Si el backend responde 401 (No autorizado/Sesión expirada), sacamos al usuario
                throw new Error('Sesión no autorizada o expirada');
            }
            return response.json();
        })
        .then(proyectosDelAdmin => {
            // Si la consulta es exitosa pero no hay proyectos en la base de datos para este admin
            if (!proyectosDelAdmin || proyectosDelAdmin.length === 0) {
                const liVacio = document.createElement('li');
                liVacio.textContent = 'Sin proyectos activos';
                liVacio.style.color = '#94a3b8';
                liVacio.style.padding = '6px 12px';
                liVacio.style.fontSize = '0.85rem';
                liVacio.style.fontStyle = 'italic';
                contenedorLista.appendChild(liVacio);
                return;
            }

            // Recorremos los registros devueltos por MySQL
            proyectosDelAdmin.forEach(proyecto => {
                const li = document.createElement('li');
                const span = document.createElement('span');
                
                // Mapeamos los campos según tu base de datos actual (id_proyecto y nombre)
                span.textContent = `${proyecto.nombre}`;
                span.title = `ID: ${proyecto.id_proyecto}`;
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
                    
                    // CORRECCIÓN CLAVE: Guardamos la llave primaria correcta de MySQL
                    idProyectoSeleccionado = proyecto.id_proyecto;
                    
                    window.location.href = `./gestionarproyecto.html?id=${idProyectoSeleccionado}`;
                });
                
                li.appendChild(span);
                contenedorLista.appendChild(li);
            });
        })
        .catch(error => {
            console.error("Error al cargar la lista de proyectos:", error);
            // Redirige al inicio de sesión si no hay credenciales seguras o la sesión expiró
            window.location.href = "./iniciosesionadmin.html";
        });
}