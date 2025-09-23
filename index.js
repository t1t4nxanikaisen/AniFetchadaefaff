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

// Cache systems
const animeMappingCache = new Map();
const episodeCache = new Map();

// Predefined TMDB to Animeworld mappings (common anime)
const predefinedMappings = {
    // Popular Anime Mappings
    '31910': 'one-piece',
    '73223': 'naruto-shippuden',
    '46298': 'attack-on-titan',
    '63588': 'demon-slayer-kimetsu-no-yaiba',
    '85937': 'jujutsu-kaisen',
    '95557': 'chainsaw-man',
    '37854': 'my-hero-academia',
    '46774': 'one-punch-man',
    '42249': 'dragon-ball-super',
    '92685': 'spy-x-family',
    '60586': 'tokyo-revengers',
    '90447': 'blue-lock',
    '95403': 'hells-paradise',
    '88898': 'vinland-saga',
    '75219': 'haikyuu',
    '67478': 'dr-stone',
    '79008': 'the-promised-neverland',
    '86960': 'fire-force',
    '81774': 'black-clover',
    '68890': 'that-time-i-got-reincarnated-as-a-slime'
};

// -------- HELPER FUNCTIONS --------

// Function to search Animeworld for anime slug
async function searchAnimeSlug(animeName) {
    try {
        const searchUrl = `https://watchanimeworld.in/?s=${encodeURIComponent(animeName)}`;
        
        const response = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept-Language': 'en-US,en;q=0.9'
            },
            timeout: 10000
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
                        title,
                        slug: slugMatch[1],
                        url,
                        image
                    });
                }
            }
        });

        return results.length > 0 ? results[0].slug : null;
    } catch (error) {
        console.error('Search error:', error.message);
        return null;
    }
}

// Function to get anime info from TMDB
async function getTMDBInfo(tmdbId) {
    try {
        const response = await axios.get(
            `https://api.themoviedb.org/3/tv/${tmdbId}`,
            {
                headers: {
                    'Authorization': `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
                    'Accept': 'application/json'
                },
                timeout: 5000
            }
        );
        return response.data;
    } catch (error) {
        console.log('TMDB API fallback:', error.message);
        return null;
    }
}

// Function to find anime slug by TMDB ID
async function findAnimeSlug(tmdbId) {
    // Check predefined mappings first
    if (predefinedMappings[tmdbId]) {
        return predefinedMappings[tmdbId];
    }

    // Check cache
    if (animeMappingCache.has(tmdbId)) {
        return animeMappingCache.get(tmdbId);
    }

    try {
        // Get anime info from TMDB
        const tmdbInfo = await getTMDBInfo(tmdbId);
        if (!tmdbInfo) {
            return null;
        }

        const animeTitle = tmdbInfo.name;
        const originalTitle = tmdbInfo.original_name || animeTitle;

        // Try different search terms
        const searchTerms = [
            animeTitle,
            originalTitle,
            animeTitle.replace(/[^a-zA-Z0-9 ]/g, ' '),
            originalTitle.replace(/[^a-zA-Z0-9 ]/g, ' ')
        ];

        for (const term of searchTerms) {
            if (!term) continue;
            
            const slug = await searchAnimeSlug(term);
            if (slug) {
                animeMappingCache.set(tmdbId, slug);
                return slug;
            }
        }

        return null;
    } catch (error) {
        console.error('Error finding anime slug:', error.message);
        return null;
    }
}

// Function to extract video players and links
function extractVideoPlayers($) {
    const players = [];
    
    // Extract iframe embeds
    $('iframe').each((i, el) => {
        const src = $(el).attr('src');
        if (src && src.includes('//')) {
            players.push({
                type: 'embed',
                name: `Server ${players.length + 1}`,
                url: src.startsWith('//') ? `https:${src}` : src,
                quality: 'HD'
            });
        }
    });

    // Extract videojs players
    $('video source').each((i, el) => {
        const src = $(el).attr('src');
        const type = $(el).attr('type') || 'video/mp4';
        if (src && src.includes('//')) {
            players.push({
                type: 'direct',
                name: `Direct Stream ${players.length + 1}`,
                url: src.startsWith('//') ? `https:${src}` : src,
                quality: 'Auto',
                format: type
            });
        }
    });

    // Extract from script variables (common in anime sites)
    const scriptContent = $('script').text();
    const videoUrlMatches = scriptContent.match(/(https?:\/\/[^\s"']+\.(mp4|m3u8|webm)[^\s"']*)/gi);
    if (videoUrlMatches) {
        videoUrlMatches.forEach(url => {
            players.push({
                type: 'direct',
                name: 'Direct Video',
                url: url,
                quality: 'HD',
                format: url.includes('.m3u8') ? 'hls' : 'mp4'
            });
        });
    }

    return players;
}

// Function to get episode list for an anime
async function getAnimeEpisodes(animeSlug) {
    try {
        const url = `https://watchanimeworld.in/anime/${animeSlug}/`;
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const $ = cheerio.load(response.data);
        const episodes = [];

        // Extract episodes from episode lists
        $('a[href*="/episode/"]').each((i, el) => {
            const href = $(el).attr('href');
            const title = $(el).text().trim();
            const episodeMatch = href.match(/episode\/([^\/]+)\//);
            
            if (episodeMatch && episodeMatch[1]) {
                episodes.push({
                    title,
                    episode_url: href,
                    slug: episodeMatch[1]
                });
            }
        });

        return episodes;
    } catch (error) {
        console.error('Error fetching episodes:', error.message);
        return [];
    }
}

// -------- API ENDPOINTS --------

// Main endpoint: Get anime episode with players
app.get('/api/anime/:tmdbId/:season/:episodeNum', async (req, res) => {
    const { tmdbId, season, episodeNum } = req.params;

    // Validate parameters
    if (!/^\d+$/.test(tmdbId)) {
        return res.status(400).json({ error: 'Invalid TMDB ID format' });
    }

    const seasonNum = parseInt(season);
    const episodeNumber = parseInt(episodeNum);

    if (isNaN(seasonNum) || isNaN(episodeNumber)) {
        return res.status(400).json({ error: 'Invalid season or episode number' });
    }

    try {
        // Find anime slug
        const animeSlug = await findAnimeSlug(tmdbId);
        
        if (!animeSlug) {
            return res.status(404).json({ 
                error: 'Anime not found on Animeworld',
                tmdb_id: tmdbId,
                suggestion: 'Try searching for the anime name first using /api/search/:name'
            });
        }

        // Try different episode URL formats
        const urlAttempts = [
            `https://watchanimeworld.in/episode/${animeSlug}-episode-${episodeNumber}/`,
            `https://watchanimeworld.in/episode/${animeSlug}-${seasonNum}x${episodeNumber}/`,
            `https://watchanimeworld.in/episode/${animeSlug}-${episodeNumber}/`,
            `https://watchanimeworld.in/episode/${animeSlug}-season-${seasonNum}-episode-${episodeNumber}/`
        ];

        let finalHtml = null;
        let finalUrl = '';

        for (const url of urlAttempts) {
            try {
                const cacheKey = `${animeSlug}-s${seasonNum}e${episodeNumber}`;
                if (episodeCache.has(cacheKey)) {
                    finalHtml = episodeCache.get(cacheKey).html;
                    finalUrl = episodeCache.get(cacheKey).url;
                    break;
                }

                const response = await axios.get(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Accept-Language': 'en-US,en;q=0.9'
                    },
                    timeout: 10000
                });
                
                if (response.status === 200) {
                    finalHtml = response.data;
                    finalUrl = url;
                    
                    // Cache the result
                    episodeCache.set(cacheKey, {
                        html: finalHtml,
                        url: finalUrl,
                        timestamp: Date.now()
                    });
                    break;
                }
            } catch (error) {
                continue;
            }
        }

        if (!finalHtml) {
            return res.status(404).json({ 
                error: 'Episode not found',
                tmdb_id: tmdbId,
                anime_slug: animeSlug,
                season: seasonNum,
                episode: episodeNumber
            });
        }

        const $ = cheerio.load(finalHtml);

        // Extract episode information
        const title = $('h1.entry-title').text().trim() || 
                     $('title').text().trim().split('|')[0] || 
                     `Episode ${episodeNumber}`;

        const description = $('div.entry-content p').first().text().trim() || 
                           $('.description').text().trim() || '';

        const thumbnail = $('.post-thumbnail img').attr('src') || 
                         $('.wp-post-image').attr('src') || 
                         '';

        // Extract video players
        const videoPlayers = extractVideoPlayers($);

        if (videoPlayers.length === 0) {
            return res.status(404).json({ 
                error: 'No video players found for this episode',
                tmdb_id: tmdbId,
                anime_slug: animeSlug
            });
        }

        // Get TMDB info for additional metadata
        const tmdbInfo = await getTMDBInfo(tmdbId);

        // Success response
        res.json({
            success: true,
            tmdb_id: tmdbId,
            anime_slug: animeSlug,
            season: seasonNum,
            episode: episodeNumber,
            title,
            description,
            thumbnail,
            anime_info: tmdbInfo ? {
                title: tmdbInfo.name,
                overview: tmdbInfo.overview,
                poster: tmdbInfo.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbInfo.poster_path}` : '',
                backdrop: tmdbInfo.backdrop_path ? `https://image.tmdb.org/t/p/w1280${tmdbInfo.backdrop_path}` : '',
                rating: tmdbInfo.vote_average,
                total_episodes: tmdbInfo.number_of_episodes,
                total_seasons: tmdbInfo.number_of_seasons
            } : null,
            video_players: videoPlayers,
            source_url: finalUrl,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Server error:', error.message);
        res.status(500).json({ 
            error: 'Failed to fetch episode details',
            message: error.message
        });
    }
});

// Search anime by name
app.get('/api/search/:query', async (req, res) => {
    const { query } = req.params;
    
    try {
        const searchUrl = `https://watchanimeworld.in/?s=${encodeURIComponent(query)}`;
        
        const response = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const $ = cheerio.load(response.data);
        const results = [];

        $('article').each((i, el) => {
            const title = $(el).find('h2 a').text().trim();
            const url = $(el).find('h2 a').attr('href');
            const image = $(el).find('img').attr('src');
            const desc = $(el).find('p').text().trim();

            if (title && url && url.includes('/anime/')) {
                const slugMatch = url.match(/\/anime\/([^\/]+)\//);
                if (slugMatch && slugMatch[1]) {
                    results.push({
                        title,
                        slug: slugMatch[1],
                        url,
                        image,
                        description: desc
                    });
                }
            }
        });

        res.json({
            query,
            results_count: results.length,
            results
        });

    } catch (error) {
        res.status(500).json({ error: 'Search failed', message: error.message });
    }
});

// Get anime info by TMDB ID
app.get('/api/anime-info/:tmdbId', async (req, res) => {
    const { tmdbId } = req.params;

    try {
        const animeSlug = await findAnimeSlug(tmdbId);
        if (!animeSlug) {
            return res.status(404).json({ error: 'Anime not found' });
        }

        const tmdbInfo = await getTMDBInfo(tmdbId);
        const episodes = await getAnimeEpisodes(animeSlug);

        res.json({
            tmdb_id: tmdbId,
            anime_slug: animeSlug,
            info: tmdbInfo,
            episodes_count: episodes.length,
            episodes: episodes.slice(0, 20) // First 20 episodes
        });

    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch anime info' });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK',
        server: 'AnimeWorld TMDB API',
        timestamp: new Date().toISOString(),
        cache_stats: {
            anime_mappings: animeMappingCache.size,
            episode_cache: episodeCache.size
        }
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'AnimeWorld TMDB API Server',
        version: '2.0',
        endpoints: {
            '/api/anime/:tmdbId/:season/:episode': 'Get episode with video players',
            '/api/search/:query': 'Search anime by name',
            '/api/anime-info/:tmdbId': 'Get anime information',
            '/health': 'Health check'
        },
        example: '/api/anime/31910/1/1'
    });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Anime API Server running on port ${PORT}`);
    console.log('📺 Endpoints:');
    console.log('   GET /api/anime/:tmdbId/:season/:episodeNum');
    console.log('   GET /api/search/:query');
    console.log('   GET /api/anime-info/:tmdbId');
    console.log('   GET /health');
});

module.exports = app;
