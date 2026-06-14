document.addEventListener('DOMContentLoaded', () => {
    const formularioProyecto = document.getElementById('form-nuevo-proyecto') || document.querySelector('form');
    const regexLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;

    // Control de persistencia para el modelo seleccionado en la otra pantalla
    const paginaAnterior = document.referrer.toLowerCase();
    if (!paginaAnterior.includes('tipoproyectoadmin.html')) {
        localStorage.removeItem('proyecto_temporal');
    }

    function sanitizarTexto(texto) {
        return texto
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }

    // RENDERIZAR PROYECTOS DESDE EL SERVIDOR (SIN LOCALSTORAGE)
    function renderizarProyectosLateral() {
        const contenedorLista = document.getElementById('sublista-proyectos');
        if (!contenedorLista) return;

        contenedorLista.innerHTML = ''; // Limpiar vista vieja

        // Consultamos directo al endpoint que filtra por el Administrador Logueado
        fetch('http://localhost:3000/api/proyectos/mis-proyectos')
            .then(res => res.ok ? res.json() : [])
            .then(proyectosReales => {
                const proyectoSeleccionadoId = localStorage.getItem('proyecto_seleccionado_id');

                if (proyectosReales.length === 0) {
                    contenedorLista.innerHTML = '<li style="color: #94a3b8; padding: 6px 12px; font-style: italic; font-size: 0.85rem;">Sin proyectos activos</li>';
                    return;
                }

                proyectosReales.forEach(proj => {
                    const li = document.createElement('li');
                    li.style.margin = '10px 0';
                    li.style.padding = '10px';
                    li.style.borderRadius = '4px';
                    li.style.color = '#fff';
                    li.style.fontSize = '14px';
                    li.style.cursor = 'pointer';
                    li.style.transition = 'background-color 0.2s';
                    li.textContent = `${proj.nombre} (${proj.id_proyecto})`;

                    if (proyectoSeleccionadoId === proj.id_proyecto) {
                        li.style.backgroundColor = 'rgba(245, 158, 11, 0.4)'; 
                        li.style.border = '1px solid #f59e0b';
                    } else {
                        li.style.backgroundColor = 'rgba(255,255,255,0.1)';
                    }

                    li.addEventListener('click', () => {
                        localStorage.setItem('proyecto_seleccionado_id', proj.id_proyecto);
                        renderizarProyectosLateral();
                    });

                    contenedorLista.appendChild(li);
                });
            })
            .catch(err => console.error("Error cargando barra lateral:", err));
    }

    renderizarProyectosLateral();

    // BOTÓN GESTIONAR PROYECTO
    const btnGestionarProyecto = document.getElementById('btn-gestionar-proyecto-lateral');
    if (btnGestionarProyecto) {
        btnGestionarProyecto.addEventListener('click', (e) => {
            e.preventDefault();
            const seleccionadoId = localStorage.getItem('proyecto_seleccionado_id');
            if (!seleccionadoId) {
                alert('Por favor, selecciona un proyecto de la lista primero.');
            } else {
                window.location.href = `./gestionarproyecto.html?id=${seleccionadoId}`;
            }
        });
    }

    // Cargar estado del modelo temporal
    const textoModeloStatus = document.getElementById('txt-modelo-seleccionado');
    const datosTemp = JSON.parse(localStorage.getItem('proyecto_temporal'));
    if (datosTemp) {
        if (formularioProyecto.querySelector('#proj-nombre') && datosTemp.nombre) formularioProyecto.querySelector('#proj-nombre').value = datosTemp.nombre;
        if (formularioProyecto.querySelector('#proj-inicio') && datosTemp.fecha_inicio) formularioProyecto.querySelector('#proj-inicio').value = datosTemp.fecha_inicio;
        if (formularioProyecto.querySelector('#proj-fin') && datosTemp.fecha_fin) formularioProyecto.querySelector('#proj-fin').value = datosTemp.fecha_fin;

        if (textoModeloStatus && datosTemp.tipo_proyecto_id) {
            textoModeloStatus.textContent = `(Modelo seleccionado: ${datosTemp.tipo_proyecto_texto || 'Modelo ' + datosTemp.tipo_proyecto_id})`;
            textoModeloStatus.style.color = '#28a745'; 
            textoModeloStatus.style.fontWeight = 'bold';
        }
    }

    // Almacenar temporal al configurar modelo
    const botonModelos = document.getElementById('link-tipo-proyecto');
    if (botonModelos) {
        botonModelos.addEventListener('click', () => {
            let temp = JSON.parse(localStorage.getItem('proyecto_temporal')) || {};
            temp.nombre = formularioProyecto.querySelector('#proj-nombre')?.value.trim() || '';
            temp.fecha_inicio = formularioProyecto.querySelector('#proj-inicio')?.value || '';
            temp.fecha_fin = formularioProyecto.querySelector('#proj-fin')?.value || '';
            localStorage.setItem('proyecto_temporal', JSON.stringify(temp));
        });
    }

    // BORRAR DATOS
    document.getElementById('btn-borrar-datos')?.addEventListener('click', (e) => {
        e.preventDefault();
        formularioProyecto.reset();
        localStorage.removeItem('proyecto_temporal');
        localStorage.removeItem('proyecto_seleccionado_id');
        if (textoModeloStatus) {
            textoModeloStatus.textContent = '(Ningún modelo seleccionado)';
            textoModeloStatus.style.color = '';
            textoModeloStatus.style.fontWeight = 'normal';
        }
        renderizarProyectosLateral();
        alert('Se han borrado los campos correctamente.');
    });

    // SUBMIT FORMULARIO CON VALIDACIÓN CRONOLÓGICA EN CADENA
    formularioProyecto.addEventListener('submit', (e) => {
        e.preventDefault();

        const nombre = formularioProyecto.querySelector('#proj-nombre').value.trim();
        const fecha_inicio = formularioProyecto.querySelector('#proj-inicio').value;
        const fecha_fin = formularioProyecto.querySelector('#proj-fin').value;
        const presupuestoRaw = formularioProyecto.querySelector('#proj-presupuesto').value.replace(/[^0-9]/g, '');

        if (!regexLetras.test(nombre)) {
            alert("El nombre del proyecto solo debe contener letras.");
            return;
        }

        if (!presupuestoRaw || parseFloat(presupuestoRaw) <= 0) {
            alert("Ingrese un presupuesto válido sin letras ni signos.");
            return;
        }

        const datosModelo = JSON.parse(localStorage.getItem('proyecto_temporal'));
        if (!datosModelo || !datosModelo.tipo_proyecto_id) {
            alert('Por favor, configure el Modelo y Transporte antes de guardar el proyecto.');
            return;
        }

        // --- VALIDACIONES DE TIEMPO EN CADENA STAFFA ---
        const fInicio = new Date(fecha_inicio);
        const fFin = new Date(fecha_fin);
        const fSalida = new Date(datosModelo.fecha_salida);
        const fInstalacion = new Date(datosModelo.fecha_instalacion);

        if (fFin < fInicio) {
            alert('Incoherencia de fechas:\nLa "Fecha estimada de finalización" no puede ser anterior a la "Fecha de inicio" en fábrica.');
            return;
        }
        if (fSalida < fFin) {
            alert('Incoherencia de fechas:\nLa "Fecha de salida/traslado" no puede ocurrir antes de que termine la construcción en fábrica.');
            return;
        }
        if (fInstalacion < fSalida) {
            alert('Incoherencia de fechas:\nLa "Fecha de instalación en terreno" no puede ocurrir antes de que la casa salga de la fábrica.');
            return;
        }

        const paqueteProyecto = {
            nombre: sanitizarTexto(nombre),
            fecha_inicio: fecha_inicio,
            fecha_fin: fecha_fin,
            presupuesto: parseFloat(presupuestoRaw),
            tipo_proyecto_id: datosModelo.tipo_proyecto_id,
            fecha_salida: datosModelo.fecha_salida,
            fecha_instalacion: datosModelo.fecha_instalacion
        };

        fetch('http://localhost:3000/api/proyecto/crear', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paqueteProyecto)
        })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                alert(`¡Proyecto creado con éxito bajo el código ${data.id}!`);
                localStorage.setItem('proyecto_seleccionado_id', data.id);
                localStorage.removeItem('proyecto_temporal');
                formularioProyecto.reset();
                window.location.reload();
            }
        })
        .catch(() => alert('Error de conexión con el servidor.'));
    });
});