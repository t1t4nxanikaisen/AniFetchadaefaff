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
    // Popular Anime
    '21': { slug: 'one-piece', title: 'One Piece' },
    '20': { slug: 'naruto', title: 'Naruto' },
    '1735': { slug: 'naruto-shippuden', title: 'Naruto Shippuden' },
    '16498': { slug: 'shingeki-no-kyojin', title: 'Attack on Titan' },
    '38000': { slug: 'demon-slayer-kimetsu-no-yaiba', title: 'Demon Slayer' },
    '113415': { slug: 'jujutsu-kaisen', title: 'Jujutsu Kaisen' },
    '99147': { slug: 'chainsaw-man', title: 'Chainsaw Man' },
    '101759': { slug: 'oshi-no-ko', title: 'Oshi no Ko' },
    '11061': { slug: 'tokyo-ghoul', title: 'Tokyo Ghoul' },
    '23283': { slug: 'sword-art-online', title: 'Sword Art Online' },
    
    // More Anime
    '1': { slug: 'cowboy-bebop', title: 'Cowboy Bebop' },
    '44': { slug: 'hunter-x-hunter', title: 'Hunter x Hunter' },
    '104': { slug: 'bleach', title: 'Bleach' },
    '136': { slug: 'pokemon', title: 'Pokémon' },
    '456': { slug: 'fullmetal-alchemist-brotherhood', title: 'Fullmetal Alchemist: Brotherhood' },
    '1535': { slug: 'death-note', title: 'Death Note' },
    '11757': { slug: 'fairy-tail', title: 'Fairy Tail' },
    '30015': { slug: 'kaguya-sama-love-is-war', title: 'Kaguya-sama: Love Is War' },
    '108632': { slug: 'frieren-beyond-journeys-end', title: 'Frieren: Beyond Journey\'s End' },
    '99263': { slug: 'solo-leveling', title: 'Solo Leveling' },
    
    // Seasonal Anime 2024-2025
    '102356': { slug: 'my-hero-academia-season-7', title: 'My Hero Academia Season 7' },
    '104454': { slug: 'black-clover-season-2', title: 'Black Clover Season 2' },
    '107660': { slug: 'blue-lock-season-2', title: 'Blue Lock Season 2' },
    '109632': { slug: 'mushoku-tensei-jobless-reincarnation-season-2', title: 'Mushoku Tensei: Jobless Reincarnation Season 2' },
    
    // Additional Popular Anime
    '9253': { slug: 'steinsgate', title: 'Steins;Gate' },
    '6547': { slug: 'angel-beats', title: 'Angel Beats!' },
    '20583': { slug: 'noragami', title: 'Noragami' },
    '20785': { slug: 'tokyo-ravens', title: 'Tokyo Ravens' },
    '21877': { slug: 'attack-on-titan-junior-high', title: 'Attack on Titan: Junior High' },
    '22199': { slug: 'one-punch-man', title: 'One Punch Man' },
    '22319': { slug: 'dragon-ball-super', title: 'Dragon Ball Super' },
    '23273': { slug: 'shokugeki-no-soma', title: 'Shokugeki no Soma' },
    '23755': { slug: 'danmachi', title: 'Is It Wrong to Try to Pick Up Girls in a Dungeon?' },
    '24701': { slug: 'magic-kaito-1412', title: 'Magic Kaito 1412' },
    '27899': { slug: 'ace-of-diamond', title: 'Ace of Diamond' },
    '28851': { slug: 'haikyuu', title: 'Haikyu!!' },
    '30002': { slug: 'seven-deadly-sins', title: 'The Seven Deadly Sins' },
    '30276': { slug: 'one-piece-film-gold', title: 'One Piece Film: Gold' },
    '31478': { slug: 'boku-no-hero-academia', title: 'My Hero Academia' },
    '32268': { slug: 'rezero', title: 'Re:ZERO -Starting Life in Another World-' },
    '32901': { slug: 'mob-psycho-100', title: 'Mob Psycho 100' },
    '34104': { slug: 'dr-stone', title: 'Dr. Stone' },
    '34933': { slug: 'vinland-saga', title: 'Vinland Saga' },
    '36456': { slug: 'the-promised-neverland', title: 'The Promised Neverland' },
    '37349': { slug: 'kaguya-sama-wa-kokurasetai', title: 'Kaguya-sama: Love Is War' },
    '37987': { slug: 'kenja-no-mago', title: 'Wise Man\'s Grandchild' },
    '38084': { slug: 'kimetsu-no-yaiba', title: 'Demon Slayer: Kimetsu no Yaiba' },
    '39597': { slug: 'en-en-no-shouboutai', title: 'Fire Force' },
    '40028': { slug: 'shinchou-yuusha', title: 'Cautious Hero' },
    '40454': { slug: 'fate-grand-order', title: 'Fate/Grand Order' },
    '41353': { slug: 'itai-no-wa-iya-nano-de-bougyoryoku-ni-kyokufuri-shitai-to-omoimasu', title: 'BOFURI: I Don\'t Want to Get Hurt, so I\'ll Max Out My Defense.' },
    '42938': { slug: 'fruit-basket', title: 'Fruits Basket' },
    '44037': { slug: 'tower-of-god', title: 'Tower of God' },
    '45789': { slug: 'jujutsu-kaisen-0', title: 'Jujutsu Kaisen 0' },
    '46838': { slug: 'horimiya', title: 'Horimiya' },
    '47994': { slug: 'tokyo-revengers', title: 'Tokyo Revengers' },
    '48561': { slug: 'sonny-boy', title: 'Sonny Boy' },
    '49768': { slug: 'blue-period', title: 'Blue Period' },
    '50287': { slug: 'komi-san-wa-comyushou-desu', title: 'Komi Can\'t Communicate' },
    '51128': { slug: 'platinum-end', title: 'Platinum End' },
    '52193': { slug: 'attack-on-titan-the-final-season', title: 'Attack on Titan: The Final Season' },
    '53025': { slug: 'blue-lock', title: 'Blue Lock' },
    '54225': { slug: 'chainsaw-man-part-2', title: 'Chainsaw Man Part 2' },
    '55123': { slug: 'spy-x-family', title: 'SPY x FAMILY' },
    '56321': { slug: 'bleach-thousand-year-blood-war', title: 'Bleach: Thousand-Year Blood War' },
    '57433': { slug: 'sousou-no-frieren', title: 'Frieren: Beyond Journey\'s End' },
    '58529': { slug: 'jujutsu-kaisen-season-2', title: 'Jujutsu Kaisen Season 2' },
    '59637': { slug: 'the-eminence-in-shadow', title: 'The Eminence in Shadow' },
    '60789': { slug: 'hells-paradise', title: 'Hell\'s Paradise' },
    '61845': { slug: 'mashle', title: 'Mashle: Magic and Muscles' },
    '62987': { slug: 'oshi-no-ko', title: 'Oshi no Ko' },
    '64123': { slug: 'zom-100', title: 'Zom 100: Bucket List of the Dead' },
    '65321': { slug: 'undead-unluck', title: 'Undead Unluck' },
    '66543': { slug: 'solo-leveling', title: 'Solo Leveling' },
    '67890': { slug: 'the-apothecary-diaries', title: 'The Apothecary Diaries' },
    '68901': { slug: 'frieren-beyond-journeys-end', title: 'Frieren: Beyond Journey\'s End' },
    '70012': { slug: 'the-100-girlfriends-who-really-really-love-you', title: 'The 100 Girlfriends Who Really, Really, Really, Really, Really Love You' }
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

// ========== ANIME SEARCH FUNCTION ==========
async function searchAnime(query, source = 'ANIMEWORLD') {
    try {
        const config = SOURCES[source];
        const searchUrl = `${config.searchUrl}${encodeURIComponent(query)}`;
        
        const response = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': config.baseUrl
            },
            timeout: 15000
        });

        const $ = cheerio.load(response.data);
        const results = [];

        // Multiple selectors for different website structures
        $('article, .post, .anime-item, .search-result').each((i, el) => {
            const title = $(el).find('h2 a, h3 a, .title a').first().text().trim();
            const url = $(el).find('h2 a, h3 a, .title a').first().attr('href');
            const image = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');
            const description = $(el).find('p, .description, .excerpt').first().text().trim();
            
            if (title && url && (url.includes('/anime/') || url.includes('/episode/'))) {
                let slug = '';
                
                // Extract slug from URL
                const slugMatch = url.match(/\/(anime|episode)\/([^\/]+)/);
                if (slugMatch && slugMatch[2]) {
                    slug = slugMatch[2];
                    // Clean up slug (remove trailing slashes and episode numbers)
                    slug = slug.replace(/\/$/, '').replace(/-episode-\d+$/, '');
                }
                
                if (slug) {
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

    // Method 1: Direct iframes
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
            }
        }
    });

    // Method 3: Script content analysis (most important)
    $('script').each((i, el) => {
        const scriptContent = $(el).html();
        if (scriptContent) {
            // Multiple patterns to catch different video player implementations
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
                /(https?:\/\/[^\s"']*\/stream\/[^\s"']*)/gi
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
            }
        }
    });

    console.log(`🎯 Found ${players.length} players from ${source}`);
    return players;
}

// ========== HELPER FUNCTIONS ==========
function isValidVideoUrl(url) {
    if (!url || typeof url !== 'string') return false;
    
    const validDomains = [
        'streamtape', 'dood', 'mixdrop', 'mp4upload', 'vidstream',
        'gogostream', 'embtaku', 'filemoon', 'vidcloud', 'sbplay',
        'youtube', 'youtu.be', 'vimeo', 'dailymotion'
    ];
    
    const videoExtensions = ['.mp4', '.m3u8', '.webm', '.mkv', '.avi'];
    
    return validDomains.some(domain => url.includes(domain)) ||
           videoExtensions.some(ext => url.includes(ext)) ||
           url.includes('/embed/') ||
           url.includes('/video/');
}

function getVideoFormat(url) {
    if (url.includes('.m3u8')) return 'hls';
    if (url.includes('.mp4')) return 'mp4';
    if (url.includes('.webm')) return 'webm';
    return 'auto';
}

// ========== EPISODE FETCHER ==========
async function getEpisodeData(animeSlug, season, episode, source = 'ANIMEWORLD') {
    const config = SOURCES[source];
    
    // Multiple URL patterns to try
    const urlAttempts = [
        `${config.episodeUrl}/${animeSlug}-episode-${episode}/`,
        `${config.episodeUrl}/${animeSlug}-episode-${episode}`,
        `${config.episodeUrl}/${animeSlug}-${season}x${episode}/`,
        `${config.episodeUrl}/${animeSlug}-${episode}/`,
        `${config.episodeUrl}/${animeSlug}-season-${season}-episode-${episode}/`,
        `${config.baseUrl}/${animeSlug}-episode-${episode}/`,
        `${config.baseUrl}/episode/${animeSlug}-${episode}/`
    ];

    for (const url of urlAttempts) {
        try {
            console.log(`🌐 Trying ${source}: ${url}`);
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Referer': config.baseUrl,
                    'DNT': '1',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                },
                timeout: 15000
            });

            if (response.status === 200) {
                const players = extractVideoPlayers(response.data, source);
                
                if (players.length > 0) {
                    const $ = cheerio.load(response.data);
                    const title = $('h1.entry-title, h1.post-title, .episode-title').first().text().trim() || `Episode ${episode}`;
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
                }
            }
        } catch (error) {
            console.log(`❌ ${source} failed: ${url} - ${error.message}`);
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
            const result = await getEpisodeData(animeSlug, season, episode, source);
            
            if (result.success && result.players.length > 0) {
                console.log(`✅ Success with ${source} - Found ${result.players.length} players`);
                return result;
            }
        } catch (error) {
            console.log(`❌ ${source} failed:`, error.message);
            continue;
        }
    }
    
    return { success: false, players: [], source: 'ALL' };
}

// ========== API ENDPOINTS ==========

// Main anime endpoint
app.get('/api/anime/:anilistId/:season/:episode', async (req, res) => {
    const { anilistId, season, episode } = req.params;

    console.log(`🎌 Fetching: ${anilistId}, S${season}, E${episode}`);

    try {
        const animeSlug = await getAnimeSlug(anilistId);
        const episodeData = await getEpisodeMultiSource(animeSlug, parseInt(season), parseInt(episode));

        if (!episodeData.success) {
            return res.status(404).json({ 
                error: 'Episode not found on any source',
                tried_sources: ['AnimeWorld', 'Backup'],
                anime_slug: animeSlug,
                anilist_id: anilistId
            });
        }

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
        res.status(500).json({ 
            error: 'Server error', 
            message: error.message,
            anilist_id: anilistId
        });
    }
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
                            <p>Tried: AnimeWorld, Backup Source</p>
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

// Database endpoint - view all anime
app.get('/api/database', (req, res) => {
    res.json({
        total_anime: Object.keys(ANIME_DATABASE).length,
        anime_list: ANIME_DATABASE
    });
});

// Docs endpoint
app.get('/docs', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'docs.html'));
});

// Home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
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
});

module.exports = app;
