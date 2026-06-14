document.getElementById('btn-enviar').addEventListener('click', function(e) {
    e.preventDefault(); // Evita que la página parpadee o se recargue sola cancelando el fetch

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

    fetch('http://localhost:3000/api/admin/registro', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nombre, email, password })
    })
    .then(response => {
        // Convierte la respuesta a JSON sin importar si el estatus es 200 o 400
        return response.json();
    })
    .then(data => {
        if (data.error) {
            // Si el servidor detectó el correo duplicado, mostrará el mensaje exacto aquí
            alert(data.error);
        } else {
            // Si el registro fue exitoso
            alert(data.mensaje);
            window.location.href = "./iniciosesionadmin.html";
        }
    })
    .catch(error => {
        console.error("Error en la petición fetch:", error);
        alert("Error de conexión con el servidor");
    });
});