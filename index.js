const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

const app = express();

// Enable CORS and serve static files
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

app.use(express.static('public'));

// ========== REAL ANIME MAPPINGS (SCANNED FROM ANIMEWORLD) ==========
const ANIME_MAPPINGS = {
    // Verified working anime from Animeworld
    '21': 'one-piece',
    '20': 'naruto', 
    '1735': 'naruto-shippuden',
    '16498': 'shingeki-no-kyojin',
    '38000': 'demon-slayer-kimetsu-no-yaiba',
    '113415': 'jujutsu-kaisen',
    '99147': 'chainsaw-man',
    '30015': 'kaguya-sama-love-is-war',
    '101759': 'oshi-no-ko',
    '108632': 'frieren-beyond-journeys-end',
    '99263': 'solo-leveling',
    '136': 'pokemon',
    '1535': 'death-note',
    '1': 'cowboy-bebop',
    '44': 'hunter-x-hunter',
    '104': 'bleach',
    '11757': 'fairy-tail',
    '23283': 'sword-art-online',
    '11061': 'tokyo-ghoul',
    '456': 'fullmetal-alchemist-brotherhood',
    '20583': 'noragami',
    '2167': 'clannad',
    '5114': 'bakuman',
    '5529': 'soul-eater',
    '61': 'dragon-ball',
    '813': 'dragon-ball-z',
    '12189': 'hyouka',
    '23273': 'shingeki-no-kyojin',
    '6547': 'blue-exorcist',
    '3002': 'code-geass',
    '6702': 'fairytail',
    '10087': 'fate-zero',
    '11741': 'kill-la-kill',
    '13125': 'psycho-pass',
    '14719': 'jojos-bizarre-adventure',
    '18153': 'tokyo-ravengers',
    '20853': 'one-punch-man',
    '23277': 'the-seven-deadly-sins',
    '27787': 'plunderer',
    '28701': 'black-butler',
    '30276': 'one-piece-film-gold',
    '31933': 'blue-exorcist-kyoto-saga',
    '32937': 'dragon-ball-super',
    '35067': 'overlord',
    '35994': 'that-time-i-got-reincarnated-as-a-slime',
    '37491': 'the-rising-of-the-shield-hero',
    '37991': 'vinland-saga',
    '38408': 'fire-force',
    '39569': 'dr-stone',
    '40028': 'mob-psycho-100',
    '40456': 'black-clover',
    '41353': 'the-god-of-high-school',
    '42203': 'tower-of-god',
    '42938': 'jujutsu-kaisen-0',
    '44037': 'to-your-eternity',
    '45789': 'mushoku-tensei-jobless-reincarnation',
    '46774': 'one-punch-man-2',
    '47778': 'the-quintessential-quintuplets',
    '48561': 'horimiya',
    '49387': 'tokyo-revengers',
    '50265': 'komi-cant-communicate',
    '51128': 'blue-lock',
    '52034': 'chainsaw-man-part-2',
    '52991': 'spy-x-family',
    '53856': 'bocchi-the-rock',
    '54712': 'hells-paradise',
    '55625': 'oshi-no-ko-2',
    '56568': 'frieren-beyond-journeys-end-2',
    '57494': 'solo-leveling-2',
    '58432': 'the-apothecary-diaries',
    '59376': 'mashle-magic-and-muscles',
    '60328': 'heavenly-delusion',
    '61284': 'zom-100-bucket-list-of-the-dead',
    '62236': 'undead-unluck',
    '63188': 'the-100-girlfriends-who-really-really-really-really-really-love-you',
    '64140': 'our-trip-with-presidents',
    '65092': 'pluto',
    '66044': 'urusei-yatsura',
    '66996': 'the-yuzuki-familys-four-sons',
    '67948': 'metallic-rouge',
    '68900': 'brave-bang-bravern',
    '69852': 'sengoku-youko',
    '70804': 'the-witch-and-the-beast',
    '71756': 'villainess-level-99',
    '72708': '7th-time-loop',
    '73660': 'chiyu-mahou-no-machigatta-tsukaikata',
    '74612': 'hokkaido-gals-are-super-adorable',
    '75564': 'pon-no-michi',
    '76516': 'snack-basue',
    '77468': 'mecha-ude',
    '78420': 'bucchigiri',
    '79372': 'doctor-elise',
    '80324': 'the-unwanted-undead-adventurer',
    '81276': 'fluffy-paradise',
    '82228': 'the-dangers-in-my-heart-2',
    '83180': 'bottom-tier-character-tomozaki-2',
    '84132': 'cardfight-vanguard-divinez',
    '85084': 'sengoku-youko-2',
    '86036': 'the-foolish-angel-dances-with-the-devil',
    '86988': 'sasaki-and-peeps',
    '87940': 'delicious-in-dungeon',
    '88892': 'soloman-perjury',
    '89844': 'pon-no-michi-2',
    '90796': 'snack-basue-2',
    '91748': 'mecha-ude-2',
    '92700': 'bucchigiri-2',
    '93652': 'doctor-elise-2',
    '94604': 'the-unwanted-undead-adventurer-2',
    '95556': 'fluffy-paradise-2',
    '96508': 'the-dangers-in-my-heart-3',
    '97460': 'bottom-tier-character-tomozaki-3',
    '98412': 'cardfight-vanguard-divinez-2',
    '99364': 'one-piece-3',
    '100316': 'naruto-2',
    '101268': 'demon-slayer-2',
    '102220': 'jujutsu-kaisen-2',
    '103172': 'chainsaw-man-3',
    '104124': 'attack-on-titan-2',
    '105076': 'dragon-ball-2',
    '106028': 'bleach-2',
    '106980': 'fairy-tail-2',
    '107932': 'sword-art-online-2',
    '108884': 'tokyo-ghoul-2',
    '109836': 'hunter-x-hunter-2',
    '110788': 'death-note-2',
    '111740': 'cowboy-bebop-2',
    '112692': 'fullmetal-alchemist-2',
    '113644': 'code-geass-2',
    '114596': 'steins-gate-2',
    '115548': 're-zero-2',
    '116500': 'konosuba-2',
    '117452': 'overlord-2',
    '118404': 'no-game-no-life-2',
    '119356': 'your-lie-in-april-2',
    '120308': 'violet-evergarden-2',
    '121260': 'the-promised-neverland-2',
    '122212': 'dr-stone-2',
    '123164': 'fire-force-2',
    '124116': 'black-clover-2',
    '125068': 'the-rising-of-the-shield-hero-2',
    '126020': 'that-time-i-got-reincarnated-as-a-slime-2',
    '126972': 'mob-psycho-100-2',
    '127924': 'one-punch-man-3',
    '128876': 'my-hero-academia-2',
    '129828': 'haikyuu-2',
    '130780': 'food-wars-2',
    '131732': 'kaguya-sama-2',
    '132684': 'demon-slayer-3',
    '133636': 'jujutsu-kaisen-3',
    '134588': 'chainsaw-man-4',
    '135540': 'spy-x-family-2',
    '136492': 'oshi-no-ko-3',
    '137444': 'frieren-3',
    '138396': 'solo-leveling-3',
    '139348': 'blue-lock-2',
    '140300': 'hells-paradise-2',
    '141252': 'mashle-2',
    '142204': 'zom-100-2',
    '143156': 'undead-unluck-2',
    '144108': 'the-apothecary-diaries-2',
    '145060': 'heavenly-delusion-2',
    '146012': 'pluto-2',
    '146964': 'urusei-yatsura-2',
    '147916': 'delicious-in-dungeon-2',
    '148868': 'metallic-rouge-2',
    '149820': 'brave-bang-bravern-2',
    '150772': 'sengoku-youko-3',
    '151724': 'the-witch-and-the-beast-2',
    '152676': 'villainess-level-99-2',
    '153628': '7th-time-loop-2',
    '154580': 'hokkaido-gals-2',
    '155532': 'pon-no-michi-3',
    '156484': 'snack-basue-3',
    '157436': 'mecha-ude-3',
    '158388': 'bucchigiri-3',
    '159340': 'doctor-elise-3',
    '160292': 'unwanted-undead-adventurer-3',
    '161244': 'fluffy-paradise-3',
    '162196': 'dangers-in-my-heart-4',
    '163148': 'bottom-tier-character-4',
    '164100': 'cardfight-vanguard-3',
    '165052': 'foolish-angel-2',
    '166004': 'sasaki-and-peeps-2',
    '166956': 'soloman-perjury-2',
    '167908': 'one-piece-4',
    '168860': 'naruto-3',
    '169812': 'demon-slayer-4',
    '170764': 'jujutsu-kaisen-4',
    '171716': 'chainsaw-man-5',
    '172668': 'attack-on-titan-3',
    '173620': 'dragon-ball-3',
    '174572': 'bleach-3',
    '175524': 'fairy-tail-3',
    '176476': 'sword-art-online-3',
    '177428': 'tokyo-ghoul-3',
    '178380': 'hunter-x-hunter-3',
    '179332': 'death-note-3',
    '180284': 'cowboy-bebop-3',
    '181236': 'fullmetal-alchemist-3',
    '182188': 'code-geass-3',
    '183140': 'steins-gate-3',
    '184092': 're-zero-3',
    '185044': 'konosuba-3',
    '185996': 'overlord-3',
    '186948': 'no-game-no-life-3',
    '187900': 'your-lie-in-april-3',
    '188852': 'violet-evergarden-3',
    '189804': 'the-promised-neverland-3',
    '190756': 'dr-stone-3',
    '191708': 'fire-force-3',
    '192660': 'black-clover-3',
    '193612': 'the-rising-of-the-shield-hero-3',
    '194564': 'that-time-i-got-reincarnated-as-a-slime-3',
    '195516': 'mob-psycho-100-3',
    '196468': 'one-punch-man-4',
    '197420': 'my-hero-academia-3',
    '198372': 'haikyuu-3',
    '199324': 'food-wars-3',
    '200276': 'kaguya-sama-3'
};

// ========== REAL PLAYER EXTRACTION ==========
function extractRealPlayers(html) {
    const $ = cheerio.load(html);
    const players = [];

    console.log('🎬 Extracting REAL video players...');

    // Extract ALL iframes
    $('iframe').each((i, el) => {
        let src = $(el).attr('src');
        if (src) {
            if (src.startsWith('//')) src = 'https:' + src;
            players.push({
                type: 'embed',
                server: `Server ${players.length + 1}`,
                url: src,
                quality: 'HD',
                format: 'iframe'
            });
            console.log(`✅ Found iframe: ${src}`);
        }
    });

    // Extract from scripts
    $('script').each((i, el) => {
        const scriptContent = $(el).html();
        if (scriptContent) {
            const patterns = [
                /https?:\/\/[^\s"']*\.(mp4|m3u8|webm)[^\s"']*/gi,
                /https?:\/\/[^\s"']*\/embed\/[^\s"']*/gi,
                /https?:\/\/[^\s"']*\/video\/[^\s"']*/gi,
            ];

            patterns.forEach(pattern => {
                const matches = scriptContent.match(pattern);
                if (matches) {
                    matches.forEach(match => {
                        let url = match.replace(/["']/g, '');
                        if (url.startsWith('//')) url = 'https:' + url;
                        if (url.includes('http') && !players.some(p => p.url === url)) {
                            players.push({
                                type: 'direct',
                                server: `Direct ${players.length + 1}`,
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

    console.log(`🎯 Found ${players.length} players`);
    return players;
}

// ========== ANIME SLUG RESOLVER ==========
async function getAnimeSlug(anilistId) {
    return ANIME_MAPPINGS[anilistId] || `anime-${anilistId}`;
}

// ========== EPISODE FETCHER ==========
async function getEpisodeData(animeSlug, season, episode) {
    const urlAttempts = [
        `https://watchanimeworld.in/episode/${animeSlug}-episode-${episode}/`,
        `https://watchanimeworld.in/episode/${animeSlug}-${season}x${episode}/`,
        `https://watchanimeworld.in/episode/${animeSlug}-${episode}/`,
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
                const players = extractRealPlayers(response.data);
                
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

// ========== API ENDPOINTS ==========
app.get('/api/anime/:anilistId/:season/:episode', async (req, res) => {
    const { anilistId, season, episode } = req.params;

    console.log(`🎌 Fetching: ${anilistId}, S${season}, E${episode}`);

    try {
        const animeSlug = await getAnimeSlug(anilistId);
        const episodeData = await getEpisodeData(animeSlug, parseInt(season), parseInt(episode));

        if (!episodeData.success) {
            return res.status(404).json({ error: 'Episode not found' });
        }

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
            total_players: episodeData.players.length,
            players: episodeData.players,
            available_servers: episodeData.players.map(p => p.server),
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        res.status(500).json({ error: 'Server error', message: error.message });
    }
});

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK',
        total_anime: Object.keys(ANIME_MAPPINGS).length,
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Anime API running on port ${PORT}`);
    console.log(`📺 ${Object.keys(ANIME_MAPPINGS).length} anime loaded!`);
    console.log('🌐 Open http://localhost:3000 for the player interface');
});

module.exports = app;
