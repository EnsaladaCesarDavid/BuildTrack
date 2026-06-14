document.addEventListener('DOMContentLoaded', () => {
    const btnMostrar = document.getElementById('btn-mostrar-formulario');
    const btnCancelar = document.getElementById('btn-cancelar-carga');
    const contenedorForm = document.getElementById('contenedor-formulario-carga');
    const formSubirPdf = document.getElementById('form-subir-pdf');
    const elementoBadge = document.getElementById('proyecto-id-badge');

    let idProyectoSeleccionado = null;

    // --- CARGAR E INYECTAR PROYECTOS EN EL MENÚ LATERAL ---
    const contenedorLista = document.getElementById('sublista-proyectos');
    if (contenedorLista) {
        contenedorLista.innerHTML = '';
        fetch('http://localhost:3000/api/proyectos/mis-proyectos')
            .then(res => {
                if (!res.ok) throw new Error('Sesión inválida o expirada');
                return res.json();
            })
            .then(proyectos => {
                if (!proyectos || proyectos.length === 0) {
                    contenedorLista.innerHTML = '<li style="color:#94a3b8; padding:6px 12px; font-style:italic;">Sin proyectos activos</li>';
                    return;
                }

                proyectos.forEach(proyecto => {
                    const li = document.createElement('li');
                    const span = document.createElement('span');
                    
                    span.textContent = `${proyecto.nombre}`;
                    span.title = `ID: ${proyecto.id_proyecto}`;
                    span.style.cursor = 'pointer';
                    span.style.display = 'block';
                    span.style.padding = '8px 12px';
                    span.style.borderRadius = '4px';
                    span.style.marginBottom = '4px';
                    span.style.transition = 'all 0.2s ease';
                    
                    // Al hacer clic, activamos el proyecto localmente sin redirigir de página
                    span.addEventListener('click', function() {
                        document.querySelectorAll('.sublista-proyectos span').forEach(s => {
                            s.style.fontWeight = 'normal';
                            s.style.color = 'inherit';
                            s.style.background = 'transparent';
                        });
                        
                        span.style.fontWeight = 'bold';
                        span.style.color = '#ff8c2b';
                        span.style.background = 'rgba(255, 140, 43, 0.1)';
                        
                        idProyectoSeleccionado = proyecto.id_proyecto;
                        if(elementoBadge) {
                            elementoBadge.textContent = idProyectoSeleccionado;
                        }

                        // Cargamos los archivos que ya tenga este proyecto en particular
                        solicitarDocumentosVinculados(idProyectoSeleccionado);
                    });
                    
                    li.appendChild(span);
                    contenedorLista.appendChild(li);
                });
            })
            .catch(err => {
                console.error("Error al obtener la lista de proyectos:", err);
                window.location.href = "./iniciosesionadmin.html";
            });
    }

    // --- CONTROL INTERFAZ FORMULARIO ---
    if(btnMostrar) {
        btnMostrar.addEventListener('click', () => {
            if (!idProyectoSeleccionado) {
                return alert('Por favor, seleccione primero un proyecto del menú lateral antes de subir un documento.');
            }
            contenedorForm.classList.toggle('oculto');
        });
    }

    if(btnCancelar) {
        btnCancelar.addEventListener('click', () => {
            if(contenedorForm) contenedorForm.classList.add('oculto');
            if(formSubirPdf) formSubirPdf.reset();
        });
    }

    // --- ENVÍO DEL ARCHIVO VÍA FETCH ---
    if (formSubirPdf) {
        formSubirPdf.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!idProyectoSeleccionado) {
                return alert('Error: No has seleccionado ningún proyecto.');
            }

            const inputArchivo = document.getElementById('input-archivo-pdf');
            const inputNombre = document.getElementById('input-nombre-contrato');
            const inputFirma = document.getElementById('input-fecha-firma');
            const inputVigencia = document.getElementById('input-vigencia');

            const archivo = inputArchivo.files[0];
            if (!archivo) return alert('Por favor, introduce un documento en formato PDF.');

            // Preparación del paquete Multipart para Multer
            const formData = new FormData();
            formData.append('pdf_contrato', archivo);
            formData.append('id_proyecto', idProyectoSeleccionado);
            formData.append('nombre_contrato', inputNombre.value.trim());
            formData.append('fecha_firma', inputFirma.value);
            formData.append('vigencia', inputVigencia.value);

            try {
                // Forzamos la ruta absoluta del endpoint local del backend
                const respuesta = await fetch('http://localhost:3000/api/documento/subir', {
                    method: 'POST',
                    body: formData
                });

                const datos = await respuesta.json();

                if (respuesta.ok) {
                    alert('¡Documento legal guardado e indexado en la base de datos con éxito!');
                    if(contenedorForm) contenedorForm.classList.add('oculto');
                    formSubirPdf.reset();
                    solicitarDocumentosVinculados(idProyectoSeleccionado);
                } else {
                    console.error("Respuesta fallida del backend:", datos);
                    alert('Error del Servidor: ' + (datos.error || 'Fallo de procesamiento de carga'));
                }
            } catch (error) {
                console.error("Error capturado en la petición de red:", error);
                alert('Ocurrió un fallo crítico de comunicación con el servidor de archivos.');
            }
        });
    }
});

// --- RENDERIZADO DINÁMICO EN LA PARTE INFERIOR ---
function solicitarDocumentosVinculados(idProyecto) {
    const listaContenedor = document.getElementById('contenedor-lista-documentos');
    if (!listaContenedor) return;

    fetch(`http://localhost:3000/api/documentos-proyecto/${idProyecto}`)
        .then(res => res.json())
        .then(documentos => {
            listaContenedor.innerHTML = '';

            if (!documentos || documentos.length === 0) {
                listaContenedor.innerHTML = `<p style="color: #64748b; text-align: center; font-style: italic;">No hay documentos vinculados a este proyecto actualmente.</p>`;
                return;
            }

            documentos.forEach(doc => {
                const item = document.createElement('div');
                item.style.display = 'flex';
                item.style.justifyContent = 'space-between';
                item.style.alignItems = 'center';
                item.style.padding = '12px 15px';
                item.style.background = '#f8fafc';
                item.style.border = '1px solid #e2e8f0';
                item.style.borderRadius = '6px';

                const fFirma = doc.fecha_firma ? new Date(doc.fecha_firma).toLocaleDateString('es-MX') : 'S/F';
                const fVence = doc.vigencia ? new Date(doc.vigencia).toLocaleDateString('es-MX') : 'S/V';

                item.innerHTML = `
                    <div style="text-align: left;">
                        <strong style="color: #1e293b; display:block;">📄 ${doc.nombre_contrato}</strong>
                        <span style="font-size: 0.8rem; color: #64748b;">Firma: ${fFirma} | Vigencia: ${fVence}</span>
                    </div>
                    <a href="http://localhost:3000/${doc.ruta_archivo}" target="_blank" style="
                        background: #ff8c2b; color: white; text-decoration: none; padding: 6px 12px;
                        border-radius: 4px; font-size: 0.85rem; font-weight: bold;
                    ">Ver PDF</a>
                `;
                listaContenedor.appendChild(item);
            });
        })
        .catch(err => console.error("Error al traer expedientes adjuntos:", err));
}