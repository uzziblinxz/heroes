window.APP = {
    currentPage: 1,
    currentYear: '',
    isSearching: false,
    currentServerIndex: 0,
    currentId: null,
    currentType: null,
    currentSeason: 1,
    currentEpisode: 1,

    async init() {
        UI.populateYears();
        this.loadContent();
        this.setupEventListeners();
    },

    async loadContent() {
        const movieGrid = document.getElementById('movieGrid');
        if (this.currentPage === 1) {
            movieGrid.innerHTML = '<div class="loader"></div>';
        }
        
        const data = await API.fetchMovies(this.currentPage, this.currentYear);
        
        if (data && !data.error && data.results && data.results.length > 0) {
            if (this.currentPage === 1) {
                movieGrid.innerHTML = '';
                UI.updateHero(data.results[0]);
            }
            
            data.results.forEach(movie => {
                const card = UI.createMovieCard(movie);
                movieGrid.appendChild(card);
            });
            document.getElementById('loadMore').style.display = 'block';
        } else {
            if (this.currentPage === 1) {
                movieGrid.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #fff;">
                        <h3 style="color: var(--primary);">Unable to load movies</h3>
                        <p style="margin-top: 10px; color: #b3b3b3;">${data?.message || 'Check your internet connection or API key.'}</p>
                        <button class="btn btn-primary" style="margin-top: 20px;" onclick="location.reload()">Try Again</button>
                    </div>
                `;
                document.getElementById('loadMore').style.display = 'none';
                
                // Set fallback hero
                UI.updateHero({
                    title: "Welcome to Hereos",
                    overview: "Discover and watch movies and series from 2009 to the present. Please ensure your API key is configured correctly in js/config.js.",
                    backdrop_path: ""
                });
            }
        }
    },

    setupEventListeners() {
        document.getElementById('yearFilter').onchange = (e) => {
            this.currentYear = e.target.value;
            this.currentPage = 1;
            this.loadContent();
        };

        document.getElementById('loadMore').onclick = () => {
            this.currentPage++;
            this.loadContent();
        };

        window.onscroll = () => {
            const navbar = document.querySelector('.navbar');
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        };

        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');

        const handleSearch = async () => {
            const query = searchInput.value.trim();
            if (query) {
                this.isSearching = true;
                const movieGrid = document.getElementById('movieGrid');
                movieGrid.innerHTML = '<div class="loader"></div>';
                const data = await API.search(query);
                movieGrid.innerHTML = '';
                if (data && data.results.length > 0) {
                    data.results.filter(m => m.poster_path).forEach(movie => {
                        const card = UI.createMovieCard(movie);
                        movieGrid.appendChild(card);
                    });
                    document.getElementById('loadMore').style.display = 'none';
                } else {
                    movieGrid.innerHTML = '<h3>No results found.</h3>';
                }
            } else {
                this.currentPage = 1;
                this.loadContent();
                document.getElementById('loadMore').style.display = 'block';
            }
        };

        searchBtn.onclick = handleSearch;
        searchInput.onkeypress = (e) => {
            if (e.key === 'Enter') handleSearch();
        };

        document.querySelector('.close-modal').onclick = () => this.closeModal();
        window.onclick = (e) => {
            if (e.target.id === 'movieModal') this.closeModal();
        };
    },

    async openModal(id, type) {
        const modal = document.getElementById('movieModal');
        const playerContainer = document.getElementById('playerContainer');
        const title = document.getElementById('modalTitle');
        const info = document.getElementById('modalInfo');
        const overview = document.getElementById('modalOverview');
        const tvSelectors = document.getElementById('tvSelectors');
        const seasonSelect = document.getElementById('seasonSelect');
        const episodeSelect = document.getElementById('episodeSelect');

        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        playerContainer.innerHTML = '<div class="loader"></div>';
        tvSelectors.style.display = 'none';

        const movie = await API.fetchDetails(id, type);
        if (movie) {
            this.currentId = id;
            this.currentType = type;
            this.currentSeason = 1;
            this.currentEpisode = 1;
            this.currentServerIndex = 0; // Reset server index when opening new modal
            
            title.textContent = movie.title || movie.name;
            const year = (movie.release_date || movie.first_air_date || '').split('-')[0];
            const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
            info.textContent = `${year} • ${type === 'movie' ? 'Movie' : 'Series'} • ⭐ ${rating}`;
            overview.textContent = movie.overview;

            this.renderServerList();

            if (type === 'tv' && movie.seasons) {
                tvSelectors.style.display = 'flex';
                seasonSelect.innerHTML = movie.seasons
                    .filter(s => s.season_number > 0)
                    .map(s => `<option value="${s.season_number}">Season ${s.season_number}</option>`)
                    .join('');
                
                const updateEpisodes = (seasonNum) => {
                    const season = movie.seasons.find(s => s.season_number == seasonNum);
                    const epCount = season ? season.episode_count : 1;
                    episodeSelect.innerHTML = Array.from({length: epCount}, (_, i) => 
                        `<option value="${i+1}">Episode ${i+1}</option>`
                    ).join('');
                };

                seasonSelect.onchange = () => {
                    this.currentSeason = seasonSelect.value;
                    updateEpisodes(this.currentSeason);
                    this.updatePlayer();
                };
                episodeSelect.onchange = () => {
                    this.currentEpisode = episodeSelect.value;
                    this.updatePlayer();
                };

                updateEpisodes(1);
            }
            this.updatePlayer();
        }
    },

    renderServerList() {
        const serverList = document.getElementById('serverList');
        if (!serverList) return;
        serverList.innerHTML = CONFIG.SERVERS.map((server, index) => `
            <button class="server-btn ${index === this.currentServerIndex ? 'active' : ''}" 
                    onclick="window.APP.switchServer(${index})">
                ${server.name}
            </button>
        `).join('');
    },

    switchServer(index) {
        this.currentServerIndex = index;
        this.renderServerList();
        this.updatePlayer();
    },

    updatePlayer() {
        const playerContainer = document.getElementById('playerContainer');
        const server = CONFIG.SERVERS[this.currentServerIndex];
        
        let streamUrl = '';
        if (this.currentType === 'movie') {
            streamUrl = server.movie.includes('tmdb=') 
                ? `${server.movie}${this.currentId}`
                : `${server.movie}${this.currentId}`; // vidsrc.to uses /tmdbID
            
            // Special handling for vidsrc.to which uses /id
            if (server.name === 'Server 1' || server.name === 'Server 3') {
                streamUrl = `${server.movie}${this.currentId}`;
            }
        } else {
            if (server.name === 'Server 2') {
                streamUrl = `${server.tv}${this.currentId}&season=${this.currentSeason}&episode=${this.currentEpisode}`;
            } else {
                streamUrl = `${server.tv}${this.currentId}/${this.currentSeason}/${this.currentEpisode}`;
            }
        }
        
        playerContainer.innerHTML = `
            <iframe src="${streamUrl}" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                allowfullscreen></iframe>
        `;
    },

    closeModal() {
        const modal = document.getElementById('movieModal');
        const playerContainer = document.getElementById('playerContainer');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        playerContainer.innerHTML = '';
    }
};

document.addEventListener('DOMContentLoaded', () => window.APP.init());
