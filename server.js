// api/anime.js - Backend API Server
const axios = require('axios');
const cheerio = require('cheerio');
const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// COMPLETE ANIMEWORLD DATABASE
const ANIMEWORLD_DATABASE = {
    // Popular Anime
    '1': { slug: 'cowboy-bebop', title: 'Cowboy Bebop', type: 'anime', episodes: 26 },
    '2': { slug: 'berserk', title: 'Berserk', type: 'anime', episodes: 25 },
    '3': { slug: 'ghost-in-the-shell-arise', title: 'Ghost in the Shell: Arise', type: 'anime', episodes: 4 },
    '4': { slug: 'death-note', title: 'Death Note', type: 'anime', episodes: 37 },
    '5': { slug: 'naruto-shippuden', title: 'Naruto Shippuden', type: 'anime', episodes: 500 },
    '6': { slug: 'one-piece', title: 'One Piece', type: 'anime', episodes: 1100 },
    '7': { slug: 'attack-on-titan', title: 'Attack on Titan', type: 'anime', episodes: 88 },
    '8': { slug: 'demon-slayer', title: 'Demon Slayer', type: 'anime', episodes: 55 },
    '9': { slug: 'jujutsu-kaisen', title: 'Jujutsu Kaisen', type: 'anime', episodes: 47 },
    '10': { slug: 'my-hero-academia', title: 'My Hero Academia', type: 'anime', episodes: 138 },

    // Cartoons
    '101': { slug: 'adventure-time', title: 'Adventure Time', type: 'cartoon', episodes: 283 },
    '102': { slug: 'rick-and-morty', title: 'Rick and Morty', type: 'cartoon', episodes: 61 },
    '103': { slug: 'south-park', title: 'South Park', type: 'cartoon', episodes: 327 },
    '104': { slug: 'family-guy', title: 'Family Guy', type: 'cartoon', episodes: 423 },
    '105': { slug: 'the-simpsons', title: 'The Simpsons', type: 'cartoon', episodes: 756 },

    // More content...
    '11': { slug: 'tokyo-revengers', title: 'Tokyo Revengers', type: 'anime', episodes: 37 },
    '12': { slug: 'spy-x-family', title: 'Spy x Family', type: 'anime', episodes: 37 },
    '13': { slug: 'chainsaw-man', title: 'Chainsaw Man', type: 'anime', episodes: 12 },
    '14': { slug: 'dragon-ball', title: 'Dragon Ball', type: 'anime', episodes: 153 },
    '15': { slug: 'dragon-ball-z', title: 'Dragon Ball Z', type: 'anime', episodes: 291 },
    '16': { slug: 'naruto', title: 'Naruto', type: 'anime', episodes: 220 },
    '17': { slug: 'bleach', title: 'Bleach', type: 'anime', episodes: 366 },
    '18': { slug: 'fairy-tail', title: 'Fairy Tail', type: 'anime', episodes: 328 },
    '19': { slug: 'hunter-x-hunter', title: 'Hunter x Hunter', type: 'anime', episodes: 148 },
    '20': { slug: 'one-punch-man', title: 'One Punch Man', type: 'anime', episodes: 24 }
};

const ANIMEWORLD_CONFIG = {
    baseUrl: 'https://watchanimeworld.in',
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
    }
};

// Enhanced player extraction
function extractPlayersAggressive(html, baseUrl) {
    const $ = cheerio.load(html);
    const players = [];
    const foundUrls = new Set();

    console.log('🔍 Extracting players from AnimeWorld...');

    // 1. Direct iframes
    $('iframe[src]').each((i, el) => {
        let src = $(el).attr('src');
        if (src) {
            src = normalizeUrl(src, baseUrl);
            if (src && !foundUrls.has(src)) {
                foundUrls.add(src);
                players.push({
                    name: `Server ${players.length + 1}`,
                    url: src,
                    type: 'iframe',
                    quality: 'HD'
                });
            }
        }
    });

    // 2. Video elements
    $('video source[src], video[src]').each((i, el) => {
        let src = $(el).attr('src');
        if (src) {
            src = normalizeUrl(src, baseUrl);
            if (src && !foundUrls.has(src)) {
                foundUrls.add(src);
                players.push({
                    name: `Direct Video ${players.length + 1}`,
                    url: src,
                    type: 'direct',
                    quality: 'Auto'
                });
            }
        }
    });

    // 3. JavaScript extraction
    $('script').each((i, el) => {
        const scriptContent = $(el).html();
        if (scriptContent) {
            const patterns = [
                /(?:src|file|url):\s*["'](https?:\/\/[^\s"']*streamtape[^\s"']*)["']/gi,
                /(?:src|file|url):\s*["'](https?:\/\/[^\s"']*dood[^\s"']*)["']/gi,
                /(?:src|file|url):\s*["'](https?:\/\/[^\s"']*mixdrop[^\s"']*)["']/gi,
                /(?:src|file|url):\s*["'](https?:\/\/[^\s"']*\.(?:mp4|m3u8)[^\s"']*)["']/gi,
            ];

            patterns.forEach(pattern => {
                const matches = scriptContent.match(pattern);
                if (matches) {
                    matches.forEach(match => {
                        const urlMatch = match.match(/(https?:\/\/[^\s"']+)/);
                        if (urlMatch) {
                            const url = normalizeUrl(urlMatch[1], baseUrl);
                            if (url && !foundUrls.has(url)) {
                                foundUrls.add(url);
                                players.push({
                                    name: `Script Player ${players.length + 1}`,
                                    url: url,
                                    type: 'script',
                                    quality: 'HD'
                                });
                            }
                        }
                    });
                }
            });
        }
    });

    return players;
}

function normalizeUrl(url, baseUrl) {
    if (!url) return null;
    if (url.startsWith('//')) return 'https:' + url;
    if (url.startsWith('/')) return ANIMEWORLD_CONFIG.baseUrl + url;
    if (url.startsWith('./')) return baseUrl + url.substring(1);
    return url.startsWith('http') ? url : null;
}

// API Routes

// Get all content
app.get('/api/content', (req, res) => {
    const content = Object.keys(ANIMEWORLD_DATABASE).map(id => ({
        id: parseInt(id),
        ...ANIMEWORLD_DATABASE[id],
        image: `https://via.placeholder.com/300x400/181818/FFFFFF?text=${encodeURIComponent(ANIMEWORLD_DATABASE[id].title)}`,
        description: `Watch ${ANIMEWORLD_DATABASE[id].title} in HD quality.`,
        year: Math.floor(Math.random() * 25) + 2000,
        status: 'Completed'
    }));

    res.json({
        success: true,
        total: content.length,
        content: content
    });
});

// Get specific content
app.get('/api/content/:id', (req, res) => {
    const contentId = req.params.id;
    const content = ANIMEWORLD_DATABASE[contentId];
    
    if (!content) {
        return res.status(404).json({
            success: false,
            error: 'Content not found'
        });
    }

    res.json({
        success: true,
        content: {
            id: parseInt(contentId),
            ...content,
            image: `https://via.placeholder.com/300x400/181818/FFFFFF?text=${encodeURIComponent(content.title)}`,
            description: `Watch ${content.title} in HD quality.`,
            year: Math.floor(Math.random() * 25) + 2000,
            status: 'Completed'
        }
    });
});

// Get episode players
app.get('/api/content/:id/season/:season/episode/:episode', async (req, res) => {
    const { id, season, episode } = req.params;

    const contentInfo = ANIMEWORLD_DATABASE[id];
    if (!contentInfo) {
        return res.status(404).json({
            success: false,
            error: 'Content not found'
        });
    }

    try {
        const animeSlug = contentInfo.slug;
        const urlPatterns = [
            `${ANIMEWORLD_CONFIG.baseUrl}/episode/${animeSlug}-${episode}/`,
            `${ANIMEWORLD_CONFIG.baseUrl}/episode/${animeSlug}-episode-${episode}/`,
            `${ANIMEWORLD_CONFIG.baseUrl}/watch/${animeSlug}-episode-${episode}/`,
        ];

        let players = [];
        let finalUrl = '';

        for (const url of urlPatterns) {
            try {
                const response = await axios.get(url, {
                    headers: ANIMEWORLD_CONFIG.headers,
                    timeout: 10000
                });

                if (response.status === 200) {
                    players = extractPlayersAggressive(response.data, url);
                    finalUrl = url;
                    if (players.length > 0) break;
                }
            } catch (error) {
                continue;
            }
        }

        if (players.length > 0) {
            res.json({
                success: true,
                content_id: id,
                content_title: contentInfo.title,
                season: parseInt(season),
                episode: parseInt(episode),
                source_url: finalUrl,
                players: players,
                total_players: players.length
            });
        } else {
            // Fallback players
            res.json({
                success: true,
                content_id: id,
                content_title: contentInfo.title,
                season: parseInt(season),
                episode: parseInt(episode),
                players: [{
                    name: "AnimeWorld Player",
                    url: "https://watchanimeworld.in/embed/example",
                    type: "iframe",
                    quality: "HD"
                }],
                total_players: 1,
                warning: "Using fallback player"
            });
        }

    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch episode'
        });
    }
});

// Search content
app.get('/api/search', (req, res) => {
    const query = req.query.q?.toLowerCase();
    if (!query) {
        return res.json({
            success: true,
            results: []
        });
    }

    const results = Object.keys(ANIMEWORLD_DATABASE)
        .filter(id => ANIMEWORLD_DATABASE[id].title.toLowerCase().includes(query))
        .map(id => ({
            id: parseInt(id),
            ...ANIMEWORLD_DATABASE[id],
            image: `https://via.placeholder.com/300x400/181818/FFFFFF?text=${encodeURIComponent(ANIMEWORLD_DATABASE[id].title)}`
        }));

    res.json({
        success: true,
        query: query,
        results: results,
        total: results.length
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'AnimeWorld API is running',
        total_content: Object.keys(ANIMEWORLD_DATABASE).length,
        version: '1.0.0'
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 AnimeWorld API Server running on port ${PORT}`);
    console.log(`📚 Total content: ${Object.keys(ANIMEWORLD_DATABASE).length}`);
    console.log(`🌐 API URL: http://localhost:${PORT}/api`);
});

module.exports = app;
