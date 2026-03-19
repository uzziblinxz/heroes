const API = {
    async fetchMovies(page = 1, year = '') {
        const yearParam = year ? `&primary_release_date.gte=${year}-01-01&primary_release_date.lte=${year}-12-31` : '&primary_release_date.gte=2009-01-01';
        const url = `${CONFIG.BASE_URL}/discover/movie?api_key=${CONFIG.TMDB_API_KEY}&page=${page}${yearParam}&sort_by=popularity.desc`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching movies:', error);
            return { error: true, message: error.message };
        }
    },

    async fetchSeries(page = 1) {
        const url = `${CONFIG.BASE_URL}/discover/tv?api_key=${CONFIG.TMDB_API_KEY}&page=${page}&first_air_date.gte=2009-01-01&sort_by=popularity.desc`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching series:', error);
            return { error: true, message: error.message };
        }
    },

    async search(query) {
        const url = `${CONFIG.BASE_URL}/search/multi?api_key=${CONFIG.TMDB_API_KEY}&query=${encodeURIComponent(query)}`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Error searching:', error);
            return { error: true, message: error.message };
        }
    },

    async fetchDetails(id, type = 'movie') {
        const url = `${CONFIG.BASE_URL}/${type}/${id}?api_key=${CONFIG.TMDB_API_KEY}`;
        try {
            const response = await fetch(url);
            return await response.json();
        } catch (error) {
            console.error('Error fetching details:', error);
            return null;
        }
    }
};
