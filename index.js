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

// Predefined TMDB to Animeworld mappings
const animeMappings = {
    // Popular Anime
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
    
    // More Anime
    '60586': 'tokyo-revengers',
    '90447': 'blue-lock',
    '95403': 'hells-paradise',
    '88898': 'vinland-saga',
    '75219': 'haikyuu',
    '67478': 'dr-stone',
    '79008': 'the-promised-neverland',
    '86960': 'fire-force',
    '81774': 'black-clover',
    '68890': 'that-time-i-got-reincarnated-as-a-slime',
    
    // Additional Anime
    '92585': 'solo-leveling',
    '93812': 'frieren-beyond-journeys-end',
    '94801': 'the-apothecary-diaries',
    '95897': 'metallic-rouge',
    '96873': 'delicious-in-dungeon',
    
    // Classic Anime
    '1404': 'death-note',
    '1415': 'dragon-ball',
    '1416': 'dragon-ball-z',
    '1429': 'naruto',
    '46786': 'fullmetal-alchemist-brotherhood',
    '46260': 'hunter-x-hunter',
    '456': 'cowboy-bebop'
};

// Cache for dynamic mappings
const dynamicMappings = new Map();

// Function to search anime on Animeworld
async function searchAnimeOnAnimeworld(searchTerm) {
    try {
        const searchUrl = `https://watchanimeworld.in/?s=${encodeURIComponent(searchTerm)}`;
        
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
            const description = $(el).find('p').text().trim();
            
            if (title && url && url.includes('/anime/')) {
                const slugMatch = url.match(/\/anime\/([^\/]+)\//);
                if (slugMatch && slugMatch[1]) {
                    results.push({
                        title: title,
                        slug: slugMatch[1],
                        url: url,
                        image: image,
                        description: description
                    });
                }
            }
        });

        return results;
    } catch (error) {
        console.error('Search error:', error.message);
        return [];
    }
}

// Function to get anime slug from TMDB ID
async function getAnimeSlug(tmdbId) {
    // Check predefined mappings first
    if (animeMappings[tmdbId]) {
        return animeMappings[tmdbId];
    }
    
    // Check dynamic cache
    if (dynamicMappings.has(tmdbId)) {
        return dynamicMappings.get(tmdbId);
    }
    
    // Try to get anime name from TMDB API (optional)
    let animeName = '';
    try {
        const tmdbResponse = await axios.get(
            `https://api.themoviedb.org/3/tv/${tmdbId}`,
            {
                headers: {
                    'Authorization': `Bearer ${process.env.TMDB_TOKEN || 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkM2U1ZWRjYzU5MWVjMzEyY2JlYmJhYzE0ZTE2MmQxYSIsInN1YiI6IjY1N2FjYjQyYjU0MGQxMDExZTA0YjQ3OSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.6a6nRg8pBd2p2p2p2p2p2p2p2p2p2p2p2p2p2p2p2p'}`,
                    'Accept': 'application/json'
                },
                timeout: 5000
            }
        );
        animeName = tmdbResponse.data.name || '';
    } catch (error) {
        console.log('TMDB API not available, using direct search');
    }
    
    // Search on Animeworld
    const searchTerms = [
        animeName,
        `anime ${tmdbId}`,
        tmdbId.toString()
    ];
    
    for (const term of searchTerms) {
        if (!term) continue;
        
        const results = await searchAnimeOnAnimeworld(term);
        if (results.length > 0) {
            const slug = results[0].slug;
            dynamicMappings.set(tmdbId, slug);
            return slug;
        }
    }
    
    return null;
}

// Function to extract ALL video players and links
function extractAllVideoPlayers(html) {
    const $ = cheerio.load(html);
    const players = [];
    
    // 1. Extract iframe embeds (main servers)
    $('iframe').each((i, el) => {
        const src = $(el).attr('src');
        if (src && (src.includes('//') || src.includes('embed') || src.includes('video'))) {
            const fullUrl = src.startsWith('//') ? `https:${src}` : src;
            players.push({
                type: 'embed',
                server: `Server ${players.length + 1}`,
                url: fullUrl,
                quality: 'HD',
                format: 'iframe'
            });
        }
    });
    
    // 2. Extract videojs players
    $('video source').each((i, el) => {
        const src = $(el).attr('src');
        const type = $(el).attr('type') || 'video/mp4';
        if (src) {
            players.push({
                type: 'direct',
                server: `Direct Stream ${players.length + 1}`,
                url: src.startsWith('//') ? `https:${src}` : src,
                quality: 'Auto',
                format: type.includes('m3u8') ? 'hls' : 'mp4'
            });
        }
    });
    
    // 3. Extract from video tags
    $('video').each((i, el) => {
        const src = $(el).attr('src');
        if (src) {
            players.push({
                type: 'direct',
                server: `Video Tag ${players.length + 1}`,
                url: src.startsWith('//') ? `https:${src}` : src,
                quality: 'HD',
                format: 'mp4'
            });
        }
    });
    
    // 4. Extract from data-src, data-url attributes
    $('[data-src], [data-url]').each((i, el) => {
        const src = $(el).attr('data-src') || $(el).attr('data-url');
        if (src && src.includes('video')) {
            players.push({
                type: 'direct',
                server: `Data Source ${players.length + 1}`,
                url: src.startsWith('//') ? `https:${src}` : src,
                quality: 'HD',
                format: 'mp4'
            });
        }
    });
    
    // 5. Extract from script variables (advanced scraping)
    const scripts = $('script');
    scripts.each((i, el) => {
        const scriptContent = $(el).html();
        if (scriptContent) {
            // Look for video URLs in scripts
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
                        if (match.includes('http')) {
                            players.push({
                                type: 'script',
                                server: `Script Source ${players.length + 1}`,
                                url: match.replace(/file:\s*|src:\s*|["']/g, ''),
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

// Function to get episode direct links
async function getEpisodePlayers(animeSlug, season, episode) {
    const urlAttempts = [
        `https://watchanimeworld.in/episode/${animeSlug}-episode-${episode}/`,
        `https://watchanimeworld.in/episode/${animeSlug}-${season}x${episode}/`,
        `https://watchanimeworld.in/episode/${animeSlug}-${episode}/`,
        `https://watchanimeworld.in/episode/${animeSlug}-season-${season}-episode-${episode}/`,
        `https://watchanimeworld.in/episode/${animeSlug}-ep-${episode}/`
    ];
    
    for (const url of urlAttempts) {
        try {
            console.log(`Trying URL: ${url}`);
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Referer': 'https://watchanimeworld.in/',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
                },
                timeout: 10000
            });
            
            if (response.status === 200) {
                const players = extractAllVideoPlayers(response.data);
                
                if (players.length > 0) {
                    return {
                        success: true,
                        url: url,
                        players: players,
                        total_players: players.length
                    };
                }
            }
        } catch (error) {
            console.log(`Failed: ${url} - ${error.message}`);
            continue;
        }
    }
    
    return { success: false, players: [] };
}

// -------- API ENDPOINTS --------

// Main endpoint: Get anime episode with ALL players
app.get('/api/anime/:tmdbId/:season/:episode', async (req, res) => {
    const { tmdbId, season, episode } = req.params;
    
    console.log(`Fetching: TMDB ${tmdbId}, Season ${season}, Episode ${episode}`);
    
    // Validate parameters
    if (!/^\d+$/.test(tmdbId)) {
        return res.status(400).json({ error: 'Invalid TMDB ID format' });
    }
    
    const seasonNum = parseInt(season);
    const episodeNum = parseInt(episode);
    
    if (isNaN(seasonNum) || isNaN(episodeNum)) {
        return res.status(400).json({ error: 'Invalid season or episode number' });
    }
    
    try {
        // Get anime slug
        const animeSlug = await getAnimeSlug(tmdbId);
        
        if (!animeSlug) {
            return res.status(404).json({ 
                error: 'Anime not found on Animeworld',
                tmdb_id: tmdbId,
                suggestion: 'Try using a predefined TMDB ID like 31910 (One Piece) or 73223 (Naruto)'
            });
        }
        
        // Get episode players
        const episodeData = await getEpisodePlayers(animeSlug, seasonNum, episodeNum);
        
        if (!episodeData.success) {
            return res.status(404).json({ 
                error: 'No video players found for this episode',
                tmdb_id: tmdbId,
                anime_slug: animeSlug,
                season: seasonNum,
                episode: episodeNum
            });
        }
        
        // Get additional episode info
        let episodeInfo = {};
        try {
            const response = await axios.get(episodeData.url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            
            const $ = cheerio.load(response.data);
            episodeInfo = {
                title: $('h1.entry-title').text().trim() || `Episode ${episodeNum}`,
                description: $('div.entry-content p').first().text().trim() || '',
                thumbnail: $('.post-thumbnail img').attr('src') || $('.wp-post-image').attr('src') || ''
            };
        } catch (infoError) {
            episodeInfo = {
                title: `Episode ${episodeNum}`,
                description: '',
                thumbnail: ''
            };
        }
        
        // Success response with ALL players
        res.json({
            success: true,
            tmdb_id: tmdbId,
            anime_slug: animeSlug,
            season: seasonNum,
            episode: episodeNum,
            title: episodeInfo.title,
            description: episodeInfo.description,
            thumbnail: episodeInfo.thumbnail,
            source_url: episodeData.url,
            total_players: episodeData.players.length,
            players: episodeData.players,
            available_servers: episodeData.players.map(p => p.server),
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

// Search anime by name
app.get('/api/search/:query', async (req, res) => {
    const { query } = req.params;
    
    try {
        const results = await searchAnimeOnAnimeworld(query);
        
        res.json({
            query: query,
            results_count: results.length,
            results: results
        });
        
    } catch (error) {
        res.status(500).json({ error: 'Search failed', message: error.message });
    }
});

// Get all predefined mappings
app.get('/api/mappings', (req, res) => {
    res.json({
        total_mappings: Object.keys(animeMappings).length,
        mappings: animeMappings
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK',
        server: 'AnimeWorld TMDB API',
        timestamp: new Date().toISOString(),
        total_predefined_mappings: Object.keys(animeMappings).length,
        dynamic_mappings: dynamicMappings.size
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: '🎌 AnimeWorld TMDB API - Complete Player Links',
        version: '3.0',
        description: 'Fetches ALL video players and direct links from Animeworld',
        endpoints: {
            '/api/anime/:tmdbId/:season/:episode': 'Get episode with ALL video players',
            '/api/search/:query': 'Search anime by name',
            '/api/mappings': 'Get all predefined TMDB mappings',
            '/health': 'Health check'
        },
        examples: {
            one_piece: '/api/anime/31910/1/1',
            naruto: '/api/anime/73223/1/1',
            attack_on_titan: '/api/anime/46298/1/1'
        },
        supported_players: ['iframe', 'direct mp4', 'hls', 'embed', 'script sources']
    });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Anime API Server running on port ${PORT}`);
    console.log('📺 Endpoints:');
    console.log('   GET /api/anime/:tmdbId/:season/:episode');
    console.log('   GET /api/search/:query');
    console.log('   GET /api/mappings');
    console.log('   GET /health');
    console.log('');
    console.log('🎬 Example: http://localhost:3000/api/anime/31910/1/1');
});

module.exports = app;
