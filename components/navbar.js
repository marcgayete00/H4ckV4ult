function Navbar() {
    return `
        <div class="navbar">
            <div class="menu">
                <a href="/H4ckV4ult/index.html">Home</a>
                <a href="/H4ckV4ult/pages/machinesHome.html">Machines</a>
                <a href="/H4ckV4ult/pages/protocols.html">Protocols, Services & more</a>
                <a href="/H4ckV4ult/pages/misc.html">Misc</a>
                <div class="dropdown">
                    <a href="/H4ckV4ult/pages/privEscPresentation.html" class="dropbtn">Priv Scalation</a>
                    <div class="dropdown-content">
                        <a href="/H4ckV4ult/pages/privScalation.html">Linux</a>
                        <a href="/H4ckV4ult/pages/winprivScalation.html">Windows</a>
                    </div>
                </div>
                <a href="/H4ckV4ult/pages/reverse.html">Reverse Engineering</a>
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
        const response = await fetch(`/H4ckV4ult/components/routes.txt?nocache=${Date.now()}`);
        const data = await response.text();  // Esperar a que se obtenga el texto
        const routes = data.split('\n').map(line => line.trim()).filter(line => line);
        console.log(routes)
        return routes;  // Retorna las rutas para que puedan usarse fuera de la función
    } catch (error) {
        console.error('Error al leer el archivo de rutas:', error);
        return [];
    }
}

async function searchInPages(searchQuery) {
    const pages = await loadRoutes();
    const resultsContainer = document.getElementById('searchResults'); // Contenedor de resultados
    console.log(pages)
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

            

                    let showPage;
                    if (page === '/H4ckV4ult/pages/machinesHome') {
                        showPage = 'Machines';
                    } else if (page === '/H4ckV4ult/pages/privScalation') {
                        showPage = 'Priv Scalation';
                    } else if (page === '/H4ckV4ult/pages/misc') {
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
    let isSearchContainerOpen = false;

    if (container) {
        container.innerHTML = Navbar();
    }

    const body = document.body;
    body.insertAdjacentHTML('beforeend', createSearchContainer());

    const searchInputOutside = document.getElementById('searchInputOutside'); //Input de fuera 
    const searchContainer = document.getElementById('searchContainer');  //Container
    const searchInputInside = document.getElementById('searchInputInside'); //Input de dentro
    //const searchResults = document.getElementById('searchResults');

    // Abrir contenedor de búsqueda
    searchInputOutside.addEventListener('click', (e) => {
        e.stopPropagation(); // Previene que el evento dispare el listener global
        searchContainer.style.display = 'flex';
        searchInputInside.focus();
        isSearchContainerOpen = true;

        Array.from(document.body.children).forEach(el => {
            if (el !== searchContainer && el !== searchInputOutside) {
                el.style.filter = 'blur(5px)';
            }
        });
    });

    // Input interno - llamada a búsqueda
    searchInputInside.addEventListener('input', (e) => {
        const searchQuery = e.target.value.trim();
        if (searchQuery) {
            searchInPages(searchQuery);
        } else {
            clearSearchResults();
        }
    });

    // Cerrar contenedor al hacer clic fuera
    document.addEventListener('click', (e) => {
         closeSearchContainer(searchContainer, searchInputOutside);
        isSearchContainerOpen = false;

        Array.from(document.body.children).forEach(el => {
              el.style.filter = '';
        }); 
    });

}



// Asegúrate de usar `addEventListener` en lugar de sobrescribir window.onload
window.addEventListener('load', renderNavbar);
