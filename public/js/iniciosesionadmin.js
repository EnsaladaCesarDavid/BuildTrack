document.getElementById('btn-enviar').addEventListener('click', function(e) {
    e.preventDefault(); // Detiene cualquier comportamiento automático de recarga

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!email || !password) {
        alert("Por favor, complete todos los campos.");
        return;
    }

    fetch('http://localhost:3000/api/login-admin', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            alert("¡Bienvenido de nuevo, " + data.nombre + "!");
            localStorage.setItem('usuarioActivo', 'true');
            
            // REDIRECCIÓN CORRECTA: Va directo al menú principal de administración
            window.location.href = "./menuprincipaladmin.html";
        }
    })
    .catch(error => {
        console.error(error);
        alert("Error de conexión con el servidor");
    });
});