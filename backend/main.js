// Importación de las librerías necesarias
const express = require('express'); 
const path = require('path'); 
const session = require('express-session'); 
const app = express(); 
const PORT = 4000; 

// Define el prefijo base
const basePath = '/RCompras/';

// Importación de la conexión a la base de datos
const { connection } = require('./connection');

// Permite a Express procesar solicitudes con datos JSON
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

// Configurar la sesión
app.use(session({
    secret: 'laBodegona24451.1988', 
    resave: false, 
    saveUninitialized: true,
    cookie: { secure: false } 
}));

// Middleware para servir archivos estáticos (CSS, JS, imágenes, etc.)
app.use(basePath, express.static(path.join(__dirname, '..')));

// Ruta para dirigir la página principal (login)
app.get(basePath, (req, res) => { // Cambiado para usar el prefijo
    if (req.session) {
        req.session.destroy(err => {
            if (err) {
                console.error('Error destruyendo la sesión:', err);
            }
            res.clearCookie('connect.sid'); 
            res.sendFile(path.join(__dirname, '..', 'views', 'login.html'));
        });
    } else {
        res.sendFile(path.join(__dirname, '..', 'views', 'login.html'));
    }
});

// Ruta para obtener el nombre completo
app.get(basePath + 'auth/nombre', (req, res) => {
    if (req.session.nombreCompleto) {
        res.json({
            nombreCompleto: req.session.nombreCompleto
        });
    } else {
        res.status(401).json({ error: 'No autenticado' });
    }
});

// Middleware para verificar la sesión
const verificarSesion = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect(basePath);
    }
};

// Aplicar el middleware a todas las rutas protegidas
app.use([basePath + 'menu', basePath + 'categorias', basePath + 'inventario', basePath + 'ventas'], verificarSesion);

app.get(basePath + 'menu', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'menu.html'));
});

app.get(basePath + 'categorias', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'categorias.html'));
});

app.get(basePath + 'inventario', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'inventario.html')); 
});

app.get(basePath + 'ventas', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'ventas.html'));
});

app.get(basePath + 'logout', (req, res) => {
    const user = req.session.user;

    if (!user) {
        return res.status(400).json({ success: false, message: 'No hay sesión activa' });
    }

    // Actualizar el campo 'open' a 0 antes de destruir la sesión
    const updateQuery = 'UPDATE usuarios_compras SET open = 0 WHERE IdUsuario = ?';
    connection.query(updateQuery, [user.IdUsuario], (updateErr) => {
        if (updateErr) {
            console.error('Error al actualizar el campo open:', updateErr);
            return res.status(500).json({ success: false, message: 'Error al cerrar la sesión correctamente' });
        }

        // Destruir la sesión después de actualizar el campo 'open'
        req.session.destroy(err => {
            if (err) {
                return res.status(500).json({ success: false, message: 'No se pudo cerrar la sesión' });
            }
            res.clearCookie('connect.sid');
            res.json({ success: true, message: 'Sesión cerrada exitosamente' });
        });
    });
});

// Importar y usar los routers con el prefijo
const authRouter = require('./autenticacion');
app.use(basePath + 'auth', authRouter);

const ventasRouter = require('../backend/ventas');
app.use(basePath + 'backend', ventasRouter);

const categoriasRouter = require('../backend/categorias');
app.use(basePath + 'backendCategorias', categoriasRouter);

const inventarioRouter = require('../backend/inventario');
app.use(basePath + 'backendInventario', inventarioRouter);

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}${basePath}`);
});

// Middleware para controlar el caché
const noCache = (req, res, next) => {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    next();
};

// Aplicar el middleware a todas las rutas
app.use(noCache);
