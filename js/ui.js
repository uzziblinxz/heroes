const UI = {
    createMovieCard(movie) {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.dataset.id = movie.id;
        card.dataset.type = movie.title ? 'movie' : 'tv';
        
        const poster = movie.poster_path 
            ? CONFIG.IMG_URL + movie.poster_path 
            : 'https://via.placeholder.com/500x750?text=No+Poster';
        
        const title = movie.title || movie.name;
        const date = movie.release_date || movie.first_air_date;
        const year = date ? date.split('-')[0] : 'N/A';
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
        
        const backdrop = movie.backdrop_path 
            ? CONFIG.BACKDROP_URL + movie.backdrop_path 
            : 'https://images.unsplash.com/photo-1574267432553-4b4628081c31?q=80&w=2073&auto=format&fit=crop';
        
        hero.style.backgroundImage = `url(${backdrop})`;
        title.textContent = movie.title || movie.name || 'Featured Movie';
        const overview = movie.overview || 'Streaming content loading...';
        desc.textContent = overview.length > 200 
            ? overview.substring(0, 200) + '...' 
            : overview;
        
        document.getElementById('heroPlayBtn').onclick = () => {
            if (movie.id) window.APP.openModal(movie.id, movie.title ? 'movie' : 'tv');
        };
    },

    populateYears() {
        const select = document.getElementById('yearFilter');
        const currentYear = new Date().getFullYear();
        for (let i = currentYear; i >= 2009; i--) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            select.appendChild(option);
        }
    }
};
