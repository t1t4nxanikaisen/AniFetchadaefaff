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

// Predefined Anilist to Animeworld mappings (WORKING ONES)
const animeMappings = {
    '21': 'one-piece',                 // One Piece
    '20': 'naruto',                    // Naruto
    '1735': 'naruto-shippuden',        // Naruto Shippuden
    '16498': 'attack-on-titan',        // Attack on Titan
    '38000': 'demon-slayer-kimetsu-no-yaiba', // Demon Slayer
    '113415': 'jujutsu-kaisen',        // Jujutsu Kaisen
    '99147': 'chainsaw-man',           // Chainsaw Man
    '101922': 'hells-paradise',        // Hell's Paradise
    '104': 'bleach',                   // Bleach
    '1535': 'death-note',              // Death Note
    '1': 'cowboy-bebop',               // Cowboy Bebop
    '456': 'fullmetal-alchemist-brotherhood', // FMA Brotherhood
    '44': 'hunter-x-hunter',           // Hunter x Hunter
    '23283': 'sword-art-online',       // Sword Art Online
    '11061': 'tokyo-ghoul',            // Tokyo Ghoul
    '11757': 'fairy-tail',             // Fairy Tail
    '6547': 'blue-exorcist',           // Blue Exorcist
    '20583': 'noragami',               // Noragami
    '2167': 'clannad',                 // Clannad
    '5114': 'bakuman',                 // Bakuman
    '5529': 'soul-eater',              // Soul Eater
    '61': 'dragon-ball',               // Dragon Ball
    '813': 'dragon-ball-z',            // Dragon Ball Z
    '99263': 'solo-leveling',          // Solo Leveling
    '12189': 'hyouka',                 // Hyouka
    '136': 'pokemon',                  // Pokemon
    '23273': 'shingeki-no-kyojin',     // Attack on Titan (alternative)
    '30015': 'kaguya-sama-love-is-war', // Kaguya-sama
    '101759': 'oshi-no-ko',            // Oshi no Ko
    '108632': 'frieren-beyond-journeys-end', // Frieren
    '131681': 'sousou-no-frieren'      // Sousou no Frieren
};

// -------- EXACT OG PLAYER EXTRACTION CODE --------

// FUNCTION TO EXTRACT REAL VIDEO PLAYERS (FROM OG WORKING CODE)
function extractRealVideoPlayers(html, episodeUrl) {
    const $ = cheerio.load(html);
    const players = [];

    console.log('🎬 EXTRACTING REAL VIDEO PLAYERS...');

    // 1. FIRST: Look for the main video container (OG METHOD)
    const videoContainers = [
        '.video-container',
        '.player-container',
        '.embed-container',
        '.video-player',
        '.player',
        '.watch-main',
        '.entry-content'
    ];

    for (const container of videoContainers) {
        $(container).each((i, el) => {
            // Look for iframes inside containers
            $(el).find('iframe').each((j, iframe) => {
                const src = $(iframe).attr('src');
                if (src && isValidVideoUrl(src)) {
                    players.push({
                        type: 'embed',
                        server: `Main Server ${players.length + 1}`,
                        url: makeAbsoluteUrl(src, episodeUrl),
                        quality: 'HD',
                        format: 'iframe',
                        source: 'container'
                    });
                }
            });

            // Look for video tags
            $(el).find('video').each((j, video) => {
                const src = $(video).attr('src');
                if (src) {
                    players.push({
                        type: 'direct',
                        server: `Direct Video ${players.length + 1}`,
                        url: makeAbsoluteUrl(src, episodeUrl),
                        quality: 'Auto',
                        format: 'mp4',
                        source: 'video-tag'
                    });
                }

                // Video sources
                $(video).find('source').each((k, source) => {
                    const src = $(source).attr('src');
                    if (src) {
                        players.push({
                            type: 'direct',
                            server: `Video Source ${players.length + 1}`,
                            url: makeAbsoluteUrl(src, episodeUrl),
                            quality: 'HD',
                            format: getFormatFromUrl(src),
                            source: 'video-source'
                        });
                    }
                });
            });
        });
    }

    // 2. SECOND: Extract ALL iframes from entire page
    $('iframe').each((i, iframe) => {
        const src = $(iframe).attr('src');
        const dataSrc = $(iframe).attr('data-src');
        
        // Check main src
        if (src && isValidVideoUrl(src)) {
            if (!players.some(p => p.url === makeAbsoluteUrl(src, episodeUrl))) {
                players.push({
                    type: 'embed',
                    server: `Iframe Server ${players.length + 1}`,
                    url: makeAbsoluteUrl(src, episodeUrl),
                    quality: 'HD',
                    format: 'iframe',
                    source: 'iframe-src'
                });
            }
        }
        
        // Check data-src
        if (dataSrc && isValidVideoUrl(dataSrc)) {
            if (!players.some(p => p.url === makeAbsoluteUrl(dataSrc, episodeUrl))) {
                players.push({
                    type: 'embed',
                    server: `Iframe Server ${players.length + 1}`,
                    url: makeAbsoluteUrl(dataSrc, episodeUrl),
                    quality: 'HD',
                    format: 'iframe',
                    source: 'iframe-data-src'
                });
            }
        }
    });

    // 3. THIRD: Advanced script extraction for hidden players
    $('script').each((i, script) => {
        const scriptContent = $(script).html();
        if (scriptContent) {
            // Look for common video player patterns
            const patterns = [
                // MP4 files
                /(https?:\/\/[^\s"']*\.mp4[^\s"']*)/gi,
                // M3U8 streams
                /(https?:\/\/[^\s"']*\.m3u8[^\s"']*)/gi,
                // Common video hosting domains
                /(https?:\/\/[^\s"']*(streamtape|dood|mixdrop|mp4upload|vidstream|gogocdn)[^\s"']*)/gi,
                // Base64 encoded URLs
                /(https?:\/\/[^\s"']*\/[a-zA-Z0-9]{20,}[^\s"']*)/gi,
                // JSON video data
                /"file":"([^"]+)"/gi,
                /"url":"([^"]+)"/gi,
                /"src":"([^"]+)"/gi,
                /source:\s*["']([^"']+)["']/gi,
                /file:\s*["']([^"']+)["']/gi
            ];

            patterns.forEach(pattern => {
                const matches = scriptContent.match(pattern);
                if (matches) {
                    matches.forEach(match => {
                        let url = match.replace(/["']/g, '').replace(/file:|url:|src:|source:/g, '').trim();
                        
                        if (url.startsWith('//')) {
                            url = 'https:' + url;
                        }
                        
                        if (isValidVideoUrl(url) && !players.some(p => p.url === url)) {
                            players.push({
                                type: 'direct',
                                server: `Hidden Server ${players.length + 1}`,
                                url: url,
                                quality: 'HD',
                                format: getFormatFromUrl(url),
                                source: 'script'
                            });
                        }
                    });
                }
            });
        }
    });

    // 4. FOURTH: Check for alternative video providers
    const alternativeSelectors = [
        'a[href*="watch"]',
        'a[href*="video"]',
        'a[href*="embed"]',
        'a[href*="stream"]',
        '.download-btn',
        '.watch-link',
        '.server-item'
    ];

    alternativeSelectors.forEach(selector => {
        $(selector).each((i, el) => {
            const href = $(el).attr('href');
            if (href && href.includes('http') && isValidVideoUrl(href)) {
                if (!players.some(p => p.url === href)) {
                    players.push({
                        type: 'redirect',
                        server: `Redirect Server ${players.length + 1}`,
                        url: href,
                        quality: 'HD',
                        format: 'redirect',
                        source: 'link'
                    });
                }
            }
        });
    });

    console.log(`🎯 FOUND ${players.length} REAL VIDEO PLAYERS!`);
    return players;
}

// Helper function to check if URL is a valid video URL
function isValidVideoUrl(url) {
    if (!url) return false;
    
    const videoDomains = [
        'streamtape.com', 'dood.to', 'doodstream.com', 'mixdrop.co',
        'mp4upload.com', 'vidstream.pro', 'gogocdn.com', 'play.zephyrflick.top',
        'embtaku.pro', 'watchsb.com', 'videovard.sx', 'voe.sx'
    ];
    
    const videoExtensions = ['.mp4', '.m3u8', '.webm', '.mkv', '.avi'];
    
    return videoDomains.some(domain => url.includes(domain)) ||
           videoExtensions.some(ext => url.includes(ext)) ||
           url.includes('/embed/') ||
           url.includes('/video/');
}

// Helper function to make URL absolute
function makeAbsoluteUrl(url, baseUrl) {
    if (url.startsWith('//')) {
        return 'https:' + url;
    }
    if (url.startsWith('/')) {
        const base = new URL(baseUrl);
        return base.origin + url;
    }
    if (!url.startsWith('http')) {
        return 'https://' + url;
    }
    return url;
}

// Helper function to get format from URL
function getFormatFromUrl(url) {
    if (url.includes('.m3u8')) return 'hls';
    if (url.includes('.mp4')) return 'mp4';
    if (url.includes('.webm')) return 'webm';
    if (url.includes('/embed/')) return 'iframe';
    return 'auto';
}

// -------- ANIMEWORLD FUNCTIONS --------

// Search anime on Animeworld
async function searchAnimeOnAnimeworld(searchTerm) {
    try {
        const searchUrl = `https://watchanimeworld.in/?s=${encodeURIComponent(searchTerm)}`;
        
        const response = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept-Language': 'en-US,en;q=0.9'
            },
            timeout: 15000
        });

        const $ = cheerio.load(response.data);
        const results = [];

        $('article').each((i, el) => {
            const title = $(el).find('h2 a').text().trim();
            const url = $(el).find('h2 a').attr('href');
            const image = $(el).find('img').attr('src');
            
            if (title && url && url.includes('/anime/')) {
                const slugMatch = url.match(/\/anime\/([^\/]+)\//);
                if (slugMatch && slugMatch[1]) {
                    results.push({
                        title: title,
                        slug: slugMatch[1],
                        url: url,
                        image: image
                    });
                }
            }
        });

        return results.length > 0 ? results[0] : null;
    } catch (error) {
        console.error('Search error:', error.message);
        return null;
    }
}

// Get anime slug from Anilist ID
async function getAnimeSlug(anilistId) {
    if (animeMappings[anilistId]) {
        console.log(`✅ Using mapping: ${anilistId} -> ${animeMappings[anilistId]}`);
        return animeMappings[anilistId];
    }
    
    // Fallback search
    const searchTerms = [`Anilist ${anilistId}`];
    
    for (const term of searchTerms) {
        const result = await searchAnimeOnAnimeworld(term);
        if (result) {
            return result.slug;
        }
    }
    
    return null;
}

// Get episode with REAL players
async function getEpisodeWithRealPlayers(animeSlug, season, episode) {
    const urlAttempts = [
        `https://watchanimeworld.in/episode/${animeSlug}-episode-${episode}/`,
        `https://watchanimeworld.in/episode/${animeSlug}-${season}x${episode}/`,
        `https://watchanimeworld.in/episode/${animeSlug}-${episode}/`,
    ];

    for (const url of urlAttempts) {
        try {
            console.log(`🌐 Fetching: ${url}`);
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Referer': 'https://watchanimeworld.in/'
                },
                timeout: 15000
            });

            if (response.status === 200) {
                const players = extractRealVideoPlayers(response.data, url);
                
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
            console.log(`❌ Failed: ${url}`);
            continue;
        }
    }
    
    return { success: false, players: [] };
}

// -------- API ENDPOINTS --------

// Main endpoint: Get episode with REAL players
app.get('/api/anime/:anilistId/:season/:episode', async (req, res) => {
    const { anilistId, season, episode } = req.params;
    
    console.log(`\n🎌 FETCHING REAL PLAYERS: ${anilistId}, S${season}, E${episode}`);

    if (!/^\d+$/.test(anilistId)) {
        return res.status(400).json({ error: 'Invalid Anilist ID' });
    }

    const seasonNum = parseInt(season);
    const episodeNum = parseInt(episode);

    if (isNaN(seasonNum) || isNaN(episodeNum)) {
        return res.status(400).json({ error: 'Invalid season/episode' });
    }

    try {
        const animeSlug = await getAnimeSlug(anilistId);
        if (!animeSlug) {
            return res.status(404).json({ error: 'Anime not found' });
        }

        const episodeData = await getEpisodeWithRealPlayers(animeSlug, seasonNum, episodeNum);
        if (!episodeData.success) {
            return res.status(404).json({ error: 'No players found' });
        }

        // ✅ RETURN REAL WORKING PLAYERS LIKE OG CODE
        res.json({
            success: true,
            anilist_id: anilistId,
            anime_slug: animeSlug,
            season: seasonNum,
            episode: episodeNum,
            title: episodeData.title,
            description: episodeData.description,
            thumbnail: episodeData.thumbnail,
            source_url: episodeData.url,
            total_players: episodeData.players.length,
            players: episodeData.players,
            available_servers: episodeData.players.map(p => p.server),
            timestamp: new Date().toISOString(),
            message: `🎉 Found ${episodeData.players.length} REAL video players!`
        });

    } catch (error) {
        res.status(500).json({ error: 'Server error', message: error.message });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK',
        server: 'REAL Player Extraction API',
        timestamp: new Date().toISOString()
    });
});

app.get('/', (req, res) => {
    res.json({
        message: '🎌 REAL Video Player API - OG CODE',
        version: '8.0',
        description: 'Extracts ACTUAL video players like the original working code',
        endpoint: '/api/anime/:anilistId/:season/:episode',
        example: '/api/anime/20/1/1'
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 REAL Player API running on port ${PORT}`);
    console.log('✅ EXTRACTING ACTUAL VIDEO PLAYERS!');
});

module.exports = app;
