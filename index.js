const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
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

// ========== COMPREHENSIVE ANIME DATABASE ==========
let ANIME_DATABASE = new Map();
let DATABASE_LOADED = false;

// ========== ANIMEWORLD CONFIGURATION ==========
const ANIMEWORLD_CONFIG = {
    baseUrl: 'https://watchanimeworld.in',
    searchUrl: 'https://watchanimeworld.in/?s=',
    seriesUrl: 'https://watchanimeworld.in/series',
    episodeUrl: 'https://watchanimeworld.in/episode',
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://watchanimeworld.in',
        'Connection': 'keep-alive'
    }
};

// ========== DATABASE BUILDER ==========
async function buildAnimeDatabase() {
    if (DATABASE_LOADED) return;
    
    console.log('🔄 Building comprehensive anime database...');
    const startTime = Date.now();
    
    try {
        // Load existing database if available
        try {
            const existingDb = await fs.readFile('anime_database.json', 'utf8');
            const parsed = JSON.parse(existingDb);
            ANIME_DATABASE = new Map(Object.entries(parsed));
            console.log(`📋 Loaded ${ANIME_DATABASE.size} anime from existing database`);
        } catch (e) {
            console.log('📝 Creating new database...');
        }

        // Scrape all series pages (up to 50 pages)
        const maxPages = 50;
        let totalFound = 0;
        
        for (let page = 1; page <= maxPages; page++) {
            try {
                console.log(`📄 Scraping page ${page}...`);
                const pageUrl = page === 1 ? `${ANIMEWORLD_CONFIG.seriesUrl}/` : `${ANIMEWORLD_CONFIG.seriesUrl}/page/${page}/`;
                
                const response = await axios.get(pageUrl, {
                    headers: ANIMEWORLD_CONFIG.headers,
                    timeout: 10000
                });

                if (response.status !== 200) break;

                const $ = cheerio.load(response.data);
                let pageCount = 0;

                // Extract all series links
                $('a[href*="/series/"]').each((i, el) => {
                    const $el = $(el);
                    const url = $el.attr('href');
                    const title = $el.text().trim() || $el.attr('title') || $el.find('img').attr('alt');
                    
                    if (title && url && title.length > 2) {
                        const slugMatch = url.match(/\/series\/([^\/\?#]+)/);
                        if (slugMatch) {
                            const slug = slugMatch[1];
                            const key = slug.toLowerCase();
                            
                            if (!ANIME_DATABASE.has(key)) {
                                const image = $el.find('img').attr('src') || $el.find('img').attr('data-src');
                                
                                ANIME_DATABASE.set(key, {
                                    slug: slug,
                                    title: title,
                                    url: url,
                                    image: image,
                                    source: 'ANIMEWORLD'
                                });
                                pageCount++;
                                totalFound++;
                            }
                        }
                    }
                });

                console.log(`   ✅ Found ${pageCount} anime on page ${page}`);
                
                // If no anime found on this page, we've reached the end
                if (pageCount === 0) {
                    console.log(`📊 Reached end at page ${page}`);
                    break;
                }
                
                // Small delay to be respectful
                await new Promise(resolve => setTimeout(resolve, 500));
                
            } catch (pageError) {
                console.log(`❌ Error on page ${page}:`, pageError.message);
                continue;
            }
        }

        // Also scrape the main anime category page
        try {
            console.log('📄 Scraping main anime category...');
            const categoryResponse = await axios.get('https://watchanimeworld.in/category/type/anime/', {
                headers: ANIMEWORLD_CONFIG.headers,
                timeout: 10000
            });

            const $cat = cheerio.load(categoryResponse.data);
            $cat('a[href*="/series/"]').each((i, el) => {
                const $el = $cat(el);
                const url = $el.attr('href');
                const title = $el.text().trim() || $el.attr('title') || $el.find('img').attr('alt');
                
                if (title && url && title.length > 2) {
                    const slugMatch = url.match(/\/series\/([^\/\?#]+)/);
                    if (slugMatch) {
                        const slug = slugMatch[1];
                        const key = slug.toLowerCase();
                        
                        if (!ANIME_DATABASE.has(key)) {
                            ANIME_DATABASE.set(key, {
                                slug: slug,
                                title: title,
                                url: url,
                                source: 'ANIMEWORLD'
                            });
                            totalFound++;
                        }
                    }
                }
            });
        } catch (catError) {
            console.log('❌ Category page error:', catError.message);
        }

        // Save database
        const dbObject = Object.fromEntries(ANIME_DATABASE);
        await fs.writeFile('anime_database.json', JSON.stringify(dbObject, null, 2));
        
        DATABASE_LOADED = true;
        const buildTime = Date.now() - startTime;
        
        console.log(`🎉 Database built successfully!`);
        console.log(`📊 Total anime: ${ANIME_DATABASE.size}`);
        console.log(`⏱️  Build time: ${buildTime}ms`);
        
    } catch (error) {
        console.error('💥 Database build failed:', error.message);
        DATABASE_LOADED = true; // Set to true to prevent infinite retries
    }
}

// ========== ANIME SEARCH AND MATCHING ==========
function findAnimeByAnilistId(anilistId) {
    // First, try direct lookup if we have AniList mappings
    const directMappings = {
        '178025': 'gachiakuta',
        '185660': 'wind-breaker-2024',
        '21': 'one-piece',
        '20': 'naruto',
        '1735': 'naruto-shippuden',
        '16498': 'attack-on-titan',
        '38000': 'demon-slayer-kimetsu-no-yaiba',
        '113415': 'jujutsu-kaisen',
        '44': 'hunter-x-hunter-2011',
        '1535': 'death-note',
        '456': 'fullmetal-alchemist-brotherhood'
    };

    if (directMappings[anilistId]) {
        const slug = directMappings[anilistId];
        if (ANIME_DATABASE.has(slug)) {
            return ANIME_DATABASE.get(slug);
        }
    }

    // If not found, return first anime for testing (will be improved with AniList integration)
    if (ANIME_DATABASE.size > 0) {
        const firstAnime = Array.from(ANIME_DATABASE.values())[0];
        console.log(`⚠️  Using fallback anime: ${firstAnime.title}`);
        return firstAnime;
    }

    return null;
}

function searchAnime(query, limit = 20) {
    const results = [];
    const searchTerm = query.toLowerCase();

    for (const [key, anime] of ANIME_DATABASE) {
        if (results.length >= limit) break;
        
        if (anime.title.toLowerCase().includes(searchTerm) || 
            anime.slug.toLowerCase().includes(searchTerm)) {
            results.push(anime);
        }
    }

    return results;
}

// ========== ENHANCED PLAYER EXTRACTION ==========
async function extractVideoPlayers(html, sourceUrl) {
    const $ = cheerio.load(html);
    const players = [];
    const foundUrls = new Set();

    console.log(`🎬 Extracting players from: ${sourceUrl}`);

    // Method 1: Direct iframe extraction
    $('iframe[src]').each((i, el) => {
        let src = $(el).attr('src');
        if (src) {
            src = normalizeUrl(src);
            if (isValidPlayerUrl(src) && !foundUrls.has(src)) {
                foundUrls.add(src);
                players.push({
                    type: 'embed',
                    server: `Server ${players.length + 1}`,
                    url: src,
                    quality: 'HD',
                    format: 'iframe'
                });
                console.log(`📺 Found iframe: ${src}`);
            }
        }
    });

    // Method 2: Script-based player extraction
    $('script').each((i, el) => {
        const script = $(el).html() || '';
        
        if (script.length > 100) {
            // Comprehensive patterns for different player types
            const patterns = [
                // Standard video URLs
                /(?:src|file|url|video):\s*["']([^"']+)["']/gi,
                /(?:videoUrl|embedUrl|streamUrl|playerUrl):\s*["']([^"']+)["']/gi,
                
                // Direct video file URLs
                /(https?:\/\/[^\s"']+\.(mp4|m3u8|webm|mkv)(?:\?[^\s"']*)?)/gi,
                
                // Embedded player URLs
                /(https?:\/\/[^\s"']*\/(?:embed|player|video|stream)\/[^\s"']*)/gi,
                
                // Popular streaming services
                /(https?:\/\/(?:play|stream|video)\.[^\s"']*)/gi,
                /(https?:\/\/[^\s"']*(?:zephyrflick|streamtape|dood|mixdrop|mp4upload|vidstream|gogostream)[^\s"']*)/gi,
                
                // Base64 encoded URLs
                /atob\s*\(\s*["']([^"']+)["']\s*\)/gi,
                
                // JSON embedded URLs
                /"(?:url|src|file|video)":\s*"([^"]*(?:mp4|m3u8|webm)[^"]*)"/gi
            ];

            patterns.forEach(pattern => {
                const matches = script.matchAll(pattern);
                for (const match of matches) {
                    let url = match[1];
                    
                    // Handle base64 encoded URLs
                    if (match[0].includes('atob')) {
                        try {
                            url = Buffer.from(url, 'base64').toString('ascii');
                        } catch (e) {
                            continue;
                        }
                    }
                    
                    url = normalizeUrl(url);
                    
                    if (isValidPlayerUrl(url) && !foundUrls.has(url)) {
                        foundUrls.add(url);
                        players.push({
                            type: 'script',
                            server: `Script Server ${players.length + 1}`,
                            url: url,
                            quality: 'HD',
                            format: getVideoFormat(url)
                        });
                        console.log(`🔧 Found script player: ${url}`);
                    }
                }
            });
        }
    });

    // Method 3: Video elements
    $('video source, video').each((i, el) => {
        const src = $(el).attr('src');
        if (src) {
            const url = normalizeUrl(src);
            if (isValidPlayerUrl(url) && !foundUrls.has(url)) {
                foundUrls.add(url);
                players.push({
                    type: 'direct',
                    server: `Direct Player ${players.length + 1}`,
                    url: url,
                    quality: 'HD',
                    format: getVideoFormat(url)
                });
                console.log(`🎥 Found video element: ${url}`);
            }
        }
    });

    // Method 4: Data attributes
    $('[data-src], [data-url], [data-file], [data-video], [data-player]').each((i, el) => {
        const src = $(el).attr('data-src') || $(el).attr('data-url') || 
                   $(el).attr('data-file') || $(el).attr('data-video') || 
                   $(el).attr('data-player');
        if (src) {
            const url = normalizeUrl(src);
            if (isValidPlayerUrl(url) && !foundUrls.has(url)) {
                foundUrls.add(url);
                players.push({
                    type: 'data',
                    server: `Data Player ${players.length + 1}`,
                    url: url,
                    quality: 'Auto',
                    format: getVideoFormat(url)
                });
                console.log(`📊 Found data player: ${url}`);
            }
        }
    });

    console.log(`🎯 Total players extracted: ${players.length}`);
    return players;
}

// ========== HELPER FUNCTIONS ==========
function normalizeUrl(url) {
    if (!url) return '';
    url = url.trim();
    if (url.startsWith('//')) return 'https:' + url;
    if (url.startsWith('/')) return ANIMEWORLD_CONFIG.baseUrl + url;
    return url;
}

function isValidPlayerUrl(url) {
    if (!url || typeof url !== 'string' || url.length < 10) return false;
    
    // Comprehensive validation
    const validPatterns = [
        /^https?:\/\//i,
        /\.(mp4|m3u8|webm|mkv|avi)/i,
        /(embed|player|video|stream)/i,
        /(zephyrflick|streamtape|dood|mixdrop|mp4upload|vidstream|gogostream|embtaku|filemoon|vidcloud|sbplay)/i
    ];
    
    const invalidPatterns = [
        /\.(jpg|jpeg|png|gif|webp|svg|css|js)$/i,
        /^javascript:/i,
        /^mailto:/i,
        /\.(xml|json|txt)$/i
    ];

    return validPatterns.some(pattern => pattern.test(url)) && 
           !invalidPatterns.some(pattern => pattern.test(url));
}

function getVideoFormat(url) {
    if (/\.m3u8/i.test(url)) return 'hls';
    if (/\.mp4/i.test(url)) return 'mp4';
    if (/\.webm/i.test(url)) return 'webm';
    if (/\.mkv/i.test(url)) return 'mkv';
    return 'iframe';
}

// ========== EPISODE FETCHER ==========
async function fetchEpisodeData(animeSlug, season, episode) {
    const episodePatterns = [
        `${ANIMEWORLD_CONFIG.episodeUrl}/${animeSlug}-${season}x${episode}/`,
        `${ANIMEWORLD_CONFIG.episodeUrl}/${animeSlug}-${episode}/`,
        `${ANIMEWORLD_CONFIG.episodeUrl}/${animeSlug}-episode-${episode}/`,
        `${ANIMEWORLD_CONFIG.episodeUrl}/${animeSlug}-ep-${episode}/`,
        `${ANIMEWORLD_CONFIG.baseUrl}/episode/${animeSlug}-${season}x${episode}/`,
        `${ANIMEWORLD_CONFIG.baseUrl}/episode/${animeSlug}-${episode}/`,
        `${ANIMEWORLD_CONFIG.baseUrl}/series/${animeSlug}/episode-${episode}/`,
        `${ANIMEWORLD_CONFIG.baseUrl}/watch/${animeSlug}-episode-${episode}/`,
        // Add more patterns based on common AnimeWorld URL structures
        `${ANIMEWORLD_CONFIG.episodeUrl}/${animeSlug}-s${season}-e${episode}/`,
        `${ANIMEWORLD_CONFIG.episodeUrl}/${animeSlug}-s${season}e${episode}/`
    ];

    console.log(`🔍 Fetching episode: ${animeSlug} S${season}E${episode}`);

    for (const url of episodePatterns) {
        try {
            console.log(`🌐 Trying: ${url}`);
            
            const response = await axios.get(url, {
                headers: ANIMEWORLD_CONFIG.headers,
                timeout: 15000,
                validateStatus: status => status < 500
            });

            if (response.status === 200) {
                console.log(`✅ Page loaded: ${url}`);
                
                const players = await extractVideoPlayers(response.data, url);
                
                if (players.length > 0) {
                    const $ = cheerio.load(response.data);
                    
                    // Extract episode metadata
                    const title = $('.entry-title, .post-title, h1').first().text().trim() || `Episode ${episode}`;
                    const description = $('.entry-content p, .post-content p').first().text().trim();
                    const thumbnail = $('.post-thumbnail img, .wp-post-image').attr('src') || '';

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
            console.log(`❌ Failed: ${url} - ${error.message}`);
            continue;
        }
    }

    return { success: false, players: [] };
}

// ========== API ROUTES ==========

// Initialize database on startup
buildAnimeDatabase();

// Main anime episode endpoint
app.get('/api/anime/:anilistId/:season/:episode', async (req, res) => {
    const { anilistId, season, episode } = req.params;
    
    console.log(`\n🎌 Request: AniList ID ${anilistId}, S${season}E${episode}`);

    try {
        // Ensure database is loaded
        if (!DATABASE_LOADED) {
            await buildAnimeDatabase();
        }

        // Find anime in database
        const animeInfo = findAnimeByAnilistId(anilistId);
        if (!animeInfo) {
            return res.status(404).json({
                error: 'Anime not found',
                message: `No anime found for AniList ID: ${anilistId}`,
                database_size: ANIME_DATABASE.size,
                anilist_id: anilistId
            });
        }

        console.log(`📝 Found anime: ${animeInfo.title} (${animeInfo.slug})`);

        // Fetch episode data
        const episodeData = await fetchEpisodeData(animeInfo.slug, parseInt(season), parseInt(episode));

        if (!episodeData.success || episodeData.players.length === 0) {
            return res.status(404).json({
                error: 'Episode not found',
                anime_title: animeInfo.title,
                anime_slug: animeInfo.slug,
                season: parseInt(season),
                episode: parseInt(episode),
                anilist_id: anilistId
            });
        }

        console.log(`✅ Success: Found ${episodeData.players.length} players`);

        // Return successful response
        res.json({
            success: true,
            anilist_id: anilistId,
            anime_slug: animeInfo.slug,
            anime_title: animeInfo.title,
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
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error(`💥 Error:`, error.message);
        res.status(500).json({
            error: 'Server error',
            message: error.message,
            anilist_id: anilistId
        });
    }
});

// Direct embed endpoint - This is what you want for iframe viewing
app.get('/anime/:anilistId/:episode/:language?', async (req, res) => {
    const { anilistId, episode, language = 'sub' } = req.params;
    const season = 1;

    try {
        // Ensure database is loaded
        if (!DATABASE_LOADED) {
            await buildAnimeDatabase();
        }

        const animeInfo = findAnimeByAnilistId(anilistId);
        if (!animeInfo) {
            return res.send(generateErrorHTML('Anime Not Found', `AniList ID: ${anilistId}`, 'Anime not found in database'));
        }

        const episodeData = await fetchEpisodeData(animeInfo.slug, season, parseInt(episode));

        if (!episodeData.success || episodeData.players.length === 0) {
            return res.send(generateErrorHTML(
                'Episode Not Available',
                `${animeInfo.title} - Episode ${episode}`,
                'This episode could not be loaded from AnimeWorld'
            ));
        }

        // Get the best player URL
        const playerUrl = episodeData.players[0].url;

        // Return full-screen iframe player
        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${animeInfo.title} - Episode ${episode}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { 
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
                        display: block;
                    }
                    .loading {
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        color: white;
                        font-size: 18px;
                        z-index: 1;
                    }
                    .info-overlay {
                        position: absolute;
                        top: 20px;
                        left: 20px;
                        background: rgba(0,0,0,0.8);
                        color: white;
                        padding: 15px;
                        border-radius: 8px;
                        max-width: 400px;
                        z-index: 100;
                        transition: opacity 0.3s ease;
                    }
                    .info-overlay.hidden { opacity: 0; }
                    .server-selector {
                        position: absolute;
                        top: 20px;
                        right: 20px;
                        z-index: 100;
                    }
                    select {
                        background: rgba(0,0,0,0.8);
                        color: white;
                        border: 1px solid #333;
                        padding: 8px;
                        border-radius: 4px;
                    }
                </style>
            </head>
            <body>
                <div class="loading" id="loading">Loading player...</div>
                
                <div class="info-overlay" id="info">
                    <h3>${animeInfo.title}</h3>
                    <p>Episode ${episode} ${language === 'dub' ? '(Dubbed)' : '(Subbed)'}</p>
                    <small>Players available: ${episodeData.players.length}</small>
                </div>
                
                ${episodeData.players.length > 1 ? `
                <div class="server-selector">
                    <select id="serverSelect" onchange="switchServer()">
                        ${episodeData.players.map((player, index) => 
                            `<option value="${index}">${player.server} (${player.quality})</option>`
                        ).join('')}
                    </select>
                </div>
                ` : ''}
                
                <div class="player-container">
                    <iframe 
                        id="player" 
                        src="${playerUrl}" 
                        allowfullscreen 
                        webkitallowfullscreen 
                        mozallowfullscreen 
                        onload="hideLoading()"
                        onerror="showError()">
                    </iframe>
                </div>
                
                <script>
                    const players = ${JSON.stringify(episodeData.players)};
                    
                    function hideLoading() {
                        document.getElementById('loading').style.display = 'none';
                        
                        // Auto-hide info overlay after 5 seconds
                        setTimeout(() => {
                            document.getElementById('info').classList.add('hidden');
                        }, 5000);
                    }
                    
                    function showError() {
                        document.getElementById('loading').innerHTML = 'Player failed to load. Trying alternative...';
                        if (players.length > 1) {
                            switchToNextPlayer();
                        }
                    }
                    
                    function switchServer() {
                        const select = document.getElementById('serverSelect');
                        const playerIndex = parseInt(select.value);
                        const iframe = document.getElementById('player');
                        iframe.src = players[playerIndex].url;
                        document.getElementById('loading').style.display = 'block';
                    }
                    
                    function switchToNextPlayer() {
                        if (players.length > 1) {
                            const iframe = document.getElementById('player');
                            const currentSrc = iframe.src;
                            const currentIndex = players.findIndex(p => p.url === currentSrc);
                            const nextIndex = (currentIndex + 1) % players.length;
                            iframe.src = players[nextIndex].url;
                        }
                    }
                    
                    // Keyboard shortcuts
                    document.addEventListener('keydown', function(e) {
                        if (e.key === 'f' || e.key === 'F') {
                            const iframe = document.getElementById('player');
                            if (iframe.requestFullscreen) {
                                iframe.requestFullscreen();
                            }
                        }
                        if (e.key === 'n' || e.key === 'N') {
                            switchToNextPlayer();
                        }
                    });
                </script>
            </body>
            </html>
        `);

    } catch (error) {
        res.send(generateErrorHTML('Error', 'Server Error', error.message));
    }
});

function generateErrorHTML(title, subtitle, message) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${title}</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    font-family: Arial, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                }
                .error-container {
                    text-align: center;
                    background: rgba(0,0,0,0.3);
                    padding: 40px;
                    border-radius: 10px;
                    max-width: 600px;
                }
                h1 { color: #ff6b6b; margin-bottom: 15px; }
                h2 { color: #4ecdc4; margin-bottom: 20px; }
                p { color: #f0f0f0; line-height: 1.6; margin-bottom: 15px; }
                .retry-btn {
                    background: #4ecdc4;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    margin-top: 20px;
                }
            </style>
        </head>
        <body>
            <div class="error-container">
                <h1>${title}</h1>
                <h2>${subtitle}</h2>
                <p>${message}</p>
                <button class="retry-btn" onclick="window.location.reload()">Try Again</button>
            </div>
        </body>
        </html>
    `;
}

// Search endpoint
app.get('/api/search/:query', (req,
