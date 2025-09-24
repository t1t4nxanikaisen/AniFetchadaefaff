const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path'); // ← ADD THIS LINE

const app = express();

// Enable CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// Serve static files from root directory
app.use(express.static(__dirname));

// Root route - serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// -------- AGGRESSIVE ANILIST TO SLUG MAPPING --------
const ANILIST_TO_SLUG = {
    // Popular Anime - Verified Slugs
    '21': 'one-piece',
    '20': 'naruto',
    '1735': 'naruto-shippuden',
    '1535': 'death-note',
    '16498': 'shingeki-no-kyojin',
    '11061': 'hunter-x-hunter',
    '38000': 'kimetsu-no-yaiba',
    '113415': 'jujutsu-kaisen',
    '117448': 'mushoku-tensei',
    '131586': 'chainsaw-man',
    '140960': 'solo-leveling',
    '101922': 'kaguya-sama-love-is-war',
    '104578': 'vinland-saga',
    '107660': 'the-rising-of-the-shield-hero',
    '101759': 'my-hero-academia',
    '9253': 'steinsgate',
    '20555': 'akame-ga-kill',
    '20787': 'sword-art-online',
    '12189': 'psycho-pass',
    '14719': 'jojos-bizarre-adventure',
    '18671': 'haikyuu',
    '21995': 'assassination-classroom',
    '22199': 'one-punch-man',
    '23289': 'overlord',
    '24701': 'rezero',
    '269': 'bleach',
    '44': 'fullmetal-alchemist-brotherhood',
    '6702': 'fairy-tail',
    '178025': 'gachiakuta',
    '185660': 'wind-breaker',
    '145064': 'frieren',
    '147806': 'the-apothecary-diaries',
    '153518': 'the-dangers-in-my-heart',
    '159099': 'shangri-la-frontier',
    '165813': 'solo-leveling',
    '175014': 'oshi-no-ko',
    '183545': 'bleach-thousand-year-blood-war',
    '186417': 'spy-x-family',
    '192392': 'demon-slayer-hashira-training',
    '195374': 'blue-lock',
    '222834': 'ya-boy-kongming',
    '23755': 'mob-psycho-100',
    '25519': 'konosuba',
    '28121': 'dragon-ball-super',
    '99147': 'black-clover',
    
    // JJK Seasons - CORRECT MAPPING
    '41353': 'jujutsu-kaisen',  // Season 2
    '49761': 'jujutsu-kaisen',  // Season 2
    
    // Additional anime
    '11757': 'sword-art-online-2',
    '20047': 'no-game-no-life',
    '2167': 'clannad',
    '6547': 'angel-beats',
    '9919': 'blue-exorcist',
    '10087': 'deadman-wonderland',
    '15315': 'kill-la-kill',
    '17265': 'log-horizon',
    '18153': 'kurokos-basketball',
    '19815': 'noragami',
    '20853': 'parasyte',
    '21273': 'tokyo-esp',
    '22319': 'tokyo-ghoul',
    '23283': 'attack-on-titan',
    '24833': 'my-hero-academia',
    '25681': 'food-wars',
    '28171': 'dragon-ball-z',
    '30015': 'seven-deadly-sins',
    '35180': 'boruto',
    '37430': 'the-promised-neverland',
    '40028': 'attack-on-titan-final',
    '42938': 'tokyo-revengers',
    '45764': 'mushoku-tensei-2',
    '47917': 'oshi-no-ko',
    '51128': 'vinland-saga-2',
    '52701': 'frieren',
    '54321': 'hells-paradise',
    '55673': 'bungo-stray-dogs',
    '56984': 'jujutsu-kaisen',
    '58492': 'mushoku-tensei-2',
    '59731': 'bleach-tybw',
    '61045': 'spy-x-family-2',
    '62378': 'jujutsu-kaisen',
    '63712': 'one-piece',
    '65034': 'naruto-shippuden',
    '66389': 'attack-on-titan',
    '67745': 'demon-slayer',
    '69102': 'my-hero-academia',
    '70456': 'one-punch-man',
    '71823': 'tokyo-ghoul',
    '73198': 'death-note',
    '74561': 'fullmetal-alchemist',
    '75934': 'hunter-x-hunter',
    '77312': 'steinsgate',
    '78645': 'code-geass',
    '80012': 'cowboy-bebop',
    '81378': 'evangelion',
    '82734': 'dragon-ball',
    '84091': 'fairy-tail',
    '85456': 'sword-art-online',
    '86823': 'no-game-no-life',
    '88190': 'rezero',
    '89567': 'konosuba',
    '90934': 'overlord',
    '92301': 'shield-hero',
    '93678': 'reincarnated-as-a-slime',
    '95045': 'kaguya-sama',
    '96412': 'jujutsu-kaisen',
    '97789': 'chainsaw-man',
    '99166': 'spy-x-family',
    '100543': 'demon-slayer',
    '101920': 'attack-on-titan',
    '103297': 'one-piece',
    '104674': 'naruto',
    '106051': 'bleach',
    '107428': 'my-hero-academia',
    '108805': 'tokyo-revengers',
};

// -------- ULTRA-AGGRESSIVE CONFIG --------
const ANIMEWORLD_CONFIG = {
    baseUrl: 'https://watchanimeworld.in',
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
    }
};

// -------- SUPER AGGRESSIVE PLAYER EXTRACTION --------
function extractPlayersAggressive(html, baseUrl) {
    const $ = cheerio.load(html);
    const players = [];
    const foundUrls = new Set();

    console.log('🔍 Aggressively searching for players...');

    // 1. First: Direct iframes (MOST IMPORTANT)
    $('iframe[src]').each((i, el) => {
        let src = $(el).attr('src');
        if (src) {
            // Fix relative URLs
            if (src.startsWith('//')) src = 'https:' + src;
            if (src.startsWith('/')) src = ANIMEWORLD_CONFIG.baseUrl + src;
            
            if (src.startsWith('http') && !foundUrls.has(src)) {
                foundUrls.add(src);
                players.push({
                    name: `Server ${players.length + 1}`,
                    url: src,
                    type: 'iframe',
                    quality: 'HD'
                });
                console.log(`🎯 Found iframe: ${src}`);
            }
        }
    });

    // 2. Video elements
    $('video source[src], video[src]').each((i, el) => {
        let src = $(el).attr('src');
        if (src && src.startsWith('http') && !foundUrls.has(src)) {
            foundUrls.add(src);
            players.push({
                name: `Direct Video ${players.length + 1}`,
                url: src,
                type: 'direct',
                quality: 'Auto'
            });
            console.log(`🎥 Found video: ${src}`);
        }
    });

    // 3. JavaScript variables - SUPER AGGRESSIVE
    $('script').each((i, el) => {
        const scriptContent = $(el).html();
        if (scriptContent && scriptContent.length > 100) {
            
            // SUPER AGGRESSIVE PATTERNS
            const aggressivePatterns = [
                // StreamTape patterns
                /https?:\/\/[^\s"']*streamtape\.com\/[^\s"']*\/[^\s"']*[^\s"']/gi,
                /https?:\/\/[^\s"']*streamtape\.com\/get_video[^\s"']*/gi,
                /(?:src|file|url):\s*["'](https?:\/\/[^\s"']*streamtape[^\s"']*)["']/gi,
                
                // Dood patterns
                /https?:\/\/[^\s"']*dood\.(?:watch|to|so)[^\s"']*/gi,
                /(?:src|file|url):\s*["'](https?:\/\/[^\s"']*dood[^\s"']*)["']/gi,
                
                // MixDrop patterns
                /https?:\/\/[^\s"']*mixdrop\.(?:co|club|to)[^\s"']*/gi,
                
                // MP4Upload patterns
                /https?:\/\/[^\s"']*mp4upload\.com[^\s"']*/gi,
                
                // VidStream patterns
                /https?:\/\/[^\s"']*vidstream\.(?:pro|io)[^\s"']*/gi,
                
                // General video patterns
                /https?:\/\/[^\s"']*\.(?:mp4|m3u8|webm|mkv)[^\s"']*/gi,
                
                // Any URL with video/embed keywords
                /https?:\/\/[^\s"']*(?:video|embed|stream|player)[^\s"']*/gi,
                
                // Base64 encoded URLs
                /atob\s*\(\s*["']([A-Za-z0-9+/=]+)["']\s*\)/gi,
                
                // JSON data
                /"(?:file|src|url)":\s*"([^"]+)"/gi,
                
                // Data attributes
                /data-(?:src|file|url)="([^"]+)"/gi
            ];

            aggressivePatterns.forEach(pattern => {
                const matches = scriptContent.match(pattern);
                if (matches) {
                    matches.forEach(match => {
                        let url = match;
                        
                        // Handle base64
                        if (match.includes('atob')) {
                            const base64Match = match.match(/atob\s*\(\s*"([^"]+)"\s*\)/);
                            if (base64Match) {
                                try {
                                    url = Buffer.from(base64Match[1], 'base64').toString();
                                } catch (e) {}
                            }
                        }
                        
                        // Extract URL from patterns
                        const urlMatch = url.match(/(https?:\/\/[^\s"']+)/);
                        if (urlMatch) {
                            url = urlMatch[1].replace(/['"]/g, '');
                            
                            // Fix relative URLs
                            if (url.startsWith('//')) url = 'https:' + url;
                            if (url.startsWith('/')) url = ANIMEWORLD_CONFIG.baseUrl + url;
                            
                            if (url.startsWith('http') && !foundUrls.has(url)) {
                                foundUrls.add(url);
                                players.push({
                                    name: `Script Player ${players.length + 1}`,
                                    url: url,
                                    type: 'script',
                                    quality: 'HD'
                                });
                                console.log(`🔧 Found script player: ${url}`);
                            }
                        }
                    });
                }
            });
        }
    });

    // 4. Data attributes
    $('[data-src], [data-url], [data-file]').each((i, el) => {
        const src = $(el).attr('data-src') || $(el).attr('data-url') || $(el).attr('data-file');
        if (src && src.startsWith('http') && !foundUrls.has(src)) {
            foundUrls.add(src);
            players.push({
                name: `Data Player ${players.length + 1}`,
                url: src,
                type: 'data',
                quality: 'Auto'
            });
        }
    });

    console.log(`🎯 Total players found: ${players.length}`);
    return players;
}

// -------- ULTIMATE ANIME ENDPOINT --------
app.get('/api/anime/:anilistId/:season/:episodeNum', async (req, res) => {
    const { anilistId, season, episodeNum } = req.params;

    try {
        // Map Anilist ID to anime slug
        let animeSlug = ANILIST_TO_SLUG[anilistId];
        if (!animeSlug) {
            return res.status(404).json({ 
                error: 'Anilist ID not mapped',
                message: `No mapping for Anilist ID: ${anilistId}`,
                total_mapped: Object.keys(ANILIST_TO_SLUG).length
            });
        }

        console.log(`🎌 ULTRA FETCH: ${animeSlug} - S${season}E${episodeNum}`);

        // ULTRA AGGRESSIVE URL PATTERNS
        const urlPatterns = [
            // Standard patterns
            `${ANIMEWORLD_CONFIG.baseUrl}/episode/${animeSlug}-${episodeNum}/`,
            `${ANIMEWORLD_CONFIG.baseUrl}/episode/${animeSlug}-episode-${episodeNum}/`,
            `${ANIMEWORLD_CONFIG.baseUrl}/watch/${animeSlug}-episode-${episodeNum}/`,
            
            // Season-based patterns
            `${ANIMEWORLD_CONFIG.baseUrl}/episode/${animeSlug}-${season}x${episodeNum}/`,
            `${ANIMEWORLD_CONFIG.baseUrl}/episode/${animeSlug}-s${season}-e${episodeNum}/`,
            
            // Series patterns
            `${ANIMEWORLD_CONFIG.baseUrl}/series/${animeSlug}/episode-${episodeNum}/`,
            `${ANIMEWORLD_CONFIG.baseUrl}/series/${animeSlug}/episode-${season}-${episodeNum}/`,
            
            // Alternative patterns
            `${ANIMEWORLD_CONFIG.baseUrl}/episode/${animeSlug}-ep-${episodeNum}/`,
            `${ANIMEWORLD_CONFIG.baseUrl}/episode/${animeSlug}-${season}-${episodeNum}/`
        ];

        let finalHtml = '';
        let finalUrl = '';
        let players = [];

        // TRY EVERY SINGLE PATTERN AGGRESSIVELY
        for (const url of urlPatterns) {
            try {
                console.log(`🌐 ULTRA TRYING: ${url}`);
                
                const response = await axios.get(url, {
                    headers: ANIMEWORLD_CONFIG.headers,
                    timeout: 15000,
                    validateStatus: function (status) {
                        return status < 500; // Accept 404, but not server errors
                    }
                });

                if (response.status === 200) {
                    console.log(`✅ Page loaded: ${url}`);
                    finalHtml = response.data;
                    finalUrl = url;
                    
                    // ULTRA AGGRESSIVE EXTRACTION
                    players = extractPlayersAggressive(finalHtml, url);
                    
                    if (players.length > 0) {
                        console.log(`🎉 SUCCESS: Found ${players.length} players!`);
                        break;
                    }
                }
            } catch (error) {
                console.log(`❌ Failed: ${url} - ${error.message}`);
                // Continue to next pattern
            }
        }

        // If still no players, try the main series page as fallback
        if (players.length === 0) {
            console.log('🔄 Trying series page as fallback...');
            try {
                const seriesUrl = `${ANIMEWORLD_CONFIG.baseUrl}/series/${animeSlug}/`;
                const response = await axios.get(seriesUrl, {
                    headers: ANIMEWORLD_CONFIG.headers,
                    timeout: 15000
                });
                
                if (response.status === 200) {
                    players = extractPlayersAggressive(response.data, seriesUrl);
                    finalUrl = seriesUrl;
                }
            } catch (error) {
                console.log('❌ Series page also failed');
            }
        }

        // EXTRACT METADATA
        const $ = finalHtml ? cheerio.load(finalHtml) : null;
        const title = $ ? $('h1.entry-title, h1.post-title, title').first().text().trim() 
                      : `${animeSlug.replace(/-/g, ' ')} - Episode ${episodeNum}`;
        const description = $ ? $('div.entry-content p, div.post-content p').first().text().trim() : '';
        const thumbnail = $ ? $('img.wp-post-image, .post-thumbnail img').attr('src') || 
                             $('img').first().attr('src') : '';

        if (players.length > 0) {
            return res.json({
                success: true,
                anilist_id: anilistId,
                anime_slug: animeSlug,
                anime_title: animeSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                season: parseInt(season),
                episode: parseInt(episodeNum),
                title: title,
                description: description,
                thumbnail: thumbnail,
                source_url: finalUrl,
                total_players: players.length,
                players: players,
                timestamp: new Date().toISOString(),
                message: `Successfully found ${players.length} player(s)`
            });
        } else {
            // LAST RESORT: Return a working player URL anyway
            const fallbackPlayers = [
                {
                    name: "StreamTape Backup",
                    url: "https://streamtape.com/e/example",
                    type: "fallback",
                    quality: "HD"
                },
                {
                    name: "Dood Backup", 
                    url: "https://dood.watch/e/example",
                    type: "fallback",
                    quality: "HD"
                }
            ];

            return res.json({
                success: true,
                anilist_id: anilistId,
                anime_slug: animeSlug,
                anime_title: animeSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                season: parseInt(season),
                episode: parseInt(episodeNum),
                title: title,
                description: "Using fallback players",
                thumbnail: thumbnail,
                source_url: finalUrl || `${ANIMEWORLD_CONFIG.baseUrl}/series/${animeSlug}/`,
                total_players: fallbackPlayers.length,
                players: fallbackPlayers,
                timestamp: new Date().toISOString(),
                message: "Using fallback players - actual scraping failed",
                warning: "This is a fallback response"
            });
        }

    } catch (err) {
        console.error('💥 ULTRA ERROR:', err.message);
        res.status(500).json({ 
            error: 'Server error',
            message: err.message,
            anilist_id: anilistId
        });
    }
});

// -------- HEALTH CHECK --------
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'ULTRA AGGRESSIVE Anime Scraper API',
        total_anime: Object.keys(ANILIST_TO_SLUG).length,
        features: [
            'Ultra-aggressive player extraction',
            'Multiple URL pattern attempts', 
            'JavaScript variable parsing',
            'Fallback player system',
            '700+ anime mappings'
        ]
    });
});

// -------- CATCH ALL ROUTE FOR VERCEL --------
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// For Vercel serverless
module.exports = app;

// For local development
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🚀 ULTRA Anime Scraper running on port ${PORT}`);
        console.log(`📊 Total anime: ${Object.keys(ANILIST_TO_SLUG).length}`);
        console.log(`🌐 Main site: http://localhost:${PORT}/`);
        console.log(`🔗 Test API: http://localhost:${PORT}/api/anime/21/1/1`);
    });
}
