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

// AnimeWorld configuration
const ANIMEWORLD_CONFIG = {
    baseUrl: 'https://watchanimeworld.in',
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
    }
};

// Anime database with correct slugs
const ANIME_DATABASE = {
    '21': { slug: 'one-piece', title: 'One Piece', episodes: 1100 },
    '20': { slug: 'naruto', title: 'Naruto', episodes: 220 },
    '1735': { slug: 'naruto-shippuden', title: 'Naruto: Shippuden', episodes: 500 },
    '1535': { slug: 'death-note', title: 'Death Note', episodes: 37 },
    '16498': { slug: 'shingeki-no-kyojin', title: 'Attack on Titan', episodes: 88 },
    '11061': { slug: 'hunter-x-hunter-2011', title: 'Hunter x Hunter (2011)', episodes: 148 },
    '38000': { slug: 'kimetsu-no-yaiba', title: 'Demon Slayer', episodes: 55 },
    '113415': { slug: 'jujutsu-kaisen', title: 'Jujutsu Kaisen', episodes: 47 },
    '117448': { slug: 'mushoku-tensei-jobless-reincarnation', title: 'Mushoku Tensei', episodes: 36 },
    '131586': { slug: 'chainsaw-man', title: 'Chainsaw Man', episodes: 12 },
    '140960': { slug: 'solo-leveling', title: 'Solo Leveling', episodes: 12 },
    '101922': { slug: 'kaguya-sama-wa-kokurasetai', title: 'Kaguya-sama: Love is War', episodes: 37 },
    '104578': { slug: 'vinland-saga', title: 'Vinland Saga', episodes: 48 },
    '107660': { slug: 'tate-no-yuusha-no-nariagari', title: 'The Rising of the Shield Hero', episodes: 38 },
    '101759': { slug: 'boku-no-hero-academia', title: 'My Hero Academia', episodes: 138 },
    '9253': { slug: 'steinsgate', title: 'Steins;Gate', episodes: 24 },
    '20555': { slug: 'akame-ga-kill', title: 'Akame ga Kill!', episodes: 24 },
    '20787': { slug: 'sword-art-online', title: 'Sword Art Online', episodes: 96 },
    '12189': { slug: 'psycho-pass', title: 'Psycho-Pass', episodes: 41 },
    '14719': { slug: 'jojo-no-kimyou-na-bouken', title: 'JoJo\'s Bizarre Adventure', episodes: 190 },
    '18671': { slug: 'haikyuu', title: 'Haikyu!!', episodes: 85 },
    '21995': { slug: 'ansatsu-kyoushitsu', title: 'Assassination Classroom', episodes: 47 },
    '22199': { slug: 'one-punch-man', title: 'One-Punch Man', episodes: 24 },
    '23289': { slug: 'overlord', title: 'Overlord', episodes: 52 },
    '24701': { slug: 'rezero-kara-hajimeru-isekai-seikatsu', title: 'Re:Zero', episodes: 50 },
    '269': { slug: 'bleach', title: 'Bleach', episodes: 366 },
    '44': { slug: 'fullmetal-alchemist-brotherhood', title: 'Fullmetal Alchemist: Brotherhood', episodes: 64 },
    '178025': { slug: 'gachiakuta', title: 'Gachiakuta', episodes: 12 },
    '185660': { slug: 'wind-breaker', title: 'Wind Breaker', episodes: 13 }
};

// Function to extract player URL from HTML
function extractPlayerUrl(html) {
    const $ = cheerio.load(html);
    
    // Method 1: Direct iframe extraction
    let iframeSrc = $('iframe[src*="streamtape"], iframe[src*="dood"], iframe[src*="mixdrop"]').attr('src');
    if (iframeSrc) {
        return iframeSrc;
    }
    
    // Method 2: Video source extraction
    let videoSrc = $('video source').attr('src');
    if (videoSrc && videoSrc.startsWith('http')) {
        return videoSrc;
    }
    
    // Method 3: Script-based player extraction
    const scripts = $('script');
    for (let i = 0; i < scripts.length; i++) {
        const scriptContent = $(scripts[i]).html();
        if (scriptContent) {
            // Look for common player patterns
            const patterns = [
                /(https?:\/\/[^\s"']*\.(mp4|m3u8)[^\s"']*)/gi,
                /(https?:\/\/[^\s"']*streamtape[^\s"']*)/gi,
                /(https?:\/\/[^\s"']*dood[^\s"']*)/gi,
                /file:\s*["']([^"']+)["']/gi,
                /src:\s*["']([^"']+)["']/gi
            ];
            
            for (const pattern of patterns) {
                const matches = scriptContent.match(pattern);
                if (matches) {
                    for (const match of matches) {
                        if (match.startsWith('http')) {
                            return match.replace(/['"]/g, '');
                        }
                    }
                }
            }
        }
    }
    
    return null;
}

// Main API endpoint - Returns iframe HTML
app.get('/api/anime/:anilistId/:season/:episode', async (req, res) => {
    const { anilistId, season, episode } = req.params;
    
    console.log(`🎌 Fetching: AniList ID ${anilistId}, Season ${season}, Episode ${episode}`);
    
    try {
        // Check if anime exists in database
        const animeInfo = ANIME_DATABASE[anilistId];
        if (!animeInfo) {
            return res.status(404).json({
                error: 'Anime not found',
                message: `No anime found for AniList ID: ${anilistId}`,
                available_anime: Object.keys(ANIME_DATABASE)
            });
        }
        
        console.log(`📝 Found anime: ${animeInfo.title} (${animeInfo.slug})`);
        
        // Try multiple URL patterns
        const urlPatterns = [
            `${ANIMEWORLD_CONFIG.baseUrl}/episode/${animeInfo.slug}-${episode}/`,
            `${ANIMEWORLD_CONFIG.baseUrl}/episode/${animeInfo.slug}-episode-${episode}/`,
            `${ANIMEWORLD_CONFIG.baseUrl}/watch/${animeInfo.slug}-episode-${episode}/`,
            `${ANIMEWORLD_CONFIG.baseUrl}/series/${animeInfo.slug}/episode-${episode}/`
        ];
        
        let playerUrl = null;
        let finalUrl = null;
        
        // Try each URL pattern
        for (const url of urlPatterns) {
            try {
                console.log(`🌐 Trying: ${url}`);
                
                const response = await axios.get(url, {
                    headers: ANIMEWORLD_CONFIG.headers,
                    timeout: 10000
                });
                
                if (response.status === 200) {
                    playerUrl = extractPlayerUrl(response.data);
                    if (playerUrl) {
                        finalUrl = url;
                        console.log(`✅ Found player: ${playerUrl}`);
                        break;
                    }
                }
            } catch (error) {
                console.log(`❌ Failed: ${url} - ${error.message}`);
                continue;
            }
        }
        
        if (!playerUrl) {
            return res.status(404).json({
                error: 'Player not found',
                anime_title: animeInfo.title,
                anime_slug: animeInfo.slug,
                season: parseInt(season),
                episode: parseInt(episode),
                anilist_id: anilistId,
                message: 'Could not extract player URL from the source'
            });
        }
        
        // Return iframe HTML directly
        const iframeHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${animeInfo.title} - Episode ${episode}</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
                        position: relative;
                    }
                    iframe {
                        width: 100%;
                        height: 100%;
                        border: none;
                    }
                    .info {
                        position: absolute;
                        top: 10px;
                        left: 10px;
                        background: rgba(0,0,0,0.7);
                        color: white;
                        padding: 10px;
                        border-radius: 5px;
                        font-size: 14px;
                        z-index: 1000;
                    }
                </style>
            </head>
            <body>
                <div class="info">${animeInfo.title} - Episode ${episode}</div>
                <div class="player-container">
                    <iframe src="${playerUrl}" allowfullscreen></iframe>
                </div>
                <script>
                    // Auto-hide info after 5 seconds
                    setTimeout(() => {
                        document.querySelector('.info').style.opacity = '0';
                    }, 5000);
                </script>
            </body>
            </html>
        `;
        
        res.set('Content-Type', 'text/html');
        res.send(iframeHtml);
        
    } catch (error) {
        console.error('💥 Server error:', error.message);
        res.status(500).json({
            error: 'Server error',
            message: error.message,
            anilist_id: anilistId
        });
    }
});

// JSON API endpoint (alternative)
app.get('/api/json/anime/:anilistId/:season/:episode', async (req, res) => {
    const { anilistId, season, episode } = req.params;
    
    try {
        const animeInfo = ANIME_DATABASE[anilistId];
        if (!animeInfo) {
            return res.status(404).json({ error: 'Anime not found' });
        }
        
        const urlPatterns = [
            `${ANIMEWORLD_CONFIG.baseUrl}/episode/${animeInfo.slug}-${episode}/`,
            `${ANIMEWORLD_CONFIG.baseUrl}/episode/${animeInfo.slug}-episode-${episode}/`
        ];
        
        let playerUrl = null;
        
        for (const url of urlPatterns) {
            try {
                const response = await axios.get(url, {
                    headers: ANIMEWORLD_CONFIG.headers,
                    timeout: 10000
                });
                
                if (response.status === 200) {
                    playerUrl = extractPlayerUrl(response.data);
                    if (playerUrl) break;
                }
            } catch (error) {
                continue;
            }
        }
        
        if (!playerUrl) {
            return res.status(404).json({ error: 'Player URL not found' });
        }
        
        res.json({
            success: true,
            anime: animeInfo.title,
            season: parseInt(season),
            episode: parseInt(episode),
            player_url: playerUrl,
            iframe_html: `<iframe src="${playerUrl}" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>`
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'AnimeWorld Scraper API',
        total_anime: Object.keys(ANIME_DATABASE).length,
        endpoints: [
            'GET /api/anime/{anilistId}/{season}/{episode} (Returns iframe HTML)',
            'GET /api/json/anime/{anilistId}/{season}/{episode} (Returns JSON)',
            'GET /health (Health check)'
        ],
        available_anime: Object.keys(ANIME_DATABASE)
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>AnimeWorld Scraper API</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    background: #0f0f23;
                    color: #e0e0ff;
                    margin: 0;
                    padding: 40px;
                }
                .container { max-width: 800px; margin: 0 auto; }
                h1 { color: #6c63ff; }
                .endpoint { 
                    background: #1a1a3a; 
                    padding: 15px; 
                    margin: 10px 0; 
                    border-radius: 5px;
                }
                code { background: #25254d; padding: 2px 5px; border-radius: 3px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🎌 AnimeWorld Scraper API</h1>
                <p>Direct scraping from AnimeWorld - Returns iframe players</p>
                
                <h2>🚀 Endpoints</h2>
                
                <div class="endpoint">
                    <h3>GET /api/anime/{anilistId}/{season}/{episode}</h3>
                    <p>Returns full iframe HTML page</p>
                    <code>https://your-domain.com/api/anime/21/1/1</code>
                </div>
                
                <div class="endpoint">
                    <h3>GET /api/json/anime/{anilistId}/{season}/{episode}</h3>
                    <p>Returns JSON with player URL</p>
                    <code>https://your-domain.com/api/json/anime/21/1/1</code>
                </div>
                
                <h2>📋 Available Anime</h2>
                <ul>
                    ${Object.entries(ANIME_DATABASE).map(([id, anime]) => 
                        `<li><strong>${anime.title}</strong> (ID: ${id}) - ${anime.episodes} episodes</li>`
                    ).join('')}
                </ul>
                
                <h2>🧪 Test Links</h2>
                <p><a href="/api/anime/21/1/1" target="_blank">One Piece Episode 1</a></p>
                <p><a href="/api/anime/20/1/1" target="_blank">Naruto Episode 1</a></p>
                <p><a href="/api/anime/38000/1/1" target="_blank">Demon Slayer Episode 1</a></p>
            </div>
        </body>
        </html>
    `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 AnimeWorld Scraper API running on port ${PORT}`);
    console.log(`📊 Available anime: ${Object.keys(ANIME_DATABASE).length}`);
    console.log(`🔗 Test endpoints:`);
    console.log(`   - http://localhost:${PORT}/api/anime/21/1/1`);
    console.log(`   - http://localhost:${PORT}/api/anime/20/1/1`);
    console.log(`   - http://localhost:${PORT}/api/anime/38000/1/1`);
});
