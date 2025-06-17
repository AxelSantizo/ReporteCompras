document.addEventListener('DOMContentLoaded', function() { 
    // Obtener la fecha de hoy en formato YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0]; 
    document.getElementById('FechaFinal').value = today;

    // Crear una nueva fecha y restar un día para FechaInicio
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const formattedYesterday = yesterday.toISOString().split('T')[0]; 

    // Asignar la fecha de inicio (un día antes) al campo de FechaInicio
    document.getElementById('FechaInicio').value = formattedYesterday;

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
            title: 'Generando reporte',
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
        fetch('/backendCategorias/obtenerSucursales')
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

    // Función para obtener los nombres de las sucursales
    function fetchCategorias() {
        fetch('/backendCategorias/obtenerCategorias')
            .then(response => response.json())
            .then(data => {
                const categoriaSelect = document.getElementById('categoriaBusqueda');
                categoriaSelect.innerHTML = '<option value="">Todas las Categorias</option>'; // Opción por defecto
    
                data.forEach(categoria => {
                    if (categoria.SubCategorias && categoria.SubCategorias !== '0') { // Validar que el nombre no sea null o "0"
                        const option = document.createElement('option');
                        option.value = categoria.IdSubCategorias; // Valor del select será idCategoria
                        option.textContent = categoria.SubCategorias; // Texto visible será NombreCategoria
                        categoriaSelect.appendChild(option);
                    }
                });
            })
            .catch(error => {
                console.error('Error al obtener los nombres de las categorias:', error);
                showAlert('Error', 'Hubo un error al obtener los nombres de las categorias.', 'error');
            });
    }
    fetchCategorias();
  
    // Variable para almacenar todos los datos
    let allData = []; 

    document.getElementById('reporte').addEventListener('click', function() {
        generarReporte('agrupado');
    });
    
    document.getElementById('reporteDetallado').addEventListener('click', function() {
        generarReporte('detallado');
    });
    
    function generarReporte(tipoReporte) {
        const sucursalBuscar = document.getElementById('sucursalBusqueda').value;
        const fechaInicio = document.getElementById('FechaInicio').value;
        const fechaFin = document.getElementById('FechaFinal').value;
        const subcategoriaBuscar = document.getElementById('categoriaBusqueda').value; // Obtener el valor de la subcategoría seleccionada
    
    
        if (fechaInicio === '' || fechaFin === '') {
            showAlert('Error', 'Debe seleccionar una fecha de inicio y una fecha de fin.', 'error');
            return;
        } else if (fechaInicio > fechaFin) {
            showAlert('Error', 'La fecha de inicio no puede ser mayor a la fecha de fin.', 'error');
            return;  
        }
    
        // Mostrar el spinner
        showSpinner(); 
    
        const url = '/backendCategorias/generarReporte';
        const requestBody = {
            fechaInicio,
            fechaFin,
            sucursalBuscar: sucursalBuscar === '' ? null : sucursalBuscar,
            subcategoriaBuscar: subcategoriaBuscar === '' ? null : subcategoriaBuscar,  // Incluir subcategoría en el request
            tipoReporte  // Este será 'agrupado' o 'detallado'
        };
    
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        })
        .then(response => response.json())
        .then(reportData => {
            hideSpinner(); // Ocultar el spinner
            
            if (reportData.error) {
                showAlert('Error', reportData.error, 'error');
            } else if (reportData.length === 0) {
                showAlert('Información', 'No se encontraron datos para el período seleccionado.', 'info');
            } else {
                allData = reportData; // Almacenar todos los datos

                llenarSelectores(reportData); // Llenar los selectores con los datos del reporte
            
            	// Ocultar/mostrar botones y elementos según sea necesario
            	document.getElementById('viewSucursal').style.display = 'none';
            	document.getElementById('viewCategoria').style.display = 'none';
            	document.getElementById('viewFechainicio').style.display = 'none';
            	document.getElementById('viewFechafin').style.display = 'none';
            	document.getElementById('viewGenerar').style.display = 'none';
            	document.getElementById('filtroSelectores').style.display = 'block';
            	document.getElementById('exportar').style.display = 'block';
            	document.getElementById('graficas').style.display = 'block';
            	document.getElementById('limpiar').style.display = 'block';
            	document.getElementById('viewSP').style.display = 'block';
                

                updateTable();
                graficaFiltro(); // Generar las gráficas


                // Evento para el boton quitarFiltro
                document.getElementById('quitarfiltro').addEventListener('click', function() {
                    // Restablecer los selectores a la opción predeterminada y deja los campos vacios
                    document.getElementById('sucursalFiltro').selectedIndex = 0;
                    document.getElementById('departamentoFiltro').selectedIndex = 0;
                    document.getElementById('categoriaFiltro').selectedIndex = 0;
                    document.getElementById('subcategoriaFiltro').selectedIndex = 0;
                    document.getElementById('descProduc').value = '';
                    document.getElementById('descProduc').innerText = '';
                    document.getElementById('viewBE').style.display = 'none';
                    document.getElementById('quitarfiltro').style.display = 'none';
                    document.getElementById('exportar').style.display = 'block';
        
                    // Llamar a graficaFiltro para actualizar las gráficas sin filtros
                    graficaFiltro();
                    showSpinner();
                    // Actualiza la tabla sin filtros
                    updateTable();
                    hideSpinner();
                });
            }
        })
        .catch(error => {
            hideSpinner(); // Ocultar el spinner
            console.error('Error al generar el reporte:', error);
            showAlert('Error', 'Hubo un error al generar el reporte.', 'error');
        });
    }
    
    // Funcion para formatear la fecha a DD/MM/AAAA
    function formatDate(dateString) {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Los meses son 0-indexados
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    // Función para actualizar la tabla
    function updateTable() {
        // Obtener el cuerpo de la tabla
        const tbody = document.querySelector('table tbody');
        tbody.innerHTML = ''; // Limpiar el contenido anterior de la tabla

        // Destruir cualquier instancia previa de DataTables para evitar conflictos
        if ($.fn.DataTable.isDataTable('#dataTable')) {
            $('#dataTable').DataTable().clear().destroy();
        }

        // Llenar la tabla con los datos de allData
        allData.forEach(row => {
            const tr = document.createElement('tr');

            // Formatear la fecha a DD/MM/AAAA
            const formattedDate = row.Fecha ? formatDate(row.Fecha) : '';

            tr.innerHTML = `
                <td><button class="btn-nombre-sucursal" data-bs-target="#modalInfo" data-bs-toggle="modal" data-nombre="${row.NombreSucursal}" data-id="${row.IdSucursal}" style="background-color: #ffffff00; border-color: #ffffff00;">${row.NombreSucursal}</button></td>
                <td>${row.Upc || ''}</td>
                <td>${row.Descripcion || ''}</td>
                <td>${row.Cantidad || ''}</td>
                <td>${row.MontoTotal || ''}</td>
                <td>${row.Proveedor || ''}</td>
                <td>${row.Departamento || ''}</td>
                <td>${row.Categoria || ''}</td>
                <td>${row.SubCategoria || ''}</td>
                <td>${row.UnidadesPorFardo || ''}</td>
                <td>${formattedDate}</td>
            `;
            tbody.appendChild(tr);
        });

        // Inicializar DataTables nuevamente después de cargar los datos
        $('#dataTable').DataTable({
            pageLength: 100, // Configura cuántos registros mostrar por página
            searching: false, // Habilitar la búsqueda
            ordering: true, // Habilitar el ordenamiento de columnas
            lengthChange: false, // Permitir al usuario cambiar la cantidad de registros por página
            language: {
                paginate: {
                    next: 'Siguiente', // Texto del botón de siguiente
                    previous: 'Anterior' // Texto del botón de anterior
                },
                search: "Buscar:", // Texto del campo de búsqueda
                lengthMenu: "Mostrar _MENU_ registros por página",
                info: "Mostrando _START_ a _END_ de _TOTAL_ registros",
                infoEmpty: "Mostrando 0 a 0 de 0 registros",
                infoFiltered: "(filtrado de _MAX_ registros totales)"
            }
        });
    }

    // Delegar el evento click a un elemento contenedor (tbody)
    document.querySelector('table tbody').addEventListener('click', function (e) {
        if (e.target && e.target.matches('.btn-nombre-sucursal')) {
            const button = e.target;
            const id = button.getAttribute('data-id');
            const nombre = button.getAttribute('data-nombre');
            document.getElementById('tituloSucursal').innerText = nombre;
            document.getElementById('tituloSucursal').value = id;
            let nombreSucursal = document.getElementById('tituloSucursal').value;

            fetch(`/backendCategorias/detalleSucursal?nombre=${encodeURIComponent(nombreSucursal)}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('No se encontró la sucursal.');
                }
                return response.json();
            })
            .then(data => {
                // Verificar si no hay datos relevantes
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
                        document.getElementById('imagenSucursal').src = ''; // O una imagen predeterminada
                    }

                    document.getElementById('ubicacionLink').href = data.Ubicacion || '#'; // Enlace de ubicación o vacío si no existe
                }
            })
            .catch(error => {
                console.error('Error:', error);
                document.getElementById('viewInfo').style.display = 'none';
                document.getElementById('viewInfoError').style.display = 'block';
            });
        }
    });


    // Funcion para llenar los selectores con la informacion en la tabla 
    function llenarSelectores(data) {
        const sucursales = new Set();
        const proveedores = new Set();
        const departamentos = new Set();
        const categorias = new Set();
        const subcategorias = new Set();
    
        // Agregar los datos a los conjuntos
        data.forEach(row => {
            if (row.NombreSucursal) sucursales.add(row.NombreSucursal);
            if (row.Proveedor) proveedores.add(row.Proveedor);
            if (row.Departamento) departamentos.add(row.Departamento);
            if (row.Categoria) categorias.add(row.Categoria);
            if (row.SubCategoria) subcategorias.add(row.SubCategoria);
        });
    
        const sucursalSelect = document.getElementById('sucursalFiltro');
        const proveedorSelect = document.getElementById('proveedorFiltro');
        const departamentoSelect = document.getElementById('departamentoFiltro');
        const categoriaSelect = document.getElementById('categoriaFiltro');
        const subcategoriaSelect = document.getElementById('subcategoriaFiltro');
    
        sucursalSelect.innerHTML = '';  
        proveedorSelect.innerHTML = '';  
        departamentoSelect.innerHTML = '';  
        categoriaSelect.innerHTML = '';
        subcategoriaSelect.innerHTML = '';
    
        // Agregar las opciones predeterminadas
        const optionBlankSucursal = document.createElement('option');
        optionBlankSucursal.value = '';
        optionBlankSucursal.textContent = 'Todas las Sucursales';
        sucursalSelect.appendChild(optionBlankSucursal);
    
        const optionBlankProveedor = document.createElement('option');
        optionBlankProveedor.value = '';
        optionBlankProveedor.textContent = 'Todos los Proveedores';
        proveedorSelect.appendChild(optionBlankProveedor);
    
        const optionBlankDepartamento = document.createElement('option');
        optionBlankDepartamento.value = '';
        optionBlankDepartamento.textContent = 'Todos los Departamentos';
        departamentoSelect.appendChild(optionBlankDepartamento);
    
        const optionBlankCategoria = document.createElement('option');
        optionBlankCategoria.value = '';
        optionBlankCategoria.textContent = 'Todas las Categorías';
        categoriaSelect.appendChild(optionBlankCategoria);
    
        const optionBlankSubcategoria = document.createElement('option');
        optionBlankSubcategoria.value = '';
        optionBlankSubcategoria.textContent = 'Todas las Subcategorías';
        subcategoriaSelect.appendChild(optionBlankSubcategoria);
    
        // Llenar los selectores con los valores únicos
        sucursales.forEach(sucursal => {
            const option = document.createElement('option');
            option.value = sucursal;
            option.textContent = sucursal;
            sucursalSelect.appendChild(option);
        });
    
        proveedores.forEach(proveedor => {
            const option = document.createElement('option');
            option.value = proveedor;
            option.textContent = proveedor;
            proveedorSelect.appendChild(option);
        });
    
        departamentos.forEach(departamento => {
            const option = document.createElement('option');
            option.value = departamento;
            option.textContent = departamento;
            departamentoSelect.appendChild(option);
        });
    
        categorias.forEach(categoria => {
            const option = document.createElement('option');
            option.value = categoria;
            option.textContent = categoria;
            categoriaSelect.appendChild(option);
        });
    
        subcategorias.forEach(subcategoria => {
            const option = document.createElement('option');
            option.value = subcategoria;
            option.textContent = subcategoria;
            subcategoriaSelect.appendChild(option);
        });
    }

    function verButtonFiltro() {
        // No limpiar el input de búsqueda
        const searchTerm = document.getElementById('descProduc').value.toLowerCase();
    
        // Verificar si hay algún filtro aplicado para mostrar el botón "quitar filtro"
        const sucursal = document.getElementById('sucursalFiltro').value;
        const proveedor = document.getElementById('proveedorFiltro').value;
        const departamento = document.getElementById('departamentoFiltro').value;
        const categoria = document.getElementById('categoriaFiltro').value;
        const subcategoria = document.getElementById('subcategoriaFiltro').value;
    
        if (sucursal || proveedor || departamento || categoria || subcategoria || searchTerm) {
            document.getElementById('quitarfiltro').style.display = 'block';
            document.getElementById('viewBE').style.display = 'block';
            document.getElementById('exportar').style.display = 'none';
        } else {
            document.getElementById('quitarfiltro').style.display = 'none';
            document.getElementById('viewBE').style.display = 'none';
            document.getElementById('exportar').style.display = 'block';
            updateTable(); // Actualizar la tabla con todos los datos si no hay filtros
        }
    
        // Aplicar los filtros combinando los selectores y la búsqueda por descripción
        graficaFiltro();
        
        showSpinner();
        updateFilteredTable();
        hideSpinner();
    }

    document.getElementById('sucursalFiltro').addEventListener('change', function() {
        document.getElementById('departamentoFiltro').selectedIndex = 0;
        document.getElementById('categoriaFiltro').selectedIndex = 0;
        document.getElementById('subcategoriaFiltro').selectedIndex = 0;
        document.getElementById('proveedorFiltro').selectedIndex = 0;
        verButtonFiltro();
        graficaFiltro();
    });

    document.getElementById('proveedorFiltro').addEventListener('change', function() {
        document.getElementById('departamentoFiltro').selectedIndex = 0;
        document.getElementById('categoriaFiltro').selectedIndex = 0;
        document.getElementById('subcategoriaFiltro').selectedIndex = 0;
        verButtonFiltro();
        graficaFiltro();
    });

    document.getElementById('departamentoFiltro').addEventListener('change', function() {
        document.getElementById('categoriaFiltro').selectedIndex = 0;
        document.getElementById('subcategoriaFiltro').selectedIndex = 0;
        verButtonFiltro();
        graficaFiltro();
    });

    document.getElementById('categoriaFiltro').addEventListener('change', function() {
        document.getElementById('subcategoriaFiltro').selectedIndex = 0;
        verButtonFiltro();
        graficaFiltro();
    });

    document.getElementById('subcategoriaFiltro').addEventListener('change', function() {
        verButtonFiltro();
        graficaFiltro();
    });

    let filteredData = []; // Variable para almacenar los datos filtrados

    function graficaFiltro() {
        // Obtener los valores de los selectores y el término de búsqueda
        const sucursal = document.getElementById('sucursalFiltro').value;
        const proveedor = document.getElementById('proveedorFiltro').value;
        const departamento = document.getElementById('departamentoFiltro').value;
        const categoria = document.getElementById('categoriaFiltro').value;
        const subcategoria = document.getElementById('subcategoriaFiltro').value;
        const searchTerm = document.getElementById('descProduc').value.toLowerCase();
    
        // Filtrar los datos
        filteredData = allData.filter(item => {
            const matchesFilters = 
                (!sucursal || item.NombreSucursal === sucursal) &&
                (!proveedor || item.Proveedor === proveedor) &&
                (!departamento || item.Departamento === departamento) &&
                (!categoria || item.Categoria === categoria) &&
                (!subcategoria || item.SubCategoria === subcategoria);
    
            const matchesSearchTerm = searchTerm.split(/\s+/).every(word => 
                item.Descripcion ? item.Descripcion.toLowerCase().includes(word) : false
            );
    
            return matchesFilters && matchesSearchTerm;
        });
    
        // Mostrar los datos filtrados en la tabla y actualizar los gráficos
        if (filteredData.length === 0) {
            showAlert('Información', 'No se encontraron datos con los filtros seleccionados.', 'info');
        } else {
            mostrarDatosFiltrados(filteredData);
    
            const totales = calcularTotales(filteredData);
            sucursalTotales = totales.sucursalTotales;
            proveedorTotales = totales.proveedorTotales;
            departamentoTotales = totales.departamentoTotales;
            categoriaTotales = totales.categoriaTotales;
            subcategoriaTotales = totales.subcategoriaTotales;
    
            generarGraficas();
        }
        // Actualizar los selectores con los datos filtrados
        actualizarSelectoresConDatosFiltrados(filteredData, sucursal, proveedor, departamento, categoria, subcategoria);
    }

    function graficaFiltro1() {
        generarGraficas();
    }
    // Exponer la función graficaFiltro globalmente
    window.graficaFiltro = graficaFiltro1;

    function actualizarSelectoresConDatosFiltrados(datos, proveedorSeleccionado, sucursalSeleccionada, departamentoSeleccionado, categoriaSeleccionada, subcategoriaSeleccionada) {
        const sucursales = new Set();
        const proveedores = new Set();
        const departamentos = new Set();
        const categorias = new Set();
        const subcategorias = new Set();
    
        // Agregar los datos a los conjuntos basados en los datos filtrados
        datos.forEach(row => {
            if (row.NombreSucursal) sucursales.add(row.NombreSucursal);
            if (row.Proveedor) proveedores.add(row.Proveedor);
            if (row.Departamento) departamentos.add(row.Departamento);
            if (row.Categoria) categorias.add(row.Categoria);
            if (row.SubCategoria) subcategorias.add(row.SubCategoria);
        });
    
        // Actualizar solo los selectores dependientes
        if (!sucursalSeleccionada) actualizarSelector(document.getElementById('sucursalFiltro'), sucursales, 'Todas las Sucursales');
        if (!proveedorSeleccionado) actualizarSelector(document.getElementById('proveedorFiltro'), proveedores, 'Todos los Proveedores');
        if (!departamentoSeleccionado) actualizarSelector(document.getElementById('departamentoFiltro'), departamentos, 'Todos los Departamentos');
        if (!categoriaSeleccionada) actualizarSelector(document.getElementById('categoriaFiltro'), categorias, 'Todas las Categorías');
        if (!subcategoriaSeleccionada) actualizarSelector(document.getElementById('subcategoriaFiltro'), subcategorias, 'Todas las Subcategorías');
    }

    function actualizarSelector(selectElement, dataSet, defaultOptionText) {
        const currentSelection = selectElement.value;
    
        selectElement.innerHTML = ''; // Limpiar las opciones actuales
    
        // Agregar la opción predeterminada
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = defaultOptionText;
        selectElement.appendChild(defaultOption);
    
        // Agregar las opciones filtradas
        dataSet.forEach(item => {
            const option = document.createElement('option');
            option.value = item;
            option.textContent = item;
            selectElement.appendChild(option);
        });
    
        // Restaurar la selección anterior si sigue siendo válida
        if (dataSet.has(currentSelection)) {
            selectElement.value = currentSelection;
        }
    }

    document.getElementById('descProduc').addEventListener('input', function() {
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
    
        // Filtrar los datos según el término de búsqueda
        filtrarPorDescripcion(searchTerm);
    });

    function filtrarPorDescripcion(searchTerm) {
        const sucursal = document.getElementById('sucursalFiltro').value;
        const proveedor = document.getElementById('proveedorFiltro').value;
        const departamento = document.getElementById('departamentoFiltro').value;
        const categoria = document.getElementById('categoriaFiltro').value;
        const subcategoria = document.getElementById('subcategoriaFiltro').value;
    
        const searchWords = searchTerm.trim().toLowerCase().split(/\s+/);  // Dividir en palabras/frases por espacio
        filteredData = [];
        let i = 0;
    
        function processChunk() {
            const chunkSize = 1000; // Filtrar en fragmentos de 1000 registros a la vez
            const end = Math.min(i + chunkSize, allData.length);
    
            for (; i < end; i++) {
                const item = allData[i];
                const descripcion = item.Descripcion ? item.Descripcion.toLowerCase() : ''; // Verifica si la descripción no es null
    
                // Verificar si todas las palabras/frases buscadas se encuentran en la descripción
                const matchesDescription = searchWords.every(word => descripcion.includes(word));
    
                // Verificar si el elemento cumple con los filtros aplicados
                const matchesFilters = 
                    (!sucursal || item.NombreSucursal === sucursal) &&
                    (!proveedor || item.Proveedor === proveedor) &&
                    (!departamento || item.Departamento === departamento) &&
                    (!categoria || item.Categoria === categoria) &&
                    (!subcategoria || item.SubCategoria === subcategoria);
    
                if (matchesDescription && matchesFilters) {
                    filteredData.push(item);
                }
            }
    
            if (i < allData.length) {
                requestAnimationFrame(processChunk); // Continúa en el siguiente frame
            } else {
                if (filteredData.length === 0) {
                    showAlert('Información', 'No se encontraron productos que coincidan con la búsqueda.', 'info');
                } else {
                    mostrarDatosFiltrados(filteredData);
                    showSpinner();
                    updateFilteredTable();
                    hideSpinner();

                    const totales = calcularTotales(filteredData);
                    sucursalTotales = totales.sucursalTotales;
                    proveedorTotales = totales.proveedorTotales;
                    departamentoTotales = totales.departamentoTotales;
                    categoriaTotales = totales.categoriaTotales;
                    subcategoriaTotales = totales.subcategoriaTotales;
    
                    // Actualizar los selectores en base a los datos filtrados
                    actualizarSelectoresConDatosFiltrados(filteredData, sucursal, departamento, categoria, subcategoria);
    
                    generarGraficas();
                }
            }
        }
        requestAnimationFrame(processChunk); // Inicia el proceso
    }
    
    // Actualiza la paginacion en base a datos filtrados
    function mostrarDatosFiltrados(datos) {
        filteredData = datos; // Almacenar los datos filtrados
    }

    // Función para actualizar la tabla con la información filtrada
    function updateFilteredTable() {
        // Destruir cualquier instancia previa de DataTables para evitar conflictos
        if ($.fn.DataTable.isDataTable('#dataTable')) {
            $('#dataTable').DataTable().clear().destroy();
        }

        const tbody = document.querySelector('#dataTable tbody');
        tbody.innerHTML = ''; // Limpiar las filas existentes

        // Llenar la tabla con los datos de filteredData
        filteredData.forEach(row => {
            const tr = document.createElement('tr');

            // Formatear la fecha a DD/MM/AAAA
            const formattedDate = row.Fecha ? formatDate(row.Fecha) : '';

            tr.innerHTML = `
                <td><button class="btn-nombre-sucursal" data-bs-target="#modalInfo" data-bs-toggle="modal" data-nombre="${row.NombreSucursal}" data-id="${row.IdSucursal}" style="background-color: #ffffff00; border-color: #ffffff00;">${row.NombreSucursal}</button></td>
                <td>${row.Upc || ''}</td>
                <td>${row.Descripcion || ''}</td>
                <td>${row.Cantidad || ''}</td>
                <td>${row.MontoTotal || ''}</td>
                <td>${row.Proveedor || ''}</td>
                <td>${row.Departamento || ''}</td>
                <td>${row.Categoria || ''}</td>
                <td>${row.SubCategoria || ''}</td>
                <td>${row.UnidadesPorFardo || ''}</td>
                <td>${formattedDate}</td>
            `;
            tbody.appendChild(tr);
        });

        // Inicializar DataTables nuevamente después de cargar los datos
        $('#dataTable').DataTable({
            pageLength: 100, // Configura cuántos registros mostrar por página
            searching: false, // Habilitar la búsqueda
            ordering: true, // Habilitar el ordenamiento de columnas
            lengthChange: false, // Permitir al usuario cambiar la cantidad de registros por página
            language: {
                paginate: {
                    next: 'Siguiente', // Texto del botón de siguiente
                    previous: 'Anterior' // Texto del botón de anterior
                },
                search: "Buscar:", // Texto del campo de búsqueda
                lengthMenu: "Mostrar _MENU_ registros por página",
                info: "Mostrando _START_ a _END_ de _TOTAL_ registros",
                infoEmpty: "Mostrando 0 a 0 de 0 registros",
                infoFiltered: "(filtrado de _MAX_ registros totales)"
            }
        });
    }

    // Delegar el evento click para los botones de nombre de sucursal
    document.querySelector('#dataTable tbody').addEventListener('click', function (e) {
        if (e.target && e.target.matches('.btn-nombre-sucursal')) {
            const button = e.target;
            const id = button.getAttribute('data-id');
            const nombre = button.getAttribute('data-nombre');
            document.getElementById('tituloSucursal').innerText = nombre;
            document.getElementById('tituloSucursal').value = id;
            let nombreSucursal = document.getElementById('tituloSucursal').value;

            fetch(`/backendCategorias/detalleSucursal?nombre=${encodeURIComponent(nombreSucursal)}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('No se encontró la sucursal.');
                }
                return response.json();
            })
            .then(data => {
                // Verificar si no hay datos relevantes
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
                        document.getElementById('imagenSucursal').src = ''; // O una imagen predeterminada
                    }

                    document.getElementById('ubicacionLink').href = data.Ubicacion || '#'; // Enlace de ubicación o vacío si no existe
                }
            })
            .catch(error => {
                console.error('Error:', error);
                document.getElementById('viewInfo').style.display = 'none';
                document.getElementById('viewInfoError').style.display = 'block';
            });
        }
    });

    // Definir las variables de totales globalmente
    let sucursalTotales = {};
    let proveedorTotales = {};
    let departamentoTotales = {};
    let categoriaTotales = {};
    let subcategoriaTotales = {};

    function calcularTotales(datos) {
        const sucursalTotales = {};
        const proveedorTotales = {};
        const departamentoTotales = {};
        const categoriaTotales = {};
        const subcategoriaTotales = {};
    
        datos.forEach(item => {
            if (item.NombreSucursal) {
                sucursalTotales[item.NombreSucursal] = (sucursalTotales[item.NombreSucursal] || 0) + item.MontoTotal;
            }
            if (item.Proveedor) {
                proveedorTotales[item.Proveedor] = (proveedorTotales[item.Proveedor] || 0) + item.MontoTotal;
            }
            if (item.Departamento) {
                departamentoTotales[item.Departamento] = (departamentoTotales[item.Departamento] || 0) + item.MontoTotal;
            }
            if (item.Categoria) {
                categoriaTotales[item.Categoria] = (categoriaTotales[item.Categoria] || 0) + item.MontoTotal;
            }
            if (item.SubCategoria) {
                subcategoriaTotales[item.SubCategoria] = (subcategoriaTotales[item.SubCategoria] || 0) + item.MontoTotal;
            }
        });
    
        document.getElementById('totalporSucursal').innerText = `Total por Sucursal: ${JSON.stringify(sucursalTotales)}`;
        document.getElementById('totalporProveedor').innerText = `Total por Proveedor: ${JSON.stringify(proveedorTotales)}`;
        document.getElementById('totalporDepartamento').innerText = `Total por Departamento: ${JSON.stringify(departamentoTotales)}`;
        document.getElementById('totalporCategoria').innerText = `Total por Categoria: ${JSON.stringify(categoriaTotales)}`;
        document.getElementById('totalporSubCategoria').innerText = `Total por SubCategoria: ${JSON.stringify(subcategoriaTotales)}`;
    
        return { sucursalTotales, proveedorTotales, departamentoTotales, categoriaTotales, subcategoriaTotales };
    }

    // Obtiene el tema actual para despues realizar las graficas en base al tema actual
    function obtenerTemaActual() {
        const temaActual = document.getElementById('themeStylesheet').getAttribute('href');
        return temaActual.includes('claro') ? 'claro' : 'oscuro';
    }

    // Genera las graficas en base a la informacion de la tabla
    function generarGraficas() {
        const temaActual = obtenerTemaActual();
        const crearGraficoPastel = temaActual === 'claro' ? crearGraficoDePastelClaro : crearGraficoDePastelOscuro;
        const crearGraficoBar = temaActual === 'claro' ? crearGraficoBarClaro : crearGraficoBarOscuro;
    
        google.charts.load('current', {'packages':['corechart']});
        google.charts.setOnLoadCallback(() => {
            const totalSucursal = Object.values(sucursalTotales).reduce((a, b) => a + b, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const totalProveedor = Object.values(proveedorTotales).reduce((a, b) => a + b, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const totalDepartamento = Object.values(departamentoTotales).reduce((a, b) => a + b, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const totalCategoria = Object.values(categoriaTotales).reduce((a, b) => a + b, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const totalSubcategoria = Object.values(subcategoriaTotales).reduce((a, b) => a + b, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
            crearGraficoBar('ventasPorSucursal', Object.keys(sucursalTotales), Object.values(sucursalTotales), `Gráfica por Sucursal - Ventas Totales: Q.${totalSucursal}`);
            crearGraficoPastel('ventasPorProveedor', Object.keys(proveedorTotales), Object.values(proveedorTotales), `Gráfica por Proveedor - Ventas Totales: Q.${totalProveedor}`);
            crearGraficoPastel('ventasPorDepartamento', Object.keys(departamentoTotales), Object.values(departamentoTotales), `Gráfica por Departamentos - Ventas Totales: Q.${totalDepartamento}`);
            crearGraficoPastel('ventasPorCategoria', Object.keys(categoriaTotales), Object.values(categoriaTotales), `Gráfica por Categorías - Ventas Totales: Q.${totalCategoria}`);
            crearGraficoBar('ventasPorSubcategoria', Object.keys(subcategoriaTotales), Object.values(subcategoriaTotales), `Gráfica por SubCategorías - Ventas Totales: Q.${totalSubcategoria}`);
        });
    }
    
    // Graficos claros
    function crearGraficoDePastelClaro(elementId, labels, data, titulo, textColor = 'black', textColor1 = 'black') {
        const total = data.reduce((sum, value) => sum + value, 0);

        // Ordenar los datos de mayor a menor
        const sortedData = data.map((value, index) => ({ label: labels[index], value }))
            .sort((a, b) => b.value - a.value);  // Ordenar de mayor a menor

        const sortedLabels = sortedData.map(item => item.label);  // Etiquetas ordenadas
        const sortedValues = sortedData.map(item => item.value);  // Valores ordenados

        const chartData = [['Etiqueta', 'Ventas Totales']];
        sortedLabels.forEach((label, index) => {
            const value = sortedValues[index];
            const percentage = (value / total * 100).toFixed(2);
            const formattedValue = value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            chartData.push([`${label}: \nQ.${formattedValue} (${percentage}%)`, value]);
        });
    
        const dataTable = google.visualization.arrayToDataTable(chartData);
    
        const options = {
            title: titulo,
            backgroundColor: 'transparent',
            width: 700,
            height: 500,
            pieSliceText: 'none',
            tooltip: { isHtml: true, textStyle: { color: textColor } },
            legend: {
                position: 'right',
                textStyle: {
                    fontSize: 12,
                    color: textColor1,
                    textAlign: 'left' // Asegura que el texto se alinee a la izquierda si es necesario
                }
            },
            is3D: true,
            titleTextStyle: {
                color: textColor1
            },
            slices: {
                [chartData.length - 1]: { textStyle: { color: 'none' } } // Oculta la leyenda de "Other"
            }
        };
    
        const formatter = new google.visualization.NumberFormat({
            prefix: 'Q.',
            groupingSymbol: ',',  // Coma para separar miles
            fractionDigits: 2,   // Dos decimales
            decimalSymbol: '.'   // Punto como separador decimal
        });
        formatter.format(dataTable, 1);
    
        const chart = new google.visualization.PieChart(document.getElementById(elementId));
    
        // Custom Tooltip
        google.visualization.events.addListener(chart, 'onmouseover', function(e) {
            const tooltipContent = `
                <div style="font-size: 14px; line-height: 1.2; color: ${textColor};">
                <br>
                    <strong>${labels[e.row]}</strong><br>
                    Ventas Totales: <strong>Q.${data[e.row].toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${(data[e.row] / total * 100).toFixed(2)}%)</strong>
                </div>`;
            const tooltip = document.getElementsByClassName('google-visualization-tooltip')[0];
            if (tooltip) {
                tooltip.innerHTML = tooltipContent;
                tooltip.style.padding = '5px';
            }
        });
    
        google.visualization.events.addListener(chart, 'onmouseout', function() {
            const tooltip = document.getElementsByClassName('google-visualization-tooltip')[0];
            if (tooltip) {
                tooltip.innerHTML = '';
            }
        });
    
        chart.draw(dataTable, options);
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
                `${label}<br>Ventas Totales: Q.${sortedValues[index].toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${(sortedValues[index] / total * 100).toFixed(2)}%)`
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
                title: `Ventas Totales: Q.${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
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
    function crearGraficoDePastelOscuro(elementId, labels, data, titulo, textColor = 'black', textColor1 = 'white'){
        const total = data.reduce((sum, value) => sum + value, 0);

        // Ordenar los datos de mayor a menor
        const sortedData = data.map((value, index) => ({ label: labels[index], value }))
            .sort((a, b) => b.value - a.value);  // Ordenar de mayor a menor

        const sortedLabels = sortedData.map(item => item.label);  // Etiquetas ordenadas
        const sortedValues = sortedData.map(item => item.value);  // Valores ordenados

        const chartData = [['Etiqueta', 'Ventas Totales']];
        sortedLabels.forEach((label, index) => {
            const value = sortedValues[index];
            const percentage = (value / total * 100).toFixed(2);
            const formattedValue = value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            chartData.push([`${label}: \nQ.${formattedValue} (${percentage}%)`, value]);
        });
    
        const dataTable = google.visualization.arrayToDataTable(chartData);
    
        const options = {
            title: titulo,
            backgroundColor: 'transparent',
            width: 700,
            height: 500,
            pieSliceText: 'none',
            tooltip: { isHtml: true, textStyle: { color: textColor } },
            legend: {
                position: 'right',
                textStyle: {
                    fontSize: 12,
                    color: textColor1,
                    textAlign: 'left' // Asegura que el texto se alinee a la izquierda si es necesario
                }
            },
            is3D: true,
            titleTextStyle: {
                color: textColor1
            },
            slices: {
                [chartData.length - 1]: { textStyle: { color: 'none' } } // Oculta la leyenda de "Other"
            }
        };
    
        const formatter = new google.visualization.NumberFormat({
            prefix: 'Q.',
            groupingSymbol: ',',  // Coma para separar miles
            fractionDigits: 2,   // Dos decimales
            decimalSymbol: '.'   // Punto como separador decimal
        });
        formatter.format(dataTable, 1);
    
        const chart = new google.visualization.PieChart(document.getElementById(elementId));
    
        // Custom Tooltip
        google.visualization.events.addListener(chart, 'onmouseover', function(e) {
            const tooltipContent = `
                <div style="font-size: 14px; line-height: 1.2; color: ${textColor};">
                <br>
                    <strong>${labels[e.row]}</strong><br>
                    Ventas Totales: <strong>Q.${data[e.row].toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${(data[e.row] / total * 100).toFixed(2)}%)</strong>
                </div>`;
            const tooltip = document.getElementsByClassName('google-visualization-tooltip')[0];
            if (tooltip) {
                tooltip.innerHTML = tooltipContent;
                tooltip.style.padding = '5px';
            }
        });
    
        google.visualization.events.addListener(chart, 'onmouseout', function() {
            const tooltip = document.getElementsByClassName('google-visualization-tooltip')[0];
            if (tooltip) {
                tooltip.innerHTML = '';
            }
        });
    
        chart.draw(dataTable, options);
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
                `${label}<br>Ventas Totales: Q.${sortedValues[index].toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${(sortedValues[index] / total * 100).toFixed(2)}%)`
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
                title: `Ventas Totales: Q.${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
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

    // Función para exportar los datos de la variable allData
    document.getElementById('exportar').addEventListener('click', function() {
        let inicio = document.getElementById('FechaInicio').value;
        let fin = document.getElementById('FechaFinal').value;
        exportToCSV(allData, 'ReporteCategoriasGeneral '+inicio+' / '+fin+'.csv');
    });

    document.getElementById('export').addEventListener('click', function() {
        let inicio = document.getElementById('FechaInicio').value;
        let fin = document.getElementById('FechaFinal').value;
        exportToCSV(allData, 'ReporteCategoriasGeneral '+inicio+' / '+fin+'.csv');
    });

    // Funcion para exportar los datos de la variable filteredData
    document.getElementById('exportFilter').addEventListener('click', function() {
        let inicio = document.getElementById('FechaInicio').value;
        let fin = document.getElementById('FechaFinal').value;
        exportToCSV(filteredData, 'ReporteCategoriasFiltrado '+inicio+' / '+fin+'.csv');
    });

    // Funcion para manejar el formato de la informacion para exportar (.csv) 
    function exportToCSV(data, filename) {
        const csvRows = [];
        const headers = ["NombreSucursal", "Upc", "Descripcion", "Cantidad", "MontoTotal", "Departamento", "Categoria", "SubCategoria", "UnidadesPorFardo", "Fecha"];
        csvRows.push(headers.join(','));

        data.forEach(row => {
            const values = [
                row.NombreSucursal || '',
                row.Upc || '',
                row.Descripcion || '',
                row.Cantidad || '',
                row.MontoTotal || '',
                row.Departamento || '',
                row.Categoria || '',
                row.SubCategoria || '',
                row.UnidadesPorFardo || '',
                row.Fecha || ''
            ];
            csvRows.push(values.join(','));
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', filename);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    document.getElementById('limpiar').addEventListener('click', function (e) {
        const tbody = document.querySelector('table tbody');
        tbody.innerHTML = ''; // Limpiar la tabla

        document.getElementById('exportar').style.display = 'none';
        document.getElementById('viewBE').style.display = 'none';
        document.getElementById('viewSP').style.display = 'none';
        document.getElementById('graficas').style.display = 'none';
        document.getElementById('tabla').style.display = 'none';
        document.getElementById('limpiar').style.display = 'none';
        document.getElementById('quitarfiltro').style.display = 'none';
        document.getElementById('filtroSelectores').style.display = 'none';
        document.getElementById('graficoContainer').style.display = 'none';

        document.getElementById('viewSucursal').style.display = 'block';
        document.getElementById('viewCategoria').style.display = 'block';
        document.getElementById('viewFechainicio').style.display = 'block';
        document.getElementById('viewFechafin').style.display = 'block';
        document.getElementById('viewGenerar').style.display = 'block';
        document.getElementById('viewDataTable').style.display = 'block';

        // Restablecer los selectores a la opción predeterminada
        document.getElementById('sucursalBusqueda').selectedIndex = 0;
        document.getElementById('categoriaBusqueda').selectedIndex = 0;
        document.getElementById('FechaInicio').selectedIndex = today;
        document.getElementById('FechaFinal').selectedIndex = today;

        document.getElementById('descProduc').value = "";
        document.getElementById('sucursalFiltro').selectedIndex = 0;
        document.getElementById('proveedorFiltro').selectedIndex = 0;
        document.getElementById('departamentoFiltro').selectedIndex = 0;
        document.getElementById('categoriaFiltro').selectedIndex = 0;
        document.getElementById('subcategoriaFiltro').selectedIndex = 0;
        
        allData = [];
        filteredData = [];

        // Destruir cualquier instancia previa de DataTables para evitar conflictos
        if ($.fn.DataTable.isDataTable('#dataTable')) {
            $('#dataTable').DataTable().clear().destroy();
        }
    });
});

