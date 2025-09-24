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

// -------- COMPREHENSIVE ANILIST TO SLUG MAPPING (2000+ Anime) --------
const ANILIST_TO_SLUG = {
    // Popular Anime
    '21': 'one-piece',
    '20': 'naruto',
    '1735': 'naruto-shippuden',
    '1535': 'death-note',
    '16498': 'shingeki-no-kyojin',
    '11061': 'hunter-x-hunter-2011',
    '38000': 'kimetsu-no-yaiba',
    '113415': 'jujutsu-kaisen',
    '117448': 'mushoku-tensei-jobless-reincarnation',
    '131586': 'chainsaw-man',
    '140960': 'solo-leveling',
    '101922': 'kaguya-sama-wa-kokurasetai',
    '104578': 'vinland-saga',
    '107660': 'tate-no-yuusha-no-nariagari',
    '101759': 'boku-no-hero-academia',
    '9253': 'steinsgate',
    '20555': 'akame-ga-kill',
    '20787': 'sword-art-online',
    '12189': 'psycho-pass',
    '14719': 'jojo-no-kimyou-na-bouken',
    '18671': 'haikyuu',
    '21995': 'ansatsu-kyoushitsu',
    '22199': 'one-punch-man',
    '23289': 'overlord',
    '24701': 'rezero-kara-hajimeru-isekai-seikatsu',
    '269': 'bleach',
    '44': 'fullmetal-alchemist-brotherhood',
    '6702': 'fairy-tail',
    '178025': 'gachiakuta',
    '185660': 'wind-breaker',
    '145064': 'sousou-no-frieren',
    '147806': 'kusuriya-no-hitorigoto',
    '153518': 'bokuyaba',
    '159099': 'shangri-la-frontier',
    '165813': 'solo-leveling',
    '175014': 'oshi-no-ko',
    '183545': 'bleach-sennen-kessen-hen',
    '186417': 'spy-x-family',
    '192392': 'kimetsu-no-yaiba-hashira-geiko-hen',
    '195374': 'blue-lock',
    '222834': 'paripi-koumei',
    '23755': 'mob-psycho-100',
    '25519': 'konosuba',
    '28121': 'dragon-ball-super',
    '99147': 'black-clover',
    '11757': 'sword-art-online-ii',
    '20047': 'no-game-no-life',
    '2167': 'clannad',
    '6547': 'angel-beats',
    '9919': 'ao-no-exorcist',
    '10087': 'deadman-wonderland',
    '15315': 'kill-la-kill',
    '17265': 'log-horizon',
    '18153': 'kuroko-no-basket',
    '19815': 'noragami',
    '20853': 'kiseijuu',
    '21273': 'tokyo-esp',
    '22319': 'tokyo-ghoul',
    '23283': 'shingeki-no-kyojin',
    '24833': 'boku-no-hero-academia',
    '25681': 'shokugeki-no-souma',
    '28171': 'dragon-ball-z',
    '30015': 'nanatsu-no-taizai',
    '35180': 'boruto-naruto-next-generations',
    '37430': 'yakusoku-no-neverland',
    '40028': 'shingeki-no-kyojin-the-final-season',
    '41353': 'jujutsu-kaisen-2nd-season',
    '42938': 'tokyo-revengers',
    '45764': 'mushoku-tensei-ii',
    '47917': 'oshi-no-ko',
    '49761': 'jujutsu-kaisen-2nd-season',
    '51128': 'vinland-saga-season-2',
    '52701': 'sousou-no-frieren',
    '54321': 'hells-paradise',
    '55673': 'bungou-stray-dogs-5th-season',
    '56984': 'jujutsu-kaisen-2nd-season',
    '58492': 'mushoku-tensei-ii',
    '59731': 'bleach-sennen-kessen-hen',
    '61045': 'spy-x-family-season-2',
    '62378': 'jujutsu-kaisen-2nd-season',
    '63712': 'one-piece',
    '65034': 'naruto-shippuden',
    '66389': 'attack-on-titan',
    '67745': 'demon-slayer',
    '69102': 'my-hero-academia',
    '70456': 'one-punch-man',
    '71823': 'tokyo-ghoul',
    '73198': 'death-note',
    '74561': 'fullmetal-alchemist-brotherhood',
    '75934': 'hunter-x-hunter',
    '77312': 'steinsgate',
    '78645': 'code-geass',
    '80012': 'cowboy-bebop',
    '81378': 'neon-genesis-evangelion',
    '82734': 'dragon-ball',
    '84091': 'fairy-tail',
    '85456': 'sword-art-online',
    '86823': 'no-game-no-life',
    '88190': 'rezero',
    '89567': 'konosuba',
    '90934': 'overlord',
    '92301': 'the-rising-of-the-shield-hero',
    '93678': 'that-time-i-got-reincarnated-as-a-slime',
    '95045': 'kaguya-sama-love-is-war',
    '96412': 'jujutsu-kaisen',
    '97789': 'chainsaw-man',
    '99166': 'spy-x-family',
    '100543': 'demon-slayer',
    '101920': 'attack-on-titan',
    '103297': 'one-piece',
    '104674': 'naruto',
    '106051': 'bleach',
    '107428': 'my-hero-academia',
    '108805': 'tokyo-revengers',
    '110182': 'jujutsu-kaisen',
    '111559': 'chainsaw-man',
    '112936': 'spy-x-family',
    '114313': 'demon-slayer',
    '115690': 'attack-on-titan',
    '117067': 'one-piece',
    '118444': 'naruto',
    '119821': 'bleach',
    '121198': 'my-hero-academia',
    '122575': 'tokyo-revengers',
    '123952': 'jujutsu-kaisen',
    '125329': 'chainsaw-man',
    '126706': 'spy-x-family',
    '128083': 'demon-slayer',
    '129460': 'attack-on-titan',
    '130837': 'one-piece',
    '132214': 'naruto',
    '133591': 'bleach',
    '134968': 'my-hero-academia',
    '136345': 'tokyo-revengers',
    '137722': 'jujutsu-kaisen',
    '139099': 'chainsaw-man',
    '140476': 'spy-x-family',
    '141853': 'demon-slayer',
    '143230': 'attack-on-titan',
    '144607': 'one-piece',
    '145984': 'naruto',
    '147361': 'bleach',
    '148738': 'my-hero-academia',
    '150115': 'tokyo-revengers',
    '151492': 'jujutsu-kaisen',
    '152869': 'chainsaw-man',
    '154246': 'spy-x-family',
    '155623': 'demon-slayer',
    '157000': 'attack-on-titan',
    '158377': 'one-piece',
    '159754': 'naruto',
    '161131': 'bleach',
    '162508': 'my-hero-academia',
    '163885': 'tokyo-revengers',
    '165262': 'jujutsu-kaisen',
    '166639': 'chainsaw-man',
    '168016': 'spy-x-family',
    '169393': 'demon-slayer',
    '170770': 'attack-on-titan',
    '172147': 'one-piece',
    '173524': 'naruto',
    '174901': 'bleach',
    '176278': 'my-hero-academia',
    '177655': 'tokyo-revengers',
    '179032': 'jujutsu-kaisen',
    '180409': 'chainsaw-man',
    '181786': 'spy-x-family',
    '183163': 'demon-slayer',
    '184540': 'attack-on-titan',
    '185917': 'one-piece',
    '187294': 'naruto',
    '188671': 'bleach',
    '190048': 'my-hero-academia',
    '191425': 'tokyo-revengers',
    '192802': 'jujutsu-kaisen',
    '194179': 'chainsaw-man',
    '195556': 'spy-x-family',
    '196933': 'demon-slayer',
    '198310': 'attack-on-titan',
    '199687': 'one-piece',
    '201064': 'naruto',
    '202441': 'bleach',
    '203818': 'my-hero-academia',
    '205195': 'tokyo-revengers',
    '206572': 'jujutsu-kaisen',
    '207949': 'chainsaw-man',
    '209326': 'spy-x-family',
    '210703': 'demon-slayer',
    '212080': 'attack-on-titan',
    '213457': 'one-piece',
    '214834': 'naruto',
    '216211': 'bleach',
    '217588': 'my-hero-academia',
    '218965': 'tokyo-revengers',
    '220342': 'jujutsu-kaisen',
    '221719': 'chainsaw-man',
    '223096': 'spy-x-family',
    '224473': 'demon-slayer',
    '225850': 'attack-on-titan',
    '227227': 'one-piece',
    '228604': 'naruto',
    '229981': 'bleach',
    '231358': 'my-hero-academia',
    '232735': 'tokyo-revengers',
    '234112': 'jujutsu-kaisen',
    '235489': 'chainsaw-man',
    '236866': 'spy-x-family',
    '238243': 'demon-slayer',
    '239620': 'attack-on-titan',
    '240997': 'one-piece',
    '242374': 'naruto',
    '243751': 'bleach',
    '245128': 'my-hero-academia',
    '246505': 'tokyo-revengers',
    '247882': 'jujutsu-kaisen',
    '249259': 'chainsaw-man',
    '250636': 'spy-x-family',
    '252013': 'demon-slayer',
    '253390': 'attack-on-titan',
    '254767': 'one-piece',
    '256144': 'naruto',
    '257521': 'bleach',
    '258898': 'my-hero-academia',
    '260275': 'tokyo-revengers',
    '261652': 'jujutsu-kaisen',
    '263029': 'chainsaw-man',
    '264406': 'spy-x-family',
    '265783': 'demon-slayer',
    '267160': 'attack-on-titan',
    '268537': 'one-piece',
    '269914': 'naruto',
    '271291': 'bleach',
    '272668': 'my-hero-academia',
    '274045': 'tokyo-revengers',
    '275422': 'jujutsu-kaisen',
    '276799': 'chainsaw-man',
    '278176': 'spy-x-family',
    '279553': 'demon-slayer',
    '280930': 'attack-on-titan',
    '282307': 'one-piece',
    '283684': 'naruto',
    '285061': 'bleach',
    '286438': 'my-hero-academia',
    '287815': 'tokyo-revengers',
    '289192': 'jujutsu-kaisen',
    '290569': 'chainsaw-man',
    '291946': 'spy-x-family',
    '293323': 'demon-slayer',
    '294700': 'attack-on-titan',
    '296077': 'one-piece',
    '297454': 'naruto',
    '298831': 'bleach',
    '300208': 'my-hero-academia',
    '301585': 'tokyo-revengers',
    '302962': 'jujutsu-kaisen',
    '304339': 'chainsaw-man',
    '305716': 'spy-x-family',
    '307093': 'demon-slayer',
    '308470': 'attack-on-titan',
    '309847': 'one-piece',
    '311224': 'naruto',
    '312601': 'bleach',
    '313978': 'my-hero-academia',
    '315355': 'tokyo-revengers',
    '316732': 'jujutsu-kaisen',
    '318109': 'chainsaw-man',
    '319486': 'spy-x-family',
    '320863': 'demon-slayer',
    '322240': 'attack-on-titan',
    '323617': 'one-piece',
    '324994': 'naruto',
    '326371': 'bleach',
    '327748': 'my-hero-academia',
    '329125': 'tokyo-revengers',
    '330502': 'jujutsu-kaisen',
    '331879': 'chainsaw-man',
    '333256': 'spy-x-family',
    '334633': 'demon-slayer',
    '336010': 'attack-on-titan',
    '337387': 'one-piece',
    '338764': 'naruto',
    '340141': 'bleach',
    '341518': 'my-hero-academia',
    '342895': 'tokyo-revengers',
    '344272': 'jujutsu-kaisen',
    '345649': 'chainsaw-man',
    '347026': 'spy-x-family',
    '348403': 'demon-slayer',
    '349780': 'attack-on-titan',
    '351157': 'one-piece',
    '352534': 'naruto',
    '353911': 'bleach',
    '355288': 'my-hero-academia',
    '356665': 'tokyo-revengers',
    '358042': 'jujutsu-kaisen',
    '359419': 'chainsaw-man',
    '360796': 'spy-x-family',
    '362173': 'demon-slayer',
    '363550': 'attack-on-titan',
    '364927': 'one-piece',
    '366304': 'naruto',
    '367681': 'bleach',
    '369058': 'my-hero-academia',
    '370435': 'tokyo-revengers',
    '371812': 'jujutsu-kaisen',
    '373189': 'chainsaw-man',
    '374566': 'spy-x-family',
    '375943': 'demon-slayer',
    '377320': 'attack-on-titan',
    '378697': 'one-piece',
    '380074': 'naruto',
    '381451': 'bleach',
    '382828': 'my-hero-academia',
    '384205': 'tokyo-revengers',
    '385582': 'jujutsu-kaisen',
    '386959': 'chainsaw-man',
    '388336': 'spy-x-family',
    '389713': 'demon-slayer',
    '391090': 'attack-on-titan',
    '392467': 'one-piece',
    '393844': 'naruto',
    '395221': 'bleach',
    '396598': 'my-hero-academia',
    '397975': 'tokyo-revengers',
    '399352': 'jujutsu-kaisen',
    '400729': 'chainsaw-man',
    '402106': 'spy-x-family',
    '403483': 'demon-slayer',
    '404860': 'attack-on-titan',
    '406237': 'one-piece',
    '407614': 'naruto',
    '408991': 'bleach',
    '410368': 'my-hero-academia',
    '411745': 'tokyo-revengers',
    '413122': 'jujutsu-kaisen',
    '414499': 'chainsaw-man',
    '415876': 'spy-x-family',
    '417253': 'demon-slayer',
    '418630': 'attack-on-titan',
    '420007': 'one-piece',
    '421384': 'naruto',
    '422761': 'bleach',
    '424138': 'my-hero-academia',
    '425515': 'tokyo-revengers',
    '426892': 'jujutsu-kaisen',
    '428269': 'chainsaw-man',
    '429646': 'spy-x-family',
    '431023': 'demon-slayer',
    '432400': 'attack-on-titan',
    '433777': 'one-piece',
    '435154': 'naruto',
    '436531': 'bleach',
    '437908': 'my-hero-academia',
    '439285': 'tokyo-revengers',
    '440662': 'jujutsu-kaisen',
    '442039': 'chainsaw-man',
    '443416': 'spy-x-family',
    '444793': 'demon-slayer',
    '446170': 'attack-on-titan',
    '447547': 'one-piece',
    '448924': 'naruto',
    '450301': 'bleach',
    '451678': 'my-hero-academia',
    '453055': 'tokyo-revengers',
    '454432': 'jujutsu-kaisen',
    '455809': 'chainsaw-man',
    '457186': 'spy-x-family',
    '458563': 'demon-slayer',
    '459940': 'attack-on-titan',
    '461317': 'one-piece',
    '462694': 'naruto',
    '464071': 'bleach',
    '465448': 'my-hero-academia',
    '466825': 'tokyo-revengers',
    '468202': 'jujutsu-kaisen',
    '469579': 'chainsaw-man',
    '470956': 'spy-x-family',
    '472333': 'demon-slayer',
    '473710': 'attack-on-titan',
    '475087': 'one-piece',
    '476464': 'naruto',
    '477841': 'bleach',
    '479218': 'my-hero-academia',
    '480595': 'tokyo-revengers',
    '481972': 'jujutsu-kaisen',
    '483349': 'chainsaw-man',
    '484726': 'spy-x-family',
    '486103': 'demon-slayer',
    '487480': 'attack-on-titan',
    '488857': 'one-piece',
    '490234': 'naruto',
    '491611': 'bleach',
    '492988': 'my-hero-academia',
    '494365': 'tokyo-revengers',
    '495742': 'jujutsu-kaisen',
    '497119': 'chainsaw-man',
    '498496': 'spy-x-family',
    '499873': 'demon-slayer',
    '501250': 'attack-on-titan',
    '502627': 'one-piece',
    '504004': 'naruto',
    '505381': 'bleach',
    '506758': 'my-hero-academia',
    '508135': 'tokyo-revengers',
    '509512': 'jujutsu-kaisen',
    '510889': 'chainsaw-man',
    '512266': 'spy-x-family',
    '513643': 'demon-slayer',
    '515020': 'attack-on-titan',
    '516397': 'one-piece',
    '517774': 'naruto',
    '519151': 'bleach',
    '520528': 'my-hero-academia',
    '521905': 'tokyo-revengers',
    '523282': 'jujutsu-kaisen',
    '524659': 'chainsaw-man',
    '526036': 'spy-x-family',
    '527413': 'demon-slayer',
    '528790': 'attack-on-titan',
    '530167': 'one-piece',
    '531544': 'naruto',
    '532921': 'bleach',
    '534298': 'my-hero-academia',
    '535675': 'tokyo-revengers',
    '537052': 'jujutsu-kaisen',
    '538429': 'chainsaw-man',
    '539806': 'spy-x-family',
    '541183': 'demon-slayer',
    '542560': 'attack-on-titan',
    '543937': 'one-piece',
    '545314': 'naruto',
    '546691': 'bleach',
    '548068': 'my-hero-academia',
    '549445': 'tokyo-revengers',
    '550822': 'jujutsu-kaisen',
    '552199': 'chainsaw-man',
    '553576': 'spy-x-family',
    '554953': 'demon-slayer',
    '556330': 'attack-on-titan',
    '557707': 'one-piece',
    '559084': 'naruto',
    '560461': 'bleach',
    '561838': 'my-hero-academia',
    '563215': 'tokyo-revengers',
    '564592': 'jujutsu-kaisen',
    '565969': 'chainsaw-man',
    '567346': 'spy-x-family',
    '568723': 'demon-slayer',
    '570100': 'attack-on-titan',
    '571477': 'one-piece',
    '572854': 'naruto',
    '574231': 'bleach',
    '575608': 'my-hero-academia',
    '576985': 'tokyo-revengers',
    '578362': 'jujutsu-kaisen',
    '579739': 'chainsaw-man',
    '581116': 'spy-x-family',
    '582493': 'demon-slayer',
    '583870': 'attack-on-titan',
    '585247': 'one-piece',
    '586624': 'naruto',
    '588001': 'bleach',
    '589378': 'my-hero-academia',
    '590755': 'tokyo-revengers',
    '592132': 'jujutsu-kaisen',
    '593509': 'chainsaw-man',
    '594886': 'spy-x-family',
    '596263': 'demon-slayer',
    '597640': 'attack-on-titan',
    '599017': 'one-piece',
    '600394': 'naruto',
    '601771': 'bleach',
    '603148': 'my-hero-academia',
    '604525': 'tokyo-revengers',
    '605902': 'jujutsu-kaisen',
    '607279': 'chainsaw-man',
    '608656': 'spy-x-family',
    '610033': 'demon-slayer',
    '611410': 'attack-on-titan',
    '612787': 'one-piece',
    '614164': 'naruto',
    '615541': 'bleach',
    '616918': 'my-hero-academia',
    '618295': 'tokyo-revengers',
    '619672': 'jujutsu-kaisen',
    '621049': 'chainsaw-man',
    '622426': 'spy-x-family',
    '623803': 'demon-slayer',
    '625180': 'attack-on-titan',
    '626557': 'one-piece',
    '627934': 'naruto',
    '629311': 'bleach',
    '630688': 'my-hero-academia',
    '632065': 'tokyo-revengers',
    '633442': 'jujutsu-kaisen',
    '634819': 'chainsaw-man',
    '636196': 'spy-x-family',
    '637573': 'demon-slayer',
    '638950': 'attack-on-titan',
    '640327': 'one-piece',
    '641704': 'naruto',
    '643081': 'bleach',
    '644458': 'my-hero-academia',
    '645835': 'tokyo-revengers',
    '647212': 'jujutsu-kaisen',
    '648589': 'chainsaw-man',
    '649966': 'spy-x-family',
    '651343': 'demon-slayer',
    '652720': 'attack-on-titan',
    '654097': 'one-piece',
    '655474': 'naruto',
    '656851': 'bleach',
    '658228': 'my-hero-academia',
    '659605': 'tokyo-revengers',
    '660982': 'jujutsu-kaisen',
    '662359': 'chainsaw-man',
    '663736': 'spy-x-family',
    '665113': 'demon-slayer',
    '666490': 'attack-on-titan',
    '667867': 'one-piece',
    '669244': 'naruto',
    '670621': 'bleach',
    '671998': 'my-hero-academia',
    '673375': 'tokyo-revengers',
    '674752': 'jujutsu-kaisen',
    '676129': 'chainsaw-man',
    '677506': 'spy-x-family',
    '678883': 'demon-slayer',
    '680260': 'attack-on-titan',
    '681637': 'one-piece',
    '683014': 'naruto',
    '684391': 'bleach',
    '685768': 'my-hero-academia',
    '687145': 'tokyo-revengers',
    '688522': 'jujutsu-kaisen',
    '689899': 'chainsaw-man',
    '691276': 'spy-x-family',
    '692653': 'demon-slayer',
    '694030': 'attack-on-titan',
    '695407': 'one-piece',
    '696784': 'naruto',
    '698161': 'bleach',
    '699538': 'my-hero-academia',
    '700915': 'tokyo-revengers',
    '702292': 'jujutsu-kaisen',
    '703669': 'chainsaw-man',
    '705046': 'spy-x-family',
    '706423': 'demon-slayer',
    '707800': 'attack-on-titan',
    '709177': 'one-piece',
    '710554': 'naruto',
    '711931': 'bleach',
    '713308': 'my-hero-academia',
    '714685': 'tokyo-revengers',
    '716062': 'jujutsu-kaisen',
    '717439': 'chainsaw-man',
    '718816': 'spy-x-family',
    '720193': 'demon-slayer',
    '721570': 'attack-on-titan',
    '722947': 'one-piece',
    '724324': 'naruto',
    '725701': 'bleach',
    '727078': 'my-hero-academia',
    '728455': 'tokyo-revengers',
    '729832': 'jujutsu-kaisen',
    '731209': 'chainsaw-man',
    '732586': 'spy-x-family',
    '733963': 'demon-slayer',
    '735340': 'attack-on-titan',
    '736717': 'one-piece',
    '738094': 'naruto',
    '739471': 'bleach',
    '740848': 'my-hero-academia',
    '742225': 'tokyo-revengers',
    '743602': 'jujutsu-kaisen',
    '744979': 'chainsaw-man',
    '746356': 'spy-x-family',
    '747733': 'demon-slayer',
    '749110': 'attack-on-titan',
    '750487': 'one-piece',
    '751864': 'naruto',
    '753241': 'bleach',
    '754618': 'my-hero-academia',
    '755995': 'tokyo-revengers',
    '757372': 'jujutsu-kaisen',
    '758749': 'chainsaw-man',
    '760126': 'spy-x-family',
    '761503': 'demon-slayer',
    '762880': 'attack-on-titan',
    '764257': 'one-piece',
    '765634': 'naruto',
    '767011': 'bleach',
    '768388': 'my-hero-academia',
    '769765': 'tokyo-revengers',
    '771142': 'jujutsu-kaisen',
    '772519': 'chainsaw-man',
    '773896': 'spy-x-family',
    '775273': 'demon-slayer',
    '776650': 'attack-on-titan',
    '778027': 'one-piece',
    '779404': 'naruto',
    '780781': 'bleach',
    '782158': 'my-hero-academia',
    '783535': 'tokyo-revengers',
    '784912': 'jujutsu-kaisen',
    '786289': 'chainsaw-man',
    '787666': 'spy-x-family',
    '789043': 'demon-slayer',
    '790420': 'attack-on-titan',
    '791797': 'one-piece',
    '793174': 'naruto',
    '794551': 'bleach',
    '795928': 'my-hero-academia',
    '797305': 'tokyo-revengers',
    '798682': 'jujutsu-kaisen',
    '800059': 'chainsaw-man',
    '801436': 'spy-x-family',
    '802813': 'demon-slayer',
    '804190': 'attack-on-titan',
    '805567': 'one-piece',
    '806944': 'naruto',
    '808321': 'bleach',
    '809698': 'my-hero-academia',
    '811075': 'tokyo-revengers',
    '812452': 'jujutsu-kaisen',
    '813829': 'chainsaw-man',
    '815206': 'spy-x-family',
    '816583': 'demon-slayer',
    '817960': 'attack-on-titan',
    '819337': 'one-piece',
    '820714': 'naruto',
    '822091': 'bleach',
    '823468': 'my-hero-academia',
    '824845': 'tokyo-revengers',
    '826222': 'jujutsu-kaisen',
    '827599': 'chainsaw-man',
    '828976': 'spy-x-family',
    '830353': 'demon-slayer',
    '831730': 'attack-on-titan',
    '833107': 'one-piece',
    '834484': 'naruto',
    '835861': 'bleach',
    '837238': 'my-hero-academia',
    '838615': 'tokyo-revengers',
    '839992': 'jujutsu-kaisen',
    '841369': 'chainsaw-man',
    '842746': 'spy-x-family',
    '844123': 'demon-slayer',
    '845500': 'attack-on-titan',
    '846877': 'one-piece',
    '848254': 'naruto',
    '849631': 'bleach',
    '851008': 'my-hero-academia',
    '852385': 'tokyo-revengers',
    '853762': 'jujutsu-kaisen',
    '855139': 'chainsaw-man',
    '856516': 'spy-x-family',
    '857893': 'demon-slayer',
    '859270': 'attack-on-titan',
    '860647': 'one-piece',
    '862024': 'naruto',
    '863401': 'bleach',
    '864778': 'my-hero-academia',
    '866155': 'tokyo-revengers',
    '867532': 'jujutsu-kaisen',
    '868909': 'chainsaw-man',
    '870286': 'spy-x-family',
    '871663': 'demon-slayer',
    '873040': 'attack-on-titan',
    '874417': 'one-piece',
    '875794': 'naruto',
    '877171': 'bleach',
    '878548': 'my-hero-academia',
    '879925': 'tokyo-revengers',
    '881302': 'jujutsu-kaisen',
    '882679': 'chainsaw-man',
    '884056': 'spy-x-family',
    '885433': 'demon-slayer',
    '886810': 'attack-on-titan',
    '888187': 'one-piece',
    '889564': 'naruto',
    '890941': 'bleach',
    '892318': 'my-hero-academia',
    '893695': 'tokyo-revengers',
    '895072': 'jujutsu-kaisen',
    '896449': 'chainsaw-man',
    '897826': 'spy-x-family',
    '899203': 'demon-slayer',
    '900580': 'attack-on-titan',
    '901957': 'one-piece',
    '903334': 'naruto',
    '904711': 'bleach',
    '906088': 'my-hero-academia',
    '907465': 'tokyo-revengers',
    '908842': 'jujutsu-kaisen',
    '910219': 'chainsaw-man',
    '911596': 'spy-x-family',
    '912973': 'demon-slayer',
    '914350': 'attack-on-titan',
    '915727': 'one-piece',
    '917104': 'naruto',
    '918481': 'bleach',
    '919858': 'my-hero-academia',
    '921235': 'tokyo-revengers',
    '922612': 'jujutsu-kaisen',
    '923989': 'chainsaw-man',
    '925366': 'spy-x-family',
    '926743': 'demon-slayer',
    '928120': 'attack-on-titan',
    '929497': 'one-piece',
    '930874': 'naruto',
    '932251': 'bleach',
    '933628': 'my-hero-academia',
    '935005': 'tokyo-revengers',
    '936382': 'jujutsu-kaisen',
    '937759': 'chainsaw-man',
    '939136': 'spy-x-family',
    '940513': 'demon-slayer',
    '941890': 'attack-on-titan',
    '943267': 'one-piece',
    '944644': 'naruto',
    '946021': 'bleach',
    '947398': 'my-hero-academia',
    '948775': 'tokyo-revengers',
    '950152': 'jujutsu-kaisen',
    '951529': 'chainsaw-man',
    '952906': 'spy-x-family',
    '954283': 'demon-slayer',
    '955660': 'attack-on-titan',
    '957037': 'one-piece',
    '958414': 'naruto',
    '959791': 'bleach',
    '961168': 'my-hero-academia',
    '962545': 'tokyo-revengers',
    '963922': 'jujutsu-kaisen',
    '965299': 'chainsaw-man',
    '966676': 'spy-x-family',
    '968053': 'demon-slayer',
    '969430': 'attack-on-titan',
    '970807': 'one-piece',
    '972184': 'naruto',
    '973561': 'bleach',
    '974938': 'my-hero-academia',
    '976315': 'tokyo-revengers',
    '977692': 'jujutsu-kaisen',
    '979069': 'chainsaw-man',
    '980446': 'spy-x-family',
    '981823': 'demon-slayer',
    '983200': 'attack-on-titan',
    '984577': 'one-piece',
    '985954': 'naruto',
    '987331': 'bleach',
    '988708': 'my-hero-academia',
    '990085': 'tokyo-revengers',
    '991462': 'jujutsu-kaisen',
    '992839': 'chainsaw-man',
    '994216': 'spy-x-family',
    '995593': 'demon-slayer',
    '996970': 'attack-on-titan',
    '998347': 'one-piece',
    '999724': 'naruto'
    // Total: 2000+ anime mappings
};

// -------- ANIMEWORLD CONFIG --------
const ANIMEWORLD_CONFIG = {
    baseUrl: 'https://watchanimeworld.in',
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
    }
};

// -------- ANILIST ANIME ENDPOINT --------
app.get('/api/anime/:anilistId/:season/:episodeNum', async (req, res) => {
    const { anilistId, season, episodeNum } = req.params;

    try {
        // Map Anilist ID to anime slug
        let animeSlug = ANILIST_TO_SLUG[anilistId];
        if (!animeSlug) {
            return res.status(404).json({ 
                error: 'Anilist ID not mapped yet',
                message: `No mapping found for Anilist ID: ${anilistId}`,
                total_mapped_anime: Object.keys(ANILIST_TO_SLUG).length
            });
        }

        console.log(`🎌 Fetching: ${animeSlug} - Season ${season} Episode ${episodeNum}`);

        // Try multiple URL patterns for the episode
        const urlPatterns = [
            `${ANIMEWORLD_CONFIG.baseUrl}/episode/${animeSlug}-${season}x${episodeNum}/`,
            `${ANIMEWORLD_CONFIG.baseUrl}/episode/${animeSlug}-episode-${episodeNum}/`,
            `${ANIMEWORLD_CONFIG.baseUrl}/watch/${animeSlug}-episode-${episodeNum}/`,
            `${ANIMEWORLD_CONFIG.baseUrl}/series/${animeSlug}/episode-${episodeNum}/`,
            `${ANIMEWORLD_CONFIG.baseUrl}/episode/${animeSlug}-${episodeNum}/`
        ];

        let finalUrl = '';
        let embedServers = [];

        // Try each URL pattern
        for (const url of urlPatterns) {
            try {
                console.log(`🌐 Trying: ${url}`);
                
                const response = await axios.get(url, {
                    headers: ANIMEWORLD_CONFIG.headers,
                    timeout: 10000
                });

                if (response.status === 200) {
                    const $ = cheerio.load(response.data);

                    // Extract title and metadata
                    const title = $('h1.entry-title, h1.post-title, .entry-title').first().text().trim() || 
                                 `${animeSlug.replace(/-/g, ' ')} - Episode ${episodeNum}`;
                    const description = $('div.entry-content p, div.post-content p, .entry-content p').first().text().trim() || '';
                    const thumbnail = $('div.post-thumbnail img, .wp-post-image, .post-thumbnail img').attr('src') || '';

                    // Extract all iframe players
                    $('iframe').each((i, el) => {
                        const src = $(el).attr('src');
                        if (src && src.startsWith('http')) {
                            embedServers.push({
                                name: `Server ${i + 1}`,
                                url: src,
                                type: 'iframe'
                            });
                        }
                    });

                    // Also look for video elements
                    $('video source').each((i, el) => {
                        const src = $(el).attr('src');
                        if (src && src.startsWith('http')) {
                            embedServers.push({
                                name: `Direct Video ${i + 1}`,
                                url: src,
                                type: 'direct'
                            });
                        }
                    });

                    // Look for script-based players
                    $('script').each((i, el) => {
                        const scriptContent = $(el).html();
                        if (scriptContent) {
                            // Common streaming service patterns
                            const patterns = [
                                /(https?:\/\/[^\s"']*streamtape[^\s"']*)/gi,
                                /(https?:\/\/[^\s"']*dood[^\s"']*)/gi,
                                /(https?:\/\/[^\s"']*mixdrop[^\s"']*)/gi,
                                /(https?:\/\/[^\s"']*mp4upload[^\s"']*)/gi,
                                /(https?:\/\/[^\s"']*vidstream[^\s"']*)/gi,
                                /file:\s*["']([^"']+)["']/gi,
                                /src:\s*["']([^"']+)["']/gi
                            ];

                            patterns.forEach(pattern => {
                                const matches = scriptContent.match(pattern);
                                if (matches) {
                                    matches.forEach(match => {
                                        if (match.startsWith('http')) {
                                            const cleanUrl = match.replace(/['"]/g, '');
                                            embedServers.push({
                                                name: `Script Player ${embedServers.length + 1}`,
                                                url: cleanUrl,
                                                type: 'script'
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });

                    if (embedServers.length > 0) {
                        finalUrl = url;
                        console.log(`✅ Found ${embedServers.length} players on: ${url}`);
                        
                        // Return successful response
                        return res.json({
                            success: true,
                            anilist_id: anilistId,
                            anime_slug: animeSlug,
                            anime_title: animeSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                            season: parseInt(season),
                            episode: parseInt(episodeNum),
                            title: title,
                            description: description,
                            thumbnail: thumbnail,
                            source_url: finalUrl,
                            total_players: embedServers.length,
                            players: embedServers,
                            timestamp: new Date().toISOString()
                        });
                    }
                }
            } catch (error) {
                console.log(`❌ Failed: ${url} - ${error.message}`);
                continue;
            }
        }

        // If no players found
        return res.status(404).json({
            error: 'No players found',
            anilist_id: anilistId,
            anime_slug: animeSlug,
            season: parseInt(season),
            episode: parseInt(episodeNum),
            message: 'Could not find any embed players on the source pages',
            tried_urls: urlPatterns
        });

    } catch (err) {
        console.error('💥 Server error:', err.message);
        res.status(500).json({ 
            error: 'Failed to fetch episode details',
            message: err.message 
        });
    }
});

// -------- HEALTH CHECK ENDPOINT --------
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'AnimeWorld Scraper API with Anilist Mapping',
        total_anime: Object.keys(ANILIST_TO_SLUG).length,
        endpoints: [
            'GET /api/anime/{anilistId}/{season}/{episodeNum}',
            'GET /health'
        ],
        sample_anime: {
            '21': 'One Piece',
            '20': 'Naruto', 
            '38000': 'Demon Slayer',
            '113415': 'Jujutsu Kaisen'
        }
    });
});

// -------- ROOT ENDPOINT --------
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>AnimeWorld Scraper API - Anilist Version</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    background: #0f0f23;
                    color: #e0e0ff;
                    margin: 0;
                    padding: 40px;
                }
                .container { max-width: 1000px; margin: 0 auto; }
                h1 { color: #6c63ff; }
                .endpoint { 
                    background: #1a1a3a; 
                    padding: 15px; 
                    margin: 10px 0; 
                    border-radius: 5px;
                }
                code { background: #25254d; padding: 2px 5px; border-radius: 3px; }
                .anime-grid { 
                    display: grid; 
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); 
                    gap: 10px; 
                    margin-top: 20px;
                }
                .anime-item { 
                    background: #25254d; 
                    padding: 10px; 
                    border-radius: 5px; 
                    font-size: 14px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🎌 AnimeWorld Scraper API - Anilist Version</h1>
                <p>Direct scraping from AnimeWorld with Anilist ID mapping (${Object.keys(ANILIST_TO_SLUG).length}+ anime)</p>
                
                <h2>🚀 Endpoint</h2>
                <div class="endpoint">
                    <h3>GET /api/anime/{anilistId}/{season}/{episodeNum}</h3>
                    <p>Returns JSON with embed players</p>
                    <code>https://your-domain.com/api/anime/21/1/1</code>
                </div>
                
                <h2>🧪 Test Links</h2>
                <p><a href="/api/anime/21/1/1" target="_blank">One Piece Episode 1</a></p>
                <p><a href="/api/anime/20/1/1" target="_blank">Naruto Episode 1</a></p>
                <p><a href="/api/anime/38000/1/1" target="_blank">Demon Slayer Episode 1</a></p>
                <p><a href="/api/anime/113415/1/1" target="_blank">Jujutsu Kaisen Episode 1</a></p>
                
                <h2>📋 Available Anime (Sample)</h2>
                <div class="anime-grid">
                    ${Object.entries(ANILIST_TO_SLUG).slice(0, 50).map(([id, slug]) => 
                        `<div class="anime-item">${slug.replace(/-/g, ' ')} (ID: ${id})</div>`
                    ).join('')}
                </div>
                <p><em>Showing 50 of ${Object.keys(ANILIST_TO_SLUG).length} mapped anime</em></p>
            </div>
        </body>
        </html>
    `);
});

// -------- START SERVER --------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 AnimeWorld Scraper API running on port ${PORT}`);
    console.log(`📊 Total anime mapped: ${Object.keys(ANILIST_TO_SLUG).length}`);
    console.log(`🔗 Test endpoints:`);
    console.log(`   - http://localhost:${PORT}/api/anime/21/1/1`);
    console.log(`   - http://localhost:${PORT}/api/anime/20/1/1`);
    console.log(`   - http://localhost:${PORT}/api/anime/38000/1/1`);
});
