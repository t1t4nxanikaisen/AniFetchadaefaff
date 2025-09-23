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

// ========== PLAYER EXTRACTION ==========
function extractVideoPlayers(html) {
    const $ = cheerio.load(html);
    const players = [];

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
                        players: players
                    };
                }
            }
        } catch (error) {
            continue;
        }
    }

    return { success: false, players: [] };
}

// ========== API ENDPOINTS ==========

// Main API endpoint
app.get('/api/anime/:anilistId/:season/:episode', async (req, res) => {
    const { anilistId, season, episode } = req.params;

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
            source_url: episodeData.url,
            players: episodeData.players
        });

    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ========== EMBED ENDPOINT ==========
app.get('/anime/:anilistId/:episode/:language?', async (req, res) => {
    const { anilistId, episode, language = 'sub' } = req.params;
    const season = 1; // Default season

    try {
        const animeSlug = await getAnimeSlug(anilistId);
        const episodeData = await getEpisodeData(animeSlug, season, parseInt(episode));

        if (!episodeData.success || episodeData.players.length === 0) {
            return res.send(`
                <html>
                    <body style="background: #0a0a0a; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: Arial;">
                        <div style="text-align: center;">
                            <h1>Episode Not Found</h1>
                            <p>Anilist ID: ${anilistId} | Episode: ${episode} | Language: ${language}</p>
                        </div>
                    </body>
                </html>
            `);
        }

        // Get the first player URL
        const playerUrl = episodeData.players[0].url;

        // Send embeddable HTML
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${episodeData.title}</title>
                <style>
                    body { 
                        margin: 0; 
                        padding: 0; 
                        background: #000;
                        overflow: hidden;
                    }
                    .player-container {
                        width: 100vw;
                        height: 100vh;
                    }
                    iframe {
                        width: 100%;
                        height: 100%;
                        border: none;
                    }
                </style>
            </head>
            <body>
                <div class="player-container">
                    <iframe src="${playerUrl}" frameborder="0" scrolling="no" allowfullscreen></iframe>
                </div>
                <script>
                    // Auto-resize iframe content
                    function resizeIframe() {
                        const iframe = document.querySelector('iframe');
                        iframe.style.height = window.innerHeight + 'px';
                        iframe.style.width = window.innerWidth + 'px';
                    }
                    window.addEventListener('resize', resizeIframe);
                    resizeIframe();
                </script>
            </body>
            </html>
        `);

    } catch (error) {
        res.send(`
            <html>
                <body style="background: #0a0a0a; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: Arial;">
                    <div style="text-align: center;">
                        <h1>Error Loading Anime</h1>
                        <p>Please check the Anilist ID and try again</p>
                    </div>
                </body>
            </html>
        `);
    }
});

// ========== DOCUMENTATION PAGE ==========
app.get('/docs', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'docs.html'));
});

// ========== HOME PAGE ==========
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK',
        message: 'Anime API Server is running',
        endpoints: {
            api: '/api/anime/:id/:season/:episode',
            embed: '/anime/:id/:episode/:language',
            docs: '/docs'
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Anime API Server running on port ${PORT}`);
    console.log('📖 Documentation: http://localhost:3000/docs');
    console.log('🎌 Embed Example: http://localhost:3000/anime/21/1/sub');
});

module.exports = app;
