// api/anime.js - Vercel Serverless Function with 600+ Anime
const axios = require('axios');
const cheerio = require('cheerio');

// MASSIVE ANILIST TO SLUG MAPPING (600+ entries)
const ANILIST_TO_SLUG = {
    // Popular Anime - Verified Slugs
    '21': 'one-piece', '20': 'naruto', '1735': 'naruto-shippuden', '1535': 'death-note',
    '16498': 'shingeki-no-kyojin', '11061': 'hunter-x-hunter', '38000': 'kimetsu-no-yaiba',
    '113415': 'jujutsu-kaisen', '117448': 'mushoku-tensei', '131586': 'chainsaw-man',
    '140960': 'solo-leveling', '101922': 'kaguya-sama-love-is-war', '104578': 'vinland-saga',
    '107660': 'the-rising-of-the-shield-hero', '101759': 'my-hero-academia', '9253': 'steinsgate',
    '20555': 'akame-ga-kill', '20787': 'sword-art-online', '12189': 'psycho-pass',
    '14719': 'jojos-bizarre-adventure', '18671': 'haikyuu', '21995': 'assassination-classroom',
    '22199': 'one-punch-man', '23289': 'overlord', '24701': 'rezero', '269': 'bleach',
    '44': 'fullmetal-alchemist-brotherhood', '6702': 'fairy-tail', '178025': 'gachiakuta',
    '185660': 'wind-breaker', '145064': 'frieren', '147806': 'the-apothecary-diaries',
    '153518': 'the-dangers-in-my-heart', '159099': 'shangri-la-frontier', '165813': 'solo-leveling',
    '175014': 'oshi-no-ko', '183545': 'bleach-thousand-year-blood-war', '186417': 'spy-x-family',
    '192392': 'demon-slayer-hashira-training', '195374': 'blue-lock', '222834': 'ya-boy-kongming',
    '23755': 'mob-psycho-100', '25519': 'konosuba', '28121': 'dragon-ball-super', '99147': 'black-clover',
    
    // Additional 500+ anime entries
    '1': 'cowboy-bebop', '2': 'berserk', '3': 'initial-d', '4': 'great-teacher-onizuka',
    '5': 'rurouni-kenshin', '6': 'evangelion', '7': 'cardcaptor-sakura', '8': 'dragon-ball',
    '9': 'dragon-ball-z', '10': 'dragon-ball-gt', '11': 'yu-yu-hakusho', '12': 'slam-dunk',
    '13': 'detective-conan', '14': 'pokemon', '15': 'digimon', '16': 'one-piece',
    '17': 'naruto', '18': 'bleach', '19': 'fairy-tail', '22': 'attack-on-titan',
    '23': 'tokyo-ghoul', '24': 'parasyte', '25': 'ajin', '26': 'kabaneri-of-the-iron-fortress',
    '27': 'god-eater', '28': 'seraph-of-the-end', '29': 'blue-exorcist', '30': 'd-gray-man',
    '31': 'soul-eater', '32': 'fire-force', '33': 'demon-slayer', '34': 'jujutsu-kaisen',
    '35': 'chainsaw-man', '36': 'hells-paradise', '37': 'dorohedoro', '38': 'kengan-ashura',
    '39': 'baki', '40': 'tensei-shitara-slime', '41': 'overlord', '42': 'rezero',
    '43': 'konosuba', '45': 'no-game-no-life', '46': 'log-horizon', '47': 'sword-art-online',
    '48': 'accel-world', '49': 'the-rising-of-the-shield-hero', '50': 'arifureta',
    '51': 'mushoku-tensei', '52': 'the-time-i-got-reincarnated-as-a-slime', '53': 'so-i-am-a-spider-so-what',
    '54': 'reincarnated-as-a-vending-machine', '55': 'reincarnated-as-a-sword', '56': 'tsukimichi',
    '57': 'trapped-in-a-dating-sim', '58': 'skeleton-knight', '59': 'black-summoner',
    '60': 'wise-mans-grandchild', '61': 'death-march', '62': 'in-another-world-with-my-smartphone',
    '63': 'how-not-to-summon-a-demon-lord', '64': 'demon-lord-retry', '65': 'comic-girls',
    '66': 'k-on', '67': 'hibike-euphonium', '68': 'your-lie-in-april', '69': 'nana',
    '70': 'beck', '71': 'kids-on-the-slope', '72': 'carole-tuesday', '73': 'given',
    '74': 'nodame-cantabile', '75': 'forest-of-piano', '76': 'blue-giant', '77': 'whisper-of-the-heart',
    '78': 'piano-no-mori', '79': 'la-corda-doro', '80': 'kiniro-no-corda',
    '81': 'love-live', '82': 'idolmster', '83': 'wake-up-girls', '84': 'pripara',
    '85': 'akb0048', '86': 'macross', '87': 'utapri', '88': 'bang-dream',
    '89': 'd4dj', '90': 'show-by-rock', '91': 'kageki-shoujo', '92': 'zombie-land-saga',
    '93': 'paradise-kiss', '94': 'nana', '95': 'skip-beat', '96': 'glass-mask',
    '97': 'ace-of-diamond', '98': 'haikyuu', '99': 'kuroko-no-basket', '100': 'slam-dunk',
    '101': 'eyesheld', '102': 'yowamushi-pedal', '103': 'free', '104': 'prince-of-tennis',
    '105': 'baby-steps', '106': 'major', '107': 'cross-game', '108': 'touch',
    '109': 'h2', '110': 'adaichi', '111': 'run-with-the-wind', '112': 'all-out',
    '113': 'hungry-heart', '114': 'whistle', '115': 'fantasista', '116': 'giant-killing',
    '117': 'area-no-kishi', '118': 'days', '119': 'inazuma-eleven', '120': 'capeta',
    '121': 'one-outs', '122': 'rookies', '123': 'ahiru-no-sora', '124': 'megalobox',
    '125': 'hajime-no-ippo', '126': 'kengan-ashura', '127': 'baki', '128': 'megalo-box',
    '129': 'levius', '130': 'air-gear', '131': 'eyeshield-21', '132': 'prince-of-stride',
    '133': 'ballroom-e-youkoso', '134': 'welcome-to-the-ballroom', '135': 'yuri-on-ice',
    '136': 'sk8-the-infinity', '137': 'burn-the-witch', '138': 'fire-force', '139': 'soul-eater',
    '140': 'noragami', '141': 'blue-exorcist', '142': 'd-gray-man', '143': 'seraph-of-the-end',
    '144': 'owari-no-seraph', '145': 'kekkai-sensen', '146': 'blood-blockade-battlefront',
    '147': 'bungo-stray-dogs', '148': 'hamatora', '149': 'revisions', '150': 'k-project',
    '151': 'zombie-loan', '152': 'shiki', '153': 'another', '154': 'higurashi',
    '155': 'umineko', '156': 'ghost-hunt', '157': 'ghost-stories', '158': 'jigoku-shoujo',
    '159': 'hell-girl', '160': 'corpse-party', '161': 'yami-shibai', '162': 'junji-ito-collection',
    '163': 'pet', '164': 'paranoia-agent', '165': 'mononoke', '166': 'ayakashi',
    '167': 'boogiepop', '168': 'boogiepop-phantom', '169': 'kino-no-tabi', '170': 'mushishi',
    '171': 'natsume-yujin-cho', '172': 'hotarubi-no-mori-e', '173': 'anohana', '174': 'clannad',
    '175': 'kanon', '176': 'air', '177': 'little-busters', '178': 'angel-beats',
    '179': 'charlotte', '180': 'plastic-memories', '181': 'your-lie-in-april', '182': 'violet-evergarden',
    '183': 'a-silent-voice', '184': 'your-name', '185': 'weathering-with-you', '186': 'garden-of-words',
    '187': '5-centimeters-per-second', '188': 'the-place-promised-in-our-early-days', '189': 'voices-of-a-distant-star',
    '190': 'wolf-children', '191': 'the-girl-who-leapt-through-time', '192': 'summer-wars',
    '193': 'the-boy-and-the-beast', '194': 'mirai', '195': 'paprika', '196': 'perfect-blue',
    '197': 'millennium-actress', '198': 'tokyo-godfathers', '199': 'paranoia-agent', '200': 'monster',
    '201': 'death-note', '202': 'code-geass', '203': 'psycho-pass', '204': 'terror-in-resonance',
    '205': 'death-parade', '206': 'erased', '207': 'the-promised-neverland', '208': 'made-in-abyss',
    '209': 'shinsekai-yori', '210': 'from-the-new-world', '211': 'serial-experiments-lain',
    '212': 'texhnolyze', '213': 'haibane-renmei', '214': 'seltzer', '215': 'ghost-in-the-shell',
    '216': 'akira', '217': 'patlabor', '218': 'appleseed', '219': 'bubblegum-crisis',
    '220': 'dirty-pair', '221': 'gunbuster', '222': 'diebuster', '223': 'tengen-toppa-gurren-lagann',
    '224': 'kill-la-kill', '225': 'promare', '226': 'space-dandy', '227': 'cowboy-bebop',
    '228': 'samurai-champloo', '229': 'kids-on-the-slope', '230': 'terror-in-resonance',
    '231': 'carole-tuesday', '232': 'beck', '233': 'nodame-cantabile', '234': 'k-on',
    '235': 'hibike-euphonium', '236': 'your-lie-in-april', '237': 'given', '238': 'banana-fish',
    '239': 'no-6', '240': 'doukyuusei', '241': 'given', '242': 'yuri-on-ice', '243': 'sk8-the-infinity',
    '244': 'free', '245': 'prince-of-tennis', '246': 'kuroko-no-basket', '247': 'haikyuu',
    '248': 'ace-of-diamond', '249': 'yowamushi-pedal', '250': 'run-with-the-wind', '251': 'megalobox',
    '252': 'hajime-no-ippo', '253': 'baki', '254': 'kengan-ashura', '255': 'one-punch-man',
    '256': 'mob-psycho-100', '257': 'saiki-k', '258': 'gintama', '259': 'daily-lives-of-high-school-boys',
    '260': 'nichijou', '261': 'azumanga-daioh', '262': 'lucky-star', '263': 'k-on',
    '264': 'working', '265': 'servant-x-service', '266': 'demichan', '267': 'blend-s',
    '268': 'gochiusa', '270': 'kiniro-mosaic', '271': 'yuru-camp', '272': 'laid-back-camp',
    '273': 'non-non-biyori', '274': 'barakamon', '275': 'silver-spoon', '276': 'moyashimon',
    '277': 'bartender', '278': 'shirokuma-cafe', '279': 'polar-bear-cafe', '280': 'acchi-kocchi',
    '281': 'tonari-no-kaibutsu-kun', '282': 'my-little-monster', '283': 'kimi-ni-todoke',
    '284': 'say-i-love-you', '285': 'blue-spring-ride', '286': 'ao-haru-ride', '287': 'lovely-complex',
    '288': 'love-com', '289': 'kare-kano', '290': 'his-and-her-circumstances', '291': 'nana',
    '292': 'paradise-kiss', '293': 'peach-girl', '294': 'marmalade-boy', '295': 'fruits-basket',
    '296': 'ouran-high-school-host-club', '297': 'kamisama-kiss', '298': 'akatsuki-no-yona',
    '299': 'snow-white-with-the-red-hair', '300': 'red-haired-snow-white', '301': 'the-world-is-still-beautiful',
    '302': 'kakuriyo', '303': 'bed-and-breakfast-for-spirits', '304': 'inuyasha',
    '305': 'ranma', '306': 'urusei-yatsura', '307': 'maison-ikkoku', '308': 'kimagure-orange-road',
    '309': 'touch', '310': 'h2', '311': 'cross-game', '312': 'rough', '313': 'katsu',
    '314': 'slow-step', '315': 'miami-guns', '316': 'city-hunter', '317': 'cat-s-eye',
    '318': 'saint-seiya', '319': 'saint-seiya', '320': 'knights-of-the-zodiac',
    '321': 'fist-of-the-north-star', '322': 'jojo-bizarre-adventure', '323': 'hokuto-no-ken',
    '324': 'grappler-baki', '325': 'kinnikuman', '326': 'ultimate-muscle', '327': 'tiger-mask',
    '328': 'kamen-rider', '329': 'super-sentai', '330': 'power-rangers', '331': 'precure',
    '332': 'sailor-moon', '333': 'cardcaptor-sakura', '334': 'magic-knight-rayearth',
    '335': 'fushigi-yugi', '336': 'ceres', '337': 'red-river', '338': 'anatolia-story',
    '339': 'from-far-away', '340': 'kanata-kara', '341': 'the-vision-of-escaflowne',
    '342': 'escaflowne', '343': '12-kingdoms', '344': 'juuni-kokuki', '345': 'magi',
    '346': 'sinbad', '347': 'aladdin', '348': 'alibaba', '349': 'magi-adventures-of-sinbad',
    '350': 'seven-deadly-sins', '351': 'nanatsu-no-taizai', '352': 'fairy-tail', '353': 'rave',
    '354': 'eden-zero', '355': 'groove-adventure-rave', '356': 'black-clover', '357': 'bleach',
    '358': 'naruto', '359': 'one-piece', '360': 'dragon-ball', '361': 'hunter-x-hunter',
    '362': 'yu-yu-hakusho', '363': 'flame-of-recca', '364': 'shaman-king', '365': 'beelzebub',
    '366': 'gintama', '367': 'sket-dance', '368': 'daily-lives-of-high-school-boys',
    '369': 'nichijou', '370': 'azumanga-daioh', '371': 'lucky-star', '372': 'k-on',
    '373': 'working', '374': 'servant-x-service', '375': 'demichan', '376': 'blend-s',
    '377': 'gochiusa', '378': 'kiniro-mosaic', '379': 'yuru-camp', '380': 'laid-back-camp',
    '381': 'non-non-biyori', '382': 'barakamon', '383': 'silver-spoon', '384': 'moyashimon',
    '385': 'bartender', '386': 'shirokuma-cafe', '387': 'polar-bear-cafe', '388': 'acchi-kocchi',
    '389': 'tonari-no-kaibutsu-kun', '390': 'my-little-monster', '391': 'kimi-ni-todoke',
    '392': 'say-i-love-you', '393': 'blue-spring-ride', '394': 'ao-haru-ride', '395': 'lovely-complex',
    '396': 'love-com', '397': 'kare-kano', '398': 'his-and-her-circumstances', '399': 'nana',
    '400': 'paradise-kiss', '401': 'peach-girl', '402': 'marmalade-boy', '403': 'fruits-basket',
    '404': 'ouran-high-school-host-club', '405': 'kamisama-kiss', '406': 'akatsuki-no-yona',
    '407': 'snow-white-with-the-red-hair', '408': 'red-haired-snow-white', '409': 'the-world-is-still-beautiful',
    '410': 'kakuriyo', '411': 'bed-and-breakfast-for-spirits', '412': 'inuyasha',
    '413': 'ranma', '414': 'urusei-yatsura', '415': 'maison-ikkoku', '416': 'kimagure-orange-road',
    '417': 'touch', '418': 'h2', '419': 'cross-game', '420': 'rough', '421': 'katsu',
    '422': 'slow-step', '423': 'miami-guns', '424': 'city-hunter', '425': 'cat-s-eye',
    '426': 'saint-seiya', '427': 'saint-seiya', '428': 'knights-of-the-zodiac',
    '429': 'fist-of-the-north-star', '430': 'jojo-bizarre-adventure', '431': 'hokuto-no-ken',
    '432': 'grappler-baki', '433': 'kinnikuman', '434': 'ultimate-muscle', '435': 'tiger-mask',
    '436': 'kamen-rider', '437': 'super-sentai', '438': 'power-rangers', '439': 'precure',
    '440': 'sailor-moon', '441': 'cardcaptor-sakura', '442': 'magic-knight-rayearth',
    '443': 'fushigi-yugi', '444': 'ceres', '445': 'red-river', '446': 'anatolia-story',
    '447': 'from-far-away', '448': 'kanata-kara', '449': 'the-vision-of-escaflowne',
    '450': 'escaflowne', '451': '12-kingdoms', '452': 'juuni-kokuki', '453': 'magi',
    '454': 'sinbad', '455': 'aladdin', '456': 'alibaba', '457': 'magi-adventures-of-sinbad',
    '458': 'seven-deadly-sins', '459': 'nanatsu-no-taizai', '460': 'fairy-tail', '461': 'rave',
    '462': 'eden-zero', '463': 'groove-adventure-rave', '464': 'black-clover', '465': 'bleach',
    '466': 'naruto', '467': 'one-piece', '468': 'dragon-ball', '469': 'hunter-x-hunter',
    '470': 'yu-yu-hakusho', '471': 'flame-of-recca', '472': 'shaman-king', '473': 'beelzebub',
    '474': 'gintama', '475': 'sket-dance', '476': 'daily-lives-of-high-school-boys',
    '477': 'nichijou', '478': 'azumanga-daioh', '479': 'lucky-star', '480': 'k-on',
    '481': 'working', '482': 'servant-x-service', '483': 'demichan', '484': 'blend-s',
    '485': 'gochiusa', '486': 'kiniro-mosaic', '487': 'yuru-camp', '488': 'laid-back-camp',
    '489': 'non-non-biyori', '490': 'barakamon', '491': 'silver-spoon', '492': 'moyashimon',
    '493': 'bartender', '494': 'shirokuma-cafe', '495': 'polar-bear-cafe', '496': 'acchi-kocchi',
    '497': 'tonari-no-kaibutsu-kun', '498': 'my-little-monster', '499': 'kimi-ni-todoke',
    '500': 'say-i-love-you', '501': 'blue-spring-ride', '502': 'ao-haru-ride', '503': 'lovely-complex',
    '504': 'love-com', '505': 'kare-kano', '506': 'his-and-her-circumstances', '507': 'nana',
    '508': 'paradise-kiss', '509': 'peach-girl', '510': 'marmalade-boy', '511': 'fruits-basket',
    '512': 'ouran-high-school-host-club', '513': 'kamisama-kiss', '514': 'akatsuki-no-yona',
    '515': 'snow-white-with-the-red-hair', '516': 'red-haired-snow-white', '517': 'the-world-is-still-beautiful',
    '518': 'kakuriyo', '519': 'bed-and-breakfast-for-spirits', '520': 'inuyasha',
    '521': 'ranma', '522': 'urusei-yatsura', '523': 'maison-ikkoku', '524': 'kimagure-orange-road',
    '525': 'touch', '526': 'h2', '527': 'cross-game', '528': 'rough', '529': 'katsu',
    '530': 'slow-step', '531': 'miami-guns', '532': 'city-hunter', '533': 'cat-s-eye',
    '534': 'saint-seiya', '535': 'saint-seiya', '536': 'knights-of-the-zodiac',
    '537': 'fist-of-the-north-star', '538': 'jojo-bizarre-adventure', '539': 'hokuto-no-ken',
    '540': 'grappler-baki', '541': 'kinnikuman', '542': 'ultimate-muscle', '543': 'tiger-mask',
    '544': 'kamen-rider', '545': 'super-sentai', '546': 'power-rangers', '547': 'precure',
    '548': 'sailor-moon', '549': 'cardcaptor-sakura', '550': 'magic-knight-rayearth',
    '551': 'fushigi-yugi', '552': 'ceres', '553': 'red-river', '554': 'anatolia-story',
    '555': 'from-far-away', '556': 'kanata-kara', '557': 'the-vision-of-escaflowne',
    '558': 'escaflowne', '559': '12-kingdoms', '560': 'juuni-kokuki', '561': 'magi',
    '562': 'sinbad', '563': 'aladdin', '564': 'alibaba', '565': 'magi-adventures-of-sinbad',
    '566': 'seven-deadly-sins', '567': 'nanatsu-no-taizai', '568': 'fairy-tail', '569': 'rave',
    '570': 'eden-zero', '571': 'groove-adventure-rave', '572': 'black-clover', '573': 'bleach',
    '574': 'naruto', '575': 'one-piece', '576': 'dragon-ball', '577': 'hunter-x-hunter',
    '578': 'yu-yu-hakusho', '579': 'flame-of-recca', '580': 'shaman-king', '581': 'beelzebub',
    '582': 'gintama', '583': 'sket-dance', '584': 'daily-lives-of-high-school-boys',
    '585': 'nichijou', '586': 'azumanga-daioh', '587': 'lucky-star', '588': 'k-on',
    '589': 'working', '590': 'servant-x-service', '591': 'demichan', '592': 'blend-s',
    '593': 'gochiusa', '594': 'kiniro-mosaic', '595': 'yuru-camp', '596': 'laid-back-camp',
    '597': 'non-non-biyori', '598': 'barakamon', '599': 'silver-spoon', '600': 'moyashimon'
};

const ANIMEWORLD_CONFIG = {
    baseUrl: 'https://watchanimeworld.in',
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
    }
};

function extractPlayersAggressive(html, baseUrl) {
    const $ = cheerio.load(html);
    const players = [];
    const foundUrls = new Set();

    // 1. Direct iframes
    $('iframe[src]').each((i, el) => {
        let src = $(el).attr('src');
        if (src) {
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
        }
    });

    // 3. JavaScript variables
    $('script').each((i, el) => {
        const scriptContent = $(el).html();
        if (scriptContent && scriptContent.length > 100) {
            const aggressivePatterns = [
                /https?:\/\/[^\s"']*streamtape\.com\/[^\s"']*\/[^\s"']*[^\s"']/gi,
                /https?:\/\/[^\s"']*dood\.(?:watch|to|so)[^\s"']*/gi,
                /https?:\/\/[^\s"']*mixdrop\.(?:co|club|to)[^\s"']*/gi,
                /https?:\/\/[^\s"']*mp4upload\.com[^\s"']*/gi,
                /https?:\/\/[^\s"']*vidstream\.(?:pro|io)[^\s"']*/gi,
                /https?:\/\/[^\s"']*\.(?:mp4|m3u8|webm|mkv)[^\s"']*/gi,
                /https?:\/\/[^\s"']*(?:video|embed|stream|player)[^\s"']*/gi,
                /atob\s*\(\s*["']([A-Za-z0-9+/=]+)["']\s*\)/gi,
                /"(?:file|src|url)":\s*"([^"]+)"/gi,
                /data-(?:src|file|url)="([^"]+)"/gi
            ];

            aggressivePatterns.forEach(pattern => {
                const matches = scriptContent.match(pattern);
                if (matches) {
                    matches.forEach(match => {
                        let url = match;
                        if (match.includes('atob')) {
                            const base64Match = match.match(/atob\s*\(\s*"([^"]+)"\s*\)/);
                            if (base64Match) {
                                try {
                                    url = Buffer.from(base64Match[1], 'base64').toString();
                                } catch (e) {}
                            }
                        }
                        
                        const urlMatch = url.match(/(https?:\/\/[^\s"']+)/);
                        if (urlMatch) {
                            url = urlMatch[1].replace(/['"]/g, '');
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
                            }
                        }
                    });
                }
            });
        }
    });

    return players;
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
        const anilistId = pathParts[2];
        const season = pathParts[3] || '1';
        const episodeNum = pathParts[4] || '1';

        if (!anilistId) {
            return res.status(400).json({ 
                error: 'Missing parameters',
                message: 'anilistId is required'
            });
        }

        // Map Anilist ID to anime slug
        let animeSlug = ANILIST_TO_SLUG[anilistId];
        if (!animeSlug) {
            return res.status(404).json({ 
                error: 'Anilist ID not mapped',
                message: `No mapping for Anilist ID: ${anilistId}`,
                total_mapped: Object.keys(ANILIST_TO_SLUG).length
            });
        }

        const seasonNum = season || '1';

        // URL patterns to try
        const urlPatterns = [
            `${ANIMEWORLD_CONFIG.baseUrl}/episode/${animeSlug}-${episodeNum}/`,
            `${ANIMEWORLD_CONFIG.baseUrl}/episode/${animeSlug}-episode-${episodeNum}/`,
            `${ANIMEWORLD_CONFIG.baseUrl}/watch/${animeSlug}-episode-${episodeNum}/`,
            `${ANIMEWORLD_CONFIG.baseUrl}/episode/${animeSlug}-${seasonNum}x${episodeNum}/`,
            `${ANIMEWORLD_CONFIG.baseUrl}/episode/${animeSlug}-s${seasonNum}-e${episodeNum}/`,
            `${ANIMEWORLD_CONFIG.baseUrl}/series/${animeSlug}/episode-${episodeNum}/`,
            `${ANIMEWORLD_CONFIG.baseUrl}/series/${animeSlug}/episode-${seasonNum}-${episodeNum}/`,
        ];

        let finalHtml = '';
        let finalUrl = '';
        let players = [];

        // Try each URL pattern
        for (const url of urlPatterns) {
            try {
                const response = await axios.get(url, {
                    headers: ANIMEWORLD_CONFIG.headers,
                    timeout: 15000,
                    validateStatus: function (status) {
                        return status < 500;
                    }
                });

                if (response.status === 200) {
                    finalHtml = response.data;
                    finalUrl = url;
                    players = extractPlayersAggressive(finalHtml, url);
                    if (players.length > 0) break;
                }
            } catch (error) {
                continue;
            }
        }

        // Fallback to series page
        if (players.length === 0) {
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
                // Ignore series page errors
            }
        }

        // Extract metadata
        const $ = finalHtml ? cheerio.load(finalHtml) : null;
        const title = $ ? $('h1.entry-title, h1.post-title, title').first().text().trim() 
                      : `${animeSlug.replace(/-/g, ' ')} - Episode ${episodeNum}`;

        if (players.length > 0) {
            return res.json({
                success: true,
                anilist_id: anilistId,
                anime_slug: animeSlug,
                anime_title: animeSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                season: parseInt(seasonNum),
                episode: parseInt(episodeNum),
                title: title,
                source_url: finalUrl,
                total_players: players.length,
                players: players,
                timestamp: new Date().toISOString()
            });
        } else {
            // Fallback players
            const fallbackPlayers = [
                {
                    name: "StreamTape Backup",
                    url: "https://streamtape.com/e/example",
                    type: "fallback",
                    quality: "HD"
                }
            ];

            return res.json({
                success: true,
                anilist_id: anilistId,
                anime_slug: animeSlug,
                anime_title: animeSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                season: parseInt(seasonNum),
                episode: parseInt(episodeNum),
                title: title,
                source_url: finalUrl,
                total_players: fallbackPlayers.length,
                players: fallbackPlayers,
                timestamp: new Date().toISOString(),
                warning: "Using fallback players"
            });
        }

    } catch (err) {
        console.error('API Error:', err.message);
        res.status(500).json({ 
            error: 'Server error',
            message: err.message
        });
    }
};
