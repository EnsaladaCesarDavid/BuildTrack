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

    const btnGuardar = document.getElementById('btn-guardar-metricas');
    const badgeProyecto = document.getElementById('proyecto-id-badge');

    const usuarioActivo = localStorage.getItem('usuarioActivo') || '';
    const rolUsuario = localStorage.getItem('rolUsuario') || '';
    
    const esCliente = usuarioActivo.toLowerCase().includes('cliente') || rolUsuario.toLowerCase() === 'cliente';

    if (esCliente) {
        const camposModoLectura = [inputMaterial, inputGastos, inputPresupuesto, inputCimentacion, inputMuros, inputPiso];
        
        camposModoLectura.forEach(input => {
            if (input) {
                input.readOnly = true;
                
                input.style.backgroundColor = 'transparent';
                input.style.border = 'none';
                input.style.outline = 'none';
                input.style.padding = '0';
                input.style.fontWeight = 'bold';
                input.style.color = '#1f2937';
                input.style.pointerEvents = 'none';
                
                if (input.id.includes('pct') && !input.dataset.sufijoAplicado) {
                    input.value = input.value + '%';
                    input.dataset.sufijoAplicado = "true";
                }
            }
        });

        if (btnGuardar) {
            btnGuardar.style.display = 'none';
        }
    }

    const urlParams = new URLSearchParams(window.location.search);
    const idProyecto = urlParams.get('id');

    if (idProyecto) {
        if (badgeProyecto) {
            badgeProyecto.textContent = idProyecto;
        }
        const proyectosGlobales = JSON.parse(localStorage.getItem('buildtrack_proyectos')) || [];
        const proyectoEncontrado = proyectosGlobales.find(p => p.id === idProyecto);
        if (proyectoEncontrado && inputPresupuesto) {
            inputPresupuesto.value = proyectoEncontrado.presupuesto || 500000;
        }
    }

    function evaluarPorcentajeTexto(elemento, valorPorcentaje, sufijo) {
        if (!elemento) return;
        elemento.textContent = `${valorPorcentaje.toFixed(0)}% ${sufijo}`;
        if (valorPorcentaje > 100) {
            elemento.style.color = '#ef4444';
            elemento.style.fontWeight = 'bold';
        } else {
            elemento.style.color = '#4b5563';
            elemento.style.fontWeight = 'normal';
        }
    }

    function evaluarPorcentajeInput(inputElemento) {
        if (!inputElemento || esCliente) return; 
        const valor = parseFloat(inputElemento.value) || 0;
        if (valor > 100) {
            inputElemento.style.color = '#ef4444';
            inputElemento.style.borderColor = '#ef4444';
            inputElemento.style.fontWeight = 'bold';
        } else {
            inputElemento.style.color = '#1f2937';
            inputElemento.style.borderColor = '#cbd5e1';
            inputElemento.style.fontWeight = 'bold';
        }
    }

    function recalcularPorcentajes() {
        const parseValorSeguro = (input) => {
            if (!input) return 0;
            let strVal = input.value.toString().replace('%', '');
            return parseFloat(strVal) || 0;
        };

        const presupuesto = parseValorSeguro(inputPresupuesto);
        const material = parseValorSeguro(inputMaterial);
        const gastos = parseValorSeguro(inputGastos);

        if (presupuesto > 0) {
            evaluarPorcentajeTexto(txtPctMaterial, (material / presupuesto) * 100, 'del presupuesto');
            evaluarPorcentajeTexto(txtPctGastos, (gastos / presupuesto) * 100, 'del presupuesto');
        } else {
            evaluarPorcentajeTexto(txtPctMaterial, 0, 'del presupuesto');
            evaluarPorcentajeTexto(txtPctGastos, 0, 'del presupuesto');
        }

        const pctCimentacion = parseValorSeguro(inputCimentacion);
        const pctMuros = parseValorSeguro(inputMuros);
        const pctPiso = parseValorSeguro(inputPiso);
        
        const promedio = (pctCimentacion + pctMuros + pctPiso) / 3;
        evaluarPorcentajeTexto(txtPctAvance, promedio, 'de Progreso Promedio');
    }

    if (!esCliente) {
        if (inputMaterial) inputMaterial.addEventListener('input', recalcularPorcentajes);
        if (inputGastos) inputGastos.addEventListener('input', recalcularPorcentajes);
        if (inputPresupuesto) inputPresupuesto.addEventListener('input', recalcularPorcentajes);

        [inputCimentacion, inputMuros, inputPiso].forEach(input => {
            if (input) {
                input.addEventListener('input', () => {
                    evaluarPorcentajeInput(input);
                    recalcularPorcentajes();
                });
            }
        });

        if (btnGuardar) {
            btnGuardar.addEventListener('click', async () => {
                const presupuesto = parseFloat(inputPresupuesto.value) || 0;
                const material = parseFloat(inputMaterial.value) || 0;
                const gastos = parseFloat(inputGastos.value) || 0;

                const pctCimentacion = parseFloat(inputCimentacion.value) || 0;
                const pctMuros = parseFloat(inputMuros.value) || 0;
                const pctPiso = parseFloat(inputPiso.value) || 0;

                if (presupuesto <= 0 || material < 0 || gastos < 0) {
                    alert('Por favor, ingresa montos numéricos válidos mayores o iguales a cero.');
                    return;
                }

                if (pctCimentacion > 100 || pctMuros > 100 || pctPiso > 100 || pctCimentacion < 0 || pctMuros < 0 || pctPiso < 0) {
                    alert('Los porcentajes específicos de desglose de obra no pueden exceder el 100%.');
                    return;
                }

                const dataSuma = material + gastos;

                if (dataSuma > presupuesto) {
                    alert(`Error: La suma de los conceptos financieros ($${dataSuma.toLocaleString()}) excede el presupuesto total asignado de ($${presupuesto.toLocaleString()}).`);
                    return;
                }

                const datosProyecto = {
                    id: idProyecto,
                    presupuesto: presupuesto,
                    material: material,
                    gastos: gastos,
                    cimentacion: pctCimentacion,
                    muros: pctMuros,
                    piso: pctPiso
                };

                try {
                    const respuesta = await fetch('http://localhost:3000/api/proyectos/actualizar', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(datosProyecto)
                    });

                    if (respuesta.ok) {
                        alert('¡Métricas de progreso y costos guardadas con éxito en la base de datos!');
                    } else {
                        alert('Hubo un problema en el servidor al intentar guardar los datos.');
                    }
                } catch (error) {
                    alert('Error de conexión: No se pudo comunicar con la base de datos.');
                }
            });
        }
    }

    recalcularPorcentajes();
    if (!esCliente) {
        evaluarPorcentajeInput(inputCimentacion);
        evaluarPorcentajeInput(inputMuros);
        evaluarPorcentajeInput(inputPiso);
    }
});