document.addEventListener('DOMContentLoaded', () => {
    const elementoBadge = document.querySelector('.etiqueta-id-proyecto') || { textContent: 'PROJ-88231' };
    const idProyectoActual = elementoBadge.textContent.trim();

    // Referencias de Elementos de Interfaz
    const inputArchivo = document.getElementById('input-archivo-pdf');
    const inputNombre = document.getElementById('input-nombre-contrato');
    const inputFirma = document.getElementById('input-fecha-firma');
    const inputVigencia = document.getElementById('input-vigencia');
    
    const btnSubir = document.getElementById('btn-subir-documento');
    const btnGuardarCambios = document.getElementById('btn-guardar-cambios');
    const btnDescargar = document.querySelector('.btn-descargar-pdf');

    let idDocumentoGuardado = null;

    if (btnSubir) {
        btnSubir.addEventListener('click', async (e) => {
            e.preventDefault();

            const archivo = inputArchivo.files[0];
            if (!archivo) return alert('Por favor, selecciona un archivo.');
            
            if (archivo.type !== 'application/pdf') {
                return alert('Error: El archivo debe ser exclusivamente en formato .pdf');
            }

            const formData = new FormData();
            formData.append('pdf_contrato', archivo);
            formData.append('nombre_contrato', inputNombre.value);
            formData.append('fecha_firma', inputFirma.value);
            formData.append('vigencia', inputVigencia.value);

            try {
                const respuesta = await fetch(`/api/proyectos/${idProyectoActual}/documento`, {
                    method: 'POST',
                    body: formData
                });

                const datos = await respuesta.json();
                if (respuesta.ok) {
                    alert('¡Archivo guardado e indexado exitosamente!');
                    idDocumentoGuardado = datos.id_documento;
                } else {
                    alert('Error: ' + datos.error);
                }
            } catch (error) {
                console.error(error);
                alert('Ocurrió un error en la conexión de red.');
            }
        });
    }

    if (btnGuardarCambios) {
        btnGuardarCambios.addEventListener('click', async () => {
            if (!idDocumentoGuardado) return alert('No hay ningún documento activo para editar.');

            const datosModificados = {
                nombre_contrato: inputNombre.value,
                fecha_firma: inputFirma.value,
                vigencia: inputVigencia.value
            };

            try {
                const respuesta = await fetch(`/api/documento/${idDocumentoGuardado}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(datosModificados)
                });

                if (respuesta.ok) {
                    alert('Datos modificados con éxito en la base de datos.');
                } else {
                    alert('No se pudo actualizar.');
                }
            } catch (error) {
                console.error(error);
            }
        });
    }

    if (btnDescargar) {
        btnDescargar.addEventListener('click', () => {
            if (!idDocumentoGuardado) {
                return alert('No hay ningún documento guardado disponible para descargar en este proyecto.');
            }
            window.location.href = `/api/documento/${idDocumentoGuardado}/descargar`;
        });
    }
});