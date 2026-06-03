document.getElementById('btn-enviar').addEventListener('click', function() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!email || !password) {
        alert("Por favor, completa todos los campos.");
        return;
    }

    fetch('http://localhost:3000/api/login-cliente', {
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
            window.location.href = "./menuprincipalcliente.html";
        }
    })
    .catch(error => {
        alert("Error de conexión con el servidor");
    });
});