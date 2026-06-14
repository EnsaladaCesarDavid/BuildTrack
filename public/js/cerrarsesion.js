const usuarioActivo = localStorage.getItem('usuarioActivo');

document.addEventListener('DOMContentLoaded', () => {
    if (usuarioActivo == 'false') {
        window.location.replace('./iniciosesionadmin.html');
    }
    
    const btnCerrarSesion = document.getElementById('btn-cerrar-sesion');
    
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener('click', (e) => {
            e.preventDefault();
            
            const ordenarSalida = confirm('¿Estás seguro de que desea cerrar sesión?');
            
            if (ordenarSalida) {
                localStorage.setItem('usuarioActivo', 'false');
                window.location.replace('./iniciosesionadmin.html');
            }
        });
    }
});