document.getElementById('btn-enviar').addEventListener('click', function() {
    const nombre = document.getElementById('nombre').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    const regexLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!regexLetras.test(nombre)) {
        alert("El nombre de usuario solo debe contener letras.");
        return;
    }

    if (nombre.length < 3) {
        alert("Su nombre debe contener al menos 3 caracteres.");
        return;
    }

    if (!regexEmail.test(email)) {
        alert("Por favor, ingresa un correo electrónico válido.");
        return;
    }

    if (password.length < 8) {
        alert("La contraseña debe tener al menos 8 caracteres.");
        return;
    }

    fetch('http://localhost:3000/api/registro-admin', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nombre, email, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            alert(data.mensaje);
            window.location.href = "./menuprincipaladmin.html";
        }
    })
    .catch(error => {
        alert("Error de conexión con el servidor");
    });
});