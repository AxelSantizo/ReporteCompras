const express = require('express');
const router = express.Router();
const { connection } = require('./connection');
const { parse } = require('json2csv');

// Ruta para obtener las sucursales
router.get('/obtenerSucursales', (req, res) => {
    const query = 'SELECT idSucursal, NombreSucursal FROM sucursales WHERE TipoSucursal >= 1 AND TipoSucursal <= 2 ORDER BY NombreSucursal';

    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener los nombres de las sucursales:', err);
            return res.status(500).json({ error: 'Error al obtener los nombres de las sucursales' });
        }

        res.json(results);
    });
});

// Ruta para obtener departamentos filtrados por sucursal
router.get('/obtenerDepartamentos', (req, res) => {
    const { IdSucursal } = req.query;
    const { IdDepartamento } = req.session;
    const { IdCategoria } = req.session;

    let query = 'SELECT IdDepartamentos AS Id, Departamentos AS Nombre FROM HistorialInventario WHERE Departamentos != "0"';

    // Filtro por sucursal si se proporciona
    if (IdSucursal) {
        query += ` AND IdSucursal = ${IdSucursal}`;
    }

    // Si hay departamentos asignados, aplicar el filtro directamente
    if (IdDepartamento && IdDepartamento !== '0') {
        query += ` AND IdDepartamentos IN (${IdDepartamento})`;
    }

    // Si hay categorías asignadas, aplicar el filtro adicional
    if (IdCategoria && IdCategoria !== '0') {
        query += ` OR IdCategoria IN (${IdCategoria})`;
    }

    query += ' GROUP BY departamentos, IdDepartamentos ORDER BY Departamentos ASC;';

    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener los nombres de los departamentos:', err);
            return res.status(500).json({ error: 'Error al obtener los nombres de los departamentos' });
        }
        res.json(results);
    });
});

// Ruta para obtener categorías filtradas por departamento
router.get('/obtenerCategorias', (req, res) => {
    const IdDepartamentoSesion = req.session?.IdDepartamento;
    const IdCategoriaSesion = req.session?.IdCategoria;
    const { IdDepartamento: IdDepartamentoQuery } = req.query;

    let query = 'SELECT IdCategoria AS Id, Categorias AS Nombre FROM HistorialInventario WHERE Categorias != "0" AND Categorias IS NOT NULL AND Categorias != ""';

    // Si hay categorías asignadas o departamentos asignados, aplicamos los filtros
    if (IdCategoriaSesion || IdDepartamentoSesion) {
        query += ' AND (';

        // Si hay categorías asignadas
        if (IdCategoriaSesion) {
            query += `IdCategoria IN (${IdCategoriaSesion})`;
        }

        // Si hay departamentos asignados
        if (IdDepartamentoSesion) {
            if (IdCategoriaSesion) {
                query += ' OR ';
            }
            query += `IdDepartamentos IN (${IdDepartamentoSesion})`;
        }

        query += ')';
    }

    // Si se seleccionó un departamento desde el selector, aplicar un filtro adicional
    if (IdDepartamentoQuery) {
        query += ` AND IdDepartamentos = ${IdDepartamentoQuery}`;
    }

    query += ' GROUP BY IdCategoria, Categorias ORDER BY Categorias ASC';

    // Ejecutar la consulta
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener los nombres de las categorías:', err);
            return res.status(500).json({ error: 'Error al obtener los nombres de las categorías' });
        }
        res.json(results);
    });
});

// Ruta para obtener subcategorías filtradas por departamento y categoría
router.get('/obtenerSubcategorias', (req, res) => {
    const IdDepartamentoSesion = req.session?.IdDepartamento;
    const IdCategoriaSesion = req.session?.IdCategoria;  
    const { IdDepartamento, IdCategoria } = req.query; 

    const queryParams = [];

    let query = 'SELECT IdSubCategorias AS Id, SubCategorias AS Nombre FROM HistorialInventario WHERE SubCategorias != "0" AND SubCategorias IS NOT NULL AND SubCategorias != "" ';
    
    // Si hay categorías asignadas o departamentos asignados, aplicamos los filtros
    if (IdCategoriaSesion || IdDepartamentoSesion) {
        query += ' AND (';

        // Si hay categorías asignadas
        if (IdCategoriaSesion) {
            query += `IdCategoria IN (${IdCategoriaSesion})`;
        }

        // Si hay departamentos asignados
        if (IdDepartamentoSesion) {
            if (IdCategoriaSesion) {
                query += ' OR ';
            }
            query += `IdDepartamentos IN (${IdDepartamentoSesion})`;
        }

        query += ')';
    }

    // Si se proporciona un IdDepartamento, agregarlo al WHERE
    if (IdDepartamento) {
        query += ' AND IdDepartamentos = ?';
        queryParams.push(IdDepartamento);
    }

    // Si se proporciona un IdCategoria, agregarlo al WHERE (si ya existe un WHERE para IdDepartamento, agregar con AND)
    if (IdCategoria) {
        query += ' AND IdCategoria = ?';
        queryParams.push(IdCategoria);
    }

    query += ' GROUP BY IdSubCategorias, SubCategorias ORDER BY SubCategorias ASC;';

    connection.query(query, queryParams, (err, results) => {
        if (err) {
            console.error('Error al obtener los nombres de las subcategorías:', err);
            return res.status(500).json({ error: 'Error al obtener los nombres de las subcategorías' });
        }
        res.json(results); 
    });
});

// Ruta para obtener proveedores filtrados por sucursal, departamento, categoría y subcategoría
router.get('/obtenerProveedores', (req, res) => {
    const IdDepartamentoSesion = req.session?.IdDepartamento;
    const IdCategoriaSesion = req.session?.IdCategoria;
    const { IdSucursal, IdDepartamento, IdCategoria, IdSubCategoria } = req.query;

    let query = 'SELECT IdProveedores AS IdProveedor, Proveedores AS NombreProveedor FROM HistorialInventario WHERE Proveedores != "0" AND Proveedores IS NOT NULL AND Proveedores != ""';

    const queryParams = [];

    // Si hay categorías asignadas o departamentos asignados, aplicamos los filtros
    if (IdCategoriaSesion || IdDepartamentoSesion) {
        query += ' AND (';

        // Si hay categorías asignadas
        if (IdCategoriaSesion) {
            query += `IdCategoria IN (${IdCategoriaSesion})`;
        }

        // Si hay departamentos asignados
        if (IdDepartamentoSesion) {
            if (IdCategoriaSesion) {
                query += ' OR ';
            }
            query += `IdDepartamentos IN (${IdDepartamentoSesion})`;
        }
        query += ')';
    }

    // Filtrar por sucursal
    if (IdSucursal) {
        query += ' AND IdSucursal = ?';
        queryParams.push(IdSucursal);
    }

    // Filtrar por departamento
    if (IdDepartamento) {
        query += ' AND IdDepartamentos = ?';
        queryParams.push(IdDepartamento);
    }

    // Filtrar por categoría
    if (IdCategoria) {
        query += ' AND IdCategoria = ?';
        queryParams.push(IdCategoria);
    }

    // Filtrar por subcategoría
    if (IdSubCategoria) {
        query += ' AND IdSubCategorias = ?';
        queryParams.push(IdSubCategoria);
    }

    // Agrupar y ordenar por nombre de proveedor
    query += ' GROUP BY IdProveedores, Proveedores ORDER BY Proveedores ASC;';

    connection.query(query, queryParams, (err, results) => {
        if (err) {
            console.error('Error al obtener los nombres de los proveedores:', err);
            return res.status(500).json({ error: 'Error al obtener los nombres de los proveedores' });
        }

        res.json(results);
    });
});

// Almacén de datos generado en memoria por usuario
const reportCacheInventario = {};

// Ruta para generar el reporte
router.post('/generarReporteInventario', (req, res) => {
    const IdDepartamentoSesion = req.session?.IdDepartamento;
    const IdCategoriaSesion = req.session?.IdCategoria;
    const { sucursalBuscar, departamentoFiltro, categoriaFiltro, subcategoriaFiltro, proveedorFiltro} = req.body;
    const queryParams = [];
    
    // Umbral máximo de registros permitidos
    const MAX_RECORDS = 9000000; // Define el límite máximo

    // Query para contar registros
    let countQuery = `
        SELECT COUNT(*) AS totalRecords
        FROM HistorialInventario
        WHERE 1 = 1
    `;

    // Agregar filtros si están presentes
    if (sucursalBuscar) {
        countQuery += ` AND IdSucursal = ?`;
        queryParams.push(sucursalBuscar);
    }

    // Si hay categorías asignadas o departamentos asignados, aplicamos los filtros
    if (IdCategoriaSesion || IdDepartamentoSesion) {
        countQuery += ' AND (';

        // Si hay categorías asignadas
        if (IdCategoriaSesion) {
            countQuery += `IdCategoria IN (${IdCategoriaSesion})`;
        }

        // Si hay departamentos asignados
        if (IdDepartamentoSesion) {
            if (IdCategoriaSesion) {
                countQuery += ' OR ';
            }
            countQuery += `IdDepartamentos IN (${IdDepartamentoSesion})`;
        }
        countQuery += ')';
    }

    if (departamentoFiltro) {
        countQuery += ` AND IdDepartamentos = ?`;
        queryParams.push(departamentoFiltro);
    }
    if (categoriaFiltro) {
        countQuery += ` AND IdCategoria = ?`;
        queryParams.push(categoriaFiltro);
    }
    if (subcategoriaFiltro) {
        countQuery += ` AND IdSubCategorias = ?`;
        queryParams.push(subcategoriaFiltro);
    }
    if (proveedorFiltro) {
        countQuery += ` AND IdProveedores = ?`;
        queryParams.push(proveedorFiltro);
    }

    connection.query(countQuery, queryParams, (err, countResults) => {
        if (err) {
            console.error('Error al contar los registros:', err);
            return res.status(500).json({ error: 'Error al contar los registros' });
        }

        const totalRecords = countResults[0].totalRecords;

        if (totalRecords > MAX_RECORDS) {
            // Si los registros exceden el umbral, devolver un mensaje de error
            return res.status(413).json({
                error: 'El reporte es demasiado grande para ser procesado.',
                totalRecords,
                message: `El reporte contiene ${totalRecords} registros, lo cual excede el límite permitido de ${MAX_RECORDS}. Por favor, ajuste los filtros para reducir el volumen de datos.`
            });
        }

        // Construir la consulta dinámica
        let query = `
            SELECT 
                IdSucursal, 
                NombreSucursal, 
                Upc, 
                Descripcion, 
                Existencia, 
                DATE_FORMAT(FechaInventario, '%Y-%m-%d') as FechaInventario,
                departamentos AS Departamento,
                categorias AS Categoria,
                subcategorias AS SubCategoria,
                proveedores AS Proveedor,
                UnidadesPorFardo
            FROM 
                HistorialInventario
            WHERE 
                1 = 1`;
        
        // Si hay categorías asignadas o departamentos asignados, aplicamos los filtros
        if (IdCategoriaSesion || IdDepartamentoSesion) {
            query += ' AND (';
    
            // Si hay categorías asignadas
            if (IdCategoriaSesion) {
                query += `IdCategoria IN (${IdCategoriaSesion})`;
            }
    
            // Si hay departamentos asignados
            if (IdDepartamentoSesion) {
                if (IdCategoriaSesion) {
                    query += ' OR ';
                }
                query += `IdDepartamentos IN (${IdDepartamentoSesion})`;
            }
            query += ')';
        }

        // Agregar filtros si están presentes
        if (sucursalBuscar) {
            query += ` AND IdSucursal = ?`;
            queryParams.push(sucursalBuscar);
        }
        if (departamentoFiltro) {
            query += ` AND IdDepartamentos = ?`;
            queryParams.push(departamentoFiltro);
        }
        if (categoriaFiltro) {
            query += ` AND IdCategoria = ?`;
            queryParams.push(categoriaFiltro);
        }
        if (subcategoriaFiltro) {
            query += ` AND IdSubCategorias = ?`;
            queryParams.push(subcategoriaFiltro);
        }
        if (proveedorFiltro) {
            query += ` AND IdProveedores = ?`;
            queryParams.push(proveedorFiltro);
        }

        connection.query(query, queryParams, (err, results) => {
            if (err) {
                console.error('Error al ejecutar la consulta:', err);
                return res.status(500).json({ error: 'Error al generar el reporte' });
            }

            // Extraer datos únicos para los selectores
            const sucursales = [...new Set(results.map(row => ({ id: row.IdSucursal, nombre: row.NombreSucursal })))];
            const departamentos = [...new Set(results.map(row => row.Departamento))].filter(Boolean);
            const categorias = [...new Set(results.map(row => row.Categoria))].filter(Boolean);
            const subcategorias = [...new Set(results.map(row => row.SubCategoria))].filter(Boolean);
            const proveedores = [...new Set(results.map(row => row.Proveedor))].filter(Boolean);

            // Almacenar los datos en caché para el usuario actual
            reportCacheInventario[req.session.IdUsuario] = results;

            res.json({
                totalRecords: results.length,
                selectores: {
                    sucursales,
                    departamentos,
                    categorias,
                    subcategorias,
                    proveedores
                }
            });
        });
    });
});

// Ruta para paginar la informacion y mandarla al cliente
router.post('/getPaginatedData', (req, res) => {
    const { page, pageSize, search, order, columns } = req.body;

    // Datos originales generados previamente (caché)
    const userId = req.session.IdUsuario;
    if (!reportCacheInventario[userId]) {
        return res.status(404).json({ error: 'No se encontró un reporte generado para este usuario' });
    }

    // Siempre trabajar con una copia fresca de los datos originales
    let data = [...reportCacheInventario[userId]];

    // Aplicar búsqueda
    if (search && search.value) {
        const searchTerm = search.value.toLowerCase();
        data = data.filter(row =>
            Object.values(row).some(value =>
                String(value).toLowerCase().includes(searchTerm)
            )
        );
    }

    // Aplicar ordenamiento
    if (order && order.length > 0) {
        const columnIdx = order[0].column; // Índice de la columna
        const dir = order[0].dir === 'asc' ? 1 : -1; // Dirección del ordenamiento
        const columnName = columns[columnIdx].data; // Nombre de la columna

        data = data.sort((a, b) => {
            const valA = isNaN(a[columnName]) ? a[columnName] : Number(a[columnName]);
            const valB = isNaN(b[columnName]) ? b[columnName] : Number(b[columnName]);
        
            if (valA < valB) return -1 * dir;
            if (valA > valB) return 1 * dir;
            return 0;
        });
        
    }

    // Paginación
    const totalRecords = data.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedData = data.slice(start, end);

    res.json({
        data: paginatedData,
        totalRecords
    });
});

// Ruta para filtrar los datos 
router.post('/filtrarDatos', (req, res) => {
    const { sucursal, departamento, categoria, subcategoria, proveedor, searchTerm, searchUPC } = req.body;

    const userId = req.session.IdUsuario;
    if (!reportCacheInventario[userId]) {
        return res.status(404).json({ error: 'No se encontró un reporte generado para este usuario' });
    }

    let data = [...reportCacheInventario[userId]];

    // Filtrar por descripción (searchTerm)
    if (searchTerm) {
        const searchWords = searchTerm.toLowerCase().split(/\s+/);
        data = data.filter(row => {
            const descripcion = row.Descripcion ? row.Descripcion.toLowerCase() : '';
            return searchWords.every(word => descripcion.includes(word));
        });
    }

    // Aplicar filtros adicionales (sucursal, departamento, categoría, subcategoría)
    if (sucursal) {
        data = data.filter(row => String(row.IdSucursal) === String(sucursal));
    }
    if (departamento) {
        data = data.filter(row => row.Departamento === departamento);
    }
    if (categoria) {
        data = data.filter(row => row.Categoria === categoria);
    }
    if (subcategoria) {
        data = data.filter(row => row.SubCategoria === subcategoria);
    }
    if (proveedor) {
        data = data.filter(row => row.Proveedor === proveedor);
    }

    // Generar datos únicos para los selectores
    const sucursales = Array.from(new Map(data.map(row => [row.IdSucursal, { id: row.IdSucursal, nombre: row.NombreSucursal }])).values());
    const departamentos = [...new Set(data.map(row => row.Departamento))].filter(Boolean);
    const categorias = [...new Set(data.map(row => row.Categoria))].filter(Boolean);
    const subcategorias = [...new Set(data.map(row => row.SubCategoria))].filter(Boolean);
    const proveedores = [...new Set(data.map(row => row.Proveedor))].filter(Boolean);

    res.json({
        data: Array.isArray(data) ? data : [],
        selectores: {
            sucursales: Array.isArray(sucursales) ? sucursales : [],
            departamentos: Array.isArray(departamentos) ? departamentos : [],
            categorias: Array.isArray(categorias) ? categorias : [],
            subcategorias: Array.isArray(subcategorias) ? subcategorias : [],
            proveedores: Array.isArray(proveedores) ? proveedores : []
        }
    });
});

// Ruta para calcular los totales
router.post('/calcularTotales', (req, res) => {
    const userId = req.session.IdUsuario;

    // Verificar si hay datos en caché para el usuario
    if (!reportCacheInventario[userId]) {
        return res.status(404).json({ error: 'No se encontró un reporte generado para este usuario' });
    }

    const { sucursal, departamento, categoria, subcategoria, proveedor, searchTerm } = req.body;
    let data = [...reportCacheInventario[userId]];

    // Aplicar filtros
    if (sucursal) {
        data = data.filter(item => String(item.IdSucursal) === String(sucursal));
    }
    if (departamento) {
        data = data.filter(item => item.Departamento === departamento);
    }
    if (categoria) {
        data = data.filter(item => item.Categoria === categoria);
    }
    if (subcategoria) {
        data = data.filter(item => item.SubCategoria === subcategoria);
    }
    if (proveedor) {
        data = data.filter(item => item.Proveedor === proveedor);
    }
    if (searchTerm) {
        data = data.filter(item =>
            item.Descripcion && item.Descripcion.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    // Calcular los totales
    const sucursalTotales = {};
    const departamentoTotales = {};
    const categoriaTotales = {};
    const subcategoriaTotales = {};
    const proveedorTotales = {};

    data.forEach(item => {
        const Existencia = parseFloat(item.Existencia) || 0;

        if (item.NombreSucursal) {
            sucursalTotales[item.NombreSucursal] = (sucursalTotales[item.NombreSucursal] || 0) + Existencia;
        }
        if (item.Departamento) {
            departamentoTotales[item.Departamento] = (departamentoTotales[item.Departamento] || 0) + Existencia;
        }
        if (item.Categoria) {
            categoriaTotales[item.Categoria] = (categoriaTotales[item.Categoria] || 0) + Existencia;
        }
        if (item.SubCategoria) {
            subcategoriaTotales[item.SubCategoria] = (subcategoriaTotales[item.SubCategoria] || 0) + Existencia;
        }
        if (item.Proveedor) {
            proveedorTotales[item.Proveedor] = (proveedorTotales[item.Proveedor] || 0) + Existencia;
        }
    });

    res.json({
        sucursalTotales,
        departamentoTotales,
        categoriaTotales,
        subcategoriaTotales,
        proveedorTotales
    });
});

// Ruta para exportar todos los datos
router.get('/exportarTodo', (req, res) => {
    const userId = req.session.IdUsuario;

    if (!reportCacheInventario[userId]) {
        return res.status(404).json({ error: 'No se encontraron datos para exportar.' });
    }

    const data = reportCacheInventario[userId];
    const fields = ["NombreSucursal", "Upc", "Descripcion", "Existencia", "Fecha", "Departamento", "Categoria", "SubCategoria", "Proveedor", "UnidadesPorFardo"];

    try {
        const csv = parse(data, { fields }); // Usa json2csv para crear el archivo CSV

        // Crear el nombre del archivo con las fechas
        const fileName = `ReporteInventarioGeneral.csv`;

        res.header('Content-Type', 'text/csv');
        res.attachment(fileName); // Usar el nombre del archivo con fechas
        res.send(csv);
    } catch (err) {
        console.error('Error al generar el CSV:', err);
        res.status(500).send('Error al generar el archivo CSV');
    }
});

// Ruta para exportar datos filtrados
router.post('/exportarFiltrado', (req, res) => {
    const { sucursal, departamento, categoria, subcategoria, proveedor, searchTerm} = req.body;
    const userId = req.session.IdUsuario;

    if (!reportCacheInventario[userId]) {
        return res.status(404).json({ error: 'No se encontraron datos para exportar.' });
    }

    let data = [...reportCacheInventario[userId]];

    // Aplicar filtros
    if (sucursal) data = data.filter(row => row.IdSucursal == sucursal);
    if (departamento) data = data.filter(row => row.Departamento === departamento);
    if (categoria) data = data.filter(row => row.Categoria === categoria);
    if (subcategoria) data = data.filter(row => row.SubCategoria === subcategoria);
    if (proveedor) data = data.filter(row => row.Proveedor === proveedor);
    if (searchTerm) {
        const searchWords = searchTerm.toLowerCase().split(/\s+/);
        data = data.filter(row => searchWords.every(word => (row.Descripcion || '').toLowerCase().includes(word)));
    }

    const fields = ["NombreSucursal", "Upc", "Descripcion", "Existencia", "Fecha", "Departamento", "Categoria", "SubCategoria", "Proveedor", "UnidadesPorFardo"];

    try {
        const csv = parse(data, { fields });

        // Construir el nombre del archivo dinámicamente
        const fileName = `ReporteInventarioFiltrado.csv`;

        res.header('Content-Type', 'text/csv');
        res.attachment(fileName);
        res.send(csv);
    } catch (err) {
        console.error('Error al generar el CSV filtrado:', err);
        res.status(500).send('Error al generar el archivo CSV');
    }
});

// Ruta para limpiar toda la informacion
router.post('/limpiarReporteInventario', (req, res) => {
    const userId = req.session && req.session.user ? req.session.IdUsuario : null;

    if (!userId) {
        // Eliminar todas las propiedades del objeto reportCache
        Object.keys(reportCacheInventario).forEach(key => delete reportCacheInventario[key]);
        return res.json({ message: 'Variable reportCache limpiada para todos los usuarios.' });
    }

    if (reportCacheInventario[userId]) {
        delete reportCacheInventario[userId]; // Eliminar solo los datos del usuario actual
        return res.json({ message: `Datos limpiados correctamente para el usuario ${userId}.` });
    } else {
        return res.json({ message: `No hay datos para limpiar para el usuario ${userId}.` });
    }
});

// Ruta para obtener los detalles de la sucursal
router.get('/detalleSucursal', (req, res) => {
    const nombreSucursal = req.query.nombre;

    if (!nombreSucursal) {
        return res.status(400).json({ error: 'Nombre de la sucursal no proporcionado' });
    }

    const query = `
        SELECT TipoSucursal, Descripcion, Imagen, Ubicacion 
        FROM sucursales_info 
        WHERE IdSucursal = ?
    `;

    connection.query(query, [nombreSucursal], (err, results) => {
        if (err) {
            console.error('Error ejecutando la consulta:', err);
            return res.status(500).json({ error: 'Error en el servidor' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Sucursal no encontrada' });
        }

        // Convertir la imagen a Base64 si es necesario
        if (results[0].Imagen) {
            results[0].Imagen = results[0].Imagen.toString('base64');
        }

        res.json(results[0]);
    });
});

module.exports = router;
