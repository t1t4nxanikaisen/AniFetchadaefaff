const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();

// Enable CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// TMDB API Configuration
const TMDB_CONFIG = {
    apiKey: 'b7f48ba9ca0e46aa46cc8c0ffa5d18c0',
    accessToken: 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJiN2Y0OGJhOWNhMGU0NmFhNDZjYzhjMGZmYTVkMThjMCIsIm5iZiI6MTc1ODY1NTAyNC44NDcwMDAxLCJzdWIiOiI2OGQyZjIzMGRmNWNhMGY3OWZjZDgzYzYiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.QITKazf3JFdVhbuwD9W8iuFFQNvHIpxKVACzCIZJqYk',
    baseUrl: 'https://api.themoviedb.org/3'
};

// Cache systems
const tmdbCache = new Map();
const animeSlugCache = new Map();

// -------- TMDB API FUNCTIONS --------

// Get anime info from TMDB
async function getTMDBAnimeInfo(tmdbId) {
    if (tmdbCache.has(tmdbId)) {
        return tmdbCache.get(tmdbId);
    }

    try {
        const response = await axios.get(
            `${TMDB_CONFIG.baseUrl}/tv/${tmdbId}`,
            {
                headers: {
                    'Authorization': `Bearer ${TMDB_CONFIG.accessToken}`,
                    'Accept': 'application/json'
                },
                timeout: 10000
            }
        );

        const animeData = response.data;
        
        // Cache the result
        tmdbCache.set(tmdbId, animeData);
        
        return animeData;
    } catch (error) {
        console.error(`TMDB API Error for ${tmdbId}:`, error.message);
        return null;
    }
}

// Search TMDB for anime by name
async function searchTMDBAnime(animeName) {
    try {
        const response = await axios.get(
            `${TMDB_CONFIG.baseUrl}/search/tv`,
            {
                params: {
                    query: animeName,
                    include_adult: false,
                    language: 'en-US'
                },
                headers: {
                    'Authorization': `Bearer ${TMDB_CONFIG.accessToken}`,
                    'Accept': 'application/json'
                },
                timeout: 10000
            }
        );

        // Filter for anime (TMDB doesn't have a proper anime filter, so we'll use keywords)
        const results = response.data.results.filter(show => 
            show.genre_ids.includes(16) || // Animation genre
            show.name.toLowerCase().includes('anime') ||
            show.original_language === 'ja' // Japanese original language
        );

        return results;
    } catch (error) {
        console.error('TMDB Search Error:', error.message);
        return [];
    }
}

// Get popular anime from TMDB
async function getPopularAnime(page = 1) {
    try {
        const response = await axios.get(
            `${TMDB_CONFIG.baseUrl}/discover/tv`,
            {
                params: {
                    with_genres: 16, // Animation
                    with_original_language: 'ja', // Japanese
                    sort_by: 'popularity.desc',
                    page: page,
                    include_adult: false
                },
                headers: {
                    'Authorization': `Bearer ${TMDB_CONFIG.accessToken}`,
                    'Accept': 'application/json'
                },
                timeout: 10000
            }
        );

        return response.data.results;
    } catch (error) {
        console.error('TMDB Popular Anime Error:', error.message);
        return [];
    }
}

// -------- ANIMEWORLD FUNCTIONS --------

// Smart search on Animeworld
async function searchAnimeworld(animeName, originalName = '') {
    const searchTerms = [
        animeName,
        originalName,
        animeName.replace(/[^a-zA-Z0-9 ]/g, ' ').trim(),
        originalName.replace(/[^a-zA-Z0-9 ]/g, ' ').trim(),
        animeName.split(' ').slice(0, 3).join(' '), // First 3 words
        originalName.split(' ').slice(0, 3).join(' ')
    ].filter(term => term && term.length > 2);

    for (const term of searchTerms) {
        try {
            const searchUrl = `https://watchanimeworld.in/?s=${encodeURIComponent(term)}`;
            
            const response = await axios.get(searchUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept-Language': 'en-US,en;q=0.9'
                },
                timeout: 15000
            });

            const $ = cheerio.load(response.data);
            const results = [];

            $('article').each((i, el) => {
                const title = $(el).find('h2 a').text().trim();
                const url = $(el).find('h2 a').attr('href');
                const image = $(el).find('img').attr('src');
                
                if (title && url && url.includes('/anime/')) {
                    const slugMatch = url.match(/\/anime\/([^\/]+)\//);
                    if (slugMatch && slugMatch[1]) {
                        results.push({
                            title: title,
                            slug: slugMatch[1],
                            url: url,
                            image: image,
                            search_term: term,
                            match_score: calculateMatchScore(title, animeName, originalName)
                        });
                    }
                }
            });

            // Return best match
            if (results.length > 0) {
                results.sort((a, b) => b.match_score - a.match_score);
                return results[0];
            }
        } catch (error) {
            console.log(`Search failed for "${term}":`, error.message);
            continue;
        }
    }

    return null;
}

// Calculate match score between TMDB title and Animeworld title
function calculateMatchScore(animeworldTitle, tmdbTitle, originalTitle) {
    let score = 0;
    const awTitle = animeworldTitle.toLowerCase();
    const tmTitle = tmdbTitle.toLowerCase();
    const ogTitle = originalTitle ? originalTitle.toLowerCase() : '';

    // Exact match
    if (awTitle === tmTitle || awTitle === ogTitle) return 100;

    // Contains main title
    if (awTitle.includes(tmTitle) || (ogTitle && awTitle.includes(ogTitle))) score += 40;

    // Word overlap
    const tmWords = tmTitle.split(' ');
    const awWords = awTitle.split(' ');
    const wordMatches = tmWords.filter(word => 
        word.length > 2 && awTitle.includes(word)
    ).length;
    score += wordMatches * 10;

    // Length similarity
    const lengthDiff = Math.abs(awTitle.length - tmTitle.length);
    score += Math.max(0, 20 - lengthDiff);

    return Math.min(score, 100);
}

// Get anime slug from TMDB ID
async function getAnimeSlugFromTMDB(tmdbId) {
    if (animeSlugCache.has(tmdbId)) {
        return animeSlugCache.get(tmdbId);
    }

    // Get anime info from TMDB
    const tmdbInfo = await getTMDBAnimeInfo(tmdbId);
    if (!tmdbInfo) {
        return null;
    }

    console.log(`🔍 Mapping TMDB ${tmdbId}: "${tmdbInfo.name}" (${tmdbInfo.original_name})`);

    // Search on Animeworld
    const animeworldResult = await searchAnimeworld(
        tmdbInfo.name, 
        tmdbInfo.original_name
    );

    if (animeworldResult) {
        console.log(`✅ Found match: ${animeworldResult.slug} (Score: ${animeworldResult.match_score})`);
        animeSlugCache.set(tmdbId, animeworldResult.slug);
        return animeworldResult.slug;
    }

    console.log(`❌ No match found for TMDB ${tmdbId}`);
    return null;
}

// Extract video players from episode page
function extractVideoPlayers(html) {
    const $ = cheerio.load(html);
    const players = [];

    // Extract iframe embeds
    $('iframe').each((i, el) => {
        const src = $(el).attr('src');
        if (src && src.includes('//')) {
            players.push({
                type: 'embed',
                server: `Server ${players.length + 1}`,
                url: src.startsWith('//') ? `https:${src}` : src,
                quality: 'HD',
                format: 'iframe'
            });
        }
    });

    // Extract from scripts
    const scripts = $('script');
    scripts.each((i, el) => {
        const scriptContent = $(el).html();
        if (scriptContent) {
            const videoPatterns = [
                /(https?:\/\/[^\s"']*\.(mp4|m3u8|webm)[^\s"']*)/gi,
                /(https?:\/\/[^\s"']*\/embed\/[^\s"']*)/gi,
                /(https?:\/\/[^\s"']*\/video\/[^\s"']*)/gi,
                /file:\s*["']([^"']+)["']/gi,
                /src:\s*["']([^"']+)["']/gi
            ];
            
            videoPatterns.forEach(pattern => {
                const matches = scriptContent.match(pattern);
                if (matches) {
                    matches.forEach(match => {
                        const cleanUrl = match.replace(/file:\s*|src:\s*|["']/g, '');
                        if (cleanUrl.includes('http')) {
                            players.push({
                                type: 'direct',
                                server: `Direct ${players.length + 1}`,
                                url: cleanUrl,
                                quality: 'HD',
                                format: 'auto'
                            });
                        }
                    });
                }
            });
        }
    });

    return players;
}

// Get episode data
async function getEpisodeData(animeSlug, season, episode) {
    const urlAttempts = [
        `https://watchanimeworld.in/episode/${animeSlug}-episode-${episode}/`,
        `https://watchanimeworld.in/episode/${animeSlug}-${season}x${episode}/`,
        `https://watchanimeworld.in/episode/${animeSlug}-${episode}/`,
        `https://watchanimeworld.in/episode/${animeSlug}-season-${season}-episode-${episode}/`
    ];

    for (const url of urlAttempts) {
        try {
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept-Language': 'en-US,en;q=0.9'
                },
                timeout: 10000
            });

            if (response.status === 200) {
                const $ = cheerio.load(response.data);
                const players = extractVideoPlayers(response.data);

                if (players.length > 0) {
                    return {
                        success: true,
                        url: url,
                        title: $('h1.entry-title').text().trim() || `Episode ${episode}`,
                        description: $('div.entry-content p').first().text().trim() || '',
                        thumbnail: $('.post-thumbnail img').attr('src') || '',
                        players: players
                    };
                }
            }
        } catch (error) {
            continue;
        }
    }

    return { success: false, players: [] };
}

// -------- API ENDPOINTS --------

// Main endpoint: Get episode with correct TMDB mapping
app.get('/api/anime/:tmdbId/:season/:episode', async (req, res) => {
    const { tmdbId, season, episode } = req.params;
    
    console.log(`🎌 Fetching: TMDB ${tmdbId}, Season ${season}, Episode ${episode}`);

    // Validate TMDB ID
    if (!/^\d+$/.test(tmdbId)) {
        return res.status(400).json({ error: 'Invalid TMDB ID format' });
    }

    const seasonNum = parseInt(season);
    const episodeNum = parseInt(episode);

    if (isNaN(seasonNum) || isNaN(episodeNum)) {
        return res.status(400).json({ error: 'Invalid season or episode number' });
    }

    try {
        // Get correct anime slug from TMDB
        const animeSlug = await getAnimeSlugFromTMDB(tmdbId);
        
        if (!animeSlug) {
            // Get TMDB info for better error message
            const tmdbInfo = await getTMDBAnimeInfo(tmdbId);
            return res.status(404).json({ 
                error: 'Anime not found on Animeworld',
                tmdb_id: tmdbId,
                tmdb_name: tmdbInfo ? tmdbInfo.name : 'Unknown',
                suggestion: 'Try searching for the anime name first using /api/search/:name'
            });
        }

        // Get episode data
        const episodeData = await getEpisodeData(animeSlug, seasonNum, episodeNum);
        
        if (!episodeData.success) {
            return res.status(404).json({ 
                error: 'Episode not found or no players available',
                tmdb_id: tmdbId,
                anime_slug: animeSlug,
                season: seasonNum,
                episode: episodeNum
            });
        }

        // Get TMDB info for metadata
        const tmdbInfo = await getTMDBAnimeInfo(tmdbId);

        // Success response
        res.json({
            success: true,
            tmdb_id: tmdbId,
            anime_slug: animeSlug,
            season: seasonNum,
            episode: episodeNum,
            title: episodeData.title,
            description: episodeData.description,
            thumbnail: episodeData.thumbnail,
            source_url: episodeData.url,
            total_players: episodeData.players.length,
            players: episodeData.players,
            tmdb_info: tmdbInfo ? {
                name: tmdbInfo.name,
                original_name: tmdbInfo.original_name,
                overview: tmdbInfo.overview,
                popularity: tmdbInfo.popularity,
                vote_average: tmdbInfo.vote_average,
                first_air_date: tmdbInfo.first_air_date,
                poster_path: tmdbInfo.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbInfo.poster_path}` : null
            } : null,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Server error:', error.message);
        res.status(500).json({ 
            error: 'Failed to fetch episode data',
            message: error.message
        });
    }
});

// Search anime across TMDB and Animeworld
app.get('/api/search/:query', async (req, res) => {
    const { query } = req.params;
    
    try {
        // Search TMDB
        const tmdbResults = await searchTMDBAnime(query);
        
        // Search Animeworld
        const animeworldResult = await searchAnimeworld(query);
        
        const results = tmdbResults.map(anime => ({
            id: anime.id,
            name: anime.name,
            original_name: anime.original_name,
            overview: anime.overview,
            poster_path: anime.poster_path,
            first_air_date: anime.first_air_date,
            vote_average: anime.vote_average,
            source: 'tmdb'
        }));

        if (animeworldResult) {
            results.unshift({
                id: null,
                name: animeworldResult.title,
                slug: animeworldResult.slug,
                url: animeworldResult.url,
                image: animeworldResult.image,
                source: 'animeworld'
            });
        }

        res.json({
            query: query,
            results_count: results.length,
            results: results
        });

    } catch (error) {
        res.status(500).json({ error: 'Search failed', message: error.message });
    }
});

// Get popular anime from TMDB
app.get('/api/popular', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const animeList = await getPopularAnime(page);
        
        res.json({
            page: page,
            results_count: animeList.length,
            results: animeList.map(anime => ({
                id: anime.id,
                name: anime.name,
                original_name: anime.original_name,
                overview: anime.overview,
                poster_path: `https://image.tmdb.org/t/p/w500${anime.poster_path}`,
                first_air_date: anime.first_air_date,
                vote_average: anime.vote_average
            }))
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch popular anime' });
    }
});

// Health check with stats
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK',
        server: 'AnimeWorld TMDB Mapper',
        timestamp: new Date().toISOString(),
        cache_stats: {
            tmdb_cache: tmdbCache.size,
            slug_cache: animeSlugCache.size
        },
        tmdb_api: 'Active'
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: '🎌 AnimeWorld TMDB Mapper - CORRECT ANIME FETCHING',
        version: '4.0',
        description: 'Automatically maps TMDB IDs to correct Animeworld slugs',
        endpoints: {
            '/api/anime/:tmdbId/:season/:episode': 'Get episode with correct TMDB mapping',
            '/api/search/:query': 'Search anime across TMDB and Animeworld',
            '/api/popular': 'Get popular anime from TMDB',
            '/health': 'Health check'
        },
        examples: {
            naruto: '/api/anime/31910/1/1', // This will now correctly fetch Naruto!
            one_piece: '/api/anime/37854/1/1', // Example: need to find correct TMDB ID for One Piece
            attack_on_titan: '/api/anime/46298/1/1'
        }
    });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Anime TMDB Mapper running on port ${PORT}`);
    console.log('📺 Now correctly mapping TMDB IDs to Animeworld!');
    console.log('🔍 Example: TMDB 31910 = Naruto (not One Piece!)');
});

module.exports = app;
