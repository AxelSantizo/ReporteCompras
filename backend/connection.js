//Importacion de libreria de mysql
const mysql = require('mysql2');//Conexion a la base de datos

//Se crea la constante connection que es la que se va a utilizar para conectarse a la base de datos
const connection = mysql.createConnection({
    host: '50.6.171.160', //IP de la base de datos
    database: 'qige86ho_nexus', //Nombre de la base de datos
    user: 'axel', //Usuario de la base de datos
    password: 'bode.Sistemas1988!' //Contraseña de la base de datos
});

//Testea la conexion 
connection.connect((err) => {
    if (err) {
        console.error('No se pudo conectar a la base de datos:', err);
        return;
    }
});

//Exporta la conexion para ser utilizada en otros archivos
module.exports = {
    connection
};