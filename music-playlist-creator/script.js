// Global variables to store playlist data and state
let playlistsData = [];
let currentPlaylist = null;
let isShuffled = false;
let originalSongOrder = null;

// AI API Configuration
const AI_API_CONFIG = {
    endpoint: 'https://api.openai.com/v1/chat/completions', // Default to OpenAI - can be changed
    apiKey: '', // TO BE SET BY USER
    timeout: 10000 // 10 seconds
};

/**
 * Fetches playlist data from data.json
 */
async function loadPlaylists() {
    try {
        const response = await fetch('data/data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        playlistsData = await response.json();
        renderPlaylistCards(playlistsData);

        // Set up event listeners after cards are rendered
        setupPlaylistCardListeners();
        setupPlaylistLikeListeners();
        setupModalCloseListeners();
    } catch (error) {
        console.error('Error loading playlists:', error);
        displayErrorMessage('Failed to load playlists. Please try again later.');
    }
}

/**
 * Renders playlist cards to the DOM
 * @param {Array} playlists - Array of playlist objects
 */
function renderPlaylistCards(playlists) {
    const container = document.querySelector('.playlist-cards');

    // Clear existing content
    container.innerHTML = '';

    // Check if playlists array is empty
    if (!playlists || playlists.length === 0) {
        displayEmptyMessage(container);
        return;
    }

    // Create and append a card for each playlist
    playlists.forEach(playlist => {
        const card = createPlaylistCard(playlist);
        container.appendChild(card);
    });
}

/**
 * Creates a single playlist card element
 * @param {Object} playlist - Playlist object containing all playlist data
 * @returns {HTMLElement} - The created article element
 */
function createPlaylistCard(playlist) {
    // Create card container
    const card = document.createElement('article');
    card.className = 'playlist-card';
    card.setAttribute('data-playlist-id', playlist.playlistID);

    // Create cover image
    const coverImg = document.createElement('img');
    coverImg.src = playlist.playlistCoverUrl;
    coverImg.alt = `${playlist.playlistName} cover`;
    coverImg.className = 'playlist-cover';

    // Create info container
    const infoDiv = document.createElement('div');
    infoDiv.className = 'playlist-info';

    // Create title
    const title = document.createElement('h2');
    title.className = 'playlist-title';
    title.textContent = playlist.playlistName;

    // Create creator
    const creator = document.createElement('p');
    creator.className = 'playlist-creator';
    creator.textContent = playlist.playlistCreator;

    // Append title and creator to info div
    infoDiv.appendChild(title);
    infoDiv.appendChild(creator);

    // Create likes button
    const likesBtn = document.createElement('button');
    likesBtn.className = 'playlist-likes-btn';
    likesBtn.setAttribute('aria-label', 'Like playlist');
    likesBtn.setAttribute('data-liked', playlist.liked.toString());

    // Create heart icon
    const heartIcon = document.createElement('span');
    heartIcon.className = 'heart-icon';
    heartIcon.textContent = playlist.liked ? '♥' : '♡';

    // Create like count
    const likeCount = document.createElement('span');
    likeCount.className = 'like-count';
    likeCount.textContent = playlist.likeCount;

    // Append heart and count to likes button
    likesBtn.appendChild(heartIcon);
    likesBtn.appendChild(likeCount);

    // Append all elements to card
    card.appendChild(coverImg);
    card.appendChild(infoDiv);
    card.appendChild(likesBtn);

    return card;
}

/**
 * Creates a single track list item element
 * @param {Object} song - Song object containing song data
 * @returns {HTMLElement} - The created list item element
 */
function createTrackItem(song) {
    // Create list item container
    const trackItem = document.createElement('li');
    trackItem.className = 'track-item';
    trackItem.setAttribute('data-track-id', song.songID);

    // Create track cover image
    const trackCover = document.createElement('img');
    trackCover.src = song.songCoverUrl;
    trackCover.alt = `${song.songTitle} cover`;
    trackCover.className = 'track-cover';

    // Create track info container
    const trackInfo = document.createElement('div');
    trackInfo.className = 'track-info';

    // Create track title
    const trackTitle = document.createElement('h3');
    trackTitle.className = 'track-title';
    trackTitle.textContent = song.songTitle;

    // Create track artist
    const trackArtist = document.createElement('p');
    trackArtist.className = 'track-artist';
    trackArtist.textContent = song.songArtist;

    // Append title and artist to info container
    trackInfo.appendChild(trackTitle);
    trackInfo.appendChild(trackArtist);

    // Create like button
    const likeBtn = document.createElement('button');
    likeBtn.className = 'like-btn';
    likeBtn.setAttribute('aria-label', 'Like song');
    likeBtn.setAttribute('data-liked', song.liked.toString());

    // Create heart icon
    const heartIcon = document.createElement('span');
    heartIcon.className = 'heart-icon';
    heartIcon.textContent = song.liked ? '♥' : '♡';

    // Create like count
    const likeCount = document.createElement('span');
    likeCount.className = 'like-count';
    likeCount.textContent = song.likeCount;

    // Append heart and count to button
    likeBtn.appendChild(heartIcon);
    likeBtn.appendChild(likeCount);

    // Append all elements to track item
    trackItem.appendChild(trackCover);
    trackItem.appendChild(trackInfo);
    trackItem.appendChild(likeBtn);

    return trackItem;
}

/**
 * Populates the modal with playlist details and track list
 * @param {Object} playlist - Playlist object containing all playlist data
 */
function populatePlaylistModal(playlist) {
    // Update playlist cover image
    const modalCover = document.querySelector('.modal-playlist-cover');
    modalCover.src = playlist.playlistCoverUrl;
    modalCover.alt = `${playlist.playlistName} cover`;

    // Update playlist title
    const modalTitle = document.querySelector('.modal-playlist-title');
    modalTitle.textContent = playlist.playlistName;

    // Update playlist creator
    const modalCreator = document.querySelector('.modal-playlist-creator');
    modalCreator.textContent = `by ${playlist.playlistCreator}`;

    // Clear existing track list
    const trackList = document.querySelector('.track-list');
    trackList.innerHTML = '';

    // Create and append track items
    playlist.songs.forEach(song => {
        const trackItem = createTrackItem(song);
        trackList.appendChild(trackItem);
    });
}

/**
 * Builds the AI prompt for playlist description generation
 * @param {Object} playlist - Playlist object
 * @returns {string} - Formatted prompt string
 */
function buildDescriptionPrompt(playlist) {
    const songList = playlist.songs
        .map(song => `- "${song.songTitle}" by ${song.songArtist}`)
        .join('\n');

    return `You are a music curator writing playlist descriptions for a music streaming app.

Generate a 2-3 sentence description for the following playlist:

Playlist: "${playlist.playlistName}"
Creator: ${playlist.playlistCreator}
Songs:
${songList}

Write a description that:
1. Captures the overall vibe and mood (based on song titles and artists)
2. Suggests use-cases or listening scenarios
3. Highlights notable artists or musical styles
4. Uses conversational, enthusiastic tone
5. Is 40-80 words total

Do NOT:
- List songs individually in the description
- Use generic marketing language
- Include technical music terms
- Be repetitive or clichéd

Description:`;
}

/**
 * Calls AI API to generate playlist description
 * @param {Object} playlist - Playlist object
 * @returns {Promise<string>} - Generated description
 * @throws {Error} - User-friendly error message
 */
async function getPlaylistDescription(playlist) {
    // Check cache first
    if (playlist.cachedDescription) {
        return playlist.cachedDescription;
    }

    // Check if API key is set
    if (!AI_API_CONFIG.apiKey) {
        throw new Error('API key not configured. Please set your AI API key.');
    }

    // Build prompt
    const prompt = buildDescriptionPrompt(playlist);

    // Set up timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AI_API_CONFIG.timeout);

    try {
        // Call AI API (OpenAI format - adjust for other APIs)
        const response = await fetch(AI_API_CONFIG.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AI_API_CONFIG.apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [{
                    role: 'user',
                    content: prompt
                }],
                max_tokens: 150,
                temperature: 0.7
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Handle HTTP errors
        if (!response.ok) {
            if (response.status === 429) {
                throw new Error('Too many requests. Please wait a moment and try again.');
            } else if (response.status >= 500) {
                throw new Error('Server error. Please try again later.');
            } else if (response.status === 401 || response.status === 403) {
                throw new Error('API authentication failed. Check your API key.');
            } else {
                throw new Error('Failed to generate description. Please try again.');
            }
        }

        // Parse response
        const data = await response.json();

        // Extract description (OpenAI format - adjust for other APIs)
        let description = data.choices?.[0]?.message?.content || '';
        description = description.trim();

        // Validate description
        if (!description || description.length < 10) {
            throw new Error('Unable to generate description at this time.');
        }

        // Cache in memory
        playlist.cachedDescription = description;

        return description;

    } catch (error) {
        clearTimeout(timeoutId);

        // Handle specific error types
        if (error.name === 'AbortError') {
            throw new Error('Request timed out. Please try again.');
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            throw new Error('Network error. Check your connection and try again.');
        } else {
            // Re-throw error with message (already user-friendly)
            throw error;
        }
    }
}

/**
 * Handles "Get Description" button click
 */
async function handleGetDescription() {
    if (!currentPlaylist) {
        console.error('No playlist is currently open');
        return;
    }

    const button = document.querySelector('.get-description-btn');
    const descriptionElem = document.querySelector('.playlist-description');
    const errorElem = document.querySelector('.description-error');

    // Reset UI
    descriptionElem.setAttribute('hidden', '');
    errorElem.setAttribute('hidden', '');

    // Show loading state
    button.disabled = true;
    button.classList.add('loading');
    const originalText = button.querySelector('.button-text').textContent;
    button.querySelector('.button-text').textContent = 'Generating';

    try {
        // Call API
        const description = await getPlaylistDescription(currentPlaylist);

        // Display description
        descriptionElem.textContent = description;
        descriptionElem.removeAttribute('hidden');

        // Hide button after successful generation
        button.style.display = 'none';

    } catch (error) {
        console.error('Error generating description:', error);

        // Show error message
        errorElem.textContent = error.message;
        errorElem.removeAttribute('hidden');

    } finally {
        // Reset loading state
        button.disabled = false;
        button.classList.remove('loading');
        button.querySelector('.button-text').textContent = originalText;
    }
}

/**
 * Sets up click event listener for "Get Description" button
 */
function setupDescriptionListener() {
    const button = document.querySelector('.get-description-btn');

    if (button) {
        button.addEventListener('click', handleGetDescription);
    }
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
 * Toggles shuffle state for the current playlist
 */
function toggleShuffle() {
    if (!currentPlaylist) {
        console.error('No playlist is currently open');
        return;
    }

    const shuffleBtn = document.querySelector('.shuffle-btn');
    const trackList = document.querySelector('.track-list');

    if (!isShuffled) {
        // SHUFFLE ON: Save original order and shuffle
        originalSongOrder = [...currentPlaylist.songs];
        const shuffled = shuffleArray(currentPlaylist.songs);

        // Re-render track list with shuffled order
        trackList.innerHTML = '';
        shuffled.forEach(song => {
            const trackItem = createTrackItem(song);
            trackList.appendChild(trackItem);
        });

        // Update state and button
        isShuffled = true;
        shuffleBtn.setAttribute('data-shuffled', 'true');

        // Re-attach like listeners after re-rendering
        setupSongLikeListeners();
    } else {
        // SHUFFLE OFF: Restore original order
        trackList.innerHTML = '';
        originalSongOrder.forEach(song => {
            const trackItem = createTrackItem(song);
            trackList.appendChild(trackItem);
        });

        // Update state and button
        isShuffled = false;
        shuffleBtn.setAttribute('data-shuffled', 'false');

        // Re-attach like listeners after re-rendering
        setupSongLikeListeners();
    }
}

/**
 * Sets up click event listener for shuffle button
 */
function setupShuffleListener() {
    const shuffleBtn = document.querySelector('.shuffle-btn');

    if (shuffleBtn) {
        shuffleBtn.addEventListener('click', toggleShuffle);
    }
}

/**
 * Toggles the like state of a playlist
 * @param {number} playlistID - ID of the playlist to toggle
 * @param {HTMLElement} buttonElement - The like button that was clicked
 */
function togglePlaylistLike(playlistID, buttonElement) {
    // 1. Get current state from button
    const currentLikedState = buttonElement.getAttribute('data-liked') === 'true';

    // 2. Find playlist in data
    const playlist = playlistsData.find(p => p.playlistID === playlistID);

    if (!playlist) {
        console.error('Playlist not found:', playlistID);
        return;
    }

    // 3. Get heart icon and like count elements
    const heartIcon = buttonElement.querySelector('.heart-icon');
    const likeCountSpan = buttonElement.querySelector('.like-count');

    // 4. Toggle based on current state
    if (!currentLikedState) {
        // LIKE BRANCH: Unliked → Liked
        playlist.liked = true;
        playlist.likeCount = playlist.likeCount + 1;
        buttonElement.setAttribute('data-liked', 'true');
        heartIcon.textContent = '♥';
    } else {
        // UNLIKE BRANCH: Liked → Unliked
        playlist.liked = false;
        playlist.likeCount = Math.max(0, playlist.likeCount - 1);
        buttonElement.setAttribute('data-liked', 'false');
        heartIcon.textContent = '♡';
    }

    // 5. Update like count display
    likeCountSpan.textContent = playlist.likeCount;
}

/**
 * Toggles the like state of a song in the modal
 * @param {number} playlistID - ID of the playlist containing the song
 * @param {number} songID - ID of the song to toggle
 * @param {HTMLElement} buttonElement - The like button that was clicked
 */
function toggleSongLike(playlistID, songID, buttonElement) {
    // Get current state from button
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
 * Sets up click event listeners for song like buttons in the modal
 */
function setupSongLikeListeners() {
    const likeButtons = document.querySelectorAll('.like-btn');

    likeButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            // Prevent event bubbling
            event.stopPropagation();

            // Get song ID from parent track item
            const trackItem = button.closest('.track-item');
            const songID = parseInt(trackItem.getAttribute('data-track-id'));

            // Get playlist ID from current playlist
            if (!currentPlaylist) {
                console.error('No playlist is currently open');
                return;
            }

            // Toggle the like
            toggleSongLike(currentPlaylist.playlistID, songID, button);
        });
    });
}

/**
 * Sets up click event listeners for playlist like buttons
 */
function setupPlaylistLikeListeners() {
    const likeButtons = document.querySelectorAll('.playlist-likes-btn');

    likeButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            // Prevent event from bubbling to card click (which opens modal)
            event.stopPropagation();

            // Get playlist ID from parent card
            const card = button.closest('.playlist-card');
            const playlistID = parseInt(card.getAttribute('data-playlist-id'));

            // Toggle the like
            togglePlaylistLike(playlistID, button);
        });
    });
}

/**
 * Displays a message when no playlists are found
 * @param {HTMLElement} container - The container element to append the message to
 */
function displayEmptyMessage(container) {
    const message = document.createElement('div');
    message.className = 'empty-message';
    message.innerHTML = `
        <p style="text-align: center; color: #6e6e73; font-size: 1.25rem; padding: 3rem;">
            No playlists found. Add some playlists to get started!
        </p>
    `;
    container.appendChild(message);
}

/**
 * Displays an error message when data fails to load
 * @param {string} errorText - The error message to display
 */
function displayErrorMessage(errorText) {
    const container = document.querySelector('.playlist-cards');
    container.innerHTML = `
        <div style="text-align: center; color: #ff3b30; font-size: 1.25rem; padding: 3rem;">
            <p>${errorText}</p>
        </div>
    `;
}

/**
 * Opens the modal and displays playlist details
 * @param {Object} playlist - The playlist object to display
 */
function openModal(playlist) {
    const modal = document.getElementById('playlistModal');

    // Store current playlist for like handlers and shuffle
    currentPlaylist = playlist;

    // Populate modal with playlist data
    populatePlaylistModal(playlist);

    // Set up event listeners
    setupSongLikeListeners();
    setupShuffleListener();
    setupDescriptionListener();

    // Reset description UI
    const descriptionBtn = document.querySelector('.get-description-btn');
    const descriptionElem = document.querySelector('.playlist-description');
    const errorElem = document.querySelector('.description-error');

    if (descriptionBtn) descriptionBtn.style.display = 'inline-flex';
    if (descriptionElem) descriptionElem.setAttribute('hidden', '');
    if (errorElem) errorElem.setAttribute('hidden', '');

    // Show cached description if available
    if (playlist.cachedDescription) {
        descriptionElem.textContent = playlist.cachedDescription;
        descriptionElem.removeAttribute('hidden');
        descriptionBtn.style.display = 'none';
    }

    // Show the modal
    modal.removeAttribute('hidden');

    // Disable page scrolling
    document.body.style.overflow = 'hidden';
}

/**
 * Closes the modal and re-enables scrolling
 */
function closeModal() {
    const modal = document.getElementById('playlistModal');
    const shuffleBtn = document.querySelector('.shuffle-btn');

    // Hide the modal
    modal.setAttribute('hidden', '');

    // Re-enable page scrolling
    document.body.style.overflow = '';

    // Reset shuffle state
    isShuffled = false;
    originalSongOrder = null;
    if (shuffleBtn) {
        shuffleBtn.setAttribute('data-shuffled', 'false');
    }
}

/**
 * Sets up event listeners for playlist cards
 */
function setupPlaylistCardListeners() {
    const playlistCards = document.querySelectorAll('.playlist-card');

    playlistCards.forEach(card => {
        card.addEventListener('click', () => {
            const playlistId = parseInt(card.getAttribute('data-playlist-id'));
            const playlist = playlistsData.find(p => p.playlistID === playlistId);

            if (playlist) {
                openModal(playlist);
            }
        });
    });
}

/**
 * Sets up event listeners for modal close actions
 */
function setupModalCloseListeners() {
    const modal = document.getElementById('playlistModal');
    const backdrop = document.querySelector('.modal-backdrop');
    const closeBtn = document.querySelector('.close-btn');

    // Close when clicking backdrop
    backdrop.addEventListener('click', closeModal);

    // Close when clicking close button
    closeBtn.addEventListener('click', closeModal);

    // Close when pressing Escape key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !modal.hasAttribute('hidden')) {
            closeModal();
        }
    });
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    loadPlaylists();
});
