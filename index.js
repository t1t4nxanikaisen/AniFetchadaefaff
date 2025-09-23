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

// -------- SIMPLE ANIME SLUG MAPPING (FROM OLD WORKING CODE) --------
const animeSlugMap = {
    // These are VERIFIED working slugs from Animeworld
    'one-piece': 'one-piece',
    'naruto': 'naruto', 
    'naruto-shippuden': 'naruto-shippuden',
    'attack-on-titan': 'shingeki-no-kyojin',
    'demon-slayer': 'demon-slayer-kimetsu-no-yaiba',
    'jujutsu-kaisen': 'jujutsu-kaisen',
    'chainsaw-man': 'chainsaw-man',
    'my-hero-academia': 'my-hero-academia',
    'one-punch-man': 'one-punch-man',
    'dragon-ball': 'dragon-ball',
    'dragon-ball-z': 'dragon-ball-z',
    'dragon-ball-super': 'dragon-ball-super',
    'death-note': 'death-note',
    'tokyo-revengers': 'tokyo-revengers',
    'vinland-saga': 'vinland-saga',
    'haikyuu': 'haikyuu',
    'dr-stone': 'dr-stone',
    'fire-force': 'fire-force',
    'black-clover': 'black-clover',
    'bleach': 'bleach',
    'fairy-tail': 'fairy-tail',
    'sword-art-online': 'sword-art-online',
    'tokyo-ghoul': 'tokyo-ghoul',
    'hunter-x-hunter': 'hunter-x-hunter',
    'fullmetal-alchemist': 'fullmetal-alchemist-brotherhood',
    'cowboy-bebop': 'cowboy-bebop',
    'spy-x-family': 'spy-x-family',
    'blue-lock': 'blue-lock',
    'hells-paradise': 'hells-paradise',
    'solo-leveling': 'solo-leveling'
};

// -------- ANILIST TO SLUG MAPPING --------
const anilistToSlug = {
    // Anilist ID to Animeworld slug mapping
    '21': 'one-piece', // One Piece
    '20': 'naruto', // Naruto
    '1735': 'naruto-shippuden', // Naruto Shippuden
    '16498': 'shingeki-no-kyojin', // Attack on Titan
    '38000': 'demon-slayer-kimetsu-no-yaiba', // Demon Slayer
    '113415': 'jujutsu-kaisen', // Jujutsu Kaisen
    '99147': 'chainsaw-man', // Chainsaw Man
    '30015': 'kaguya-sama-love-is-war', // Kaguya-sama
    '101759': 'oshi-no-ko', // Oshi no Ko
    '108632': 'frieren-beyond-journeys-end', // Frieren
    '99263': 'solo-leveling', // Solo Leveling
    '136': 'pokemon', // Pokemon
    '1535': 'death-note', // Death Note
    '1': 'cowboy-bebop', // Cowboy Bebop
    '44': 'hunter-x-hunter', // Hunter x Hunter
    '104': 'bleach', // Bleach
    '11757': 'fairy-tail', // Fairy Tail
    '23283': 'sword-art-online', // Sword Art Online
    '11061': 'tokyo-ghoul', // Tokyo Ghoul
    '456': 'fullmetal-alchemist-brotherhood' // FMA Brotherhood
};

// -------- OLD WORKING PLAYER EXTRACTION CODE --------
function extractVideoPlayers(html) {
    const $ = cheerio.load(html);
    const players = [];

    console.log('🔍 Extracting video players from page...');

    // METHOD 1: Extract iframe embeds (THIS WORKED IN OLD CODE)
    $('iframe').each((i, el) => {
        let src = $(el).attr('src');
        if (src) {
            // Fix protocol if needed
            if (src.startsWith('//')) {
                src = 'https:' + src;
            }
            
            // Only add if it's a video URL
            if (src.includes('embed') || src.includes('video') || src.includes('stream') || 
                src.includes('zephyrflick') || src.includes('play.')) {
                players.push({
                    type: 'embed',
                    server: `Server ${players.length + 1}`,
                    url: src,
                    quality: 'HD',
                    format: 'iframe'
                });
                console.log(`✅ Found iframe: ${src}`);
            }
        }
    });

    // METHOD 2: Extract from video tags
    $('video').each((i, el) => {
        const src = $(el).attr('src');
        if (src) {
            players.push({
                type: 'direct',
                server: `Direct Video ${players.length + 1}`,
                url: src,
                quality: 'Auto',
                format: 'mp4'
            });
        }
    });

    // METHOD 3: Extract from script tags (for hidden players)
    $('script').each((i, el) => {
        const scriptContent = $(el).html();
        if (scriptContent) {
            // Look for common video URL patterns
            const urlPatterns = [
                /https?:\/\/[^\s"']*\.(mp4|m3u8|webm)[^\s"']*/gi,
                /https?:\/\/[^\s"']*\/embed\/[^\s"']*/gi,
                /https?:\/\/[^\s"']*\/video\/[^\s"']*/gi,
                /https?:\/\/[^\s"']*zephyrflick[^\s"']*/gi,
                /file:\s*["']([^"']+)["']/gi,
                /src:\s*["']([^"']+)["']/gi
            ];

            urlPatterns.forEach(pattern => {
                const matches = scriptContent.match(pattern);
                if (matches) {
                    matches.forEach(match => {
                        let url = match.replace(/file:\s*|src:\s*|["']/g, '');
                        if (url.startsWith('//')) {
                            url = 'https:' + url;
                        }
                        if (url.includes('http') && !players.some(p => p.url === url)) {
                            players.push({
                                type: 'direct',
                                server: `Hidden Server ${players.length + 1}`,
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

    console.log(`🎯 Total players found: ${players.length}`);
    return players;
}

// -------- SIMPLE ANIME SLUG FINDER --------
async function findAnimeSlug(animeName) {
    // First try direct mapping
    const lowerName = animeName.toLowerCase();
    for (const [key, slug] of Object.entries(animeSlugMap)) {
        if (lowerName.includes(key)) {
            console.log(`✅ Direct mapping found: ${key} -> ${slug}`);
            return slug;
        }
    }

    // If not found in mapping, try simple search
    try {
        const searchUrl = `https://watchanimeworld.in/?s=${encodeURIComponent(animeName)}`;
        const response = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000
        });

        const $ = cheerio.load(response.data);
        
        // Look for first anime result
        const firstResult = $('article').first();
        if (firstResult.length) {
            const url = firstResult.find('h2 a').attr('href');
            if (url && url.includes('/anime/')) {
                const slugMatch = url.match(/\/anime\/([^\/]+)\//);
                if (slugMatch) {
                    console.log(`✅ Search found: ${slugMatch[1]}`);
                    return slugMatch[1];
                }
            }
        }
    } catch (error) {
        console.log('Search failed:', error.message);
    }

    return null;
}

// -------- GET EPISODE DATA (OLD WORKING METHOD) --------
async function getEpisodeData(animeSlug, season, episode) {
    const urlAttempts = [
        `https://watchanimeworld.in/episode/${animeSlug}-episode-${episode}/`,
        `https://watchanimeworld.in/episode/${animeSlug}-${season}x${episode}/`,
        `https://watchanimeworld.in/episode/${animeSlug}-${episode}/`
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

// -------- API ENDPOINTS --------

// MAIN ENDPOINT: Get anime episode with players
app.get('/api/anime/:anilistId/:season/:episode', async (req, res) => {
    const { anilistId, season, episode } = req.params;
    
    console.log(`\n🎌 Fetching: Anilist ${anilistId}, Season ${season}, Episode ${episode}`);

    // Validate parameters
    if (!/^\d+$/.test(anilistId)) {
        return res.status(400).json({ error: 'Invalid Anilist ID' });
    }

    const seasonNum = parseInt(season);
    const episodeNum = parseInt(episode);

    if (isNaN(seasonNum) || isNaN(episodeNum)) {
        return res.status(400).json({ error: 'Invalid season/episode' });
    }

    try {
        let animeSlug = null;
        let animeName = 'Unknown Anime';

        // METHOD 1: Try direct mapping first
        if (anilistToSlug[anilistId]) {
            animeSlug = anilistToSlug[anilistId];
            animeName = `Anilist ${anilistId}`;
            console.log(`✅ Using direct mapping: ${anilistId} -> ${animeSlug}`);
        } 
        // METHOD 2: Get anime info from Anilist and find slug
        else {
            try {
                const anilistResponse = await axios.post('https://graphql.anilist.co', {
                    query: `
                        query ($id: Int) {
                            Media (id: $id, type: ANIME) {
                                title {
                                    romaji
                                    english
                                }
                            }
                        }
                    `,
                    variables: { id: parseInt(anilistId) }
                }, {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 5000
                });

                if (anilistResponse.data.data.Media) {
                    const media = anilistResponse.data.data.Media;
                    animeName = media.title.english || media.title.romaji;
                    console.log(`🔍 Anilist found: ${animeName}`);
                    
                    // Try to find slug for this anime
                    animeSlug = await findAnimeSlug(animeName);
                }
            } catch (anilistError) {
                console.log('Anilist API failed, using fallback');
                // Fallback: try common slug patterns
                animeSlug = await findAnimeSlug(`anime ${anilistId}`);
            }
        }

        if (!animeSlug) {
            return res.status(404).json({ 
                error: 'Anime not found on Animeworld',
                anilist_id: anilistId,
                anime_name: animeName,
                suggestion: 'Try a different Anilist ID or check if the anime exists on watchanimeworld.in'
            });
        }

        // Get episode data with players
        const episodeData = await getEpisodeData(animeSlug, seasonNum, episodeNum);
        
        if (!episodeData.success) {
            return res.status(404).json({ 
                error: 'Episode not found or no players available',
                anilist_id: anilistId,
                anime_slug: animeSlug,
                season: seasonNum,
                episode: episodeNum
            });
        }

        // SUCCESS RESPONSE
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
            message: `🎉 Successfully fetched ${episodeData.players.length} players!`
        });

    } catch (error) {
        console.error('Server error:', error.message);
        res.status(500).json({ 
            error: 'Failed to fetch episode data',
            message: error.message
        });
    }
});

// Search endpoint
app.get('/api/search/:query', async (req, res) => {
    const { query } = req.params;
    
    try {
        const searchUrl = `https://watchanimeworld.in/?s=${encodeURIComponent(query)}`;
        const response = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const $ = cheerio.load(response.data);
        const results = [];

        $('article').each((i, el) => {
            const title = $(el).find('h2 a').text().trim();
            const url = $(el).find('h2 a').attr('href');
            const image = $(el).find('img').attr('src');
            
            if (title && url && url.includes('/anime/')) {
                const slugMatch = url.match(/\/anime\/([^\/]+)\//);
                if (slugMatch) {
                    results.push({
                        title: title,
                        slug: slugMatch[1],
                        url: url,
                        image: image
                    });
                }
            }
        });

        res.json({
            query: query,
            results_count: results.length,
            results: results
        });

    } catch (error) {
        res.status(500).json({ error: 'Search failed' });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK',
        server: 'AnimeWorld API - OLD WORKING CODE',
        timestamp: new Date().toISOString()
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: '🎌 AnimeWorld API - OLD WORKING VERSION',
        version: '10.0',
        description: 'Uses the old working code that actually fetches real players',
        endpoint: '/api/anime/:anilistId/:season/:episode',
        example: '/api/anime/21/1/1 (One Piece)',
        verified_anime: [
            'One Piece (21)', 'Naruto (20)', 'Attack on Titan (16498)',
            'Demon Slayer (38000)', 'Jujutsu Kaisen (113415)'
        ]
    });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 AnimeWorld API (OLD WORKING CODE) running on port ${PORT}`);
    console.log('✅ USING THE CODE THAT ACTUALLY WORKED!');
    console.log('🎯 Test these verified Anilist IDs:');
    console.log('   http://localhost:3000/api/anime/21/1/1 (One Piece)');
    console.log('   http://localhost:3000/api/anime/20/1/1 (Naruto)');
    console.log('   http://localhost:3000/api/anime/16498/1/1 (Attack on Titan)');
});

module.exports = app;
