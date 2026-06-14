document.addEventListener('DOMContentLoaded', () => {
    const formSubir = document.getElementById('form-subir-pdf');
    const inputArchivo = document.getElementById('input-archivo-pdf');
    const inputNombre = document.getElementById('input-nombre-contrato');
    const inputFirma = document.getElementById('input-fecha-firma');
    const inputVigencia = document.getElementById('input-vigencia');
    const contenedorForm = document.getElementById('contenedor-formulario-carga');

    // Escuchador para subir archivos mediante AJAX
    if (formSubir) {
        formSubir.addEventListener('submit', async (e) => {
            e.preventDefault();

            const idProyectoActual = localStorage.getItem('proyecto_seleccionado_id');
            if (!idProyectoActual || idProyectoActual === 'Seleccione Proyecto') {
                return alert('Por favor, seleccione primero un proyecto de la barra lateral izquierda.');
            }

            const archivo = inputArchivo.files[0];
            if (!archivo) return alert('Por favor, selecciona un archivo PDF.');
            if (archivo.type !== 'application/pdf') {
                return alert('Error: El archivo debe ser exclusivamente en formato .pdf');
            }

            const formData = new FormData();
            formData.append('pdf_contrato', archivo);
            formData.append('id_proyecto', idProyectoActual);
            formData.append('nombre_contrato', inputNombre.value.trim());
            formData.append('fecha_firma', inputFirma.value);
            formData.append('vigencia', inputVigencia.value);

            try {
                const respuesta = await fetch('http://localhost:3000/api/documento/subir', {
                    method: 'POST',
                    body: formData
                });

                const data = await respuesta.json();

                if (respuesta.ok) {
                    alert('¡Documento PDF guardado con éxito en el expediente del proyecto!');
                    formSubir.reset();
                    if (contenedorForm) contenedorForm.classList.add('oculto');
                    // Refrescamos la lista de documentos inmediatamente
                    window.cargarDocumentosDelProyecto(idProyectoActual);
                } else {
                    alert('Error del servidor: ' + (data.error || 'No se pudo guardar el archivo.'));
                }
            } catch (error) {
                console.error("Error de red al subir documento:", error);
                alert('Ocurrió un error en la conexión de red al intentar subir el archivo.');
            }
        });
    }
});

// FUNCIÓN GLOBAL para pintar los documentos del proyecto seleccionado de forma dinámica
window.cargarDocumentosDelProyecto = function(idProyecto) {
    const contenedorLista = document.getElementById('contenedor-lista-documentos');
    if (!contenedorLista) return;

    contenedorLista.innerHTML = '<p style="color: #64748b; text-align: center; font-style: italic; margin-top: 20px;">Buscando expedientes guardados...</p>';

    fetch(`http://localhost:3000/api/documentos-proyecto/${idProyecto}`)
        .then(res => res.json())
        .then(documentos => {
            contenedorLista.innerHTML = '';

            if (!documentos || documentos.length === 0) {
                contenedorLista.innerHTML = `
                    <p id=\"mensaje-vacio\" style=\"color: #64748b; text-align: center; font-style: italic; margin-top: 20px;\">
                        No hay documentos vinculados a este proyecto actualmente.
                    </p>`;
                return;
            }

            // Mapeamos los documentos creando cajas dinámicas usando tus estilos originales
            documentos.forEach(doc => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'tarjeta-blanca';
                itemDiv.style.marginTop = '15px';
                itemDiv.style.display = 'flex';
                itemDiv.style.justifyContent = 'space-between';
                itemDiv.style.alignItems = 'center';
                itemDiv.style.padding = '15px';
                itemDiv.style.border = '1px solid #e2e8f0';
                itemDiv.style.borderRadius = '8px';

                // Formatear las fechas para que se vean bien
                const fFirma = doc.fecha_firma ? new Date(doc.fecha_firma).toLocaleDateString() : 'N/A';
                const fVigencia = doc.vigencia ? new Date(doc.vigencia).toLocaleDateString() : 'N/A';
                const urlDescarga = `http://localhost:3000/${doc.ruta_archivo}`;

                itemDiv.innerHTML = `
                    <div style=\"display: flex; flex-direction: column; gap: 4px;\">
                        <strong style=\"color: #1e293b; font-size: 1.05rem;\">📄 ${doc.nombre_contrato}</strong>
                        <span style=\"font-size: 0.85rem; color: #64748b;\"><b>Firma:</b> ${fFirma} | <b>Vence:</b> ${fVigencia}</span>
                    </div>
                    <button type=\"button\" class=\"btn-descargar-pdf\" style=\"background-color: #b45309; color: white; border: none; padding: 8px 16px; border-radius: 4px; font-weight: bold; cursor: pointer;\">
                        <a href=\"${urlDescarga}\" target=\"_blank\" style=\"color: white; text-decoration: none;\">Visualizar / Descargar</a>
                    </button>
                `;

                contenedorLista.appendChild(itemDiv);
            });
        })
        .catch(err => {
            console.error("Error cargando los documentos de la BD:", err);
            contenedorLista.innerHTML = '<p style="color: #ef4444; text-align: center; font-style: italic; margin-top: 20px;">Error al conectar con la base de datos de expedientes.</p>';
        });
};