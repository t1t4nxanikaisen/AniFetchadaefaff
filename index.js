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
    VIDAPI: {
        name: 'VidAPI',
        baseUrl: 'https://vidapi.choicesandconsequences.workers.dev',
        apiUrl: 'https://vidapi.choicesandconsequences.workers.dev/anime'
    }
};

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
                        description: description,
                        source: source
                    });
                }
            }
        });

        return results;
    } catch (error) {
        console.error(`Search error (${source}):`, error.message);
        return [];
    }
}

// ========== VIDAPI SOURCE ==========
async function searchVidAPI(query) {
    try {
        const response = await axios.get(`${SOURCES.VIDAPI.apiUrl}/${encodeURIComponent(query)}`, {
            timeout: 10000
        });

        if (response.data && response.data.results) {
            return response.data.results.map(anime => ({
                title: anime.title,
                slug: anime.id,
                image: anime.image,
                description: anime.description,
                source: 'VIDAPI'
            }));
        }
        return [];
    } catch (error) {
        console.error('VidAPI search error:', error.message);
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
    return players;
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
                        title: $('h1.entry-title').text().trim() || `Episode ${episode}`,
                        description: $('div.entry-content p').first().text().trim() || '',
                        thumbnail: $('.post-thumbnail img').attr('src') || '',
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

// ========== VIDAPI EPISODE FETCHER ==========
async function getVidAPIEpisode(animeId, episode) {
    try {
        const response = await axios.get(`${SOURCES.VIDAPI.apiUrl}/${animeId}/${episode}`, {
            timeout: 10000
        });

        if (response.data && response.data.sources) {
            const players = response.data.sources.map((source, index) => ({
                type: 'embed',
                server: `VidAPI Server ${index + 1}`,
                url: source.url,
                quality: source.quality || 'HD',
                format: 'iframe',
                source: 'VIDAPI'
            }));

            return {
                success: true,
                url: `${SOURCES.VIDAPI.apiUrl}/${animeId}/${episode}`,
                title: `Episode ${episode}`,
                players: players,
                source: 'VIDAPI'
            };
        }
    } catch (error) {
        console.error('VidAPI episode error:', error.message);
    }

    return { success: false, players: [], source: 'VIDAPI' };
}

// ========== MULTI-SOURCE FETCHER ==========
async function getEpisodeMultiSource(animeSlug, season, episode) {
    console.log(`🔍 Multi-source fetch: ${animeSlug}, S${season}, E${episode}`);
    
    // Try sources in order
    const sources = ['ANIMEWORLD', 'BACKUP', 'VIDAPI'];
    
    for (const source of sources) {
        try {
            let result;
            
            if (source === 'VIDAPI') {
                result = await getVidAPIEpisode(animeSlug, episode);
            } else {
                result = await getEpisodeData(animeSlug, season, episode, source);
            }
            
            if (result.success && result.players.length > 0) {
                console.log(`✅ Success with ${source}`);
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
app.get('/api/anime/:animeId/:season/:episode', async (req, res) => {
    const { animeId, season, episode } = req.params;

    console.log(`🎌 Fetching: ${animeId}, S${season}, E${episode}`);

    try {
        const episodeData = await getEpisodeMultiSource(animeId, parseInt(season), parseInt(episode));

        if (!episodeData.success) {
            return res.status(404).json({ 
                error: 'Episode not found on any source',
                tried_sources: ['AnimeWorld', 'Backup', 'VidAPI']
            });
        }

        res.json({
            success: true,
            anime_id: animeId,
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

// Search endpoint
app.get('/api/search/:query', async (req, res) => {
    const { query } = req.params;
    
    try {
        // Search all sources
        const [animeworldResults, backupResults, vidapiResults] = await Promise.all([
            searchAnime(query, 'ANIMEWORLD'),
            searchAnime(query, 'BACKUP'),
            searchVidAPI(query)
        ]);

        const allResults = [...animeworldResults, ...backupResults, ...vidapiResults];
        
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
app.get('/anime/:animeId/:episode/:language?', async (req, res) => {
    const { animeId, episode, language = 'sub' } = req.params;
    const season = 1;

    try {
        const episodeData = await getEpisodeMultiSource(animeId, season, parseInt(episode));

        if (!episodeData.success || episodeData.players.length === 0) {
            return res.send(`
                <html>
                    <body style="background: #0a0a0a; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: Arial;">
                        <div style="text-align: center;">
                            <h1>Episode Not Found</h1>
                            <p>Anime ID: ${animeId} | Episode: ${episode} | Language: ${language}</p>
                            <p>Tried: AnimeWorld, Backup Source, VidAPI</p>
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
                        <p>Source: Multi-source fallback</p>
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
        message: 'Multi-source Anime API is running',
        sources: Object.keys(SOURCES),
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Multi-source Anime API running on port ${PORT}`);
    console.log('🌐 Sources: AnimeWorld, Backup, VidAPI');
    console.log('📖 Docs: http://localhost:3000/docs');
});

module.exports = app;
