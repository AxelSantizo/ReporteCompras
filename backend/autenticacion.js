// Importación de express y router
const express = require('express'); 
const router = express.Router(); 
module.exports = router; 

const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

// Importación de la conexión a la base de datos
const { connection } = require('./connection');

const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const encryptionKey = crypto.createHash('sha256').update('my-secret-key-1234567890').digest();

// Función para desencriptar datos
function decrypt(encryptedText, key) {
    const [iv, encrypted] = encryptedText.split(':');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(Buffer.from(encrypted, 'hex'));
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

function encrypt(text, key) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}
  
// Ruta para activar TOTP
router.get('/activar-totp', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const secret = speakeasy.generateSecret({
        name: 'RCompras', // Nombre que aparece en la app de autenticación
        length: 20
    });

    // Guardar secret temporalmente en sesión para validación posterior
    req.session.tempTotpSecret = secret.base32;

    // Generar el código QR
    qrcode.toDataURL(secret.otpauth_url, (err, dataUrl) => {
        if (err) {
            console.error('Error generando QR:', err);
            return res.status(500).json({ error: 'Error generando el QR' });
        }

        res.json({
            qr: dataUrl,
            secret: secret.base32
        });
    });
});

router.post('/verificar-totp-setup', (req, res) => {
    const { token } = req.body;
    const tempSecret = req.session.tempTotpSecret;
    const idUsuario = req.session.IdUsuarioP;

    if (!tempSecret || !idUsuario) {
        return res.status(400).json({ error: 'Sesión expirada o inválida' });
    }

    const verified = speakeasy.totp.verify({
        secret: tempSecret,
        encoding: 'base32',
        token: token
    });

    if (!verified) {
        return res.status(401).json({ error: 'Código incorrecto. Intenta nuevamente.' });
    }

    const encryptedSecret = encrypt(tempSecret, encryptionKey);

    const updateQuery = 'UPDATE usuarios_compras SET totp_secret = ? WHERE IdUsuario = ?';
    connection.query(updateQuery, [encryptedSecret, idUsuario], (err, result) => {
        if (err) {
            console.error('Error guardando el TOTP:', err);
            return res.status(500).json({ error: 'Error al guardar el TOTP' });
        }

        // Limpia la sesión temporal
        delete req.session.tempTotpSecret;

        res.json({ success: true, message: 'TOTP activado correctamente' });
    });
});


router.post('/verificar-totp-login', (req, res) => {
    const { token } = req.body;
    const user = req.session.user;

    if (!user) return res.status(401).json({ error: 'No autenticado' });

    try {
        const decryptedTotp = decrypt(user.totp_secret, encryptionKey);

        const verified = speakeasy.totp.verify({
            secret: decryptedTotp,
            encoding: 'base32',
            token: token,
            window: 1
        });

        if (!verified) {
            return res.status(401).json({ error: 'Código inválido' });
        }

        // Si la verificación es exitosa, actualizar el estado del usuario a "open = 1"
        const updateQuery = 'UPDATE usuarios_compras SET open = 1 WHERE IdUsuario = ?';
        connection.query(updateQuery, [user.IdUsuario], (updateErr) => {
            if (updateErr) {
                console.error('Error al actualizar estado:', updateErr);
                return res.status(500).json({ error: 'Error al actualizar sesión' });
            }

            return res.json({ success: true, message: 'Inicio de sesión exitoso con TOTP' });
        });
    } catch (error) {
        console.error('Error verificando TOTP:', error.message);
        return res.status(500).json({ error: 'Error procesando TOTP' });
    }
});

// Método POST para el login
router.post('/login', async (req, res) => {
    const { usuario, contrasena } = req.body;

    if (!usuario || !contrasena) {
        res.status(400).json({ error: 'Por favor, llena todos los campos' });
        return;
    }

    // Consulta para verificar si el usuario existe en la base de datos
    const userQuery = 'SELECT * FROM usuarios_compras';
    connection.query(userQuery, async (err, results) => {
        if (err) {
            console.error('Error ejecutando la consulta:', err);
            res.status(500).json({ error: 'Error en el servidor' });
            return;
        }

        let foundUser = null;

        // Recorre todos los usuarios y desencripta para encontrar coincidencias
        for (let user of results) {
            try {
                const decryptedUsuario = decrypt(user.usuario, encryptionKey);

                if (decryptedUsuario === usuario) {
                    foundUser = user;
                    break;
                }
            } catch (error) {
                console.error('Error desencriptando el usuario:', error.message);
                continue; // Continúa con el siguiente usuario si hay un error de desencriptación
            }
        }

        if (!foundUser) {
            res.status(401).json({ error: 'Usuario incorrecto' });
        } else {
            // Comparar la contraseña proporcionada con la almacenada en la base de datos
            const passwordMatch = await bcrypt.compare(contrasena, foundUser.contrasena);
            if (passwordMatch) {

                if (foundUser.estado === 0) {
                    res.status(401).json({ error: 'Usuario inactivo' });
                    return;
                } else {
                    // Verificar si ya hay una sesión activa
                    if (foundUser.Open == 1) {
                        res.status(401).json({
                            error: 'El usuario ya tiene una sesión activa',
                            pregunta: '¿Desea cerrar la sesión activa y continuar?',
                            idUsuario: foundUser.IdUsuario // Asegúrate de usar el nombre correcto del campo
                        });
                        return;
                    } else {
                        // Si la actualización es exitosa, obtener los datos personales
                        const personalQuery = 'SELECT primer_nombre, segundo_nombre, primer_apellido, segundo_apellido FROM personal WHERE id = ?';

                        connection.query(personalQuery, [foundUser.IdPersonal], (err, personalResults) => {
                            if (err) {
                                console.error('Error al obtener los datos de personal:', err);
                                res.status(500).json({ error: 'Error en el servidor al obtener los datos de personal' });
                                return;
                            }

                            if (personalResults.length === 0) {
                                res.status(404).json({ error: 'No se encontró información de personal' });
                                return;
                            }

                            const personalData = personalResults[0];
                            const nombreCompleto = `${personalData.primer_nombre} ${personalData.segundo_nombre || ''} ${personalData.primer_apellido} ${personalData.segundo_apellido || ''}`.trim();

                            // Guardar la información del usuario y el nombre completo en la sesión
                            req.session.user = foundUser;
                            req.session.nombreCompleto = nombreCompleto;
                            req.session.IdUsuarioP = foundUser.IdUsuario;
                            req.session.IdDepartamento = foundUser.iddepartamento;
                            req.session.IdCategoria = foundUser.idcategoria;
                            req.session.paginas = foundUser.Pagina ? foundUser.Pagina.split(',') : [];
                            
                            let decryptedTotp = null;
                            if (foundUser.totp_secret && foundUser.totp_secret.trim() !== "") {
                                try {
                                    decryptedTotp = decrypt(foundUser.totp_secret, encryptionKey);
                                } catch (e) {
                                    decryptedTotp = null;
                                }
                            }

                            if (decryptedTotp) {
                                // Ya tiene TOTP configurado
                                return res.json({ requiereTOTP: false });
                            } else {
                                // Aún no lo tiene
                                return res.json({ requiereTOTP: true });
                            }
                        });
                    }
                }
            } else {
                res.status(401).json({ error: 'Contraseña incorrecta' });
            }
        }
    });
});

// Método POST para verificar el código de verificación
router.post('/verificar-codigo', (req, res) => {
    const { codigoIngresado } = req.body;

    // Recupera el objeto user almacenado en la sesión
    const user = req.session.user;

    if (!user) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (codigoIngresado === req.session.codigoVerificacion) {
        // Actualizar el campo 'open' a 1 para indicar que la sesión está activa
        const updateQuery = 'UPDATE usuarios_compras SET open = 1 WHERE IdUsuario = ?';
        connection.query(updateQuery, [user.IdUsuario], (updateErr) => {
            if (updateErr) {
                // Muestra el error si hay un problema al actualizar
                console.error('Error al actualizar el campo open:', updateErr); 
                return res.status(500).json({ error: 'Error en el servidor al actualizar el estado de la sesión' });
            }

            // Si ambas operaciones (inserción y actualización) son exitosas, responder con éxito
            res.json({ message: 'Código verificado correctamente, acceso permitido y sesión iniciada' });
        });
    } else {
        // Código incorrecto
        res.status(401).json({ error: 'Código incorrecto' });
    }
});

// Método POST para cerrar la sesión activa del usuario
router.post('/cerrarSesion', (req, res) => {
    const { idUsuario } = req.body;
    // Actualiza el campo 'open' a 0 para cerrar la sesión activa usando el IdUsuario
    const updateQuery = 'UPDATE usuarios_compras SET open = 0 WHERE IdUsuario = ?';
    connection.query(updateQuery, [idUsuario], (err) => {
        if (err) {
            console.error('Error cerrando la sesión activa:', err);
            res.status(500).json({ error: 'Error al cerrar la sesión activa' });
            return;
        }
        res.json({ message: 'Sesión cerrada exitosamente' });
    });
});

// Funcion open sirve obtener el estado open para cerrar sesion automaticamente
router.get('/getOpenStatus', (req, res) => {
    if (!req.session.IdUsuario) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const query = 'SELECT open FROM usuarios_compras WHERE IdUsuario = ?';
    connection.query(query, [req.session.IdUsuario], (err, result) => { // Corregir el uso de req.session.IdUsuario
        if (err) {
            console.error('Error al consultar el estado de open:', err);
            return res.status(500).json({ error: 'Error en la consulta' });
        }

        if (result.length > 0) {
            res.json({ open: result[0].open });
        } else {
            res.status(404).json({ error: 'Usuario no encontrado' });
        }
    });
});

// Funcion tipo sirve para validar si es la primera vez que el usuario ingresa para que cambie su contraseña
router.get('/getTipo', (req, res) => {
    if (!req.session.IdUsuario) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const query = 'SELECT Tipo FROM usuarios_compras WHERE IdUsuario = ?';
    connection.query(query, [req.session.IdUsuario], (err, result) => {
        if (err) {
            console.error('Error al consultar el estado de Tipo:', err);
            return res.status(500).json({ error: 'Error en la consulta' });
        }

        if (result.length > 0) {
            res.json({ Tipo: result[0].Tipo });
        } else {
            res.status(404).json({ error: 'Usuario no encontrado' });
        }
    });
});

// Ruta para cambiar la contraseña
router.post('/cambiarPassword', async (req, res) => {
    const { password } = req.body;  // Obtener la contraseña del cuerpo de la solicitud
    const userId = req.session.IdUsuario;  

    if (!password || password.length < 6) {
        return res.json({ success: false, message: 'Contraseña inválida' });
    }
    try {
        // Encriptar la nueva contraseña
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Actualizar la contraseña en la base de datos
        const query = 'UPDATE usuarios_compras SET contrasena = ?, tipo = 1 WHERE IdUsuario = ?';  // Ajusta según tu tabla
        connection.query(query, [hashedPassword, userId], (err, result) => {
            if (err) {
                console.error('Error al actualizar la contraseña:', err);
                return res.json({ success: false, message: 'Error en el servidor' });
            }

            if (result.affectedRows > 0) {
                // Contraseña actualizada correctamente
                res.json({ success: true });
            } else {
                // El usuario no fue encontrado
                res.json({ success: false, message: 'No se pudo actualizar la contraseña' });
            }
        });
    } catch (error) {
        console.error('Error al encriptar la contraseña:', error);
        res.json({ success: false, message: 'Error al procesar la solicitud' });
    }
});

// Método POST para recuperar la contraseña
router.post('/recuperarPassword', async (req, res) => {
    const { usuario, correo } = req.body;

    if (!usuario || !correo) {
        return res.status(400).json({ error: 'Por favor, llena todos los campos' });
    }

    // Consulta para obtener todos los usuarios
    const userQuery = 'SELECT * FROM usuarios_compras';
    connection.query(userQuery, async (err, results) => {
        if (err) {
            console.error('Error ejecutando la consulta:', err);
            return res.status(500).json({ error: 'Error en el servidor' });
        }

        let foundUser = null;

        // Desencriptar y buscar al usuario ingresado
        for (let user of results) {
            try {
                const decryptedUsuario = decrypt(user.usuario, encryptionKey);

                // Si el usuario desencriptado coincide con el ingresado
                if (decryptedUsuario === usuario) {
                    foundUser = user;
                    break;
                }
            } catch (error) {
                console.error('Error desencriptando el usuario:', error.message);
                continue; // Continuar con el siguiente usuario si hay error de desencriptación
            }
        }

        if (!foundUser) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Si la actualización es exitosa, obtener los datos personales
        const personalQuery = 'SELECT primer_nombre, segundo_nombre, primer_apellido, segundo_apellido FROM personal WHERE id = ?';

        connection.query(personalQuery, [foundUser.IdPersonal], (err, personalResults) => {
            if (err) {
                console.error('Error al obtener los datos de personal:', err);
                res.status(500).json({ error: 'Error en el servidor al obtener los datos de personal' });
                return;
            }

            if (personalResults.length === 0) {
                res.status(404).json({ error: 'No se encontró información de personal' });
                return;
            }

            const personalData = personalResults[0];
            const nombreCompleto = `${personalData.primer_nombre} ${personalData.segundo_nombre || ''} ${personalData.primer_apellido} ${personalData.segundo_apellido || ''}`.trim();

            // Guardar la información del usuario y el nombre completo en la sesión
            req.session.user = foundUser;
            req.session.nombreCompleto = nombreCompleto;
            req.session.IdProveedor = foundUser.IdProveedor;
            req.session.IdUsuario = foundUser.IdUsuario;
            req.session.IdDepartamento = foundUser.iddepartamento;
            req.session.IdCategoria = foundUser.idcategoria;

            const codigoVerificacion = generarCodigoVerificacion();
            req.session.codigoVerificacion = codigoVerificacion;
            
            // Enviar el código al correo del usuario
            enviarCorreo(decryptedCorreo, codigoVerificacion);

            console.log(codigoVerificacion, decryptedCorreo);

            // Nueva consulta para actualizar la tabla 'usuarios_proveedor'
            const updateQuery = 'UPDATE usuarios_compras SET tipo = 0, open = 0 WHERE IdUsuario = ?';
            connection.query(updateQuery, [foundUser.IdUsuario], (updateErr, updateResult) => {
                if (updateErr) {
                    console.error('Error al actualizar los valores de tipo y open:', updateErr);
                    return res.status(500).json({ error: 'Error al actualizar el estado del usuario' });
                }

                // Respuesta exitosa después de enviar el correo y actualizar la tabla
                return res.json({
                    message: 'Código de verificación generado. Por favor, revisa tu correo para restablecer la contraseña.',
                    correoDestino: decryptedCorreo
                });
            });
        });
    });
});

// Verificar si la nueva contraseña es igual a la anterior
router.post('/verificarPass', async (req, res) => {
    const { password } = req.body;

    // Verificar si el IdUsuarioP está disponible en la sesión
    const idUsuarioP = req.session.IdUsuario;
    if (!idUsuarioP) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Consulta para obtener la contraseña hasheada desde la base de datos
    const query = 'SELECT contrasena FROM usuarios_compras WHERE IdUsuario = ?';
    connection.query(query, [idUsuarioP], async (err, result) => {
        if (err) {
            console.error('Error ejecutando la consulta:', err);
            return res.status(500).json({ error: 'Error en la consulta' });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const hashedPassword = result[0].contrasena;

        // Comparar la nueva contraseña con la contraseña hasheada almacenada
        try {
            const isSamePassword = await bcrypt.compare(password, hashedPassword);
            if (isSamePassword) {
                return res.json({ isSamePassword: true }); // Nueva contraseña es igual a la antigua
            } else {
                return res.json({ isSamePassword: false }); // Nueva contraseña es diferente
            }
        } catch (error) {
            console.error('Error comparando las contraseñas:', error);
            return res.status(500).json({ error: 'Error al comparar contraseñas' });
        }
    });
});

// Ruta para verificar la autenticación del usuario
router.get('/verify', (req, res) => {
    if (req.session.user) {
        res.json({ authenticated: true });
    } else {
        res.json({ authenticated: false });
    }
});