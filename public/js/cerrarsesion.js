if (!localStorage.getItem('usuarioActivo')) {
    window.location.replace('./iniciosesionadmin.html');
}

document.addEventListener('DOMContentLoaded', () => {
    const btnCerrarSesion = document.getElementById('btn-cerrar-sesion');
    
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener('click', (e) => {
            e.preventDefault();
            
            const ordenarSalida = confirm('¿Estás seguro de que desea cerrar sesión?');
            
            if (ordenarSalida) {
                localStorage.removeItem('usuarioActivo');
                window.location.replace('./iniciosesionadmin.html');
            }
        });
    }
});