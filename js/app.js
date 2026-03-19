/**
 * HEREOS BUNDLED APP SCRIPT
 * Consolidating all modules for maximum deployment compatibility.
 */

// 1. CONFIGURATION
const CONFIG = {
    TMDB_API_KEY: '2b06434343c471355a9e33a4fb5eca3a',
    BASE_URL: 'https://api.themoviedb.org/3',
    IMG_URL: 'https://image.tmdb.org/t/p/w500',
    BACKDROP_URL: 'https://image.tmdb.org/t/p/original',
    SERVERS: [
        { name: 'Server 1', movie: 'https://vidsrc.to/embed/movie/', tv: 'https://vidsrc.to/embed/tv/' },
        { name: 'Server 2', movie: 'https://vidsrc.me/embed/movie?tmdb=', tv: 'https://vidsrc.me/embed/tv?tmdb=' },
        { name: 'Server 3', movie: 'https://embed.su/embed/movie/', tv: 'https://embed.su/embed/tv/' }
    ]
};

// 2. API SERVICE
const API = {
    async fetchMovies(page = 1, year = '') {
        const yearParam = year ? `&primary_release_date.gte=${year}-01-01&primary_release_date.lte=${year}-12-31` : '&primary_release_date.gte=2009-01-01';
        const url = `${CONFIG.BASE_URL}/discover/movie?api_key=${CONFIG.TMDB_API_KEY}&page=${page}${yearParam}&sort_by=popularity.desc`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`TMDB Error: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return { error: true, message: error.message };
        }
    },

    async search(query) {
        const url = `${CONFIG.BASE_URL}/search/multi?api_key=${CONFIG.TMDB_API_KEY}&query=${encodeURIComponent(query)}`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Search Error: ${response.status}`);
            return await response.json();
        } catch (error) {
            return { error: true, message: error.message };
        }
    },

    async fetchDetails(id, type = 'movie') {
        const url = `${CONFIG.BASE_URL}/${type}/${id}?api_key=${CONFIG.TMDB_API_KEY}`;
        try {
            const response = await fetch(url);
            return await response.json();
        } catch (error) {
            return null;
        }
    }
};

// 3. UI COMPONENTS
const UI = {
    createMovieCard(movie) {
        const card = document.createElement('div');
        card.className = 'movie-card';
        const poster = movie.poster_path ? CONFIG.IMG_URL + movie.poster_path : 'https://via.placeholder.com/500x750?text=No+Poster';
        const title = movie.title || movie.name;
        const year = (movie.release_date || movie.first_air_date || '').split('-')[0] || 'N/A';
        const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';

        card.innerHTML = `
            <div class="movie-rating">★ ${rating}</div>
            <img src="${poster}" alt="${title}" loading="lazy">
            <div class="movie-info">
                <h4>${title}</h4>
                <div class="movie-meta">
                    <span>${year}</span>
                    <span class="type-badge">${movie.title ? 'Movie' : 'TV'}</span>
                </div>
            </div>
        `;
        card.onclick = () => window.APP.openModal(movie.id, movie.title ? 'movie' : 'tv');
        return card;
    },

    updateHero(movie) {
        const hero = document.getElementById('hero');
        const title = document.getElementById('heroTitle');
        const desc = document.getElementById('heroDesc');
        const backdrop = movie.backdrop_path ? CONFIG.BACKDROP_URL + movie.backdrop_path : 'https://images.unsplash.com/photo-1574267432553-4b4628081c31?q=80&w=2073&auto=format&fit=crop';
        
        hero.style.backgroundImage = `url(${backdrop})`;
        title.textContent = movie.title || movie.name || 'Featured Movie';
        desc.textContent = (movie.overview || '').substring(0, 180) + '...';
        document.getElementById('heroPlayBtn').onclick = () => {
            if (movie.id) window.APP.openModal(movie.id, movie.title ? 'movie' : 'tv');
        };
    },

    populateYears() {
        const select = document.getElementById('yearFilter');
        if (!select) return;
        const currentYear = new Date().getFullYear();
        for (let i = currentYear; i >= 2009; i--) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            select.appendChild(option);
        }
    }
};

// 4. MAIN APPLICATION
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
        console.log('App Initializing...');
        try {
            UI.populateYears();
            await this.loadContent();
            this.setupEventListeners();
        } catch (error) {
            console.error('App Crash:', error);
            this.showErrorMessage(error.message);
        }
    },

    async loadContent() {
        const movieGrid = document.getElementById('movieGrid');
        if (!movieGrid) return;
        
        if (this.currentPage === 1) movieGrid.innerHTML = '<div class="loader"></div>';
        
        const data = await API.fetchMovies(this.currentPage, this.currentYear);
        
        if (data && !data.error && data.results && data.results.length > 0) {
            if (this.currentPage === 1) {
                movieGrid.innerHTML = '';
                UI.updateHero(data.results[0]);
            }
            data.results.forEach(movie => movieGrid.appendChild(UI.createMovieCard(movie)));
            document.getElementById('loadMore').style.display = 'block';
        } else {
            this.showErrorMessage(data?.message || "Check your internet connection.");
        }
    },

    showErrorMessage(msg) {
        const movieGrid = document.getElementById('movieGrid');
        if (!movieGrid) return;
        movieGrid.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #fff; grid-column: 1/-1;">
                <h3 style="color: var(--primary);">System Error</h3>
                <p style="margin-top: 10px; color: #b3b3b3;">${msg}</p>
                <button class="btn btn-primary" style="margin-top: 20px;" onclick="location.reload()">Refresh Page</button>
            </div>
        `;
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

        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');

        const handleSearch = async () => {
            const query = searchInput.value.trim();
            if (!query) return;
            const movieGrid = document.getElementById('movieGrid');
            movieGrid.innerHTML = '<div class="loader"></div>';
            const data = await API.search(query);
            movieGrid.innerHTML = '';
            if (data && data.results && data.results.length > 0) {
                data.results.filter(m => m.poster_path).forEach(m => movieGrid.appendChild(UI.createMovieCard(m)));
                document.getElementById('loadMore').style.display = 'none';
            }
        };

        searchBtn.onclick = handleSearch;
        searchInput.onkeypress = (e) => { if (e.key === 'Enter') handleSearch(); };

        document.querySelector('.close-modal').onclick = () => this.closeModal();
    },

    async openModal(id, type) {
        const modal = document.getElementById('movieModal');
        const playerContainer = document.getElementById('playerContainer');
        const tvSelectors = document.getElementById('tvSelectors');
        
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        playerContainer.innerHTML = '<div class="loader"></div>';
        
        const movie = await API.fetchDetails(id, type);
        if (movie) {
            this.currentId = id;
            this.currentType = type;
            this.currentServerIndex = 0;
            
            document.getElementById('modalTitle').textContent = movie.title || movie.name;
            document.getElementById('modalOverview').textContent = movie.overview;
            this.renderServerList();

            if (type === 'tv' && movie.seasons) {
                tvSelectors.style.display = 'flex';
                const sSelect = document.getElementById('seasonSelect');
                const eSelect = document.getElementById('episodeSelect');
                
                sSelect.innerHTML = movie.seasons.filter(s => s.season_number > 0)
                    .map(s => `<option value="${s.season_number}">Season ${s.season_number}</option>`).join('');
                
                const updateEps = () => {
                    const s = movie.seasons.find(sec => sec.season_number == sSelect.value);
                    eSelect.innerHTML = Array.from({length: s?.episode_count || 1}, (_, i) => `<option value="${i+1}">Episode ${i+1}</option>`).join('');
                };

                sSelect.onchange = () => { this.currentSeason = sSelect.value; updateEps(); this.updatePlayer(); };
                eSelect.onchange = () => { this.currentEpisode = eSelect.value; this.updatePlayer(); };
                
                updateEps();
                this.currentSeason = 1; this.currentEpisode = 1;
            } else {
                tvSelectors.style.display = 'none';
            }
            this.updatePlayer();
        }
    },

    renderServerList() {
        const list = document.getElementById('serverList');
        if (!list) return;
        list.innerHTML = CONFIG.SERVERS.map((s, i) => `
            <button class="server-btn ${i === this.currentServerIndex ? 'active' : ''}" onclick="window.APP.switchServer(${i})">${s.name}</button>
        `).join('');
    },

    switchServer(index) {
        this.currentServerIndex = index;
        this.renderServerList();
        this.updatePlayer();
    },

    updatePlayer() {
        const player = document.getElementById('playerContainer');
        const srv = CONFIG.SERVERS[this.currentServerIndex];
        let url = this.currentType === 'movie' ? `${srv.movie}${this.currentId}` : `${srv.tv}${this.currentId}`;
        
        if (this.currentType === 'tv') {
            url += srv.name === 'Server 2' ? `&season=${this.currentSeason}&episode=${this.currentEpisode}` : `/${this.currentSeason}/${this.currentEpisode}`;
        }

        player.innerHTML = `<iframe src="${url}" allowfullscreen sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"></iframe>`;
    },

    closeModal() {
        document.getElementById('movieModal').style.display = 'none';
        document.getElementById('playerContainer').innerHTML = '';
        document.body.style.overflow = 'auto';
    }
};

// Global init trigger
document.addEventListener('DOMContentLoaded', () => window.APP.init());
