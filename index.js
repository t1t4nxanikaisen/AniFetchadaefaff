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

// ========== COMPREHENSIVE ANIME DATABASE ==========
const ANIME_DATABASE = {
    // Popular Anime - Verified Slugs
    '21': { slug: 'one-piece', title: 'One Piece' },
    '20': { slug: 'naruto', title: 'Naruto' },
    '1735': { slug: 'naruto-shippuden', title: 'Naruto Shippuden' },
    '16498': { slug: 'shingeki-no-kyojin', title: 'Attack on Titan' },
    '38000': { slug: 'kimetsu-no-yaiba', title: 'Demon Slayer' },
    '113415': { slug: 'jujutsu-kaisen', title: 'Jujutsu Kaisen' },
    '99147': { slug: 'chainsaw-man', title: 'Chainsaw Man' },
    '101759': { slug: 'oshi-no-ko', title: 'Oshi no Ko' },
    '11061': { slug: 'tokyo-ghoul', title: 'Tokyo Ghoul' },
    '23283': { slug: 'sword-art-online', title: 'Sword Art Online' },
    
    // Corrected Slugs based on AnimeWorld naming
    '1': { slug: 'cowboy-bebop', title: 'Cowboy Bebop' },
    '44': { slug: 'hunter-x-hunter', title: 'Hunter x Hunter' },
    '104': { slug: 'bleach', title: 'Bleach' },
    '136': { slug: 'pokemon', title: 'Pokémon' },
    '456': { slug: 'fullmetal-alchemist-brotherhood', title: 'Fullmetal Alchemist: Brotherhood' },
    '1535': { slug: 'death-note', title: 'Death Note' },
    '11757': { slug: 'fairy-tail', title: 'Fairy Tail' },
    '30015': { slug: 'kaguya-sama-wa-kokurasetai', title: 'Kaguya-sama: Love Is War' },
    '108632': { slug: 'sousou-no-frieren', title: 'Frieren: Beyond Journey\'s End' },
    '99263': { slug: 'solo-leveling', title: 'Solo Leveling' },

    // Additional verified anime
    '9253': { slug: 'steinsgate', title: 'Steins;Gate' },
    '6547': { slug: 'angel-beats', title: 'Angel Beats!' },
    '20583': { slug: 'noragami', title: 'Noragami' },
    '22199': { slug: 'one-punch-man', title: 'One Punch Man' },
    '22319': { slug: 'dragon-ball-super', title: 'Dragon Ball Super' },
    '28851': { slug: 'haikyuu', title: 'Haikyu!!' },
    '30002': { slug: 'nanatsu-no-taizai', title: 'The Seven Deadly Sins' },
    '31478': { slug: 'boku-no-hero-academia', title: 'My Hero Academia' },
    '32268': { slug: 'rezero', title: 'Re:ZERO -Starting Life in Another World-' },
    '32901': { slug: 'mob-psycho-100', title: 'Mob Psycho 100' },
    '34104': { slug: 'dr-stone', title: 'Dr. Stone' },
    '34933': { slug: 'vinland-saga', title: 'Vinland Saga' },
    '36456': { slug: 'the-promised-neverland', title: 'The Promised Neverland' },
    '39597': { slug: 'en-en-no-shouboutai', title: 'Fire Force' },
    '47994': { slug: 'tokyo-revengers', title: 'Tokyo Revengers' },
    '53025': { slug: 'blue-lock', title: 'Blue Lock' },
    '55123': { slug: 'spy-x-family', title: 'SPY x FAMILY' },
    '59637': { slug: 'kage-no-jitsuryokusha-ni-naritakute', title: 'The Eminence in Shadow' },
    '60789': { slug: 'jigokuraku', title: 'Hell\'s Paradise' },
    '61845': { slug: 'mashle', title: 'Mashle: Magic and Muscles' },
    '64123': { slug: 'zom-100', title: 'Zom 100: Bucket List of the Dead' },
    '65321': { slug: 'undead-unluck', title: 'Undead Unluck' },
    
    // More anime with corrected slugs
    '37987': { slug: 'kenja-no-mago', title: 'Wise Man\'s Grandchild' },
    '40028': { slug: 'shinchou-yuusha', title: 'Cautious Hero' },
    '41353': { slug: 'itai-no-wa-iya-nano-de-bougyoryoku-ni-kyokufuri-shitai-to-omoimasu', title: 'BOFURI' },
    '42938': { slug: 'fruits-basket', title: 'Fruits Basket' },
    '44037': { slug: 'tower-of-god', title: 'Tower of God' },
    '46838': { slug: 'horimiya', title: 'Horimiya' },
    '49768': { slug: 'blue-period', title: 'Blue Period' },
    '50287': { slug: 'komi-san-wa-comyushou-desu', title: 'Komi Can\'t Communicate' },
};

// ========== SOURCE CONFIGURATION ==========
const SOURCES = {
    ANIMEWORLD: {
        name: 'AnimeWorld',
        baseUrl: 'https://watchanimeworld.in',
        searchUrl: 'https://watchanimeworld.in/?s=',
        episodeUrl: 'https://watchanimeworld.in/episode'
    },
    BACKUP: {
        name: 'Backup Source',
        baseUrl: 'https://animeworld-india.me',
        searchUrl: 'https://animeworld-india.me/?s=',
        episodeUrl: 'https://animeworld-india.me/episode'
    }
};

// ========== ANIME SLUG RESOLVER ==========
async function getAnimeSlug(anilistId) {
    // Check database first
    if (ANIME_DATABASE[anilistId]) {
        return ANIME_DATABASE[anilistId].slug;
    }
    
    // If not found, try to search for it
    try {
        console.log(`🔍 Anime ID ${anilistId} not in database, searching...`);
        const searchResults = await searchAnime(anilistId, 'ANIMEWORLD');
        if (searchResults.length > 0) {
            const slug = searchResults[0].slug;
            // Add to database for future use
            ANIME_DATABASE[anilistId] = {
                slug: slug,
                title: searchResults[0].title
            };
            console.log(`✅ Added new anime to database: ${anilistId} -> ${slug}`);
            return slug;
        }
    } catch (error) {
        console.error('Error searching for anime:', error);
    }
    
    // Final fallback
    return `anime-${anilistId}`;
}

// ========== IMPROVED ANIME SEARCH FUNCTION ==========
async function searchAnime(query, source = 'ANIMEWORLD') {
    try {
        const config = SOURCES[source];
        const searchUrl = `${config.searchUrl}${encodeURIComponent(query)}`;
        
        console.log(`🔍 Searching for "${query}" on ${source}: ${searchUrl}`);
        
        const response = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Cache-Control': 'no-cache',
                'Referer': config.baseUrl,
                'DNT': '1',
                'Connection': 'keep-alive'
            },
            timeout: 15000
        });

        const $ = cheerio.load(response.data);
        const results = [];

        // Multiple selectors for AnimeWorld structure
        $('article, .post, .anime-item, .result-item').each((i, el) => {
            const title = $(el).find('h2 a, h3 a, .title a, .entry-title a').first().text().trim();
            const url = $(el).find('h2 a, h3 a, .title a, .entry-title a').first().attr('href');
            const image = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');
            const description = $(el).find('p, .entry-content, .excerpt').first().text().trim();
            
            if (title && url) {
                let slug = '';
                
                // Extract slug from URL - multiple patterns
                const slugPatterns = [
                    /\/anime\/([^\/]+)/,
                    /\/episode\/([^\/]+)/,
                    /\/([^\/]+)-episode-/,
                    /\/([^\/]+)\/$/
                ];
                
                for (const pattern of slugPatterns) {
                    const match = url.match(pattern);
                    if (match && match[1]) {
                        slug = match[1];
                        // Clean up slug
                        slug = slug.replace(/-episode-\d+$/, '')
                                   .replace(/-season-\d+$/, '')
                                   .replace(/\/$/, '');
                        break;
                    }
                }
                
                if (slug && slug.length > 2) { // Ensure slug is meaningful
                    results.push({
                        title: title,
                        slug: slug,
                        url: url,
                        image: image,
                        description: description,
                        source: source
                    });
                }
            }
        });

        console.log(`✅ Found ${results.length} results for "${query}" on ${source}`);
        return results;
    } catch (error) {
        console.error(`❌ Search error (${source}):`, error.message);
        return [];
    }
}

// ========== ADVANCED PLAYER EXTRACTION ==========
function extractVideoPlayers(html, source) {
    const $ = cheerio.load(html);
    const players = [];

    console.log(`🎬 Extracting players from ${source}...`);

    // Method 1: Direct iframes (most common)
    $('iframe').each((i, el) => {
        let src = $(el).attr('src');
        if (src) {
            if (src.startsWith('//')) src = 'https:' + src;
            if (isValidVideoUrl(src)) {
                players.push({
                    type: 'embed',
                    server: `${source} Server ${players.length + 1}`,
                    url: src,
                    quality: 'HD',
                    format: 'iframe',
                    source: source
                });
                console.log(`📺 Found iframe: ${src}`);
            }
        }
    });

    // Method 2: Video tags
    $('video').each((i, el) => {
        const src = $(el).attr('src');
        if (src) {
            const fullSrc = src.startsWith('//') ? 'https:' + src : src;
            if (isValidVideoUrl(fullSrc)) {
                players.push({
                    type: 'direct',
                    server: `${source} Direct ${players.length + 1}`,
                    url: fullSrc,
                    quality: 'Auto',
                    format: 'mp4',
                    source: source
                });
                console.log(`🎥 Found video tag: ${fullSrc}`);
            }
        }
    });

    // Method 3: Script content analysis (most important for AnimeWorld)
    $('script').each((i, el) => {
        const scriptContent = $(el).html();
        if (scriptContent && scriptContent.length > 100) { // Only check substantial scripts
            // Common video player patterns in AnimeWorld
            const videoPatterns = [
                /(?:src|file|url):\s*["']([^"']+\.(mp4|m3u8|webm)[^"']*)["']/gi,
                /(?:src|file|url):\s*["'](https?:\/\/[^"']+\.(mp4|m3u8|webm)[^"']*)["']/gi,
                /videoUrl:\s*["']([^"']+)["']/gi,
                /source:\s*["']([^"']+)["']/gi,
                /embedUrl:\s*["']([^"']+)["']/gi,
                /(https?:\/\/[^\s"']*\.(mp4|m3u8|webm)[^\s"']*)/gi,
                /(https?:\/\/[^\s"']*\/embed\/[^\s"']*)/gi,
                /(https?:\/\/[^\s"']*\/video\/[^\s"']*)/gi,
                /(https?:\/\/[^\s"']*\/player\/[^\s"']*)/gi,
                /(https?:\/\/[^\s"']*\/stream\/[^\s"']*)/gi,
                /(https?:\/\/[^\s"']*\.(streamtape|dood|mixdrop|mp4upload)[^\s"']*)/gi
            ];

            videoPatterns.forEach(pattern => {
                const matches = scriptContent.match(pattern);
                if (matches) {
                    matches.forEach(match => {
                        let url = match.replace(/(src|file|url|videoUrl|source|embedUrl):\s*/gi, '')
                                      .replace(/["']/g, '')
                                      .trim();
                        
                        if (url.startsWith('//')) url = 'https:' + url;
                        
                        if (isValidVideoUrl(url) && !players.some(p => p.url === url)) {
                            players.push({
                                type: 'script',
                                server: `${source} Script ${players.length + 1}`,
                                url: url,
                                quality: 'HD',
                                format: getVideoFormat(url),
                                source: source
                            });
                            console.log(`🔧 Found script URL: ${url}`);
                        }
                    });
                }
            });
        }
    });

    // Method 4: Data attributes
    $('[data-src], [data-url], [data-file]').each((i, el) => {
        const src = $(el).attr('data-src') || $(el).attr('data-url') || $(el).attr('data-file');
        if (src) {
            const fullSrc = src.startsWith('//') ? 'https:' + src : src;
            if (isValidVideoUrl(fullSrc)) {
                players.push({
                    type: 'data',
                    server: `${source} Data ${players.length + 1}`,
                    url: fullSrc,
                    quality: 'Auto',
                    format: getVideoFormat(fullSrc),
                    source: source
                });
                console.log(`📊 Found data URL: ${fullSrc}`);
            }
        }
    });

    console.log(`🎯 Found ${players.length} players from ${source}`);
    return players;
}

// ========== IMPROVED HELPER FUNCTIONS ==========
function isValidVideoUrl(url) {
    if (!url || typeof url !== 'string') return false;
    if (url.length < 10) return false;
    
    const validDomains = [
        'streamtape', 'dood', 'mixdrop', 'mp4upload', 'vidstream',
        'gogostream', 'embtaku', 'filemoon', 'vidcloud', 'sbplay',
        'youtube', 'youtu.be', 'vimeo', 'dailymotion', 'ok.ru',
        'facebook', 'instagram', 'tiktok', 'twitch', 'bilibili'
    ];
    
    const videoExtensions = ['.mp4', '.m3u8', '.webm', '.mkv', '.avi', '.mov'];
    
    const isValid = validDomains.some(domain => url.includes(domain)) ||
                   videoExtensions.some(ext => url.includes(ext)) ||
                   url.includes('/embed/') ||
                   url.includes('/video/') ||
                   url.includes('/player/');
    
    return isValid;
}

function getVideoFormat(url) {
    if (url.includes('.m3u8')) return 'hls';
    if (url.includes('.mp4')) return 'mp4';
    if (url.includes('.webm')) return 'webm';
    return 'auto';
}

// ========== IMPROVED EPISODE FETCHER ==========
async function getEpisodeData(animeSlug, season, episode, source = 'ANIMEWORLD') {
    const config = SOURCES[source];
    
    // More comprehensive URL patterns for AnimeWorld
    const urlAttempts = [
        // Standard patterns
        `${config.episodeUrl}/${animeSlug}-episode-${episode}/`,
        `${config.episodeUrl}/${animeSlug}-episode-${episode}`,
        `${config.episodeUrl}/${animeSlug}-${season}x${episode}/`,
        `${config.episodeUrl}/${animeSlug}-${episode}/`,
        
        // Alternative patterns
        `${config.baseUrl}/${animeSlug}-episode-${episode}/`,
        `${config.baseUrl}/episode/${animeSlug}-episode-${episode}/`,
        `${config.baseUrl}/episode/${animeSlug}-${episode}/`,
        
        // Fallback patterns
        `${config.baseUrl}/anime/${animeSlug}/episode-${episode}/`,
        `${config.baseUrl}/watch/${animeSlug}-episode-${episode}/`
    ];

    console.log(`🔍 Trying ${source} with slug: ${animeSlug}, episode: ${episode}`);

    for (const url of urlAttempts) {
        try {
            console.log(`🌐 Attempting: ${url}`);
            
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Cache-Control': 'no-cache',
                    'Referer': config.baseUrl,
                    'DNT': '1',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                },
                timeout: 15000,
                validateStatus: function (status) {
                    return status < 500; // Reject only if status code is greater than or equal to 500
                }
            });

            if (response.status === 200) {
                console.log(`✅ Page loaded successfully: ${url}`);
                const players = extractVideoPlayers(response.data, source);
                
                if (players.length > 0) {
                    const $ = cheerio.load(response.data);
                    const title = $('h1.entry-title, h1.post-title, .episode-title, h1').first().text().trim() || `Episode ${episode}`;
                    const description = $('div.entry-content p, .post-content p, .episode-description').first().text().trim() || '';
                    const thumbnail = $('.post-thumbnail img, .episode-thumbnail img, .wp-post-image').attr('src') || '';

                    return {
                        success: true,
                        url: url,
                        title: title,
                        description: description,
                        thumbnail: thumbnail,
                        players: players,
                        source: source
                    };
                } else {
                    console.log(`❌ No players found on: ${url}`);
                }
            } else {
                console.log(`❌ HTTP ${response.status} for: ${url}`);
            }
        } catch (error) {
            console.log(`❌ Failed to load: ${url} - ${error.message}`);
            continue;
        }
    }

    return { success: false, players: [], source: source };
}

// ========== MULTI-SOURCE FETCHER ==========
async function getEpisodeMultiSource(animeSlug, season, episode) {
    console.log(`🔍 Multi-source fetch: ${animeSlug}, S${season}, E${episode}`);
    
    const sources = ['ANIMEWORLD', 'BACKUP'];
    
    for (const source of sources) {
        try {
            console.log(`🔄 Trying source: ${source}`);
            const result = await getEpisodeData(animeSlug, season, episode, source);
            
            if (result.success && result.players.length > 0) {
                console.log(`✅ Success with ${source} - Found ${result.players.length} players`);
                return result;
            } else {
                console.log(`❌ No players found on ${source}`);
            }
        } catch (error) {
            console.log(`❌ ${source} failed:`, error.message);
            continue;
        }
    }
    
    console.log(`❌ All sources failed for ${animeSlug} episode ${episode}`);
    return { success: false, players: [], source: 'ALL' };
}

// ========== API ENDPOINTS ==========

// Main anime endpoint
app.get('/api/anime/:anilistId/:season/:episode', async (req, res) => {
    const { anilistId, season, episode } = req.params;

    console.log(`\n🎌 Fetching: ${anilistId}, S${season}, E${episode}`);

    try {
        const animeSlug = await getAnimeSlug(anilistId);
        console.log(`📝 Resolved slug: ${animeSlug} for ID: ${anilistId}`);
        
        const episodeData = await getEpisodeMultiSource(animeSlug, parseInt(season), parseInt(episode));

        if (!episodeData.success) {
            console.log(`❌ Episode not found for ${animeSlug} episode ${episode}`);
            return res.status(404).json({ 
                error: 'Episode not found on any source',
                tried_sources: Object.keys(SOURCES),
                anime_slug: animeSlug,
                anilist_id: anilistId,
                episode: episode,
                season: season
            });
        }

        console.log(`✅ Successfully fetched ${episodeData.players.length} players`);
        res.json({
            success: true,
            anilist_id: anilistId,
            anime_slug: animeSlug,
            season: parseInt(season),
            episode: parseInt(episode),
            title: episodeData.title,
            description: episodeData.description,
            thumbnail: episodeData.thumbnail,
            source_url: episodeData.url,
            source: episodeData.source,
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

// Test endpoint for Bleach specifically
app.get('/api/debug/bleach/:episode', async (req, res) => {
    const { episode } = req.params;
    
    console.log(`\n🔧 DEBUG: Testing Bleach episode ${episode}`);
    
    const testSlugs = [
        'bleach',
        'bleach-2022',
        'bleach-thousand-year-blood-war',
        'bleach-tybw'
    ];
    
    const results = [];
    
    for (const slug of testSlugs) {
        try {
            console.log(`🧪 Testing slug: ${slug}`);
            const episodeData = await getEpisodeData(slug, 1, parseInt(episode), 'ANIMEWORLD');
            
            results.push({
                slug: slug,
                success: episodeData.success,
                players_found: episodeData.players.length,
                url_attempted: episodeData.url || 'No URL attempted',
                source: episodeData.source
            });
        } catch (error) {
            results.push({
                slug: slug,
                error: error.message
            });
        }
    }
    
    res.json({
        episode: episode,
        test_results: results
    });
});

// Search endpoint
app.get('/api/search/:query', async (req, res) => {
    const { query } = req.params;
    
    try {
        const [animeworldResults, backupResults] = await Promise.all([
            searchAnime(query, 'ANIMEWORLD'),
            searchAnime(query, 'BACKUP')
        ]);

        const allResults = [...animeworldResults, ...backupResults];
        
        res.json({
            success: true,
            query: query,
            results_count: allResults.length,
            results: allResults
        });
    } catch (error) {
        res.status(500).json({ error: 'Search failed', message: error.message });
    }
});

// Embed endpoint
app.get('/anime/:anilistId/:episode/:language?', async (req, res) => {
    const { anilistId, episode, language = 'sub' } = req.params;
    const season = 1;

    try {
        const animeSlug = await getAnimeSlug(anilistId);
        const episodeData = await getEpisodeMultiSource(animeSlug, season, parseInt(episode));

        if (!episodeData.success || episodeData.players.length === 0) {
            return res.send(`
                <html>
                    <body style="background: #0a0a0a; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: Arial;">
                        <div style="text-align: center;">
                            <h1>Episode Not Found</h1>
                            <p>Anime ID: ${anilistId} | Episode: ${episode} | Language: ${language}</p>
                            <p>Anime Slug: ${animeSlug}</p>
                            <p>Tried: ${Object.keys(SOURCES).join(', ')}</p>
                        </div>
                    </body>
                </html>
            `);
        }

        const playerUrl = episodeData.players[0].url;

        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${episodeData.title}</title>
                <style>
                    body { margin: 0; padding: 0; background: #000; overflow: hidden; }
                    .player-container { width: 100vw; height: 100vh; }
                    iframe { width: 100%; height: 100%; border: none; }
                </style>
            </head>
            <body>
                <div class="player-container">
                    <iframe src="${playerUrl}" frameborder="0" scrolling="no" allowfullscreen></iframe>
                </div>
            </body>
            </html>
        `);

    } catch (error) {
        res.send(`
            <html>
                <body style="background: #0a0a0a; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: Arial;">
                    <div style="text-align: center;">
                        <h1>Error Loading Anime</h1>
                        <p>Anime ID: ${anilistId} | Episode: ${episode}</p>
                        <p>Error: ${error.message}</p>
                    </div>
                </body>
            </html>
        `);
    }
});

// Database endpoint
app.get('/api/database', (req, res) => {
    res.json({
        total_anime: Object.keys(ANIME_DATABASE).length,
        anime_list: ANIME_DATABASE
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK',
        message: 'AnimeWorld API is running',
        total_anime_in_database: Object.keys(ANIME_DATABASE).length,
        sources: Object.keys(SOURCES),
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 AnimeWorld API running on port ${PORT}`);
    console.log(`📊 Database loaded: ${Object.keys(ANIME_DATABASE).length} anime`);
    console.log('🌐 Sources: AnimeWorld, Backup');
    console.log('📖 Docs: http://localhost:3000/docs');
    console.log('🗃️ Database: http://localhost:3000/api/database');
    console.log('🔧 Debug Bleach: http://localhost:3000/api/debug/bleach/1');
    console.log('🎌 Test URLs:');
    console.log('   - One Piece: http://localhost:3000/api/anime/21/1/1');
    console.log('   - Bleach: http://localhost:3000/api/anime/104/1/1');
    console.log('   - Naruto: http://localhost:3000/api/anime/20/1/1');
});

module.exports = app;
