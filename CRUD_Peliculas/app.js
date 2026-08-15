// ================== Variables globales ================== //
let USUARIOS = {
    pedrito: "1234",
    admin: "admin123",
    usuario: "1234"
};

let usuarioActual = null;
let peliculasGlobales = [];
let peliculaEnEdicion = null;

const PLACEHOLDER_IMG = "https://via.placeholder.com/300x450/d8dce2/6c757d?text=Sin+Imagen";

// ================== Inicialización ================== //

document.addEventListener("DOMContentLoaded", () => {
    inicializarApp();
    eventos();
});

function inicializarApp() {
    cargarUsuariosRegistrados();

    if (!localStorage.getItem("peliculas")) {
        cargarDatosEjemplo();
    }

    let userLogged = localStorage.getItem("usuarioLogueado");
    if (userLogged) {
        usuarioActual = JSON.parse(userLogged);
        mostrarDashboard();
    } else {
        mostrarLogin();
    }
}

function eventos() {
    const formLogin = document.querySelector("#formLogin");
    if (formLogin) formLogin.addEventListener("submit", login);

    const formRegistro = document.querySelector("#formRegistro");
    if (formRegistro) formRegistro.addEventListener("submit", registrarUsuario);

    const btnSalir = document.querySelector("#btn-salir");
    if (btnSalir) btnSalir.addEventListener("click", logout);

    const formPelicula = document.querySelector("#form-pelicula");
    if (formPelicula) formPelicula.addEventListener("submit", guardarPelicula);

    const linkLogin = document.querySelector("#linkLogin");
    if (linkLogin) {
        linkLogin.addEventListener("click", (e) => {
            e.preventDefault();
            activarTabLogin();
        });
    }

    // Escuchadores para los Filtros
    const inputBuscar = document.querySelector("#input-buscar");
    if (inputBuscar) inputBuscar.addEventListener("input", filtrarPeliculas);

    const selectGenero = document.querySelector("#select-genero");
    if (selectGenero) selectGenero.addEventListener("change", filtrarPeliculas);

    // Eventos para las flechas del carrusel
    const btnIzq = document.querySelector(".slider-container .slider-btn:first-child");
    const btnDer = document.querySelector(".slider-container .slider-btn:last-child");

    if (btnIzq) btnIzq.addEventListener("click", () => scrollSlider(-1));
    if (btnDer) btnDer.addEventListener("click", () => scrollSlider(1));
}

function cargarUsuariosRegistrados() {
    let usuariosGuardados = localStorage.getItem("usuariosRegistrados");
    if (usuariosGuardados) {
        try {
            let parsed = JSON.parse(usuariosGuardados);
            Object.assign(USUARIOS, parsed);
        } catch (error) {
            console.error("Error al cargar usuarios de localStorage", error);
        }
    }
}

// ================== Tus Películas ================== //

function cargarDatosEjemplo() {
    const peliculasEjemplo = [
        {
            id: 1,
            titulo: "Terminator 6",
            genero: "acción",
            director: "James Cameron",
            ano: 2019,
            calificacion: 8.7,
            descripcion: "Un asesino cibernético es enviado desde el futuro para eliminar a Sarah Connor.",
            imagen: "https://s3-eu-west-1.amazonaws.com/abandomedia/db/poster/db_posters_49164.jpg"
        },
        {
            id: 2,
            titulo: "Rapido y furioso 10",
            genero: "acción",
            director: "Rob Cohen",
            ano: 2023,
            calificacion: 8.8,
            descripcion: "Un policía encubierto se infiltra en el mundo de las carreras clandestinas de autos.",
            imagen: "https://static.wikia.nocookie.net/atodogas/images/5/51/Poster_de_Rapidos_y_Furiosos_10.jpg/revision/latest?cb=20230614171609&path-prefix=es"
        },
        {
            id: 3,
            titulo: "El ultimo guardian",
            genero: "aventura",
            director: "Desconocido",
            ano: 2026,
            calificacion: 8.8,
            descripcion: "Una historia sobre la valentía y la protección del último guardián.",
            imagen: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRnPzvrIMFoafhwUjr20zANK950uKLasTAoqA64VJKrW8oSv8H_zNcuYHdU&s=10"
        }
    ];

    localStorage.setItem("peliculas", JSON.stringify(peliculasEjemplo));
}

function cargarPeliculas() {
    const peliculasLS = localStorage.getItem("peliculas");
    peliculasGlobales = peliculasLS ? JSON.parse(peliculasLS) : [];
    
    renderizarSlider();
    filtrarPeliculas();
}

function renderizarGrid(pelis) {
    const grid = document.querySelector("#grid-peliculas");
    const sinResultados = document.querySelector("#sin-resultados");

    if (!grid) return;

    if (pelis.length === 0) {
        grid.innerHTML = "";
        if (sinResultados) sinResultados.classList.remove("d-none");
        return;
    }

    if (sinResultados) sinResultados.classList.add("d-none");

    grid.innerHTML = pelis.map(p => `
        <div class="col-12 col-sm-6 col-md-4 col-lg-3">
            <div class="movie-card">
                <img src="${p.imagen}"
                     onerror="this.onerror=null; this.src='${PLACEHOLDER_IMG}';"
                     alt="${p.titulo}"
                     onclick="verDetalles(${p.id})">

                <div class="movie-card-body" onclick="verDetalles(${p.id})">
                    <h6 class="movie-card-title">${p.titulo}</h6>
                    <p class="movie-card-year">${p.ano}</p>
                </div>

                <div class="movie-card-actions border-top">
                    <button class="btn btn-outline-warning btn-sm flex-fill" onclick="editarPelicula(${p.id})">
                        <i class="bi bi-pencil"></i> Editar
                    </button>
                    <button class="btn btn-outline-danger btn-sm flex-fill" onclick="eliminarPelicula(${p.id})">
                        <i class="bi bi-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        </div>
    `).join("");
}

// ================== Carrusel Infinito ================== //

function renderizarSlider() {
    const carrusel = document.querySelector('#carruselMovies');
    if (!carrusel) return;

    carrusel.innerHTML = "";

    const peliculas = peliculasGlobales;
    if (peliculas.length === 0) return;

    // 1. Triplicamos las películas para crear el efecto infinito
    const recientesTriplicadas = [...peliculas, ...peliculas, ...peliculas]; 

    recientesTriplicadas.forEach(p => {
        const card = document.createElement('div');
        card.className = 'slider-movie-card';

        card.innerHTML = `
            <img src="${p.imagen}" 
                 onerror="this.src='${PLACEHOLDER_IMG}'" 
                 alt="${p.titulo}">
            <div class="movie-card-body">
                <h6 class="movie-card-title">${p.titulo}</h6>
                <p class="movie-card-year">${p.ano}</p>
            </div>
        `;

        card.onclick = () => verDetalles(p.id);
        carrusel.appendChild(card);
    });

    // 2. Ancho de un set completo
    const anchoUnSet = peliculas.length * 260; // 240px tarjeta + 20px gap

    // 3. Posicionamos en el segundo bloque
    carrusel.scrollLeft = anchoUnSet;

    // 4. Salto invisible
    carrusel.onscroll = () => {
        if (carrusel.scrollLeft >= anchoUnSet * 2) {
            carrusel.style.scrollBehavior = 'auto';
            carrusel.scrollLeft -= anchoUnSet;
            carrusel.style.scrollBehavior = 'smooth';
        }
        else if (carrusel.scrollLeft <= 5) {
            carrusel.style.scrollBehavior = 'auto';
            carrusel.scrollLeft += anchoUnSet;
            carrusel.style.scrollBehavior = 'smooth';
        }
    };
}

function scrollSlider(direccion) {
    const carrusel = document.querySelector('#carruselMovies');
    if (!carrusel) return;

    const scrollAmount = 260;
    carrusel.scrollBy({
        left: direccion * scrollAmount,
        behavior: 'smooth'
    });
}

function filtrarPeliculas() {
    const inputBuscar = document.querySelector("#input-buscar");
    const selectGenero = document.querySelector("#select-genero");

    const texto = inputBuscar ? inputBuscar.value.toLowerCase().trim() : "";
    const genero = selectGenero ? selectGenero.value.toLowerCase() : "";

    const peliculasFiltradas = peliculasGlobales.filter(p => {
        const coincideTitulo = p.titulo.toLowerCase().includes(texto);
        const coincideGenero = genero === "" || p.genero.toLowerCase() === genero;
        return coincideTitulo && coincideGenero;
    });

    renderizarGrid(peliculasFiltradas);
}

// ================== Guardar / Crear / Editar Película ================== //

function guardarPelicula(e) {
    if (e) e.preventDefault();

    const titulo = document.querySelector("#input-titulo").value.trim();
    const genero = document.querySelector("#input-genero").value;
    const director = document.querySelector("#input-director").value.trim();
    const ano = document.querySelector("#input-ano").value;
    const calificacion = document.querySelector("#input-calificacion").value;
    const descripcion = document.querySelector("#input-descripcion").value.trim();
    const imagen = document.querySelector("#input-imagen").value.trim();

    if (peliculaEnEdicion) {
        peliculaEnEdicion.titulo = titulo;
        peliculaEnEdicion.genero = genero;
        peliculaEnEdicion.director = director;
        peliculaEnEdicion.ano = ano;
        peliculaEnEdicion.calificacion = calificacion;
        peliculaEnEdicion.descripcion = descripcion;
        peliculaEnEdicion.imagen = imagen;
    } else {
        const nuevaPelicula = {
            id: Date.now(),
            titulo,
            genero,
            director,
            ano,
            calificacion,
            descripcion,
            imagen
        };

        peliculasGlobales.unshift(nuevaPelicula);
    }

    // Guarda en localStorage
    localStorage.setItem("peliculas", JSON.stringify(peliculasGlobales));
    peliculaEnEdicion = null;

    const formPelicula = document.querySelector("#form-pelicula");
    if (formPelicula) formPelicula.reset();

    const modalElement = document.querySelector("#modal-app");
    if (modalElement) {
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) modalInstance.hide();
    }

    // Vuelve a cargar y renderizar con los datos persistidos
    cargarPeliculas();
}

function prepararModalCrear() {
    peliculaEnEdicion = null;
    const formPelicula = document.querySelector("#form-pelicula");
    if (formPelicula) formPelicula.reset();
    
    const tituloModal = document.querySelector("#modalPeliculaLabel");
    if (tituloModal) tituloModal.textContent = "Agregar película";

    const modalElement = document.querySelector("#modal-app");
    if (modalElement) {
        const modalInstance = bootstrap.Modal.getOrCreateInstance(modalElement);
        modalInstance.show();
    }
}

function editarPelicula(id) {
    const pelicula = peliculasGlobales.find(p => p.id === id);
    if (!pelicula) return;

    peliculaEnEdicion = pelicula;

    document.querySelector("#input-titulo").value = pelicula.titulo;
    document.querySelector("#input-genero").value = pelicula.genero;
    document.querySelector("#input-director").value = pelicula.director;
    document.querySelector("#input-ano").value = pelicula.ano;
    document.querySelector("#input-calificacion").value = pelicula.calificacion;
    document.querySelector("#input-descripcion").value = pelicula.descripcion;
    document.querySelector("#input-imagen").value = pelicula.imagen;

    const tituloModal = document.querySelector("#modalPeliculaLabel");
    if (tituloModal) tituloModal.textContent = "Editar Película";

    const modalElement = document.querySelector("#modal-app");
    const modalInstance = bootstrap.Modal.getOrCreateInstance(modalElement);
    modalInstance.show();
}

// ================== Eliminar Película ================== //

function eliminarPelicula(id) {
    if (confirm("¿Deseas eliminar esta película?")) {
        peliculasGlobales = peliculasGlobales.filter(p => p.id !== id);
        localStorage.setItem('peliculas', JSON.stringify(peliculasGlobales));
        cargarPeliculas();
    }
}

// ================== Mostrar Detalles ================== //

function verDetalles(id) {
    const pelicula = peliculasGlobales.find(p => p.id == id);

    if (pelicula) {
        document.querySelector('#detalles-titulo').textContent = pelicula.titulo;
        document.querySelector('#detalles-genero').textContent = pelicula.genero;
        document.querySelector('#detalles-director').textContent = pelicula.director;
        document.querySelector('#detalles-ano').textContent = pelicula.ano;
        document.querySelector('#detalles-calificacion').textContent = pelicula.calificacion;
        document.querySelector('#detalles-descripcion').textContent = pelicula.descripcion;
        document.querySelector('#detalles-imagen').src = pelicula.imagen;

        const modalElement = document.querySelector('#modal-detalles');
        const modalInstance = bootstrap.Modal.getOrCreateInstance(modalElement);
        modalInstance.show();
    }
}

// ================== Autenticación ================== //

function login(e) {
    e.preventDefault();
    cargarUsuariosRegistrados();

    let user = document.querySelector("#inputUser").value.trim();
    let password = document.querySelector("#inputPassword").value.trim();

    let usuarioEncontrado = Object.keys(USUARIOS).find(
        k => k.toLowerCase() === user.toLowerCase()
    );

    if (usuarioEncontrado && USUARIOS[usuarioEncontrado] === password) {
        usuarioActual = usuarioEncontrado;
        localStorage.setItem("usuarioLogueado", JSON.stringify(usuarioEncontrado));
        mostrarDashboard();
        document.querySelector("#formLogin").reset();
    } else {
        alert("El usuario y contraseña no son válidos");
    }
}

function registrarUsuario(e) {
    e.preventDefault();

    let nombre = document.querySelector("#inputNombre").value.trim();
    let email = document.querySelector("#inputEmail").value.trim();
    let user = document.querySelector("#inputUserReg").value.trim();
    let password = document.querySelector("#inputPasswordReg").value.trim();
    let confirmPassword = document.querySelector("#inputConfirmPassword").value.trim();

    if (password !== confirmPassword) {
        alert("Las contraseñas no coinciden.");
        return;
    }

    USUARIOS[user] = password;

    let usuariosRegistrados = JSON.parse(localStorage.getItem("usuariosRegistrados")) || {};
    usuariosRegistrados[user] = password;
    localStorage.setItem("usuariosRegistrados", JSON.stringify(usuariosRegistrados));

    alert("¡Usuario registrado con éxito!");
    document.querySelector("#formRegistro").reset();
    activarTabLogin();
}

function logout() {
    if (confirm("¿Desea cerrar sesión?")) {
        usuarioActual = null;
        localStorage.removeItem("usuarioLogueado");
        mostrarLogin();
    }
}

function activarTabLogin() {
    let loginTabBtn = document.querySelector("#login-tab");
    if (loginTabBtn) {
        let tab = bootstrap.Tab.getOrCreateInstance(loginTabBtn);
        tab.show();
    }
}

// ================== Control de Vistas ================== //

function mostrarDashboard() {
    document.querySelector("#loginSection").style.display = "none";
    document.querySelector("#dashboard").style.display = "block";

    let navItems = document.querySelector("#nav-usuario-items");
    if (navItems) {
        navItems.setAttribute("style", "display: flex !important;");
    }

    let nombreUsuarioElem = document.querySelector("#nombre-usuario");
    if (nombreUsuarioElem) {
        nombreUsuarioElem.textContent = usuarioActual;
    }

    cargarPeliculas();
}

function mostrarLogin() {
    document.querySelector("#loginSection").style.display = "block";
    document.querySelector("#dashboard").style.display = "none";

    let navItems = document.querySelector("#nav-usuario-items");
    if (navItems) {
        navItems.setAttribute("style", "display: none !important;");
    }
}