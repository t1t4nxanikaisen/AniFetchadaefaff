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
    // ===== MOST POPULAR ANIME =====
    '21': { slug: 'one-piece', title: 'One Piece' },
    '20': { slug: 'naruto', title: 'Naruto' },
    '1735': { slug: 'naruto-shippuden', title: 'Naruto Shippuden' },
    '16498': { slug: 'attack-on-titan', title: 'Attack on Titan' },
    '38000': { slug: 'demon-slayer-kimetsu-no-yaiba', title: 'Demon Slayer: Kimetsu no Yaiba' },
    '113415': { slug: 'jujutsu-kaisen', title: 'Jujutsu Kaisen' },
    '99147': { slug: 'chainsaw-man', title: 'Chainsaw Man' },
    '101759': { slug: 'oshi-no-ko', title: 'Oshi no Ko' },
    '11061': { slug: 'tokyo-ghoul', title: 'Tokyo Ghoul' },
    '23283': { slug: 'sword-art-online', title: 'Sword Art Online' },
    
    // ===== CLASSIC & LEGENDARY ANIME =====
    '1': { slug: 'cowboy-bebop', title: 'Cowboy Bebop' },
    '44': { slug: 'hunter-x-hunter-2011', title: 'Hunter x Hunter (2011)' },
    '104': { slug: 'bleach', title: 'Bleach' },
    '136': { slug: 'pokemon', title: 'Pokémon' },
    '456': { slug: 'fullmetal-alchemist-brotherhood', title: 'Fullmetal Alchemist: Brotherhood' },
    '1535': { slug: 'death-note', title: 'Death Note' },
    '11757': { slug: 'fairy-tail', title: 'Fairy Tail' },
    '30015': { slug: 'kaguya-sama-love-is-war', title: 'Kaguya-sama: Love Is War' },
    '108632': { slug: 'frieren-beyond-journeys-end', title: 'Frieren: Beyond Journey\'s End' },
    '99263': { slug: 'solo-leveling', title: 'Solo Leveling' },
    
    // ===== DRAGON BALL SERIES =====
    '223': { slug: 'dragon-ball', title: 'Dragon Ball' },
    '427': { slug: 'dragon-ball-z', title: 'Dragon Ball Z' },
    '1592': { slug: 'dragon-ball-gt', title: 'Dragon Ball GT' },
    '22319': { slug: 'dragon-ball-super', title: 'Dragon Ball Super' },
    
    // ===== MY HERO ACADEMIA SERIES =====
    '31478': { slug: 'my-hero-academia', title: 'My Hero Academia' },
    '33486': { slug: 'my-hero-academia-season-2', title: 'My Hero Academia Season 2' },
    '100166': { slug: 'my-hero-academia-season-3', title: 'My Hero Academia Season 3' },
    '104276': { slug: 'my-hero-academia-season-4', title: 'My Hero Academia Season 4' },
    '117193': { slug: 'my-hero-academia-season-5', title: 'My Hero Academia Season 5' },
    '139630': { slug: 'my-hero-academia-season-6', title: 'My Hero Academia Season 6' },
    '155017': { slug: 'my-hero-academia-season-7', title: 'My Hero Academia Season 7' },
    
    // ===== ONE PUNCH MAN SERIES =====
    '22199': { slug: 'one-punch-man', title: 'One Punch Man' },
    '34134': { slug: 'one-punch-man-season-2', title: 'One Punch Man Season 2' },
    
    // ===== ATTACK ON TITAN SEASONS =====
    '25777': { slug: 'attack-on-titan-season-2', title: 'Attack on Titan Season 2' },
    '99147': { slug: 'attack-on-titan-season-3', title: 'Attack on Titan Season 3' },
    '110277': { slug: 'attack-on-titan-season-3-part-2', title: 'Attack on Titan Season 3 Part 2' },
    '139630': { slug: 'attack-on-titan-final-season', title: 'Attack on Titan Final Season' },
    '142329': { slug: 'attack-on-titan-final-season-part-2', title: 'Attack on Titan Final Season Part 2' },
    '153735': { slug: 'attack-on-titan-final-season-part-3', title: 'Attack on Titan Final Season Part 3' },
    
    // ===== JUJUTSU KAISEN SERIES =====
    '115277': { slug: 'jujutsu-kaisen-season-2', title: 'Jujutsu Kaisen Season 2' },
    '103632': { slug: 'jujutsu-kaisen-0-movie', title: 'Jujutsu Kaisen 0 Movie' },
    
    // ===== DEMON SLAYER SERIES =====
    '101922': { slug: 'demon-slayer-mugen-train-arc', title: 'Demon Slayer: Mugen Train Arc' },
    '115277': { slug: 'demon-slayer-entertainment-district-arc', title: 'Demon Slayer: Entertainment District Arc' },
    '144052': { slug: 'demon-slayer-swordsmith-village-arc', title: 'Demon Slayer: Swordsmith Village Arc' },
    '166240': { slug: 'demon-slayer-hashira-training-arc', title: 'Demon Slayer: Hashira Training Arc' },
    
    // ===== SPORTS ANIME =====
    '28851': { slug: 'haikyuu', title: 'Haikyu!!' },
    '28755': { slug: 'haikyuu-season-2', title: 'Haikyu!! Season 2' },
    '32935': { slug: 'haikyuu-season-3', title: 'Haikyu!! Season 3' },
    '106625': { slug: 'haikyuu-to-the-top', title: 'Haikyu!! To the Top' },
    '53025': { slug: 'blue-lock', title: 'Blue Lock' },
    '147153': { slug: 'blue-lock-season-2', title: 'Blue Lock Season 2' },
    '19': { slug: 'monster', title: 'Monster' },
    
    // ===== ROMANCE & SLICE OF LIFE =====
    '42938': { slug: 'fruits-basket', title: 'Fruits Basket' },
    '46838': { slug: 'horimiya', title: 'Horimiya' },
    '50287': { slug: 'komi-cant-communicate', title: 'Komi Can\'t Communicate' },
    '55123': { slug: 'spy-x-family', title: 'SPY x FAMILY' },
    '142838': { slug: 'spy-x-family-season-2', title: 'SPY x FAMILY Season 2' },
    '39587': { slug: 'rent-a-girlfriend', title: 'Rent-a-Girlfriend' },
    
    // ===== ISEKAI ANIME =====
    '32268': { slug: 're-zero-starting-life-in-another-world', title: 'Re:ZERO -Starting Life in Another World-' },
    '108465': { slug: 're-zero-season-2', title: 'Re:ZERO Season 2' },
    '36456': { slug: 'that-time-i-got-reincarnated-as-a-slime', title: 'That Time I Got Reincarnated as a Slime' },
    '108511': { slug: 'that-time-i-got-reincarnated-as-a-slime-season-2', title: 'That Time I Got Reincarnated as a Slime Season 2' },
    '39535': { slug: 'overlord', title: 'Overlord' },
    '38040': { slug: 'konosuba', title: 'KonoSuba: God\'s Blessing on This Wonderful World!' },
    '30831': { slug: 'konosuba-season-2', title: 'KonoSuba Season 2' },
    '21995': { slug: 'no-game-no-life', title: 'No Game No Life' },
    
    // ===== ACTION & ADVENTURE =====
    '34933': { slug: 'vinland-saga', title: 'Vinland Saga' },
    '136430': { slug: 'vinland-saga-season-2', title: 'Vinland Saga Season 2' },
    '36456': { slug: 'the-promised-neverland', title: 'The Promised Neverland' },
    '131681': { slug: 'the-promised-neverland-season-2', title: 'The Promised Neverland Season 2' },
    '34104': { slug: 'dr-stone', title: 'Dr. Stone' },
    '108465': { slug: 'dr-stone-stone-wars', title: 'Dr. Stone: Stone Wars' },
    '136430': { slug: 'dr-stone-new-world', title: 'Dr. Stone: New World' },
    '39597': { slug: 'fire-force', title: 'Fire Force' },
    '114236': { slug: 'fire-force-season-2', title: 'Fire Force Season 2' },
    '47994': { slug: 'tokyo-revengers', title: 'Tokyo Revengers' },
    '155017': { slug: 'tokyo-revengers-season-2', title: 'Tokyo Revengers Season 2' },
    
    // ===== PSYCHOLOGICAL & THRILLER =====
    '32901': { slug: 'mob-psycho-100', title: 'Mob Psycho 100' },
    '37510': { slug: 'mob-psycho-100-season-2', title: 'Mob Psycho 100 Season 2' },
    '131681': { slug: 'mob-psycho-100-season-3', title: 'Mob Psycho 100 Season 3' },
    '9253': { slug: 'steins-gate', title: 'Steins;Gate' },
    '30484': { slug: 'steins-gate-0', title: 'Steins;Gate 0' },
    '6547': { slug: 'angel-beats', title: 'Angel Beats!' },
    '20583': { slug: 'noragami', title: 'Noragami' },
    '30503': { slug: 'noragami-aragoto', title: 'Noragami Aragoto' },
    
    // ===== RECENT POPULAR ANIME (2020-2024) =====
    '127230': { slug: 'wonder-egg-priority', title: 'Wonder Egg Priority' },
    '124080': { slug: 'oddtaxi', title: 'Odd Taxi' },
    '133965': { slug: 'ranking-of-kings', title: 'Ranking of Kings' },
    '137822': { slug: 'lycoris-recoil', title: 'Lycoris Recoil' },
    '140439': { slug: 'cyberpunk-edgerunners', title: 'Cyberpunk: Edgerunners' },
    '145064': { slug: 'bocchi-the-rock', title: 'Bocchi the Rock!' },
    '150672': { slug: 'mob-psycho-100-season-3', title: 'Mob Psycho 100 Season 3' },
    '155844': { slug: 'hell-s-paradise', title: 'Hell\'s Paradise' },
    '61845': { slug: 'mashle-magic-and-muscles', title: 'Mashle: Magic and Muscles' },
    '162804': { slug: 'mashle-season-2', title: 'Mashle Season 2' },
    
    // ===== 2024 ANIME =====
    '178025': { slug: 'gachiakuta', title: 'Gachiakuta' },
    '166531': { slug: 'kaiju-no-8', title: 'Kaiju No. 8' },
    '163132': { slug: 'wind-breaker', title: 'Wind Breaker' },
    '154587': { slug: 'dandadan', title: 'Dandadan' },
    '163270': { slug: 'blue-lock-season-2', title: 'Blue Lock Season 2' },
    '166240': { slug: 'demon-slayer-infinity-castle-arc', title: 'Demon Slayer: Infinity Castle Arc' },
    '164081': { slug: 'undead-unluck', title: 'Undead Unluck' },
    '158927': { slug: 'zom-100-bucket-list-of-the-dead', title: 'Zom 100: Bucket List of the Dead' },
    '162804': { slug: 'the-apothecary-diaries', title: 'The Apothecary Diaries' },
    '155844': { slug: 'heavenly-delusion', title: 'Heavenly Delusion' },
    
    // ===== LONG-RUNNING SERIES =====
    '269': { slug: 'bleach-thousand-year-blood-war', title: 'Bleach: Thousand-Year Blood War' },
    '30002': { slug: 'seven-deadly-sins', title: 'The Seven Deadly Sins' },
    '31414': { slug: 'seven-deadly-sins-signs-of-holy-war', title: 'The Seven Deadly Sins: Signs of Holy War' },
    '40748': { slug: 'seven-deadly-sins-imperial-wrath-of-the-gods', title: 'The Seven Deadly Sins: Imperial Wrath of the Gods' },
    '142062': { slug: 'seven-deadly-sins-grudge-of-edinburgh', title: 'The Seven Deadly Sins: Grudge of Edinburgh' },
    
    // ===== MECHA ANIME =====
    '30': { slug: 'neon-genesis-evangelion', title: 'Neon Genesis Evangelion' },
    '32': { slug: 'neon-genesis-evangelion-the-end-of-evangelion', title: 'Neon Genesis Evangelion: The End of Evangelion' },
    '2001': { slug: 'tengen-toppa-gurren-lagann', title: 'Tengen Toppa Gurren Lagann' },
    '23283': { slug: 'sword-art-online-alicization', title: 'Sword Art Online: Alicization' },
    '36474': { slug: 'sword-art-online-alicization-war-of-underworld', title: 'Sword Art Online: Alicization - War of Underworld' },
    
    // ===== MUSIC & IDOL ANIME =====
    '15051': { slug: 'love-live-school-idol-project', title: 'Love Live! School Idol Project' },
    '19111': { slug: 'love-live-school-idol-project-season-2', title: 'Love Live! School Idol Project Season 2' },
    '32526': { slug: 'love-live-sunshine', title: 'Love Live! Sunshine!!' },
    '34973': { slug: 'love-live-sunshine-season-2', title: 'Love Live! Sunshine!! Season 2' },
    '13759': { slug: 'k-on', title: 'K-On!' },
    '7791': { slug: 'k-on-season-2', title: 'K-On!! Season 2' },
    
    // ===== COMEDY ANIME =====
    '52991': { slug: 'saiki-k', title: 'The Disastrous Life of Saiki K.' },
    '34618': { slug: 'saiki-k-season-2', title: 'The Disastrous Life of Saiki K. Season 2' },
    '38659': { slug: 'hinamatsuri', title: 'Hinamatsuri' },
    '37521': { slug: 'grand-blue', title: 'Grand Blue' },
    '30831': { slug: 'prison-school', title: 'Prison School' },
    
    // ===== HORROR & SUPERNATURAL =====
    '23283': { slug: 'parasyte-the-maxim', title: 'Parasyte -the maxim-' },
    '11061': { slug: 'tokyo-ghoul-root-a', title: 'Tokyo Ghoul √A' },
    '31038': { slug: 'tokyo-ghoul-re', title: 'Tokyo Ghoul:re' },
    '37349': { slug: 'tokyo-ghoul-re-season-2', title: 'Tokyo Ghoul:re Season 2' },
    '10620': { slug: 'corpse-party', title: 'Corpse Party' },
    
    // ===== MARTIAL ARTS & FIGHTING =====
    '164': { slug: 'baki-the-grappler', title: 'Baki the Grappler' },
    '34443': { slug: 'baki', title: 'Baki' },
    '40748': { slug: 'baki-hanma', title: 'Baki Hanma' },
    '15': { slug: 'eyeshield-21', title: 'Eyeshield 21' },
    '28223': { slug: 'gangsta', title: 'Gangsta.' },
    
    // ===== FANTASY ADVENTURE =====
    '39535': { slug: 'made-in-abyss', title: 'Made in Abyss' },
    '100643': { slug: 'made-in-abyss-dawn-of-the-deep-soul', title: 'Made in Abyss: Dawn of the Deep Soul' },
    '114745': { slug: 'made-in-abyss-the-golden-city-of-the-scorching-sun', title: 'Made in Abyss: The Golden City of the Scorching Sun' },
    '32615': { slug: 'magi-the-labyrinth-of-magic', title: 'Magi: The Labyrinth of Magic' },
    '18115': { slug: 'magi-the-kingdom-of-magic', title: 'Magi: The Kingdom of Magic' },
    
    // ===== MYSTERY & DETECTIVE =====
    '2104': { slug: 'detective-conan', title: 'Detective Conan' },
    '37510': { slug: 'hyouka', title: 'Hyouka' },
    '11887': { slug: 'kokoro-connect', title: 'Kokoro Connect' },
    '37976': { slug: 'banana-fish', title: 'Banana Fish' },
    
    // ===== SCI-FI ANIME =====
    '339': { slug: 'serial-experiments-lain', title: 'Serial Experiments Lain' },
    '1575': { slug: 'code-geass', title: 'Code Geass: Lelouch of the Rebellion' },
    '2904': { slug: 'code-geass-r2', title: 'Code Geass: Lelouch of the Rebellion R2' },
    '431': { slug: 'howls-moving-castle', title: 'Howl\'s Moving Castle' },
    '164': { slug: 'ghost-in-the-shell-stand-alone-complex', title: 'Ghost in the Shell: Stand Alone Complex' },
    
    // ===== HISTORICAL ANIME =====
    '15335': { slug: 'gintama', title: 'Gintama' },
    '918': { slug: 'gintama-season-2', title: 'Gintama\'' },
    '28977': { slug: 'gintama-season-3', title: 'Gintama°' },
    '35843': { slug: 'gintama-season-4', title: 'Gintama.' },
    '37491': { slug: 'gintama-shirogane-no-tamashii-hen', title: 'Gintama.: Shirogane no Tamashii-hen' },
    
    // ===== SCHOOL ANIME =====
    '19815': { slug: 'no-game-no-life', title: 'No Game No Life' },
    '31859': { slug: 'your-name', title: 'Your Name.' },
    '28725': { slug: 'a-silent-voice', title: 'A Silent Voice' },
    '32729': { slug: 'weathering-with-you', title: 'Weathering with You' },
    
    // ===== ECCHI & HAREM =====
    '11757': { slug: 'high-school-dxd', title: 'High School DxD' },
    '15451': { slug: 'high-school-dxd-new', title: 'High School DxD New' },
    '24703': { slug: 'high-school-dxd-born', title: 'High School DxD BorN' },
    '34281': { slug: 'high-school-dxd-hero', title: 'High School DxD Hero' },
    '25157': { slug: 'food-wars', title: 'Food Wars! Shokugeki no Soma' },
    
    // ===== ADDITIONAL POPULAR SERIES =====
    '59637': { slug: 'the-eminence-in-shadow', title: 'The Eminence in Shadow' },
    '163132': { slug: 'the-eminence-in-shadow-season-2', title: 'The Eminence in Shadow Season 2' },
    '166531': { slug: 'mushoku-tensei-jobless-reincarnation', title: 'Mushoku Tensei: Jobless Reincarnation' },
    '154587': { slug: 'mushoku-tensei-season-2', title: 'Mushoku Tensei Season 2' },
    '155844': { slug: 'goblin-slayer', title: 'Goblin Slayer' },
    '108511': { slug: 'goblin-slayer-season-2', title: 'Goblin Slayer Season 2' },
    
    // ===== STUDIO GHIBLI & MOVIES =====
    '164': { slug: 'spirited-away', title: 'Spirited Away' },
    '523': { slug: 'my-neighbor-totoro', title: 'My Neighbor Totoro' },
    '572': { slug: 'princess-mononoke', title: 'Princess Mononoke' },
    '431': { slug: 'castle-in-the-sky', title: 'Castle in the Sky' },
    '587': { slug: 'kikis-delivery-service', title: 'Kiki\'s Delivery Service' },
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

// ========== ANIME SLUG RESOLVER ==========
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
                        title: media.title.english || media.title.romaji
                    };
                    console.log(`✅ Added new anime to database: ${anilistId} -> ${slug}`);
                    return slug;
                }
            }
        }
    } catch (error) {
        console.error('Error fetching from AniList:', error.message);
    }
    
    // Final fallback - generate slug from title
    return `anime-${anilistId}`;
}

// ========== ANIME SEARCH FUNCTION ==========
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

        // AnimeWorld specific selectors
        $('article, .post, .anime-item, .result-item').each((i, el) => {
            const title = $(el).find('h2 a, h3 a, .title a, .entry-title a').first().text().trim();
            const url = $(el).find('h2 a, h3 a, .title a, .entry-title a').first().attr('href');
            const image = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');
            const description = $(el).find('p, .entry-content, .excerpt').first().text().trim();
            
            if (title && url) {
                let slug = '';
                
                // Extract slug from URL
                const slugPatterns = [
                    /\/anime\/([^\/]+)/,
                    /\/episode\/([^\/]+)/,
                    /\/([^\/]+)-episode-/,
                    /\/([^\/]+)\/$/
                ];
                
                for (const pattern of slugPatterns) {
                    const match = url.match(pattern);
                    if (match && match[1]) {
                        slug = match[1];
                        slug = slug.replace(/-episode-\d+$/, '')
                                   .replace(/-season-\d+$/, '')
                                   .replace(/\/$/, '');
                        break;
                    }
                }
                
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

        console.log(`✅ Found ${results.length} results for "${query}" on ${source}`);
        return results;
    } catch (error) {
        console.error(`❌ Search error (${source}):`, error.message);
        return [];
    }
}

// ========== PLAYER EXTRACTION ==========
function extractVideoPlayers(html, source) {
    const $ = cheerio.load(html);
    const players = [];

    console.log(`🎬 Extracting players from ${source}...`);

    // Method 1: Direct iframes (most common on AnimeWorld)
    $('iframe').each((i, el) => {
        let src = $(el).attr('src');
        if (src) {
            if (src.startsWith('//')) src = 'https:' + src;
            if (isValidVideoUrl(src)) {
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
    $('video').each((i, el) => {
        const src = $(el).attr('src');
        if (src) {
            const fullSrc = src.startsWith('//') ? 'https:' + src : src;
            if (isValidVideoUrl(fullSrc)) {
                players.push({
                    type: 'direct',
                    server: `${source} Direct ${players.length + 1}`,
                    url: fullSrc,
                    quality: 'Auto',
                    format: 'mp4',
                    source: source
                });
                console.log(`🎥 Found video tag: ${fullSrc}`);
            }
        }
    });

    // Method 3: Script content analysis (most important for AnimeWorld)
    $('script').each((i, el) => {
        const scriptContent = $(el).html();
        if (scriptContent && scriptContent.length > 100) {
            // Common video player patterns in AnimeWorld
            const videoPatterns = [
                /(?:src|file|url):\s*["']([^"']+\.(mp4|m3u8|webm)[^"']*)["']/gi,
                /(?:src|file|url):\s*["'](https?:\/\/[^"']+\.(mp4|m3u8|webm)[^"']*)["']/gi,
                /videoUrl:\s*["']([^"']+)["']/gi,
                /source:\s*["']([^"']+)["']/gi,
                /embedUrl:\s*["']([^"']+)["']/gi,
                /(https?:\/\/[^\s"']*\.(mp4|m3u8|webm)[^\s"']*)/gi,
                /(https?:\/\/[^\s"']*\/embed\/[^\s"']*)/gi,
                /(https?:\/\/[^\s"']*\/video\/[^\s"']*)/gi,
                /(https?:\/\/[^\s"']*\/player\/[^\s"']*)/gi,
                /(https?:\/\/[^\s"']*\/stream\/[^\s"']*)/gi,
                /(https?:\/\/[^\s"']*\.(streamtape|dood|mixdrop|mp4upload)[^\s"']*)/gi
            ];

            videoPatterns.forEach(pattern => {
                const matches = scriptContent.match(pattern);
                if (matches) {
                    matches.forEach(match => {
                        let url = match.replace(/(src|file|url|videoUrl|source|embedUrl):\s*/gi, '')
                                      .replace(/["']/g, '')
                                      .trim();
                        
                        if (url.startsWith('//')) url = 'https:' + url;
                        
                        if (isValidVideoUrl(url) && !players.some(p => p.url === url)) {
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
                    });
                }
            });
        }
    });

    // Method 4: Data attributes
    $('[data-src], [data-url], [data-file]').each((i, el) => {
        const src = $(el).attr('data-src') || $(el).attr('data-url') || $(el).attr('data-file');
        if (src) {
            const fullSrc = src.startsWith('//') ? 'https:' + src : src;
            if (isValidVideoUrl(fullSrc)) {
                players.push({
                    type: 'data',
                    server: `${source} Data ${players.length + 1}`,
                    url: fullSrc,
                    quality: 'Auto',
                    format: getVideoFormat(fullSrc),
                    source: source
                });
                console.log(`📊 Found data URL: ${fullSrc}`);
            }
        }
    });

    console.log(`🎯 Found ${players.length} players from ${source}`);
    return players;
}

// ========== HELPER FUNCTIONS ==========
function isValidVideoUrl(url) {
    if (!url || typeof url !== 'string') return false;
    if (url.length < 10) return false;
    
    const validDomains = [
        'streamtape', 'dood', 'mixdrop', 'mp4upload', 'vidstream',
        'gogostream', 'embtaku', 'filemoon', 'vidcloud', 'sbplay',
        'youtube', 'youtu.be', 'vimeo', 'dailymotion', 'ok.ru',
        'facebook', 'instagram', 'tiktok', 'twitch', 'bilibili'
    ];
    
    const videoExtensions = ['.mp4', '.m3u8', '.webm', '.mkv', '.avi', '.mov'];
    
    const isValid = validDomains.some(domain => url.includes(domain)) ||
                   videoExtensions.some(ext => url.includes(ext)) ||
                   url.includes('/embed/') ||
                   url.includes('/video/') ||
                   url.includes('/player/');
    
    return isValid;
}

function getVideoFormat(url) {
    if (url.includes('.m3u8')) return 'hls';
    if (url.includes('.mp4')) return 'mp4';
    if (url.includes('.webm')) return 'webm';
    return 'auto';
}

// ========== EPISODE FETCHER ==========
async function getEpisodeData(animeSlug, season, episode, source = 'ANIMEWORLD') {
    const config = SOURCES[source];
    
    // More comprehensive URL patterns for AnimeWorld
    const urlAttempts = [
        // Standard patterns
        `${config.episodeUrl}/${animeSlug}-episode-${episode}/`,
        `${config.episodeUrl}/${animeSlug}-episode-${episode}`,
        `${config.episodeUrl}/${animeSlug}-${season}x${episode}/`,
        `${config.episodeUrl}/${animeSlug}-${episode}/`,
        
        // Alternative patterns
        `${config.baseUrl}/${animeSlug}-episode-${episode}/`,
        `${config.baseUrl}/episode/${animeSlug}-episode-${episode}/`,
        `${config.baseUrl}/episode/${animeSlug}-${episode}/`,
        
        // Fallback patterns
        `${config.baseUrl}/anime/${animeSlug}/episode-${episode}/`,
        `${config.baseUrl}/watch/${animeSlug}-episode-${episode}/`
    ];

    console.log(`🔍 Trying ${source} with slug: ${animeSlug}, episode: ${episode}`);

    for (const url of urlAttempts) {
        try {
            console.log(`🌐 Attempting: ${url}`);
            
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Cache-Control': 'no-cache',
                    'Referer': config.baseUrl,
                    'DNT': '1',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                },
                timeout: 15000,
                validateStatus: function (status) {
                    return status < 500;
                }
            });

            if (response.status === 200) {
                console.log(`✅ Page loaded successfully: ${url}`);
                const players = extractVideoPlayers(response.data, source);
                
                if (players.length > 0) {
                    const $ = cheerio.load(response.data);
                    const title = $('h1.entry-title, h1.post-title, .episode-title, h1').first().text().trim() || `Episode ${episode}`;
                    const description = $('div.entry-content p, .post-content p, .episode-description').first().text().trim() || '';
                    const thumbnail = $('.post-thumbnail img, .episode-thumbnail img, .wp-post-image').attr('src') || '';

                    return {
                        success: true,
                        url: url,
                        title: title,
                        description: description,
                        thumbnail: thumbnail,
                        players: players,
                        source: source
                    };
                } else {
                    console.log(`❌ No players found on: ${url}`);
                }
            } else {
                console.log(`❌ HTTP ${response.status} for: ${url}`);
            }
        } catch (error) {
            console.log(`❌ Failed to load: ${url} - ${error.message}`);
            continue;
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

// Search endpoint
app.get('/api/search/:query', async (req, res) => {
    const { query } = req.params;
    
    try {
        const [animeworldResults, backupResults] = await Promise.all([
            searchAnime(query, 'ANIMEWORLD'),
            searchAnime(query, 'BACKUP')
        ]);

        const allResults = [...animeworldResults, ...backupResults];
        
        res.json({
            success: true,
            query: query,
            results_count: allResults.length,
            results: allResults
        });
    } catch (error) {
        res.status(500).json({ error: 'Search failed', message: error.message });
    }
});

// Test endpoint for debugging
app.get('/api/debug/:anilistId/:episode', async (req, res) => {
    const { anilistId, episode } = req.params;
    
    console.log(`\n🔧 DEBUG: Testing anime ${anilistId} episode ${episode}`);
    
    try {
        const animeSlug = await getAnimeSlug(anilistId);
        const dbEntry = ANIME_DATABASE[anilistId];
        
        const results = [];
        const sources = ['ANIMEWORLD', 'BACKUP'];
        
        for (const source of sources) {
            try {
                console.log(`🧪 Testing source: ${source}`);
                const episodeData = await getEpisodeData(animeSlug, 1, parseInt(episode), source);
                
                results.push({
                    source: source,
                    slug: animeSlug,
                    success: episodeData.success,
                    players_found: episodeData.players.length,
                    url_used: episodeData.url || 'No successful URL',
                    title: episodeData.title || 'No title found'
                });
            } catch (error) {
                results.push({
                    source: source,
                    slug: animeSlug,
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
            test_results: results
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

// Embed endpoint
app.get('/anime/:anilistId/:episode/:language?', async (req, res) => {
    const { anilistId, episode, language = 'sub' } = req.params;
    const season = 1;

    try {
        const animeSlug = await getAnimeSlug(anilistId);
        const episodeData = await getEpisodeMultiSource(animeSlug, season, parseInt(episode));

        if (!episodeData.success || episodeData.players.length === 0) {
            return res.send(`
                <html>
                    <body style="background: #0a0a0a; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: Arial;">
                        <div style="text-align: center;">
                            <h1>Episode Not Found</h1>
                            <p>Anime ID: ${anilistId} | Episode: ${episode} | Language: ${language}</p>
                            <p>Anime Slug: ${animeSlug}</p>
                            <p>Tried: ${Object.keys(SOURCES).join(', ')}</p>
                        </div>
                    </body>
                </html>
            `);
        }

        const playerUrl = episodeData.players[0].url;

        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${episodeData.title}</title>
                <style>
                    body { margin: 0; padding: 0; background: #000; overflow: hidden; }
                    .player-container { width: 100vw; height: 100vh; }
                    iframe { width: 100%; height: 100%; border: none; }
                </style>
            </head>
            <body>
                <div class="player-container">
                    <iframe src="${playerUrl}" frameborder="0" scrolling="no" allowfullscreen></iframe>
                </div>
            </body>
            </html>
        `);

    } catch (error) {
        res.send(`
            <html>
                <body style="background: #0a0a0a; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: Arial;">
                    <div style="text-align: center;">
                        <h1>Error Loading Anime</h1>
                        <p>Anime ID: ${anilistId} | Episode: ${episode}</p>
                        <p>Error: ${error.message}</p>
                    </div>
                </body>
            </html>
        `);
    }
});

// Database endpoint
app.get('/api/database', (req, res) => {
    res.json({
        total_anime: Object.keys(ANIME_DATABASE).length,
        anime_list: ANIME_DATABASE
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK',
        message: 'AnimeWorld API is running',
        total_anime_in_database: Object.keys(ANIME_DATABASE).length,
        sources: Object.keys(SOURCES),
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 AnimeWorld API running on port ${PORT}`);
    console.log(`📊 Database loaded: ${Object.keys(ANIME_DATABASE).length} anime`);
    console.log('🌐 Sources: AnimeWorld, Backup');
    console.log('📖 Docs: http://localhost:3000/docs');
    console.log('🗃️ Database: http://localhost:3000/api/database');
    console.log('🔧 Debug: http://localhost:3000/api/debug/178025/1');
    console.log('🎌 Test URLs:');
    console.log('   - Gachiakuta: http://localhost:3000/api/anime/178025/1/1');
    console.log('   - One Piece: http://localhost:3000/api/anime/21/1/1');
    console.log('   - Naruto: http://localhost:3000/api/anime/20/1/1');
    console.log('   - Bleach: http://localhost:3000/api/anime/104/1/1');
});

module.exports = app;
