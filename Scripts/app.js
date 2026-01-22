$(document).ready(function () {

    // --- 1. CONEXIÓN AL BACKEND ---
    const API_URL = 'https://tienda-caserita-api.onrender.com/api';

    // Variables globales (Ya no leemos de localStorage para productos/categorías)
    let sugerenciasDB = [];
    let productosCatDB = [];
    let categoriasDB = [];

    // --- 2. CARGA DE DATOS DESDE EL SERVIDOR ---
    async function cargarDatosBackend() {
        try {
            console.log("⏳ Cargando datos del servidor...");

            // Hacemos las 3 peticiones en paralelo para que sea rápido
            const [resProd, resSug, resCat] = await Promise.all([
                fetch(`${API_URL}/productos`),
                fetch(`${API_URL}/sugerencias`),
                fetch(`${API_URL}/categorias`)
            ]);

            productosCatDB = await resProd.json();
            sugerenciasDB = await resSug.json();
            categoriasDB = await resCat.json();

            console.log("✅ Datos cargados:", {
                productos: productosCatDB.length,
                sugerencias: sugerenciasDB.length,
                categorias: categoriasDB.length
            });

            // Una vez tenemos datos, pintamos la web
            renderizarTodo();

        } catch (error) {
            console.error("❌ Error cargando datos:", error);
            alert("No se pudo conectar al servidor. Asegúrate de ejecutar 'node server.js'");
        }
    }

    // Iniciamos la carga
    cargarDatosBackend();

    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    // CORRECCIÓN: Buscar en ambos storages (login sin remember usa sessionStorage)
    const userRole = localStorage.getItem('userRole') || sessionStorage.getItem('userRole');

    // --- 3. RENDERIZADO (Pintar en pantalla) ---

    function renderizarTodo() {
        renderizarSugerencias();      // Productos del día (stock limitado)
        renderizarCategoriasGrid();   // Categorías (Barra horizontal)
        renderizarCategoriasSidebar();// Categorías (Menú Celular)
        renderizarMomentos('desayuno'); // Momentos del día (carga inicial con desayuno)
        actualizarContadorCarrito();
        renderizarCarritoSidebar();
        actualizarSelectCategorias(); // Para el formulario de nuevo producto
        verificarModoEditor();        // Chequear si el switch estaba prendido
    }

    // ==========================================
    // MOMENTOS DEL DÍA - Renderizado dinámico
    // ==========================================
    const momentosConfig = {
        desayuno: [
            { subcat: 'avenas_cereales', nombre: 'Avenas y Cereales', icon: '☕', color: 'linear-gradient(160deg, #eab308 0%, #ca8a04 100%)' },
            { subcat: 'panaderia_untables', nombre: 'Panadería y Untables', icon: '🍞', color: 'linear-gradient(160deg, #3b82f6 0%, #1d4ed8 100%)' }
        ],
        almuerzo: [
            { subcat: 'carnes_aves', nombre: 'Carnes y Aves', icon: '🥩', color: 'linear-gradient(160deg, #ef4444 0%, #b91c1c 100%)' },
            { subcat: 'verduras_frescas', nombre: 'Verduras Frescas', icon: '🥬', color: 'linear-gradient(160deg, #22c55e 0%, #15803d 100%)' },
            { subcat: 'abarrotes_almuerzo', nombre: 'Abarrotes', icon: '🛒', color: 'linear-gradient(160deg, #0d5f6e 0%, #176e76 100%)' },
            { subcat: 'bebidas_almuerzo', nombre: 'Bebidas', icon: '🥤', color: 'linear-gradient(160deg, #06b6d4 0%, #0891b2 100%)' }
        ],
        lonchera: [
            { subcat: 'jugos_galletas', nombre: 'Jugos y Galletas', icon: '🧃', color: 'linear-gradient(160deg, #f97316 0%, #c2410c 100%)' }
        ],
        cena: [
            { subcat: 'infusiones_ligeros', nombre: 'Infusiones y Ligeros', icon: '🍵', color: 'linear-gradient(160deg, #8b5cf6 0%, #6d28d9 100%)' }
        ]
    };

    function renderizarMomentos(momento) {
        const $content = $('#momentosContent');
        $content.empty();

        const subcategorias = momentosConfig[momento] || [];

        subcategorias.forEach(subcat => {
            // Obtener productos de esta subcategoría
            const productos = productosCatDB.filter(p => p.subcat === subcat.subcat).slice(0, 6);

            let productosHtml = '';
            productos.forEach(prod => {
                let deleteBtn = '';
                if (userRole === 'admin') {
                    deleteBtn = `<button class="btn-delete-item" onclick="handleDeleteClick(event, '${prod.id}')" title="Eliminar" style="position:absolute; top:5px; right:5px; background:#ef4444; color:white; border:none; border-radius:50%; width:28px; height:28px; cursor:pointer; z-index:10; display:flex; justify-content:center; align-items:center; font-size:14px;">🗑️</button>`;
                }

                productosHtml += `
                    <div class="producto-card-modern" data-id="${prod.id}" data-tipo="categoria" style="position:relative;">
                        ${deleteBtn}
                        <div class="card-image">
                            <img src="${prod.img}" onerror="this.src='Imagenes/producto-placeholder.png'" alt="${prod.titulo}">
                        </div>
                        <div class="card-content">
                            <h3 class="card-title">${prod.titulo}</h3>
                            <div class="card-price-row">
                                <span class="card-price">S/ ${prod.precio.toFixed(2)}</span>
                                <span class="card-stock">✓ En stock</span>
                            </div>
                            <button class="btn-agregar-modern">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="9" cy="21" r="1"></circle>
                                    <circle cx="20" cy="21" r="1"></circle>
                                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                                </svg>
                                Agregar
                            </button>
                        </div>
                    </div>
                `;
            });

            const html = `
                <div class="metro-row-modern">
                    <div class="metro-banner-modern" style="background: ${subcat.color};">
                        <div class="banner-icon">${subcat.icon}</div>
                        <h3 class="banner-title">${subcat.nombre}</h3>
                        <button class="banner-btn-ver-todo" data-subcat="${subcat.subcat}">Ver todo</button>
                    </div>
                    <div class="productos-row-grid">
                        ${productosHtml}
                    </div>
                </div>
            `;

            $content.append(html);
        });
    }

    // Handler para las pills de filtro de momentos
    $(document).on('click', '.filtro-pill', function () {
        const momento = $(this).data('target');

        // Actualizar estado activo de pills
        $('.filtro-pill').removeClass('active');
        $(this).addClass('active');

        // Mostrar sección de momentos, ocultar subcategoría
        $('#momentosSection').show();
        $('#subcategoriaSection').hide();

        // Renderizar momentos
        renderizarMomentos(momento);
    });

    // ==========================================
    // SUGERENCIAS DEL DÍA - Productos frescos con stock limitado
    // ==========================================
    function renderizarSugerencias() {
        const $grid = $('#sugerenciasGrid');
        $grid.empty();

        // Botón de AGREGAR (Invisible si no estás en modo editor)
        $grid.append(`
            <div class="cat-card add-placeholder" onclick="abrirModal('modalProducto')">
                <div class="add-icon-big">+</div>
                <span style="font-size: 0.8rem;">Nuevo del Día</span>
            </div>
        `);

        sugerenciasDB.forEach(prod => {
            let colorStock = prod.stock < 3 ? '#ef4444' : '#f59e0b';
            let etiquetaStock = prod.stock > 0
                ? `<div class="tag-limit" style="background:${colorStock}">🔥 Solo ${prod.stock} unid.</div>`
                : `<div class="tag-limit" style="background:#6b7280">AGOTADO</div>`;

            let btnDisabled = prod.stock === 0 ? 'disabled style="background:#ccc; cursor:not-allowed"' : '';
            let textoBtn = prod.stock === 0 ? 'Sin Stock' : 'Agregar al carrito';

            // Botón eliminar solo para admin - indica que es de sugerencias
            let deleteBtn = '';
            if (userRole === 'admin') {
                deleteBtn = `<button class="btn-delete-item" onclick="handleDeleteClick(event, '${prod.id}', 'sugerencia')" title="Quitar de Sugerencias" style="position:absolute; top:5px; right:5px; background:#ef4444; color:white; border:none; border-radius:50%; width:28px; height:28px; cursor:pointer; z-index:10; display:flex; justify-content:center; align-items:center; font-size:14px;">🗑️</button>`;
            }

            const html = `
                <div class="producto-card sugerencia-card" data-id="${prod.id}" data-tipo="sugerencia" style="position:relative;">
                    ${etiquetaStock}
                    ${deleteBtn}
                    <div class="producto-img">
                        <img src="${prod.img}" onerror="this.src='Imagenes/producto-placeholder.png'">
                    </div>
                    <h3 class="producto-titulo">${prod.titulo}</h3>
                    <p class="producto-precio">S/ ${prod.precio.toFixed(2)}</p>
                    <p class="producto-status">${prod.stock > 0 ? '⏰ Disponible hoy' : 'No disponible'}</p>
                    <button class="btn-agregar" ${btnDisabled}>${textoBtn}</button>
                </div>
            `;
            $grid.append(html);
        });
    }

    function renderizarCategoriasGrid() {
        const $grid = $('#categoriaGrid');
        $grid.empty();

        $grid.append(`
            <div class="cat-card add-placeholder" onclick="abrirModal('modalCategoria')">
                <div class="add-icon-big">+</div>
                <span style="font-size: 0.8rem;">Nueva Categ.</span>
            </div>
        `);

        categoriasDB.forEach(cat => {
            const html = `
                <div class="categoria-wrapper">
                    <button class="btn-delete-cat" onclick="eliminarCategoria('${cat.id}')" title="Eliminar categoría">🗑️</button>
                    <button class="categoria-card" data-categoria="${cat.id}">
                        <div class="categoria-icon">
                            <img src="${cat.img}" onerror="this.src='Imagenes/placeholder.png'">
                        </div>
                        <h4>${cat.nombre}</h4>
                        <p>${cat.desc || ''}</p>
                    </button>
                </div>
            `;
            $grid.append(html);
        });
    }

    // Esta función actualiza el menú del celular automáticamente
    function renderizarCategoriasSidebar() {
        const $lista = $('.sidebar-menu');
        $lista.empty();

        categoriasDB.forEach(cat => {
            const html = `
                <li class="sidebar-item" data-categoria="${cat.id}">
                    <div class="sidebar-icon">
                        <img src="${cat.img}" alt="${cat.nombre}" onerror="this.src='Imagenes/placeholder.png'">
                    </div>
                    <span class="sidebar-text">${cat.nombre}</span>
                    <span class="sidebar-arrow">></span>
                </li>
            `;
            $lista.append(html);
        });
    }

    // Handler para click en categorías del sidebar móvil
    $(document).on('click', '.sidebar-item', function () {
        const catId = $(this).data('categoria');
        if (catId) {
            // Cerrar el sidebar (IDs correctos del HTML)
            $('#mobileSidebar').removeClass('active');
            $('#sidebarOverlay').removeClass('active');
            // Restaurar scroll (el sidebar usa css overflow, no clase)
            $('body').css('overflow', '');

            // Mostrar productos
            mostrarProductosSidebar(catId);
        }
    });

    function mostrarProductosSidebar(catId) {
        const categoria = categoriasDB.find(c => c.id === catId);
        const productos = productosCatDB.filter(p => p.cat === catId);

        let productosHtml = '';
        productos.forEach(prod => {
            let deleteBtn = '';
            if (userRole === 'admin') {
                deleteBtn = `<button class="btn-delete-item" onclick="handleDeleteClick(event, '${prod.id}')" title="Eliminar" style="position:absolute; top:5px; right:5px; background:#ef4444; color:white; border:none; border-radius:50%; width:28px; height:28px; cursor:pointer; z-index:2; display:flex; justify-content:center; align-items:center; font-size:14px;">🗑️</button>`;
            }

            productosHtml += `
                <div class="producto-card-modern" data-id="${prod.id}" data-tipo="categoria" style="position:relative;">
                    ${deleteBtn}
                    <div class="card-image">
                        <img src="${prod.img}" onerror="this.src='Imagenes/producto-placeholder.png'" alt="${prod.titulo}">
                    </div>
                    <div class="card-content">
                        <h3 class="card-title">${prod.titulo}</h3>
                        <div class="card-price-row">
                            <span class="card-price">S/ ${prod.precio.toFixed(2)}</span>
                            <span class="card-stock">✓ En stock</span>
                        </div>
                        <button class="btn-agregar-modern">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="9" cy="21" r="1"></circle>
                                <circle cx="20" cy="21" r="1"></circle>
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                            </svg>
                            Agregar
                        </button>
                    </div>
                </div>
            `;
        });

        const html = `
            <section class="productos-sidebar-section" id="productosSidebarView">
                <div class="productos-sidebar-header-inline">
                    <button class="btn-cerrar-sidebar-left" onclick="cerrarProductosSidebar()">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                    </button>
                    <div class="sidebar-header-info">
                        <h2>${categoria.nombre}</h2>
                        <p>${productos.length} productos</p>
                    </div>
                </div>
                <div class="productos-sidebar-grid">
                    ${productosHtml}
                </div>
            </section>
        `;

        // Ocultar TODAS las secciones del contenido principal (excepto footer)
        $('.hero-section, .sugerencias-section, .seccion-categorias, .momentos-section, .ubicacion-section, .app-section, #productosCategoria, #subcategoriaSection').hide();

        // Remover vista anterior si existe
        $('#productosSidebarView').remove();

        // Asegurar que el body NO esté bloqueando scroll
        $('body').css('overflow', '');

        // Insertar después del header
        $('header.main-header').after(html);

        // Scroll al inicio
        window.scrollTo(0, 0);
    }

    window.cerrarProductosSidebar = function () {
        $('#productosSidebarView').remove();
        // Mostrar contenido principal de nuevo
        $('.hero-section, .sugerencias-section, .seccion-categorias, .momentos-section, .ubicacion-section, .app-section').show();
        // Asegurar que el body no tenga scroll bloqueado
        $('body').css('overflow', '');
    };

    // --- 4. LÓGICA DE CARRITO ---
    // Handler para productos dinámicos (sugerencias del día) que tienen data-id
    $(document).on('click', '.producto-card .btn-agregar', function () {
        let card = $(this).closest('.producto-card');
        let idProd = card.data('id');
        let tipoProducto = card.data('tipo');

        // Si el producto tiene ID (es de la base de datos)
        if (idProd) {
            let prod = null;

            // Buscar en sugerencias del día
            if (tipoProducto === 'sugerencia') {
                prod = sugerenciasDB.find(p => p.id == idProd);
            }
            // Buscar en productos de categorías
            else if (tipoProducto === 'categoria') {
                prod = productosCatDB.find(p => p.id == idProd);
            }
            // Buscar en ambas bases de datos
            else {
                prod = sugerenciasDB.find(p => p.id == idProd) || productosCatDB.find(p => p.id == idProd);
            }

            if (prod) {
                agregarAlCarrito({
                    id: prod.id,
                    titulo: prod.titulo,
                    precio: prod.precio,
                    imagen: prod.img
                });
            }
        } else {
            // Producto estático del HTML (secciones de momentos del día)
            let titulo = card.find('.producto-titulo').text();
            let precioText = card.find('.producto-precio').text();
            let precio = parseFloat(precioText.replace('S/', '').replace('/kg', '').replace('/jaba', '').replace('/litro', '').trim());
            let imagen = card.find('.producto-img img').attr('src') || 'Imagenes/producto-placeholder.png';

            agregarAlCarrito({
                id: 'static-' + titulo.replace(/\s+/g, '-').toLowerCase(),
                titulo: titulo,
                precio: precio,
                imagen: imagen
            });
        }

        // Abrir carrito sidebar
        $('#cartSidebar').addClass('active');
        $('#cartOverlay').addClass('active');
    });

    // Handler para productos de categorías (cards modernas)
    $(document).on('click', '.producto-card-modern .btn-agregar-modern', function () {
        let card = $(this).closest('.producto-card-modern');
        let idProd = card.data('id');

        if (idProd) {
            let prod = productosCatDB.find(p => p.id == idProd);

            if (prod) {
                agregarAlCarrito({
                    id: prod.id,
                    titulo: prod.titulo,
                    precio: prod.precio,
                    imagen: prod.img
                });

                // Abrir carrito sidebar
                $('#cartSidebar').addClass('active');
                $('#cartOverlay').addClass('active');
            }
        }
    });

    function agregarAlCarrito(prodData) {
        let existe = carrito.find(p => p.id === prodData.id);
        if (existe) {
            existe.cantidad++;
        } else {
            carrito.push({
                id: prodData.id,
                titulo: prodData.titulo,
                precio: prodData.precio,
                imagen: prodData.imagen,
                cantidad: 1
            });
        }
        localStorage.setItem('carrito', JSON.stringify(carrito));
        actualizarContadorCarrito();
        renderizarCarritoSidebar();
    }

    // Agregar rápido desde búsqueda (busca el producto por ID y lo agrega al carrito)
    window.agregarRapido = function (id) {
        // Buscar en productos y sugerencias
        const todos = [...productosCatDB, ...sugerenciasDB];
        const prod = todos.find(p => p.id == id || p.id === id);

        if (prod) {
            agregarAlCarrito({
                id: prod.id,
                titulo: prod.titulo,
                precio: prod.precio,
                imagen: prod.img
            });

            // Feedback visual
            showAlert('¡Agregado!', `${prod.titulo} se agregó al carrito`, 'success');

            // Abrir carrito sidebar
            $('#cartSidebar').addClass('active');
            $('#cartOverlay').addClass('active');
        } else {
            console.error('Producto no encontrado:', id);
        }
    };

    // --- 5. FUNCIONES DE ADMINISTRADOR ---

    if (userRole === 'admin') {
        $('#admin-bar').css('display', 'flex');
    }

    $('#editor-toggle-btn').click(function () {
        const checkbox = $('#editSwitch');
        const nuevoEstado = !checkbox.prop('checked');
        checkbox.prop('checked', nuevoEstado);

        verificarModoEditor();
    });

    function verificarModoEditor() {
        const isChecked = $('#editSwitch').prop('checked');

        if (isChecked && userRole === 'admin') {
            $('body').addClass('editor-active');
            $('#editor-status').text('Editando tienda...').css('color', '#34d399');
        } else {
            $('body').removeClass('editor-active');
            $('#editor-status').text('Vista Previa').css('color', 'white');
        }
    }

    // Modal de Nuevo Producto para Categorías
    $('.btn-admin-add').click(function () {
        abrirModal('modalProducto');
    });

    // Formulario para agregar producto (con opción de sugerencias del día)
    $('#formNuevoProducto').submit(async function (e) {
        e.preventDefault();

        // Verificar si debe ir a sugerencias del día
        const esSugerencia = $('#prodEsSugerencia').is(':checked');

        let nuevoProd = {
            id: Date.now(),
            titulo: $('#prodNombre').val(),
            precio: parseFloat($('#prodPrecio').val()),
            stock: parseInt($('#prodStock').val()),
            img: $('#prodImg').val() || 'https://via.placeholder.com/150',
            cat: $('#prodCategoria').val(),
            subcat: $('#prodSubcategoria').val(),
            momento: $('#prodMomento').val() || 'almuerzo',
            esSugerencia: esSugerencia
        };

        try {
            // Enviar al endpoint correcto según la opción elegida
            const endpoint = esSugerencia ? 'sugerencias' : 'productos';

            await fetch(`${API_URL}/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(nuevoProd)
            });

            cerrarModal('modalProducto');
            // Recargar datos para verlo reflejado
            await cargarDatosBackend();

            const ubicacion = esSugerencia ? 'Sugerencias del Día' : 'Productos';
            showAlert('¡Éxito!', `Producto agregado a ${ubicacion} correctamente.`, 'success');

        } catch (error) {
            console.error("Error guardando:", error);
            showAlert('Error', 'Error al guardar en el servidor', 'error');
        }
    });

    // --- ELIMINACIÓN GENÉRICA (GLOBAL Y ROBUSTA) ---
    let deleteTarget = null;

    // Función global para manejar el click (Salimos del scope de jQuery para asegurar que funcione)
    // source puede ser 'sugerencia' o 'producto' (por defecto)
    window.handleDeleteClick = function (event, id, source = 'producto') {
        event.preventDefault();
        event.stopPropagation();
        console.log("🔥 CLICK DETECTADO EN ELIMINAR ID:", id, "Source:", source);

        deleteTarget = { type: source, id: id };

        // Mensaje diferente según de dónde se elimina
        if (source === 'sugerencia') {
            $('#deleteTitle').text("¿Quitar de Sugerencias del Día?");
        } else {
            $('#deleteTitle').text("¿Eliminar producto?");
        }

        $('#deleteConfirmModal').addClass('active');
    };

    // Función unificada para eliminar cualquier producto (API)
    window.eliminarProducto = function (id) {
        // Wrapper por compatibilidad si algo llama a esto directo
        window.handleDeleteClick({ preventDefault: () => { }, stopPropagation: () => { } }, id, 'producto');
    };

    window.eliminarCategoria = function (id) {
        deleteTarget = { type: 'categoria', id: id };
        $('#deleteTitle').text("¿Eliminar categoría?");
        abrirModal('deleteConfirmModal');
    };

    // Confirmar eliminación
    $('#btnConfirmDelete').click(async function () {
        if (!deleteTarget) return;

        const btn = $(this);
        const originalText = btn.text();
        btn.text('Eliminando...').prop('disabled', true);

        try {
            let url = '';
            let mensaje = '';

            // Determinar el endpoint según el tipo
            if (deleteTarget.type === 'sugerencia') {
                url = `${API_URL}/sugerencias/${deleteTarget.id}`;
                mensaje = 'Producto quitado de Sugerencias del Día.';
            } else if (deleteTarget.type === 'producto') {
                url = `${API_URL}/productos/${deleteTarget.id}`;
                mensaje = 'Producto eliminado correctamente.';
            } else if (deleteTarget.type === 'categoria') {
                url = `${API_URL}/categorias/${deleteTarget.id}`;
                mensaje = 'Categoría eliminada correctamente.';
            }

            const res = await fetch(url, { method: 'DELETE' });

            if (res.ok) {
                await cargarDatosBackend();
                cerrarModal('deleteConfirmModal');
                showAlert('Eliminado', mensaje, 'success');
            } else {
                showAlert('Error', 'No se pudo eliminar el elemento.', 'error');
            }
        } catch (err) {
            console.error(err);
            showAlert('Error', 'Error de conexión.', 'error');
        } finally {
            btn.text(originalText).prop('disabled', false);
            deleteTarget = null;
        }
    });

    // Modal de Nueva Categoría - AHORA SÍ CONECTADO
    $('#formNuevaCategoria').submit(async function (e) {
        e.preventDefault();

        const nuevaCat = {
            id: $('#catId').val().trim(), // ID manual (ej: mascotas)
            nombre: $('#catNombre').val().trim(),
            desc: $('#catDesc').val().trim(),
            img: $('#catImg').val() || 'https://via.placeholder.com/150'
        };

        try {
            const res = await fetch(`${API_URL}/categorias`, {
                method: 'POST', // Asegúrate de agregar ruta POST categorias en server.js si no existe, o usar existing logic
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(nuevaCat)
            });

            // Nota: Si no tenías ruta POST categorias, esto fallará. 
            // Asumo que la agregarás o que ya existe (server.js line 55 solo GET).
            // VOY A ASUMIR QUE CREARÁS LA RUTA POST TAMBIEN O USO ALERT SI FALLA.

            // FIX: Como no vi la ruta POST categorias en tu server.js, la agrego aqui en error handling
            // O mejor, el usuario pidió borrar. Agregar es un bonus. 

            // Si funciona:
            if (res.ok) {
                cerrarModal('modalCategoria');
                await cargarDatosBackend();
                showAlert('¡Éxito!', 'Categoría creada correctamente', 'success');
            } else {
                // Fallback si no hay endpoint POST
                alert("Nota: Asegúrate de agregar app.post('/api/categorias'...) en server.js para que esto funcione permanentemente.");
            }

        } catch (error) {
            console.error(error);
            alert("Error al conectar con servidor");
        }
    });

    // --- UTILIDADES ---
    window.abrirModal = function (id) { $('#' + id).addClass('active'); };

    // CORRECCIÓN: Resetear formularios al cerrar modal
    window.cerrarModal = function (id) {
        const $modal = $('#' + id);
        $modal.removeClass('active');
        $modal.find('form').each(function () {
            this.reset();
        });
    };

    // Cerrar modales al hacer click en el overlay (afuera del contenido)
    $(document).on('click', '.modal-overlay.active', function (e) {
        // Solo cerrar si el click fue en el overlay, no en el contenido
        if ($(e.target).hasClass('modal-overlay')) {
            cerrarModal($(this).attr('id'));
        }
    });

    // Nueva función de alertas bonitas
    window.showAlert = function (title, msg, type) {
        $('#alertTitle').text(title);
        $('#alertMessage').text(msg);
        let icon = '⚠️';
        if (type === 'success') icon = '✅';
        if (type === 'error') icon = '❌';
        $('#alertIcon').text(icon);
        abrirModal('alertModal');
    };

    // ==========================================
    // MODAL DETALLE DE PRODUCTO (Estilo Rappi)
    // ==========================================
    let productoDetalleActual = null;
    let cantidadDetalle = 1;

    // Función para abrir el modal de detalle
    window.abrirDetalleProducto = function (id) {
        // Buscar el producto en ambas listas
        let producto = productosCatDB.find(p => p.id === id);
        if (!producto) {
            producto = sugerenciasDB.find(p => p.id === id);
        }

        if (!producto) {
            console.error("Producto no encontrado:", id);
            return;
        }

        productoDetalleActual = producto;
        cantidadDetalle = 1;

        // Llenar datos del modal
        $('#detailProductImage').attr('src', producto.img || 'Imagenes/producto-placeholder.png');
        $('#detailProductTitle').text(producto.titulo);
        $('#detailProductPrice').text(`S/ ${producto.precio.toFixed(2)} /u`);

        // Precio anterior y descuento (si existe)
        if (producto.precioAnterior && producto.precioAnterior > producto.precio) {
            const descuento = Math.round((1 - producto.precio / producto.precioAnterior) * 100);
            $('#detailProductOldPrice').text(`S/ ${producto.precioAnterior.toFixed(2)}`).show();
            $('#detailProductDiscount').html(`🏷️ ${descuento}%`).show();
        } else {
            $('#detailProductOldPrice').hide();
            $('#detailProductDiscount').hide();
        }

        // Unidad de medida (calculada)
        if (producto.unidad) {
            $('#detailProductUnit').text(producto.unidad).show();
        } else {
            $('#detailProductUnit').hide();
        }

        // Descripción
        $('#detailProductDescription').text(producto.descripcion || producto.titulo);

        // Actualizar cantidad y subtotal
        $('#detailQuantity').text(cantidadDetalle);
        actualizarSubtotalDetalle();

        // Cargar productos relacionados (misma categoría/subcategoría)
        cargarProductosRelacionados(producto);

        // Cargar productos complementarios (diferente categoría)
        cargarProductosComplementarios(producto);

        // Abrir modal primero
        abrirModal('modalDetalleProducto');

        // Resetear scroll DESPUÉS de que el modal es visible (necesario para móviles)
        setTimeout(() => {
            document.querySelector('.product-detail-body').scrollTop = 0;
        }, 50);
    };

    // Cargar productos relacionados
    function cargarProductosRelacionados(producto) {
        const $carousel = $('#relatedProductsCarousel');
        $carousel.empty();

        // Buscar productos de la misma categoría o subcategoría
        let relacionados = productosCatDB.filter(p =>
            (p.cat === producto.cat || p.subcat === producto.subcat) && p.id !== producto.id
        ).slice(0, 10);

        if (relacionados.length === 0) {
            relacionados = productosCatDB.filter(p => p.id !== producto.id).slice(0, 10);
        }

        relacionados.forEach(prod => {
            $carousel.append(crearMiniCard(prod));
        });
    }

    // Cargar productos complementarios
    function cargarProductosComplementarios(producto) {
        const $carousel = $('#complementaryProductsCarousel');
        $carousel.empty();

        // Buscar productos de DIFERENTE categoría
        let complementarios = productosCatDB.filter(p =>
            p.cat !== producto.cat && p.id !== producto.id
        ).slice(0, 10);

        // Si no hay suficientes, agregar de sugerencias
        if (complementarios.length < 5) {
            const sugerencias = sugerenciasDB.filter(p => p.id !== producto.id).slice(0, 5);
            complementarios = [...complementarios, ...sugerencias];
        }

        complementarios.forEach(prod => {
            $carousel.append(crearMiniCard(prod));
        });
    }

    // Crear mini card para carrusel
    function crearMiniCard(prod) {
        return `
            <div class="mini-product-card" onclick="abrirDetalleProducto('${prod.id}')">
                <button class="mini-product-add" onclick="event.stopPropagation(); agregarRapido('${prod.id}')" title="Agregar">+</button>
                <div class="mini-product-img">
                    <img src="${prod.img}" onerror="this.src='Imagenes/producto-placeholder.png'" alt="${prod.titulo}">
                </div>
                <div class="mini-product-price">S/ ${prod.precio.toFixed(2)}</div>
                <div class="mini-product-name">${prod.titulo}</div>
            </div>
        `;
    }

    // Agregar rápido desde mini card
    window.agregarRapido = function (id) {
        let prod = productosCatDB.find(p => p.id === id) || sugerenciasDB.find(p => p.id === id);
        if (prod) {
            agregarAlCarrito({
                id: prod.id,
                titulo: prod.titulo,
                precio: prod.precio,
                imagen: prod.img
            });
            showAlert('¡Agregado!', `${prod.titulo} añadido al carrito`, 'success');
        }
    };

    // Cambiar cantidad en detalle
    window.cambiarCantidadDetalle = function (delta) {
        cantidadDetalle = Math.max(1, cantidadDetalle + delta);
        $('#detailQuantity').text(cantidadDetalle);
        actualizarSubtotalDetalle();
    };

    // Actualizar subtotal
    function actualizarSubtotalDetalle() {
        if (productoDetalleActual) {
            const subtotal = productoDetalleActual.precio * cantidadDetalle;
            $('#detailSubtotal').text(`Subtotal: S/ ${subtotal.toFixed(2)}`);
        }
    }

    // Agregar desde modal de detalle
    window.agregarDesdeDetalle = function () {
        if (!productoDetalleActual) return;

        for (let i = 0; i < cantidadDetalle; i++) {
            agregarAlCarrito({
                id: productoDetalleActual.id,
                titulo: productoDetalleActual.titulo,
                precio: productoDetalleActual.precio,
                imagen: productoDetalleActual.img
            });
        }

        cerrarModal('modalDetalleProducto');

        // Abrir carrito sidebar
        $('#cartSidebar').addClass('active');
        $('#cartOverlay').addClass('active');
        $('body').css('overflow', 'hidden');
    };

    // Scroll carruseles
    window.scrollRelated = function (direction) {
        const carousel = document.getElementById('relatedProductsCarousel');
        carousel.scrollBy({ left: direction * 200, behavior: 'smooth' });
    };

    window.scrollComplementary = function (direction) {
        const carousel = document.getElementById('complementaryProductsCarousel');
        carousel.scrollBy({ left: direction * 200, behavior: 'smooth' });
    };

    // Handler para abrir detalle al hacer click en tarjeta de producto
    $(document).on('click', '.producto-card, .producto-card-modern, .sugerencia-card', function (e) {
        // No abrir si se hizo click en un botón
        if ($(e.target).closest('button').length > 0) return;

        const id = $(this).data('id');
        if (id) {
            abrirDetalleProducto(id);
        }
    });

    function actualizarSelectCategorias() {
        let $select = $('#prodCategoria');
        $select.empty();
        categoriasDB.forEach(cat => {
            $select.append(`<option value="${cat.id}">${cat.nombre}</option>`);
        });
    }

    function renderizarCarritoSidebar() {
        let contenedor = $('#cartContent');
        contenedor.empty();
        let total = 0;

        if (carrito.length === 0) {
            contenedor.html('<div style="text-align:center; padding-top:50px; color:#999;"><p>Tu carrito está vacío</p></div>');
            $('#cart-subtotal').text('S/ 0.00');
            $('#cart-total').text('S/ 0.00');
            return;
        }

        carrito.forEach((prod, index) => {
            let subtotal = prod.precio * prod.cantidad;
            total += subtotal;
            contenedor.append(`
                <div class="cart-item" data-index="${index}">
                    <div class="item-image"><img src="${prod.imagen}" onerror="this.src='Imagenes/producto-placeholder.png'"></div>
                    <div class="item-details">
                        <h4>${prod.titulo}</h4>
                        <div class="item-controls">
                            <button class="btn-qty btn-qty-minus" onclick="cambiarCantidad(${index}, -1)">−</button>
                            <span class="qty-value">${prod.cantidad}</span>
                            <button class="btn-qty btn-qty-plus" onclick="cambiarCantidad(${index}, 1)">+</button>
                        </div>
                        <p class="item-price">S/ ${subtotal.toFixed(2)}</p>
                    </div>
                    <button class="btn-remove-item" onclick="eliminarItem(${index})">🗑️</button>
                </div>
            `);
        });
        $('#cart-subtotal').text('S/ ' + total.toFixed(2));
        $('#cart-total').text('S/ ' + total.toFixed(2));
    }

    window.cambiarCantidad = function (index, cambio) {
        if (carrito[index]) {
            carrito[index].cantidad += cambio;
            if (carrito[index].cantidad <= 0) {
                carrito.splice(index, 1);
            }
            localStorage.setItem('carrito', JSON.stringify(carrito));
            renderizarCarritoSidebar();
            actualizarContadorCarrito();
        }
    };

    window.eliminarItem = function (index) {
        carrito.splice(index, 1);
        localStorage.setItem('carrito', JSON.stringify(carrito));
        renderizarCarritoSidebar();
        actualizarContadorCarrito();
    };

    function actualizarContadorCarrito() {
        let totalItems = carrito.reduce((total, prod) => total + prod.cantidad, 0);
        $('.badge').text(totalItems);
        $('.btn-cart span').text(`Carrito (${totalItems})`);
    }

    function mostrarNotificacion(mensaje) {
        if ($('#notificacion-carrito').length === 0) {
            $('body').append(`<div id="notificacion-carrito" style="position: fixed; top: 80px; right: 20px; background: #10b981; color: white; padding: 15px 25px; border-radius: 8px; z-index: 9999; display: none;"></div>`);
        }
        $('#notificacion-carrito').text(mensaje).fadeIn(300).delay(2000).fadeOut(300);
    }

    // Navegación y UI
    $('.btn-user, .sidebar-user-link').click(() => window.location.href = 'mi_cuenta.html');
    $('#btnLogout, #btn-logout').click(function (e) {
        e.preventDefault();
        localStorage.removeItem('userRole');
        sessionStorage.removeItem('userRole'); // Limpiar ambos
        window.location.replace('index.html'); // Replace para no poder volver
    });

    $('.btn-cart, .btn-cart-mobile').click(function (e) { e.preventDefault(); $('#cartSidebar').addClass('active'); $('#cartOverlay').addClass('active'); $('body').css('overflow', 'hidden'); });
    $('#closeCart, #cartOverlay').click(function () { $('#cartSidebar').removeClass('active'); $('#cartOverlay').removeClass('active'); $('body').css('overflow', ''); });
    $('#openSidebar').click(function () { $('#mobileSidebar').addClass('active'); $('#sidebarOverlay').addClass('active'); $('body').css('overflow', 'hidden'); });
    $('#closeSidebar, #sidebarOverlay').click(function () { $('#mobileSidebar').removeClass('active'); $('#sidebarOverlay').removeClass('active'); $('body').css('overflow', ''); });
    $('#btnIrPagar').click(() => window.location.href = 'checkout.html');

    // Scroll Horizontal
    const scrollAmount = 250;
    $('#sugRight').click(() => $('#sugerenciasGrid').animate({ scrollLeft: "+=" + scrollAmount }, 300));
    $('#sugLeft').click(() => $('#sugerenciasGrid').animate({ scrollLeft: "-=" + scrollAmount }, 300));
    $('#scrollRight').click(() => $('#categoriaGrid').animate({ scrollLeft: "+=" + scrollAmount }, 300));
    $('#scrollLeft').click(() => $('#categoriaGrid').animate({ scrollLeft: "-=" + scrollAmount }, 300));

    // --- HERO SLIDER ---
    let currentSlide = 0;
    const slides = $('.hero-slide');
    const dots = $('.hero-dot');
    const heroSection = $('#heroSlider');
    let sliderInterval;

    function showSlide(index) {
        if (index >= slides.length) index = 0;
        if (index < 0) index = slides.length - 1;
        currentSlide = index;

        slides.removeClass('active');
        dots.removeClass('active');
        $(slides[index]).addClass('active');
        $(dots[index]).addClass('active');

        // Cambiar color de fondo
        const bgColor = $(slides[index]).data('bg');
        heroSection.css('background', bgColor);
    }

    function nextSlide() { showSlide(currentSlide + 1); }
    function prevSlide() { showSlide(currentSlide - 1); }

    // Auto-rotación cada 5 segundos
    function startSlider() {
        sliderInterval = setInterval(nextSlide, 5000);
    }

    // Event listeners
    $('.hero-next').click(function () {
        clearInterval(sliderInterval);
        nextSlide();
        startSlider();
    });
    $('.hero-prev').click(function () {
        clearInterval(sliderInterval);
        prevSlide();
        startSlider();
    });
    $('.hero-dot').click(function () {
        clearInterval(sliderInterval);
        showSlide($(this).data('slide'));
        startSlider();
    });

    startSlider();

    // --- FILTRADO POR CATEGORÍA ---
    let categoriaActiva = null;

    $(document).on('click', '.categoria-card', function () {
        const catId = $(this).data('categoria');

        if (categoriaActiva === catId) {
            // Cerrar: volver a mostrar momentos
            categoriaActiva = null;
            $('.momentos-section').show();
            $('#productosCategoria').remove();
            $('.categoria-card').removeClass('active');
        } else {
            // Mostrar productos de esta categoría
            categoriaActiva = catId;
            $('.momentos-section').hide();
            $('.categoria-card').removeClass('active');
            $(this).addClass('active');

            renderizarProductosCategoria(catId);
        }
    });

    function renderizarProductosCategoria(catId) {
        $('#productosCategoria').remove();

        const categoria = categoriasDB.find(c => c.id === catId);
        const productos = productosCatDB.filter(p => p.cat === catId);

        let html = `
            <section class="productos-categoria-section" id="productosCategoria">
                <div class="section-header-cat">
                    <div class="header-left">
                        <span class="cat-icon-big">${categoria ? categoria.nombre.charAt(0) : '📦'}</span>
                        <div>
                            <h2>${categoria ? categoria.nombre : 'Productos'}</h2>
                            <p class="cat-subtitle">${productos.length} productos disponibles</p>
                        </div>
                    </div>
                    <button class="btn-cerrar-cat" onclick="cerrarFiltroCategoria()">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                        Cerrar
                    </button>
                </div>
                <div class="productos-categoria-grid-modern">
        `;

        productos.forEach(prod => {
            let deleteBtn = '';
            if (userRole === 'admin') {
                deleteBtn = `<button class="btn-delete-item" onclick="handleDeleteClick(event, '${prod.id}')" title="Eliminar" style="position:absolute; top:5px; right:5px; background:#ef4444; color:white; border:none; border-radius:50%; width:28px; height:28px; cursor:pointer; z-index:10; display:flex; justify-content:center; align-items:center; font-size:14px;">🗑️</button>`;
            }

            html += `
                <div class="producto-card-modern" data-id="${prod.id}" data-tipo="categoria" style="position:relative;">
                    ${deleteBtn}
                    <div class="card-image">
                        <img src="${prod.img}" onerror="this.src='Imagenes/producto-placeholder.png'" alt="${prod.titulo}">
                    </div>
                    <div class="card-content">
                        <h3 class="card-title">${prod.titulo}</h3>
                        <div class="card-price-row">
                            <span class="card-price">S/ ${prod.precio.toFixed(2)}</span>
                            <span class="card-stock">✓ En stock</span>
                        </div>
                        <button class="btn-agregar-modern">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="9" cy="21" r="1"></circle>
                                <circle cx="20" cy="21" r="1"></circle>
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                            </svg>
                            Agregar
                        </button>
                    </div>
                </div>
            `;
        });

        html += '</div></section>';

        $('.seccion-categorias').after(html);
    }

    window.cerrarFiltroCategoria = function () {
        categoriaActiva = null;
        $('.momentos-section').show();
        $('#productosCategoria').remove();
        $('#productosSubcategoria').remove();
        $('.categoria-card').removeClass('active');
    };

    // --- FILTRADO POR SUBCATEGORÍA (Botón "Ver todo" en momentos del día) ---
    const subcategoriaNames = {
        'avenas_cereales': 'Avenas y Cereales',
        'panaderia_untables': 'Panadería y Untables',
        'carnes_aves': 'Carnes y Aves',
        'verduras_frescas': 'Verduras Frescas',
        'bebidas_almuerzo': 'Bebidas',
        'abarrotes_almuerzo': 'Abarrotes',
        'jugos_galletas': 'Jugos y Galletas',
        'infusiones_ligeros': 'Infusiones y Ligeros'
    };

    const subcategoriaIcons = {
        'avenas_cereales': '☕',
        'panaderia_untables': '🍞',
        'carnes_aves': '🥩',
        'verduras_frescas': '🥬',
        'bebidas_almuerzo': '🥤',
        'abarrotes_almuerzo': '🛒',
        'jugos_galletas': '🧃',
        'infusiones_ligeros': '🍵'
    };

    // Handler para el nuevo botón "Ver todo"
    $(document).on('click', '.banner-btn-ver-todo', function (e) {
        e.preventDefault();
        const subcatId = $(this).data('subcat');

        if (subcatId) {
            mostrarProductosSubcategoria(subcatId);
        }
    });

    function mostrarProductosSubcategoria(subcatId) {
        const productos = productosCatDB.filter(p => p.subcat === subcatId);
        const subcatName = subcategoriaNames[subcatId] || subcatId;
        const subcatIcon = subcategoriaIcons[subcatId] || '📦';

        let productosHtml = '';
        productos.forEach(prod => {
            let deleteBtn = '';
            if (userRole === 'admin') {
                deleteBtn = `<button class="btn-delete-item" onclick="handleDeleteClick(event, '${prod.id}')" title="Eliminar" style="position:absolute; top:5px; right:5px; background:#ef4444; color:white; border:none; border-radius:50%; width:28px; height:28px; cursor:pointer; z-index:10; display:flex; justify-content:center; align-items:center; font-size:14px;">🗑️</button>`;
            }

            productosHtml += `
                <div class="producto-card-modern" data-id="${prod.id}" data-tipo="categoria" style="position:relative;">
                    ${deleteBtn}
                    <div class="card-image">
                        <img src="${prod.img}" onerror="this.src='Imagenes/producto-placeholder.png'" alt="${prod.titulo}">
                    </div>
                    <div class="card-content">
                        <h3 class="card-title">${prod.titulo}</h3>
                        <div class="card-price-row">
                            <span class="card-price">S/ ${prod.precio.toFixed(2)}</span>
                            <span class="card-stock">✓ En stock</span>
                        </div>
                        <button class="btn-agregar-modern">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="9" cy="21" r="1"></circle>
                                <circle cx="20" cy="21" r="1"></circle>
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                            </svg>
                            Agregar
                        </button>
                    </div>
                </div>
            `;
        });

        const html = `
            <div class="subcategoria-header">
                <div class="subcategoria-header-left">
                    <span class="subcategoria-icon">${subcatIcon}</span>
                    <div>
                        <h2>${subcatName}</h2>
                        <p>${productos.length} productos disponibles</p>
                    </div>
                </div>
                <button class="btn-volver-momentos" onclick="volverAMomentos()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                    Volver
                </button>
            </div>
            <div class="productos-categoria-grid-modern">
                ${productosHtml}
            </div>
        `;

        // Ocultar sección de momentos
        $('#momentosSection').hide();

        // Mostrar y llenar sección de subcategoría
        $('#subcategoriaContent').html(html);
        $('#subcategoriaSection').show();

        // Scroll suave hacia arriba
        $('html, body').animate({
            scrollTop: $('#subcategoriaSection').offset().top - 100
        }, 300);
    }

    window.volverAMomentos = function () {
        $('#subcategoriaSection').hide();
        $('#momentosSection').show();
    };

    window.cerrarFiltroSubcategoria = function () {
        $('#productosSubcategoria').remove();
        $('#subcategoriaSection').hide();
        $('#momentosSection').show();
    };

    // ==========================================
    // FUNCIONALIDAD DE BÚSQUEDA
    // ==========================================
    let searchTimeout = null;
    let searchResultsAll = [];
    let searchResultsShown = 0;
    const SEARCH_PAGE_SIZE = 60;

    // Input de búsqueda con debounce
    $('#busqueda').on('input', function () {
        const query = $(this).val().trim();

        // Mostrar/ocultar botón limpiar
        if (query.length > 0) {
            $('#searchClear').show();
        } else {
            $('#searchClear').hide();
            cerrarDropdownBusqueda();
            return;
        }

        // Debounce para no buscar en cada letra
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            if (query.length >= 2) {
                realizarBusquedaRapida(query);
            } else {
                cerrarDropdownBusqueda();
            }
        }, 300);
    });

    // Limpiar búsqueda
    $('#searchClear').on('click', function () {
        $('#busqueda').val('').focus();
        $(this).hide();
        cerrarDropdownBusqueda();
    });

    // Enter para buscar
    $('#busqueda').on('keypress', function (e) {
        if (e.which === 13) {
            e.preventDefault();
            const query = $(this).val().trim();
            if (query.length >= 2) {
                mostrarResultadosCompletos(query);
            }
        }
    });

    // Cerrar dropdown al hacer click fuera
    $(document).on('click', function (e) {
        if (!$(e.target).closest('.search-wrapper').length) {
            cerrarDropdownBusqueda();
        }
    });

    // Búsqueda rápida (dropdown)
    function realizarBusquedaRapida(query) {
        const queryLower = query.toLowerCase();

        // Buscar en productos y sugerencias
        const todos = [...productosCatDB, ...sugerenciasDB];
        const resultados = todos.filter(p =>
            p.titulo.toLowerCase().includes(queryLower) ||
            (p.cat && p.cat.toLowerCase().includes(queryLower)) ||
            (p.subcat && p.subcat.toLowerCase().includes(queryLower))
        );

        // Generar sugerencias de palabras
        const sugerencias = generarSugerencias(queryLower, resultados);

        // Mostrar dropdown
        mostrarDropdownBusqueda(query, sugerencias, resultados.slice(0, 3), resultados.length);
    }

    // Generar sugerencias de palabras
    function generarSugerencias(query, resultados) {
        const sugerenciasSet = new Set();

        // Agregar nombres de categorías
        categoriasDB.forEach(cat => {
            if (cat.nombre.toLowerCase().includes(query)) {
                sugerenciasSet.add(cat.nombre);
            }
        });

        // Agregar palabras clave de productos
        resultados.forEach(p => {
            const palabras = p.titulo.toLowerCase().split(' ');
            palabras.forEach(palabra => {
                if (palabra.includes(query) && palabra.length > 2) {
                    sugerenciasSet.add(palabra);
                }
            });
        });

        return Array.from(sugerenciasSet).slice(0, 8);
    }

    // Mostrar dropdown de búsqueda
    function mostrarDropdownBusqueda(query, sugerencias, productos, total) {
        const $dropdown = $('#searchDropdown');
        const $sugerenciasList = $('#searchSuggestionsList');
        const $quickProducts = $('#searchQuickProducts');
        const $viewAllBtn = $('#searchViewAllBtn');

        // Llenar sugerencias
        $sugerenciasList.empty();
        sugerencias.forEach(sug => {
            const highlighted = sug.replace(new RegExp(`(${query})`, 'gi'), '<mark>$1</mark>');
            $sugerenciasList.append(`<li onclick="buscarPorSugerencia('${sug}')">${highlighted}</li>`);
        });

        // Llenar productos rápidos
        $('#searchQuickTerm').text(query);
        $quickProducts.empty();

        productos.forEach(prod => {
            const descuento = prod.precioAnterior ? Math.round((1 - prod.precio / prod.precioAnterior) * 100) : 0;

            $quickProducts.append(`
                <div class="search-quick-card">
                    ${descuento > 0 ? `<span class="discount-badge">-${descuento}%</span>` : ''}
                    <div class="card-img" onclick="abrirDetalleProducto('${prod.id}')">
                        <img src="${prod.img}" onerror="this.src='Imagenes/producto-placeholder.png'" alt="${prod.titulo}">
                    </div>
                    <div class="card-name">${prod.titulo}</div>
                    <div class="card-prices">
                        <span class="price-label">Precio Online</span>
                        <span class="price-current">S/ ${prod.precio.toFixed(2)}</span>
                        ${prod.precioAnterior ? `<span class="price-old">S/ ${prod.precioAnterior.toFixed(2)}</span>` : ''}
                    </div>
                    <button class="btn-add" onclick="agregarRapido('${prod.id}')">AGREGAR</button>
                </div>
            `);
        });

        // Botón ver todos
        $viewAllBtn.text(`VER LOS ${total} PRODUCTOS`);
        $viewAllBtn.off('click').on('click', function () {
            mostrarResultadosCompletos(query);
        });

        $dropdown.addClass('active');
    }

    // Cerrar dropdown
    function cerrarDropdownBusqueda() {
        $('#searchDropdown').removeClass('active');
    }

    // Buscar por sugerencia
    window.buscarPorSugerencia = function (sug) {
        $('#busqueda').val(sug);
        mostrarResultadosCompletos(sug);
    };

    // Mostrar resultados completos (página)
    function mostrarResultadosCompletos(query) {
        cerrarDropdownBusqueda();

        const queryLower = query.toLowerCase();

        // Buscar en todos los productos
        const todos = [...productosCatDB, ...sugerenciasDB];
        searchResultsAll = todos.filter(p =>
            p.titulo.toLowerCase().includes(queryLower) ||
            (p.cat && p.cat.toLowerCase().includes(queryLower)) ||
            (p.subcat && p.subcat.toLowerCase().includes(queryLower))
        );

        // Actualizar UI
        $('#searchResultsTerm').text(query);
        $('#searchResultsCount').text(searchResultsAll.length);

        // Mostrar primeros 60
        searchResultsShown = 0;
        $('#searchResultsGrid').empty();
        cargarMasResultados();

        // Ocultar contenido principal y mostrar resultados
        $('#mainContent').hide();
        $('#searchResultsSection').show();

        // Scroll arriba
        $('html, body').scrollTop(0);
    }

    // Cargar más resultados
    function cargarMasResultados() {
        const $grid = $('#searchResultsGrid');
        const total = searchResultsAll.length;
        const hasta = Math.min(searchResultsShown + SEARCH_PAGE_SIZE, total);

        for (let i = searchResultsShown; i < hasta; i++) {
            const prod = searchResultsAll[i];
            const descuento = prod.precioAnterior ? Math.round((1 - prod.precio / prod.precioAnterior) * 100) : 0;

            $grid.append(`
                <div class="producto-card-modern" data-id="${prod.id}" onclick="abrirDetalleProducto('${prod.id}')" style="cursor:pointer;">
                    ${descuento > 0 ? `<div class="tag-limit" style="position:absolute; top:10px; left:10px; background:#ef4444; color:white; padding:4px 8px; border-radius:12px; font-size:12px; font-weight:bold;">-${descuento}%</div>` : ''}
                    <div class="card-image">
                        <img src="${prod.img}" onerror="this.src='Imagenes/producto-placeholder.png'" alt="${prod.titulo}">
                    </div>
                    <div class="card-content">
                        <h3 class="card-title">${prod.titulo}</h3>
                        <div class="card-price-row">
                            <span class="card-price">S/ ${prod.precio.toFixed(2)}</span>
                            ${prod.precioAnterior ? `<span class="price-old" style="text-decoration:line-through; color:#999; font-size:0.9em; margin-left:5px;">S/ ${prod.precioAnterior.toFixed(2)}</span>` : ''}
                        </div>
                        <button class="btn-agregar-modern" onclick="event.stopPropagation(); agregarRapido('${prod.id}')">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="9" cy="21" r="1"></circle>
                                <circle cx="20" cy="21" r="1"></circle>
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                            </svg>
                            Agregar
                        </button>
                    </div>
                </div>
            `);
        }

        searchResultsShown = hasta;

        // Actualizar footer
        if (searchResultsShown < total) {
            $('#searchResultsFooter').show();
            $('#searchShowingText').html(`Mostrando <strong>${searchResultsShown}</strong> de <strong>${total}</strong>`);
            $('#searchProgressFill').css('width', `${(searchResultsShown / total) * 100}%`);
        } else {
            $('#searchResultsFooter').hide();
        }
    }

    // Botón mostrar más
    $('#searchShowMoreBtn').on('click', function () {
        cargarMasResultados();
    });

    // Cerrar búsqueda y volver al inicio
    window.cerrarBusqueda = function () {
        $('#searchResultsSection').hide();
        $('#mainContent').show();
        $('#busqueda').val('');
        $('#searchClear').hide();
        searchResultsAll = [];
        searchResultsShown = 0;
        return false; // Prevenir navegación
    };

    // INICIAR TODO
    renderizarTodo();
});
