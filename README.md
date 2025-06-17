# ReporteCompras

## Descripción General

**ReporteCompras** es una aplicación web desarrollada en Node.js y Express que permite a proveedores y administradores consultar, filtrar y exportar reportes de compras, inventarios y ventas de una cadena de supermercados. El sistema está diseñado para ser seguro, fácil de usar y accesible desde cualquier navegador moderno.

## Características Principales

- **Autenticación de usuarios**: Inicio de sesión seguro con recuperación de contraseña vía correo electrónico.
- **Gestión de sesiones**: Uso de sesiones para mantener la autenticación y proteger las rutas.
- **Reportes dinámicos**: Consulta y exportación de reportes de inventario, ventas y categorías, filtrados por sucursal, fechas, departamentos, categorías y subcategorías.
- **Interfaz moderna**: Uso de Bootstrap, DataTables y temas claro/oscuro.
- **Exportación de datos**: Descarga de reportes en formato CSV.
- **Control de acceso**: Restricción de funcionalidades según el usuario autenticado.

## Estructura del Proyecto

```
ReporteCompras/
│
├── backend/
│   ├── autenticacion.js      # Lógica de autenticación y sesiones
│   ├── categorias.js         # Endpoints para reportes y filtros de categorías
│   ├── connection.js         # Configuración de la conexión a la base de datos
│   ├── inventario.js         # Endpoints para reportes y filtros de inventario
│   ├── main.js               # Configuración principal del backend y rutas generales
│   └── ventas.js             # Endpoints para reportes y filtros de ventas
│
├── css/
│   ├── claro.css             # Estilos para el tema claro
│   └── oscuro.css            # Estilos para el tema oscuro
│
├── img/                      # Imágenes utilizadas en la interfaz
│
├── js/
│   ├── categorias.js         # Lógica frontend para reportes de categorías
│   ├── inventario.js         # Lógica frontend para reportes de inventario
│   ├── login.js              # Lógica de autenticación en frontend
│   ├── menu.js               # Lógica del menú principal
│   ├── navbar.js             # Lógica de la barra de navegación
│   └── ventas.js             # Lógica frontend para reportes de ventas
│
├── views/
│   ├── categorias.html       # Vista de reportes de categorías
│   ├── inventario.html       # Vista de reportes de inventario
│   ├── login.html            # Vista de inicio de sesión
│   ├── menu.html             # Vista del menú principal
│   ├── navbar.html           # Fragmento de barra de navegación
│   └── ventas.html           # Vista de reportes de ventas
│
└── package.json              # Dependencias y scripts del proyecto
```


## Instalación y Ejecución

1. **Clonar el repositorio**
2. **Instalar dependencias**:
   ```
npm install
   ```
3. **Configurar la base de datos**: Editar `backend/connection.js` con los datos de conexión de MySQL.
4. **Iniciar el servidor**:
   ```
npm start
   ```
5. Acceder desde el navegador a: `http://localhost:4000/RCompras/`

## Principales Archivos y Funcionalidades

- **backend/main.js**: Configura Express, sesiones, rutas y archivos estáticos.
- **backend/connection.js**: Conexión a MySQL.
- **backend/autenticacion.js**: Registro, login, recuperación de contraseña (con envío de correo usando Nodemailer).
- **backend/categorias.js, inventario.js, ventas.js**: Rutas para obtener y exportar reportes según filtros.
- **js/login.js**: Lógica de autenticación en el frontend.
- **js/menu.js, navbar.js**: Manejo de la interfaz y control de acceso.
- **views/**: Vistas HTML para cada módulo, integrando Bootstrap y DataTables.

## Dependencias Principales

- **express**: Framework web para Node.js
- **mysql2**: Conexión a base de datos MySQL
- **express-session**: Manejo de sesiones
- **bcryptjs**: Encriptación de contraseñas
- **nodemailer**: Envío de correos para recuperación de contraseña
- **csv-stringify, papaparse**: Exportación de datos a CSV
- **sweetalert2**: Alertas modernas en el frontend
- **Bootstrap, DataTables**: Interfaz moderna y tablas dinámicas

## Seguridad
- Contraseñas encriptadas con bcryptjs.
- Sesiones protegidas y cookies seguras.
- Restricción de rutas y validación de usuario en cada petición.
- Recuperación de contraseña vía correo electrónico.

## Personalización
- Temas claro y oscuro seleccionables.
- Fácil integración de nuevas vistas o reportes.

---
