function Navbar() {
    return `
        <div class="navbar">
            <div class="menu">
                <a href="/H4ckV4ult/index.html">Home</a>
                <a href="/H4ckV4ult/pages/machinesHome.html">Machines</a>
                <a href="/H4ckV4ult/pages/protocols.html">Protocols</a>
                <a href="/H4ckV4ult/pages/misc.html">Misc</a>
                <a href="/H4ckV4ult/pages/privScalation.html">Priv Scalation</a>
            </div>
            <div>
                <a id="title" href="#">H4ckV4ult</a>
            </div>
            <div class="search-bar">
                <input type="text" id="searchInputOutside" placeholder="What do you wanna hack today? 🔎">
            </div>
        </div>    
        `;
}

function renderNavbar() {
    const container = document.getElementById("navbar-container");
    if (container) {
        container.innerHTML = Navbar();
    }
}

function createSearchContainer() {
    return `
        <div id="searchContainer" style="display: none;">
            <div id="searchBox"class="search-result">
                <input type="text" id="searchInputInside" placeholder="Start typing to search...">
                <div id="searchResults" class="box-results">
                </div>
            </div>
        </div>
    `;
}

// Función para cerrar el contenedor de búsqueda
function closeSearchContainer(searchContainer, searchInput) {
    searchContainer.style.display = 'none';

    // Si aplicaste blur, elimina cualquier efecto de este tipo
    Array.from(document.body.children).forEach(element => {
        if (element !== searchContainer && element !== searchInput) {
            element.style.filter = 'none';
        }
    });
}

async function loadRoutes() {
    try {
        const response = await fetch('/H4ckV4ult/components/routes.txt'); // Ruta al archivo
        const data = await response.text();  // Esperar a que se obtenga el texto
        const routes = data.split('\n').map(line => line.trim()).filter(line => line);

        return routes;  // Retorna las rutas para que puedan usarse fuera de la función
    } catch (error) {
        console.error('Error al leer el archivo de rutas:', error);
        return [];
    }
}



async function searchInPages(searchQuery) {
    const pages = await loadRoutes();
    const resultsContainer = document.getElementById('searchResults'); // Contenedor de resultados

    resultsContainer.innerHTML = ''; // Limpiar resultados anteriores

    pages.forEach(page => {
        fetch(`${page}.html`)
            .then(response => response.text())
            .then(data => {
                // Convertir el contenido HTML a un documento DOM
                const parser = new DOMParser();
                const doc = parser.parseFromString(data, 'text/html');

                // Extraer el texto visible de la página (sin tags)
                const visibleText = doc.body.textContent.toLowerCase();

                // Convertir el query a minúsculas para búsqueda insensible a mayúsculas/minúsculas
                const lowerQuery = searchQuery.toLowerCase();

                // Buscar solo en el contenido visible (sin código HTML)
                if (visibleText.includes(lowerQuery)) {
                    // Encontrar la posición del término de búsqueda
                    const startIndex = visibleText.indexOf(lowerQuery);

                    // Determinar el fragmento de texto que se mostrará
                    const snippetStart = Math.max(0, startIndex - 50);
                    const snippetEnd = Math.min(visibleText.length, startIndex + lowerQuery.length + 50);
                    let snippet = visibleText.substring(snippetStart, snippetEnd);

                    // Resaltar el término buscado dentro del snippet
                    const highlightedQuery = `<span style="background-color: #f633ff;">${lowerQuery}</span>`;
                    snippet = snippet.replace(lowerQuery, highlightedQuery);

                    console.log(page);

                    let showPage;
                    if (page === '/pages/machinesHome') {
                        showPage = 'Machines';
                    } else if (page === '/pages/privScalation') {
                        showPage = 'Priv Scalation';
                    } else if (page === '/pages/misc') {
                        showPage = 'Misc';
                    } else if (page.includes('box')) {
                        showPage = 'Boxes';
                    } else {
                        showPage = page;
                    }

                    // Mostrar solo el fragmento en el contenedor de resultados
                    resultsContainer.innerHTML += `
                    <div onclick="location.href='${page}.html';">
                            <p><strong>Found in ${showPage}:</strong></p>
                            <p>...${snippet}...</p>
                    </div>        
                    `;
                }
            })
            .catch(error => {
                console.error(`Error fetching ${page}:`, error);
            });
    });
}


function clearSearchResults() {
    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = '';
}




function renderNavbar() {
    const container = document.getElementById("navbar-container");
    let isSearchContainerOpen = false; // Variable para saber si el contenedor está abierto

    if (container) {
        container.innerHTML = Navbar();
    }

    // Crear el contenedor de búsqueda después de cargar la barra de navegación
    const body = document.body;
    body.insertAdjacentHTML('beforeend', createSearchContainer());

    const searchInput = document.getElementById('searchInputOutside');
    const searchContainer = document.getElementById('searchContainer');
    const searchBox = document.getElementById('searchBox');

    // Mostrar el contenedor de búsqueda
    searchInput.addEventListener('click', (event) => {
        searchContainer.style.display = 'flex';
        searchBox.focus();
        isSearchContainerOpen = true; // Cambiar estado a abierto

        const bodyChildren = document.body.children;
        Array.from(bodyChildren).forEach(element => {
            if (element !== searchContainer && element !== searchInput) {
                element.style.filter = 'blur(5px)';  // Aplica un blur del 5px
            }
        });
    });

    // Detectar clics en cualquier parte del documento
    document.addEventListener('click', (event) => {

        if (event.target.id == "searchInputInside") {
            const searchInput = document.getElementById('searchInputInside');

            searchInput.addEventListener('input', (e) => {
                const searchQuery = e.target.value.trim(); // Obtener el texto ingresado
                if (searchQuery) {
                    searchInPages(searchQuery); // Ejecutar la búsqueda
                } else {
                    clearSearchResults(); // Limpiar resultados si no hay texto
                }
            });
            return; // Evitar que se cierre el contenedor de búsqueda
        }
  
        

        // Verificar si el clic ocurrió fuera del searchContainer y el searchInput
        if (event.target.id == "searchContainer" && isSearchContainerOpen) {
            closeSearchContainer(searchContainer, searchInput);
            isSearchContainerOpen = false; // Actualizamos el estado
        }
    });
}



// Asegúrate de usar `addEventListener` en lugar de sobrescribir window.onload
window.addEventListener('load', renderNavbar);
