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

    alert("Registro exitoso");
    window.location.href = "./menuprincipaladmin.html";
});