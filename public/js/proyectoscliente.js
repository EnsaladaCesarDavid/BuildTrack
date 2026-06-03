document.getElementById('btn-agregar-proyecto').addEventListener('click', function() {
    const idProyecto = prompt("Por favor, ingresa el ID de 8 dígitos del proyecto que deseas vincular:");
    
    if (idProyecto === null) return;

    const idLimpio = idProyecto.trim();

    if (idLimpio === "") {
        alert("El ID no puede estar vacío.");
        return;
    }

    if (!/^\d{8}$/.test(idLimpio)) {
        alert("El formato es inválido. Recuerda que debe ser un número de exactamente 8 dígitos.");
        return;
    }

    fetch(`http://localhost:3000/api/proyecto/${idLimpio}`)
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw new Error(err.error); });
        }
        return response.json();
    })
    .then(data => {
        const sublista = document.getElementById('sublista-proyectos');
        
        const nuevoElemento = document.createElement('li');
        nuevoElemento.textContent = `- ${data.nombre}`;
        nuevoElemento.style.margin = "4px 0";
        nuevoElemento.style.fontSize = "0.9rem";
        
        sublista.appendChild(nuevoElemento);
        alert(`¡Proyecto "${data.nombre}" vinculado exitosamente!`);
    })
    .catch(error => {
        alert(error.message || "Error de conexión con el servidor");
    });
});