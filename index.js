// server.js - Auto-Scraping API for AnimeWorld
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// AnimeWorld Configuration
const ANIMEWORLD_CONFIG = {
    baseUrl: 'https://watchanimeworld.in',
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://watchanimeworld.in/'
    }
};

// AniList API Configuration
const ANILIST_CONFIG = {
    baseUrl: 'https://graphql.anilist.co',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
};

// GraphQL Query to get anime info by ID
const ANIME_QUERY = `
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
            status
            duration
            coverImage {
                large
            }
            genres
            averageScore
            siteUrl
        }
    }
`;

// GraphQL Query to search anime by title
const SEARCH_QUERY = `
    query ($search: String, $type: MediaType) {
        Page {
            media(search: $search, type: $type) {
                id
                title {
                    romaji
                    english
                    native
                }
                episodes
                coverImage {
                    large
                }
                genres
                averageScore
            }
        }
    }
`;

// Convert AniList title to AnimeWorld slug
function titleToSlug(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
}

// Extract players from AnimeWorld page
async function extractPlayersFromAnimeWorld(animeSlug, episode) {
    const players = [];
    
    // Try multiple URL patterns
    const urlPatterns = [
        `${ANIMEWORLD_CONFIG.baseUrl}/episode/${animeSlug}-${episode}/`,
        `${ANIMEWORLD_CONFIG.baseUrl}/episode/${animeSlug}-episode-${episode}/`,
        `${ANIMEWORLD_CONFIG.baseUrl}/watch/${animeSlug}-episode-${episode}/`,
        `${ANIMEWORLD_CONFIG.baseUrl}/episode/${animeSlug}-ep-${episode}/`,
        `${ANIMEWORLD_CONFIG.baseUrl}/series/${animeSlug}/episode-${episode}/`
    ];

    for (const url of urlPatterns) {
        try {
            console.log(`🔍 Trying URL: ${url}`);
            const response = await axios.get(url, {
                headers: ANIMEWORLD_CONFIG.headers,
                timeout: 10000
            });

            if (response.status === 200) {
                const $ = cheerio.load(response.data);
                
                // Extract iframes
                $('iframe[src]').each((i, el) => {
                    let src = $(el).attr('src');
                    if (src) {
                        if (src.startsWith('//')) src = 'https:' + src;
                        if (src.startsWith('/')) src = ANIMEWORLD_CONFIG.baseUrl + src;
                        
                        if (src.includes('streamtape') || src.includes('dood') || src.includes('mixdrop')) {
                            players.push({
                                name: `Server ${players.length + 1}`,
                                url: src,
                                type: 'iframe',
                                quality: 'HD',
                                source: 'direct-iframe'
                            });
                        }
                    }
                });

                // Extract video elements
                $('video source[src]').each((i, el) => {
                    const src = $(el).attr('src');
                    if (src && src.startsWith('http')) {
                        players.push({
                            name: `Direct Video ${players.length + 1}`,
                            url: src,
                            type: 'direct',
                            quality: 'Auto',
                            source: 'video-source'
                        });
                    }
                });

                // Extract from scripts
                $('script').each((i, el) => {
                    const scriptContent = $(el).html();
                    if (scriptContent) {
                        // StreamTape patterns
                        const streamtapeMatches = scriptContent.match(/https?:\/\/[^\s"']*streamtape\.com\/[^\s"']*\/[^\s"']*/gi);
                        if (streamtapeMatches) {
                            streamtapeMatches.forEach(match => {
                                players.push({
                                    name: `StreamTape ${players.length + 1}`,
                                    url: match,
                                    type: 'iframe',
                                    quality: 'HD',
                                    source: 'script-streamtape'
                                });
                            });
                        }

                        // Dood patterns
                        const doodMatches = scriptContent.match(/https?:\/\/[^\s"']*dood\.(?:watch|to|so)[^\s"']*/gi);
                        if (doodMatches) {
                            doodMatches.forEach(match => {
                                players.push({
                                    name: `DoodStream ${players.length + 1}`,
                                    url: match,
                                    type: 'iframe',
                                    quality: 'HD',
                                    source: 'script-dood'
                                });
                            });
                        }

                        // MP4 links
                        const mp4Matches = scriptContent.match(/https?:\/\/[^\s"']*\.mp4[^\s"']*/gi);
                        if (mp4Matches) {
                            mp4Matches.forEach(match => {
                                players.push({
                                    name: `Direct MP4 ${players.length + 1}`,
                                    url: match,
                                    type: 'direct',
                                    quality: 'HD',
                                    source: 'script-mp4'
                                });
                            });
                        }
                    }
                });

                if (players.length > 0) {
                    console.log(`✅ Found ${players.length} players from ${url}`);
                    return { players, sourceUrl: url };
                }
            }
        } catch (error) {
            console.log(`❌ Failed: ${url} - ${error.message}`);
        }
    }

    return { players: [], sourceUrl: null };
}

// Search AnimeWorld for content
async function searchAnimeWorld(query, type = 'anime') {
    try {
        const searchUrl = type === 'cartoon' 
            ? `${ANIMEWORLD_CONFIG.baseUrl}/category/cartoon/`
            : `${ANIMEWORLD_CONFIG.baseUrl}/category/anime/`;

        const response = await axios.get(searchUrl, {
            headers: ANIMEWORLD_CONFIG.headers,
            timeout: 10000
        });

        const $ = cheerio.load(response.data);
        const results = [];

        $('article').each((i, el) => {
            const title = $(el).find('h2 a').text().trim();
            const url = $(el).find('h2 a').attr('href');
            const image = $(el).find('img').attr('src');
            
            if (title.toLowerCase().includes(query.toLowerCase())) {
                const slug = url.split('/').filter(Boolean).pop();
                results.push({
                    title: title,
                    slug: slug,
                    image: image,
                    type: type,
                    url: url
                });
            }
        });

        return results;
    } catch (error) {
        console.error('Search error:', error);
        return [];
    }
}

// Get anime info from AniList
async function getAnimeInfo(anilistId) {
    try {
        const response = await axios.post(ANILIST_CONFIG.baseUrl, {
            query: ANIME_QUERY,
            variables: { id: parseInt(anilistId) }
        }, {
            headers: ANILIST_CONFIG.headers
        });

        if (response.data.data.Media) {
            return response.data.data.Media;
        }
        return null;
    } catch (error) {
        console.error('AniList error:', error);
        return null;
    }
}

// Search anime on AniList
async function searchAniList(query, type = 'ANIME') {
    try {
        const response = await axios.post(ANILIST_CONFIG.baseUrl, {
            query: SEARCH_QUERY,
            variables: { search: query, type: type }
        }, {
            headers: ANILIST_CONFIG.headers
        });

        return response.data.data.Page.media || [];
    } catch (error) {
        console.error('AniList search error:', error);
        return [];
    }
}

// API Routes

// Health check
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Auto-Scraping AnimeWorld API',
        endpoints: {
            '/api/health': 'Health check',
            '/api/anime/:anilistId/:season/:episode': 'Get anime episode',
            '/api/search/:query': 'Search content',
            '/api/cartoon/:query/:episode': 'Get cartoon episode',
            '/api/popular': 'Get popular anime'
        }
    });
});

// Get anime episode by AniList ID
app.get('/api/anime/:anilistId/:season/:episode', async (req, res) => {
    const { anilistId, season, episode } = req.params;

    try {
        console.log(`🎌 Fetching AniList ID: ${anilistId}, Episode: ${episode}`);

        // Get anime info from AniList
        const animeInfo = await getAnimeInfo(anilistId);
        if (!animeInfo) {
            return res.status(404).json({
                success: false,
                error: 'Anime not found on AniList'
            });
        }

        const title = animeInfo.title.english || animeInfo.title.romaji;
        const animeSlug = titleToSlug(title);

        console.log(`🔍 Searching AnimeWorld for: ${title} (slug: ${animeSlug})`);

        // Extract players from AnimeWorld
        const { players, sourceUrl } = await extractPlayersFromAnimeWorld(animeSlug, episode);

        if (players.length > 0) {
            res.json({
                success: true,
                anilist_id: parseInt(anilistId),
                anime_info: {
                    title: title,
                    description: animeInfo.description,
                    episodes: animeInfo.episodes,
                    genres: animeInfo.genres,
                    coverImage: animeInfo.coverImage?.large
                },
                season: parseInt(season),
                episode: parseInt(episode),
                source_url: sourceUrl,
                players: players,
                total_players: players.length,
                timestamp: new Date().toISOString()
            });
        } else {
            // Fallback: Try searching AnimeWorld directly
            const searchResults = await searchAnimeWorld(title);
            if (searchResults.length > 0) {
                const firstResult = searchResults[0];
                const { players: fallbackPlayers } = await extractPlayersFromAnimeWorld(firstResult.slug, episode);
                
                if (fallbackPlayers.length > 0) {
                    return res.json({
                        success: true,
                        anilist_id: parseInt(anilistId),
                        anime_info: {
                            title: title,
                            episodes: animeInfo.episodes,
                            genres: animeInfo.genres
                        },
                        season: parseInt(season),
                        episode: parseInt(episode),
                        players: fallbackPlayers,
                        total_players: fallbackPlayers.length,
                        note: 'Found via direct search'
                    });
                }
            }

            res.json({
                success: false,
                error: 'No players found',
                anilist_id: parseInt(anilistId),
                anime_title: title,
                suggestion: 'Try searching with the exact title'
            });
        }

    } catch (error) {
        console.error('API error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
});

// Search content across AniList and AnimeWorld
app.get('/api/search/:query', async (req, res) => {
    const { query } = req.params;
    const { type = 'anime' } = req.query;

    try {
        console.log(`🔍 Searching for: ${query} (type: ${type})`);

        let results = [];

        if (type === 'anime') {
            // Search AniList for anime
            const anilistResults = await searchAniList(query, 'ANIME');
            results = anilistResults.map(anime => ({
                id: anime.id,
                title: anime.title.english || anime.title.romaji,
                type: 'anime',
                episodes: anime.episodes,
                image: anime.coverImage?.large,
                genres: anime.genres,
                score: anime.averageScore,
                source: 'anilist'
            }));
        }

        // Also search AnimeWorld
        const animeworldResults = await searchAnimeWorld(query, type);
        const awResults = animeworldResults.map(item => ({
            id: titleToSlug(item.title), // Use slug as ID
            title: item.title,
            type: item.type,
            image: item.image,
            slug: item.slug,
            source: 'animeworld'
        }));

        // Merge results, removing duplicates
        const mergedResults = [...results, ...awResults];
        const uniqueResults = mergedResults.filter((item, index, self) =>
            index === self.findIndex(t => t.title.toLowerCase() === item.title.toLowerCase())
        );

        res.json({
            success: true,
            query: query,
            type: type,
            results: uniqueResults,
            total: uniqueResults.length
        });

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            success: false,
            error: 'Search failed',
            message: error.message
        });
    }
});

// Get cartoon episode by title search
app.get('/api/cartoon/:query/:episode', async (req, res) => {
    const { query, episode } = req.params;

    try {
        console.log(`📺 Fetching cartoon: ${query}, Episode: ${episode}`);

        // Search for cartoon on AnimeWorld
        const searchResults = await searchAnimeWorld(query, 'cartoon');
        if (searchResults.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Cartoon not found on AnimeWorld'
            });
        }

        const cartoon = searchResults[0];
        const { players, sourceUrl } = await extractPlayersFromAnimeWorld(cartoon.slug, episode);

        if (players.length > 0) {
            res.json({
                success: true,
                cartoon_info: {
                    title: cartoon.title,
                    slug: cartoon.slug,
                    image: cartoon.image
                },
                episode: parseInt(episode),
                source_url: sourceUrl,
                players: players,
                total_players: players.length,
                timestamp: new Date().toISOString()
            });
        } else {
            res.json({
                success: false,
                error: 'No players found for this episode',
                cartoon_title: cartoon.title,
                suggestion: 'Episode might not be available yet'
            });
        }

    } catch (error) {
        console.error('Cartoon API error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
});

// Get popular anime list from AniList
app.get('/api/popular', async (req, res) => {
    try {
        const popularQuery = `
            query {
                Page(page: 1, perPage: 50) {
                    media(type: ANIME, sort: POPULARITY_DESC) {
                        id
                        title {
                            romaji
                            english
                        }
                        coverImage {
                            large
                        }
                        episodes
                        genres
                        averageScore
                    }
                }
            }
        `;

        const response = await axios.post(ANILIST_CONFIG.baseUrl, {
            query: popularQuery
        }, {
            headers: ANILIST_CONFIG.headers
        });

        const popularAnime = response.data.data.Page.media.map(anime => ({
            id: anime.id,
            title: anime.title.english || anime.title.romaji,
            image: anime.coverImage.large,
            episodes: anime.episodes,
            genres: anime.genres,
            score: anime.averageScore
        }));

        res.json({
            success: true,
            popular: popularAnime,
            total: popularAnime.length
        });

    } catch (error) {
        console.error('Popular anime error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch popular anime'
        });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Auto-Scraping API is running',
        timestamp: new Date().toISOString(),
        features: [
            'AniList integration',
            'AnimeWorld scraping',
            'Automatic slug generation',
            'Multi-source player extraction'
        ]
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Auto-Scraping AnimeWorld API running on port ${PORT}`);
    console.log(`🌐 Local: http://localhost:${PORT}`);
    console.log(`🔗 AniList Integration: Active`);
    console.log(`🎌 AnimeWorld Scraping: Active`);
});

module.exports = app;
