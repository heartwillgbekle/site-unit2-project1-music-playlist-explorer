// Global variables
let playlistsData = [];
let currentFeaturedPlaylist = null;
let isShuffled = false;
let originalSongOrder = null;

/**
 * Randomly selects one playlist from the available playlists array
 * @param {Array} playlists - Array of all available playlist objects
 * @returns {Object|null} - Randomly selected playlist object, or null if array is empty
 */
function selectRandomPlaylist(playlists) {
    if (!playlists || playlists.length === 0) {
        console.error('No playlists available');
        return null;
    }

    // Get last viewed playlist from localStorage to avoid repeats
    const lastPlaylistID = localStorage.getItem('lastFeaturedPlaylistID');

    // If only one playlist, return it
    if (playlists.length === 1) {
        return playlists[0];
    }

    // Try to select different playlist than last time
    let selectedPlaylist;
    let attempts = 0;
    const maxAttempts = 10;

    do {
        const randomIndex = Math.floor(Math.random() * playlists.length);
        selectedPlaylist = playlists[randomIndex];
        attempts++;
    } while (
        lastPlaylistID &&
        selectedPlaylist.playlistID.toString() === lastPlaylistID &&
        attempts < maxAttempts
    );

    // Store selected playlist ID in localStorage
    localStorage.setItem('lastFeaturedPlaylistID', selectedPlaylist.playlistID.toString());

    return selectedPlaylist;
}

/**
 * Populates the Featured Page with the selected playlist's data
 * @param {Object} playlist - The playlist object to display
 */
function renderFeaturedPlaylist(playlist) {
    if (!playlist) {
        displayErrorMessage();
        return;
    }

    // Update page title
    document.title = `${playlist.playlistName} - Featured Playlist`;

    // Update cover image
    const coverImg = document.querySelector('.featured-cover');
    coverImg.src = playlist.playlistCoverUrl;
    coverImg.alt = `${playlist.playlistName} cover`;

    // Update playlist title
    const titleElement = document.querySelector('.featured-title');
    titleElement.textContent = playlist.playlistName;

    // Update creator
    const creatorElement = document.querySelector('.featured-creator');
    creatorElement.textContent = `by ${playlist.playlistCreator}`;

    // Update like count
    const likeCountElement = document.querySelector('.featured-like-count');
    likeCountElement.textContent = playlist.likeCount;

    // Clear and rebuild track list
    const trackList = document.querySelector('.featured-track-list');
    trackList.innerHTML = '';

    if (!playlist.songs || playlist.songs.length === 0) {
        trackList.innerHTML = '<li class="empty-tracks">No tracks in this playlist</li>';
        return;
    }

    // Create numbered track items
    playlist.songs.forEach((song, index) => {
        const trackItem = createFeaturedTrackItem(song, index + 1);
        trackList.appendChild(trackItem);
    });
}

/**
 * Creates a single track card element for the featured page
 * @param {Object} song - Song object containing song data
 * @param {number} trackNumber - Track position number (1-indexed)
 * @returns {HTMLElement} - The created card element
 */
function createFeaturedTrackItem(song, trackNumber) {
    const trackCard = document.createElement('li');
    trackCard.className = 'featured-track-card';
    trackCard.setAttribute('data-track-id', song.songID);

    // Song cover image
    const coverImg = document.createElement('img');
    coverImg.className = 'featured-track-cover';
    coverImg.src = song.songCoverUrl;
    coverImg.alt = `${song.songTitle} cover`;

    // Track info container
    const trackInfo = document.createElement('div');
    trackInfo.className = 'featured-track-info';

    // Track number
    const numberSpan = document.createElement('span');
    numberSpan.className = 'featured-track-number';
    numberSpan.textContent = `#${trackNumber}`;

    // Track title
    const trackTitle = document.createElement('h4');
    trackTitle.className = 'featured-track-title';
    trackTitle.textContent = song.songTitle;

    // Track artist
    const trackArtist = document.createElement('p');
    trackArtist.className = 'featured-track-artist';
    trackArtist.textContent = song.songArtist;

    trackInfo.appendChild(numberSpan);
    trackInfo.appendChild(trackTitle);
    trackInfo.appendChild(trackArtist);

    // Like button
    const likeBtn = document.createElement('button');
    likeBtn.className = 'featured-like-btn';
    likeBtn.setAttribute('aria-label', 'Like song');
    likeBtn.setAttribute('data-liked', song.liked.toString());

    const heartIcon = document.createElement('span');
    heartIcon.className = 'heart-icon';
    heartIcon.textContent = song.liked ? '♥' : '♡';

    const likeCount = document.createElement('span');
    likeCount.className = 'like-count';
    likeCount.textContent = song.likeCount;

    likeBtn.appendChild(heartIcon);
    likeBtn.appendChild(likeCount);

    // Assemble track card
    trackCard.appendChild(coverImg);
    trackCard.appendChild(trackInfo);
    trackCard.appendChild(likeBtn);

    return trackCard;
}

/**
 * Shuffles an array using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} - New shuffled array (original unchanged)
 */
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Toggles shuffle state for the featured playlist
 */
function toggleFeaturedShuffle() {
    if (!currentFeaturedPlaylist) {
        console.error('No playlist is currently featured');
        return;
    }

    const shuffleBtn = document.querySelector('.featured-shuffle');
    const trackList = document.querySelector('.featured-track-list');

    if (!isShuffled) {
        // SHUFFLE ON: Save original order and shuffle
        originalSongOrder = [...currentFeaturedPlaylist.songs];
        const shuffled = shuffleArray(currentFeaturedPlaylist.songs);

        // Re-render track list with shuffled order
        trackList.innerHTML = '';
        shuffled.forEach((song, index) => {
            const trackItem = createFeaturedTrackItem(song, index + 1);
            trackList.appendChild(trackItem);
        });

        // Update state and button
        isShuffled = true;
        shuffleBtn.setAttribute('data-shuffled', 'true');

        // Re-attach like listeners
        setupFeaturedLikeListeners();
    } else {
        // SHUFFLE OFF: Restore original order
        trackList.innerHTML = '';
        originalSongOrder.forEach((song, index) => {
            const trackItem = createFeaturedTrackItem(song, index + 1);
            trackList.appendChild(trackItem);
        });

        // Update state and button
        isShuffled = false;
        shuffleBtn.setAttribute('data-shuffled', 'false');

        // Re-attach like listeners
        setupFeaturedLikeListeners();
    }
}

/**
 * Toggles the like state of a song in the featured playlist
 * @param {number} playlistID - ID of the playlist containing the song
 * @param {number} songID - ID of the song to toggle
 * @param {HTMLElement} buttonElement - The like button that was clicked
 */
function toggleFeaturedSongLike(playlistID, songID, buttonElement) {
    const currentLikedState = buttonElement.getAttribute('data-liked') === 'true';

    // Find playlist and song in data
    const playlist = playlistsData.find(p => p.playlistID === playlistID);
    if (!playlist) {
        console.error('Playlist not found:', playlistID);
        return;
    }

    const song = playlist.songs.find(s => s.songID === songID);
    if (!song) {
        console.error('Song not found:', songID);
        return;
    }

    // Get heart icon and like count elements
    const heartIcon = buttonElement.querySelector('.heart-icon');
    const likeCountSpan = buttonElement.querySelector('.like-count');

    // Toggle based on current state
    if (!currentLikedState) {
        // LIKE: Unliked → Liked
        song.liked = true;
        song.likeCount = song.likeCount + 1;
        buttonElement.setAttribute('data-liked', 'true');
        heartIcon.textContent = '♥';
    } else {
        // UNLIKE: Liked → Unliked
        song.liked = false;
        song.likeCount = Math.max(0, song.likeCount - 1);
        buttonElement.setAttribute('data-liked', 'false');
        heartIcon.textContent = '♡';
    }

    // Update like count display
    likeCountSpan.textContent = song.likeCount;
}

/**
 * Sets up click event listeners for song like buttons on the featured page
 */
function setupFeaturedLikeListeners() {
    const likeButtons = document.querySelectorAll('.featured-track-list .featured-like-btn');

    likeButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            event.stopPropagation();

            // Get song ID from parent track card
            const trackCard = button.closest('.featured-track-card');
            const songID = parseInt(trackCard.getAttribute('data-track-id'));

            // Get playlist ID from current featured playlist
            if (!currentFeaturedPlaylist) {
                console.error('No playlist is currently featured');
                return;
            }

            // Toggle the like
            toggleFeaturedSongLike(currentFeaturedPlaylist.playlistID, songID, button);
        });
    });
}

/**
 * Selects and displays a new random playlist
 */
function refreshFeaturedPlaylist() {
    if (!playlistsData || playlistsData.length === 0) {
        console.error('No playlists available to refresh');
        return;
    }

    // Reset shuffle state
    isShuffled = false;
    originalSongOrder = null;
    const shuffleBtn = document.querySelector('.featured-shuffle');
    if (shuffleBtn) {
        shuffleBtn.setAttribute('data-shuffled', 'false');
    }

    // Select new random playlist
    const newPlaylist = selectRandomPlaylist(playlistsData);

    if (newPlaylist) {
        currentFeaturedPlaylist = newPlaylist;

        // Add fade transition (optional)
        const container = document.querySelector('.featured-container');
        container.style.opacity = '0.5';

        setTimeout(() => {
            renderFeaturedPlaylist(newPlaylist);
            setupFeaturedLikeListeners();
            container.style.opacity = '1';
        }, 150);
    }
}

/**
 * Sets up all event listeners for the Featured Page
 */
function setupFeaturedPageListeners() {
    // Shuffle button
    const shuffleBtn = document.querySelector('.featured-shuffle');
    if (shuffleBtn) {
        shuffleBtn.addEventListener('click', toggleFeaturedShuffle);
    }

    // Refresh button
    const refreshBtn = document.querySelector('.refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshFeaturedPlaylist);
    }

    // Song like buttons (attached after rendering)
    setupFeaturedLikeListeners();
}

/**
 * Displays an error message when data fails to load
 */
function displayErrorMessage() {
    const container = document.querySelector('.featured-container');
    container.innerHTML = `
        <div style="text-align: center; color: #ff3b30; padding: 3rem;">
            <h2>Failed to load playlists</h2>
            <p>Please try again later or <a href="index.html">view all playlists</a>.</p>
        </div>
    `;
}

/**
 * Main initialization function for the Featured Page
 */
async function loadFeaturedPage() {
    try {
        // Fetch playlist data
        const response = await fetch('data/data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        playlistsData = await response.json();

        // Select random playlist
        const selectedPlaylist = selectRandomPlaylist(playlistsData);

        if (!selectedPlaylist) {
            throw new Error('No playlists available');
        }

        // Store as current featured playlist
        currentFeaturedPlaylist = selectedPlaylist;

        // Render the playlist
        renderFeaturedPlaylist(selectedPlaylist);

        // Set up event listeners
        setupFeaturedPageListeners();

    } catch (error) {
        console.error('Error loading featured page:', error);
        displayErrorMessage();
    }
}

// Initialize the featured page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    loadFeaturedPage();
});
