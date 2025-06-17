document.addEventListener('DOMContentLoaded', function() { 
    // Variable global para el prefijo de ruta
    const basePath = '/RCompras/';

    // Actualizar la fecha y la hora al cargar la página
    updateDateTime();

    // Actualizar la hora cada segundo
    setInterval(updateDateTime, 1000);
    function updateDateTime() {
        const currentHour = new Date().getHours();

        document.getElementById('fechahora').textContent = new Date().toLocaleString();    

        if (currentHour < 12) {
            document.getElementById('bienvenida').textContent = 'Buenos días';
        } else if (currentHour < 18) {
            document.getElementById('bienvenida').textContent = 'Buenas tardes';
        } else {
            document.getElementById('bienvenida').textContent = 'Buenas noches';
        }
    }

    // Verificar la autenticación del usuario en el cliente
    fetch(`${basePath}auth/verify`)
    .then(response => response.json())
    .then(data => {
        if (!data.authenticated) {
            window.location.href = `${basePath}`;
        } else {
            // Obtener el nombre completo del usuario
            fetch(`${basePath}auth/nombre`)
            .then(response => response.json())
            .then(nombreData => {
                if (nombreData.nombreCompleto) {
                    document.getElementById('nombreCompleto').textContent = nombreData.nombreCompleto;
                }
            })
            .catch(error => {
                console.error('Error al obtener el nombre completo:', error);
            });
        }
    })
    .catch(error => {
        console.error('Error al verificar la autenticación:', error);
        window.location.href = `${basePath}`;
    });
});
