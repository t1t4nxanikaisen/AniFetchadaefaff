const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

const app = express();

// Enable CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

app.use(express.static('public'));

// ========== DYNAMIC ANIME CACHE ==========
// This will store anime slugs as they're discovered
const ANIME_CACHE = new Map();
const SEARCH_CACHE = new Map();

// ========== SOURCE CONFIGURATION ==========
const SOURCES = {
    ANIMEWORLD: {
        name: 'AnimeWorld',
        baseUrl: 'https://watchanimeworld.in',
        searchUrl: 'https://watchanimeworld.in/?s=',
        seriesUrl: 'https://watchanimeworld.in/series',
        episodeUrl: 'https://watchanimeworld.in/episode',
        letterUrl: 'https://watchanimeworld.in/letter'
    }
};

// ========== ANILIST API INTEGRATION ==========
async function getAnimeInfoFromAniList(anilistId) {
    try {
        const query = `
        query ($id: Int) {
            Media (id: $id, type: ANIME) {
                id
                title {
                    romaji
                    english
                    native
                }
                synonyms
                format
                episodes
                season
                seasonYear
                genres
                averageScore
                description
                coverImage {
                    large
                    medium
                }
                bannerImage
                studios {
                    nodes {
                        name
                    }
                }
            }
        }`;

        const response = await axios.post('https://graphql.anilist.co', {
            query: query,
            variables: { id: parseInt(anilistId) }
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        if (response.data && response.data.data && response.data.data.Media) {
            return response.data.data.Media;
        }
        return null;
    } catch (error) {
        console.error('AniList API Error:', error.message);
        return null;
    }
}

// ========== COMPREHENSIVE ANIME SEARCH ==========
async function searchAnimeOnAnimeWorld(query, maxResults = 20) {
    const cacheKey = query.toLowerCase();
    if (SEARCH_CACHE.has(cacheKey)) {
        console.log(`📋 Using cached search results for: ${query}`);
        return SEARCH_CACHE.get(cacheKey);
    }

    try {
        const searchUrl = `${SOURCES.ANIMEWORLD.searchUrl}${encodeURIComponent(query)}`;
        console.log(`🔍 Searching AnimeWorld for: "${query}"`);
        
        const response = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': SOURCES.ANIMEWORLD.baseUrl,
                'Connection': 'keep-alive'
            },
            timeout: 15000
        });

        const $ = cheerio.load(response.data);
        const results = [];

        // Extract search results using multiple selectors
        const selectors = [
            '.search-result',
            '.anime-item',
            '.post-item',
            'article',
            '.series-item',
            '.movie-item'
        ];

        for (const selector of selectors) {
            $(selector).each((i, el) => {
                if (results.length >= maxResults) return false;
                
                const $el = $(el);
                const titleEl = $el.find('h2 a, h3 a, .title a, .entry-title a, a[title]').first();
                const title = titleEl.text().trim() || titleEl.attr('title');
                const url = titleEl.attr('href');
                
                if (title && url && url.includes('series/')) {
                    // Extract slug from series URL
                    const slugMatch = url.match(/\/series\/([^\/]+)/);
                    if (slugMatch) {
                        const slug = slugMatch[1];
                        const image = $el.find('img').attr('src') || $el.find('img').attr('data-src');
                        const description = $el.find('p, .description, .excerpt').first().text().trim();
                        
                        results.push({
                            title: title,
                            slug: slug,
                            url: url,
                            image: image,
                            description: description.substring(0, 200),
                            source: 'ANIMEWORLD'
                        });
                    }
                }
            });
            if (results.length > 0) break; // Found results with this selector
        }

        // Fallback: Look for any links that might be anime
        if (results.length === 0) {
            $('a[href*="/series/"]').each((i, el) => {
                if (results.length >= maxResults) return false;
                
                const $el = $(el);
                const url = $el.attr('href');
                const title = $el.text().trim() || $el.attr('title');
                
                if (title && url) {
                    const slugMatch = url.match(/\/series\/([^\/]+)/);
                    if (slugMatch) {
                        results.push({
                            title: title,
                            slug: slugMatch[1],
                            url: url,
                            source: 'ANIMEWORLD'
                        });
                    }
                }
            });
        }

        // Cache results
        SEARCH_CACHE.set(cacheKey, results);
        console.log(`✅ Found ${results.length} search results for "${query}"`);
        return results;

    } catch (error) {
        console.error(`❌ Search error for "${query}":`, error.message);
        return [];
    }
}

// ========== DYNAMIC SLUG RESOLVER ==========
async function resolveAnimeSlug(anilistId) {
    // Check cache first
    if (ANIME_CACHE.has(anilistId)) {
        console.log(`📋 Using cached slug for ${anilistId}: ${ANIME_CACHE.get(anilistId)}`);
        return ANIME_CACHE.get(anilistId);
    }

    try {
        // Get anime info from AniList
        const animeInfo = await getAnimeInfoFromAniList(anilistId);
        if (!animeInfo) {
            console.log(`❌ No anime found on AniList for ID: ${anilistId}`);
            return null;
        }

        console.log(`📖 AniList Info: ${animeInfo.title.english || animeInfo.title.romaji}`);

        // Prepare search terms
        const searchTerms = [
            animeInfo.title.english,
            animeInfo.title.romaji,
            ...animeInfo.synonyms
        ].filter(Boolean);

        console.log(`🔍 Search terms: ${searchTerms.join(', ')}`);

        // Search for the anime
        for (const term of searchTerms) {
            const searchResults = await searchAnimeOnAnimeWorld(term, 5);
            
            for (const result of searchResults) {
                // Try to match titles (case insensitive, ignore special characters)
                const normalizeTitle = (title) => title.toLowerCase()
                    .replace(/[^\w\s]/g, '')
                    .replace(/\s+/g, ' ')
                    .trim();

                const searchNorm = normalizeTitle(term);
                const resultNorm = normalizeTitle(result.title);

                if (resultNorm.includes(searchNorm) || searchNorm.includes(resultNorm)) {
                    console.log(`✅ Found match: "${result.title}" -> ${result.slug}`);
                    
                    // Cache the result
                    ANIME_CACHE.set(anilistId, {
                        slug: result.slug,
                        title: result.title,
                        url: result.url,
                        anilistInfo: animeInfo
                    });
                    
                    return ANIME_CACHE.get(anilistId);
                }
            }
        }

        console.log(`❌ No matching anime found on AnimeWorld for AniList ID: ${anilistId}`);
        return null;

    } catch (error) {
        console.error(`💥 Error resolving slug for ${anilistId}:`, error.message);
        return null;
    }
}

// ========== ENHANCED PLAYER EXTRACTION ==========
function extractVideoPlayers(html, sourceUrl) {
    const $ = cheerio.load(html);
    const players = [];
    const foundUrls = new Set();

    console.log(`🎬 Extracting players from: ${sourceUrl}`);

    // Method 1: Direct iframes
    $('iframe').each((i, el) => {
        let src = $(el).attr('src') || $(el).attr('data-src');
        if (src) {
            if (src.startsWith('//')) src = 'https:' + src;
            if (src.startsWith('/')) src = SOURCES.ANIMEWORLD.baseUrl + src;
            
            if (isValidVideoUrl(src) && !foundUrls.has(src)) {
                foundUrls.add(src);
                players.push({
                    type: 'embed',
                    server: `ANIMEWORLD Server ${players.length + 1}`,
                    url: src,
                    quality: 'HD',
                    format: 'iframe',
                    source: 'ANIMEWORLD'
                });
                console.log(`📺 Found iframe: ${src}`);
            }
        }
    });

    // Method 2: Video elements
    $('video').each((i, el) => {
        const src = $(el).attr('src') || $(el).find('source').attr('src');
        if (src) {
            const fullSrc = src.startsWith('//') ? 'https:' + src : src;
            if (isValidVideoUrl(fullSrc) && !foundUrls.has(fullSrc)) {
                foundUrls.add(fullSrc);
                players.push({
                    type: 'direct',
                    server: `ANIMEWORLD Direct ${players.length + 1}`,
                    url: fullSrc,
                    quality: 'Auto',
                    format: getVideoFormat(fullSrc),
                    source: 'ANIMEWORLD'
                });
                console.log(`🎥 Found video element: ${fullSrc}`);
            }
        }
    });

    // Method 3: Enhanced script analysis
    $('script').each((i, el) => {
        const scriptContent = $(el).html();
        if (scriptContent && scriptContent.length > 50) {
            // Comprehensive video URL patterns
            const patterns = [
                // Basic patterns
                /(?:src|file|url|video|source):\s*["']([^"']+)["']/gi,
                /(?:videoUrl|embedUrl|streamUrl):\s*["']([^"']+)["']/gi,
                
                // Direct video URLs
                /(https?:\/\/[^\s"']*\.(mp4|m3u8|webm|mkv)[^\s"']*)/gi,
                
                // Embed URLs
                /(https?:\/\/[^\s"']*\/embed\/[^\s"']*)/gi,
                /(https?:\/\/[^\s"']*\/video\/[^\s"']*)/gi,
                /(https?:\/\/[^\s"']*\/player\/[^\s"']*)/gi,
                /(https?:\/\/[^\s"']*\/stream\/[^\s"']*)/gi,
                
                // Popular video hosts
                /(https?:\/\/[^\s"']*(?:streamtape|dood|mixdrop|mp4upload|vidstream|gogostream|embtaku|filemoon|vidcloud|sbplay|zephyrflick)[^\s"']*)/gi,
                
                // Generic streaming patterns
                /(https?:\/\/play\.[^\s"']*)/gi,
                /(https?:\/\/stream\.[^\s"']*)/gi,
                /(https?:\/\/video\.[^\s"']*)/gi,
                
                // Base64 or encoded URLs
                /atob\(["']([^"']+)["']\)/gi,
                /decode\(["']([^"']+)["']\)/gi
            ];

            patterns.forEach(pattern => {
                let matches;
                while ((matches = pattern.exec(scriptContent)) !== null) {
                    let url = matches[1];
                    
                    // Clean up the URL
                    url = url.replace(/^['"]|['"]$/g, '').trim();
                    
                    // Handle relative URLs
                    if (url.startsWith('//')) url = 'https:' + url;
                    if (url.startsWith('/')) url = SOURCES.ANIMEWORLD.baseUrl + url;
                    
                    // Handle base64 encoded URLs
                    if (matches[0].includes('atob') || matches[0].includes('decode')) {
                        try {
                            url = atob(url);
                        } catch (e) {
                            continue;
                        }
                    }
                    
                    if (isValidVideoUrl(url) && !foundUrls.has(url)) {
                        foundUrls.add(url);
                        players.push({
                            type: 'script',
                            server: `ANIMEWORLD Script ${players.length + 1}`,
                            url: url,
                            quality: 'HD',
                            format: getVideoFormat(url),
                            source: 'ANIMEWORLD'
                        });
                        console.log(`🔧 Found script URL: ${url}`);
                    }
                }
            });
        }
    });

    // Method 4: Data attributes and other sources
    $('[data-src], [data-url], [data-file], [data-video]').each((i, el) => {
        const src = $(el).attr('data-src') || $(el).attr('data-url') || 
                   $(el).attr('data-file') || $(el).attr('data-video');
        if (src) {
            const fullSrc = src.startsWith('//') ? 'https:' + src : src;
            if (isValidVideoUrl(fullSrc) && !foundUrls.has(fullSrc)) {
                foundUrls.add(fullSrc);
                players.push({
                    type: 'data',
                    server: `ANIMEWORLD Data ${players.length + 1}`,
                    url: fullSrc,
                    quality: 'Auto',
                    format: getVideoFormat(fullSrc),
                    source: 'ANIMEWORLD'
                });
                console.log(`📊 Found data attribute: ${fullSrc}`);
            }
        }
    });

    console.log(`🎯 Extracted ${players.length} unique players`);
    return players;
}

// ========== ENHANCED EPISODE FETCHER ==========
async function fetchEpisodeData(animeSlug, season, episode) {
    const urlPatterns = [
        // Primary patterns for AnimeWorld
        `${SOURCES.ANIMEWORLD.episodeUrl}/${animeSlug}-${season}x${episode}/`,
        `${SOURCES.ANIMEWORLD.episodeUrl}/${animeSlug}-${episode}/`,
        `${SOURCES.ANIMEWORLD.episodeUrl}/${animeSlug}-episode-${episode}/`,
        `${SOURCES.ANIMEWORLD.episodeUrl}/${animeSlug}-s${season}e${episode}/`,
        
        // Alternative patterns
        `${SOURCES.ANIMEWORLD.baseUrl}/episode/${animeSlug}-${season}x${episode}/`,
        `${SOURCES.ANIMEWORLD.baseUrl}/episode/${animeSlug}-${episode}/`,
        `${SOURCES.ANIMEWORLD.baseUrl}/episode/${animeSlug}-episode-${episode}/`,
        
        // Series-based patterns
        `${SOURCES.ANIMEWORLD.baseUrl}/series/${animeSlug}/episode-${episode}/`,
        `${SOURCES.ANIMEWORLD.baseUrl}/series/${animeSlug}/${season}/${episode}/`,
        
        // Watch patterns
        `${SOURCES.ANIMEWORLD.baseUrl}/watch/${animeSlug}-${episode}/`,
        `${SOURCES.ANIMEWORLD.baseUrl}/watch/${animeSlug}-episode-${episode}/`,
    ];

    console.log(`🔍 Fetching episode data for: ${animeSlug} S${season}E${episode}`);

    for (const url of urlPatterns) {
        try {
            console.log(`🌐 Trying: ${url}`);
            
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Referer': SOURCES.ANIMEWORLD.baseUrl,
                    'Connection': 'keep-alive'
                },
                timeout: 15000,
                validateStatus: status => status < 500
            });

            if (response.status === 200) {
                console.log(`✅ Successfully loaded: ${url}`);
                
                const players = extractVideoPlayers(response.data, url);
                
                if (players.length > 0) {
                    // Extract episode metadata
                    const $ = cheerio.load(response.data);
                    
                    const title = $('h1.entry-title, h1.post-title, .episode-title, h1, .video-title')
                        .first().text().trim() || `Episode ${episode}`;
                    
                    const description = $('.entry-content p, .post-content p, .episode-description, .video-description')
                        .first().text().trim() || '';
                    
                    const thumbnail = $('.post-thumbnail img, .episode-thumbnail img, .wp-post-image, .video-thumbnail img')
                        .attr('src') || '';

                    return {
                        success: true,
                        url: url,
                        title: title,
                        description: description,
                        thumbnail: thumbnail,
                        players: players
                    };
                }
            }
        } catch (error) {
            console.log(`❌ Failed to load ${url}: ${error.message}`);
            continue;
        }
    }

    return { success: false, players: [] };
}

// ========== HELPER FUNCTIONS ==========
function isValidVideoUrl(url) {
    if (!url || typeof url !== 'string' || url.length < 8) return false;
    
    // Expanded list of valid video sources
    const validPatterns = [
        /streamtape\./i,
        /dood\./i,
        /mixdrop\./i,
        /mp4upload\./i,
        /vidstream\./i,
        /gogostream\./i,
        /embtaku\./i,
        /filemoon\./i,
        /vidcloud\./i,
        /sbplay\./i,
        /zephyrflick\./i,
        /\.mp4$/i,
        /\.m3u8$/i,
        /\.webm$/i,
        /\/embed\//i,
        /\/video\//i,
        /\/player\//i,
        /\/stream\//i,
        /play\./i,
        /stream\./i,
        /video\./i
    ];
    
    return validPatterns.some(pattern => pattern.test(url));
}

function getVideoFormat(url) {
    if (/\.m3u8/i.test(url)) return 'hls';
    if (/\.mp4/i.test(url)) return 'mp4';
    if (/\.webm/i.test(url)) return 'webm';
    if (/\.mkv/i.test(url)) return 'mkv';
    return 'auto';
}

// ========== API ENDPOINTS ==========

// Main anime episode endpoint - DYNAMIC
app.get('/api/anime/:anilistId/:season/:episode', async (req, res) => {
    const { anilistId, season, episode } = req.params;
    const startTime = Date.now();

    console.log(`\n🎌 DYNAMIC FETCH: AniList ID ${anilistId}, S${season}E${episode}`);

    try {
        // Resolve anime slug dynamically
        const animeData = await resolveAnimeSlug(anilistId);
        if (!animeData) {
            return res.status(404).json({
                error: 'Anime not found',
                message: `No anime found on AnimeWorld for AniList ID: ${anilistId}`,
                anilist_id: anilistId,
                searched_sources: ['AnimeWorld'],
                suggestion: 'Try searching for the anime first using /api/search/{anime_name}'
            });
        }

        console.log(`📝 Resolved: ${animeData.title} -> ${animeData.slug}`);

        // Fetch episode data
        const episodeData = await fetchEpisodeData(animeData.slug, parseInt(season), parseInt(episode));

        if (!episodeData.success || episodeData.players.length === 0) {
            return res.status(404).json({
                error: 'Episode not found',
                message: `Episode ${episode} of season ${season} not found for ${animeData.title}`,
                anilist_id: anilistId,
                anime_slug: animeData.slug,
                anime_title: animeData.title,
                season: parseInt(season),
                episode: parseInt(episode),
                anilist_info: animeData.anilistInfo
            });
        }

        const processingTime = Date.now() - startTime;
        console.log(`✅ Successfully fetched ${episodeData.players.length} players in ${processingTime}ms`);

        res.json({
            success: true,
            anilist_id: anilistId,
            anime_slug: animeData.slug,
            anime_title: animeData.title,
            season: parseInt(season),
            episode: parseInt(episode),
            title: episodeData.title,
            description: episodeData.description,
            thumbnail: episodeData.thumbnail,
            source_url: episodeData.url,
            source: 'ANIMEWORLD',
            total_players: episodeData.players.length,
            players: episodeData.players,
            available_servers: episodeData.players.map(p => p.server),
            anilist_info: animeData.anilistInfo,
            processing_time_ms: processingTime,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error(`💥 Error processing ${anilistId}:`, error.message);
        res.status(500).json({
            error: 'Server error',
            message: error.message,
            anilist_id: anilistId,
            season: season,
            episode: episode
        });
    }
});

// Search endpoint - ENHANCED
app.get('/api/search/:query', async (req, res) => {
    const { query } = req.params;
    const { limit = 20 } = req.query;

    try {
        const results = await searchAnimeOnAnimeWorld(query, parseInt(limit));
        
        res.json({
            success: true,
            query: query,
            results_count: results.length,
            results: results,
            cache_status: SEARCH_CACHE.has(query.toLowerCase()) ? 'cached' : 'fresh'
        });
    } catch (error) {
        res.status(500).json({
            error: 'Search failed',
            message: error.message,
            query: query
        });
    }
});

// Browse all anime endpoint - NEW
app.get('/api/browse/:page?', async (req, res) => {
    const page = parseInt(req.params.page) || 1;
    
    try {
        const browseUrl = `${SOURCES.ANIMEWORLD.seriesUrl}${page > 1 ? '/page/' + page : ''}`;
        
        const response = await axios.get(browseUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const $ = cheerio.load(response.data);
        const anime = [];

        $('a[href*="/series/"]').each((i, el) => {
            const $el = $(el);
            const url = $el.attr('href');
            const title = $el.text().trim() || $el.attr('title');
            
            if (title && url) {
                const slugMatch = url.match(/\/series\/([^\/]+)/);
                if (slugMatch) {
                    anime.push({
                        title: title,
                        slug: slugMatch[1],
                        url: url,
                        source: 'ANIMEWORLD'
                    });
                }
            }
        });

        res.json({
            success: true,
            page: page,
            results_count: anime.length,
            anime: anime
        });
    } catch (error) {
        res.status(500).json({
            error: 'Browse failed',
            message: error.message
        });
    }
});

// Cache status endpoint
app.get('/api/cache', (req, res) => {
    res.json({
        anime_cache_size: ANIME_CACHE.size,
        search_cache_size: SEARCH_CACHE.size,
        cached_anime: Array.from(ANIME_CACHE.keys()),
        cached_searches: Array.from(SEARCH_CACHE.keys())
    });
});

// Clear cache endpoint
app.post('/api/cache/clear', (req, res) => {
    const animeCount = ANIME_CACHE.size;
    const searchCount = SEARCH_CACHE.size;
    
    ANIME_CACHE.clear();
    SEARCH_CACHE.clear();
    
    res.json({
        message: 'Cache cleared successfully',
        cleared: {
            anime_entries: animeCount,
            search_entries: searchCount
        }
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Dynamic AnimeWorld API is running',
        features: [
            'Dynamic anime resolution via AniList API',
            'Real-time AnimeWorld search',
            'Comprehensive player extraction',
            'Intelligent caching system',
            'Support for ANY anime on AnimeWorld'
        ],
        cache_stats: {
            anime_cached: ANIME_CACHE.size,
            searches_cached: SEARCH_CACHE.size
        },
        sources: Object.keys(SOURCES),
        timestamp: new Date().toISOString()
    });
});

// Embed endpoint - ENHANCED
app.get('/anime/:anilistId/:episode/:language?', async (req, res) => {
    const { anilistId, episode, language = 'sub' } = req.params;
    const season = 1;

    try {
        const animeData = await resolveAnimeSlug(anilistId);
        if (!animeData) {
            return res.send(generateErrorPage('Anime Not Found', `AniList ID: ${anilistId}`, 'Anime not available on AnimeWorld'));
        }

        const episodeData = await fetchEpisodeData(animeData.slug, season, parseInt(episode));

        if (!episodeData.success || episodeData.players.length === 0) {
            return res.send(generateErrorPage(
                'Episode Not Found',
                `${animeData.title} - Episode ${episode}`,
                'This episode is not available'
            ));
        }

        const playerUrl = episodeData.players[0].url;

        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${animeData.title} - Episode ${episode}</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { 
                        margin: 0; 
                        padding: 0; 
                        background: #000; 
                        overflow: hidden;
                        font-family: Arial, sans-serif;
                    }
                    .player-container { 
                        width: 100vw; 
                        height: 100vh; 
                        position: relative;
                    }
                    iframe { 
                        width: 100%; 
                        height: 100%; 
                        border: none; 
                    }
                    .info-bar {
                        position: absolute;
                        top: 10px;
                        left: 10px;
                        background: rgba(0,0,0,0.8);
                        color: white;
                        padding: 10px;
                        border-radius: 5px;
                        z-index: 1000;
                        font-size: 12px;
                        max-width: 300px;
                        opacity: 0.9;
                    }
                    .loading {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        color: white;
                        font-size: 18px;
                    }
                </style>
            </head>
            <body>
                <div class="info-bar">
                    ${animeData.title} - Episode ${episode} | ${episodeData.players.length} players available
                </div>
                <div class="player-container">
                    <iframe src="${playerUrl}" frameborder="0" scrolling="no" allowfullscreen></iframe>
                </div>
                <script>
                    // Auto-hide info bar after 5 seconds
                    setTimeout(() => {
                        const infoBar = document.querySelector('.info-bar');
                        if (infoBar) infoBar.style.opacity = '0';
                    }, 5000);
                </script>
            </body>
            </html>
        `);

    } catch (error) {
        res.send(generateErrorPage('Error Loading Anime', `AniList ID: ${anilistId}`, error.message));
    }
});

// Helper function for error pages
function generateErrorPage(title, subtitle, message) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${title}</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    background: linear-gradient(135deg, #1a1a2e, #16213e);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0;
                    font-family: Arial, sans-serif;
                }
                .error-container {
                    text-align: center;
                    padding: 40px;
                    background: rgba(0,0,0,0.3);
                    border-radius: 10px;
                    max-width: 500px;
                }
                h1 { color: #ff6b6b; margin-bottom: 10px; }
                h2 { color: #4ecdc4; margin-bottom: 20px; }
                p { color: #cccccc; line-height: 1.6; }
            </style>
        </head>
        <body>
            <div class="error-container">
                <h1>${title}</h1>
                <h2>${subtitle}</h2>
                <p>${message}</p>
                <p><small>Powered by Dynamic AnimeWorld API</small></p>
            </div>
        </body>
        </html>
    `;
}

// Get anime series info endpoint - NEW
app.get('/api/anime/:anilistId/info', async (req, res) => {
    const { anilistId } = req.params;

    try {
        const animeData = await resolveAnimeSlug(anilistId);
        if (!animeData) {
            return res.status(404).json({
                error: 'Anime not found',
                anilist_id: anilistId
            });
        }

        // Try to get series page to find available episodes
        const seriesUrl = `${SOURCES.ANIMEWORLD.baseUrl}/series/${animeData.slug}/`;
        
        try {
            const seriesResponse = await axios.get(seriesUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 10000
            });

            const $ = cheerio.load(seriesResponse.data);
            const episodes = [];

            // Extract episode links
            $('a[href*="episode"]').each((i, el) => {
                const href = $(el).attr('href');
                const text = $(el).text().trim();
                
                if (href && text) {
                    const episodeMatch = href.match(/episode.*?(\d+)/);
                    if (episodeMatch) {
                        episodes.push({
                            episode: parseInt(episodeMatch[1]),
                            title: text,
                            url: href
                        });
                    }
                }
            });

            res.json({
                success: true,
                anilist_id: anilistId,
                anime_slug: animeData.slug,
                anime_title: animeData.title,
                series_url: seriesUrl,
                anilist_info: animeData.anilistInfo,
                available_episodes: episodes.sort((a, b) => a.episode - b.episode),
                total_episodes: episodes.length
            });

        } catch (seriesError) {
            // Return basic info even if series page fails
            res.json({
                success: true,
                anilist_id: anilistId,
                anime_slug: animeData.slug,
                anime_title: animeData.title,
                anilist_info: animeData.anilistInfo,
                note: 'Series page could not be accessed for episode list'
            });
        }

    } catch (error) {
        res.status(500).json({
            error: 'Failed to get anime info',
            message: error.message,
            anilist_id: anilistId
        });
    }
});

// Popular anime endpoint - NEW (discovers trending anime)
app.get('/api/popular', async (req, res) => {
    try {
        const popularUrl = `${SOURCES.ANIMEWORLD.baseUrl}`;
        
        const response = await axios.get(popularUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const $ = cheerio.load(response.data);
        const popular = [];

        // Look for featured/popular anime sections
        $('a[href*="/series/"]').each((i, el) => {
            if (popular.length >= 20) return false;
            
            const $el = $(el);
            const url = $el.attr('href');
            const title = $el.text().trim() || $el.attr('title');
            const img = $el.find('img').attr('src') || $el.closest('div').find('img').attr('src');
            
            if (title && url) {
                const slugMatch = url.match(/\/series\/([^\/]+)/);
                if (slugMatch && !popular.some(p => p.slug === slugMatch[1])) {
                    popular.push({
                        title: title,
                        slug: slugMatch[1],
                        url: url,
                        image: img,
                        source: 'ANIMEWORLD'
                    });
                }
            }
        });

        res.json({
            success: true,
            popular_anime: popular,
            count: popular.length
        });

    } catch (error) {
        res.status(500).json({
            error: 'Failed to get popular anime',
            message: error.message
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Dynamic AnimeWorld API running on port ${PORT}`);
    console.log(`\n🌟 FEATURES:`);
    console.log(`   ✅ Supports ANY anime available on AnimeWorld`);
    console.log(`   ✅ Dynamic anime resolution via AniList API`);
    console.log(`   ✅ Real-time search and discovery`);
    console.log(`   ✅ Intelligent caching system`);
    console.log(`   ✅ Enhanced player extraction`);
    console.log(`   ✅ No hardcoded anime database required`);
    console.log(`\n🔗 KEY ENDPOINTS:`);
    console.log(`   📺 Anime Episode: http://localhost:${PORT}/api/anime/{anilist_id}/{season}/{episode}`);
    console.log(`   🔍 Search: http://localhost:${PORT}/api/search/{anime_name}`);
    console.log(`   📋 Browse: http://localhost:${PORT}/api/browse/{page}`);
    console.log(`   ℹ️  Anime Info: http://localhost:${PORT}/api/anime/{anilist_id}/info`);
    console.log(`   🔥 Popular: http://localhost:${PORT}/api/popular`);
    console.log(`   📊 Cache Status: http://localhost:${PORT}/api/cache`);
    console.log(`   🎬 Embed: http://localhost:${PORT}/anime/{anilist_id}/{episode}`);
    console.log(`   ❤️  Health: http://localhost:${PORT}/health`);
    console.log(`\n🧪 TEST EXAMPLES:`);
    console.log(`   - Any AniList ID: http://localhost:${PORT}/api/anime/21/1/1 (One Piece)`);
    console.log(`   - Search: http://localhost:${PORT}/api/search/naruto`);
    console.log(`   - Popular: http://localhost:${PORT}/api/popular`);
    console.log(`\n🎯 This API can now fetch ANY anime from AnimeWorld dynamically!`);
});

module.exports = app;
