let proyectoSeleccionadoActual = null;

// 1. Cargar automáticamente los proyectos enlazados al cliente al abrir la página
async function cargarMisProyectosCliente() {
    try {
        // Apuntando correctamente a la ruta del backend con prefijo /api
        const response = await fetch('/api/proyectos/mis-proyectos-cliente');
        if (!response.ok) throw new Error('Error al obtener la lista.');

        const proyectos = await response.json();
        const sublista = document.getElementById('sublista-proyectos');
        if (!sublista) return;

        sublista.innerHTML = ''; // Limpiar contenedor anterior

        if (proyectos.length === 0) {
            sublista.innerHTML = '<li style="color: #94a3b8; font-size: 0.85rem; padding: 10px; font-style: italic;">Sin proyectos vinculados</li>';
            return;
        }

        proyectos.forEach(proj => {
            const li = document.createElement('li');
            li.style.padding = '10px';
            li.style.borderRadius = '6px';
            li.style.cursor = 'pointer';
            li.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
            li.style.transition = 'background 0.2s';
            li.innerHTML = `
                <div style="color: #fff; font-weight: 600; font-size: 0.9rem;">${proj.nombre}</div>
                <div style="color: #ff8c2b; font-size: 0.75rem; font-weight: bold;">${proj.id_proyecto}</div>
            `;

            // Evento interactivo para seleccionar el proyecto estéticamente al hacer clic
            li.addEventListener('click', () => {
                // Desmarcar todos los demás elementos hermanos
                Array.from(sublista.children).forEach(el => el.style.background = 'transparent');
                // Marcar el actual seleccionado con fondo gris transparente
                li.style.background = 'rgba(255, 255, 255, 0.1)';
                
                // Actualizar variable de seguimiento global con la clave del proyecto
                proyectoSeleccionadoActual = proj.id_proyecto;
            });

            sublista.appendChild(li);
        });

    } catch (error) {
        console.error('Error cargando sublista:', error);
    }
}

// 2. Control del Botón "+" en el menú lateral del Cliente
document.getElementById('btn-agregar-proyecto').addEventListener('click', async () => {
    const clave = prompt('Por favor, ingresa la clave única de tu proyecto (Ej: PROJ-62374):');
    if (!clave) return;

    const claveLimpia = clave.trim().toUpperCase();

    try {
        const response = await fetch('/api/proyectos/vincular', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clave_proyecto: claveLimpia })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(`❌ ${data.error}`);
        } else {
            alert(`🎉 ${data.mensaje}`);
            cargarMisProyectosCliente(); // Recargar la sublista lateral al instante
        }
    } catch (error) {
        alert('Fallo de conexión con el servidor.');
    }
});

// 3. Control del botón "Visualizar Proyecto" hacia la nueva ventana informativa
document.getElementById('btn-visualizar-proyecto').addEventListener('click', () => {
    if (!proyectoSeleccionadoActual) {
        alert('Por favor, selecciona primero un proyecto de la lista de "Mis proyectos" haciendo un clic.');
        return;
    }

    // Guardamos el ID en localStorage para que resumenproyecto.html pueda capturarlo
    localStorage.setItem('proyecto_seleccionado_id', proyectoSeleccionadoActual);
    
    // REDIRECCIÓN ASEGURADA a la vista informativa de solo lectura
    window.location.href = './resumenproyecto.html';
});

// 4. Control de Cierre de Sesión del Cliente
document.getElementById('btn-logout-cliente').addEventListener('click', () => {
    fetch('/api/logout', { method: 'POST' }).finally(() => {
        window.location.href = './iniciosesioncliente.html';
    });
});

// Inicializar al cargar el DOM de la aplicación
document.addEventListener('DOMContentLoaded', cargarMisProyectosCliente);