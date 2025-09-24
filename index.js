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
    // Popular Anime - Updated for ToonStream compatibility
    '21': { slug: 'one-piece', title: 'One Piece', alternativeSlugs: ['one-piece-tv', 'onepiece'] },
    '20': { slug: 'naruto', title: 'Naruto', alternativeSlugs: ['naruto-tv'] },
    '1735': { slug: 'naruto-shippuden', title: 'Naruto Shippuden', alternativeSlugs: ['naruto-shippuuden'] },
    '16498': { slug: 'attack-on-titan', title: 'Attack on Titan', alternativeSlugs: ['shingeki-no-kyojin', 'aot'] },
    '38000': { slug: 'demon-slayer', title: 'Demon Slayer', alternativeSlugs: ['kimetsu-no-yaiba'] },
    '113415': { slug: 'jujutsu-kaisen', title: 'Jujutsu Kaisen', alternativeSlugs: ['jjk'] },
    '99147': { slug: 'chainsaw-man', title: 'Chainsaw Man', alternativeSlugs: ['chainsawman'] },
    '101759': { slug: 'oshi-no-ko', title: 'Oshi no Ko', alternativeSlugs: ['my-star'] },
    '11061': { slug: 'tokyo-ghoul', title: 'Tokyo Ghoul', alternativeSlugs: [] },
    '23283': { slug: 'sword-art-online', title: 'Sword Art Online', alternativeSlugs: ['sao'] },
    
    // Major anime with ToonStream compatible slugs
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
    
    // More anime
    '178025': { slug: 'kaiju-no-8', title: 'Kaiju No. 8', alternativeSlugs: ['kaiju-8', 'monster-no-8'] },
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

// ========== TOONSTREAM SOURCE CONFIGURATION ==========
const SOURCES = {
    TOONSTREAM: {
        name: 'ToonStream',
        baseUrl: 'https://toonstream.love',
        searchUrl: 'https://toonstream.love/?s=',
        episodeUrl: 'https://toonstream.love'
    }
};

// ========== TOONSTREAM ANIME SLUG RESOLVER ==========
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

            // Try searching with each title on ToonStream
            for (const title of titles) {
                const searchResults = await searchAnime(title);
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
        const searchResults = await searchAnime(anilistId);
        if (searchResults.length > 0) {
            return searchResults[0].slug;
        }
    } catch (error) {
        console.error('Error in fallback search:', error);
    }
    
    // Ultimate fallback
    return `anime-${anilistId}`;
}

// ========== TOONSTREAM SEARCH FUNCTION ==========
async function searchAnime(query) {
    try {
        const config = SOURCES.TOONSTREAM;
        const searchUrl = `${config.searchUrl}${encodeURIComponent(query)}`;
        
        console.log(`🔍 Searching for "${query}" on ToonStream: ${searchUrl}`);
        
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

        // ToonStream specific selectors - analyze their HTML structure
        const searchSelectors = [
            '.post',
            'article',
            '.search-result',
            '.anime-item',
            '.entry',
            '.result-item'
        ];

        for (const selector of searchSelectors) {
            $(selector).each((i, el) => {
                const $el = $(el);
                
                // Multiple ways to get title and URL for ToonStream
                const titleSelectors = [
                    'h2 a',
                    'h3 a',
                    '.entry-title a',
                    '.post-title a',
                    'a.post-link',
                    '.title a'
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
                const description = $el.find('p, .excerpt, .entry-summary').first().text().trim() || '';
                
                if (title && url && !results.some(r => r.url === url)) {
                    let slug = extractToonStreamSlug(url);
                    
                    if (slug && slug.length > 2) {
                        results.push({
                            title: title,
                            slug: slug,
                            url: url,
                            image: image,
                            description: description,
                            source: 'TOONSTREAM'
                        });
                    }
                }
            });
            
            if (results.length > 0) break;
        }

        console.log(`✅ Found ${results.length} results for "${query}" on ToonStream`);
        
        // Sort results by relevance
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
        console.error(`❌ ToonStream search error:`, error.message);
        return [];
    }
}

// ========== TOONSTREAM SLUG EXTRACTION ==========
function extractToonStreamSlug(url) {
    if (!url) return '';
    
    // Remove trailing slash and decode URL
    url = decodeURIComponent(url.replace(/\/$/, ''));
    
    // ToonStream URL patterns
    const patterns = [
        // Episode URLs: /anime-name-episode-1/
        /\/([^\/]+)-episode-\d+(?:\/)?$/,
        // Anime page URLs: /anime-name/
        /\/([^\/]+)(?:\/)?$/,
        // Watch URLs: /watch/anime-name/
        /\/watch\/([^\/]+)(?:\/)?$/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            let slug = match[1];
            
            // Clean up the slug
            slug = slug
                .replace(/-episode-\d+$/, '')
                .replace(/-season-\d+$/, '')
                .replace(/-\d{4}$/, '')
                .replace(/^watch-/, '')
                .toLowerCase()
                .trim();
            
            if (slug.length > 2 && !slug.includes('?') && !slug.includes('&')) {
                console.log(`🎯 Extracted ToonStream slug: "${slug}" from URL: ${url}`);
                return slug;
            }
        }
    }
    
    console.log(`❌ Could not extract slug from ToonStream URL: ${url}`);
    return '';
}

// ========== TOONSTREAM PLAYER EXTRACTION ==========
function extractToonStreamPlayers(html) {
    const $ = cheerio.load(html);
    const players = [];
    const foundUrls = new Set();

    console.log(`🎬 Extracting players from ToonStream...`);

    // Method 1: Direct iframes
    $('iframe').each((i, el) => {
        let src = $(el).attr('src') || $(el).attr('data-src');
        if (src) {
            if (src.startsWith('//')) src = 'https:' + src;
            if (src.startsWith('/')) src = 'https://toonstream.love' + src;
            
            if (isValidVideoUrl(src) && !foundUrls.has(src)) {
                foundUrls.add(src);
                players.push({
                    type: 'embed',
                    server: `ToonStream Server ${players.length + 1}`,
                    url: src,
                    quality: 'HD',
                    format: 'iframe',
                    source: 'TOONSTREAM'
                });
                console.log(`📺 Found ToonStream iframe: ${src}`);
            }
        }
    });

    // Method 2: Video tags
    $('video, source').each((i, el) => {
        const src = $(el).attr('src') || $(el).attr('data-src');
        if (src) {
            let fullSrc = src;
            if (src.startsWith('//')) fullSrc = 'https:' + src;
            if (src.startsWith('/')) fullSrc = 'https://toonstream.love' + src;
            
            if (isValidVideoUrl(fullSrc) && !foundUrls.has(fullSrc)) {
                foundUrls.add(fullSrc);
                players.push({
                    type: 'direct',
                    server: `ToonStream Direct ${players.length + 1}`,
                    url: fullSrc,
                    quality: 'Auto',
                    format: getVideoFormat(fullSrc),
                    source: 'TOONSTREAM'
                });
                console.log(`🎥 Found ToonStream video: ${fullSrc}`);
            }
        }
    });

    // Method 3: Enhanced script analysis for ToonStream
    $('script').each((i, el) => {
        const scriptContent = $(el).html();
        if (scriptContent && scriptContent.length > 50) {
            // ToonStream specific patterns
            const videoPatterns = [
                // Standard player configurations
                /(?:src|file|url|video|stream|link)["'\s]*:["'\s]*["']([^"']+)["']/gi,
                /(?:videoUrl|streamUrl|embedUrl|playerUrl)["'\s]*:["'\s]*["']([^"']+)["']/gi,
                // Direct URL patterns
                /(https?:\/\/[^\s"'<>]+\.(mp4|m3u8|webm|mkv)[^\s"'<>]*)/gi,
                // Embed patterns
                /(https?:\/\/[^\s"'<>]*\/(?:embed|player|video|stream)\/[^\s"'<>]*)/gi,
                // Known video hosting domains
                /(https?:\/\/[^\s"'<>]*(?:streamtape|doodstream|mixdrop|mp4upload|vidstream|gogostream|filemoon|streamwish)[^\s"'<>]*)/gi,
                // ToonStream specific patterns
                /toonstream\.love\/[^\s"'<>]*/gi,
                // Generic streaming patterns
                /(https?:\/\/[^\s"'<>]*(?:embed|player|video|stream)[^\s"'<>]*)/gi
            ];

            for (const pattern of videoPatterns) {
                let match;
                while ((match = pattern.exec(scriptContent)) !== null) {
                    let url = match[1] || match[0];
                    
                    // Clean up the URL
                    url = url.replace(/['"]/g, '').trim();
                    
                    if (url.startsWith('//')) url = 'https:' + url;
                    if (url.startsWith('/') && !url.startsWith('//')) url = 'https://toonstream.love' + url;
                    
                    if (isValidVideoUrl(url) && !foundUrls.has(url)) {
                        foundUrls.add(url);
                        players.push({
                            type: 'script',
                            server: `ToonStream Script ${players.length + 1}`,
                            url: url,
                            quality: 'HD',
                            format: getVideoFormat(url),
                            source: 'TOONSTREAM'
                        });
                        console.log(`🔧 Found ToonStream script URL: ${url}`);
                    }
                }
            }
        }
    });

    // Method 4: Data attributes
    $('[data-src], [data-url], [data-file], [data-video], [data-stream], [data-player]').each((i, el) => {
        const attrs = ['data-src', 'data-url', 'data-file', 'data-video', 'data-stream', 'data-player'];
        for (const attr of attrs) {
            const src = $(el).attr(attr);
            if (src) {
                let fullSrc = src;
                if (src.startsWith('//')) fullSrc = 'https:' + src;
                if (src.startsWith('/')) fullSrc = 'https://toonstream.love' + src;
                
                if (isValidVideoUrl(fullSrc) && !foundUrls.has(fullSrc)) {
                    foundUrls.add(fullSrc);
                    players.push({
                        type: 'data',
                        server: `ToonStream Data ${players.length + 1}`,
                        url: fullSrc,
                        quality: 'Auto',
                        format: getVideoFormat(fullSrc),
                        source: 'TOONSTREAM'
                    });
                    console.log(`📊 Found ToonStream data URL: ${fullSrc}`);
                    break;
                }
            }
        }
    });

    // Method 5: Look for player buttons/links
    $('a[href*="player"], a[href*="embed"], a[href*="stream"], .player-btn, .stream-btn').each((i, el) => {
        const href = $(el).attr('href');
        if (href) {
            let fullHref = href;
            if (href.startsWith('/')) fullHref = 'https://toonstream.love' + href;
            
            if (isValidVideoUrl(fullHref) && !foundUrls.has(fullHref)) {
                foundUrls.add(fullHref);
                players.push({
                    type: 'link',
                    server: `ToonStream Link ${players.length + 1}`,
                    url: fullHref,
                    quality: 'HD',
                    format: 'link',
                    source: 'TOONSTREAM'
                });
                console.log(`🔗 Found ToonStream player link: ${fullHref}`);
            }
        }
    });

    console.log(`🎯 Found ${players.length} unique players from ToonStream`);
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
        /\.css$/,
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
        'sbplay', 'fembed', 'voe', 'streamwish', 'streamhub', 'toonstream.love',
        
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

// ========== TOONSTREAM EPISODE FETCHER ==========
async function getEpisodeData(animeSlug, season, episode) {
    const config = SOURCES.TOONSTREAM;
    
    // Get alternative slugs if available
    const dbEntry = Object.values(ANIME_DATABASE).find(entry => 
        entry.slug === animeSlug || entry.alternativeSlugs.includes(animeSlug)
    );
    
    const slugsToTry = [animeSlug];
    if (dbEntry && dbEntry.alternativeSlugs) {
        slugsToTry.push(...dbEntry.alternativeSlugs);
    }
    
    console.log(`🔍 Trying ToonStream with slugs: ${slugsToTry.join(', ')}, episode: ${episode}`);

    for (const currentSlug of slugsToTry) {
        // ToonStream URL patterns
        const urlAttempts = [
            // Primary patterns for ToonStream
            `${config.baseUrl}/${currentSlug}-episode-${episode}/`,
            `${config.baseUrl}/${currentSlug}-episode-${episode}`,
            `${config.baseUrl}/${currentSlug}-ep-${episode}/`,
            `${config.baseUrl}/${currentSlug}-ep${episode}/`,
            
            // Alternative patterns
            `${config.baseUrl}/watch/${currentSlug}-episode-${episode}/`,
            `${config.baseUrl}/anime/${currentSlug}/episode-${episode}/`,
            `${config.baseUrl}/${currentSlug}/${episode}/`,
            
            // Season-specific patterns
            `${config.baseUrl}/${currentSlug}-season-${season}-episode-${episode}/`,
            `${config.baseUrl}/${currentSlug}-s${season}e${episode}/`,
            `${config.baseUrl}/${currentSlug}-${season}x${episode}/`,
            
            // Fallback patterns
            `${config.baseUrl}/${currentSlug}-${episode}/`,
            `${config.baseUrl}/episode/${currentSlug}-${episode}/`
        ];

        for (const url of urlAttempts) {
            try {
                console.log(`🌐 Attempting ToonStream: ${url}`);
                
                const response = await axios.get(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.9',
                        'Referer': config.baseUrl,
                        'DNT': '1',
                        'Connection': 'keep-alive'
                    },
                    timeout: 15000,
                    validateStatus: status => status < 500
                });

                if (response.status === 200) {
                    console.log(`✅ ToonStream page loaded: ${url}`);
                    const players = extractToonStreamPlayers(response.data);
                    
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
                            source: 'TOONSTREAM',
                            slug_used: currentSlug
                        };
                    } else {
                        console.log(`❌ No players found on ToonStream: ${url}`);
                    }
                } else {
                    console.log(`❌ HTTP ${response.status} for ToonStream: ${url}`);
                }
            } catch (error) {
                if (error.response && error.response.status === 404) {
                    console.log(`❌ 404 Not Found on ToonStream: ${url}`);
                } else {
                    console.log(`❌ Failed to load ToonStream: ${url} - ${error.message}`);
                }
                continue;
            }
        }
    }

    return { success: false, players: [], source: 'TOONSTREAM' };
}

// ========== API ENDPOINTS ==========

// Main anime endpoint
app.get('/api/anime/:anilistId/:season/:episode', async (req, res) => {
    const { anilistId, season, episode } = req.params;

    console.log(`\n🎌 Fetching from ToonStream: ${anilistId}, S${season}, E${episode}`);

    try {
        const animeSlug = await getAnimeSlug(anilistId);
        console.log(`📝 Resolved slug: ${animeSlug} for ID: ${anilistId}`);
        
        const episodeData = await getEpisodeData(animeSlug, parseInt(season), parseInt(episode));

        if (!episodeData.success) {
            console.log(`❌ Episode not found on ToonStream for ${animeSlug} episode ${episode}`);
            return res.status(404).json({ 
                error: 'Episode not found on ToonStream',
                tried_source: 'TOONSTREAM',
                anime_slug: animeSlug,
                anilist_id: anilistId,
                episode: episode,
                season: season,
                suggestion: `Try searching for the anime first: /api/search/${encodeURIComponent(ANIME_DATABASE[anilistId]?.title || 'anime name')}`
            });
        }

        console.log(`✅ Successfully fetched ${episodeData.players.length} players from ToonStream`);
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
            source: 'TOONSTREAM',
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

// Enhanced search endpoint for ToonStream
app.get('/api/search/:query', async (req, res) => {
    const { query } = req.params;
    
    try {
        console.log(`🔍 Searching ToonStream for: ${query}`);
        
        const results = await searchAnime(query);
        
        console.log(`✅ Found ${results.length} results for "${query}" on ToonStream`);
        
        res.json({
            success: true,
            query: query,
            results_count: results.length,
            results: results.slice(0, 20), // Limit to top 20 results
            source: 'TOONSTREAM',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('ToonStream search error:', error);
        res.status(500).json({ 
            error: 'Search failed', 
            message: error.message,
            query: query,
            source: 'TOONSTREAM'
        });
    }
});

// Test endpoint for any anime with ToonStream debugging
app.get('/api/debug/:anilistId/:episode', async (req, res) => {
    const { anilistId, episode } = req.params;
    
    console.log(`\n🔧 DEBUG: Testing ToonStream anime ${anilistId} episode ${episode}`);
    
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
                console.log(`🧪 Testing ToonStream slug: ${slug}`);
                const episodeData = await getEpisodeData(slug, 1, parseInt(episode));
                
                results.push({
                    slug: slug,
                    success: episodeData.success,
                    players_found: episodeData.players ? episodeData.players.length : 0,
                    url_used: episodeData.url || 'No successful URL',
                    source: 'TOONSTREAM',
                    title: episodeData.title || 'No title found'
                });
                
                if (episodeData.success) {
                    break; // Stop on first success
                }
            } catch (error) {
                results.push({
                    slug: slug,
                    error: error.message,
                    success: false,
                    source: 'TOONSTREAM'
                });
            }
        }
        
        res.json({
            anilist_id: anilistId,
            episode: episode,
            resolved_slug: animeSlug,
            database_entry: dbEntry || null,
            test_results: results,
            total_slugs_tested: testSlugs.length,
            source: 'TOONSTREAM'
        });
    } catch (error) {
        res.status(500).json({
            anilist_id: anilistId,
            episode: episode,
            error: error.message,
            source: 'TOONSTREAM',
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
            source: 'TOONSTREAM',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            anilist_id: anilistId,
            error: error.message,
            source: 'TOONSTREAM'
        });
    }
});

// Enhanced embed endpoint for ToonStream
app.get('/anime/:anilistId/:episode/:language?', async (req, res) => {
    const { anilistId, episode, language = 'sub' } = req.params;
    const season = 1;

    try {
        const animeSlug = await getAnimeSlug(anilistId);
        const episodeData = await getEpisodeData(animeSlug, season, parseInt(episode));

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
                            background: linear-gradient(135deg, #667eea, #764ba2); 
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
                            border-radius: 20px;
                            backdrop-filter: blur(15px);
                            border: 1px solid rgba(255,255,255,0.2);
                            box-shadow: 0 15px 35px rgba(0,0,0,0.1);
                        }
                        h1 { color: #ff6b9d; margin-bottom: 20px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }
                        .info { 
                            background: rgba(0,0,0,0.2); 
                            padding: 15px; 
                            border-radius: 10px; 
                            margin: 15px 0; 
                            border-left: 4px solid #ff6b9d;
                        }
                        .code { 
                            font-family: 'Courier New', monospace; 
                            background: #2d3748; 
                            color: #63b3ed;
                            padding: 8px 12px; 
                            border-radius: 6px; 
                            display: inline-block;
                        }
                        a { 
                            color: #63b3ed; 
                            text-decoration: none; 
                            font-weight: 600;
                            transition: color 0.3s;
                        }
                        a:hover { 
                            color: #90cdf4; 
                            text-decoration: underline; 
                        }
                        .badge {
                            background: #667eea;
                            color: white;
                            padding: 4px 8px;
                            border-radius: 12px;
                            font-size: 12px;
                            font-weight: bold;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>📺 Episode Not Found</h1>
                        <div class="info">
                            <strong>Anime:</strong> ${animeTitle}<br>
                            <strong>AniList ID:</strong> ${anilistId}<br>
                            <strong>Episode:</strong> ${episode}<br>
                            <strong>Language:</strong> ${language}<br>
                            <span class="badge">ToonStream</span>
                        </div>
                        <div class="info">
                            <strong>Resolved Slug:</strong> <span class="code">${animeSlug}</span><br>
                            <strong>Source:</strong> ToonStream.love
                        </div>
                        <p>🔍 Try these options:</p>
                        <p><a href="/api/search/${encodeURIComponent(animeTitle)}" target="_blank">Search ToonStream</a></p>
                        <p><a href="/api/debug/${anilistId}/${episode}" target="_blank">Debug Episode</a></p>
                        <p><a href="/api/resolve/${anilistId}" target="_blank">Check Slug Resolution</a></p>
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
                <title>${episodeData.title} - ToonStream</title>
                <style>
                    body { 
                        margin: 0; 
                        padding: 0; 
                        background: #000; 
                        overflow: hidden; 
                        font-family: 'Segoe UI', sans-serif;
                    }
                    .player-container { 
                        width: 100vw; 
                        height: 100vh; 
                        position: relative;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    iframe { 
                        width: 100%; 
                        height: 100%; 
                        border: none;
                        border-radius: 0;
                    }
                    .loading {
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        color: white;
                        font-size: 20px;
                        font-weight: 600;
                        z-index: 100;
                        display: flex;
                        align-items: center;
                        gap: 15px;
                    }
                    .spinner {
                        width: 24px;
                        height: 24px;
                        border: 3px solid rgba(255,255,255,0.3);
                        border-radius: 50%;
                        border-top-color: #667eea;
                        animation: spin 1s ease-in-out infinite;
                    }
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                    .info {
                        position: absolute;
                        top: 15px;
                        left: 15px;
                        background: rgba(0,0,0,0.8);
                        color: white;
                        padding: 12px 15px;
                        border-radius: 8px;
                        font-size: 13px;
                        max-width: 320px;
                        opacity: 0;
                        transition: opacity 0.3s ease;
                        backdrop-filter: blur(10px);
                        border: 1px solid rgba(255,255,255,0.1);
                    }
                    .info:hover {
                        opacity: 1;
                    }
                    .player-controls {
                        position: absolute;
                        bottom: 20px;
                        right: 20px;
                        display: flex;
                        gap: 10px;
                        opacity: 0;
                        transition: opacity 0.3s ease;
                    }
                    .player-controls:hover {
                        opacity: 1;
                    }
                    .control-btn {
                        background: rgba(0,0,0,0.7);
                        color: white;
                        border: none;
                        padding: 8px 12px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 12px;
                        transition: background 0.3s;
                    }
                    .control-btn:hover {
                        background: rgba(102, 126, 234, 0.8);
                    }
                </style>
            </head>
            <body>
                <div class="player-container">
                    <div class="loading">
                        <div class="spinner"></div>
                        Loading from ToonStream...
                    </div>
                    <div class="info">
                        📺 <strong>${episodeData.title}</strong><br>
                        🌐 Source: ToonStream.love<br>
                        🎬 Players: ${episodeData.players.length}<br>
                        ⭐ Quality: HD
                    </div>
                    <div class="player-controls">
                        <button class="control-btn" onclick="document.querySelector('iframe').requestFullscreen()">
                            ⛶ Fullscreen
                        </button>
                    </div>
                    <iframe 
                        src="${playerUrl}" 
                        frameborder="0" 
                        scrolling="no" 
                        allowfullscreen
                        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                        onload="document.querySelector('.loading').style.display='none'"
                        onerror="document.querySelector('.loading').innerHTML='❌ Failed to load player'">
                    </iframe>
                </div>
                <script>
                    // Auto-hide loading after 10 seconds
                    setTimeout(() => {
                        const loading = document.querySelector('.loading');
                        if (loading && loading.style.display !== 'none') {
                            loading.innerHTML = '⚠️ Player taking longer than expected...';
                        }
                    }, 10000);
                </script>
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
                        font-family: 'Segoe UI', sans-serif;
                        display: flex; 
                        align-items: center; 
                        justify-content: center; 
                        min-height: 100vh;
                    }
                    .container {
                        text-align: center;
                        background: rgba(0,0,0,0.3);
                        padding: 50px;
                        border-radius: 20px;
                        backdrop-filter: blur(15px);
                        border: 1px solid rgba(255,255,255,0.2);
                    }
                    .code { 
                        font-family: 'Courier New', monospace; 
                        background: rgba(0,0,0,0.5); 
                        padding: 8px 12px; 
                        border-radius: 6px; 
                        color: #ffeb3b;
                        display: inline-block;
                        margin: 5px;
                    }
                    h1 { text-shadow: 2px 2px 4px rgba(0,0,0,0.5); }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>💥 Error Loading Anime</h1>
                    <p><strong>Anime ID:</strong> <span class="code">${anilistId}</span></p>
                    <p><strong>Episode:</strong> <span class="code">${episode}</span></p>
                    <p><strong>Source:</strong> <span class="code">ToonStream.love</span></p>
                    <p><strong>Error:</strong> <span class="code">${error.message}</span></p>
                    <br>
                    <p>🔄 Try refreshing the page or contact support</p>
                </div>
            </body>
            </html>
        `);
    }
});

// Database endpoint with ToonStream info
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
        source: 'TOONSTREAM',
        stats: stats,
        anime_list: ANIME_DATABASE,
        source_config: SOURCES.TOONSTREAM,
        timestamp: new Date().toISOString()
    });
});

// API documentation endpoint for ToonStream
app.get('/docs', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>ToonStream API Documentation</title>
            <style>
                body { 
                    font-family: 'Segoe UI', sans-serif; 
                    margin: 0; 
                    padding: 20px; 
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    min-height: 100vh;
                }
                .container { 
                    max-width: 1200px; 
                    margin: 0 auto; 
                    background: white; 
                    padding: 40px; 
                    border-radius: 20px; 
                    box-shadow: 0 20px 60px rgba(0,0,0,0.1);
                }
                h1 { 
                    color: #2d3748; 
                    border-bottom: 4px solid #667eea; 
                    padding-bottom: 15px;
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                h2 { color: #4a5568; margin-top: 40px; }
                .endpoint { 
                    background: #f7fafc; 
                    padding: 20px; 
                    border-radius: 10px; 
                    margin: 15px 0; 
                    border-left: 6px solid #667eea;
                    transition: transform 0.2s;
                }
                .endpoint:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.2);
                }
                .method { 
                    display: inline-block; 
                    padding: 6px 12px; 
                    border-radius: 6px; 
                    font-weight: bold; 
                    color: white; 
                    margin-right: 10px;
                }
                .get { background: linear-gradient(135deg, #38a169, #48bb78); }
                .post { background: linear-gradient(135deg, #e53e3e, #f56565); }
                code { 
                    background: #2d3748; 
                    color: #63b3ed; 
                    padding: 4px 8px; 
                    border-radius: 6px; 
                    font-family: 'Courier New', monospace;
                }
                pre { 
                    background: #2d3748; 
                    color: #e2e8f0; 
                    padding: 20px; 
                    border-radius: 10px; 
                    overflow-x: auto;
                    border-left: 4px solid #667eea;
                }
                .example { 
                    background: #edf2f7; 
                    padding: 15px; 
                    border-radius: 8px; 
                    margin: 10px 0;
                    border: 1px solid #e2e8f0;
                }
                .badge {
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    color: white;
                    padding: 4px 12px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: bold;
                    display: inline-block;
                    margin-left: 10px;
                }
                .feature-list {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 20px;
                    margin: 20px 0;
                }
                .feature-card {
                    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
                    padding: 20px;
                    border-radius: 12px;
                    border: 1px solid rgba(102, 126, 234, 0.2);
                }
                a {
                    color: #667eea;
                    text-decoration: none;
                    font-weight: 600;
                }
                a:hover {
                    color: #764ba2;
                    text-decoration: underline;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>📺 ToonStream API Documentation</h1>
                <p>A comprehensive API for fetching anime episodes from ToonStream.love with enhanced player extraction and slug resolution. <span class="badge">v2.0 - ToonStream Edition</span></p>
                
                <h2>🚀 Main Endpoints</h2>
                
                <div class="endpoint">
                    <span class="method get">GET</span> <code>/api/anime/:anilistId/:season/:episode</code>
                    <p>Fetch anime episode with video players from ToonStream</p>
                    <div class="example">
                        <strong>Example:</strong> <code>/api/anime/178025/1/1</code> (Kaiju No. 8 Episode 1)<br>
                        <strong>Response:</strong> JSON with player URLs, episode info, and metadata
                    </div>
                </div>
                
                <div class="endpoint">
                    <span class="method get">GET</span> <code>/api/search/:query</code>
                    <p>Search for anime on ToonStream</p>
                    <div class="example">
                        <strong>Example:</strong> <code>/api/search/kaiju no 8</code><br>
                        <strong>Returns:</strong> List of matching anime with slugs and metadata
                    </div>
                </div>
                
                <div class="endpoint">
                    <span class="method get">GET</span> <code>/api/resolve/:anilistId</code>
                    <p>Resolve AniList ID to ToonStream-compatible slug</p>
                    <div class="example">
                        <strong>Example:</strong> <code>/api/resolve/178025</code><br>
                        <strong>Returns:</strong> Slug resolution info and alternatives
                    </div>
                </div>
                
                <h2>🔧 Debug & Utility</h2>
                
                <div class="endpoint">
                    <span class="method get">GET</span> <code>/api/debug/:anilistId/:episode</code>
                    <p>Debug episode fetching with detailed ToonStream analysis</p>
                    <div class="example">
                        <strong>Example:</strong> <code>/api/debug/178025/1</code><br>
                        <strong>Returns:</strong> Detailed testing results for all slug variations
                    </div>
                </div>
                
                <div class="endpoint">
                    <span class="method get">GET</span> <code>/api/database</code>
                    <p>View complete anime database optimized for ToonStream</p>
                </div>
                
                <div class="endpoint">
                    <span class="method get">GET</span> <code>/health</code>
                    <p>API health check and ToonStream connectivity status</p>
                </div>
                
                <h2>🎬 Embed Player</h2>
                
                <div class="endpoint">
                    <span class="method get">GET</span> <code>/anime/:anilistId/:episode/:language?</code>
                    <p>Direct embed player for anime episodes from ToonStream</p>
                    <div class="example">
                        <strong>Example:</strong> <code>/anime/178025/1/sub</code><br>
                        <strong>Returns:</strong> Full-screen HTML player with ToonStream video
                    </div>
                </div>
                
                <h2>✨ ToonStream Features</h2>
                <div class="feature-list">
                    <div class="feature-card">
                        <h3>🎯 Enhanced Player Extraction</h3>
                        <p>Advanced iframe, script, and data attribute analysis specifically optimized for ToonStream's player structure</p>
                    </div>
                    <div class="feature-card">
                        <h3>🔍 Smart Slug Resolution</h3>
                        <p>AniList API integration with multiple slug alternatives for maximum compatibility</p>
                    </div>
                    <div class="feature-card">
                        <h3>🌐 ToonStream Optimized</h3>
                        <p>URL patterns and extraction methods specifically designed for ToonStream.love infrastructure</p>
                    </div>
                    <div class="feature-card">
                        <h3>📊 Comprehensive Database</h3>
                        <p>${Object.keys(ANIME_DATABASE).length}+ anime with verified ToonStream-compatible slugs and alternatives</p>
                    </div>
                </div>
                
                <h2>🎯 Popular Anime Examples</h2>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0;">
                    <a href="/api/anime/178025/1/1" target="_blank" style="display: block; background: #f7fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">📺 Kaiju No. 8</a>
                    <a href="/api/anime/21/1/1" target="_blank" style="display: block; background: #f7fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">🏴‍☠️ One Piece</a>
                    <a href="/api/anime/20/1/1" target="_blank" style="display: block; background: #f7fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">🍥 Naruto</a>
                    <a href="/api/anime/38000/1/1" target="_blank" style="display: block; background: #f7fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">⚔️ Demon Slayer</a>
                </div>
                
                <h2>📝 Response Format</h2>
                <pre>{
  "success": true,
  "anilist_id": "178025",
  "anime_slug": "kaiju-no-8",
  "slug_used": "kaiju-no-8",
  "season": 1,
  "episode": 1,
  "title": "Kaiju No. 8 Episode 1",
  "source": "TOONSTREAM",
  "players": [
    {
      "type": "embed",
      "server": "ToonStream Server 1",
      "url": "https://...",
      "quality": "HD",
      "format": "iframe",
      "source": "TOONSTREAM"
    }
  ],
  "total_players": 3,
  "source_url": "https://toonstream.love/kaiju-no-8-episode-1/"
}</pre>

                <div style="margin-top: 40px; padding: 20px; background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1)); border-radius: 12px; text-align: center;">
                    <h3>🚀 Powered by ToonStream.love</h3>
                    <p>This API provides seamless access to ToonStream's extensive anime library with enhanced player extraction and smart slug resolution.</p>
                </div>
            </div>
        </body>
        </html>
    `);
});

// Health check with ToonStream status
app.get('/health', (req, res) => {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    
    res.json({ 
        status: 'OK',
        message: 'ToonStream API is running',
        version: '2.0.0 - ToonStream Edition',
        uptime: `${hours}h ${minutes}m ${seconds}s`,
        source: 'TOONSTREAM',
        target_website: 'https://toonstream.love',
        features: {
            toonstream_optimized: true,
            anilist_integration: true,
            enhanced_player_extraction: true,
            alternative_slug_support: true,
            comprehensive_search: true
        },
        database: {
            total_anime: Object.keys(ANIME_DATABASE).length,
            anime_with_alternatives: Object.values(ANIME_DATABASE).filter(entry => 
                entry.alternativeSlugs && entry.alternativeSlugs.length > 0
            ).length,
            featured_anime: ['kaiju-no-8', 'one-piece', 'naruto', 'demon-slayer']
        },
        endpoints: {
            main: '/api/anime/:anilistId/:season/:episode',
            search: '/api/search/:query',
            debug: '/api/debug/:anilistId/:episode',
            embed: '/anime/:anilistId/:episode/:language',
            docs: '/docs'
        },
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        path: req.path,
        source: 'TOONSTREAM',
        available_endpoints: [
            '/api/anime/:anilistId/:season/:episode',
            '/api/search/:query',
            '/api/resolve/:anilistId',
            '/api/debug/:anilistId/:episode',
            '/api/database',
            '/anime/:anilistId/:episode/:language',
            '/docs',
            '/health'
        ],
        examples: [
            '/api/anime/178025/1/1 (Kaiju No. 8)',
            '/api/search/demon slayer',
            '/api/debug/21/1 (One Piece debug)'
        ]
    });
});

// Error handler
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: error.message,
        source: 'TOONSTREAM',
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n🚀 ToonStream API v2.0 running on port ${PORT}`);
    console.log(`🎯 Target: ToonStream.love`);
    console.log(`📊 Database: ${Object.keys(ANIME_DATABASE).length} anime with ToonStream optimization`);
    console.log(`🌐 Source: ToonStream (replacing AnimeWorld)`);
    console.log(`📖 Documentation: http://localhost:${PORT}/docs`);
    console.log(`🗃️ Database: http://localhost:${PORT}/api/database`);
    console.log(`\n🎌 Test URLs (ToonStream):`);
    console.log(`   - Kaiju No. 8: http://localhost:${PORT}/api/anime/178025/1/1`);
    console.log(`   - One Piece: http://localhost:${PORT}/api/anime/21/1/1`);
    console.log(`   - Naruto: http://localhost:${PORT}/api/anime/20/1/1`);
    console.log(`   - Demon Slayer: http://localhost:${PORT}/api/anime/38000/1/1`);
    console.log(`\n🔧 Debug & Utility:`);
    console.log(`   - Debug Kaiju No. 8: http://localhost:${PORT}/api/debug/178025/1`);
    console.log(`   - Search: http://localhost:${PORT}/api/search/kaiju no 8`);
    console.log(`   - Resolve: http://localhost:${PORT}/api/resolve/178025`);
    console.log(`\n✨ ToonStream Features:`);
    console.log(`   ✅ Enhanced player extraction for ToonStream`);
    console.log(`   ✅ AniList API integration for unknown anime`);
    console.log(`   ✅ Multiple alternative slugs per anime`);
    console.log(`   ✅ ToonStream-specific URL patterns`);
    console.log(`   ✅ Improved error handling and debugging`);
    console.log(`   ✅ Optimized video player detection`);
    console.log(`\n🎬 Embed Players:`);
    console.log(`   - http://localhost:${PORT}/anime/178025/1/sub`);
    console.log(`   - http://localhost:${PORT}/anime/21/1000/sub`);
    console.log(`\n🌟 Ready to fetch anime from ToonStream.love!`);
});

module.exports = app;
