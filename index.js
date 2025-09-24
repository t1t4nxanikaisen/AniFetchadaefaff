<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Anime Watch - Player Preview</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        body {
            background: #0f0f23;
            color: #e0e0ff;
            line-height: 1.6;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        
        header {
            text-align: center;
            padding: 30px 0;
            background: linear-gradient(135deg, #1a1a3a 0%, #0a0a1a 100%);
            border-radius: 10px;
            margin-bottom: 30px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
        }
        
        h1 {
            font-size: 2.8rem;
            margin-bottom: 10px;
            color: #6c63ff;
            text-shadow: 0 0 10px rgba(108, 99, 255, 0.5);
        }
        
        .subtitle {
            font-size: 1.2rem;
            color: #a0a0ff;
            margin-bottom: 20px;
        }
        
        .search-container {
            max-width: 600px;
            margin: 0 auto 30px;
        }
        
        #searchInput {
            width: 100%;
            padding: 15px 20px;
            font-size: 1.1rem;
            border: none;
            border-radius: 50px;
            background: #1a1a3a;
            color: #e0e0ff;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            outline: none;
        }
        
        #searchInput::placeholder {
            color: #6c63ff;
        }
        
        .main-content {
            display: grid;
            grid-template-columns: 300px 1fr;
            gap: 30px;
        }
        
        .anime-list {
            background: #1a1a3a;
            border-radius: 10px;
            padding: 20px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        }
        
        .anime-list h2 {
            margin-bottom: 20px;
            color: #6c63ff;
            border-bottom: 2px solid #6c63ff;
            padding-bottom: 10px;
        }
        
        .anime-item {
            padding: 12px 15px;
            margin-bottom: 10px;
            background: #25254d;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .anime-item:hover {
            background: #6c63ff;
            transform: translateX(5px);
        }
        
        .anime-item.active {
            background: #6c63ff;
            box-shadow: 0 0 10px rgba(108, 99, 255, 0.7);
        }
        
        .player-container {
            background: #1a1a3a;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            display: flex;
            flex-direction: column;
            height: 80vh;
        }
        
        .player-header {
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #6c63ff;
        }
        
        .player-header h2 {
            color: #6c63ff;
            font-size: 1.8rem;
        }
        
        .player-header p {
            color: #a0a0ff;
            margin-top: 5px;
        }
        
        .iframe-container {
            flex: 1;
            background: #000;
            border-radius: 8px;
            overflow: hidden;
            position: relative;
        }
        
        iframe {
            width: 100%;
            height: 100%;
            border: none;
        }
        
        .loading {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            background: #000;
            color: #6c63ff;
            font-size: 1.5rem;
        }
        
        .episode-selector {
            margin-top: 20px;
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .episode-btn {
            padding: 8px 15px;
            background: #25254d;
            border: none;
            border-radius: 5px;
            color: #e0e0ff;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .episode-btn:hover {
            background: #6c63ff;
        }
        
        .episode-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .episode-info {
            flex: 1;
            text-align: center;
            font-weight: bold;
            color: #6c63ff;
        }
        
        .stats {
            display: flex;
            justify-content: space-around;
            margin-top: 30px;
            text-align: center;
        }
        
        .stat-item {
            background: #1a1a3a;
            padding: 20px;
            border-radius: 10px;
            flex: 1;
            margin: 0 10px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        }
        
        .stat-number {
            font-size: 2.5rem;
            color: #6c63ff;
            font-weight: bold;
        }
        
        .stat-label {
            font-size: 1rem;
            color: #a0a0ff;
            margin-top: 5px;
        }
        
        footer {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            color: #a0a0ff;
            border-top: 1px solid #25254d;
        }
        
        @media (max-width: 1024px) {
            .main-content {
                grid-template-columns: 1fr;
            }
            
            .anime-list {
                max-height: 300px;
            }
        }
        
        @media (max-width: 768px) {
            h1 {
                font-size: 2rem;
            }
            
            .stats {
                flex-direction: column;
            }
            
            .stat-item {
                margin: 10px 0;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>Anime Watch - Player Preview</h1>
            <p class="subtitle">Browse and preview 2000+ anime series with direct player integration</p>
            
            <div class="search-container">
                <input type="text" id="searchInput" placeholder="Search for anime...">
            </div>
        </header>
        
        <div class="main-content">
            <div class="anime-list">
                <h2>Anime Series</h2>
                <div id="animeList">
                    <!-- Anime list will be populated by JavaScript -->
                </div>
            </div>
            
            <div class="player-container">
                <div class="player-header">
                    <h2 id="animeTitle">Select an anime to start watching</h2>
                    <p id="animeInfo">Choose from the list on the left to load the player</p>
                </div>
                
                <div class="iframe-container">
                    <div class="loading" id="loadingMessage">Player will load here when you select an anime</div>
                    <iframe id="playerFrame" style="display: none;"></iframe>
                </div>
                
                <div class="episode-selector">
                    <button class="episode-btn" id="prevEpisode" disabled>Previous</button>
                    <div class="episode-info" id="episodeInfo">Episode: -</div>
                    <button class="episode-btn" id="nextEpisode" disabled>Next</button>
                </div>
            </div>
        </div>
        
        <div class="stats">
            <div class="stat-item">
                <div class="stat-number" id="totalAnime">2000+</div>
                <div class="stat-label">Anime Series</div>
            </div>
            <div class="stat-item">
                <div class="stat-number" id="activePlayers">0</div>
                <div class="stat-label">Active Players</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">24/7</div>
                <div class="stat-label">Available</div>
            </div>
        </div>
        
        <footer>
            <p>Anime Watch Player Preview | All anime content is provided for preview purposes</p>
        </footer>
    </div>

    <script>
        // Comprehensive anime database with AniList IDs
        const animeDatabase = [
            { id: 1, anilistId: 21, title: "One Piece", slug: "one-piece", episodes: 1100, year: 1999, status: "Ongoing" },
            { id: 2, anilistId: 20, title: "Naruto", slug: "naruto", episodes: 220, year: 2002, status: "Completed" },
            { id: 3, anilistId: 1735, title: "Naruto: Shippuden", slug: "naruto-shippuden", episodes: 500, year: 2007, status: "Completed" },
            { id: 4, anilistId: 1535, title: "Death Note", slug: "death-note", episodes: 37, year: 2006, status: "Completed" },
            { id: 5, anilistId: 16498, title: "Attack on Titan", slug: "attack-on-titan", episodes: 88, year: 2013, status: "Completed" },
            { id: 6, anilistId: 11061, title: "Hunter x Hunter (2011)", slug: "hunter-x-hunter", episodes: 148, year: 2011, status: "Completed" },
            { id: 7, anilistId: 23283, title: "Shingeki no Kyojin", slug: "shingeki-no-kyojin", episodes: 75, year: 2013, status: "Completed" },
            { id: 8, anilistId: 22319, title: "Tokyo Ghoul", slug: "tokyo-ghoul", episodes: 48, year: 2014, status: "Completed" },
            { id: 9, anilistId: 28121, title: "Dragon Ball Super", slug: "dragon-ball-super", episodes: 131, year: 2015, status: "Completed" },
            { id: 10, anilistId: 99147, title: "Black Clover", slug: "black-clover", episodes: 170, year: 2017, status: "Completed" },
            { id: 11, anilistId: 38000, title: "Kimetsu no Yaiba", slug: "demon-slayer", episodes: 55, year: 2019, status: "Ongoing" },
            { id: 12, anilistId: 113415, title: "Jujutsu Kaisen", slug: "jujutsu-kaisen", episodes: 47, year: 2020, status: "Ongoing" },
            { id: 13, anilistId: 117448, title: "Mushoku Tensei", slug: "mushoku-tensei", episodes: 36, year: 2021, status: "Ongoing" },
            { id: 14, anilistId: 131586, title: "Chainsaw Man", slug: "chainsaw-man", episodes: 12, year: 2022, status: "Ongoing" },
            { id: 15, anilistId: 140960, title: "Solo Leveling", slug: "solo-leveling", episodes: 12, year: 2024, status: "Ongoing" },
            { id: 16, anilistId: 101922, title: "Kaguya-sama: Love is War", slug: "kaguya-sama", episodes: 37, year: 2019, status: "Completed" },
            { id: 17, anilistId: 104578, title: "Vinland Saga", slug: "vinland-saga", episodes: 48, year: 2019, status: "Ongoing" },
            { id: 18, anilistId: 107660, title: "The Rising of the Shield Hero", slug: "shield-hero", episodes: 38, year: 2019, status: "Ongoing" },
            { id: 19, anilistId: 108632, title: "Dr. Stone", slug: "dr-stone", episodes: 47, year: 2019, status: "Ongoing" },
            { id: 20, anilistId: 101759, title: "My Hero Academia", slug: "my-hero-academia", episodes: 138, year: 2016, status: "Ongoing" },
            { id: 21, anilistId: 9253, title: "Steins;Gate", slug: "steins-gate", episodes: 24, year: 2011, status: "Completed" },
            { id: 22, anilistId: 15315, title: "Kill la Kill", slug: "kill-la-kill", episodes: 24, year: 2013, status: "Completed" },
            { id: 23, anilistId: 20047, title: "No Game No Life", slug: "no-game-no-life", episodes: 12, year: 2014, status: "Completed" },
            { id: 24, anilistId: 20555, title: "Akame ga Kill!", slug: "akame-ga-kill", episodes: 24, year: 2014, status: "Completed" },
            { id: 25, anilistId: 20787, title: "Sword Art Online", slug: "sword-art-online", episodes: 96, year: 2012, status: "Ongoing" },
            { id: 26, anilistId: 2167, title: "Clannad", slug: "clannad", episodes: 44, year: 2007, status: "Completed" },
            { id: 27, anilistId: 6547, title: "Angel Beats!", slug: "angel-beats", episodes: 13, year: 2010, status: "Completed" },
            { id: 28, anilistId: 12189, title: "Psycho-Pass", slug: "psycho-pass", episodes: 41, year: 2012, status: "Completed" },
            { id: 29, anilistId: 14719, title: "JoJo's Bizarre Adventure", slug: "jojo-bizarre-adventure", episodes: 190, year: 2012, status: "Ongoing" },
            { id: 30, anilistId: 17265, title: "Log Horizon", slug: "log-horizon", episodes: 50, year: 2013, status: "Completed" },
            { id: 31, anilistId: 18153, title: "Kuroko's Basketball", slug: "kuroko-basketball", episodes: 75, year: 2012, status: "Completed" },
            { id: 32, anilistId: 18671, title: "Haikyu!!", slug: "haikyu", episodes: 85, year: 2014, status: "Completed" },
            { id: 33, anilistId: 19815, title: "Noragami", slug: "noragami", episodes: 25, year: 2014, status: "Completed" },
            { id: 34, anilistId: 20853, title: "Parasyte", slug: "parasyte", episodes: 24, year: 2014, status: "Completed" },
            { id: 35, anilistId: 21273, title: "Tokyo ESP", slug: "tokyo-esp", episodes: 12, year: 2014, status: "Completed" },
            { id: 36, anilistId: 21995, title: "Assassination Classroom", slug: "assassination-classroom", episodes: 47, year: 2015, status: "Completed" },
            { id: 37, anilistId: 22199, title: "One-Punch Man", slug: "one-punch-man", episodes: 24, year: 2015, status: "Ongoing" },
            { id: 38, anilistId: 23289, title: "Overlord", slug: "overlord", episodes: 52, year: 2015, status: "Ongoing" },
            { id: 39, anilistId: 23755, title: "Mob Psycho 100", slug: "mob-psycho-100", episodes: 37, year: 2016, status: "Completed" },
            { id: 40, anilistId: 24701, title: "Re:Zero", slug: "re-zero", episodes: 50, year: 2016, status: "Ongoing" },
            { id: 41, anilistId: 24833, title: "Boku no Hero Academia", slug: "boku-no-hero-academia", episodes: 113, year: 2016, status: "Ongoing" },
            { id: 42, anilistId: 25519, title: "KonoSuba", slug: "konosuba", episodes: 20, year: 2016, status: "Completed" },
            { id: 43, anilistId: 269, title: "Bleach", slug: "bleach", episodes: 366, year: 2004, status: "Ongoing" },
            { id: 44, anilistId: 44, title: "Fullmetal Alchemist: Brotherhood", slug: "fullmetal-alchemist-brotherhood", episodes: 64, year: 2009, status: "Completed" },
            { id: 45, anilistId: 456, title: "Fate/Zero", slug: "fate-zero", episodes: 25, year: 2011, status: "Completed" },
            { id: 46, anilistId: 6702, title: "Fairy Tail", slug: "fairy-tail", episodes: 328, year: 2009, status: "Completed" },
            { id: 47, anilistId: 9919, title: "Blue Exorcist", slug: "blue-exorcist", episodes: 37, year: 2011, status: "Completed" },
            { id: 48, anilistId: 10087, title: "Deadman Wonderland", slug: "deadman-wonderland", episodes: 12, year: 2011, status: "Completed" },
            { id: 49, anilistId: 11757, title: "Sword Art Online II", slug: "sword-art-online-ii", episodes: 24, year: 2014, status: "Completed" },
            { id: 50, anilistId: 178025, title: "Gachiakuta", slug: "gachiakuta", episodes: 12, year: 2024, status: "Ongoing" },
            { id: 51, anilistId: 185660, title: "Wind Breaker", slug: "wind-breaker", episodes: 13, year: 2024, status: "Ongoing" },
            { id: 52, anilistId: 145064, title: "Frieren: Beyond Journey's End", slug: "frieren", episodes: 28, year: 2023, status: "Completed" },
            { id: 53, anilistId: 147806, title: "The Apothecary Diaries", slug: "apothecary-diaries", episodes: 24, year: 2023, status: "Completed" },
            { id: 54, anilistId: 150672, title: "Sousou no Frieren", slug: "sousou-no-frieren", episodes: 28, year: 2023, status: "Completed" },
            { id: 55, anilistId: 153518, title: "The Dangers in My Heart", slug: "dangers-in-my-heart", episodes: 24, year: 2023, status: "Completed" },
            { id: 56, anilistId: 156891, title: "The 100 Girlfriends Who Really, Really, Really, Really, Really Love You", slug: "100-girlfriends", episodes: 12, year: 2023, status: "Completed" },
            { id: 57, anilistId: 159099, title: "Shangri-La Frontier", slug: "shangri-la-frontier", episodes: 25, year: 2023, status: "Ongoing" },
            { id: 58, anilistId: 163632, title: "The Unwanted Undead Adventurer", slug: "unwanted-undead-adventurer", episodes: 12, year: 2024, status: "Ongoing" },
            { id: 59, anilistId: 165813, title: "Solo Leveling", slug: "solo-leveling", episodes: 12, year: 2024, status: "Completed" },
            { id: 60, anilistId: 168004, title: "The Wrong Way to Use Healing Magic", slug: "wrong-way-healing-magic", episodes: 12, year: 2024, status: "Ongoing" },
            { id: 61, anilistId: 170074, title: "Chained Soldier", slug: "chained-soldier", episodes: 12, year: 2024, status: "Completed" },
            { id: 62, anilistId: 172528, title: "Metallic Rouge", slug: "metallic-rouge", episodes: 13, year: 2024, status: "Completed" },
            { id: 63, anilistId: 175014, title: "Oshi no Ko", slug: "oshi-no-ko", episodes: 11, year: 2023, status: "Ongoing" },
            { id: 64, anilistId: 177784, title: "Mushoku Tensei II", slug: "mushoku-tensei-ii", episodes: 25, year: 2023, status: "Completed" },
            { id: 65, anilistId: 180173, title: "Jujutsu Kaisen 2nd Season", slug: "jujutsu-kaisen-2", episodes: 23, year: 2023, status: "Completed" },
            { id: 66, anilistId: 183545, title: "Bleach: Thousand-Year Blood War", slug: "bleach-tybw", episodes: 26, year: 2022, status: "Ongoing" },
            { id: 67, anilistId: 186417, title: "Spy x Family", slug: "spy-x-family", episodes: 37, year: 2022, status: "Ongoing" },
            { id: 68, anilistId: 189291, title: "Chainsaw Man Part 2", slug: "chainsaw-man-2", episodes: 12, year: 2023, status: "Ongoing" },
            { id: 69, anilistId: 192392, title: "Demon Slayer: Hashira Training Arc", slug: "demon-slayer-hashira", episodes: 8, year: 2024, status: "Completed" },
            { id: 70, anilistId: 195374, title: "Blue Lock", slug: "blue-lock", episodes: 24, year: 2022, status: "Completed" },
            { id: 71, anilistId: 198291, title: "Bocchi the Rock!", slug: "bocchi-the-rock", episodes: 12, year: 2022, status: "Completed" },
            { id: 72, anilistId: 201329, title: "Cyberpunk: Edgerunners", slug: "cyberpunk-edgerunners", episodes: 10, year: 2022, status: "Completed" },
            { id: 73, anilistId: 204427, title: "Lycoris Recoil", slug: "lycoris-recoil", episodes: 13, year: 2022, status: "Completed" },
            { id: 74, anilistId: 207496, title: "Made in Abyss: The Golden City of the Scorching Sun", slug: "made-in-abyss-2", episodes: 12, year: 2022, status: "Completed" },
            { id: 75, anilistId: 210579, title: "Call of the Night", slug: "call-of-the-night", episodes: 13, year: 2022, status: "Completed" },
            { id: 76, anilistId: 213642, title: "Ao Ashi", slug: "ao-ashi", episodes: 24, year: 2022, status: "Completed" },
            { id: 77, anilistId: 216719, title: "Summer Time Rendering", slug: "summer-time-rendering", episodes: 25, year: 2022, status: "Completed" },
            { id: 78, anilistId: 219783, title: "Kaguya-sama: Love Is War - Ultra Romantic", slug: "kaguya-sama-3", episodes: 13, year: 2022, status: "Completed" },
            { id: 79, anilistId: 222834, title: "Ya Boy Kongming!", slug: "ya-boy-kongming", episodes: 12, year: 2022, status: "Completed" },
            { id: 80, anilistId: 225837, title: "Birdie Wing: Golf Girls' Story", slug: "birdie-wing", episodes: 25, year: 2022, status: "Completed" },
            { id: 81, anilistId: 228846, title: "Shadows House 2nd Season", slug: "shadows-house-2", episodes: 12, year: 2022, status: "Completed" },
            { id: 82, anilistId: 231891, title: "The Executioner and Her Way of Life", slug: "executioner-way-of-life", episodes: 12, year: 2022, status: "Completed" },
            { id: 83, anilistId: 234957, title: "Love Live! Superstar!! 2nd Season", slug: "love-live-superstar-2", episodes: 12, year: 2022, status: "Completed" },
            { id: 84, anilistId: 237984, title: "The Demon Girl Next Door Season 2", slug: "demon-girl-next-door-2", episodes: 12, year: 2022, status: "Completed" },
            { id: 85, anilistId: 240976, title: "The Greatest Demon Lord Is Reborn as a Typical Nobody", slug: "greatest-demon-lord-reborn", episodes: 12, year: 2022, status: "Completed" },
            { id: 86, anilistId: 243987, title: "Aharen-san wa Hakarenai", slug: "aharen-san", episodes: 12, year: 2022, status: "Completed" },
            { id: 87, anilistId: 246982, title: "Love After World Domination", slug: "love-after-world-domination", episodes: 12, year: 2022, status: "Completed" },
            { id: 88, anilistId: 249983, title: "The Dawn of the Witch", slug: "dawn-of-the-witch", episodes: 12, year: 2022, status: "Completed" },
            { id: 89, anilistId: 252976, title: "Heroines Run the Show", slug: "heroines-run-the-show", episodes: 12, year: 2022, status: "Completed" },
            { id: 90, anilistId: 255984, title: "RPG Real Estate", slug: "rpg-real-estate", episodes: 12, year: 2022, status: "Completed" },
            { id: 91, anilistId: 258987, title: "Shikimori's Not Just a Cutie", slug: "shikimori", episodes: 12, year: 2022, status: "Completed" },
            { id: 92, anilistId: 261984, title: "The Girl from the Other Side: Siúil, a Rún", slug: "girl-from-other-side", episodes: 1, year: 2022, status: "Completed" },
            { id: 93, anilistId: 264987, title: "Komi Can't Communicate Season 2", slug: "komi-cant-communicate-2", episodes: 12, year: 2022, status: "Completed" },
            { id: 94, anilistId: 267984, title: "The Rising of the Shield Hero Season 2", slug: "shield-hero-2", episodes: 13, year: 2022, status: "Completed" },
            { id: 95, anilistId: 270987, title: "Spy x Family Part 2", slug: "spy-x-family-2", episodes: 13, year: 2022, status: "Completed" },
            { id: 96, anilistId: 273984, title: "To Your Eternity Season 2", slug: "to-your-eternity-2", episodes: 12, year: 2022, status: "Completed" },
            { id: 97, anilistId: 276987, title: "Urusei Yatsura (2022)", slug: "urusei-yatsura-2022", episodes: 46, year: 2022, status: "Completed" },
            { id: 98, anilistId: 279984, title: "Bleach: Thousand-Year Blood War Part 2", slug: "bleach-tybw-2", episodes: 13, year: 2023, status: "Completed" },
            { id: 99, anilistId: 282987, title: "Vinland Saga Season 2", slug: "vinland-saga-2", episodes: 24, year: 2023, status: "Completed" },
            { id: 100, anilistId: 285984, title: "Heavenly Delusion", slug: "heavenly-delusion", episodes: 13, year: 2023, status: "Completed" }
        ];

        // Add more anime to reach 2000+ (simulated)
        for (let i = 101; i <= 2000; i++) {
            const year = 1980 + Math.floor(Math.random() * 44);
            const episodes = Math.floor(Math.random() * 200) + 1;
            const statuses = ["Completed", "Ongoing"];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            
            animeDatabase.push({
                id: i,
                anilistId: 300000 + i,
                title: `Anime Series ${i}`,
                slug: `anime-series-${i}`,
                episodes: episodes,
                year: year,
                status: status
            });
        }

        // DOM elements
        const animeListElement = document.getElementById('animeList');
        const searchInput = document.getElementById('searchInput');
        const animeTitle = document.getElementById('animeTitle');
        const animeInfo = document.getElementById('animeInfo');
        const playerFrame = document.getElementById('playerFrame');
        const loadingMessage = document.getElementById('loadingMessage');
        const prevEpisodeBtn = document.getElementById('prevEpisode');
        const nextEpisodeBtn = document.getElementById('nextEpisode');
        const episodeInfo = document.getElementById('episodeInfo');
        const totalAnimeElement = document.getElementById('totalAnime');
        const activePlayersElement = document.getElementById('activePlayers');

        // Current state
        let currentAnime = null;
        let currentEpisode = 1;
        let filteredAnime = [...animeDatabase];

        // Initialize
        function init() {
            totalAnimeElement.textContent = animeDatabase.length;
            renderAnimeList();
            setupEventListeners();
        }

        // Render anime list
        function renderAnimeList() {
            animeListElement.innerHTML = '';
            
            filteredAnime.forEach(anime => {
                const animeItem = document.createElement('div');
                animeItem.className = 'anime-item';
                animeItem.textContent = anime.title;
                animeItem.addEventListener('click', () => selectAnime(anime));
                
                animeListElement.appendChild(animeItem);
            });
        }

        // Setup event listeners
        function setupEventListeners() {
            searchInput.addEventListener('input', handleSearch);
            prevEpisodeBtn.addEventListener('click', goToPrevEpisode);
            nextEpisodeBtn.addEventListener('click', goToNextEpisode);
        }

        // Handle search
        function handleSearch() {
            const query = searchInput.value.toLowerCase();
            
            if (query.length === 0) {
                filteredAnime = [...animeDatabase];
            } else {
                filteredAnime = animeDatabase.filter(anime => 
                    anime.title.toLowerCase().includes(query)
                );
            }
            
            renderAnimeList();
        }

        // Select anime
        function selectAnime(anime) {
            currentAnime = anime;
            currentEpisode = 1;
            
            // Update UI
            document.querySelectorAll('.anime-item').forEach(item => {
                item.classList.remove('active');
                if (item.textContent === anime.title) {
                    item.classList.add('active');
                }
            });
            
            animeTitle.textContent = anime.title;
            animeInfo.textContent = `${anime.year} • ${anime.episodes} Episodes • ${anime.status}`;
            
            // Enable episode navigation
            prevEpisodeBtn.disabled = currentEpisode <= 1;
            nextEpisodeBtn.disabled = currentEpisode >= anime.episodes;
            episodeInfo.textContent = `Episode: ${currentEpisode}`;
            
            // Load player
            loadPlayer();
        }

        // Load player
        function loadPlayer() {
            if (!currentAnime) return;
            
            // Show loading
            loadingMessage.style.display = 'flex';
            playerFrame.style.display = 'none';
            
            // Simulate API call to get player URL
            setTimeout(() => {
                // In a real implementation, this would fetch from your API
                const playerUrl = `https://anisnfdf.vercel.app/api/anime/${currentAnime.anilistId}/1/${currentEpisode}`;
                
                // For demo purposes, we'll use a placeholder
                // In production, you would use the actual player URL from your API
                playerFrame.src = playerUrl;
                
                // Hide loading and show player
                loadingMessage.style.display = 'none';
                playerFrame.style.display = 'block';
                
                // Update active players count
                activePlayersElement.textContent = parseInt(activePlayersElement.textContent) + 1;
            }, 1000);
        }

        // Navigate to previous episode
        function goToPrevEpisode() {
            if (currentEpisode > 1) {
                currentEpisode--;
                updateEpisode();
            }
        }

        // Navigate to next episode
        function goToNextEpisode() {
            if (currentAnime && currentEpisode < currentAnime.episodes) {
                currentEpisode++;
                updateEpisode();
            }
        }

        // Update episode
        function updateEpisode() {
            episodeInfo.textContent = `Episode: ${currentEpisode}`;
            prevEpisodeBtn.disabled = currentEpisode <= 1;
            nextEpisodeBtn.disabled = currentEpisode >= currentAnime.episodes;
            loadPlayer();
        }

        // Initialize the application
        init();
    </script>
</body>
</html>
