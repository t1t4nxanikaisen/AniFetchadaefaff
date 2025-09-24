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

// ========== COMPREHENSIVE ANIME DATABASE ==========
const ANIME_DATABASE = {
    // Popular Anime - CORRECTED Slugs based on actual AnimeWorld URLs
    '21': { slug: 'one-piece', title: 'One Piece', alternativeSlugs: ['one-piece-tv'] },
    '20': { slug: 'naruto', title: 'Naruto', alternativeSlugs: ['naruto-tv'] },
    '1735': { slug: 'naruto-shippuden', title: 'Naruto Shippuden', alternativeSlugs: ['naruto-shippuuden'] },
    '16498': { slug: 'attack-on-titan', title: 'Attack on Titan', alternativeSlugs: ['shingeki-no-kyojin', 'aot'] },
    '38000': { slug: 'demon-slayer', title: 'Demon Slayer', alternativeSlugs: ['kimetsu-no-yaiba'] },
    '113415': { slug: 'jujutsu-kaisen', title: 'Jujutsu Kaisen', alternativeSlugs: ['jjk'] },
    '99147': { slug: 'chainsaw-man', title: 'Chainsaw Man', alternativeSlugs: ['chainsawman'] },
    '101759': { slug: 'oshi-no-ko', title: 'Oshi no Ko', alternativeSlugs: ['my-star'] },
    '11061': { slug: 'tokyo-ghoul', title: 'Tokyo Ghoul', alternativeSlugs: [] },
    '23283': { slug: 'sword-art-online', title: 'Sword Art Online', alternativeSlugs: ['sao'] },
    
    // Fixed major anime slugs
    '1': { slug: 'cowboy-bebop', title: 'Cowboy Bebop', alternativeSlugs: [] },
    '44': { slug: 'hunter-x-hunter-2011', title: 'Hunter x Hunter', alternativeSlugs: ['hunter-x-hunter', 'hxh'] },
    '104': { slug: 'bleach', title: 'Bleach', alternativeSlugs: ['bleach-tv'] },
    '136': { slug: 'pokemon', title: 'Pokémon', alternativeSlugs: ['pokemon-tv'] },
    '456': { slug: 'fullmetal-alchemist-brotherhood', title: 'Fullmetal Alchemist: Brotherhood', alternativeSlugs: ['fma-brotherhood', 'fmab'] },
    '1535': { slug: 'death-note', title: 'Death Note', alternativeSlugs: [] },
    '11757': { slug: 'fairy-tail', title: 'Fairy Tail', alternativeSlugs: [] },
    '30015': { slug: 'kaguya-sama-love-is-war', title: 'Kaguya-sama: Love Is War', alternativeSlugs: ['kaguya-sama'] },
    '108632': { slug: 'frieren-beyond-journeys-end', title: 'Frieren: Beyond Journey\'s End', alternativeSlugs: ['frieren', 'sousou-no-frieren'] },
    '99263': { slug: 'solo-leveling', title: 'Solo Leveling', alternativeSlugs: [] },

    // Additional verified anime with proper slugs
    '9253': { slug: 'steins-gate', title: 'Steins;Gate', alternativeSlugs: ['steinsgate'] },
    '6547': { slug: 'angel-beats', title: 'Angel Beats!', alternativeSlugs: [] },
    '20583': { slug: 'noragami', title: 'Noragami', alternativeSlugs: [] },
    '22199': { slug: 'one-punch-man', title: 'One Punch Man', alternativeSlugs: ['opm'] },
    '22319': { slug: 'dragon-ball-super', title: 'Dragon Ball Super', alternativeSlugs: ['dbs'] },
    '28851': { slug: 'haikyu', title: 'Haikyu!!', alternativeSlugs: ['haikyuu'] },
    '30002': { slug: 'seven-deadly-sins', title: 'The Seven Deadly Sins', alternativeSlugs: ['nanatsu-no-taizai'] },
    '31478': { slug: 'my-hero-academia', title: 'My Hero Academia', alternativeSlugs: ['boku-no-hero-academia', 'mha', 'bnha'] },
    '32268': { slug: 're-zero', title: 'Re:ZERO -Starting Life in Another World-', alternativeSlugs: ['rezero'] },
    '32901': { slug: 'mob-psycho-100', title: 'Mob Psycho 100', alternativeSlugs: ['mp100'] },
    '34104': { slug: 'dr-stone', title: 'Dr. Stone', alternativeSlugs: [] },
    '34933': { slug: 'vinland-saga', title: 'Vinland Saga', alternativeSlugs: [] },
    '36456': { slug: 'promised-neverland', title: 'The Promised Neverland', alternativeSlugs: ['the-promised-neverland'] },
    '39597': { slug: 'fire-force', title: 'Fire Force', alternativeSlugs: ['en-en-no-shouboutai'] },
    '47994': { slug: 'tokyo-revengers', title: 'Tokyo Revengers', alternativeSlugs: [] },
    '53025': { slug: 'blue-lock', title: 'Blue Lock', alternativeSlugs: [] },
    '55123': { slug: 'spy-x-family', title: 'SPY x FAMILY', alternativeSlugs: ['spy-family'] },
    '59637': { slug: 'eminence-in-shadow', title: 'The Eminence in Shadow', alternativeSlugs: ['kage-no-jitsuryokusha'] },
    '60789': { slug: 'hells-paradise', title: 'Hell\'s Paradise', alternativeSlugs: ['jigokuraku'] },
    '61845': { slug: 'mashle', title: 'Mashle: Magic and Muscles', alternativeSlugs: [] },
};

// ========== SOURCE CONFIGURATION ==========
const SOURCES = {
    ANIMEWORLD: {
        name: 'AnimeWorld',
        baseUrl: 'https://watchanimeworld.in',
        searchUrl: 'https://watchanimeworld.in/?s=',
        episodeUrl: 'https://watchanimeworld.in/episode'
    },
    BACKUP: {
        name: 'Backup Source',
        baseUrl: 'https://animeworld-india.me',
        searchUrl: 'https://animeworld-india.me/?s=',
        episodeUrl: 'https://animeworld-india.me/episode'
    }
};

// ========== IMPROVED ANIME SLUG RESOLVER ==========
async function getAnimeSlug(anilistId) {
    // Check database first
    if (ANIME_DATABASE[anilistId]) {
        console.log(`✅ Found in database: ${anilistId} -> ${ANIME_DATABASE[anilistId].slug}`);
        return ANIME_DATABASE[anilistId].slug;
    }
    
    // If not found, try to search using AniList API to get proper title
    try {
        console.log(`🔍 Anime ID ${anilistId} not in database, fetching from AniList...`);
        
        // Get anime info from AniList API
        const anilistQuery = `
        query ($id: Int) {
            Media (id: $id, type: ANIME) {
                title {
                    romaji
                    english
                    native
                }
                synonyms
            }
        }`;

        const anilistResponse = await axios.post('https://graphql.anilist.co', {
            query: anilistQuery,
            variables: { id: parseInt(anilistId) }
        });

        if (anilistResponse.data && anilistResponse.data.data && anilistResponse.data.data.Media) {
            const media = anilistResponse.data.data.Media;
            const titles = [
                media.title.english,
                media.title.romaji,
                ...media.synonyms
            ].filter(Boolean);

            console.log(`📋 Found titles from AniList: ${titles.join(', ')}`);

            // Try searching with each title
            for (const title of titles) {
                const searchResults = await searchAnime(title, 'ANIMEWORLD');
                if (searchResults.length > 0) {
                    const slug = searchResults[0].slug;
                    // Add to database for future use
                    ANIME_DATABASE[anilistId] = {
                        slug: slug,
                        title: media.title.english || media.title.romaji,
                        alternativeSlugs: []
                    };
                    console.log(`✅ Added new anime to database: ${anilistId} -> ${slug}`);
                    return slug;
                }
            }
        }
    } catch (error) {
        console.error('Error fetching from AniList:', error.message);
    }
    
    // Final fallback - try searching with the ID as a number
    try {
        const searchResults = await searchAnime(anilistId, 'ANIMEWORLD');
        if (searchResults.length > 0) {
            return searchResults[0].slug;
        }
    } catch (error) {
        console.error('Error in fallback search:', error);
    }
    
    // Ultimate fallback
    return `anime-${anilistId}`;
}

// ========== IMPROVED ANIME SEARCH FUNCTION ==========
async function searchAnime(query, source = 'ANIMEWORLD') {
    try {
        const config = SOURCES[source];
        const searchUrl = `${config.searchUrl}${encodeURIComponent(query)}`;
        
        console.log(`🔍 Searching for "${query}" on ${source}: ${searchUrl}`);
        
        const response = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Cache-Control': 'no-cache',
                'Referer': config.baseUrl,
                'DNT': '1',
                'Connection': 'keep-alive'
            },
            timeout: 15000
        });

        const $ = cheerio.load(response.data);
        const results = [];

        // Enhanced selectors for better search result extraction
        const searchSelectors = [
            'article.post',
            '.search-result',
            '.anime-item',
            'article',
            '.post',
            '.result-item',
            '.anime-card'
        ];

        for (const selector of searchSelectors) {
            $(selector).each((i, el) => {
                const $el = $(el);
                
                // Multiple ways to get title
                const titleSelectors = [
                    'h2 a',
                    'h3 a', 
                    '.title a',
                    '.entry-title a',
                    'a[href*="/episode/"]',
                    'a[href*="/anime/"]',
                    '.post-title a'
                ];
                
                let title = '';
                let url = '';
                
                for (const titleSel of titleSelectors) {
                    const titleEl = $el.find(titleSel).first();
                    if (titleEl.length && titleEl.text().trim()) {
                        title = titleEl.text().trim();
                        url = titleEl.attr('href');
                        break;
                    }
                }

                const image = $el.find('img').attr('src') || $el.find('img').attr('data-src') || '';
                const description = $el.find('p, .entry-content, .excerpt').first().text().trim() || '';
                
                if (title && url && !results.some(r => r.url === url)) {
                    let slug = extractSlugFromUrl(url);
                    
                    if (slug && slug.length > 2) {
                        results.push({
                            title: title,
                            slug: slug,
                            url: url,
                            image: image,
                            description: description,
                            source: source
                        });
                    }
                }
            });
            
            if (results.length > 0) break; // If we found results with one selector, use them
        }

        console.log(`✅ Found ${results.length} results for "${query}" on ${source}`);
        
        // Sort results by relevance (exact match first)
        results.sort((a, b) => {
            const queryLower = query.toLowerCase();
            const aTitle = a.title.toLowerCase();
            const bTitle = b.title.toLowerCase();
            
            if (aTitle === queryLower && bTitle !== queryLower) return -1;
            if (bTitle === queryLower && aTitle !== queryLower) return 1;
            if (aTitle.includes(queryLower) && !bTitle.includes(queryLower)) return -1;
            if (bTitle.includes(queryLower) && !aTitle.includes(queryLower)) return 1;
            
            return 0;
        });
        
        return results;
    } catch (error) {
        console.error(`❌ Search error (${source}):`, error.message);
        return [];
    }
}

// ========== IMPROVED SLUG EXTRACTION ==========
function extractSlugFromUrl(url) {
    if (!url) return '';
    
    // Remove trailing slash and decode URL
    url = decodeURIComponent(url.replace(/\/$/, ''));
    
    // Multiple extraction patterns for different URL structures
    const patterns = [
        // Standard episode URLs: /episode/anime-name-episode-1/
        /\/episode\/([^\/]+?)(?:-episode-\d+)?(?:\/)?$/,
        // Anime page URLs: /anime/anime-name/
        /\/anime\/([^\/]+)(?:\/)?$/,
        // Watch URLs: /watch/anime-name/
        /\/watch\/([^\/]+)(?:\/)?$/,
        // Direct anime name after domain: /anime-name/
        /\/([^\/]+?)(?:-episode-\d+)?(?:\/)?$/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            let slug = match[1];
            
            // Clean up the slug
            slug = slug
                .replace(/-episode-\d+$/, '')  // Remove episode numbers
                .replace(/-season-\d+$/, '')   // Remove season numbers
                .replace(/-\d{4}$/, '')        // Remove years
                .replace(/^watch-/, '')        // Remove 'watch-' prefix
                .replace(/^anime-/, '')        // Remove 'anime-' prefix
                .toLowerCase()
                .trim();
            
            // Ensure slug is meaningful
            if (slug.length > 2 && !slug.includes('?') && !slug.includes('&')) {
                console.log(`🎯 Extracted slug: "${slug}" from URL: ${url}`);
                return slug;
            }
        }
    }
    
    console.log(`❌ Could not extract slug from URL: ${url}`);
    return '';
}

// ========== ENHANCED PLAYER EXTRACTION ==========
function extractVideoPlayers(html, source) {
    const $ = cheerio.load(html);
    const players = [];
    const foundUrls = new Set(); // Prevent duplicates

    console.log(`🎬 Extracting players from ${source}...`);

    // Method 1: Direct iframes
    $('iframe').each((i, el) => {
        let src = $(el).attr('src') || $(el).attr('data-src');
        if (src) {
            if (src.startsWith('//')) src = 'https:' + src;
            if (isValidVideoUrl(src) && !foundUrls.has(src)) {
                foundUrls.add(src);
                players.push({
                    type: 'embed',
                    server: `${source} Server ${players.length + 1}`,
                    url: src,
                    quality: 'HD',
                    format: 'iframe',
                    source: source
                });
                console.log(`📺 Found iframe: ${src}`);
            }
        }
    });

    // Method 2: Video tags
    $('video, source').each((i, el) => {
        const src = $(el).attr('src') || $(el).attr('data-src');
        if (src) {
            const fullSrc = src.startsWith('//') ? 'https:' + src : src;
            if (isValidVideoUrl(fullSrc) && !foundUrls.has(fullSrc)) {
                foundUrls.add(fullSrc);
                players.push({
                    type: 'direct',
                    server: `${source} Direct ${players.length + 1}`,
                    url: fullSrc,
                    quality: 'Auto',
                    format: getVideoFormat(fullSrc),
                    source: source
                });
                console.log(`🎥 Found video tag: ${fullSrc}`);
            }
        }
    });

    // Method 3: Enhanced script content analysis
    $('script').each((i, el) => {
        const scriptContent = $(el).html();
        if (scriptContent && scriptContent.length > 50) {
            // More comprehensive video patterns
            const videoPatterns = [
                // Common player configurations
                /(?:src|file|url|video|stream|link)["'\s]*:["'\s]*["']([^"']+)["']/gi,
                /(?:videoUrl|streamUrl|embedUrl|playerUrl)["'\s]*:["'\s]*["']([^"']+)["']/gi,
                // Direct URL patterns
                /(https?:\/\/[^\s"'<>]+\.(mp4|m3u8|webm|mkv)[^\s"'<>]*)/gi,
                // Embed patterns
                /(https?:\/\/[^\s"'<>]*\/(?:embed|player|video|stream)\/[^\s"'<>]*)/gi,
                // Known video hosting domains
                /(https?:\/\/[^\s"'<>]*(?:streamtape|doodstream|mixdrop|mp4upload|vidstream|gogostream)[^\s"'<>]*)/gi,
                // Generic streaming patterns
                /(https?:\/\/[^\s"'<>]*(?:embed|player|video|stream)[^\s"'<>]*)/gi
            ];

            for (const pattern of videoPatterns) {
                let match;
                while ((match = pattern.exec(scriptContent)) !== null) {
                    let url = match[1];
                    
                    // Clean up the URL
                    url = url.replace(/['"]/g, '').trim();
                    
                    if (url.startsWith('//')) url = 'https:' + url;
                    
                    if (isValidVideoUrl(url) && !foundUrls.has(url)) {
                        foundUrls.add(url);
                        players.push({
                            type: 'script',
                            server: `${source} Script ${players.length + 1}`,
                            url: url,
                            quality: 'HD',
                            format: getVideoFormat(url),
                            source: source
                        });
                        console.log(`🔧 Found script URL: ${url}`);
                    }
                }
            }
        }
    });

    // Method 4: Data attributes
    $('[data-src], [data-url], [data-file], [data-video], [data-stream]').each((i, el) => {
        const attrs = ['data-src', 'data-url', 'data-file', 'data-video', 'data-stream'];
        for (const attr of attrs) {
            const src = $(el).attr(attr);
            if (src) {
                const fullSrc = src.startsWith('//') ? 'https:' + src : src;
                if (isValidVideoUrl(fullSrc) && !foundUrls.has(fullSrc)) {
                    foundUrls.add(fullSrc);
                    players.push({
                        type: 'data',
                        server: `${source} Data ${players.length + 1}`,
                        url: fullSrc,
                        quality: 'Auto',
                        format: getVideoFormat(fullSrc),
                        source: source
                    });
                    console.log(`📊 Found data URL: ${fullSrc}`);
                    break;
                }
            }
        }
    });

    console.log(`🎯 Found ${players.length} unique players from ${source}`);
    return players;
}

// ========== ENHANCED HELPER FUNCTIONS ==========
function isValidVideoUrl(url) {
    if (!url || typeof url !== 'string') return false;
    if (url.length < 10) return false;
    
    // Remove common false positives
    const excludePatterns = [
        /\/wp-content\/themes\//,
        /\/assets\//,
        /\/css\//,
        /\/js\//,
        /\.css/,
        /\.js$/,
        /\.png$/,
        /\.jpg$/,
        /\.gif$/,
        /facebook\.com/,
        /twitter\.com/,
        /instagram\.com/
    ];
    
    for (const pattern of excludePatterns) {
        if (pattern.test(url)) return false;
    }
    
    const validIndicators = [
        // Video hosting domains
        'streamtape', 'doodstream', 'dood', 'mixdrop', 'mp4upload', 
        'vidstream', 'gogostream', 'embtaku', 'filemoon', 'vidcloud', 
        'sbplay', 'fembed', 'voe', 'streamwish', 'streamhub',
        
        // Video file extensions
        '.mp4', '.m3u8', '.webm', '.mkv', '.avi', '.mov', '.flv',
        
        // Streaming keywords
        '/embed/', '/player/', '/video/', '/stream/', '/watch/'
    ];
    
    return validIndicators.some(indicator => url.toLowerCase().includes(indicator.toLowerCase()));
}

function getVideoFormat(url) {
    if (url.includes('.m3u8')) return 'hls';
    if (url.includes('.mp4')) return 'mp4';
    if (url.includes('.webm')) return 'webm';
    if (url.includes('.mkv')) return 'mkv';
    return 'auto';
}

// ========== ENHANCED EPISODE FETCHER WITH MULTIPLE SLUG ATTEMPTS ==========
async function getEpisodeData(animeSlug, season, episode, source = 'ANIMEWORLD') {
    const config = SOURCES[source];
    
    // Get alternative slugs if available
    const dbEntry = Object.values(ANIME_DATABASE).find(entry => 
        entry.slug === animeSlug || entry.alternativeSlugs.includes(animeSlug)
    );
    
    const slugsToTry = [animeSlug];
    if (dbEntry && dbEntry.alternativeSlugs) {
        slugsToTry.push(...dbEntry.alternativeSlugs);
    }
    
    console.log(`🔍 Trying ${source} with slugs: ${slugsToTry.join(', ')}, episode: ${episode}`);

    for (const currentSlug of slugsToTry) {
        // More URL patterns for each slug
        const urlAttempts = [
            // Primary patterns
            `${config.episodeUrl}/${currentSlug}-episode-${episode}/`,
            `${config.episodeUrl}/${currentSlug}-episode-${episode}`,
            `${config.baseUrl}/episode/${currentSlug}-episode-${episode}/`,
            `${config.baseUrl}/episode/${currentSlug}-episode-${episode}`,
            
            // Alternative patterns
            `${config.baseUrl}/episode/${currentSlug}-${episode}/`,
            `${config.baseUrl}/episode/${currentSlug}-ep-${episode}/`,
            `${config.baseUrl}/watch/${currentSlug}-episode-${episode}/`,
            `${config.baseUrl}/anime/${currentSlug}/episode-${episode}/`,
            
            // Season-specific patterns
            `${config.episodeUrl}/${currentSlug}-season-${season}-episode-${episode}/`,
            `${config.episodeUrl}/${currentSlug}-s${season}-e${episode}/`,
            `${config.episodeUrl}/${currentSlug}-${season}x${episode}/`,
            
            // Fallback patterns
            `${config.baseUrl}/${currentSlug}-episode-${episode}/`,
            `${config.baseUrl}/${currentSlug}-ep${episode}/`,
            `${config.baseUrl}/${currentSlug}/${episode}/`
        ];

        for (const url of urlAttempts) {
            try {
                console.log(`🌐 Attempting: ${url}`);
                
                const response = await axios.get(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.9',
                        'Referer': config.baseUrl
                    },
                    timeout: 15000,
                    validateStatus: status => status < 500
                });

                if (response.status === 200) {
                    console.log(`✅ Page loaded successfully: ${url}`);
                    const players = extractVideoPlayers(response.data, source);
                    
                    if (players.length > 0) {
                        const $ = cheerio.load(response.data);
                        const title = $('h1, .entry-title, .post-title, .episode-title').first().text().trim() || `Episode ${episode}`;
                        const description = $('.entry-content p, .post-content p, .episode-description').first().text().trim() || '';
                        const thumbnail = $('.post-thumbnail img, .episode-thumbnail img, .wp-post-image').attr('src') || '';

                        return {
                            success: true,
                            url: url,
                            title: title,
                            description: description,
                            thumbnail: thumbnail,
                            players: players,
                            source: source,
                            slug_used: currentSlug
                        };
                    } else {
                        console.log(`❌ No players found on: ${url}`);
                    }
                } else {
                    console.log(`❌ HTTP ${response.status} for: ${url}`);
                }
            } catch (error) {
                if (error.response && error.response.status === 404) {
                    console.log(`❌ 404 Not Found: ${url}`);
                } else {
                    console.log(`❌ Failed to load: ${url} - ${error.message}`);
                }
                continue;
            }
        }
    }

    return { success: false, players: [], source: source };
}

// ========== MULTI-SOURCE FETCHER ==========
async function getEpisodeMultiSource(animeSlug, season, episode) {
    console.log(`🔍 Multi-source fetch: ${animeSlug}, S${season}, E${episode}`);
    
    const sources = ['ANIMEWORLD', 'BACKUP'];
    
    for (const source of sources) {
        try {
            console.log(`🔄 Trying source: ${source}`);
            const result = await getEpisodeData(animeSlug, season, episode, source);
            
            if (result.success && result.players.length > 0) {
                console.log(`✅ Success with ${source} - Found ${result.players.length} players`);
                return result;
            } else {
                console.log(`❌ No players found on ${source}`);
            }
        } catch (error) {
            console.log(`❌ ${source} failed:`, error.message);
            continue;
        }
    }
    
    console.log(`❌ All sources failed for ${animeSlug} episode ${episode}`);
    return { success: false, players: [], source: 'ALL' };
}

// ========== API ENDPOINTS ==========

// Main anime endpoint
app.get('/api/anime/:anilistId/:season/:episode', async (req, res) => {
    const { anilistId, season, episode } = req.params;

    console.log(`\n🎌 Fetching: ${anilistId}, S${season}, E${episode}`);

    try {
        const animeSlug = await getAnimeSlug(anilistId);
        console.log(`📝 Resolved slug: ${animeSlug} for ID: ${anilistId}`);
        
        const episodeData = await getEpisodeMultiSource(animeSlug, parseInt(season), parseInt(episode));

        if (!episodeData.success) {
            console.log(`❌ Episode not found for ${animeSlug} episode ${episode}`);
            return res.status(404).json({ 
                error: 'Episode not found on any source',
                tried_sources: Object.keys(SOURCES),
                anime_slug: animeSlug,
                anilist_id: anilistId,
                episode: episode,
                season: season,
                suggestion: `Try searching for the anime first: /api/search/${encodeURIComponent(ANIME_DATABASE[anilistId]?.title || 'anime name')}`
            });
        }

        console.log(`✅ Successfully fetched ${episodeData.players.length} players`);
        res.json({
            success: true,
            anilist_id: anilistId,
            anime_slug: animeSlug,
            slug_used: episodeData.slug_used,
            season: parseInt(season),
            episode: parseInt(episode),
            title: episodeData.title,
            description: episodeData.description,
            thumbnail: episodeData.thumbnail,
            source_url: episodeData.url,
            source: episodeData.source,
            total_players: episodeData.players.length,
            players: episodeData.players,
            available_servers: episodeData.players.map(p => p.server),
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error(`💥 Error:`, error.message);
        res.status(500).json({ 
            error: 'Server error', 
            message: error.message,
            anilist_id: anilistId,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Enhanced search endpoint with better results
app.get('/api/search/:query', async (req, res) => {
    const { query } = req.params;
    
    try {
        console.log(`🔍 Searching for: ${query}`);
        
        const [animeworldResults, backupResults] = await Promise.all([
            searchAnime(query, 'ANIMEWORLD').catch(err => {
                console.error('AnimeWorld search failed:', err.message);
                return [];
            }),
            searchAnime(query, 'BACKUP').catch(err => {
                console.error('Backup search failed:', err.message);
                return [];
            })
        ]);

        // Combine and deduplicate results
        const allResults = [...animeworldResults, ...backupResults];
        const uniqueResults = [];
        const seenSlugs = new Set();
        
        for (const result of allResults) {
            if (!seenSlugs.has(result.slug)) {
                seenSlugs.add(result.slug);
                uniqueResults.push(result);
            }
        }
        
        console.log(`✅ Found ${uniqueResults.length} unique results for "${query}"`);
        
        res.json({
            success: true,
            query: query,
            results_count: uniqueResults.length,
            results: uniqueResults.slice(0, 20), // Limit to top 20 results
            sources_tried: ['ANIMEWORLD', 'BACKUP'],
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ 
            error: 'Search failed', 
            message: error.message,
            query: query
        });
    }
});

// Test endpoint for any anime with detailed debugging
app.get('/api/debug/:anilistId/:episode', async (req, res) => {
    const { anilistId, episode } = req.params;
    
    console.log(`\n🔧 DEBUG: Testing anime ${anilistId} episode ${episode}`);
    
    try {
        const animeSlug = await getAnimeSlug(anilistId);
        const dbEntry = ANIME_DATABASE[anilistId];
        
        const testSlugs = [animeSlug];
        if (dbEntry && dbEntry.alternativeSlugs) {
            testSlugs.push(...dbEntry.alternativeSlugs);
        }
        
        const results = [];
        
        for (const slug of testSlugs) {
            try {
                console.log(`🧪 Testing slug: ${slug}`);
                const episodeData = await getEpisodeData(slug, 1, parseInt(episode), 'ANIMEWORLD');
                
                results.push({
                    slug: slug,
                    success: episodeData.success,
                    players_found: episodeData.players ? episodeData.players.length : 0,
                    url_used: episodeData.url || 'No successful URL',
                    source: episodeData.source,
                    title: episodeData.title || 'No title found'
                });
                
                if (episodeData.success) {
                    break; // Stop on first success
                }
            } catch (error) {
                results.push({
                    slug: slug,
                    error: error.message,
                    success: false
                });
            }
        }
        
        res.json({
            anilist_id: anilistId,
            episode: episode,
            resolved_slug: animeSlug,
            database_entry: dbEntry || null,
            test_results: results,
            total_slugs_tested: testSlugs.length
        });
    } catch (error) {
        res.status(500).json({
            anilist_id: anilistId,
            episode: episode,
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Slug resolver endpoint
app.get('/api/resolve/:anilistId', async (req, res) => {
    const { anilistId } = req.params;
    
    try {
        console.log(`🔍 Resolving slug for AniList ID: ${anilistId}`);
        
        const animeSlug = await getAnimeSlug(anilistId);
        const dbEntry = ANIME_DATABASE[anilistId];
        
        res.json({
            success: true,
            anilist_id: anilistId,
            resolved_slug: animeSlug,
            in_database: !!dbEntry,
            database_entry: dbEntry || null,
            alternative_slugs: dbEntry ? dbEntry.alternativeSlugs : [],
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            anilist_id: anilistId,
            error: error.message
        });
    }
});

// Enhanced embed endpoint
app.get('/anime/:anilistId/:episode/:language?', async (req, res) => {
    const { anilistId, episode, language = 'sub' } = req.params;
    const season = 1;

    try {
        const animeSlug = await getAnimeSlug(anilistId);
        const episodeData = await getEpisodeMultiSource(animeSlug, season, parseInt(episode));

        if (!episodeData.success || episodeData.players.length === 0) {
            const dbEntry = ANIME_DATABASE[anilistId];
            const animeTitle = dbEntry ? dbEntry.title : `Anime ${anilistId}`;
            
            return res.send(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Episode Not Found - ${animeTitle}</title>
                    <style>
                        body { 
                            margin: 0; 
                            padding: 20px; 
                            background: linear-gradient(135deg, #1a1a1a, #2d2d2d); 
                            color: white; 
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            display: flex; 
                            align-items: center; 
                            justify-content: center; 
                            min-height: 100vh;
                        }
                        .container {
                            text-align: center;
                            background: rgba(255,255,255,0.1);
                            padding: 40px;
                            border-radius: 15px;
                            backdrop-filter: blur(10px);
                            border: 1px solid rgba(255,255,255,0.2);
                        }
                        h1 { color: #ff6b6b; margin-bottom: 20px; }
                        .info { background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; margin: 10px 0; }
                        .code { font-family: monospace; background: #333; padding: 5px 10px; border-radius: 4px; }
                        a { color: #4ecdc4; text-decoration: none; }
                        a:hover { text-decoration: underline; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>📺 Episode Not Found</h1>
                        <div class="info">
                            <strong>Anime:</strong> ${animeTitle}<br>
                            <strong>AniList ID:</strong> ${anilistId}<br>
                            <strong>Episode:</strong> ${episode}<br>
                            <strong>Language:</strong> ${language}
                        </div>
                        <div class="info">
                            <strong>Resolved Slug:</strong> <span class="code">${animeSlug}</span><br>
                            <strong>Sources Tried:</strong> ${Object.keys(SOURCES).join(', ')}
                        </div>
                        <p>Try searching for the anime first:</p>
                        <p><a href="/api/search/${encodeURIComponent(animeTitle)}" target="_blank">🔍 Search API</a></p>
                        <p><a href="/api/debug/${anilistId}/${episode}" target="_blank">🔧 Debug Info</a></p>
                    </div>
                </body>
                </html>
            `);
        }

        const playerUrl = episodeData.players[0].url;

        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${episodeData.title}</title>
                <style>
                    body { 
                        margin: 0; 
                        padding: 0; 
                        background: #000; 
                        overflow: hidden; 
                        font-family: Arial, sans-serif;
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
                    .loading {
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        color: white;
                        font-size: 18px;
                    }
                    .info {
                        position: absolute;
                        top: 10px;
                        left: 10px;
                        background: rgba(0,0,0,0.8);
                        color: white;
                        padding: 10px;
                        border-radius: 5px;
                        font-size: 12px;
                        max-width: 300px;
                        opacity: 0;
                        transition: opacity 0.3s;
                    }
                    .info:hover {
                        opacity: 1;
                    }
                </style>
            </head>
            <body>
                <div class="player-container">
                    <div class="loading">Loading episode...</div>
                    <div class="info">
                        ${episodeData.title}<br>
                        Source: ${episodeData.source}<br>
                        Players: ${episodeData.players.length}
                    </div>
                    <iframe 
                        src="${playerUrl}" 
                        frameborder="0" 
                        scrolling="no" 
                        allowfullscreen
                        allow="autoplay; fullscreen; picture-in-picture"
                        onload="document.querySelector('.loading').style.display='none'">
                    </iframe>
                </div>
            </body>
            </html>
        `);

    } catch (error) {
        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Error Loading Anime</title>
                <style>
                    body { 
                        margin: 0; 
                        padding: 20px; 
                        background: linear-gradient(135deg, #ff6b6b, #ee5a52); 
                        color: white; 
                        font-family: Arial, sans-serif;
                        display: flex; 
                        align-items: center; 
                        justify-content: center; 
                        min-height: 100vh;
                    }
                    .container {
                        text-align: center;
                        background: rgba(0,0,0,0.3);
                        padding: 40px;
                        border-radius: 15px;
                        backdrop-filter: blur(10px);
                    }
                    .code { font-family: monospace; background: rgba(0,0,0,0.5); padding: 5px 10px; border-radius: 4px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>💥 Error Loading Anime</h1>
                    <p><strong>Anime ID:</strong> ${anilistId}</p>
                    <p><strong>Episode:</strong> ${episode}</p>
                    <p><strong>Error:</strong> <span class="code">${error.message}</span></p>
                </div>
            </body>
            </html>
        `);
    }
});

// Database endpoint with more info
app.get('/api/database', (req, res) => {
    const stats = {
        total_anime: Object.keys(ANIME_DATABASE).length,
        anime_with_alternatives: Object.values(ANIME_DATABASE).filter(entry => 
            entry.alternativeSlugs && entry.alternativeSlugs.length > 0
        ).length,
        total_alternative_slugs: Object.values(ANIME_DATABASE).reduce((sum, entry) => 
            sum + (entry.alternativeSlugs ? entry.alternativeSlugs.length : 0), 0
        )
    };
    
    res.json({
        success: true,
        stats: stats,
        anime_list: ANIME_DATABASE,
        sources: SOURCES,
        timestamp: new Date().toISOString()
    });
});

// API documentation endpoint
app.get('/docs', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>AnimeWorld API Documentation</title>
            <style>
                body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
                .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 20px rgba(0,0,0,0.1); }
                h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
                h2 { color: #34495e; margin-top: 30px; }
                .endpoint { background: #ecf0f1; padding: 15px; border-radius: 5px; margin: 10px 0; border-left: 4px solid #3498db; }
                .method { display: inline-block; padding: 4px 8px; border-radius: 3px; font-weight: bold; color: white; }
                .get { background: #27ae60; }
                .post { background: #e74c3c; }
                code { background: #34495e; color: white; padding: 2px 6px; border-radius: 3px; }
                pre { background: #2c3e50; color: white; padding: 15px; border-radius: 5px; overflow-x: auto; }
                .example { background: #d5dbdb; padding: 10px; border-radius: 3px; margin: 5px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>📺 AnimeWorld API Documentation</h1>
                <p>A comprehensive API for fetching anime episodes from multiple sources with improved slug resolution.</p>
                
                <h2>🚀 Main Endpoints</h2>
                
                <div class="endpoint">
                    <span class="method get">GET</span> <code>/api/anime/:anilistId/:season/:episode</code>
                    <p>Fetch anime episode with video players</p>
                    <div class="example">
                        <strong>Example:</strong> <code>/api/anime/21/1/1</code> (One Piece Episode 1)
                    </div>
                </div>
                
                <div class="endpoint">
                    <span class="method get">GET</span> <code>/api/search/:query</code>
                    <p>Search for anime across all sources</p>
                    <div class="example">
                        <strong>Example:</strong> <code>/api/search/naruto</code>
                    </div>
                </div>
                
                <div class="endpoint">
                    <span class="method get">GET</span> <code>/api/resolve/:anilistId</code>
                    <p>Resolve AniList ID to anime slug</p>
                    <div class="example">
                        <strong>Example:</strong> <code>/api/resolve/104</code> (Get Bleach slug)
                    </div>
                </div>
                
                <h2>🔧 Debug & Utility</h2>
                
                <div class="endpoint">
                    <span class="method get">GET</span> <code>/api/debug/:anilistId/:episode</code>
                    <p>Debug episode fetching with detailed information</p>
                </div>
                
                <div class="endpoint">
                    <span class="method get">GET</span> <code>/api/database</code>
                    <p>View complete anime database with statistics</p>
                </div>
                
                <div class="endpoint">
                    <span class="method get">GET</span> <code>/health</code>
                    <p>API health check and status</p>
                </div>
                
                <h2>🎬 Embed Player</h2>
                
                <div class="endpoint">
                    <span class="method get">GET</span> <code>/anime/:anilistId/:episode/:language?</code>
                    <p>Direct embed player for anime episodes</p>
                    <div class="example">
                        <strong>Example:</strong> <code>/anime/21/1/sub</code> (One Piece Episode 1 with subtitles)
                    </div>
                </div>
                
                <h2>📊 Features</h2>
                <ul>
                    <li>✅ Improved slug resolution with AniList API integration</li>
                    <li>✅ Multiple alternative slug attempts per anime</li>
                    <li>✅ Enhanced video player extraction</li>
                    <li>✅ Multi-source support with fallback</li>
                    <li>✅ Comprehensive search functionality</li>
                    <li>✅ Detailed debugging and error reporting</li>
                    <li>✅ Database of ${Object.keys(ANIME_DATABASE).length}+ anime with verified slugs</li>
                </ul>
                
                <h2>🎯 Popular Anime Examples</h2>
                <ul>
                    <li><a href="/api/anime/21/1/1" target="_blank">One Piece</a> - ID: 21</li>
                    <li><a href="/api/anime/20/1/1" target="_blank">Naruto</a> - ID: 20</li>
                    <li><a href="/api/anime/104/1/1" target="_blank">Bleach</a> - ID: 104</li>
                    <li><a href="/api/anime/16498/1/1" target="_blank">Attack on Titan</a> - ID: 16498</li>
                    <li><a href="/api/anime/38000/1/1" target="_blank">Demon Slayer</a> - ID: 38000</li>
                </ul>
                
                <h2>📝 Response Format</h2>
                <pre>{
  "success": true,
  "anilist_id": "21",
  "anime_slug": "one-piece",
  "slug_used": "one-piece",
  "season": 1,
  "episode": 1,
  "title": "One Piece Episode 1",
  "players": [
    {
      "type": "embed",
      "server": "AnimeWorld Server 1",
      "url": "https://...",
      "quality": "HD",
      "format": "iframe",
      "source": "ANIMEWORLD"
    }
  ],
  "total_players": 3,
  "source": "ANIMEWORLD"
}</pre>
            </div>
        </body>
        </html>
    `);
});

// Health check with detailed info
app.get('/health', (req, res) => {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    
    res.json({ 
        status: 'OK',
        message: 'AnimeWorld API is running',
        version: '2.0.0',
        uptime: `${hours}h ${minutes}m ${seconds}s`,
        features: {
            improved_slug_resolution: true,
            anilist_integration: true,
            multi_source_support: true,
            alternative_slugs: true,
            enhanced_player_extraction: true
        },
        database: {
            total_anime: Object.keys(ANIME_DATABASE).length,
            anime_with_alternatives: Object.values(ANIME_DATABASE).filter(entry => 
                entry.alternativeSlugs && entry.alternativeSlugs.length > 0
            ).length
        },
        sources: Object.keys(SOURCES),
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        path: req.path,
        available_endpoints: [
            '/api/anime/:anilistId/:season/:episode',
            '/api/search/:query',
            '/api/resolve/:anilistId',
            '/api/debug/:anilistId/:episode',
            '/api/database',
            '/anime/:anilistId/:episode/:language',
            '/docs',
            '/health'
        ]
    });
});

// Error handler
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Enhanced AnimeWorld API v2.0 running on port ${PORT}`);
    console.log(`📊 Database loaded: ${Object.keys(ANIME_DATABASE).length} anime with improved slug resolution`);
    console.log(`🌐 Sources: ${Object.keys(SOURCES).join(', ')}`);
    console.log(`📖 Documentation: http://localhost:${PORT}/docs`);
    console.log(`🗃️ Database: http://localhost:${PORT}/api/database`);
    console.log(`🎌 Test URLs:`);
    console.log(`   - One Piece: http://localhost:${PORT}/api/anime/21/1/1`);
    console.log(`   - Bleach: http://localhost:${PORT}/api/anime/104/1/1`);
    console.log(`   - Naruto: http://localhost:${PORT}/api/anime/20/1/1`);
    console.log(`   - Debug Bleach: http://localhost:${PORT}/api/debug/104/1`);
    console.log(`   - Search: http://localhost:${PORT}/api/search/one piece`);
    console.log(`🔧 New Features:`);
    console.log(`   ✅ AniList API integration for unknown anime`);
    console.log(`   ✅ Multiple alternative slugs per anime`);
    console.log(`   ✅ Enhanced URL pattern matching`);
    console.log(`   ✅ Better error handling and debugging`);
    console.log(`   ✅ Improved video player extraction`);
});

module.exports = app;
