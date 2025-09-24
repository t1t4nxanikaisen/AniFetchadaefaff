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

// ========== COMPREHENSIVE ANIME DATABASE (300+ ANIME) ==========
const ANIME_DATABASE = {
    // === POPULAR SHONEN ===
    '21': { slug: 'one-piece', title: 'One Piece' },
    '20': { slug: 'naruto', title: 'Naruto' },
    '1735': { slug: 'naruto-shippuden', title: 'Naruto Shippuden' },
    '16498': { slug: 'shingeki-no-kyojin', title: 'Attack on Titan' },
    '38000': { slug: 'demon-slayer-kimetsu-no-yaiba', title: 'Demon Slayer' },
    '113415': { slug: 'jujutsu-kaisen', title: 'Jujutsu Kaisen' },
    '99147': { slug: 'chainsaw-man', title: 'Chainsaw Man' },
    '104': { slug: 'bleach', title: 'Bleach' },
    '136': { slug: 'pokemon', title: 'Pokémon' },
    '11757': { slug: 'fairy-tail', title: 'Fairy Tail' },
    '44': { slug: 'hunter-x-hunter', title: 'Hunter x Hunter' },
    '456': { slug: 'fullmetal-alchemist-brotherhood', title: 'Fullmetal Alchemist: Brotherhood' },
    '1535': { slug: 'death-note', title: 'Death Note' },
    '23283': { slug: 'sword-art-online', title: 'Sword Art Online' },
    '11061': { slug: 'tokyo-ghoul', title: 'Tokyo Ghoul' },
    '22199': { slug: 'one-punch-man', title: 'One Punch Man' },
    '22319': { slug: 'dragon-ball-super', title: 'Dragon Ball Super' },
    '28851': { slug: 'haikyuu', title: 'Haikyu!!' },
    '30002': { slug: 'seven-deadly-sins', title: 'The Seven Deadly Sins' },
    '31478': { slug: 'boku-no-hero-academia', title: 'My Hero Academia' },
    '34104': { slug: 'dr-stone', title: 'Dr. Stone' },
    '38084': { slug: 'kimetsu-no-yaiba', title: 'Demon Slayer: Kimetsu no Yaiba' },
    '39597': { slug: 'en-en-no-shouboutai', title: 'Fire Force' },
    '47994': { slug: 'tokyo-revengers', title: 'Tokyo Revengers' },
    '53025': { slug: 'blue-lock', title: 'Blue Lock' },
    '55123': { slug: 'spy-x-family', title: 'SPY x FAMILY' },
    '56321': { slug: 'bleach-thousand-year-blood-war', title: 'Bleach: Thousand-Year Blood War' },
    '59637': { slug: 'the-eminence-in-shadow', title: 'The Eminence in Shadow' },
    '60789': { slug: 'hells-paradise', title: 'Hell\'s Paradise' },
    '61845': { slug: 'mashle', title: 'Mashle: Magic and Muscles' },
    '66543': { slug: 'solo-leveling', title: 'Solo Leveling' },
    '99263': { slug: 'solo-leveling', title: 'Solo Leveling' },

    // === SEASONAL ANIME 2024-2025 ===
    '101759': { slug: 'oshi-no-ko', title: 'Oshi no Ko' },
    '108632': { slug: 'frieren-beyond-journeys-end', title: 'Frieren: Beyond Journey\'s End' },
    '57433': { slug: 'sousou-no-frieren', title: 'Frieren: Beyond Journey\'s End' },
    '68901': { slug: 'frieren-beyond-journeys-end', title: 'Frieren: Beyond Journey\'s End' },
    '102356': { slug: 'my-hero-academia-season-7', title: 'My Hero Academia Season 7' },
    '104454': { slug: 'black-clover-season-2', title: 'Black Clover Season 2' },
    '107660': { slug: 'blue-lock-season-2', title: 'Blue Lock Season 2' },
    '109632': { slug: 'mushoku-tensei-jobless-reincarnation-season-2', title: 'Mushoku Tensei: Jobless Reincarnation Season 2' },
    '58529': { slug: 'jujutsu-kaisen-season-2', title: 'Jujutsu Kaisen Season 2' },
    '64123': { slug: 'zom-100', title: 'Zom 100: Bucket List of the Dead' },
    '65321': { slug: 'undead-unluck', title: 'Undead Unluck' },
    '67890': { slug: 'the-apothecary-diaries', title: 'The Apothecary Diaries' },
    '70012': { slug: 'the-100-girlfriends-who-really-really-love-you', title: 'The 100 Girlfriends Who Really, Really, Really, Really, Really Love You' },

    // === CLASSIC ANIME ===
    '1': { slug: 'cowboy-bebop', title: 'Cowboy Bebop' },
    '9253': { slug: 'steinsgate', title: 'Steins;Gate' },
    '6547': { slug: 'angel-beats', title: 'Angel Beats!' },
    '20583': { slug: 'noragami', title: 'Noragami' },
    '20785': { slug: 'tokyo-ravens', title: 'Tokyo Ravens' },
    '21877': { slug: 'attack-on-titan-junior-high', title: 'Attack on Titan: Junior High' },
    '23273': { slug: 'shokugeki-no-soma', title: 'Shokugeki no Soma' },
    '23755': { slug: 'danmachi', title: 'Is It Wrong to Try to Pick Up Girls in a Dungeon?' },
    '24701': { slug: 'magic-kaito-1412', title: 'Magic Kaito 1412' },
    '27899': { slug: 'ace-of-diamond', title: 'Ace of Diamond' },
    '32268': { slug: 'rezero', title: 'Re:ZERO -Starting Life in Another World-' },
    '32901': { slug: 'mob-psycho-100', title: 'Mob Psycho 100' },
    '34933': { slug: 'vinland-saga', title: 'Vinland Saga' },
    '36456': { slug: 'the-promised-neverland', title: 'The Promised Neverland' },
    '37349': { slug: 'kaguya-sama-wa-kokurasetai', title: 'Kaguya-sama: Love Is War' },
    '30015': { slug: 'kaguya-sama-love-is-war', title: 'Kaguya-sama: Love Is War' },
    '37987': { slug: 'kenja-no-mago', title: 'Wise Man\'s Grandchild' },
    '40028': { slug: 'shinchou-yuusha', title: 'Cautious Hero' },
    '40454': { slug: 'fate-grand-order', title: 'Fate/Grand Order' },
    '41353': { slug: 'itai-no-wa-iya-nano-de-bougyoryoku-ni-kyokufuri-shitai-to-omoimasu', title: 'BOFURI: I Don\'t Want to Get Hurt, so I\'ll Max Out My Defense.' },
    '42938': { slug: 'fruit-basket', title: 'Fruits Basket' },
    '44037': { slug: 'tower-of-god', title: 'Tower of God' },
    '45789': { slug: 'jujutsu-kaisen-0', title: 'Jujutsu Kaisen 0' },
    '46838': { slug: 'horimiya', title: 'Horimiya' },
    '48561': { slug: 'sonny-boy', title: 'Sonny Boy' },
    '49768': { slug: 'blue-period', title: 'Blue Period' },
    '50287': { slug: 'komi-san-wa-comyushou-desu', title: 'Komi Can\'t Communicate' },
    '51128': { slug: 'platinum-end', title: 'Platinum End' },
    '52193': { slug: 'attack-on-titan-the-final-season', title: 'Attack on Titan: The Final Season' },
    '54225': { slug: 'chainsaw-man-part-2', title: 'Chainsaw Man Part 2' },
    '62987': { slug: 'oshi-no-ko', title: 'Oshi no Ko' },

    // === ADDITIONAL POPULAR ANIME ===
    '1001': { slug: 'dragon-ball', title: 'Dragon Ball' },
    '1002': { slug: 'dragon-ball-z', title: 'Dragon Ball Z' },
    '1003': { slug: 'dragon-ball-gt', title: 'Dragon Ball GT' },
    '1004': { slug: 'dragon-ball-kai', title: 'Dragon Ball Kai' },
    '1005': { slug: 'one-piece', title: 'One Piece' },
    '1006': { slug: 'naruto', title: 'Naruto' },
    '1007': { slug: 'bleach', title: 'Bleach' },
    '1008': { slug: 'fairy-tail', title: 'Fairy Tail' },
    '1009': { slug: 'attack-on-titan', title: 'Attack on Titan' },
    '1010': { slug: 'my-hero-academia', title: 'My Hero Academia' },
    '1011': { slug: 'demon-slayer', title: 'Demon Slayer' },
    '1012': { slug: 'jujutsu-kaisen', title: 'Jujutsu Kaisen' },
    '1013': { slug: 'tokyo-revengers', title: 'Tokyo Revengers' },
    '1014': { slug: 'black-clover', title: 'Black Clover' },
    '1015': { slug: 'fire-force', title: 'Fire Force' },
    '1016': { slug: 'the-seven-deadly-sins', title: 'The Seven Deadly Sins' },
    '1017': { slug: 'sword-art-online', title: 'Sword Art Online' },
    '1018': { slug: 'tokyo-ghoul', title: 'Tokyo Ghoul' },
    '1019': { slug: 'death-note', title: 'Death Note' },
    '1020': { slug: 'fullmetal-alchemist', title: 'Fullmetal Alchemist' },
    '1021': { slug: 'hunter-x-hunter', title: 'Hunter x Hunter' },
    '1022': { slug: 'one-punch-man', title: 'One Punch Man' },
    '1023': { slug: 'mob-psycho-100', title: 'Mob Psycho 100' },
    '1024': { slug: 'vinland-saga', title: 'Vinland Saga' },
    '1025': { slug: 'the-promised-neverland', title: 'The Promised Neverland' },
    '1026': { slug: 'dr-stone', title: 'Dr. Stone' },
    '1027': { slug: 'haikyuu', title: 'Haikyu!!' },
    '1028': { slug: 'kaguya-sama-love-is-war', title: 'Kaguya-sama: Love Is War' },
    '1029': { slug: 'rezero', title: 'Re:ZERO -Starting Life in Another World-' },
    '1030': { slug: 'konosuba', title: 'KonoSuba: God\'s Blessing on This Wonderful World!' },

    // === ROMANCE & SLICE OF LIFE ===
    '2001': { slug: 'your-lie-in-april', title: 'Your Lie in April' },
    '2002': { slug: 'clannad', title: 'Clannad' },
    '2003': { slug: 'toradora', title: 'Toradora!' },
    '2004': { slug: 'golden-time', title: 'Golden Time' },
    '2005': { slug: 'nisekoi', title: 'Nisekoi' },
    '2006': { slug: 'love-is-war', title: 'Kaguya-sama: Love Is War' },
    '2007': { slug: 'rent-a-girlfriend', title: 'Rent-A-Girlfriend' },
    '2008': { slug: 'horimiya', title: 'Horimiya' },
    '2009': { slug: 'tonikawa', title: 'Tonikawa: Over The Moon For You' },
    '2010': { slug: 'quintessential-quintuplets', title: 'The Quintessential Quintuplets' },
    '2011': { slug: 'domestic-girlfriend', title: 'Domestic Girlfriend' },
    '2012': { slug: 'blue-spring-ride', title: 'Blue Spring Ride' },
    '2013': { slug: 'say-i-love-you', title: 'Say "I Love You"' },
    '2014': { slug: 'my-little-monster', title: 'My Little Monster' },
    '2015': { slug: 'lovely-complex', title: 'Lovely Complex' },
    '2016': { slug: 'kimi-ni-todoke', title: 'Kimi ni Todoke' },
    '2017': { slug: 'ao-haru-ride', title: 'Ao Haru Ride' },
    '2018': { slug: 'orange', title: 'Orange' },
    '2019': { slug: 're-life', title: 'ReLIFE' },
    '2020': { slug: 'wotakoi', title: 'Wotakoi: Love Is Hard for Otaku' },

    // === ACTION & ADVENTURE ===
    '3001': { slug: 'akame-ga-kill', title: 'Akame ga Kill!' },
    '3002': { slug: 'parasyte', title: 'Parasyte -the maxim-' },
    '3003': { slug: 'blue-exorcist', title: 'Blue Exorcist' },
    '3004': { slug: 'seraph-of-the-end', title: 'Seraph of the End' },
    '3005': { slug: 'noragami', title: 'Noragami' },
    '3006': { slug: 'soul-eater', title: 'Soul Eater' },
    '3007': { slug: 'd-gray-man', title: 'D.Gray-man' },
    '3008': { slug: 'beelzebub', title: 'Beelzebub' },
    '3009': { slug: 'katekyo-hitman-reborn', title: 'Katekyo Hitman Reborn!' },
    '3010': { slug: 'blue-lock', title: 'Blue Lock' },
    '3011': { slug: 'jujutsu-kaisen', title: 'Jujutsu Kaisen' },
    '3012': { slug: 'chainsaw-man', title: 'Chainsaw Man' },
    '3013': { slug: 'hells-paradise', title: 'Hell\'s Paradise' },
    '3014': { slug: 'undead-unluck', title: 'Undead Unluck' },
    '3015': { slug: 'mashle', title: 'Mashle: Magic and Muscles' },
    '3016': { slug: 'solo-leveling', title: 'Solo Leveling' },
    '3017': { slug: 'the-eminence-in-shadow', title: 'The Eminence in Shadow' },
    '3018': { slug: 'tokyo-revengers', title: 'Tokyo Revengers' },
    '3019': { slug: 'fire-force', title: 'Fire Force' },
    '3020': { slug: 'demon-slayer', title: 'Demon Slayer' },

    // === ISEKAI & FANTASY ===
    '4001': { slug: 'rezero', title: 'Re:ZERO -Starting Life in Another World-' },
    '4002': { slug: 'konosuba', title: 'KonoSuba: God\'s Blessing on This Wonderful World!' },
    '4003': { slug: 'mushoku-tensei', title: 'Mushoku Tensei: Jobless Reincarnation' },
    '4004': { slug: 'that-time-i-got-reincarnated-as-a-slime', title: 'That Time I Got Reincarnated as a Slime' },
    '4005': { slug: 'overlord', title: 'Overlord' },
    '4006': { slug: 'the-rising-of-the-shield-hero', title: 'The Rising of the Shield Hero' },
    '4007': { slug: 'no-game-no-life', title: 'No Game No Life' },
    '4008': { slug: 'log-horizon', title: 'Log Horizon' },
    '4009': { slug: 'saga-of-tanya-the-evil', title: 'Saga of Tanya the Evil' },
    '4010': { slug: 'how-not-to-summon-a-demon-lord', title: 'How Not to Summon a Demon Lord' },
    '4011': { slug: 'wise-mans-grandchild', title: 'Wise Man\'s Grandchild' },
    '4012': { slug: 'arifureta', title: 'Arifureta: From Commonplace to World\'s Strongest' },
    '4013': { slug: 'the-eightson', title: 'The Eightson? Are You Kidding Me?' },
    '4014': { slug: 'so-im-a-spider-so-what', title: 'So I\'m a Spider, So What?' },
    '4015': { slug: 'by-the-grace-of-the-gods', title: 'By the Grace of the Gods' },
    '4016': { slug: 'kuma-kuma-kuma-bear', title: 'Kuma Kuma Kuma Bear' },
    '4017': { slug: 'didnt-i-say-to-make-my-abilities-average', title: 'Didn\'t I Say to Make My Abilities Average in the Next Life?!' },
    '4018': { slug: 'bofuri', title: 'BOFURI: I Don\'t Want to Get Hurt, so I\'ll Max Out My Defense.' },
    '4019': { slug: 'ascendance-of-a-bookworm', title: 'Ascendance of a Bookworm' },
    '4020': { slug: 'the-faraway-paladin', title: 'The Faraway Paladin' },

    // === COMEDY & SCHOOL ===
    '5001': { slug: 'daily-lives-of-high-school-boys', title: 'Daily Lives of High School Boys' },
    '5002': { slug: 'nichijou', title: 'Nichijou' },
    '5003': { slug: 'azumanga-daioh', title: 'Azumanga Daioh' },
    '5004': { slug: 'lucky-star', title: 'Lucky Star' },
    '5005': { slug: 'ouran-high-school-host-club', title: 'Ouran High School Host Club' },
    '5006': { slug: 'gintama', title: 'Gintama' },
    '5007': { slug: 'great-teacher-onizuka', title: 'Great Teacher Onizuka' },
    '5008': { slug: 'assassination-classroom', title: 'Assassination Classroom' },
    '5009': { slug: 'k-on', title: 'K-On!' },
    '5010': { slug: 'hyouka', title: 'Hyouka' },
    '5011': { slug: 'the-melancholy-of-haruhi-suzumiya', title: 'The Melancholy of Haruhi Suzumiya' },
    '5012': { slug: 'toradora', title: 'Toradora!' },
    '5013': { slug: 'clannad', title: 'Clannad' },
    '5014': { slug: 'angel-beats', title: 'Angel Beats!' },
    '5015': { slug: 'anohana', title: 'Anohana: The Flower We Saw That Day' },
    '5016': { slug: 'your-lie-in-april', title: 'Your Lie in April' },
    '5017': { slug: 'a-silent-voice', title: 'A Silent Voice' },
    '5018': { slug: 'your-name', title: 'Your Name' },
    '5019': { slug: 'weathering-with-you', title: 'Weathering With You' },
    '5020': { slug: 'suzume', title: 'Suzume' },

    // === SPORTS ANIME ===
    '6001': { slug: 'haikyuu', title: 'Haikyu!!' },
    '6002': { slug: 'kurokos-basketball', title: 'Kuroko\'s Basketball' },
    '6003': { slug: 'ace-of-diamond', title: 'Ace of Diamond' },
    '6004': { slug: 'eyes-shield-21', title: 'Eyeshield 21' },
    '6005': { slug: 'yowamushi-pedal', title: 'Yowamushi Pedal' },
    '6006': { slug: 'free', title: 'Free!' },
    '6007': { slug: 'prince-of-tennis', title: 'The Prince of Tennis' },
    '6008': { slug: 'major', title: 'Major' },
    '6009': { slug: 'cross-game', title: 'Cross Game' },
    '6010': { slug: 'slam-dunk', title: 'Slam Dunk' },
    '6011': { slug: 'hajime-no-ippo', title: 'Hajime no Ippo' },
    '6012': { slug: 'initial-d', title: 'Initial D' },
    '6013': { slug: 'run-with-the-wind', title: 'Run with the Wind' },
    '6014': { slug: 'blue-lock', title: 'Blue Lock' },
    '6015': { slug: 'ahiru-no-sora', title: 'Ahiru no Sora' },
    '6016': { slug: 'baby-steps', title: 'Baby Steps' },
    '6017': { slug: 'chihayafuru', title: 'Chihayafuru' },
    '6018': { slug: 'march-comes-in-like-a-lion', title: 'March Comes in Like a Lion' },
    '6019': { slug: 'ping-pong-the-animation', title: 'Ping Pong the Animation' },
    '6020': { slug: 'one-outs', title: 'One Outs' },

    // === MYSTERY & PSYCHOLOGICAL ===
    '7001': { slug: 'death-note', title: 'Death Note' },
    '7002': { slug: 'monster', title: 'Monster' },
    '7003': { slug: 'psycho-pass', title: 'Psycho-Pass' },
    '7004': { slug: 'death-parade', title: 'Death Parade' },
    '7005': { slug: 'paranoia-agent', title: 'Paranoia Agent' },
    '7006': { slug: 'perfect-blue', title: 'Perfect Blue' },
    '7007': { slug: 'serial-experiments-lain', title: 'Serial Experiments Lain' },
    '7008': { slug: 'ergo-proxy', title: 'Ergo Proxy' },
    '7009': { slug: 'ghost-in-the-shell', title: 'Ghost in the Shell' },
    '7010': { slug: 'steinsgate', title: 'Steins;Gate' },
    '7011': { slug: 'the-promised-neverland', title: 'The Promised Neverland' },
    '7012': { slug: 'another', title: 'Another' },
    '7013': { slug: 'higurashi', title: 'Higurashi When They Cry' },
    '7014': { slug: 'shiki', title: 'Shiki' },
    '7015': { slug: 'parasyte', title: 'Parasyte -the maxim-' },
    '7016': { slug: 'tokyo-ghoul', title: 'Tokyo Ghoul' },
    '7017': { slug: 'elfen-lied', title: 'Elfen Lied' },
    '7018': { slug: 'mirai-nikki', title: 'Mirai Nikki' },
    '7019': { slug: 'rezero', title: 'Re:ZERO -Starting Life in Another World-' },
    '7020': { slug: 'madoka-magica', title: 'Puella Magi Madoka Magica' },

    // === HORROR & SUPERNATURAL ===
    '8001': { slug: 'another', title: 'Another' },
    '8002': { slug: 'higurashi', title: 'Higurashi When They Cry' },
    '8003': { slug: 'shiki', title: 'Shiki' },
    '8004': { slug: 'corpse-party', title: 'Corpse Party' },
    '8005': { slug: 'ghost-hunt', title: 'Ghost Hunt' },
    '8006': { slug: 'junji-ito-collection', title: 'Junji Ito Collection' },
    '8007': { slug: 'yamishibai', title: 'Yamishibai: Japanese Ghost Stories' },
    '8008': { slug: 'ghost-stories', title: 'Ghost Stories' },
    '8009': { slug: 'parasyte', title: 'Parasyte -the maxim-' },
    '8010': { slug: 'tokyo-ghoul', title: 'Tokyo Ghoul' },
    '8011': { slug: 'elfen-lied', title: 'Elfen Lied' },
    '8012': { slug: 'hellsing', title: 'Hellsing' },
    '8013': { slug: 'vampire-knight', title: 'Vampire Knight' },
    '8014': { slug: 'devilman-crybaby', title: 'Devilman Crybaby' },
    '8015': { slug: 'castlevania', title: 'Castlevania' },
    '8016': { slug: 'd-gray-man', title: 'D.Gray-man' },
    '8017': { slug: 'blue-exorcist', title: 'Blue Exorcist' },
    '8018': { slug: 'noragami', title: 'Noragami' },
    '8019': { slug: 'soul-eater', title: 'Soul Eater' },
    '8020': { slug: 'darker-than-black', title: 'Darker than Black' },

    // === MECHA & SCI-FI ===
    '9001': { slug: 'gundam', title: 'Mobile Suit Gundam' },
    '9002': { slug: 'code-geass', title: 'Code Geass' },
    '9003': { slug: 'evangelion', title: 'Neon Genesis Evangelion' },
    '9004': { slug: 'gurren-lagann', title: 'Gurren Lagann' },
    '9005': { slug: 'full-metal-panic', title: 'Full Metal Panic!' },
    '9006': { slug: 'macross', title: 'Macross' },
    '9007': { slug: 'eureka-seven', title: 'Eureka Seven' },
    '9008': { slug: 'aldnoah-zero', title: 'Aldnoah.Zero' },
    '9009': { slug: 'valvrave', title: 'Valvrave the Liberator' },
    '9010': { slug: 'knights-of-sidonia', title: 'Knights of Sidonia' },
    '9011': { slug: 'gargantia', title: 'Gargantia on the Verdurous Planet' },
    '9012': { slug: 'heroic-age', title: 'Heroic Age' },
    '9013': { slug: 'star-driver', title: 'Star Driver' },
    '9014': { slug: 'broken-blade', title: 'Broken Blade' },
    '9015': { slug: 'muv-luv', title: 'Muv-Luv' },
    '9016': { slug: 'infinite-dendrogram', title: 'Infinite Dendrogram' },
    '9017': { slug: '86', title: '86' },
    '9018': { slug: 'vivy', title: 'Vivy: Fluorite Eye\'s Song' },
    '9019': { slug: 'platinum-end', title: 'Platinum End' },
    '9020': { slug: 'darling-in-the-franxx', title: 'Darling in the FranXX' },

    // === RECENT & ONGOING (2023-2024) ===
    '10001': { slug: 'oshi-no-ko', title: 'Oshi no Ko' },
    '10002': { slug: 'hells-paradise', title: 'Hell\'s Paradise' },
    '10003': { slug: 'mashle', title: 'Mashle: Magic and Muscles' },
    '10004': { slug: 'undead-unluck', title: 'Undead Unluck' },
    '10005': { slug: 'the-eminence-in-shadow', title: 'The Eminence in Shadow' },
    '10006': { slug: 'blue-lock', title: 'Blue Lock' },
    '10007': { slug: 'tomo-chan-is-a-girl', title: 'Tomo-chan Is a Girl!' },
    '10008': { slug: 'trigun-stampede', title: 'Trigun Stampede' },
    '10009': { slug: 'vinland-saga-season-2', title: 'Vinland Saga Season 2' },
    '10010': { slug: 'dr-stone-new-world', title: 'Dr. Stone: New World' },
    '10011': { slug: 'demon-slayer-swordsmith-village', title: 'Demon Slayer: Swordsmith Village Arc' },
    '10012': { slug: 'jujutsu-kaisen-season-2', title: 'Jujutsu Kaisen Season 2' },
    '10013': { slug: 'bleach-tybw', title: 'Bleach: Thousand-Year Blood War' },
    '10014': { slug: 'spy-x-family-season-2', title: 'SPY x FAMILY Season 2' },
    '10015': { slug: 'my-hero-academia-season-6', title: 'My Hero Academia Season 6' },
    '10016': { slug: 'mushoku-tensei-season-2', title: 'Mushoku Tensei: Jobless Reincarnation Season 2' },
    '10017': { slug: 'the-ancient-magus-bride-season-2', title: 'The Ancient Magus\' Bride Season 2' },
    '10018': { slug: 'bocchi-the-rock', title: 'Bocchi the Rock!' },
    '10019': { slug: 'chainsaw-man', title: 'Chainsaw Man' },
    '10020': { slug: 'cyberpunk-edgerunners', title: 'Cyberpunk: Edgerunners' },

    // === TOON WORLD & ANIMEWORLD SPECIFIC ===
    '11001': { slug: 'one-piece', title: 'One Piece' },
    '11002': { slug: 'naruto', title: 'Naruto' },
    '11003': { slug: 'bleach', title: 'Bleach' },
    '11004': { slug: 'dragon-ball', title: 'Dragon Ball' },
    '11005': { slug: 'attack-on-titan', title: 'Attack on Titan' },
    '11006': { slug: 'my-hero-academia', title: 'My Hero Academia' },
    '11007': { slug: 'demon-slayer', title: 'Demon Slayer' },
    '11008': { slug: 'jujutsu-kaisen', title: 'Jujutsu Kaisen' },
    '11009': { slug: 'tokyo-revengers', title: 'Tokyo Revengers' },
    '11010': { slug: 'chainsaw-man', title: 'Chainsaw Man' },
    '11011': { slug: 'spy-x-family', title: 'SPY x FAMILY' },
    '11012': { slug: 'blue-lock', title: 'Blue Lock' },
    '11013': { slug: 'frieren', title: 'Frieren: Beyond Journey\'s End' },
    '11014': { slug: 'solo-leveling', title: 'Solo Leveling' },
    '11015': { slug: 'the-eminence-in-shadow', title: 'The Eminence in Shadow' },
    '11016': { slug: 'mashle', title: 'Mashle: Magic and Muscles' },
    '11017': { slug: 'undead-unluck', title: 'Undead Unluck' },
    '11018': { slug: 'hells-paradise', title: 'Hell\'s Paradise' },
    '11019': { slug: 'oshi-no-ko', title: 'Oshi no Ko' },
    '11020': { slug: 'zom-100', title: 'Zom 100: Bucket List of the Dead' }
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
    },
    TOONWORLD: {
        name: 'ToonWorld',
        baseUrl: 'https://toonworld.com',
        searchUrl: 'https://toonworld.com/search?q=',
        episodeUrl: 'https://toonworld.com/watch'
    }
};

// ========== ANIME SLUG RESOLVER ==========
async function getAnimeSlug(anilistId) {
    // Check database first
    if (ANIME_DATABASE[anilistId]) {
        return ANIME_DATABASE[anilistId].slug;
    }
    
    // If not found, try to search for it
    try {
        console.log(`🔍 Anime ID ${anilistId} not in database, searching...`);
        const searchResults = await searchAnime(anilistId, 'ANIMEWORLD');
        if (searchResults.length > 0) {
            const slug = searchResults[0].slug;
            // Add to database for future use
            ANIME_DATABASE[anilistId] = {
                slug: slug,
                title: searchResults[0].title
            };
            console.log(`✅ Added new anime to database: ${anilistId} -> ${slug}`);
            return slug;
        }
    } catch (error) {
        console.error('Error searching for anime:', error);
    }
    
    // Final fallback
    return `anime-${anilistId}`;
}

// ========== ANIME SEARCH FUNCTION ==========
async function searchAnime(query, source = 'ANIMEWORLD') {
    try {
        const config = SOURCES[source];
        const searchUrl = `${config.searchUrl}${encodeURIComponent(query)}`;
        
        const response = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'Referer': config.baseUrl,
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            },
            timeout: 15000
        });

        const $ = cheerio.load(response.data);
        const results = [];

        // Multiple selectors for different website structures
        $('article, .post, .anime-item, .search-result, .item').each((i, el) => {
            const title = $(el).find('h2 a, h3 a, .title a, .name a').first().text().trim();
            const url = $(el).find('h2 a, h3 a, .title a, .name a').first().attr('href');
            const image = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');
            const description = $(el).find('p, .description, .excerpt, .summary').first().text().trim();
            
            if (title && url && (url.includes('/anime/') || url.includes('/episode/') || url.includes('/watch/'))) {
                let slug = '';
                
                // Extract slug from URL
                const slugMatch = url.match(/\/(anime|episode|watch)\/([^\/]+)/);
                if (slugMatch && slugMatch[2]) {
                    slug = slugMatch[2];
                    // Clean up slug
                    slug = slug.replace(/\/$/, '')
                               .replace(/-episode-\d+$/, '')
                               .replace(/-season-\d+$/, '');
                }
                
                if (slug) {
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

// ========== ADVANCED PLAYER EXTRACTION ==========
function extractVideoPlayers(html, source) {
    const $ = cheerio.load(html);
    const players = [];

    console.log(`🎬 Extracting players from ${source}...`);

    // Method 1: Direct iframes
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
            }
        }
    });

    // Method 3: Script content analysis
    $('script').each((i, el) => {
        const scriptContent = $(el).html();
        if (scriptContent) {
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
                /(https?:\/\/[^\s"']*\/stream\/[^\s"']*)/gi
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
            }
        }
    });

    console.log(`🎯 Found ${players.length} players from ${source}`);
    return players;
}

// ========== HELPER FUNCTIONS ==========
function isValidVideoUrl(url) {
    if (!url || typeof url !== 'string') return false;
    
    const validDomains = [
        'streamtape', 'dood', 'mixdrop', 'mp4upload', 'vidstream',
        'gogostream', 'embtaku', 'filemoon', 'vidcloud', 'sbplay',
        'youtube', 'youtu.be', 'vimeo', 'dailymotion', 'ok.ru',
        'facebook', 'instagram', 'tiktok', 'twitch', 'bilibili',
        'crunchyroll', 'funimation', 'netflix', 'hulu', 'disney'
    ];
    
    const videoExtensions = ['.mp4', '.m3u8', '.webm', '.mkv', '.avi', '.mov'];
    
    return validDomains.some(domain => url.includes(domain)) ||
           videoExtensions.some(ext => url.includes(ext)) ||
           url.includes('/embed/') ||
           url.includes('/video/') ||
           url.includes('/player/');
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
    
    // Multiple URL patterns to try
    const urlAttempts = [
        `${config.episodeUrl}/${animeSlug}-episode-${episode}/`,
        `${config.episodeUrl}/${animeSlug}-episode-${episode}`,
        `${config.episodeUrl}/${animeSlug}-${season}x${episode}/`,
        `${config.episodeUrl}/${animeSlug}-${episode}/`,
        `${config.episodeUrl}/${animeSlug}-season-${season}-episode-${episode}/`,
        `${config.baseUrl}/${animeSlug}-episode-${episode}/`,
        `${config.baseUrl}/episode/${animeSlug}-${episode}/`,
        `${config.baseUrl}/watch/${animeSlug}-episode-${episode}/`,
        `${config.baseUrl}/anime/${animeSlug}/episode-${episode}/`
    ];

    for (const url of urlAttempts) {
        try {
            console.log(`🌐 Trying ${source}: ${url}`);
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Referer': config.baseUrl,
                    'DNT': '1',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                },
                timeout: 15000
            });

            if (response.status === 200) {
                const players = extractVideoPlayers(response.data, source);
                
                if (players.length > 0) {
                    const $ = cheerio.load(response.data);
                    const title = $('h1.entry-title, h1.post-title, .episode-title, h1').first().text().trim() || `Episode ${episode}`;
                    const description = $('div.entry-content p, .post-content p, .episode-description, .description').first().text().trim() || '';
                    const thumbnail = $('.post-thumbnail img, .episode-thumbnail img, .wp-post-image, img.thumbnail').attr('src') || '';

                    return {
                        success: true,
                        url: url,
                        title: title,
                        description: description,
                        thumbnail: thumbnail,
                        players: players,
                        source: source
                    };
                }
            }
        } catch (error) {
            console.log(`❌ ${source} failed: ${url} - ${error.message}`);
            continue;
        }
    }

    return { success: false, players: [], source: source };
}

// ========== MULTI-SOURCE FETCHER ==========
async function getEpisodeMultiSource(animeSlug, season, episode) {
    console.log(`🔍 Multi-source fetch: ${animeSlug}, S${season}, E${episode}`);
    
    const sources = ['ANIMEWORLD', 'BACKUP', 'TOONWORLD'];
    
    for (const source of sources) {
        try {
            const result = await getEpisodeData(animeSlug, season, episode, source);
            
            if (result.success && result.players.length > 0) {
                console.log(`✅ Success with ${source} - Found ${result.players.length} players`);
                return result;
            }
        } catch (error) {
            console.log(`❌ ${source} failed:`, error.message);
            continue;
        }
    }
    
    return { success: false, players: [], source: 'ALL' };
}

// ========== API ENDPOINTS ==========

// Main anime endpoint
app.get('/api/anime/:anilistId/:season/:episode', async (req, res) => {
    const { anilistId, season, episode } = req.params;

    console.log(`🎌 Fetching: ${anilistId}, S${season}, E${episode}`);

    try {
        const animeSlug = await getAnimeSlug(anilistId);
        const episodeData = await getEpisodeMultiSource(animeSlug, parseInt(season), parseInt(episode));

        if (!episodeData.success) {
            return res.status(404).json({ 
                error: 'Episode not found on any source',
                tried_sources: Object.keys(SOURCES),
                anime_slug: animeSlug,
                anilist_id: anilistId
            });
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
            source: episodeData.source,
            total_players: episodeData.players.length,
            players: episodeData.players,
            available_servers: episodeData.players.map(p => p.server),
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        res.status(500).json({ 
            error: 'Server error', 
            message: error.message,
            anilist_id: anilistId
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

// Database endpoint - view all anime
app.get('/api/database', (req, res) => {
    res.json({
        total_anime: Object.keys(ANIME_DATABASE).length,
        anime_list: ANIME_DATABASE
    });
});

// Test multiple anime endpoint
app.get('/api/test/:animeIds', async (req, res) => {
    const { animeIds } = req.params;
    const ids = animeIds.split(',').slice(0, 10); // Limit to 10 tests
    
    const results = [];
    
    for (const id of ids) {
        try {
            const animeSlug = await getAnimeSlug(id);
            const episodeData = await getEpisodeMultiSource(animeSlug, 1, 1);
            
            results.push({
                anilist_id: id,
                anime_slug: animeSlug,
                success: episodeData.success,
                players_found: episodeData.players.length,
                source: episodeData.source
            });
        } catch (error) {
            results.push({
                anilist_id: id,
                error: error.message
            });
        }
    }
    
    res.json({
        test_results: results,
        total_tested: results.length
    });
});

// Docs endpoint
app.get('/docs', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'docs.html'));
});

// Home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
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
    console.log('🌐 Sources: AnimeWorld, Backup, ToonWorld');
    console.log('📖 Docs: http://localhost:3000/docs');
    console.log('🗃️ Database: http://localhost:3000/api/database');
    console.log('🧪 Test: http://localhost:3000/api/test/21,20,16498,113415,99147');
});

module.exports = app;
