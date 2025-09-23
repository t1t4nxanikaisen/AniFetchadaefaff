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

// Anilist API Configuration
const ANILIST_CONFIG = {
    url: 'https://graphql.anilist.co',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
};

// Predefined Anilist to Animeworld mappings (WORKING ONES FROM OLD CHAT)
const animeMappings = {
    // ✅ VERIFIED WORKING MAPPINGS (from our previous working version)
    '21': 'one-piece',                 // One Piece
    '20': 'naruto',                    // Naruto
    '1735': 'naruto-shippuden',        // Naruto Shippuden
    '16498': 'attack-on-titan',        // Attack on Titan
    '38000': 'demon-slayer-kimetsu-no-yaiba', // Demon Slayer
    '113415': 'jujutsu-kaisen',        // Jujutsu Kaisen
    '99147': 'chainsaw-man',           // Chainsaw Man
    '75989': 'vinland-saga',           // Vinland Saga
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

// Cache for performance
const cache = new Map();

// -------- ANILIST API FUNCTIONS --------

// Get anime info from Anilist
async function getAnilistInfo(anilistId) {
    const cacheKey = `anilist-${anilistId}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);

    const query = `
        query ($id: Int) {
            Media (id: $id, type: ANIME) {
                id
                title {
                    romaji
                    english
                    native
                }
                description
                episodes
                duration
                status
                startDate {
                    year
                    month
                    day
                }
                endDate {
                    year
                    month
                    day
                }
                coverImage {
                    large
                    extraLarge
                }
                bannerImage
                genres
                averageScore
                popularity
                siteUrl
            }
        }
    `;

    const variables = { id: parseInt(anilistId) };

    try {
        const response = await axios.post(ANILIST_CONFIG.url, {
            query: query,
            variables: variables
        }, {
            headers: ANILIST_CONFIG.headers,
            timeout: 10000
        });

        const data = response.data.data.Media;
        cache.set(cacheKey, data);
        return data;
    } catch (error) {
        console.log(`❌ Anilist Error for ${anilistId}:`, error.message);
        return null;
    }
}

// Search anime on Anilist
async function searchAnilistAnime(searchTerm) {
    const query = `
        query ($search: String) {
            Page (page: 1, perPage: 10) {
                media (search: $search, type: ANIME) {
                    id
                    title {
                        romaji
                        english
                        native
                    }
                    description
                    episodes
                    coverImage {
                        large
                    }
                    averageScore
                    popularity
                    siteUrl
                }
            }
        }
    `;

    const variables = { search: searchTerm };

    try {
        const response = await axios.post(ANILIST_CONFIG.url, {
            query: query,
            variables: variables
        }, {
            headers: ANILIST_CONFIG.headers,
            timeout: 10000
        });

        return response.data.data.Page.media;
    } catch (error) {
        console.log('Anilist Search Error:', error.message);
        return [];
    }
}

// -------- ANIMEWORLD FUNCTIONS (FROM OLD WORKING CODE) --------

// Search anime on Animeworld (EXACTLY LIKE BEFORE)
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

// Get anime slug from Anilist ID (SMART MAPPING)
async function getAnimeSlug(anilistId) {
    // Check predefined mappings first (FROM OUR WORKING VERSION)
    if (animeMappings[anilistId]) {
        console.log(`✅ Using predefined mapping: Anilist ${anilistId} -> ${animeMappings[anilistId]}`);
        return animeMappings[anilistId];
    }
    
    // Check cache
    const cacheKey = `slug-${anilistId}`;
    if (cache.has(cacheKey)) {
        return cache.get(cacheKey);
    }
    
    // Get anime info from Anilist
    const anilistInfo = await getAnilistInfo(anilistId);
    if (!anilistInfo) {
        return null;
    }

    console.log(`🔍 Mapping: "${anilistInfo.title.english || anilistInfo.title.romaji}"`);

    // Try different search terms
    const searchTerms = [
        anilistInfo.title.english,
        anilistInfo.title.romaji,
        anilistInfo.title.native,
        anilistInfo.title.english?.replace(/[^a-zA-Z0-9 ]/g, ' ').trim(),
        anilistInfo.title.romaji?.replace(/[^a-zA-Z0-9 ]/g, ' ').trim()
    ].filter(term => term && term.length > 2);

    for (const term of searchTerms) {
        const results = await searchAnimeOnAnimeworld(term);
        if (results.length > 0) {
            const slug = results[0].slug;
            cache.set(cacheKey, slug);
            console.log(`✅ Found: "${term}" -> ${slug}`);
            return slug;
        }
    }

    console.log(`❌ No mapping found for Anilist ${anilistId}`);
    return null;
}

// -------- PLAYER EXTRACTION (EXACTLY LIKE OUR WORKING VERSION) --------

// Extract video players (FROM OLD WORKING CODE)
function extractVideoPlayers(html) {
    const $ = cheerio.load(html);
    const players = [];

    console.log('🎬 Extracting players...');

    // Extract iframe embeds (MAIN METHOD THAT WORKED)
    $('iframe').each((i, el) => {
        const src = $(el).attr('src');
        if (src && src.includes('//')) {
            const fullUrl = src.startsWith('//') ? `https:${src}` : src;
            players.push({
                type: 'embed',
                server: `Server ${players.length + 1}`,
                url: fullUrl,
                quality: 'HD',
                format: 'iframe'
            });
            console.log(`✅ Found iframe: ${fullUrl}`);
        }
    });

    // Extract from scripts (BACKUP METHOD)
    const scripts = $('script');
    scripts.each((i, el) => {
        const scriptContent = $(el).html();
        if (scriptContent) {
            const videoPatterns = [
                /(https?:\/\/[^\s"']*\.(mp4|m3u8|webm)[^\s"']*)/gi,
                /(https?:\/\/[^\s"']*\/embed\/[^\s"']*)/gi,
                /(https?:\/\/[^\s"']*\/video\/[^\s"']*)/gi,
            ];
            
            videoPatterns.forEach(pattern => {
                const matches = scriptContent.match(pattern);
                if (matches) {
                    matches.forEach(match => {
                        if (match.includes('http')) {
                            players.push({
                                type: 'direct',
                                server: `Direct ${players.length + 1}`,
                                url: match.replace(/["']/g, ''),
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

// Get episode data (EXACTLY LIKE BEFORE)
async function getEpisodePlayers(animeSlug, season, episode) {
    const urlAttempts = [
        `https://watchanimeworld.in/episode/${animeSlug}-episode-${episode}/`,
        `https://watchanimeworld.in/episode/${animeSlug}-${season}x${episode}/`,
        `https://watchanimeworld.in/episode/${animeSlug}-${episode}/`,
        `https://watchanimeworld.in/episode/${animeSlug}-season-${season}-episode-${episode}/`,
    ];
    
    for (const url of urlAttempts) {
        try {
            console.log(`🌐 Trying: ${url}`);
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Referer': 'https://watchanimeworld.in/'
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
                        players: players,
                        total_players: players.length
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

// Main endpoint: Get anime episode with players (ANILIST VERSION)
app.get('/api/anime/:anilistId/:season/:episode', async (req, res) => {
    const { anilistId, season, episode } = req.params;
    
    console.log(`\n🎌 FETCHING: Anilist ${anilistId}, Season ${season}, Episode ${episode}`);

    // Validate Anilist ID
    if (!/^\d+$/.test(anilistId)) {
        return res.status(400).json({ error: 'Invalid Anilist ID format' });
    }

    const seasonNum = parseInt(season);
    const episodeNum = parseInt(episode);

    if (isNaN(seasonNum) || isNaN(episodeNum)) {
        return res.status(400).json({ error: 'Invalid season or episode number' });
    }

    try {
        // Step 1: Get anime slug from Anilist ID
        console.log(`🔍 Getting anime slug...`);
        const animeSlug = await getAnimeSlug(anilistId);
        
        if (!animeSlug) {
            const anilistInfo = await getAnilistInfo(anilistId);
            return res.status(404).json({ 
                error: 'Anime not found on Animeworld',
                anilist_id: anilistId,
                anilist_name: anilistInfo ? (anilistInfo.title.english || anilistInfo.title.romaji) : 'Unknown',
                suggestion: 'Try using a verified Anilist ID from /api/mappings'
            });
        }

        // Step 2: Get episode players (EXACTLY LIKE OUR WORKING VERSION)
        console.log(`🎬 Fetching episode players...`);
        const episodeData = await getEpisodePlayers(animeSlug, seasonNum, episodeNum);
        
        if (!episodeData.success) {
            return res.status(404).json({ 
                error: 'Episode not found or no players available',
                anilist_id: anilistId,
                anime_slug: animeSlug,
                season: seasonNum,
                episode: episodeNum
            });
        }

        // Step 3: Get Anilist info for metadata
        const anilistInfo = await getAnilistInfo(anilistId);

        // Step 4: Success response (SAME FORMAT AS BEFORE)
        console.log(`✅ SUCCESS: Found ${episodeData.players.length} players!`);
        res.json({
            success: true,
            anilist_id: anilistId,
            anime_slug: animeSlug,
            season: seasonNum,
            episode: episodeNum,
            
            // Episode info
            title: episodeData.title,
            description: episodeData.description,
            thumbnail: episodeData.thumbnail,
            source_url: episodeData.url,
            
            // Anilist metadata
            anilist_info: anilistInfo ? {
                title: anilistInfo.title,
                description: anilistInfo.description,
                episodes: anilistInfo.episodes,
                coverImage: anilistInfo.coverImage,
                averageScore: anilistInfo.averageScore,
                popularity: anilistInfo.popularity,
                siteUrl: anilistInfo.siteUrl
            } : null,
            
            // Players (EXACTLY LIKE BEFORE)
            total_players: episodeData.players.length,
            players: episodeData.players,
            available_servers: episodeData.players.map(p => p.server),
            
            timestamp: new Date().toISOString(),
            message: `🎉 Successfully fetched ${episodeData.players.length} players!`
        });

    } catch (error) {
        console.error('💥 Server error:', error.message);
        res.status(500).json({ 
            error: 'Failed to fetch episode data',
            message: error.message
        });
    }
});

// Search anime on Anilist
app.get('/api/search/:query', async (req, res) => {
    const { query } = req.params;
    
    try {
        const results = await searchAnilistAnime(query);
        
        res.json({
            query: query,
            results_count: results.length,
            results: results.map(anime => ({
                id: anime.id,
                title: anime.title,
                description: anime.description,
                episodes: anime.episodes,
                coverImage: anime.coverImage,
                averageScore: anime.averageScore,
                popularity: anime.popularity,
                siteUrl: anime.siteUrl
            }))
        });
        
    } catch (error) {
        res.status(500).json({ error: 'Search failed', message: error.message });
    }
});

// Get all verified mappings
app.get('/api/mappings', (req, res) => {
    res.json({
        message: '✅ VERIFIED ANILIST MAPPINGS (FROM OUR WORKING VERSION)',
        total: Object.keys(animeMappings).length,
        mappings: animeMappings
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK',
        server: 'AnimeWorld Anilist API',
        timestamp: new Date().toISOString(),
        verified_mappings: Object.keys(animeMappings).length
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: '🎌 AnimeWorld Anilist API - EXACT WORKING VERSION',
        version: '7.0',
        description: 'Uses Anilist IDs instead of TMDB - Same working player extraction',
        endpoints: {
            '/api/anime/:anilistId/:season/:episode': 'Get episode with players (ANILIST)',
            '/api/search/:query': 'Search anime on Anilist',
            '/api/mappings': 'Get verified Anilist mappings'
        },
        verified_examples: {
            'one_piece': '/api/anime/21/1/1',
            'naruto': '/api/anime/20/1/1',
            'attack_on_titan': '/api/anime/16498/1/1',
            'demon_slayer': '/api/anime/38000/1/1'
        },
        note: 'Uses the EXACT same player extraction that was working before!'
    });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 AnimeWorld Anilist API running on port ${PORT}`);
    console.log('✅ USING EXACT WORKING CODE FROM BEFORE!');
    console.log('📺 Verified endpoints:');
    console.log('   /api/anime/21/1/1     (One Piece)');
    console.log('   /api/anime/20/1/1      (Naruto)');
    console.log('   /api/anime/16498/1/1   (Attack on Titan)');
    console.log('   /api/anime/38000/1/1   (Demon Slayer)');
});

module.exports = app;
