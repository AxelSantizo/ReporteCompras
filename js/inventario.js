document.addEventListener('DOMContentLoaded', function() { 
    // Variable global para el prefijo de ruta
    const basePath = '/RCompras/';

    // Función para mostrar cuadros de diálogo con SweetAlert2
    function showAlert(title, text, icon = 'info') {
        Swal.fire({
            title: title,
            html: text,
            icon: icon,
            confirmButtonText: 'OK'
        });
    }

    // Función para mostrar el spinner
    function showSpinner() {
        Swal.fire({
            title: 'Cargando, porfavor espere!',
            html: '<div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div>',
            showConfirmButton: false,
            allowOutsideClick: false,  // Deshabilitar clic fuera
            allowEscapeKey: false,     // Deshabilitar tecla Escape
            backdrop: true,            // Mantener el fondo oscuro
            didOpen: () => {
                // Aquí puedes agregar cualquier lógica adicional cuando el spinner se muestre
            }
        });
    }
    
    // Función para ocultar el spinner
    function hideSpinner() {
        Swal.close();
    }

    // Función para obtener los nombres de las sucursales
    function fetchSucursales() {
        fetch(`${basePath}backendInventario/obtenerSucursales`)
            .then(response => response.json())
            .then(data => {
                const sucursalesSelect = document.getElementById('sucursalBusqueda');
                sucursalesSelect.innerHTML = '<option value="">Reporte General</option>'; // Opción por defecto

                data.forEach(sucursal => {
                    const option = document.createElement('option');
                    option.value = sucursal.idSucursal; // Valor del select será idSucursal
                    option.textContent = sucursal.NombreSucursal; // Texto visible será NombreSucursal
                    sucursalesSelect.appendChild(option);
                });
            })
            .catch(error => {
                console.error('Error al obtener los nombres de las sucursales:', error);
                showAlert('Error', 'Hubo un error al obtener los nombres de las sucursales.', 'error');
            });
    }
    fetchSucursales();

    document.getElementById('sucursalBusqueda').addEventListener('change', function() {
        document.getElementById('proveedorBusqueda').selectedIndex = 0;
        document.getElementById('departamentoBusqueda').selectedIndex = 0;
        document.getElementById('categoriaBusqueda').selectedIndex = 0;
        document.getElementById('subcategoriaBusqueda').selectedIndex = 0;

        fetchDepartamentos();
        fetchCategorias(); 
        fetchSubcategorias(); 
        fetchProveedores();
    });

    // Función para obtener los nombres de los departamentos filtrados por sucursal
    function fetchDepartamentos() {
        const sucursalSelect = document.getElementById('sucursalBusqueda');
        const IdSucursal = sucursalSelect.value; // Obtener el valor de la sucursal seleccionada

        let url = `${basePath}backendInventario/obtenerDepartamentos`;
        if (IdSucursal) {
            // Si se seleccionó una sucursal, agregarla como parámetro en la URL
            url += `?IdSucursal=${IdSucursal}`;
        }

        fetch(url)
            .then(response => response.json())
            .then(data => {
                const departamentoSelect = document.getElementById('departamentoBusqueda');
                departamentoSelect.innerHTML = '<option value="">Reporte General</option>'; // Opción por defecto

                data.forEach(departamento => {
                    const option = document.createElement('option');
                    option.value = departamento.Id; // Valor del select será el Id del departamento
                    option.textContent = departamento.Nombre; // Texto visible será el nombre del departamento
                    departamentoSelect.appendChild(option);
                });
            })
            .catch(error => {
                console.error('Error al obtener los nombres de los departamentos:', error);
                showAlert('Error', 'Hubo un error al obtener los nombres de los departamentos.', 'error');
            });
    }
    fetchDepartamentos();

    document.getElementById('departamentoBusqueda').addEventListener('change', function() {
        document.getElementById('proveedorBusqueda').selectedIndex = 0;
        document.getElementById('categoriaBusqueda').selectedIndex = 0;
        document.getElementById('subcategoriaBusqueda').selectedIndex = 0;
    
        // Verificar si el select de departamento está en la opción 0
        if (this.selectedIndex === 0) {
            document.getElementById('categoriaBusqueda').disabled = true;
            document.getElementById('subcategoriaBusqueda').disabled = true;
        } else {
            document.getElementById('categoriaBusqueda').disabled = false;
        }
    
        fetchCategorias(); 
        fetchSubcategorias(); 
        fetchProveedores();
    });


    // Función para obtener los nombres de las categorias
    function fetchCategorias() {
        const departamentoSelect = document.getElementById('departamentoBusqueda');
        const IdDepartamento = departamentoSelect.value;
    
        let url = `${basePath}backendInventario/obtenerCategorias`;
        if (IdDepartamento) {
            url += `?IdDepartamento=${IdDepartamento}`;
        }
    
        fetch(url)
            .then(response => response.json())
            .then(data => {
                const categoriasSelect = document.getElementById('categoriaBusqueda');
                categoriasSelect.innerHTML = '<option value="">Reporte General</option>'; // Opción por defecto
    
                data.forEach(categoria => {
                    if (categoria.Nombre && categoria.Nombre.trim() !== "0") { // Asegurarse de que no incluya vacíos ni "0"
                        const option = document.createElement('option');
                        option.value = categoria.Id; 
                        option.textContent = categoria.Nombre;
                        categoriasSelect.appendChild(option);
                    }
                });
            })
            .catch(error => {
                console.error('Error al obtener los nombres de las categorías:', error);
                showAlert('Error', 'Hubo un error al obtener los nombres de las categorías.', 'error');
            });
    }    
    fetchCategorias();
    document.getElementById('categoriaBusqueda').addEventListener('change', function() {
        document.getElementById('proveedorBusqueda').selectedIndex = 0;
        document.getElementById('subcategoriaBusqueda').selectedIndex = 0;
        
        // Verificar si el select de departamento está en la opción 0
        if (this.selectedIndex === 0) {
            document.getElementById('subcategoriaBusqueda').disabled = true;
        } else {
            document.getElementById('subcategoriaBusqueda').disabled = false;
        }

        fetchSubcategorias();
        fetchProveedores();
    });

    // Función para obtener los nombres de las subcategorías
    function fetchSubcategorias() {
        const departamentoSelect = document.getElementById('departamentoBusqueda');
        const categoriaSelect = document.getElementById('categoriaBusqueda');
        
        const IdDepartamento = departamentoSelect.value; // Obtener el valor del departamento seleccionado
        const IdCategoria = categoriaSelect.value; // Obtener el valor de la categoría seleccionada

        let url = `${basePath}backendInventario/obtenerSubcategorias`;
        const queryParams = [];

        // Si se seleccionó un departamento, agregarlo como parámetro
        if (IdDepartamento) {
            queryParams.push(`IdDepartamento=${IdDepartamento}`);
        }

        // Si se seleccionó una categoría, agregarla como parámetro
        if (IdCategoria) {
            queryParams.push(`IdCategoria=${IdCategoria}`);
        }

        // Si hay parámetros, agregar a la URL
        if (queryParams.length > 0) {
            url += `?${queryParams.join('&')}`;
        }

        fetch(url)
            .then(response => response.json())
            .then(data => {
                const subcategoriasSelect = document.getElementById('subcategoriaBusqueda');
                subcategoriasSelect.innerHTML = '<option value="">Reporte General</option>'; // Opción por defecto

                data.forEach(subcategoria => {
                    const option = document.createElement('option');
                    option.value = subcategoria.Id; // Valor del select será el Id de la subcategoría
                    option.textContent = subcategoria.Nombre; // Texto visible será el Nombre de la subcategoría
                    subcategoriasSelect.appendChild(option);
                });
            })
            .catch(error => {
                console.error('Error al obtener los nombres de las subcategorías:', error);
                showAlert('Error', 'Hubo un error al obtener los nombres de las subcategorías.', 'error');
            });
    }
    fetchSubcategorias();
    document.getElementById('subcategoriaBusqueda').addEventListener('change', function() {
        document.getElementById('proveedorBusqueda').selectedIndex = 0;

        fetchProveedores();
    });

    // Función para obtener los nombres de los proveedores
    function fetchProveedores() {
        const sucursalesSelect = document.getElementById('sucursalBusqueda');
        const departamentoSelect = document.getElementById('departamentoBusqueda');
        const categoriaSelect = document.getElementById('categoriaBusqueda');
        const subcategoriaSelect = document.getElementById('subcategoriaBusqueda');
        
        const IdSucursal = sucursalesSelect.value; // Obtener el valor de la sucursal seleccionada
        const IdDepartamento = departamentoSelect.value; // Obtener el valor del departamento seleccionado
        const IdCategoria = categoriaSelect.value; // Obtener el valor de la categoría seleccionada
        const IdSubCategoria = subcategoriaSelect.value; // Obtener el valor de la subcategoría seleccionada

        let url = `${basePath}backendInventario/obtenerProveedores`;
        const queryParams = [];

        // Si se seleccionó una sucursal, agregarla como parámetro
        if (IdSucursal) {
            queryParams.push(`IdSucursal=${IdSucursal}`);
        }

        // Si se seleccionó un departamento, agregarlo como parámetro
        if (IdDepartamento) {
            queryParams.push(`IdDepartamento=${IdDepartamento}`);
        }

        // Si se seleccionó una categoría, agregarla como parámetro
        if (IdCategoria) {
            queryParams.push(`IdCategoria=${IdCategoria}`);
        }

        // Si se seleccionó una subcategoría, agregarla como parámetro
        if (IdSubCategoria) {
            queryParams.push(`IdSubCategoria=${IdSubCategoria}`);
        }

        // Si hay parámetros, agregarlos a la URL
        if (queryParams.length > 0) {
            url += `?${queryParams.join('&')}`;
        }

        fetch(url)
            .then(response => response.json())
            .then(data => {
                const proveedorSelect = document.getElementById('proveedorBusqueda');
                proveedorSelect.innerHTML = '<option value="">Reporte General</option>'; // Opción por defecto

                data.forEach(proveedor => {
                    const option = document.createElement('option');
                    option.value = proveedor.IdProveedor; // Valor del select será el Id del proveedor
                    option.textContent = proveedor.NombreProveedor; // Texto visible será el nombre del proveedor
                    proveedorSelect.appendChild(option);
                });
            })
            .catch(error => {
                console.error('Error al obtener los nombres de los proveedores:', error);
                showAlert('Error', 'Hubo un error al obtener los nombres de los proveedores.', 'error');
            });
    }
    fetchProveedores();
    
    let globalResetData; 

    // Funcion para el boton de generar reporte
    document.getElementById('generarReporte').addEventListener('click', function () {
        const sucursalBuscar = document.getElementById('sucursalBusqueda').value;
        const departamentoFiltro = document.getElementById('departamentoBusqueda').value;
        const categoriaFiltro = document.getElementById('categoriaBusqueda').value;
        const subcategoriaFiltro = document.getElementById('subcategoriaBusqueda').value;
        const proveedorFiltro = document.getElementById('proveedorBusqueda').value;
        const url = `${basePath}backendInventario/generarReporteInventario`;
    
        const requestBody = {
            sucursalBuscar: sucursalBuscar === '' ? null : sucursalBuscar,
            departamentoFiltro: departamentoFiltro === '' ? null : departamentoFiltro,
            categoriaFiltro: categoriaFiltro === '' ? null : categoriaFiltro,
            subcategoriaFiltro: subcategoriaFiltro === '' ? null : subcategoriaFiltro,
            proveedorFiltro: proveedorFiltro === '' ? null : proveedorFiltro
        };
     
        showSpinner();
    
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(errorData => {
                        const errorMessage = errorData.error || 'Error al generar el reporte';
                        throw new Error(errorMessage);
                    });
                }
                return response.json(); // Cambiado a JSON
            })
            .then(result => {
                // Verificar si hay registros
                if (result.totalRecords === 0) {
                    showAlert('Información', 'No se encontró información para los criterios seleccionados.', 'info');
                    return;
                }
    
                // Verificar que los selectores existan antes de usarlos
                if (!result.selectores) {
                    console.error('No se encontró la propiedad "selectores" en la respuesta:', result);
                    return;
                }
                // Llenar los selectores con los datos necesarios
                llenarSelectores(result.selectores);
    
                // Calcula los totales para las graficas
                obtenerTotales();

                // Actualizar la tabla con los datos del reporte
                updateTable(result.totalRecords, sucursalBuscar);
    
                // Create resetData as a closure with access to current context
                globalResetData = function () {
                    setTimeout(() => {
                        llenarSelectores(result.selectores);
                        obtenerTotales();
                        updateTable(result.totalRecords, sucursalBuscar);
                    }, 500);
                };
            })
            .catch(error => {
                console.error('Error al generar el reporte:', error);
                showAlert('Error', error.message, 'error');
            })
            .finally(() => {
            });
    });
    
    // Evento para el botón quitarFiltro
    document.getElementById('quitarfiltro').addEventListener('click', function () {
        showSpinner();
        // Restablecer los selectores a la opción predeterminada y deja los campos vacíos
        document.getElementById('sucursalFiltro').selectedIndex = 0;
        document.getElementById('departamentoFiltro').selectedIndex = 0;
        document.getElementById('categoriaFiltro').selectedIndex = 0;
        document.getElementById('subcategoriaFiltro').selectedIndex = 0;
        document.getElementById('proveedorFiltro').selectedIndex = 0;
        document.getElementById('descProduc').value = '';
        document.getElementById('descProduc').innerText = '';
        document.getElementById('viewBE').style.display = 'none';
        document.getElementById('quitarfiltro').style.display = 'none';
        document.getElementById('exportar').style.display = 'block';

        if (globalResetData) {
            globalResetData();
        }
    });

    function updateTable(totalRecords, sucursalBuscar) {
        // Destruir cualquier instancia previa de DataTables para evitar conflictos
        if ($.fn.DataTable.isDataTable('#dataTable')) {
            $('#dataTable').DataTable().clear().destroy();
        }
    
        // Configurar DataTables para manejar datos dinámicos con paginación
        $('#dataTable').DataTable({
            serverSide: true,
            ajax: function (data, callback) {
                // Calcular la página actual y el tamaño de la página
                const page = (data.start / data.length) + 1;
                const pageSize = data.length;
        
                const url = `${basePath}backendInventario/getPaginatedData`;
                const requestBody = {
                    page,
                    pageSize,
                    search: data.search, // Búsqueda enviada por DataTables
                    order: data.order,   // Ordenamiento enviado por DataTables
                    columns: data.columns // Columnas visibles enviadas por DataTables
                };
        
                fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody)
                })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Error al obtener datos paginados');
                        }
                        return response.json();
                    })
                    .then(result => {
                        callback({
                            draw: data.draw,
                            recordsTotal: result.totalRecords,
                            recordsFiltered: result.totalRecords,
                            data: result.data // Datos de la página actual
                        });
                    })
                    .catch(error => {
                        console.error('Error al obtener datos paginados:', error);
                        showAlert('Error', 'Hubo un problema al cargar los datos.', 'error');
                    });
            },
            columns: [
                {
                    data: 'NombreSucursal',
                    render: function (data, type, row) {
                        return `
                            <button 
                                class="btn-nombre-sucursal" 
                                data-id="${row.IdSucursal}" 
                                data-nombre="${row.NombreSucursal}" 
                                style="background-color: transparent; border: none; color: inherit; cursor: pointer; text-decoration: none;">
                                ${data || 'Sin Nombre'}
                            </button>`;
                    }
                },
                { data: 'Upc' },
                { data: 'Descripcion' },
                { data: 'Existencia' },
                { data: 'Departamento' },
                { data: 'Categoria' },
                { data: 'SubCategoria' },
                { data: 'Proveedor' },
                { data: 'UnidadesPorFardo' },
                {
                    data: 'FechaInventario',
                    render: function (data, type, row) {
                        if (!data) return '';
                        const date = new Date(data); // Convertir el string a objeto Date
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0'); // Mes (0-11) + 1
                        const day = String(date.getDate()).padStart(2, '0'); // Día
                        return `${year}/${month}/${day}`; // Formato aaaa/mm/dd
                    }
                }
            ],
            processing: true,
            lengthChange: false,
            searching: false,
            pageLength: 100,
            lengthMenu: [100, 200, 500],
            language: {
                paginate: {
                    next: 'Siguiente',
                    previous: 'Anterior'
                },
                search: "Buscar por UPC:",
                lengthMenu: "Mostrar _MENU_ registros por página",
                info: "Mostrando _START_ a _END_ de _TOTAL_ registros",
                infoEmpty: "Mostrando 0 a 0 de 0 registros",
                infoFiltered: "(filtrado de _MAX_ registros totales)"
            },
            initComplete: function () {
                hideSpinner();
                document.getElementById('Busqueda').style.display = 'none';
                document.getElementById('Filtros').style.display = 'block';
            }
        });
    }

    // Delegar el evento click a un elemento contenedor (tbody)
    $('#dataTable tbody').on('click', '.btn-nombre-sucursal', function () {
        const button = $(this);
        const id = button.data('id');
        const nombre = button.data('nombre');
    
        // Actualizar el modal con la información seleccionada
        document.getElementById('tituloSucursal').innerText = nombre;
        document.getElementById('tituloSucursal').value = id;
    
        // Fetch al backend para obtener más detalles
        fetch(`${basePath}backendInventario/detalleSucursal?nombre=${encodeURIComponent(id)}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('No se encontró la sucursal.');
                }
                return response.json();
            })
            .then(data => {
                // Verificar si hay datos relevantes
                if (!data || (!data.TipoSucursal && !data.Descripcion && !data.Imagen && !data.Ubicacion)) {
                    document.getElementById('viewInfo').style.display = 'none';
                    document.getElementById('viewInfoError').style.display = 'block';
                } else {
                    document.getElementById('viewInfo').style.display = 'block';
                    document.getElementById('viewInfoError').style.display = 'none';
    
                    // Actualizar los campos del modal con los datos obtenidos
                    document.getElementById('tipoTienda').innerText = data.TipoSucursal || 'No disponible';
                    document.getElementById('descSucursal').innerText = data.Descripcion || 'No disponible';
    
                    if (data.Imagen) {
                        document.getElementById('imagenSucursal').src = `data:image/jpeg;base64,${data.Imagen}`;
                    } else {
                        document.getElementById('imagenSucursal').src = ''; // Imagen predeterminada o vacío
                    }
    
                    document.getElementById('ubicacionLink').href = data.Ubicacion || '#'; // Enlace de ubicación
                }
    
                // Mostrar el modal usando Bootstrap
                const modal = new bootstrap.Modal(document.getElementById('modalInfo'));
                modal.show();
            })
            .catch(error => {
                console.error('Error:', error);
                document.getElementById('viewInfo').style.display = 'none';
                document.getElementById('viewInfoError').style.display = 'block';
    
                // Mostrar el modal con el mensaje de error
                const modal = new bootstrap.Modal(document.getElementById('modalInfo'));
                modal.show();
            });
    });

    // Funcion para llenar los selectores con la informacion en la tabla 
    function llenarSelectores(selectores) {
        const { sucursales, departamentos, categorias, subcategorias, proveedores } = selectores;
    
        // 1. Sucursales
        const sucursalFiltro = document.getElementById('sucursalFiltro');
        sucursalFiltro.innerHTML = `<option value="">Todas las sucursales</option>`; // Opción predeterminada
        // Usar Map para obtener sucursales únicas
        const sucursalesUnicas = Array.from(new Map(
            (sucursales || []).map(sucursal => [sucursal.id, sucursal]) // Usar ID como clave
        ).values());
        sucursalesUnicas.forEach(sucursal => {
            const option = document.createElement('option');
            option.value = sucursal.id;
            option.textContent = sucursal.nombre;
            sucursalFiltro.appendChild(option);
        });
    
        // 2. Departamentos
        const departamentoFiltro = document.getElementById('departamentoFiltro');
        departamentoFiltro.innerHTML = `<option value="">Todos los departamentos</option>`;
        // Usar Set para eliminar duplicados en departamentos
        const departamentosUnicos = [...new Set(departamentos || [])];
        departamentosUnicos.forEach(departamento => {
            const option = document.createElement('option');
            option.value = departamento;
            option.textContent = departamento;
            departamentoFiltro.appendChild(option);
        });
    
        // 3. Categorías
        const categoriaFiltro = document.getElementById('categoriaFiltro');
        categoriaFiltro.innerHTML = `<option value="">Todas las categorías</option>`;
        // Usar Set para eliminar duplicados en categorías
        const categoriasUnicas = [...new Set(categorias || [])];
        categoriasUnicas.forEach(categoria => {
            const option = document.createElement('option');
            option.value = categoria;
            option.textContent = categoria;
            categoriaFiltro.appendChild(option);
        });
    
        // 4. Subcategorías
        const subcategoriaFiltro = document.getElementById('subcategoriaFiltro');
        subcategoriaFiltro.innerHTML = `<option value="">Todas las subcategorías</option>`;
        // Usar Set para eliminar duplicados en subcategorías
        const subcategoriasUnicas = [...new Set(subcategorias || [])];
        subcategoriasUnicas.forEach(subcategoria => {
            const option = document.createElement('option');
            option.value = subcategoria;
            option.textContent = subcategoria;
            subcategoriaFiltro.appendChild(option);
        });
    
        // 5. Proveedores
        const proveedorFiltro = document.getElementById('proveedorFiltro');
        proveedorFiltro.innerHTML = `<option value="">Todas los proveedores</option>`;
        // Usar Set para eliminar duplicados en provedores
        const proveedoresUnicos = [...new Set(proveedores || [])];
        proveedoresUnicos.forEach(provedor => {
            const option = document.createElement('option');
            option.value = provedor;
            option.textContent = provedor;
            proveedorFiltro.appendChild(option);
        });
    }

    // Evento para el selector de sucursal
    document.getElementById('sucursalFiltro').addEventListener('change', function() {
        reiniciarFiltro('departamentoFiltro');
        reiniciarFiltro('categoriaFiltro');
        reiniciarFiltro('subcategoriaFiltro');
        reiniciarFiltro('proveedorFiltro');
        actualizarInformacion();
    });
    
    // Evento para el selector de departamento
    document.getElementById('departamentoFiltro').addEventListener('change', function() {
        reiniciarFiltro('categoriaFiltro');
        reiniciarFiltro('subcategoriaFiltro');
        reiniciarFiltro('proveedorFiltro');
        actualizarInformacion();
    });
    
    // Evento para el selector de categoria
    document.getElementById('categoriaFiltro').addEventListener('change', function() {
        reiniciarFiltro('subcategoriaFiltro');
        reiniciarFiltro('proveedorFiltro');
        actualizarInformacion();
    });
    
    // Evento para el selector de subcategoria
    document.getElementById('subcategoriaFiltro').addEventListener('change', function() {
        reiniciarFiltro('proveedorFiltro');
        actualizarInformacion();
    });
    
    // Evento para el selector de subcategoria
    document.getElementById('proveedorFiltro').addEventListener('change', function() {
        actualizarInformacion();
    });
    
    // Función para reiniciar un filtro al valor "Todos"s
    function reiniciarFiltro(filtroId) {
        const filtro = document.getElementById(filtroId);
        if (filtro) {
            filtro.innerHTML = '<option value="">Todos</option>'; // Asegurar opción "Todos"
            filtro.value = ""; // Seleccionar "Todos" por defecto
        } else {
            console.error(`No se encontró el filtro con ID "${filtroId}"`);
        }
    }

    // Función para filtrar por descripcion
    document.getElementById('descProduc').addEventListener('keydown', function(event) {
        if (event.key === 'Enter') { // Comprobar si la tecla presionada es Enter
            const searchTerm = this.value.toLowerCase();

            if (searchTerm === '') {
                document.getElementById('quitarfiltro').style.display = 'none';
                document.getElementById('viewBE').style.display = 'none';
                document.getElementById('exportar').style.display = 'block';
            } else {
                document.getElementById('quitarfiltro').style.display = 'block';
                document.getElementById('viewBE').style.display = 'block';
                document.getElementById('exportar').style.display = 'none';
            }

            // Llamar a actualizarInformacion para aplicar todos los filtros (incluyendo descripción)
            actualizarInformacion();
        }
    });
    
    // Funcion para actualizar informacion en base a filtros
    function actualizarInformacion() {
        const sucursalFiltro = document.getElementById('sucursalFiltro');
        const departamentoFiltro = document.getElementById('departamentoFiltro');
        const categoriaFiltro = document.getElementById('categoriaFiltro');
        const subcategoriaFiltro = document.getElementById('subcategoriaFiltro');
        const proveedorFiltro = document.getElementById('proveedorFiltro');
        const descripcionInput = document.getElementById('descProduc');
    
        const sucursal = sucursalFiltro.value || null;
        const departamento = departamentoFiltro.value || null;
        const categoria = categoriaFiltro.value || null;
        const subcategoria = subcategoriaFiltro.value || null;
        const proveedor = proveedorFiltro.value || null;
        const searchTerm = descripcionInput.value.trim() || null;

        // Check if all filters are null
        if (!sucursal && !departamento && !categoria && !subcategoria && !proveedor && !searchTerm) {
            // Use globalResetData if it exists
            if (typeof globalResetData === 'function') {
                globalResetData();
                return;
            }
        }
    
        showSpinner();
    
        fetch(`${basePath}backendInventario/filtrarDatos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sucursal, departamento, categoria, subcategoria, proveedor, searchTerm })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al filtrar los datos');
            }
            return response.json();
        })
        .then(result => {
            // Si no hay datos en la respuesta, mostrar alerta y detener la ejecución
            if (!result.data || result.data.length === 0) {
                showAlert('Sin resultados', 'No hay información disponible para los filtros aplicados.', 'info');
                return;
            }
            const valoresSeleccionados = { sucursal, departamento, categoria, subcategoria, proveedor };
            // Actualizar los selectores con los datos únicos generados
            updateSelectors(result.selectores, valoresSeleccionados);

            // Calcular los nuevos totales basados en los datos filtrados
            obtenerTotales();

            verButtonFiltro();

            // Actualizar la tabla con los datos filtrados
            updateTableFiltered(result.data);
        })
        .catch(error => {
            console.error('Error al filtrar los datos:', error);
            showAlert('Error', 'Hubo un problema al aplicar los filtros.', 'error');
        })
        .finally();
    }

    // Funcion para actualizar los selectores con datos filtrados
    function updateSelectors(selectores, valoresSeleccionados = {}) {
        const { sucursal: sucursalSeleccionada = "", departamento: departamentoSeleccionado = "", categoria: categoriaSeleccionada = "", subcategoria: subcategoriaSeleccionada = "", proveedor: proveedorSeleccionado = "" } = valoresSeleccionados;
    
        // Llena el selector de sucursales
        const selectorSucursal = document.getElementById('sucursalFiltro');
        selectorSucursal.innerHTML = '<option value="">Todas las sucursales</option>';
        selectores.sucursales.forEach(sucursal => {
            const option = document.createElement('option');
            option.value = sucursal.id;
            option.textContent = sucursal.nombre;
            selectorSucursal.appendChild(option);
        });
        selectorSucursal.value = sucursalSeleccionada || ""; // Mantener selección actual
    
        // Llena el selector de departamentos
        const selectorDepartamento = document.getElementById('departamentoFiltro');
        selectorDepartamento.innerHTML = '<option value="">Todos los departamentos</option>';
        selectores.departamentos.forEach(departamento => {
            const option = document.createElement('option');
            option.value = departamento;
            option.textContent = departamento;
            selectorDepartamento.appendChild(option);
        });
        selectorDepartamento.value = departamentoSeleccionado || ""; // Reinicia siempre con "Todos"
    
        // Llena el selector de categorías
        const selectorCategoria = document.getElementById('categoriaFiltro');
        selectorCategoria.innerHTML = '<option value="">Todas las categorías</option>';
        selectores.categorias.forEach(categoria => {
            const option = document.createElement('option');
            option.value = categoria;
            option.textContent = categoria;
            selectorCategoria.appendChild(option);
        });
        selectorCategoria.value = categoriaSeleccionada || ""; // Reinicia siempre con "Todas"
    
        // Llena el selector de subcategorías
        const selectorSubCategoria = document.getElementById('subcategoriaFiltro');
        selectorSubCategoria.innerHTML = '<option value="">Todas las subcategorías</option>';
        selectores.subcategorias.forEach(subcategoria => {
            const option = document.createElement('option');
            option.value = subcategoria;
            option.textContent = subcategoria;
            selectorSubCategoria.appendChild(option);
        });
        selectorSubCategoria.value = subcategoriaSeleccionada || ""; // Reinicia siempre con "Todas"
    
        // Llena el selector de proveedor
        const selectorProveedor = document.getElementById('proveedorFiltro');
        selectorProveedor.innerHTML = '<option value="">Todos los proveedores</option>';
        selectores.proveedores.forEach(proveedor => {
            const option = document.createElement('option');
            option.value = proveedor;
            option.textContent = proveedor;
            selectorProveedor.appendChild(option);
        });
        selectorProveedor.value = proveedorSeleccionado || ""; // Reinicia siempre con "Todos"
    }

    // Funcion para actualizar la tabla con los datos filtrados
    function updateTableFiltered(data) {
        // Destruir cualquier instancia previa de DataTables para evitar conflictos
        if ($.fn.DataTable.isDataTable('#dataTable')) {
            $('#dataTable').DataTable().clear().destroy();
        }
    
        // Inicializar DataTables con los datos filtrados
        $('#dataTable').DataTable({
            data: data,
            columns: [
                {
                    data: 'NombreSucursal',
                    render: function (data, type, row) {
                        return `
                            <button 
                                class="btn-nombre-sucursal" 
                                data-id="${row.IdSucursal}" 
                                data-nombre="${row.NombreSucursal}" 
                                style="background-color: transparent; border: none; color: inherit; cursor: pointer; text-decoration: none;">
                                ${data || 'Sin Nombre'}
                            </button>`;
                    }
                },
                { data: 'Upc' },
                { data: 'Descripcion' },
                { data: 'Existencia' },
                { data: 'Departamento' },
                { data: 'Categoria' },
                { data: 'SubCategoria' },
                { data: 'Proveedor' },
                { data: 'UnidadesPorFardo' },
                {
                    data: 'FechaInventario',
                    render: function (data, type, row) {
                        if (!data) return '';
                        const date = new Date(data); // Convertir el string a objeto Date
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0'); // Mes (0-11) + 1
                        const day = String(date.getDate()).padStart(2, '0'); // Día
                        return `${year}/${month}/${day}`; // Formato aaaa/mm/dd
                    }
                }
            ],
            processing: true,
            lengthChange: false,
            searching: false,
            pageLength: 100,
            lengthMenu: [100, 200, 500],
            language: {
                paginate: {
                    next: 'Siguiente',
                    previous: 'Anterior'
                },
                search: "Buscar:",
                lengthMenu: "Mostrar _MENU_ registros por página",
                info: "Mostrando _START_ a _END_ de _TOTAL_ registros",
                infoEmpty: "Mostrando 0 a 0 de 0 registros",
                infoFiltered: "(filtrado de _MAX_ registros totales)"
            },
            initComplete: function () {
                hideSpinner();
            }
        });
    }

    function verButtonFiltro() {
        // No limpiar el input de búsqueda
        const searchTerm = document.getElementById('descProduc').value.toLowerCase();
    
        // Verificar si hay algún filtro aplicado para mostrar el botón "quitar filtro"
        const sucursal = document.getElementById('sucursalFiltro').value;
        const departamento = document.getElementById('departamentoFiltro').value;
        const categoria = document.getElementById('categoriaFiltro').value;
        const subcategoria = document.getElementById('subcategoriaFiltro').value;
        const proveedor = document.getElementById('proveedorFiltro').value;
    
        if (sucursal || departamento || categoria || subcategoria || proveedor || searchTerm) {
            document.getElementById('quitarfiltro').style.display = 'block';
            document.getElementById('viewBE').style.display = 'block';
            document.getElementById('exportar').style.display = 'none';
        } else {
            document.getElementById('quitarfiltro').style.display = 'none';
            document.getElementById('viewBE').style.display = 'none';
            document.getElementById('exportar').style.display = 'block';
            updateTable(); // Actualizar la tabla con todos los datos si no hay filtros
        }
    }

    // Definir las variables de totales globalmente
    let sucursalTotales = {};
    let departamentoTotales = {};
    let categoriaTotales = {};
    let subcategoriaTotales = {};
    let proveedorTotales = {};

    // Funcion para calcular los totales para realizar las graficas
    function obtenerTotales() {
        const sucursal = document.getElementById('sucursalFiltro').value || null;
        const departamento = document.getElementById('departamentoFiltro').value || null;
        const categoria = document.getElementById('categoriaFiltro').value || null;
        const subcategoria = document.getElementById('subcategoriaFiltro').value || null;
        const proveedor = document.getElementById('proveedorFiltro').value || null;
        const searchTerm = document.getElementById('descProduc').value.trim() || null;

        fetch(`${basePath}backendInventario/calcularTotales`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sucursal, departamento, categoria, subcategoria, proveedor, searchTerm })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al calcular los totales');
            }
            return response.json();
        })
        .then(result => {
            // Actualizar las variables globales
            sucursalTotales = result.sucursalTotales;
            departamentoTotales = result.departamentoTotales;
            categoriaTotales = result.categoriaTotales;
            subcategoriaTotales = result.subcategoriaTotales;
            proveedorTotales = result.proveedorTotales;

            // Generar las gráficas después de calcular los totales
            generarGraficas();
        })
        .catch(error => {
            console.error('Error al calcular los totales:', error);
            showAlert('Error', 'Hubo un problema al calcular los totales.', 'error');
        })
        .finally();
    }

    // Obtiene el tema actual para despues realizar las graficas en base al tema actual
    function obtenerTemaActual() {
        const temaActual = document.getElementById('themeStylesheet').getAttribute('href');
        return temaActual.includes('claro') ? 'claro' : 'oscuro';
    }

    // Genera las gráficas en base a la información de los totales y el tema actual
    function generarGraficas() {
        const temaActual = obtenerTemaActual();
        const crearGraficoPastel = temaActual === 'claro' ? crearGraficoDePastelClaro : crearGraficoDePastelOscuro;
        const crearGraficoBar = temaActual === 'claro' ? crearGraficoBarClaro : crearGraficoBarOscuro;

        google.charts.load('current', { 'packages': ['corechart'] });
        google.charts.setOnLoadCallback(() => {
            const totalSucursal = Object.values(sucursalTotales).reduce((a, b) => a + b, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const totalDepartamento = Object.values(departamentoTotales).reduce((a, b) => a + b, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const totalCategoria = Object.values(categoriaTotales).reduce((a, b) => a + b, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const totalSubcategoria = Object.values(subcategoriaTotales).reduce((a, b) => a + b, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const totalProveedor = Object.values(proveedorTotales).reduce((a, b) => a + b, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

            crearGraficoBar('ventasPorSucursal', Object.keys(sucursalTotales), Object.values(sucursalTotales), `Gráfica por Sucursal - Existencias Totales: ${totalSucursal}`);
            crearGraficoPastel('ventasPorDepartamento', Object.keys(departamentoTotales), Object.values(departamentoTotales), `Gráfica por Departamentos - Existencias Totales: ${totalDepartamento}`);
            crearGraficoPastel('ventasPorCategoria', Object.keys(categoriaTotales), Object.values(categoriaTotales), `Gráfica por Categorías - Existencias Totales: ${totalCategoria}`);
            crearGraficoBar('ventasPorSubcategoria', Object.keys(subcategoriaTotales), Object.values(subcategoriaTotales), `Gráfica por SubCategorías - Existencias Totales: ${totalSubcategoria}`);
            crearGraficoBar('ventasPorProveedor', Object.keys(proveedorTotales), Object.values(proveedorTotales), `Gráfica por Proveedor - Existencias Totales: ${totalProveedor}`);
        });
    }

    function graficaFiltro1() {
        generarGraficas();
    }
    // Exponer la función graficaFiltro globalmente
    window.graficaFiltro = graficaFiltro1;

    // Graficos claros
    function crearGraficoDePastelClaro(elementId, labels, data, titulo, textColor = 'black') {
        const total = data.reduce((sum, value) => sum + value, 0);
    
        // Ordenar los datos de mayor a menor
        const sortedData = data.map((value, index) => ({ label: labels[index], value }))
            .sort((a, b) => b.value - a.value);
    
        const sortedLabels = sortedData.map(item => item.label);
        const sortedValues = sortedData.map(item => item.value);
        const sortedPercentages = sortedValues.map(value => ((value / total) * 100).toFixed(2));
    
        // Crear etiquetas personalizadas para la leyenda
        const legendLabels = sortedLabels.map((label, index) =>
            `${label}: U/ ${sortedValues[index].toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${sortedPercentages[index]}%)`
        );
    
        // Definir separación para las secciones pequeñas
        const pullValues = sortedPercentages.map(percent => (percent < 5 ? 0.2 : 0)); // Separar si es menor al 5%
    
        const trace = {
            labels: legendLabels,
            values: sortedValues,
            type: 'pie',
            hole: 0.4, // Convierte el gráfico en un donut
            hoverinfo: 'label+percent+value',
            textinfo: 'none',
            marker: {
                line: {
                    color: '#FFFFFF',  // Borde blanco para mayor visibilidad
                    width: 1
                },
                colors: Plotly.d3.scale.category20().range()
            },
            pull: pullValues, // Separar secciones pequeñas
            hoverlabel: {
                bgcolor: 'white',
                font: { color: 'black' }
            },
            insidetextfont: {
                color: textColor
            }
        };
    
        const layout = {
            title: {
                text: titulo,
                font: {
                    color: textColor
                }
            },
            height: 400,
            margin: { l: 0, r: 300, b: 0, t: 50 }, // Aumentar el margen derecho para leyenda
            paper_bgcolor: 'rgba(0, 0, 0, 0)', // Fondo transparente
            plot_bgcolor: 'rgba(0, 0, 0, 0)', // Fondo transparente
            showlegend: true,
            legend: {
                x: 1.1,  // Ajusta la posición de la leyenda a la derecha
                y: 1,
                traceorder: 'normal',
                font: {
                    size: 12,
                    color: textColor
                },
                itemsizing: 'constant',
                // Habilitar desplazamiento si la leyenda es muy larga
                yanchor: 'top',
                valign: 'middle',
            },
            legend_scroll: {
                height: 300, // Limitar la altura de la leyenda
            }
        };
    
        const config = {
            displayModeBar: false, // Ocultar la barra de herramientas
            locale: 'es', // Intentar definir el idioma a español (opcional)
            displaylogo: false, // Ocultar el logo de Plotly
            modeBarButtonsToRemove: ['toImage'], // Elimina botones innecesarios
            showTips: false // Eliminar el cuadro de ayuda
        };
        Plotly.newPlot(elementId, [trace], layout, config);
    }
    
    function crearGraficoBarClaro(elementId, labels, data, titulo, textColor1 = 'black') {
        const total = data.reduce((sum, value) => sum + value, 0);
    
        // Ordenar los datos de mayor a menor
        const sortedData = data.map((value, index) => ({ label: labels[index], value }))
            .sort((a, b) => b.value - a.value);
    
        const sortedLabels = sortedData.map(item => `${item.label}  `);
        const sortedValues = sortedData.map(item => item.value);
    
        const reversedLabels = sortedLabels.reverse();
        const reversedValues = sortedValues.reverse();
    
        const trace = {
            x: reversedValues,
            y: reversedLabels,
            type: 'bar',
            orientation: 'h',
            text: sortedLabels.map((label, index) => 
                `${label}<br>Existencias Totales: ${sortedValues[index].toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${(sortedValues[index] / total * 100).toFixed(2)}%)`
            ),
            hoverinfo: 'text',
            hoverlabel: {
                bgcolor: 'white',
                font: { color: 'black' }
            },
            marker: {
                color: '#3366cc'
            }
        };
    
        // Ajustar la altura del gráfico en función de la cantidad de datos
        const height = reversedLabels.length * 60 + 150;
    
        const layout = {
            title: {
                text: titulo,
                font: {
                    color: textColor1
                }
            },
            xaxis: {
                title: `Existencias Totales: ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                color: textColor1,
                gridcolor: textColor1,
                linecolor: textColor1,
                zerolinecolor: textColor1
            },
            yaxis: {
                automargin: true,
                tickfont: {
                    size: 14
                },
                color: textColor1,
                gridcolor: textColor1,
                linecolor: textColor1,
                zerolinecolor: textColor1
            },
            margin: {
                l: 250,  // Aumentar el margen izquierdo para etiquetas más largas
                r: 250,
                t: 50,
                b: 50
            },
            width: 1360,  // Ancho del gráfico
            height: height,  // Ajustar la altura en función del número de barras
            plot_bgcolor: 'rgba(0, 0, 0, 0)', // Fondo transparente
            paper_bgcolor: 'rgba(0, 0, 0, 0)'  // Fondo transparente
        };
    
        const config = {
            displayModeBar: false  // Ocultar la barra de herramientas
        };
        Plotly.newPlot(elementId, [trace], layout, config);
    }
    
    // Graficos Oscuros
    function crearGraficoDePastelOscuro(elementId, labels, data, titulo) {
        const total = data.reduce((sum, value) => sum + value, 0);
    
        // Ordenar los datos de mayor a menor
        const sortedData = data.map((value, index) => ({ label: labels[index], value }))
            .sort((a, b) => b.value - a.value);
    
        const sortedLabels = sortedData.map(item => item.label);
        const sortedValues = sortedData.map(item => item.value);
        const sortedPercentages = sortedValues.map(value => ((value / total) * 100).toFixed(2));
    
        // Crear etiquetas personalizadas para la leyenda
        const legendLabels = sortedLabels.map((label, index) =>
            `${label}: U/ ${sortedValues[index].toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${sortedPercentages[index]}%)`
        );
    
        const pullValues = sortedPercentages.map(percent => (percent < 5 ? 0.2 : 0));
    
        const trace = {
            labels: legendLabels,
            values: sortedValues,
            type: 'pie',
            hole: 0.4,
            hoverinfo: 'label+percent+value',
            textinfo: 'none',
            marker: {
                line: {
                    color: '#2B2B2B',  // Color de borde
                    width: 1
                },
                colors: Plotly.d3.scale.category20().range()
            },
            pull: pullValues,
            hoverlabel: {
                bgcolor: 'white',
                font: { color: 'black' } // Etiquetas de hover (negro sobre blanco)
            },
            insidetextfont: {
                color: 'white' // Texto interno en blanco
            }
        };
    
        const layout = {
            title: {
                text: titulo,
                font: {
                    color: 'white' // Título en blanco
                }
            },
            height: 400,
            margin: { l: 0, r: 300, b: 0, t: 50 },
            paper_bgcolor: 'rgba(0, 0, 0, 0)', 
            plot_bgcolor: 'rgba(0, 0, 0, 0)',
            showlegend: true,
            legend: {
                x: 1.1,
                y: 1,
                traceorder: 'normal',
                font: {
                    size: 12,
                    color: 'white' // Texto de leyenda en blanco
                },
                itemsizing: 'constant',
                yanchor: 'top',
                valign: 'middle',
            }
        };
    
        const config = {
            displayModeBar: false,
            locale: 'es',
            displaylogo: false,
            modeBarButtonsToRemove: ['toImage'],
            showTips: false
        };
        Plotly.newPlot(elementId, [trace], layout, config);
    }
    
    function crearGraficoBarOscuro(elementId, labels, data, titulo, textColor1 = 'white') {
        const total = data.reduce((sum, value) => sum + value, 0);
    
        // Ordenar los datos de mayor a menor
        const sortedData = data.map((value, index) => ({ label: labels[index], value }))
            .sort((a, b) => b.value - a.value);
    
        const sortedLabels = sortedData.map(item => `${item.label}  `);
        const sortedValues = sortedData.map(item => item.value);
    
        const reversedLabels = sortedLabels.reverse();
        const reversedValues = sortedValues.reverse();
    
        const trace = {
            x: reversedValues,
            y: reversedLabels,
            type: 'bar',
            orientation: 'h',
            text: sortedLabels.map((label, index) => 
                `${label}<br>Existencias Totales: ${sortedValues[index].toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${(sortedValues[index] / total * 100).toFixed(2)}%)`
            ),
            hoverinfo: 'text',
            hoverlabel: {
                bgcolor: 'white',
                font: { color: 'black' }
            },
            marker: {
                color: '#3366cc'
            }
        };
    
        // Ajustar la altura del gráfico en función de la cantidad de datos
        const height = reversedLabels.length * 60 + 150;
    
        const layout = {
            title: {
                text: titulo,
                font: {
                    color: textColor1
                }
            },
            xaxis: {
                title: `Existencias Totales: ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                color: textColor1,
                gridcolor: textColor1,
                linecolor: textColor1,
                zerolinecolor: textColor1
            },
            yaxis: {
                automargin: true,
                tickfont: {
                    size: 14
                },
                color: textColor1,
                gridcolor: textColor1,
                linecolor: textColor1,
                zerolinecolor: textColor1
            },
            margin: {
                l: 250,  // Aumentar el margen izquierdo para etiquetas más largas
                r: 250,
                t: 50,
                b: 50
            },
            width: 1360,  // Ancho del gráfico
            height: height,  // Ajustar la altura en función del número de barras
            plot_bgcolor: 'rgba(0, 0, 0, 0)', // Fondo transparente
            paper_bgcolor: 'rgba(0, 0, 0, 0)'  // Fondo transparente
        };
    
        const config = {
            displayModeBar: false  // Ocultar la barra de herramientas
        };
        Plotly.newPlot(elementId, [trace], layout, config);
    }

    // Función para volver a mostrar las graficas
    document.getElementById('graficas').addEventListener('click', function() {
        document.getElementById('graficas').style.display = 'none';
        document.getElementById('tabla').style.display = 'block';

        document.getElementById('viewDataTable').style.display = 'none';
        document.getElementById('graficoContainer').style.display = 'block';
    });

    // Función para volver a mostrar la tabla
    document.getElementById('tabla').addEventListener('click', function() {
        document.getElementById('graficas').style.display = 'block';
        document.getElementById('tabla').style.display = 'none';

        document.getElementById('viewDataTable').style.display = 'block';
        document.getElementById('graficoContainer').style.display = 'none';
    });

    // Botón para exportar toda la información generada
    document.getElementById('exportar').addEventListener('click', function () {
        // Redirigir al endpoint que genera y descarga el CSV
        const url = `${basePath}backendInventario/exportarTodo`;
        window.location.href = url;
    });
    
    // Botón para exportar toda la información generada
    document.getElementById('export').addEventListener('click', function () {
        // Redirigir al endpoint que genera y descarga el CSV
        const url = `${basePath}backendInventario/exportarTodo`;
        window.location.href = url;
    });

    // Botón para exportar información filtrada
    document.getElementById('exportFilter').addEventListener('click', function () {
        const sucursal = document.getElementById('sucursalFiltro').value || null;
        const departamento = document.getElementById('departamentoFiltro').value || null;
        const categoria = document.getElementById('categoriaFiltro').value || null;
        const proveedor = document.getElementById('proveedorFiltro').value || null;
        const subcategoria = document.getElementById('subcategoriaFiltro').value || null;
        const searchTerm = document.getElementById('descProduc').value.trim() || null;
    
        // Crear un formulario oculto para enviar los filtros al servidor
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `${basePath}backendInventario/exportarFiltrado`;
    
        const fields = { sucursal, departamento, categoria, subcategoria, proveedor, searchTerm};
        for (const [key, value] of Object.entries(fields)) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = value;
            form.appendChild(input);
        }
    
        document.body.appendChild(form);
        form.submit(); // Enviar el formulario
        document.body.removeChild(form);
    });

    // Boton para limpiar toda la informacion generada
    document.getElementById('limpiar').addEventListener('click', function (e) {
        document.getElementById('Busqueda').style.display = 'block';
        document.getElementById('viewDataTable').style.display = 'block';
        document.getElementById('graficas').style.display = 'block';
    
        document.getElementById('Filtros').style.display = 'none';
        document.getElementById('graficoContainer').style.display = 'none';
        document.getElementById('tabla').style.display = 'none';
    
        // Restablecer los selectores a la opción predeterminada
        document.getElementById('sucursalBusqueda').selectedIndex = 0;
        document.getElementById('departamentoBusqueda').selectedIndex = 0;
        document.getElementById('categoriaBusqueda').selectedIndex = 0;
        document.getElementById('subcategoriaBusqueda').selectedIndex = 0;
        document.getElementById('proveedorBusqueda').selectedIndex = 0;
        
        document.getElementById('sucursalFiltro').selectedIndex = 0;
        document.getElementById('departamentoFiltro').selectedIndex = 0;
        document.getElementById('categoriaFiltro').selectedIndex = 0;
        document.getElementById('subcategoriaFiltro').selectedIndex = 0;
        document.getElementById('proveedorFiltro').selectedIndex = 0;
        document.getElementById('descProduc').value = '';
        document.getElementById('descProduc').innerText = '';
    
        const tbody = document.querySelector('table tbody');
        tbody.innerHTML = ''; // Limpiar la tabla
    
        // Destruir cualquier instancia previa de DataTables para evitar conflictos
        if ($.fn.DataTable.isDataTable('#dataTable')) {
            $('#dataTable').DataTable().clear().destroy();
        }
    
        // Llamar al backend para limpiar los datos almacenados
        fetch(`${basePath}backendInventario/limpiarReporteInventario`   , {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al limpiar los datos en el backend.');
            }
            return response.json();
        })
        .then(result => {
            console.log(result.message);
        })
        .catch(error => {
            console.error('Error al limpiar los datos:', error);
        });
    });
});