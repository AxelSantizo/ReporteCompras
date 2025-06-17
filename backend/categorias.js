const express = require('express');
const router = express.Router();
const { connection } = require('./connection');


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

router.get('/obtenerCategorias', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const idProveedor = req.session.user.IdProveedor;
    const query = 'SELECT IdSubCategorias, SubCategorias FROM HistorialInventario WHERE IdProveedores = ? GROUP BY IdSubCategorias, SubCategorias ORDER BY SubCategorias';
    connection.query(query, [idProveedor], (err, results) => {
        if (err) {
            console.error('Error ejecutando la consulta:', err);
            return res.status(500).json({ error: 'Error en el servidor' });
        }
        res.json(results); // Enviar los resultados al frontend
    });
});

router.post('/generarReporte', (req, res) => {
    const { fechaInicio, fechaFin, sucursalBuscar, tipoReporte, subcategoriaBuscar, page = 1 } = req.body;
    const idProveedor = req.session.user ? req.session.user.IdProveedor : null;

    if (!idProveedor) {
        console.log('Usuario no autenticado');
        return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Base de la consulta SQL
    let query = '';
    let queryParams = [fechaInicio, fechaFin];

    // Si el tipo de reporte es "agrupado", usar la consulta con SUM y GROUP BY
    if (tipoReporte === 'agrupado') {
        query = `
            SELECT 
                MAX(IdSucursal) AS IdSucursal, 
                NombreSucursal, 
                Upc, 
                MAX(Descripcion) AS Descripcion,
                MAX(NombreProveedor) AS Proveedor,
                ROUND(SUM(Cantidad), 2) AS Cantidad,
                ROUND(SUM(MontoTotal), 2) AS MontoTotal, 
                MAX(NombreDepartamento) AS Departamento,
                MAX(NombreCategoria) AS Categoria,  
                MAX(NombreSubCategoria) AS SubCategoria,  
                MAX(CantidadFardo) AS UnidadesPorFardo
            FROM 
                ventasdiariasglobalesC
            WHERE 
                Fecha >= ? 
                AND Fecha <= ? `;

        // Si se ha seleccionado una subcategoría
        if (subcategoriaBuscar) {
            query += ` AND IdSubCategoria = ?`;
            queryParams.push(subcategoriaBuscar);
        } else {
            // Si NO se seleccionó una subcategoría, obtener todas las subcategorías válidas del proveedor
            const subcategoriaQuery = `
                SELECT IdSubCategorias 
                FROM HistorialInventario 
                WHERE IdProveedores = ? 
                AND IdSubCategorias IS NOT NULL 
                AND IdSubCategorias != 0
            `;
            connection.query(subcategoriaQuery, [idProveedor], (err, subcategorias) => {
                if (err) {
                    console.error('Error al obtener subcategorías:', err);
                    return res.status(500).json({ error: 'Error al obtener subcategorías' });
                }

                const subcategoriaIds = subcategorias.map(sc => sc.IdSubCategorias); // Obtener los IdSubCategorias
                if (subcategoriaIds.length > 0) {
                    query += ` AND IdSubCategoria IN (?)`;
                    queryParams.push(subcategoriaIds);
                }

                // Agregar GROUP BY cuando es reporte agrupado
                query += `
                    GROUP BY 
                        Upc, 
                        NombreSucursal
                    ORDER BY NombreSucursal`;


                // Ejecutar la consulta con el agrupado
                connection.query(query, queryParams, (err, results) => {
                    if (err) {
                        console.error('Error al ejecutar la consulta:', err);
                        return res.status(500).json({ error: 'Error al generar el reporte' });
                    }
                    res.status(200).json(results);
                });
            });
            return;
        }

        // Agregar GROUP BY cuando es reporte agrupado
        query += `
            GROUP BY 
                Upc, 
                NombreSucursal
            ORDER BY NombreSucursal`;

    } else {
        // Si el tipo de reporte no es "agrupado", usar la consulta sin SUM ni GROUP BY
        query = `
            SELECT 
                IdSucursal, 
                NombreSucursal, 
                Upc, 
                Descripcion,
                Cantidad, 
                Fecha,
                MontoTotal, 
                NombreProveedor AS Proveedor,
                NombreDepartamento AS Departamento, 
                NombreCategoria AS Categoria, 
                NombreSubCategoria AS SubCategoria, 
                CantidadFardo AS UnidadesPorFardo
            FROM 
                ventasdiariasglobalesC
            WHERE 
                Fecha >= ? 
                AND Fecha <= ? `;

        // Si se ha seleccionado una subcategoría
        if (subcategoriaBuscar) {
            query += ` AND IdSubCategoria = ?`;
            queryParams.push(subcategoriaBuscar);
        }

        // Excluir productos con subcategorías nulas o 0 en la consulta de reporte detallado
        query += ` AND (IdSubCategoria IS NOT NULL AND IdSubCategoria != 0) 
                   AND (NombreSubCategoria IS NOT NULL AND NombreSubCategoria != '')`;

        query += ` ORDER BY NombreSucursal`;
    }

    // Si se ha seleccionado una sucursal, agregar la condición al query
    if (sucursalBuscar) {
        query += ` AND IdSucursal = ?`;
        queryParams.push(sucursalBuscar);
    }


    // Ejecutar la consulta cuando no es necesario obtener todas las subcategorías
    connection.query(query, queryParams, (err, results) => {
        if (err) {
            console.error('Error al ejecutar la consulta:', err);
            return res.status(500).json({ error: 'Error al generar el reporte' });
        }
        res.status(200).json(results);
    });
});

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
