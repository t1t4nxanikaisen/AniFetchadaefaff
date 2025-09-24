<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Direct Anime Scraper - Player Preview</title>
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
        
        .error-message {
            color: #ff6b6b;
            text-align: center;
            padding: 20px;
            background: rgba(255, 107, 107, 0.1);
            border-radius: 8px;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>Direct Anime Scraper - Player Preview</h1>
            <p class="subtitle">Direct scraping from AnimeWorld with real player URLs</p>
            
            <div class="search-container">
                <input type="text" id="searchInput" placeholder="Search for anime...">
            </div>
        </header>
        
        <div class="main-content">
            <div class="anime-list">
                <h2>Popular Anime</h2>
                <div id="animeList">
                    <!-- Anime list will be populated by JavaScript -->
                </div>
            </div>
            
            <div class="player-container">
                <div class="player-header">
                    <h2 id="animeTitle">Select an anime to start watching</h2>
                    <p id="animeInfo">Choose from the list to load the player</p>
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
                
                <div id="errorMessage" class="error-message" style="display: none;"></div>
            </div>
        </div>
        
        <div class="stats">
            <div class="stat-item">
                <div class="stat-number" id="totalAnime">50+</div>
                <div class="stat-label">Anime Series</div>
            </div>
            <div class="stat-item">
                <div class="stat-number" id="activePlayers">0</div>
                <div class="stat-label">Active Players</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">Direct</div>
                <div class="stat-label">Scraping</div>
            </div>
        </div>
        
        <footer>
            <p>Direct Anime Scraper | Real-time player extraction from AnimeWorld</p>
        </footer>
    </div>

    <script>
        // Real anime database with correct slugs for AnimeWorld
        const animeDatabase = [
            { anilistId: 21, title: "One Piece", slug: "one-piece", episodes: 1100, year: 1999, status: "Ongoing" },
            { anilistId: 20, title: "Naruto", slug: "naruto", episodes: 220, year: 2002, status: "Completed" },
            { anilistId: 1735, title: "Naruto: Shippuden", slug: "naruto-shippuden", episodes: 500, year: 2007, status: "Completed" },
            { anilistId: 1535, title: "Death Note", slug: "death-note", episodes: 37, year: 2006, status: "Completed" },
            { anilistId: 16498, title: "Attack on Titan", slug: "shingeki-no-kyojin", episodes: 88, year: 2013, status: "Completed" },
            { anilistId: 11061, title: "Hunter x Hunter (2011)", slug: "hunter-x-hunter-2011", episodes: 148, year: 2011, status: "Completed" },
            { anilistId: 38000, title: "Demon Slayer", slug: "kimetsu-no-yaiba", episodes: 55, year: 2019, status: "Ongoing" },
            { anilistId: 113415, title: "Jujutsu Kaisen", slug: "jujutsu-kaisen", episodes: 47, year: 2020, status: "Ongoing" },
            { anilistId: 117448, title: "Mushoku Tensei", slug: "mushoku-tensei-jobless-reincarnation", episodes: 36, year: 2021, status: "Ongoing" },
            { anilistId: 131586, title: "Chainsaw Man", slug: "chainsaw-man", episodes: 12, year: 2022, status: "Ongoing" },
            { anilistId: 140960, title: "Solo Leveling", slug: "solo-leveling", episodes: 12, year: 2024, status: "Ongoing" },
            { anilistId: 101922, title: "Kaguya-sama: Love is War", slug: "kaguya-sama-wa-kokurasetai", episodes: 37, year: 2019, status: "Completed" },
            { anilistId: 104578, title: "Vinland Saga", slug: "vinland-saga", episodes: 48, year: 2019, status: "Ongoing" },
            { anilistId: 107660, title: "The Rising of the Shield Hero", slug: "tate-no-yuusha-no-nariagari", episodes: 38, year: 2019, status: "Ongoing" },
            { anilistId: 101759, title: "My Hero Academia", slug: "boku-no-hero-academia", episodes: 138, year: 2016, status: "Ongoing" },
            { anilistId: 9253, title: "Steins;Gate", slug: "steinsgate", episodes: 24, year: 2011, status: "Completed" },
            { anilistId: 20555, title: "Akame ga Kill!", slug: "akame-ga-kill", episodes: 24, year: 2014, status: "Completed" },
            { anilistId: 20787, title: "Sword Art Online", slug: "sword-art-online", episodes: 96, year: 2012, status: "Ongoing" },
            { anilistId: 12189, title: "Psycho-Pass", slug: "psycho-pass", episodes: 41, year: 2012, status: "Completed" },
            { anilistId: 14719, title: "JoJo's Bizarre Adventure", slug: "jojo-no-kimyou-na-bouken", episodes: 190, year: 2012, status: "Ongoing" },
            { anilistId: 18671, title: "Haikyu!!", slug: "haikyuu", episodes: 85, year: 2014, status: "Completed" },
            { anilistId: 21995, title: "Assassination Classroom", slug: "ansatsu-kyoushitsu", episodes: 47, year: 2015, status: "Completed" },
            { anilistId: 22199, title: "One-Punch Man", slug: "one-punch-man", episodes: 24, year: 2015, status: "Ongoing" },
            { anilistId: 23289, title: "Overlord", slug: "overlord", episodes: 52, year: 2015, status: "Ongoing" },
            { anilistId: 24701, title: "Re:Zero", slug: "rezero-kara-hajimeru-isekai-seikatsu", episodes: 50, year: 2016, status: "Ongoing" },
            { anilistId: 269, title: "Bleach", slug: "bleach", episodes: 366, year: 2004, status: "Ongoing" },
            { anilistId: 44, title: "Fullmetal Alchemist: Brotherhood", slug: "fullmetal-alchemist-brotherhood", episodes: 64, year: 2009, status: "Completed" },
            { anilistId: 6702, title: "Fairy Tail", slug: "fairy-tail", episodes: 328, year: 2009, status: "Completed" },
            { anilistId: 178025, title: "Gachiakuta", slug: "gachiakuta", episodes: 12, year: 2024, status: "Ongoing" },
            { anilistId: 185660, title: "Wind Breaker", slug: "wind-breaker", episodes: 13, year: 2024, status: "Ongoing" },
            { anilistId: 145064, title: "Frieren: Beyond Journey's End", slug: "sousou-no-frieren", episodes: 28, year: 2023, status: "Completed" },
            { anilistId: 147806, title: "The Apothecary Diaries", slug: "kusuriya-no-hitorigoto", episodes: 24, year: 2023, status: "Completed" },
            { anilistId: 153518, title: "The Dangers in My Heart", slug: "bokuyaba", episodes: 24, year: 2023, status: "Completed" },
            { anilistId: 159099, title: "Shangri-La Frontier", slug: "shangri-la-frontier", episodes: 25, year: 2023, status: "Ongoing" },
            { anilistId: 165813, title: "Solo Leveling", slug: "solo-leveling", episodes: 12, year: 2024, status: "Completed" },
            { anilistId: 175014, title: "Oshi no Ko", slug: "oshi-no-ko", episodes: 11, year: 2023, status: "Ongoing" },
            { anilistId: 183545, title: "Bleach: Thousand-Year Blood War", slug: "bleach-sennen-kessen-hen", episodes: 26, year: 2022, status: "Ongoing" },
            { anilistId: 186417, title: "Spy x Family", slug: "spy-x-family", episodes: 37, year: 2022, status: "Ongoing" },
            { anilistId: 192392, title: "Demon Slayer: Hashira Training Arc", slug: "kimetsu-no-yaiba-hashira-geiko-hen", episodes: 8, year: 2024, status: "Completed" },
            { anilistId: 195374, title: "Blue Lock", slug: "blue-lock", episodes: 24, year: 2022, status: "Completed" },
            { anilistId: 222834, title: "Ya Boy Kongming!", slug: "paripi-koumei", episodes: 12, year: 2022, status: "Completed" },
            { anilistId: 23755, title: "Mob Psycho 100", slug: "mob-psycho-100", episodes: 37, year: 2016, status: "Completed" },
            { anilistId: 25519, title: "KonoSuba", slug: "konosuba", episodes: 20, year: 2016, status: "Completed" },
            { anilistId: 28121, title: "Dragon Ball Super", slug: "dragon-ball-super", episodes: 131, year: 2015, status: "Completed" },
            { anilistId: 99147, title: "Black Clover", slug: "black-clover", episodes: 170, year: 2017, status: "Completed" },
            { anilistId: 11757, title: "Sword Art Online II", slug: "sword-art-online-ii", episodes: 24, year: 2014, status: "Completed" },
            { anilistId: 20047, title: "No Game No Life", slug: "no-game-no-life", episodes: 12, year: 2014, status: "Completed" },
            { anilistId: 2167, title: "Clannad", slug: "clannad", episodes: 44, year: 2007, status: "Completed" },
            { anilistId: 6547, title: "Angel Beats!", slug: "angel-beats", episodes: 13, year: 2010, status: "Completed" },
            { anilistId: 9919, title: "Blue Exorcist", slug: "ao-no-exorcist", episodes: 37, year: 2011, status: "Completed" }
        ];

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
        const errorMessage = document.getElementById('errorMessage');

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
            
            // Hide error message
            errorMessage.style.display = 'none';
            
            // Load player
            loadPlayer();
        }

        // Load player using direct scraping approach
        async function loadPlayer() {
            if (!currentAnime) return;
            
            // Show loading
            loadingMessage.style.display = 'flex';
            playerFrame.style.display = 'none';
            loadingMessage.textContent = 'Scraping player URL...';
            
            try {
                // Use CORS proxy to bypass restrictions
                const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
                const targetUrl = `https://watchanimeworld.in/episode/${currentAnime.slug}-${currentEpisode}/`;
                
                console.log('Scraping URL:', targetUrl);
                
                // Try to fetch the page content
                const response = await fetch(proxyUrl + targetUrl);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const html = await response.text();
                
                // Extract player iframe URL from HTML
                const playerUrl = extractPlayerUrl(html);
                
                if (playerUrl) {
                    playerFrame.src = playerUrl;
                    loadingMessage.style.display = 'none';
                    playerFrame.style.display = 'block';
                    activePlayersElement.textContent = parseInt(activePlayersElement.textContent) + 1;
                    errorMessage.style.display = 'none';
                } else {
                    throw new Error('Player URL not found on the page');
                }
                
            } catch (error) {
                console.error('Scraping error:', error);
                loadingMessage.textContent = 'Error loading player';
                
                // Show error message
                errorMessage.innerHTML = `
                    <strong>Error loading player:</strong> ${error.message}<br>
                    <small>Trying alternative method...</small>
                `;
                errorMessage.style.display = 'block';
                
                // Try alternative method - direct embed
                tryAlternativePlayer();
            }
        }

        // Extract player URL from HTML content
        function extractPlayerUrl(html) {
            // Create temporary DOM parser
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Look for iframe elements
            const iframes = doc.querySelectorAll('iframe');
            for (let iframe of iframes) {
                const src = iframe.getAttribute('src');
                if (src && (src.includes('streamtape') || src.includes('dood') || 
                    src.includes('mixdrop') || src.includes('mp4upload') || 
                    src.includes('vidstream') || src.includes('embtaku'))) {
                    return src;
                }
            }
            
            // Look for video elements
            const videos = doc.querySelectorAll('video');
            for (let video of videos) {
                const src = video.getAttribute('src');
                if (src && src.startsWith('http')) {
                    return src;
                }
            }
            
            // Look for script elements that might contain player URLs
            const scripts = doc.querySelectorAll('script');
            for (let script of scripts) {
                const scriptContent = script.textContent;
                // Common patterns for player URLs
                const urlPatterns = [
                    /(https?:\/\/[^\s"']*\.(mp4|m3u8)[^\s"']*)/gi,
                    /(https?:\/\/[^\s"']*streamtape[^\s"']*)/gi,
                    /(https?:\/\/[^\s"']*dood[^\s"']*)/gi,
                    /file:\s*["']([^"']+)["']/gi,
                    /src:\s*["']([^"']+)["']/gi
                ];
                
                for (let pattern of urlPatterns) {
                    const matches = scriptContent.match(pattern);
                    if (matches) {
                        for (let match of matches) {
                            if (match.startsWith('http')) {
                                return match;
                            }
                        }
                    }
                }
            }
            
            return null;
        }

        // Alternative method for loading player
        function tryAlternativePlayer() {
            // Use a direct embed approach with common streaming services
            const alternativeUrls = [
                `https://watchanimeworld.in/embed/${currentAnime.slug}-episode-${currentEpisode}/`,
                `https://watchanimeworld.in/stream/${currentAnime.slug}-episode-${currentEpisode}/`,
                `https://watchanimeworld.in/player/${currentAnime.slug}-episode-${currentEpisode}/`
            ];
            
            // Try each alternative URL
            let currentAltIndex = 0;
            const tryNextAlternative = () => {
                if (currentAltIndex < alternativeUrls.length) {
                    playerFrame.src = alternativeUrls[currentAltIndex];
                    playerFrame.onload = () => {
                        loadingMessage.style.display = 'none';
                        playerFrame.style.display = 'block';
                        activePlayersElement.textContent = parseInt(activePlayersElement.textContent) + 1;
                        errorMessage.style.display = 'none';
                    };
                    playerFrame.onerror = () => {
                        currentAltIndex++;
                        tryNextAlternative();
                    };
                } else {
                    loadingMessage.textContent = 'All methods failed';
                    errorMessage.innerHTML = `
                        <strong>All scraping methods failed</strong><br>
                        <small>The anime might not be available or the website structure changed.</small>
                    `;
                }
            };
            
            tryNextAlternative();
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
