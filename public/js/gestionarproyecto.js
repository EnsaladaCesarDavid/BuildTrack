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
        if (!inputElemento) return;
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
        const presupuesto = parseFloat(inputPresupuesto.value) || 0;
        const material = parseFloat(inputMaterial.value) || 0;
        const gastos = parseFloat(inputGastos.value) || 0;

        if (presupuesto > 0) {
            evaluarPorcentajeTexto(txtPctMaterial, (material / presupuesto) * 100, 'del presupuesto');
            evaluarPorcentajeTexto(txtPctGastos, (gastos / presupuesto) * 100, 'del presupuesto');
        } else {
            evaluarPorcentajeTexto(txtPctMaterial, 0, 'del presupuesto');
            evaluarPorcentajeTexto(txtPctGastos, 0, 'del presupuesto');
        }

        const pctCimentacion = parseFloat(inputCimentacion.value) || 0;
        const pctMuros = parseFloat(inputMuros.value) || 0;
        const pctPiso = parseFloat(inputPiso.value) || 0;
        
        const promedio = (pctCimentacion + pctMuros + pctPiso) / 3;
        evaluarPorcentajeTexto(txtPctAvance, promedio, 'de Progreso Promedio');
    }

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
        btnGuardar.addEventListener('click', () => {
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

            alert('¡Métricas de progreso y costos actualizadas con éxito en el sistema!');
        });
    }

    recalcularPorcentajes();
    evaluarPorcentajeInput(inputCimentacion);
    evaluarPorcentajeInput(inputMuros);
    evaluarPorcentajeInput(inputPiso);
});