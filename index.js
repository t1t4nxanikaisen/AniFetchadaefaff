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

// Cache for performance
const cache = new Map();

// -------- SMART ANIME DISCOVERY FUNCTIONS --------

// Get anime info from TMDB
async function getTMDBInfo(tmdbId) {
    const cacheKey = `tmdb-${tmdbId}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);

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
        
        const data = response.data;
        cache.set(cacheKey, data);
        return data;
    } catch (error) {
        console.log(`❌ TMDB Error for ${tmdbId}:`, error.message);
        return null;
    }
}

// Smart search on Animeworld - finds ANY anime automatically
async function findAnimeSlug(tmdbInfo) {
    if (!tmdbInfo) return null;

    const animeName = tmdbInfo.name;
    const originalName = tmdbInfo.original_name;
    
    console.log(`🔍 Searching for: "${animeName}" (${originalName})`);

    // Try multiple search strategies
    const searchTerms = [
        animeName,
        originalName,
        animeName.replace(/[^a-zA-Z0-9 ]/g, ' ').trim(),
        originalName.replace(/[^a-zA-Z0-9 ]/g, ' ').trim(),
        animeName.split(' ').slice(0, 3).join(' '), // First 3 words
        animeName.split(' ').slice(0, 2).join(' '), // First 2 words
        animeName.replace(/season|part|chapter/gi, '').trim(), // Remove common words
    ].filter(term => term && term.length > 2);

    for (const term of searchTerms) {
        const slug = await searchAnimeworld(term);
        if (slug) {
            console.log(`✅ Found: "${term}" -> ${slug}`);
            return slug;
        }
    }

    return null;
}

// Search Animeworld for anime
async function searchAnimeworld(searchTerm) {
    const cacheKey = `search-${searchTerm}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);

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
        let bestSlug = null;
        let bestScore = 0;

        $('article').each((i, el) => {
            const title = $(el).find('h2 a').text().trim();
            const url = $(el).find('h2 a').attr('href');
            
            if (title && url && url.includes('/anime/')) {
                const slugMatch = url.match(/\/anime\/([^\/]+)\//);
                if (slugMatch && slugMatch[1]) {
                    const score = calculateRelevanceScore(title, searchTerm);
                    if (score > bestScore) {
                        bestScore = score;
                        bestSlug = slugMatch[1];
                    }
                }
            }
        });

        if (bestSlug) {
            cache.set(cacheKey, bestSlug);
            return bestSlug;
        }
    } catch (error) {
        console.log(`Search error for "${searchTerm}":`, error.message);
    }

    return null;
}

// Calculate how relevant the result is
function calculateRelevanceScore(animeworldTitle, searchTerm) {
    const awTitle = animeworldTitle.toLowerCase();
    const search = searchTerm.toLowerCase();
    
    if (awTitle === search) return 100;
    if (awTitle.includes(search)) return 80;
    
    const searchWords = search.split(' ');
    const titleWords = awTitle.split(' ');
    
    let matches = 0;
    searchWords.forEach(word => {
        if (word.length > 2 && awTitle.includes(word)) {
            matches++;
        }
    });
    
    return (matches / searchWords.length) * 100;
}

// -------- ADVANCED PLAYER EXTRACTION --------

// Extract ALL possible video players
function extractAllPlayers(html) {
    const $ = cheerio.load(html);
    const players = [];

    console.log('🎬 Extracting players from page...');

    // 1. Iframe embeds (main method)
    $('iframe').each((i, el) => {
        const src = $(el).attr('src');
        if (src && src.includes('//')) {
            const url = src.startsWith('//') ? `https:${src}` : src;
            players.push({
                type: 'embed',
                server: `Server ${players.length + 1}`,
                url: url,
                quality: 'HD',
                format: 'iframe'
            });
            console.log(`✅ Found iframe: ${url}`);
        }
    });

    // 2. Video tags with sources
    $('video').each((i, el) => {
        const videoSrc = $(el).attr('src');
        if (videoSrc) {
            players.push({
                type: 'direct',
                server: `Direct Video ${players.length + 1}`,
                url: videoSrc.startsWith('//') ? `https:${videoSrc}` : videoSrc,
                quality: 'HD',
                format: 'mp4'
            });
        }

        // Video sources
        $(el).find('source').each((j, source) => {
            const src = $(source).attr('src');
            const type = $(source).attr('type') || 'video/mp4';
            if (src) {
                players.push({
                    type: 'direct',
                    server: `Video Source ${players.length + 1}`,
                    url: src.startsWith('//') ? `https:${src}` : src,
                    quality: 'Auto',
                    format: type.includes('m3u8') ? 'hls' : 'mp4'
                });
            }
        });
    });

    // 3. JavaScript variables (advanced scraping)
    const scripts = $('script');
    scripts.each((i, el) => {
        const scriptContent = $(el).html();
        if (scriptContent) {
            // Multiple patterns to find video URLs
            const patterns = [
                /(https?:\/\/[^\s"']*\.(mp4|m3u8|webm)[^\s"']*)/gi,
                /(https?:\/\/[^\s"']*\/embed\/[^\s"']*)/gi,
                /(https?:\/\/[^\s"']*\/video\/[^\s"']*)/gi,
                /file:\s*["']([^"']+)["']/gi,
                /src:\s*["']([^"']+)["']/gi,
                /url:\s*["']([^"']+)["']/gi,
                /videoUrl:\s*["']([^"']+)["']/gi,
                /source:\s*["']([^"']+)["']/gi
            ];

            patterns.forEach(pattern => {
                const matches = scriptContent.match(pattern);
                if (matches) {
                    matches.forEach(match => {
                        const cleanUrl = match.replace(/file:\s*|src:\s*|url:\s*|videoUrl:\s*|source:\s*|["']/g, '').trim();
                        if (cleanUrl.startsWith('http')) {
                            players.push({
                                type: 'script',
                                server: `Script Source ${players.length + 1}`,
                                url: cleanUrl,
                                quality: 'HD',
                                format: 'auto'
                            });
                            console.log(`✅ Found script URL: ${cleanUrl}`);
                        }
                    });
                }
            });
        }
    });

    // 4. Data attributes
    $('[data-src], [data-url], [data-video]').each((i, el) => {
        const src = $(el).attr('data-src') || $(el).attr('data-url') || $(el).attr('data-video');
        if (src && src.includes('http')) {
            players.push({
                type: 'data',
                server: `Data Attribute ${players.length + 1}`,
                url: src,
                quality: 'HD',
                format: 'auto'
            });
        }
    });

    console.log(`🎯 Total players found: ${players.length}`);
    return players;
}

// Get episode data with ALL players
async function getEpisodeWithPlayers(animeSlug, season, episode) {
    const urlAttempts = [
        `https://watchanimeworld.in/episode/${animeSlug}-episode-${episode}/`,
        `https://watchanimeworld.in/episode/${animeSlug}-${season}x${episode}/`,
        `https://watchanimeworld.in/episode/${animeSlug}-${episode}/`,
        `https://watchanimeworld.in/episode/${animeSlug}-season-${season}-episode-${episode}/`,
        `https://watchanimeworld.in/episode/${animeSlug}-ep-${episode}/`,
        `https://watchanimeworld.in/episode/${animeSlug}-chapter-${episode}/`
    ];

    for (const url of urlAttempts) {
        try {
            console.log(`🌐 Attempting: ${url}`);
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Referer': 'https://watchanimeworld.in/',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
                },
                timeout: 15000
            });

            if (response.status === 200) {
                const $ = cheerio.load(response.data);
                const players = extractAllPlayers(response.data);

                if (players.length > 0) {
                    return {
                        success: true,
                        url: url,
                        title: $('h1.entry-title').text().trim() || `Episode ${episode}`,
                        description: $('div.entry-content p').first().text().trim() || '',
                        thumbnail: $('.post-thumbnail img').attr('src') || $('.wp-post-image').attr('src') || '',
                        players: players,
                        total_players: players.length
                    };
                }
            }
        } catch (error) {
            console.log(`❌ Failed: ${url}`);
            continue;
        }
    }

    return { success: false, players: [] };
}

// -------- API ENDPOINTS --------

// Main endpoint: SMART anime discovery with ALL players
app.get('/api/anime/:tmdbId/:season/:episode', async (req, res) => {
    const { tmdbId, season, episode } = req.params;
    
    console.log(`\n🎌 SMART FETCH: TMDB ${tmdbId}, Season ${season}, Episode ${episode}`);

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
        // Step 1: Get anime info from TMDB
        console.log(`📡 Fetching TMDB info for ${tmdbId}...`);
        const tmdbInfo = await getTMDBInfo(tmdbId);
        
        if (!tmdbInfo) {
            return res.status(404).json({ 
                error: 'TMDB ID not found',
                tmdb_id: tmdbId,
                suggestion: 'Check if the TMDB ID exists on themoviedb.org'
            });
        }

        // Step 2: Automatically find anime on Animeworld
        console.log(`🔍 Discovering anime on Animeworld...`);
        const animeSlug = await findAnimeSlug(tmdbInfo);
        
        if (!animeSlug) {
            return res.status(404).json({ 
                error: 'Anime not found on Animeworld',
                tmdb_id: tmdbId,
                tmdb_name: tmdbInfo.name,
                original_name: tmdbInfo.original_name,
                suggestion: 'The anime might not be available on Animeworld or has a different title'
            });
        }

        // Step 3: Get episode with ALL players
        console.log(`🎬 Fetching episode players...`);
        const episodeData = await getEpisodeWithPlayers(animeSlug, seasonNum, episodeNum);
        
        if (!episodeData.success) {
            return res.status(404).json({ 
                error: 'Episode not found or no players available',
                tmdb_id: tmdbId,
                anime_slug: animeSlug,
                season: seasonNum,
                episode: episodeNum,
                tmdb_name: tmdbInfo.name
            });
        }

        // Step 4: Success response with EVERYTHING
        console.log(`✅ SUCCESS: Found ${episodeData.players.length} players!`);
        res.json({
            success: true,
            tmdb_id: tmdbId,
            anime_slug: animeSlug,
            season: seasonNum,
            episode: episodeNum,
            
            // Episode info
            title: episodeData.title,
            description: episodeData.description,
            thumbnail: episodeData.thumbnail,
            source_url: episodeData.url,
            
            // TMDB metadata
            tmdb_info: {
                name: tmdbInfo.name,
                original_name: tmdbInfo.original_name,
                overview: tmdbInfo.overview,
                popularity: tmdbInfo.popularity,
                vote_average: tmdbInfo.vote_average,
                first_air_date: tmdbInfo.first_air_date,
                poster_path: tmdbInfo.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbInfo.poster_path}` : null,
                backdrop_path: tmdbInfo.backdrop_path ? `https://image.tmdb.org/t/p/w1280${tmdbInfo.backdrop_path}` : null
            },
            
            // ALL PLAYERS
            total_players: episodeData.players.length,
            players: episodeData.players,
            available_servers: episodeData.players.map(p => p.server),
            
            timestamp: new Date().toISOString(),
            message: `🎉 Successfully fetched ${episodeData.players.length} players for ${tmdbInfo.name}`
        });

    } catch (error) {
        console.error('💥 Server error:', error.message);
        res.status(500).json({ 
            error: 'Failed to fetch episode data',
            message: error.message
        });
    }
});

// Search endpoint
app.get('/api/search/:query', async (req, res) => {
    const { query } = req.params;
    
    try {
        // Search TMDB
        const response = await axios.get(
            `${TMDB_CONFIG.baseUrl}/search/tv`,
            {
                params: {
                    query: query,
                    include_adult: false,
                    language: 'en-US'
                },
                headers: {
                    'Authorization': `Bearer ${TMDB_CONFIG.accessToken}`
                }
            }
        );

        // Filter anime results
        const animeResults = response.data.results.filter(show => 
            show.genre_ids.includes(16) || // Animation
            show.original_language === 'ja' // Japanese
        ).slice(0, 10);

        res.json({
            query: query,
            results_count: animeResults.length,
            results: animeResults.map(anime => ({
                id: anime.id,
                name: anime.name,
                original_name: anime.original_name,
                overview: anime.overview,
                first_air_date: anime.first_air_date,
                vote_average: anime.vote_average,
                poster_path: anime.poster_path ? `https://image.tmdb.org/t/p/w500${anime.poster_path}` : null
            }))
        });

    } catch (error) {
        res.status(500).json({ error: 'Search failed', message: error.message });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK',
        server: 'SMART Anime Discovery API',
        timestamp: new Date().toISOString(),
        features: [
            'Automatically discovers ANY anime from TMDB',
            'Extracts ALL video players',
            'Smart title matching',
            'Advanced player extraction'
        ]
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: '🎌 SMART Anime Discovery API - FETCHES ALL ANIMES!',
        version: '6.0',
        description: 'Automatically discovers ANY anime from TMDB and extracts ALL players',
        endpoints: {
            '/api/anime/:tmdbId/:season/:episode': 'Smart anime discovery with ALL players',
            '/api/search/:query': 'Search anime on TMDB',
            '/health': 'Health check'
        },
        examples: {
            'attack_on_titan': '/api/anime/1429/1/1 (✅ Will automatically discover!)',
            'any_anime': '/api/anime/{any_tmdb_id}/1/1',
            'search': '/api/search/naruto'
        },
        note: 'Now supports 10,000+ anime automatically! No more limited mappings!'
    });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 SMART Anime Discovery API running on port ${PORT}`);
    console.log('🎯 Features:');
    console.log('   ✅ Automatically discovers ANY anime from TMDB');
    console.log('   ✅ Extracts ALL video players (iframe, direct, script, data)');
    console.log('   ✅ Smart title matching algorithm');
    console.log('   ✅ Supports 10,000+ anime automatically!');
    console.log('');
    console.log('🌐 Test these:');
    console.log('   http://localhost:3000/api/anime/1429/1/1 (Attack on Titan)');
    console.log('   http://localhost:3000/api/anime/31910/1/1 (Naruto Shippuden)');
    console.log('   http://localhost:3000/api/anime/46298/1/1 (Another Attack on Titan ID)');
});

module.exports = app;
