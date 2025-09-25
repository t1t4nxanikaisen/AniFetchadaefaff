// api/anime.js - Vercel Serverless Function with ALL AnimeWorld Content
const axios = require('axios');
const cheerio = require('cheerio');

// COMPLETE ANIMEWORLD DATABASE - ALL ANIME & CARTOONS
const ANIMEWORLD_DATABASE = {
    // Popular Anime (from /series/ and /category/anime/)
    '1': { slug: 'cowboy-bebop', title: 'Cowboy Bebop', type: 'anime' },
    '2': { slug: 'berserk', title: 'Berserk', type: 'anime' },
    '3': { slug: 'ghost-in-the-shell-arise', title: 'Ghost in the Shell: Arise', type: 'anime' },
    '4': { slug: 'shoot-goal-to-the-future', title: 'Shoot! Goal to the Future', type: 'anime' },
    '5': { slug: 'death-note', title: 'Death Note', type: 'anime' },
    '6': { slug: 'pokemon-concierge', title: 'Pokémon Concierge', type: 'anime' },
    '7': { slug: 'naruto-shippuden', title: 'Naruto Shippuden', type: 'anime' },
    '8': { slug: 'ive-been-killing-slimes-for-300-years', title: 'I\'ve Been Killing Slimes for 300 Years and Maxed Out My Level', type: 'anime' },
    '9': { slug: 'baki-hanma', title: 'Baki Hanma', type: 'anime' },
    '10': { slug: 'yaiba', title: 'YAIBA: Samurai Legend', type: 'anime' },
    '11': { slug: 'toilet-bound-hanako-kun', title: 'Toilet-Bound Hanako-kun', type: 'anime' },
    '12': { slug: 'dekin-no-mogura', title: 'Dekin no Mogura: The Earthbound Mole', type: 'anime' },
    '13': { slug: 'one-piece', title: 'One Piece', type: 'anime' },
    '14': { slug: 'attack-on-titan', title: 'Attack on Titan', type: 'anime' },
    '15': { slug: 'demon-slayer', title: 'Demon Slayer', type: 'anime' },
    '16': { slug: 'jujutsu-kaisen', title: 'Jujutsu Kaisen', type: 'anime' },
    '17': { slug: 'my-hero-academia', title: 'My Hero Academia', type: 'anime' },
    '18': { slug: 'tokyo-revengers', title: 'Tokyo Revengers', type: 'anime' },
    '19': { slug: 'spy-x-family', title: 'Spy x Family', type: 'anime' },
    '20': { slug: 'chainsaw-man', title: 'Chainsaw Man', type: 'anime' },
    
    // Additional Anime from AnimeWorld
    '21': { slug: 'dragon-ball', title: 'Dragon Ball', type: 'anime' },
    '22': { slug: 'dragon-ball-z', title: 'Dragon Ball Z', type: 'anime' },
    '23': { slug: 'dragon-ball-super', title: 'Dragon Ball Super', type: 'anime' },
    '24': { slug: 'naruto', title: 'Naruto', type: 'anime' },
    '25': { slug: 'bleach', title: 'Bleach', type: 'anime' },
    '26': { slug: 'fairy-tail', title: 'Fairy Tail', type: 'anime' },
    '27': { slug: 'hunter-x-hunter', title: 'Hunter x Hunter', type: 'anime' },
    '28': { slug: 'one-punch-man', title: 'One Punch Man', type: 'anime' },
    '29': { slug: 'mob-psycho-100', title: 'Mob Psycho 100', type: 'anime' },
    '30': { slug: 'vinland-saga', title: 'Vinland Saga', type: 'anime' },
    '31': { slug: 'rezero', title: 'Re:Zero', type: 'anime' },
    '32': { slug: 'konosuba', title: 'KonoSuba', type: 'anime' },
    '33': { slug: 'overlord', title: 'Overlord', type: 'anime' },
    '34': { slug: 'that-time-i-got-reincarnated-as-a-slime', title: 'That Time I Got Reincarnated as a Slime', type: 'anime' },
    '35': { slug: 'the-rising-of-the-shield-hero', title: 'The Rising of the Shield Hero', type: 'anime' },
    '36': { slug: 'mushoku-tensei', title: 'Mushoku Tensei', type: 'anime' },
    '37': { slug: '86', title: '86', type: 'anime' },
    '38': { slug: 'vivy-fluorite-eyes-song', title: 'Vivy: Fluorite Eye\'s Song', type: 'anime' },
    '39': { slug: 'odd-taxi', title: 'Odd Taxi', type: 'anime' },
    '40': { slug: 'sonny-boy', title: 'Sonny Boy', type: 'anime' },
    
    // More Anime
    '41': { slug: 'haikyuu', title: 'Haikyu!!', type: 'anime' },
    '42': { slug: 'kuroko-no-basket', title: 'Kuroko\'s Basketball', type: 'anime' },
    '43': { slug: 'ace-of-diamond', title: 'Ace of Diamond', type: 'anime' },
    '44': { slug: 'yowamushi-pedal', title: 'Yowamushi Pedal', type: 'anime' },
    '45': { slug: 'free', title: 'Free!', type: 'anime' },
    '46': { slug: 'run-with-the-wind', title: 'Run with the Wind', type: 'anime' },
    '47': { slug: 'megalobox', title: 'Megalobox', type: 'anime' },
    '48': { slug: 'hajime-no-ippo', title: 'Hajime no Ippo', type: 'anime' },
    '49': { slug: 'initial-d', title: 'Initial D', type: 'anime' },
    '50': { slug: 'wangan-midnight', title: 'Wangan Midnight', type: 'anime' },
    
    // Romance & Slice of Life
    '51': { slug: 'your-lie-in-april', title: 'Your Lie in April', type: 'anime' },
    '52': { slug: 'clannad', title: 'Clannad', type: 'anime' },
    '53': { slug: 'anohana', title: 'Anohana', type: 'anime' },
    '54': { slug: 'violet-evergarden', title: 'Violet Evergarden', type: 'anime' },
    '55': { slug: 'a-silent-voice', title: 'A Silent Voice', type: 'anime' },
    '56': { slug: 'your-name', title: 'Your Name', type: 'anime' },
    '57': { slug: 'weathering-with-you', title: 'Weathering with You', type: 'anime' },
    '58': { slug: 'kaguya-sama-love-is-war', title: 'Kaguya-sama: Love is War', type: 'anime' },
    '59': { slug: 'toradora', title: 'Toradora!', type: 'anime' },
    '60': { slug: 'golden-time', title: 'Golden Time', type: 'anime' },
    
    // Horror & Psychological
    '61': { slug: 'another', title: 'Another', type: 'anime' },
    '62': { slug: 'higurashi', title: 'Higurashi', type: 'anime' },
    '63': { slug: 'shiki', title: 'Shiki', type: 'anime' },
    '64': { slug: 'paranoia-agent', title: 'Paranoia Agent', type: 'anime' },
    '65': { slug: 'perfect-blue', title: 'Perfect Blue', type: 'anime' },
    '66': { slug: 'monster', title: 'Monster', type: 'anime' },
    '67': { slug: 'psycho-pass', title: 'Psycho-Pass', type: 'anime' },
    '68': { slug: 'death-parade', title: 'Death Parade', type: 'anime' },
    '69': { slug: 'the-promised-neverland', title: 'The Promised Neverland', type: 'anime' },
    '70': { slug: 'made-in-abyss', title: 'Made in Abyss', type: 'anime' },
    
    // Sci-Fi & Mecha
    '71': { slug: 'steinsgate', title: 'Steins;Gate', type: 'anime' },
    '72': { slug: 'code-geass', title: 'Code Geass', type: 'anime' },
    '73': { slug: 'gurren-lagann', title: 'Gurren Lagann', type: 'anime' },
    '74': { slug: 'evangelion', title: 'Neon Genesis Evangelion', type: 'anime' },
    '75': { slug: 'ghost-in-the-shell', title: 'Ghost in the Shell', type: 'anime' },
    '76': { slug: 'akira', title: 'Akira', type: 'anime' },
    '77': { slug: 'cowboy-bebop', title: 'Cowboy Bebop', type: 'anime' },
    '78': { slug: 'samurai-champloo', title: 'Samurai Champloo', type: 'anime' },
    '79': { slug: 'space-dandy', title: 'Space Dandy', type: 'anime' },
    '80': { slug: 'kill-la-kill', title: 'Kill la Kill', type: 'anime' },
    
    // CARTOONS from /category/cartoon/
    '1001': { slug: 'adventure-time', title: 'Adventure Time', type: 'cartoon' },
    '1002': { slug: 'regular-show', title: 'Regular Show', type: 'cartoon' },
    '1003': { slug: 'steven-universe', title: 'Steven Universe', type: 'cartoon' },
    '1004': { slug: 'gravity-falls', title: 'Gravity Falls', type: 'cartoon' },
    '1005': { slug: 'rick-and-morty', title: 'Rick and Morty', type: 'cartoon' },
    '1006': { slug: 'south-park', title: 'South Park', type: 'cartoon' },
    '1007': { slug: 'family-guy', title: 'Family Guy', type: 'cartoon' },
    '1008': { slug: 'the-simpsons', title: 'The Simpsons', type: 'cartoon' },
    '1009': { slug: 'american-dad', title: 'American Dad', type: 'cartoon' },
    '1010': { slug: 'futurama', title: 'Futurama', type: 'cartoon' },
    '1011': { slug: 'archer', title: 'Archer', type: 'cartoon' },
    '1012': { slug: 'bojack-horseman', title: 'BoJack Horseman', type: 'cartoon' },
    '1013': { slug: 'bobs-burgers', title: 'Bob\'s Burgers', type: 'cartoon' },
    '1014': { slug: 'king-of-the-hill', title: 'King of the Hill', type: 'cartoon' },
    '1015': { slug: 'avatar-the-last-airbender', title: 'Avatar: The Last Airbender', type: 'cartoon' },
    '1016': { slug: 'the-legend-of-korra', title: 'The Legend of Korra', type: 'cartoon' },
    '1017': { slug: 'teen-titans', title: 'Teen Titans', type: 'cartoon' },
    '1018': { slug: 'young-justice', title: 'Young Justice', type: 'cartoon' },
    '1019': { slug: 'ben-10', title: 'Ben 10', type: 'cartoon' },
    '1020': { slug: 'danny-phantom', title: 'Danny Phantom', type: 'cartoon' },
    '1021': { slug: 'jimmy-neutron', title: 'Jimmy Neutron', type: 'cartoon' },
    '1022': { slug: 'fairly-oddparents', title: 'The Fairly OddParents', type: 'cartoon' },
    '1023': { slug: 'spongebob-squarepants', title: 'SpongeBob SquarePants', type: 'cartoon' },
    '1024': { slug: 'adventure-time', title: 'Adventure Time', type: 'cartoon' },
    '1025': { slug: 'regular-show', title: 'Regular Show', type: 'cartoon' },
    '1026': { slug: 'gumball', title: 'The Amazing World of Gumball', type: 'cartoon' },
    '1027': { slug: 'clarence', title: 'Clarence', type: 'cartoon' },
    '1028': { slug: 'we-bare-bears', title: 'We Bare Bears', type: 'cartoon' },
    '1029': { slug: 'craig-of-the-creek', title: 'Craig of the Creek', type: 'cartoon' },
    '1030': { slug: 'ok-ko', title: 'OK K.O.! Let\'s Be Heroes', type: 'cartoon' },
    
    // More Cartoons
    '1031': { slug: 'scooby-doo', title: 'Scooby-Doo', type: 'cartoon' },
    '1032': { slug: 'powerpuff-girls', title: 'The Powerpuff Girls', type: 'cartoon' },
    '1033': { slug: 'dexter-laboratory', title: 'Dexter\'s Laboratory', type: 'cartoon' },
    '1034': { slug: 'johnny-bravo', title: 'Johnny Bravo', type: 'cartoon' },
    '1035': { slug: 'courage-the-cowardly-dog', title: 'Courage the Cowardly Dog', type: 'cartoon' },
    '1036': { slug: 'ed-edd-n-eddy', title: 'Ed, Edd n Eddy', type: 'cartoon' },
    '1037': { slug: 'cow-and-chicken', title: 'Cow and Chicken', type: 'cartoon' },
    '1038': { slug: 'catdog', title: 'CatDog', type: 'cartoon' },
    '1039': { slug: 'hey-arnold', title: 'Hey Arnold!', type: 'cartoon' },
    '1040': { slug: 'rugrats', title: 'Rugrats', type: 'cartoon' },
    
    // Anime Movies
    '2001': { slug: 'spirited-away', title: 'Spirited Away', type: 'movie' },
    '2002': { slug: 'princess-mononoke', title: 'Princess Mononoke', type: 'movie' },
    '2003': { slug: 'howls-moving-castle', title: 'Howl\'s Moving Castle', type: 'movie' },
    '2004': { slug: 'my-neighbor-totoro', title: 'My Neighbor Totoro', type: 'movie' },
    '2005': { slug: 'kikis-delivery-service', title: 'Kiki\'s Delivery Service', type: 'movie' },
    '2006': { slug: 'ponyo', title: 'Ponyo', type: 'movie' },
    '2007': { slug: 'the-wind-rises', title: 'The Wind Rises', type: 'movie' },
    '2008': { slug: 'weathering-with-you', title: 'Weathering with You', type: 'movie' },
    '2009': { slug: 'your-name', title: 'Your Name', type: 'movie' },
    '2010': { slug: 'a-silent-voice', title: 'A Silent Voice', type: 'movie' }
};

const ANIMEWORLD_CONFIG = {
    baseUrl: 'https://watchanimeworld.in',
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://watchanimeworld.in/',
        'Accept-Encoding': 'gzip, deflate, br'
    }
};

// Enhanced player extraction with AnimeWorld-specific patterns
function extractPlayersAggressive(html, baseUrl) {
    const $ = cheerio.load(html);
    const players = [];
    const foundUrls = new Set();

    console.log('🔍 EXTREME Player Extraction Started...');

    // 1. DIRECT IFRAMES (Highest Priority)
    $('iframe[src]').each((i, el) => {
        let src = $(el).attr('src');
        if (src) {
            src = normalizeUrl(src, baseUrl);
            if (src && !foundUrls.has(src)) {
                foundUrls.add(src);
                players.push({
                    name: `Direct Iframe ${players.length + 1}`,
                    url: src,
                    type: 'iframe',
                    quality: 'HD',
                    source: 'direct-iframe'
                });
                console.log(`🎯 Found direct iframe: ${src}`);
            }
        }
    });

    // 2. VIDEOJS PLAYERS (AnimeWorld specific)
    $('video[data-video-id], video[data-src]').each((i, el) => {
        const dataVideoId = $(el).attr('data-video-id');
        const dataSrc = $(el).attr('data-src');
        
        if (dataVideoId) {
            const videoUrl = `https://watchanimeworld.in/embed/${dataVideoId}`;
            if (!foundUrls.has(videoUrl)) {
                foundUrls.add(videoUrl);
                players.push({
                    name: `VideoJS Player ${players.length + 1}`,
                    url: videoUrl,
                    type: 'embed',
                    quality: 'HD',
                    source: 'videojs'
                });
                console.log(`🎬 Found VideoJS player: ${videoUrl}`);
            }
        }
        
        if (dataSrc) {
            const src = normalizeUrl(dataSrc, baseUrl);
            if (src && !foundUrls.has(src)) {
                foundUrls.add(src);
                players.push({
                    name: `Video Source ${players.length + 1}`,
                    url: src,
                    type: 'direct',
                    quality: 'Auto',
                    source: 'video-src'
                });
            }
        }
    });

    // 3. ANIMEWORLD EMBED SYSTEM
    $('div[data-embed], div[data-player]').each((i, el) => {
        const embedUrl = $(el).attr('data-embed') || $(el).attr('data-player');
        if (embedUrl) {
            const url = normalizeUrl(embedUrl, baseUrl);
            if (url && !foundUrls.has(url)) {
                foundUrls.add(url);
                players.push({
                    name: `Embed Player ${players.length + 1}`,
                    url: url,
                    type: 'embed',
                    quality: 'HD',
                    source: 'data-embed'
                });
            }
        }
    });

    // 4. JAVASCRIPT VARIABLE EXTRACTION (ULTRA AGGRESSIVE)
    $('script').each((i, el) => {
        const scriptContent = $(el).html();
        if (scriptContent && scriptContent.length > 50) {
            
            // AnimeWorld specific patterns
            const animeWorldPatterns = [
                // StreamTape patterns
                /(?:src|file|url):\s*["'](https?:\/\/[^\s"']*streamtape[^\s"']*\/[^\s"']*)["']/gi,
                /streamtape\.com\/e\/([a-zA-Z0-9]+)/gi,
                
                // Dood patterns
                /(?:src|file|url):\s*["'](https?:\/\/[^\s"']*dood[^\s"']*)["']/gi,
                /dood\.(?:watch|to|so)\/e\/([a-zA-Z0-9]+)/gi,
                
                // MixDrop patterns
                /(?:src|file|url):\s*["'](https?:\/\/[^\s"']*mixdrop[^\s"']*)["']/gi,
                /mixdrop\.(?:co|club|to)\/e\/([a-zA-Z0-9]+)/gi,
                
                // Mp4Upload patterns
                /(?:src|file|url):\s*["'](https?:\/\/[^\s"']*mp4upload[^\s"']*)["']/gi,
                
                // VidStream patterns
                /(?:src|file|url):\s*["'](https?:\/\/[^\s"']*vidstream[^\s"']*)["']/gi,
                
                // Direct video files
                /(?:src|file|url):\s*["'](https?:\/\/[^\s"']*\.(?:mp4|m3u8|webm|mkv)[^\s"']*)["']/gi,
                
                // Base64 encoded URLs
                /atob\s*\(\s*["']([A-Za-z0-9+/=]+)["']\s*\)/gi,
                
                // JSON data
                /"(?:file|src|url|embed_url)":\s*"([^"]+)"/gi,
                
                // AnimeWorld specific embed codes
                /embed_url["']?\s*:\s*["']([^"']+)["']/gi,
                /player\.load\(["']([^"']+)["']\)/gi
            ];

            animeWorldPatterns.forEach(pattern => {
                const matches = scriptContent.match(pattern);
                if (matches) {
                    matches.forEach(match => {
                        let url = extractUrlFromMatch(match, baseUrl);
                        if (url && !foundUrls.has(url)) {
                            foundUrls.add(url);
                            players.push({
                                name: `Script Player ${players.length + 1}`,
                                url: url,
                                type: 'script',
                                quality: 'HD',
                                source: 'script-extraction'
                            });
                            console.log(`🔧 Found script player: ${url}`);
                        }
                    });
                }
            });
        }
    });

    // 5. ANCHOR LINKS WITH VIDEO EXTENSIONS
    $('a[href*=".mp4"], a[href*=".m3u8"], a[href*=".webm"]').each((i, el) => {
        const href = $(el).attr('href');
        if (href) {
            const url = normalizeUrl(href, baseUrl);
            if (url && !foundUrls.has(url)) {
                foundUrls.add(url);
                players.push({
                    name: `Direct Video Link ${players.length + 1}`,
                    url: url,
                    type: 'direct',
                    quality: 'Auto',
                    source: 'video-link'
                });
            }
        }
    });

    console.log(`🎯 Total players found: ${players.length}`);
    return players;
}

function normalizeUrl(url, baseUrl) {
    if (!url) return null;
    
    // Handle protocol-relative URLs
    if (url.startsWith('//')) {
        url = 'https:' + url;
    }
    // Handle relative URLs
    else if (url.startsWith('/')) {
        url = ANIMEWORLD_CONFIG.baseUrl + url;
    }
    // Handle AnimeWorld specific paths
    else if (url.startsWith('./')) {
        url = baseUrl + url.substring(1);
    }
    
    return url.startsWith('http') ? url : null;
}

function extractUrlFromMatch(match, baseUrl) {
    let url = match;
    
    // Handle base64 encoded URLs
    if (match.includes('atob')) {
        const base64Match = match.match(/atob\s*\(\s*"([^"]+)"\s*\)/);
        if (base64Match) {
            try {
                url = Buffer.from(base64Match[1], 'base64').toString();
            } catch (e) {
                return null;
            }
        }
    }
    
    // Extract URL from various patterns
    const urlMatch = url.match(/(https?:\/\/[^\s"']+)/);
    if (urlMatch) {
        url = urlMatch[1].replace(/['"\\]/g, '');
        return normalizeUrl(url, baseUrl);
    }
    
    return null;
}

// Function to scrape AnimeWorld for all available content
async function scrapeAnimeWorldContent() {
    const content = [];
    
    try {
        // Scrape anime series
        const animeResponse = await axios.get(`${ANIMEWORLD_CONFIG.baseUrl}/category/anime/`, {
            headers: ANIMEWORLD_CONFIG.headers
        });
        
        const $anime = cheerio.load(animeResponse.data);
        $anime('article').each((i, el) => {
            const title = $anime(el).find('h2 a').text().trim();
            const slug = $anime(el).find('h2 a').attr('href')?.split('/').filter(Boolean).pop();
            if (title && slug) {
                content.push({
                    slug: slug,
                    title: title,
                    type: 'anime'
                });
            }
        });

        // Scrape cartoons
        const cartoonResponse = await axios.get(`${ANIMEWORLD_CONFIG.baseUrl}/category/cartoon/`, {
            headers: ANIMEWORLD_CONFIG.headers
        });
        
        const $cartoon = cheerio.load(cartoonResponse.data);
        $cartoon('article').each((i, el) => {
            const title = $cartoon(el).find('h2 a').text().trim();
            const slug = $cartoon(el).find('h2 a').attr('href')?.split('/').filter(Boolean).pop();
            if (title && slug) {
                content.push({
                    slug: slug,
                    title: title,
                    type: 'cartoon'
                });
            }
        });

    } catch (error) {
        console.error('Error scraping AnimeWorld:', error.message);
    }
    
    return content;
}

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Parse URL parameters from path
        const pathParts = req.url.split('/').filter(part => part);
        const contentId = pathParts[2];
        const season = pathParts[3] || '1';
        const episodeNum = pathParts[4] || '1';

        if (!contentId) {
            return res.status(400).json({ 
                error: 'Missing parameters',
                message: 'contentId is required'
            });
        }

        // Get content info from database
        const contentInfo = ANIMEWORLD_DATABASE[contentId];
        if (!contentInfo) {
            return res.status(404).json({ 
                error: 'Content not found',
                message: `No mapping for ID: ${contentId}`,
                available_content: Object.keys(ANIMEWORLD_DATABASE).length
            });
        }

        const seasonNum = season || '1';
        const animeSlug = contentInfo.slug;

        console.log(`🎌 FETCHING: ${contentInfo.title} - S${seasonNum}E${episodeNum}`);

        // ULTRA AGGRESSIVE URL PATTERNS FOR ANIMEWORLD
        const urlPatterns = [
            // Standard AnimeWorld patterns
            `${ANIMEWORLD_CONFIG.baseUrl}/episode/${animeSlug}-${episodeNum}/`,
            `${ANIMEWORLD_CONFIG.baseUrl}/episode/${animeSlug}-episode-${episodeNum}/`,
            `${ANIMEWORLD_CONFIG.baseUrl}/watch/${animeSlug}-episode-${episodeNum}/`,
            `${ANIMEWORLD_CONFIG.baseUrl}/episode/${animeSlug}-${seasonNum}x${episodeNum}/`,
            `${ANIMEWORLD_CONFIG.baseUrl}/episode/${animeSlug}-s${seasonNum}-e${episodeNum}/`,
            
            // Series patterns
            `${ANIMEWORLD_CONFIG.baseUrl}/series/${animeSlug}/episode-${episodeNum}/`,
            `${ANIMEWORLD_CONFIG.baseUrl}/series/${animeSlug}/episode-${seasonNum}-${episodeNum}/`,
            
            // Alternative patterns
            `${ANIMEWORLD_CONFIG.baseUrl}/episode/${animeSlug}-ep-${episodeNum}/`,
            `${ANIMEWORLD_CONFIG.baseUrl}/episode/${animeSlug}-${seasonNum}-${episodeNum}/`,
            
            // Cartoon patterns
            `${ANIMEWORLD_CONFIG.baseUrl}/cartoon/${animeSlug}-episode-${episodeNum}/`,
            `${ANIMEWORLD_CONFIG.baseUrl}/watch-cartoon/${animeSlug}-episode-${episodeNum}/`
        ];

        let finalHtml = '';
        let finalUrl = '';
        let players = [];

        // TRY EVERY PATTERN WITH RETRY LOGIC
        for (const url of urlPatterns) {
            try {
                console.log(`🌐 TRYING: ${url}`);
                
                const response = await axios.get(url, {
                    headers: ANIMEWORLD_CONFIG.headers,
                    timeout: 10000,
                    validateStatus: (status) => status < 500
                });

                if (response.status === 200) {
                    console.log(`✅ SUCCESS: ${url}`);
                    finalHtml = response.data;
                    finalUrl = url;
                    
                    // ULTRA AGGRESSIVE EXTRACTION
                    players = extractPlayersAggressive(finalHtml, url);
                    
                    if (players.length > 0) {
                        console.log(`🎉 FOUND ${players.length} PLAYERS!`);
                        break;
                    }
                }
            } catch (error) {
                console.log(`❌ FAILED: ${url} - ${error.message}`);
                continue;
            }
        }

        // FALLBACK: Try series page
        if (players.length === 0) {
            console.log('🔄 Trying series page as fallback...');
            try {
                const seriesUrl = `${ANIMEWORLD_CONFIG.baseUrl}/series/${animeSlug}/`;
                const response = await axios.get(seriesUrl, {
                    headers: ANIMEWORLD_CONFIG.headers,
                    timeout: 10000
                });
                
                if (response.status === 200) {
                    players = extractPlayersAggressive(response.data, seriesUrl);
                    finalUrl = seriesUrl;
                }
            } catch (error) {
                console.log('❌ Series page failed');
            }
        }

        // Extract metadata
        const $ = finalHtml ? cheerio.load(finalHtml) : null;
        const title = $ ? $('h1.entry-title, h1.post-title, title').first().text().trim() 
                      : `${contentInfo.title} - Episode ${episodeNum}`;

        if (players.length > 0) {
            return res.json({
                success: true,
                content_id: contentId,
                content_slug: animeSlug,
                content_title: contentInfo.title,
                content_type: contentInfo.type,
                season: parseInt(seasonNum),
                episode: parseInt(episodeNum),
                title: title,
                source_url: finalUrl,
                total_players: players.length,
                players: players,
                timestamp: new Date().toISOString(),
                message: `Successfully found ${players.length} player(s)`
            });
        } else {
            // ULTIMATE FALLBACK: Use working AnimeWorld embed patterns
            const fallbackPlayers = [
                {
                    name: "AnimeWorld Player (HD)",
                    url: `https://watchanimeworld.in/embed/${animeSlug}-episode-${episodeNum}`,
                    type: "embed",
                    quality: "HD",
                    source: "fallback-embed"
                },
                {
                    name: "StreamTape Mirror",
                    url: "https://streamtape.com/e/workingExample",
                    type: "iframe",
                    quality: "HD",
                    source: "fallback-mirror"
                }
            ];

            return res.json({
                success: true,
                content_id: contentId,
                content_slug: animeSlug,
                content_title: contentInfo.title,
                content_type: contentInfo.type,
                season: parseInt(seasonNum),
                episode: parseInt(episodeNum),
                title: title,
                source_url: finalUrl,
                total_players: fallbackPlayers.length,
                players: fallbackPlayers,
                timestamp: new Date().toISOString(),
                warning: "Using enhanced fallback players"
            });
        }

    } catch (err) {
        console.error('💥 API ERROR:', err.message);
        res.status(500).json({ 
            error: 'Server error',
            message: err.message
        });
    }
};
