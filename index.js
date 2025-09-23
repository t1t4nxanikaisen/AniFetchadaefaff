const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

const app = express();

// Enable CORS and serve static files
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

app.use(express.static('public'));

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
    '456': 'fullmetal-alchemist-brotherhood',
    '20583': 'noragami',
    '2167': 'clannad',
    '5114': 'bakuman',
    '5529': 'soul-eater',
    '61': 'dragon-ball',
    '813': 'dragon-ball-z'
};

// ========== SEARCH FUNCTION ==========
async function searchAnimeworld(query) {
    try {
        const searchUrl = `https://watchanimeworld.in/?s=${encodeURIComponent(query)}`;
        
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

// ========== PLAYER EXTRACTION ==========
function extractVideoPlayers(html) {
    const $ = cheerio.load(html);
    const players = [];

    console.log('🎬 Extracting video players...');

    // Extract iframes
    $('iframe').each((i, el) => {
        let src = $(el).attr('src');
        if (src) {
            if (src.startsWith('//')) src = 'https:' + src;
            players.push({
                type: 'embed',
                server: `Server ${players.length + 1}`,
                url: src,
                quality: 'HD',
                format: 'iframe'
            });
        }
    });

    // Extract from scripts
    $('script').each((i, el) => {
        const scriptContent = $(el).html();
        if (scriptContent) {
            const patterns = [
                /https?:\/\/[^\s"']*\.(mp4|m3u8|webm)[^\s"']*/gi,
                /https?:\/\/[^\s"']*\/embed\/[^\s"']*/gi,
                /https?:\/\/[^\s"']*\/video\/[^\s"']*/gi,
            ];

            patterns.forEach(pattern => {
                const matches = scriptContent.match(pattern);
                if (matches) {
                    matches.forEach(match => {
                        let url = match.replace(/["']/g, '');
                        if (url.startsWith('//')) url = 'https:' + url;
                        if (url.includes('http') && !players.some(p => p.url === url)) {
                            players.push({
                                type: 'direct',
                                server: `Direct ${players.length + 1}`,
                                url: url,
                                quality: 'HD',
                                format: 'auto'
                            });
                        }
                    });
                }
            });
        }
    });

    console.log(`🎯 Found ${players.length} players`);
    return players;
}

// ========== ANIME SLUG RESOLVER ==========
async function getAnimeSlug(anilistId) {
    return ANIME_MAPPINGS[anilistId] || `anime-${anilistId}`;
}

// ========== EPISODE FETCHER ==========
async function getEpisodeData(animeSlug, season, episode) {
    const urlAttempts = [
        `https://watchanimeworld.in/episode/${animeSlug}-episode-${episode}/`,
        `https://watchanimeworld.in/episode/${animeSlug}-${season}x${episode}/`,
        `https://watchanimeworld.in/episode/${animeSlug}-${episode}/`,
    ];

    for (const url of urlAttempts) {
        try {
            console.log(`🌐 Trying: ${url}`);
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept-Language': 'en-US,en;q=0.9'
                },
                timeout: 10000
            });

            if (response.status === 200) {
                const players = extractVideoPlayers(response.data);
                
                if (players.length > 0) {
                    const $ = cheerio.load(response.data);
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
            console.log(`Failed: ${url}`);
            continue;
        }
    }

    return { success: false, players: [] };
}

// ========== API ENDPOINTS ==========

// Main anime endpoint
app.get('/api/anime/:anilistId/:season/:episode', async (req, res) => {
    const { anilistId, season, episode } = req.params;

    console.log(`🎌 Fetching: ${anilistId}, S${season}, E${episode}`);

    try {
        const animeSlug = await getAnimeSlug(anilistId);
        const episodeData = await getEpisodeData(animeSlug, parseInt(season), parseInt(episode));

        if (!episodeData.success) {
            return res.status(404).json({ error: 'Episode not found' });
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
        const results = await searchAnimeworld(query);
        res.json({
            success: true,
            query: query,
            results: results
        });
    } catch (error) {
        res.status(500).json({ error: 'Search failed', message: error.message });
    }
});

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK',
        total_anime: Object.keys(ANIME_MAPPINGS).length,
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Anime API running on port ${PORT}`);
    console.log(`📺 ${Object.keys(ANIME_MAPPINGS).length} anime loaded!`);
    console.log('🌐 Open http://localhost:3000 for the player');
});

module.exports = app;
