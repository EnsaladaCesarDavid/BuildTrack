document.addEventListener('DOMContentLoaded', () => {
    const inputMaterial = document.getElementById('input-material');
    const inputGastos = document.getElementById('input-gastos');
    const inputPresupuesto = document.getElementById('input-presupuesto');

    const txtPctMaterial = document.getElementById('txt-pct-material');
    const txtPctGastos = document.getElementById('txt-pct-gastos');
    const txtPctAvance = document.getElementById('txt-pct-avance');

    const inputCimentacion = document.getElementById('input-pct-cimentacion');
    const inputMuros = document.getElementById('input-pct-muros');
    const inputPiso = document.getElementById('input-pct-piso');

    const inputFechaInicio = document.getElementById('input-fecha-inicio');
    const inputFechaFin = document.getElementById('input-fecha-fin');
    const inputFechaSalida = document.getElementById('input-fecha-salida');
    const inputFechaInstalacion = document.getElementById('input-fecha-instalacion');

    const btnGuardar = document.getElementById('btn-guardar-metricas') || document.querySelector('button');
    const badgeProyecto = document.getElementById('proyecto-id-badge');

    // Recuperación del ID por URL o localStorage de respaldo
    const urlParams = new URLSearchParams(window.location.search);
    let idProyecto = urlParams.get('id') || localStorage.getItem('proyecto_seleccionado_id');

    // Corta el formato ISO de la base de datos (YYYY-MM-DDT...) a YYYY-MM-DD para el input HTML
    function formatearFechaISO(fechaCompleta) {
        if (!fechaCompleta) return '';
        return fechaCompleta.split('T')[0];
    }

    if (idProyecto) {
        if (badgeProyecto) badgeProyecto.textContent = idProyecto;
        
        // Consultamos los datos operativos reales del backend
        fetch(`http://localhost:3000/api/proyecto/${idProyecto}`)
            .then(res => {
                if(!res.ok) throw new Error("Proyecto no encontrado");
                return res.json();
            })
            .then(proyectoReal => {
                if (inputPresupuesto) {
                    const valorPresupuesto = parseFloat(proyectoReal.presupuesto) || 0;
                    inputPresupuesto.value = valorPresupuesto.toLocaleString('en-US');
                    inputPresupuesto.readOnly = true;
                }

                if (inputMaterial) inputMaterial.value = proyectoReal.material || 0;
                if (inputGastos) inputGastos.value = proyectoReal.gastos || 0;
                if (inputCimentacion) inputCimentacion.value = proyectoReal.cimentacion || 0;
                if (inputMuros) inputMuros.value = proyectoReal.muros || 0;
                if (inputPiso) inputPiso.value = proyectoReal.piso || 0;

                // Asignamos las fechas procesadas de forma segura
                if (inputFechaInicio) inputFechaInicio.value = formatearFechaISO(proyectoReal.fecha_inicio);
                if (inputFechaFin) inputFechaFin.value = formatearFechaISO(proyectoReal.fecha_fin);
                if (inputFechaSalida) inputFechaSalida.value = formatearFechaISO(proyectoReal.fecha_salida);
                if (inputFechaInstalacion) inputFechaInstalacion.value = formatearFechaISO(proyectoReal.fecha_instalacion);

                recalcularPorcentajes();
            })
            .catch(err => console.error("Error al leer especificaciones del servidor:", err));

        // --- SECCIÓN INYECTADA: Carga de PDFs asociados al proyecto ---
        consultarExpedientesDelProyecto(idProyecto);
    } else {
        const divVisor = document.getElementById('visor-documentos-gestion');
        if (divVisor) {
            divVisor.innerHTML = '<p style="color: #ef4444; font-style: italic; text-align: center;">Error: No se localizó un parámetro ID válido en la URL.</p>';
        }
    }

    function evaluarPorcentajeTexto(elemento, valorPorcentaje, sufijo) {
        if (!elemento) return;
        elemento.textContent = `${valorPorcentaje.toFixed(0)}% ${sufijo}`;
        elemento.style.color = valorPorcentaje > 100 ? '#ef4444' : '#4b5563';
    }

    function recalcularPorcentajes() {
        const presupuesto = parseFloat(inputPresupuesto?.value.replace(/,/g, '')) || 0;
        const material = parseFloat(inputMaterial?.value) || 0;
        const gastos = parseFloat(inputGastos?.value) || 0;

        if (presupuesto > 0) {
            evaluarPorcentajeTexto(txtPctMaterial, (material / presupuesto) * 100, 'del presupuesto');
            evaluarPorcentajeTexto(txtPctGastos, (gastos / presupuesto) * 100, 'del presupuesto');
        }

        const promedio = ((parseFloat(inputCimentacion?.value) || 0) + (parseFloat(inputMuros?.value) || 0) + (parseFloat(inputPiso?.value) || 0)) / 3;
        evaluarPorcentajeTexto(txtPctAvance, promedio, 'de Progreso Promedio');
    }

    if (inputMaterial) inputMaterial.addEventListener('input', recalcularPorcentajes);
    if (inputGastos) inputGastos.addEventListener('input', recalcularPorcentajes);
    [inputCimentacion, inputMuros, inputPiso].forEach(i => i?.addEventListener('input', recalcularPorcentajes));

    // ACCION DEL BOTON GUARDAR CAMBIOS CON FILTRO INTEGRAL DE CRONOGRAMA
    if (btnGuardar) {
        btnGuardar.addEventListener('click', async (e) => {
            e.preventDefault();

            // Si el ID dinámico de la URL falló, intentamos recuperarlo del badge visual antes de dar error
            if (!idProyecto && badgeProyecto && badgeProyecto.textContent) {
                idProyecto = badgeProyecto.textContent.trim();
            }

            // Alerta de seguridad si de verdad no hay ID de ningún tipo
            if (!idProyecto || idProyecto === "" || idProyecto.includes("Error")) {
                alert('❌ Error: No se puede actualizar porque no se detectó un identificador de proyecto válido en esta vista.');
                return;
            }

            const fInicioVal = inputFechaInicio.value;
            const fFinVal = inputFechaFin.value;
            const fSalidaVal = inputFechaSalida.value;
            const fInstalacionVal = inputFechaInstalacion.value;

            // --- VALIDACIONES DE TIEMPO EN CADENA STAFFA ---
            const fInicio = new Date(fInicioVal);
            const fFin = new Date(fFinVal);
            const fSalida = new Date(fSalidaVal);
            const fInstalacion = new Date(fInstalacionVal);

            if (fFin < fInicio) {
                alert('Cronograma inválido:\nLa finalización de la construcción no puede ser previa al día de inicio.');
                return;
            }
            if (fSalida < fFin) {
                alert('Cronograma inválido:\nLa casa modular no puede salir/trasladarse antes de que termine su construcción en fábrica.');
                return;
            }
            if (fInstalacion < fSalida) {
                alert('Cronograma inválido:\nLa casa no puede ser instalada en el terreno antes de la fecha en que sale de la fábrica.');
                return;
            }

            // SOLUCIÓN TOTAL: Mandamos tanto 'id' como 'id_proyecto' para que el backend acepte cualquiera de los dos esquemas
            const datosProyectoBackend = {
                id: idProyecto,
                id_proyecto: idProyecto,
                presupuesto: parseFloat(inputPresupuesto.value.replace(/,/g, '')) || 0,
                material: parseFloat(inputMaterial.value) || 0,
                gastos: parseFloat(inputGastos.value) || 0,
                cimentacion: parseFloat(inputCimentacion.value) || 0,
                muros: parseFloat(inputMuros.value) || 0,
                piso: parseFloat(inputPiso.value) || 0,
                fecha_inicio: fInicioVal,
                fecha_fin: fFinVal,
                fecha_salida: fSalidaVal,
                fecha_instalacion: fInstalacionVal
            };

            try {
                const respuesta = await fetch('http://localhost:3000/api/proyectos/actualizar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(datosProyectoBackend)
                });

                const resultadoServidor = await respuesta.json().catch(() => ({}));

                if (respuesta.ok) {
                    alert('🎉 ¡Especificaciones y cronograma de fechas actualizados con éxito en MySQL!');
                    window.location.reload();
                } else {
                    alert(`❌ El servidor rechazó los datos: ${resultadoServidor.error || 'Verifica los parámetros enviados.'}`);
                }
            } catch (error) {
                alert('❌ Error de red al intentar conectar con el servidor.');
            }
        });
    }
});

// Función aislada para conectar con el endpoint de expedientes y renderizar las tarjetas de descarga
function consultarExpedientesDelProyecto(idProyecto) {
    const divVisor = document.getElementById('visor-documentos-gestion');
    if (!divVisor) return;

    fetch(`http://localhost:3000/api/documentos-proyecto/${idProyecto}`)
        .then(res => res.json())
        .then(documentos => {
            divVisor.innerHTML = ''; 

            if (!documentos || documentos.length === 0) {
                divVisor.innerHTML = `
                    <p style="color: #94a3b8; font-style: italic; text-align: center; padding: 15px; background: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1; width: 100%; box-sizing: border-box;">
                        No se han cargado contratos ni permisos para este proyecto desde el módulo documental.
                    </p>
                `;
                return;
            }

            documentos.forEach(doc => {
                const filaDoc = document.createElement('div');
                filaDoc.style.display = 'flex';
                filaDoc.style.justifyContent = 'space-between';
                filaDoc.style.alignItems = 'center';
                filaDoc.style.padding = '12px 16px';
                filaDoc.style.background = '#f8fafc';
                filaDoc.style.border = '1px solid #e2e8f0';
                filaDoc.style.borderRadius = '8px';
                filaDoc.style.width = '100%';
                filaDoc.style.boxSizing = 'border-box';

                const fFirma = doc.fecha_firma ? new Date(doc.fecha_firma).toLocaleDateString('es-MX') : 'No estipulada';
                const fVence = doc.vigencia ? new Date(doc.vigencia).toLocaleDateString('es-MX') : 'Vigencia permanente';
                const rutaCompletaPDF = `http://localhost:3000/${doc.ruta_archivo}`;

                filaDoc.innerHTML = `
                    <div style="display: flex; flex-direction: column; gap: 4px; text-align: left;">
                        <span style="font-weight: bold; color: #1e293b; font-size: 0.98rem;">📄 ${doc.nombre_contrato}</span>
                        <span style="font-size: 0.82rem; color: #64748b;">
                            <b>Firma:</b> ${fFirma} | <b>Vencimiento:</b> ${fVence}
                        </span>
                    </div>
                    <a href="${rutaCompletaPDF}" target="_blank" style="
                        background: #ff8c2b; 
                        color: white; 
                        text-decoration: none; 
                        padding: 8px 16px; 
                        border-radius: 6px; 
                        font-weight: bold; 
                        font-size: 0.85rem;
                        box-shadow: 0 2px 4px rgba(255,140,43,0.15);
                        display: inline-block;
                        text-align: center;
                    ">
                        Ver Documento
                    </a>
                `;
                
                divVisor.appendChild(filaDoc);
            });
        })
        .catch(error => {
            console.error("Error cargando los PDFs adjuntos:", error);
            divVisor.innerHTML = '<p style="color: #ef4444; font-style: italic; text-align: center;">Error de comunicación al consultar el repositorio de archivos.</p>';
        });
}