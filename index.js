const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();

// Cache for TMDB ID to anime slug mapping
const animeMappingCache = new Map();

// -------- Helper Functions --------

// Function to search animeworld and get the correct slug
async function findAnimeSlug(tmdbId, animeTitle = '') {
    // Check cache first
    if (animeMappingCache.has(tmdbId)) {
        return animeMappingCache.get(tmdbId);
    }

    try {
        // Search on animeworld for the anime
        const searchUrl = `https://watchanimeworld.in/?s=${encodeURIComponent(animeTitle || tmdbId)}`;
        
        const response = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept-Language': 'en-US,en;q=0.9'
            }
        });

        const $ = cheerio.load(response.data);

        // Look for anime links in search results
        let animeSlug = '';
        $('article a').each((i, el) => {
            const href = $(el).attr('href');
            if (href && href.includes('/anime/')) {
                // Extract slug from URL (e.g., https://watchanimeworld.in/anime/naruto-shippuden/)
                const slugMatch = href.match(/\/anime\/([^\/]+)\//);
                if (slugMatch && slugMatch[1]) {
                    animeSlug = slugMatch[1];
                    return false; // Break the loop
                }
            }
        });

        if (animeSlug) {
            animeMappingCache.set(tmdbId, animeSlug);
            return animeSlug;
        }

        return null;
    } catch (error) {
        console.error('Error searching for anime:', error.message);
        return null;
    }
}

// Function to validate TMDB ID format
function isValidTmdbId(tmdbId) {
    return /^\d+$/.test(tmdbId) && tmdbId.length >= 4;
}

// -------- TMDB Anime Endpoint --------
app.get('/api/anime/:tmdbId/:season/:episodeNum', async (req, res) => {
    const { tmdbId, season, episodeNum } = req.params;

    // Validate parameters
    if (!isValidTmdbId(tmdbId)) {
        return res.status(400).json({ error: 'Invalid TMDB ID format' });
    }

    if (!season || !episodeNum || isNaN(season) || isNaN(episodeNum)) {
        return res.status(400).json({ error: 'Invalid season or episode number' });
    }

    try {
        // Step 1: Get anime info from TMDB API to get the title
        let animeTitle = '';
        try {
            const tmdbResponse = await axios.get(
                `https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${process.env.TMDB_API_KEY}`,
                {
                    headers: {
                        'Accept': 'application/json'
                    }
                }
            );
            animeTitle = tmdbResponse.data.name || '';
        } catch (tmdbError) {
            console.log('TMDB API not available, using fallback method');
        }

        // Step 2: Find the anime slug dynamically
        const animeSlug = await findAnimeSlug(tmdbId, animeTitle);
        
        if (!animeSlug) {
            return res.status(404).json({ 
                error: 'Anime not found on animeworld',
                tmdb_id: tmdbId,
                suggested_action: 'Check if the anime exists on https://watchanimeworld.in/'
            });
        }

        // Step 3: Construct episode URL with multiple format attempts
        const urlAttempts = [
            `https://watchanimeworld.in/episode/${animeSlug}-${season}x${episodeNum}/`,
            `https://watchanimeworld.in/episode/${animeSlug}-episode-${episodeNum}/`,
            `https://watchanimeworld.in/episode/${animeSlug}-${episodeNum}/`
        ];

        let finalResponse = null;
        let finalUrl = '';

        // Try different URL formats
        for (const url of urlAttempts) {
            try {
                const response = await axios.get(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Accept-Language': 'en-US,en;q=0.9'
                    },
                    timeout: 5000
                });
                
                if (response.status === 200) {
                    finalResponse = response;
                    finalUrl = url;
                    break;
                }
            } catch (error) {
                continue; // Try next URL format
            }
        }

        if (!finalResponse) {
            return res.status(404).json({ 
                error: 'Episode not found',
                tmdb_id: tmdbId,
                anime_slug: animeSlug,
                season: parseInt(season),
                episode: parseInt(episodeNum)
            });
        }

        const $ = cheerio.load(finalResponse.data);

        // Extract episode information
        const title = $('h1.entry-title').first().text().trim() || 
                     $('title').first().text().trim() || 
                     `Episode ${episodeNum}`;
        
        const description = $('div.entry-content p').first().text().trim() || 
                           $('div.description').first().text().trim() || 
                           '';

        const thumbnail = $('div.post-thumbnail img').attr('src') || 
                         $('img.wp-post-image').attr('src') || 
                         '';

        const embedServers = [];
        $('iframe').each((i, el) => {
            const src = $(el).attr('src');
            if (src && src.startsWith('http')) {
                embedServers.push({
                    name: `Server ${i + 1}`,
                    url: src
                });
            }
        });

        // Alternative: look for video tags
        $('video source').each((i, el) => {
            const src = $(el).attr('src');
            if (src && src.startsWith('http')) {
                embedServers.push({
                    name: `Direct Video ${i + 1}`,
                    url: src
                });
            }
        });

        if (embedServers.length === 0) {
            return res.status(404).json({ 
                error: 'No embed servers found for this episode',
                tmdb_id: tmdbId,
                anime_slug: animeSlug,
                season: parseInt(season),
                episode: parseInt(episodeNum)
            });
        }

        // Successful response
        res.json({
            tmdb_id: tmdbId,
            anime_slug: animeSlug,
            season: parseInt(season),
            episode: parseInt(episodeNum),
            title,
            description,
            thumbnail,
            embed_servers: embedServers,
            source_url: finalUrl
        });

    } catch (err) {
        console.error('Server error:', err.message);
        res.status(500).json({ 
            error: 'Failed to fetch episode details',
            details: err.message 
        });
    }
});

// -------- Additional Endpoints --------

// Endpoint to search anime by name
app.get('/api/search/:animeName', async (req, res) => {
    const { animeName } = req.params;

    try {
        const searchUrl = `https://watchanimeworld.in/?s=${encodeURIComponent(animeName)}`;
        
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
            const description = $(el).find('p').text().trim();

            if (title && url) {
                const slugMatch = url.match(/\/anime\/([^\/]+)\//);
                results.push({
                    title,
                    slug: slugMatch ? slugMatch[1] : '',
                    url,
                    image,
                    description
                });
            }
        });

        res.json({
            search_query: animeName,
            results_count: results.length,
            results
        });

    } catch (error) {
        res.status(500).json({ error: 'Search failed' });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        cache_size: animeMappingCache.size
    });
});

// -------- Start Server --------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Anime API server running on port ${PORT}`);
    console.log('Endpoints:');
    console.log('  GET /api/anime/:tmdbId/:season/:episodeNum');
    console.log('  GET /api/search/:animeName');
    console.log('  GET /health');
});
