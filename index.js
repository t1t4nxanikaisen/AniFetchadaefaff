const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');
const fs = require('fs');

const app = express();

// Enable CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

app.use(express.static('public'));

// ========== CACHE CONFIG ==========
const CACHE_FILE = 'slug_cache.json';
let slugCache = {};
if (fs.existsSync(CACHE_FILE)) {
    slugCache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
}

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
    },
    TOONSTREAM: {
        name: 'ToonStream',
        baseUrl: 'https://toonstream.love',
        searchUrl: 'https://toonstream.love/search/',
        episodeUrl: 'https://toonstream.love/episode'
    }
};

// ========== ANIME MAPPINGS ==========
const ANIME_MAPPINGS = {
    '21': 'one-piece',
    '20': 'naruto', 
    '1735': 'naruto-shippuden',
    '16498': 'shingeki-no-kyojin',
    '38000': 'demon-slayer-kimetsu-no-yaiba',
    '113415': 'jujutsu-kaisen',
    '99147': 'chainsaw-man',
    '30015': 'kaguya-sama-love-is-war',
    '101759': 'oshi-no-ko',
    '108632': 'frieren-beyond-journeys-end',
    '99263': 'solo-leveling',
    '136': 'pokemon',
    '1535': 'death-note',
    '1': 'cowboy-bebop',
    '44': 'hunter-x-hunter',
    '104': 'bleach',
    '11757': 'fairy-tail',
    '23283': 'sword-art-online',
    '11061': 'tokyo-ghoul',
    '456': 'fullmetal-alchemist-brotherhood'
};

// ========== ANILIST TITLE FETCHER ==========
async function getAnimeTitle(anilistId) {
    try {
        const query = `
            query ($id: Int) {
                Media (id: $id, type: ANIME) {
                    title {
                        english
                        romaji
                    }
                }
            }
        `;
        const variables = { id: parseInt(anilistId) };
        const response = await axios.post('https://graphql.anilist.co', { query, variables });
        const title = response.data.data.Media.title;
        return title.english || title.romaji;
    } catch (error) {
        console.error('Anilist API error:', error);
        return null;
    }
}

// ========== ANIME SLUG RESOLVER ==========
async function getAnimeSlug(anilistId, source) {
    const key = `${anilistId}_${source}`;
    if (slugCache[key]) {
        return slugCache[key];
    }
    
    // If we have a mapping, use it
    if (ANIME_MAPPINGS[anilistId]) {
        slugCache[key] = ANIME_MAPPINGS[anilistId];
        fs.writeFileSync(CACHE_FILE, JSON.stringify(slugCache));
        return slugCache[key];
    }
    
    // Fetch title from Anilist and search
    const title = await getAnimeTitle(anilistId);
    if (!title) {
        return null;
    }
    
    try {
        const searchResults = await searchAnime(title, source);
        if (searchResults.length > 0) {
            slugCache[key] = searchResults[0].slug;
            fs.writeFileSync(CACHE_FILE, JSON.stringify(slugCache));
            return slugCache[key];
        }
    } catch (error) {
        console.error('Error searching for anime:', error);
    }
    
    return null;
}

// ========== ANIME SEARCH FUNCTION ==========
async function searchAnime(query, source = 'ANIMEWORLD') {
    try {
        const config = SOURCES[source];
        const searchUrl = `${config.searchUrl}${encodeURIComponent(query)}`;
        
        const response = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept-Language': 'en-US,en;q=0.9'
            },
            timeout: 10000
        });

        const $ = cheerio.load(response.data);
        const results = [];

        // More general selector
        $('a[href*="/series/"], a[href*="/anime/"]').each((i, el) => {
            const a = $(el);
            const url = a.attr('href');
            if (!url) return;

            const title = a.text().trim() || a.attr('title') || '';
            const parent = a.closest('div, article, li, section');
            const image = parent.find('img').attr('src') || '';
            const description = parent.find('p, .description').text().trim() || '';

            const slugMatch = url.match(/\/(?:anime|series)\/([^\/]+)\//);
            if (slugMatch && slugMatch[1] && title.toLowerCase().includes(query.toLowerCase())) {
                results.push({
                    title: title,
                    slug: slugMatch[1],
                    url: url,
                    image: image,
                    description: description,
                    source: source
                });
            }
        });

        return results;
    } catch (error) {
        console.error(`Search error (${source}):`, error.message);
        return [];
    }
}

// ========== PLAYER EXTRACTION ==========
function extractVideoPlayers(html, source) {
    const $ = cheerio.load(html);
    const players = [];

    console.log(`🎬 Extracting players from ${source}...`);

    // Extract iframes
    $('iframe').each((i, el) => {
        let src = $(el).attr('src');
        if (src) {
            if (src.startsWith('//')) src = 'https:' + src;
            players.push({
                type: 'embed',
                server: `${source} Server ${players.length + 1}`,
                url: src,
                quality: 'HD',
                format: 'iframe',
                source: source
            });
        }
    });

    // Extract video tags
    $('video').each((i, el) => {
        const src = $(el).attr('src');
        if (src) {
            players.push({
                type: 'direct',
                server: `${source} Direct ${players.length + 1}`,
                url: src.startsWith('//') ? 'https:' + src : src,
                quality: 'Auto',
                format: 'mp4',
                source: source
            });
        }
    });

    // Advanced script extraction
    $('script').each((i, el) => {
        const scriptContent = $(el).html();
        if (scriptContent) {
            const patterns = [
                /(https?:\/\/[^\s"']*\.(mp4|m3u8|webm)[^\s"']*)/gi,
                /(https?:\/\/[^\s"']*\/embed\/[^\s"']*)/gi,
                /(https?:\/\/[^\s"']*\/video\/[^\s"']*)/gi,
                /file:\s*["']([^"']+)["']/gi,
                /src:\s*["']([^"']+)["']/gi
            ];

            patterns.forEach(pattern => {
                const matches = scriptContent.match(pattern);
                if (matches) {
                    matches.forEach(match => {
                        let url = match.replace(/file:\s*|src:\s*|["']/g, '').trim();
                        if (url.startsWith('//')) url = 'https:' + url;
                        if (url.includes('http') && !players.some(p => p.url === url)) {
                            players.push({
                                type: 'direct',
                                server: `${source} Hidden ${players.length + 1}`,
                                url: url,
                                quality: 'HD',
                                format: 'auto',
                                source: source
                            });
                        }
                    });
                }
            });
        }
    });

    console.log(`🎯 Found ${players.length} players from ${source}`);
    
    // Only return the first player as per instructions
    return players.length > 0 ? [players[0]] : [];
}

// ========== EPISODE FETCHER ==========
async function getEpisodeData(animeSlug, season, episode, source = 'ANIMEWORLD') {
    const config = SOURCES[source];
    
    const urlAttempts = [
        `${config.episodeUrl}/${animeSlug}-episode-${episode}/`,
        `${config.episodeUrl}/${animeSlug}-${season}x${episode}/`,
        `${config.episodeUrl}/${animeSlug}-${episode}/`,
        `${config.episodeUrl}/${animeSlug}-season-${season}-episode-${episode}/`
    ];

    for (const url of urlAttempts) {
        try {
            console.log(`🌐 Trying ${source}: ${url}`);
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Referer': config.baseUrl
                },
                timeout: 10000
            });

            if (response.status === 200) {
                const players = extractVideoPlayers(response.data, source);
                
                if (players.length > 0) {
                    const $ = cheerio.load(response.data);
                    return {
                        success: true,
                        url: url,
                        title: $('h1.entry-title, h1, h2').text().trim() || `Episode ${episode}`,
                        description: $('div.entry-content p, .description').first().text().trim() || '',
                        thumbnail: $('.post-thumbnail img, img').attr('src') || '',
                        players: players,
                        source: source
                    };
                }
            }
        } catch (error) {
            console.log(`❌ ${source} failed: ${url}`);
            continue;
        }
    }

    return { success: false, players: [], source: source };
}

// ========== MULTI-SOURCE FETCHER ==========
async function getEpisodeMultiSource(anilistId, season, episode) {
    console.log(`🔍 Multi-source fetch: ID ${anilistId}, S${season}, E${episode}`);
    
    const sources = ['ANIMEWORLD', 'BACKUP', 'TOONSTREAM'];
    
    const promises = sources.map(async (source) => {
        try {
            const slug = await getAnimeSlug(anilistId, source);
            if (!slug) {
                return { success: false, source };
            }
            return await getEpisodeData(slug, season, episode, source);
        } catch (error) {
            return { success: false, source };
        }
    });

    const results = await Promise.allSettled(promises);

    for (const result of results) {
        if (result.status === 'fulfilled' && result.value.success && result.value.players.length > 0) {
            console.log(`✅ Success with ${result.value.source}`);
            return result.value;
        }
    }
    
    return { success: false, players: [], source: 'ALL' };
}

// ========== ANILIST SEARCH FUNCTION ==========
async function searchAnilistAnime(query) {
    try {
        const graphqlQuery = `
            query ($search: String) {
                Page (perPage: 10) {
                    media(search: $search, type: ANIME) {
                        id
                        title {
                            english
                            romaji
                        }
                        coverImage {
                            medium
                        }
                    }
                }
            }
        `;
        const variables = { search: query };
        const response = await axios.post('https://graphql.anilist.co', { query: graphqlQuery, variables });
        return response.data.data.Page.media.map(m => ({
            id: m.id,
            title: m.title.english || m.title.romaji,
            image: m.coverImage.medium
        }));
    } catch (error) {
        console.error('Anilist search error:', error);
        return [];
    }
}

// ========== API ENDPOINTS ==========

// Main anime endpoint
app.get('/api/anime/:anilistId/:season/:episode', async (req, res) => {
    const { anilistId, season, episode } = req.params;

    console.log(`🎌 Fetching: ${anilistId}, S${season}, E${episode}`);

    try {
        const episodeData = await getEpisodeMultiSource(anilistId, parseInt(season), parseInt(episode));

        if (!episodeData.success) {
            return res.status(404).json({ 
                error: 'Episode not found on any source',
                tried_sources: ['AnimeWorld', 'Backup', 'ToonStream'],
                anilist_id: anilistId
            });
        }

        res.json({
            success: true,
            anilist_id: anilistId,
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
        res.status(500).json({ error: 'Server error', message: error.message });
    }
});

// Search endpoint for sources
app.get('/api/search/:query', async (req, res) => {
    const { query } = req.params;
    
    try {
        // Search all sources
        const [animeworldResults, backupResults, toonstreamResults] = await Promise.all([
            searchAnime(query, 'ANIMEWORLD'),
            searchAnime(query, 'BACKUP'),
            searchAnime(query, 'TOONSTREAM')
        ]);

        const allResults = [...animeworldResults, ...backupResults, ...toonstreamResults];
        
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

// Anilist search endpoint
app.get('/api/anilist-search/:query', async (req, res) => {
    const { query } = req.params;
    
    try {
        const results = await searchAnilistAnime(query);
        res.json({
            success: true,
            query: query,
            results: results
        });
    } catch (error) {
        res.status(500).json({ error: 'Anilist search failed', message: error.message });
    }
});

// Embed endpoint
app.get('/anime/:anilistId/:episode/:language?', async (req, res) => {
    const { anilistId, episode, language = 'sub' } = req.params;
    const season = 1;

    try {
        const episodeData = await getEpisodeMultiSource(anilistId, season, parseInt(episode));

        if (!episodeData.success || episodeData.players.length === 0) {
            return res.send(`
                <html>
                    <body style="background: #0a0a0a; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: Arial;">
                        <div style="text-align: center;">
                            <h1>Episode Not Found</h1>
                            <p>Anime ID: ${anilistId} | Episode: ${episode} | Language: ${language}</p>
                            <p>Tried: AnimeWorld, Backup Source, ToonStream</p>
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
        sources: Object.keys(SOURCES),
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 AnimeWorld API running on port ${PORT}`);
    console.log('🌐 Sources: AnimeWorld, Backup, ToonStream');
    console.log('📖 Docs: http://localhost:3000/docs');
});

module.exports = app;
