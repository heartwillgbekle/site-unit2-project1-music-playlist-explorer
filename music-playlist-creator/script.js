// Global variables to store playlist data and state
let playlistsData = [];
let currentPlaylist = null;
let isShuffled = false;
let originalSongOrder = null;

// CRUD feature state
let deletionStack = [];
let nextPlaylistID = 9; // Start after existing 8 playlists
let undoTimeout = null;
let currentFormMode = 'create'; // 'create' or 'edit'
let currentEditingID = null;

// Search & Sort state
let currentSearch = '';
let currentSort = 'date'; // 'name', 'likes', or 'date'
let searchTimeout = null;

// AI API Configuration
// API key is loaded from config.js (which is gitignored)
const AI_API_CONFIG = {
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    apiKey: typeof API_KEY !== 'undefined' ? API_KEY : '',
    model: 'google/gemma-4-31b-it:free',
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

    // Create action buttons container (Edit/Delete)
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'card-actions';

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.className = 'card-action-btn edit-btn';
    editBtn.setAttribute('aria-label', 'Edit playlist');
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openPlaylistForm('edit', playlist.playlistID);
    });

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'card-action-btn delete-btn';
    deleteBtn.setAttribute('aria-label', 'Delete playlist');
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showDeleteConfirmation(playlist.playlistID);
    });

    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(deleteBtn);

    // Append all elements to card
    card.appendChild(actionsDiv);
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
        // Call OpenRouter API
        const response = await fetch(AI_API_CONFIG.endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AI_API_CONFIG.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: AI_API_CONFIG.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a music curator writing playlist descriptions for a music streaming app.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
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

        // Extract description from OpenRouter response
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

// ===== PLAYLIST MANAGEMENT (CRUD) FUNCTIONS =====

/**
 * Opens the playlist form modal in create or edit mode
 * @param {string} mode - 'create' or 'edit'
 * @param {number|null} playlistID - ID of playlist to edit (null for create)
 */
function openPlaylistForm(mode = 'create', playlistID = null) {
    const modal = document.getElementById('playlistFormModal');
    const form = document.getElementById('playlistForm');
    const title = document.querySelector('.form-title');
    const submitBtn = form.querySelector('button[type="submit"] .submit-text');

    currentFormMode = mode;
    currentEditingID = playlistID;

    // Update UI based on mode
    if (mode === 'edit') {
        const playlist = playlistsData.find(p => p.playlistID === playlistID);
        if (!playlist) return;

        title.textContent = `Edit: ${playlist.playlistName}`;
        submitBtn.textContent = 'Save Changes';

        // Pre-fill form
        document.getElementById('playlistName').value = playlist.playlistName;
        document.getElementById('playlistCreator').value = playlist.playlistCreator;
        document.getElementById('playlistCoverUrl').value = playlist.playlistCoverUrl || '';

        // Pre-fill songs
        const songsContainer = document.getElementById('songsContainer');
        songsContainer.innerHTML = '';
        playlist.songs.forEach((song, index) => {
            addSongRow(song.songTitle, song.songArtist, index);
        });
    } else {
        title.textContent = 'Create New Playlist';
        submitBtn.textContent = 'Create Playlist';
        form.reset();

        // Reset to one empty song row
        const songsContainer = document.getElementById('songsContainer');
        songsContainer.innerHTML = '';
        addSongRow('', '', 0);
    }

    // Show modal
    modal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
}

/**
 * Adds a song input row to the form
 * @param {string} title - Pre-filled title
 * @param {string} artist - Pre-filled artist
 * @param {number} index - Row index
 */
function addSongRow(title = '', artist = '', index = 0) {
    const songsContainer = document.getElementById('songsContainer');

    const songRow = document.createElement('div');
    songRow.className = 'song-row';
    songRow.setAttribute('data-song-index', index);

    songRow.innerHTML = `
        <div class="song-inputs">
            <input type="text" name="songTitle[]" placeholder="Song Title *"
                   required minlength="1" maxlength="100" value="${title}">
            <input type="text" name="songArtist[]" placeholder="Artist *"
                   required minlength="1" maxlength="100" value="${artist}">
        </div>
        <button type="button" class="remove-song-btn" aria-label="Remove song">
            <span>×</span>
        </button>
    `;

    // Add remove handler
    const removeBtn = songRow.querySelector('.remove-song-btn');
    removeBtn.addEventListener('click', () => {
        if (songsContainer.children.length > 1) {
            songRow.remove();
        }
    });

    songsContainer.appendChild(songRow);
}

/**
 * Closes the playlist form modal
 */
function closePlaylistForm() {
    const modal = document.getElementById('playlistFormModal');
    modal.setAttribute('hidden', '');
    document.body.style.overflow = '';

    // Reset form
    document.getElementById('playlistForm').reset();
    currentFormMode = 'create';
    currentEditingID = null;
}

/**
 * Validates form data
 * @param {FormData} formData - Form data to validate
 * @returns {Object} - {valid: boolean, errors: object}
 */
function validatePlaylistForm(formData) {
    const errors = {};

    const name = formData.get('playlistName').trim();
    const creator = formData.get('playlistCreator').trim();
    const songTitles = formData.getAll('songTitle[]');
    const songArtists = formData.getAll('songArtist[]');

    // Validate name
    if (name.length < 3 || name.length > 50) {
        errors.name = 'Playlist name must be 3-50 characters';
    }

    // Validate creator
    if (creator.length < 2 || creator.length > 30) {
        errors.creator = 'Creator name must be 2-30 characters';
    }

    // Validate songs
    if (songTitles.length === 0) {
        errors.songs = 'At least one song is required';
    } else if (songTitles.length > 20) {
        errors.songs = 'Maximum 20 songs allowed';
    } else {
        for (let i = 0; i < songTitles.length; i++) {
            if (!songTitles[i].trim() || !songArtists[i].trim()) {
                errors.songs = 'Each song must have a title and artist';
                break;
            }
        }
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors
    };
}

/**
 * Handles form submission (create or edit)
 * @param {Event} event - Submit event
 */
async function handlePlaylistFormSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    // Validate
    const validation = validatePlaylistForm(formData);

    // Clear previous errors
    document.querySelectorAll('.form-error').forEach(el => el.textContent = '');

    if (!validation.valid) {
        // Show errors
        if (validation.errors.name) {
            document.getElementById('nameError').textContent = validation.errors.name;
        }
        if (validation.errors.creator) {
            document.getElementById('creatorError').textContent = validation.errors.creator;
        }
        if (validation.errors.songs) {
            document.getElementById('songsError').textContent = validation.errors.songs;
        }
        return;
    }

    // Build playlist object
    const playlistData = {
        playlistName: formData.get('playlistName').trim(),
        playlistCreator: formData.get('playlistCreator').trim(),
        playlistCoverUrl: formData.get('playlistCoverUrl').trim() || 'assets/img/playlist.png',
        songs: []
    };

    // Build songs array
    const songTitles = formData.getAll('songTitle[]');
    const songArtists = formData.getAll('songArtist[]');

    for (let i = 0; i < songTitles.length; i++) {
        playlistData.songs.push({
            songID: Date.now() + i, // Temporary ID
            songTitle: songTitles[i].trim(),
            songArtist: songArtists[i].trim(),
            songCoverUrl: 'assets/img/song.png',
            likeCount: 0,
            liked: false
        });
    }

    // Create or update
    if (currentFormMode === 'create') {
        createNewPlaylist(playlistData);
    } else {
        editPlaylist(currentEditingID, playlistData);
    }

    closePlaylistForm();
}

/**
 * Creates a new playlist
 * @param {Object} playlistData - Playlist data
 */
function createNewPlaylist(playlistData) {
    const newPlaylist = {
        playlistID: nextPlaylistID++,
        playlistName: playlistData.playlistName,
        playlistCreator: playlistData.playlistCreator,
        playlistCoverUrl: playlistData.playlistCoverUrl,
        likeCount: 0,
        liked: false,
        songs: playlistData.songs,
        cachedDescription: null
    };

    // Add to data
    playlistsData.push(newPlaylist);

    // Re-render grid with current search/sort
    renderFilteredAndSortedPlaylists();

    // Highlight new card
    const newCard = document.querySelector(`[data-playlist-id="${newPlaylist.playlistID}"]`);
    if (newCard) {
        newCard.classList.add('fade-in', 'highlight');
        newCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

        setTimeout(() => {
            newCard.classList.remove('fade-in', 'highlight');
        }, 2000);
    }

    showToast(`"${newPlaylist.playlistName}" created successfully!`, false);
}

/**
 * Edits an existing playlist
 * @param {number} playlistID - ID of playlist to edit
 * @param {Object} updatedData - Updated playlist data
 */
function editPlaylist(playlistID, updatedData) {
    const playlist = playlistsData.find(p => p.playlistID === playlistID);
    if (!playlist) return;

    // Check if name or songs changed (clear cached description)
    const nameChanged = playlist.playlistName !== updatedData.playlistName;
    const songsChanged = JSON.stringify(playlist.songs) !== JSON.stringify(updatedData.songs);

    if (nameChanged || songsChanged) {
        playlist.cachedDescription = null;
    }

    // Update playlist
    playlist.playlistName = updatedData.playlistName;
    playlist.playlistCreator = updatedData.playlistCreator;
    playlist.playlistCoverUrl = updatedData.playlistCoverUrl;
    playlist.songs = updatedData.songs;

    // Re-render grid with current search/sort
    renderFilteredAndSortedPlaylists();

    // Highlight updated card
    const updatedCard = document.querySelector(`[data-playlist-id="${playlistID}"]`);
    if (updatedCard) {
        updatedCard.classList.add('highlight');
        updatedCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

        setTimeout(() => {
            updatedCard.classList.remove('highlight');
        }, 2000);
    }

    // Update modal if open
    if (currentPlaylist && currentPlaylist.playlistID === playlistID) {
        currentPlaylist = playlist;
        populatePlaylistModal(playlist);
    }

    showToast(`"${playlist.playlistName}" updated successfully!`, false);
}

/**
 * Shows delete confirmation dialog
 * @param {number} playlistID - ID of playlist to delete
 */
function showDeleteConfirmation(playlistID) {
    const playlist = playlistsData.find(p => p.playlistID === playlistID);
    if (!playlist) return;

    const dialog = document.getElementById('confirmDialog');
    const message = dialog.querySelector('.confirm-message');

    message.textContent = `Are you sure you want to delete "${playlist.playlistName}"? This action cannot be undone.`;

    // Show dialog
    dialog.removeAttribute('hidden');

    // Set up confirmation handler (one-time)
    const confirmBtn = dialog.querySelector('.confirm-delete');
    const cancelBtn = dialog.querySelector('.confirm-cancel');

    const handleConfirm = () => {
        deletePlaylist(playlistID);
        dialog.setAttribute('hidden', '');
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
    };

    const handleCancel = () => {
        dialog.setAttribute('hidden', '');
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
    };

    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
}

/**
 * Deletes a playlist with undo option
 * @param {number} playlistID - ID of playlist to delete
 */
function deletePlaylist(playlistID) {
    const index = playlistsData.findIndex(p => p.playlistID === playlistID);
    if (index === -1) return;

    const playlist = playlistsData[index];

    // Store for undo
    deletionStack.push({ playlist, index, timestamp: Date.now() });

    // Remove from data
    playlistsData.splice(index, 1);

    // Fade out and remove
    const card = document.querySelector(`[data-playlist-id="${playlistID}"]`);
    if (card) {
        card.classList.add('fade-out');
        setTimeout(() => {
            renderFilteredAndSortedPlaylists();
        }, 300);
    } else {
        renderFilteredAndSortedPlaylists();
    }

    // Close modal if it's for this playlist
    if (currentPlaylist && currentPlaylist.playlistID === playlistID) {
        closeModal();
    }

    // Show undo toast
    showToast(`"${playlist.playlistName}" deleted.`, true);

    // Set timeout to make deletion permanent
    if (undoTimeout) clearTimeout(undoTimeout);
    undoTimeout = setTimeout(() => {
        deletionStack = [];
    }, 3000);
}

/**
 * Undoes the most recent deletion
 */
function undoDelete() {
    if (deletionStack.length === 0) return;

    const { playlist, index } = deletionStack.pop();

    // Re-add playlist at original index
    playlistsData.splice(index, 0, playlist);

    // Re-render with current search/sort
    renderFilteredAndSortedPlaylists();

    // Highlight restored card
    const restoredCard = document.querySelector(`[data-playlist-id="${playlist.playlistID}"]`);
    if (restoredCard) {
        restoredCard.classList.add('fade-in', 'highlight');
        restoredCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

        setTimeout(() => {
            restoredCard.classList.remove('fade-in', 'highlight');
        }, 2000);
    }

    // Hide toast
    const toast = document.getElementById('undoToast');
    toast.setAttribute('hidden', '');

    // Clear timeout
    if (undoTimeout) clearTimeout(undoTimeout);
}

/**
 * Shows a toast notification
 * @param {string} message - Toast message
 * @param {boolean} showUndo - Whether to show undo button
 */
function showToast(message, showUndo = false) {
    const toast = document.getElementById('undoToast');
    const messageSpan = toast.querySelector('.toast-message');
    const undoBtn = toast.querySelector('.toast-undo-btn');

    messageSpan.textContent = message;
    undoBtn.style.display = showUndo ? 'block' : 'none';

    toast.removeAttribute('hidden');

    if (!showUndo) {
        setTimeout(() => {
            toast.setAttribute('hidden', '');
        }, 3000);
    }
}

/**
 * Sets up event listeners for CRUD features
 */
function setupCRUDListeners() {
    // FAB button
    const fabBtn = document.querySelector('.fab-button');
    if (fabBtn) {
        fabBtn.addEventListener('click', () => openPlaylistForm('create'));
    }

    // Form close button
    const formCloseBtn = document.querySelector('.form-close-btn');
    if (formCloseBtn) {
        formCloseBtn.addEventListener('click', closePlaylistForm);
    }

    // Form cancel button
    const formCancelBtn = document.querySelector('.form-cancel-btn');
    if (formCancelBtn) {
        formCancelBtn.addEventListener('click', closePlaylistForm);
    }

    // Form submit
    const playlistForm = document.getElementById('playlistForm');
    if (playlistForm) {
        playlistForm.addEventListener('submit', handlePlaylistFormSubmit);
    }

    // Add song button
    const addSongBtn = document.querySelector('.add-song-btn');
    if (addSongBtn) {
        addSongBtn.addEventListener('click', () => {
            const songsContainer = document.getElementById('songsContainer');
            const currentCount = songsContainer.children.length;
            if (currentCount < 20) {
                addSongRow('', '', currentCount);
            }
        });
    }

    // Undo button
    const undoBtn = document.querySelector('.toast-undo-btn');
    if (undoBtn) {
        undoBtn.addEventListener('click', undoDelete);
    }
}

// ===== SEARCH & SORT FUNCTIONS =====

/**
 * Filters playlists by search query
 * @param {string} query - Search query (case-insensitive)
 * @returns {Array} - Filtered playlists
 */
function filterPlaylists(query) {
    if (!query || query.trim() === '') {
        return playlistsData;
    }

    const lowerQuery = query.toLowerCase().trim();

    return playlistsData.filter(playlist => {
        const name = playlist.playlistName.toLowerCase();
        const creator = playlist.playlistCreator.toLowerCase();
        return name.includes(lowerQuery) || creator.includes(lowerQuery);
    });
}

/**
 * Sorts playlists by specified criteria
 * @param {Array} playlists - Playlists to sort
 * @param {string} sortBy - 'name', 'likes', or 'date'
 * @returns {Array} - Sorted playlists (new array)
 */
function sortPlaylists(playlists, sortBy) {
    const sorted = [...playlists];

    switch (sortBy) {
        case 'name':
            sorted.sort((a, b) => a.playlistName.localeCompare(b.playlistName));
            break;
        case 'likes':
            sorted.sort((a, b) => {
                if (b.likeCount !== a.likeCount) {
                    return b.likeCount - a.likeCount;
                }
                // Tie-breaker: alphabetical by name
                return a.playlistName.localeCompare(b.playlistName);
            });
            break;
        case 'date':
            sorted.sort((a, b) => b.playlistID - a.playlistID);
            break;
    }

    return sorted;
}

/**
 * Renders playlists with current search and sort applied
 */
function renderFilteredAndSortedPlaylists() {
    let filtered = filterPlaylists(currentSearch);
    let sorted = sortPlaylists(filtered, currentSort);

    if (sorted.length === 0 && currentSearch) {
        // Show empty state
        const container = document.querySelector('.playlist-cards');
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔍</div>
                <h3 class="empty-state-title">No playlists found</h3>
                <p class="empty-state-message">
                    No playlists match <span class="empty-state-query">"${currentSearch}"</span>
                </p>
                <a href="#" class="clear-search-link" id="clearSearchLink">Clear search</a>
            </div>
        `;

        // Add clear search link handler
        const clearLink = document.getElementById('clearSearchLink');
        if (clearLink) {
            clearLink.addEventListener('click', (e) => {
                e.preventDefault();
                clearSearch();
            });
        }
    } else {
        renderPlaylistCards(sorted);
        setupPlaylistCardListeners();
        setupPlaylistLikeListeners();
    }
}

/**
 * Handles search input with debouncing
 * @param {Event} event - Input event
 */
function handleSearchInput(event) {
    const query = event.target.value;
    currentSearch = query;

    // Show/hide clear button
    const clearBtn = document.getElementById('clearSearchBtn');
    if (query.length > 0) {
        clearBtn.removeAttribute('hidden');
    } else {
        clearBtn.setAttribute('hidden', '');
    }

    // Debounce search (300ms)
    if (searchTimeout) clearTimeout(searchTimeout);

    searchTimeout = setTimeout(() => {
        renderFilteredAndSortedPlaylists();
    }, 300);
}

/**
 * Clears search and shows all playlists
 */
function clearSearch() {
    currentSearch = '';
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearSearchBtn');

    if (searchInput) searchInput.value = '';
    if (clearBtn) clearBtn.setAttribute('hidden', '');

    renderFilteredAndSortedPlaylists();
}

/**
 * Handles sort option selection
 * @param {string} sortBy - 'name', 'likes', or 'date'
 */
function handleSortChange(sortBy) {
    currentSort = sortBy;

    // Update button text
    const sortBtn = document.getElementById('sortBtn');
    const sortLabel = sortBtn.querySelector('.sort-label');

    switch (sortBy) {
        case 'name':
            sortLabel.textContent = 'Sort: Name (A-Z)';
            break;
        case 'likes':
            sortLabel.textContent = 'Sort: Most Liked';
            break;
        case 'date':
            sortLabel.textContent = 'Sort: Date Added';
            break;
    }

    // Update active checkmark
    document.querySelectorAll('.sort-option').forEach(option => {
        if (option.getAttribute('data-sort') === sortBy) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    });

    // Close dropdown
    toggleSortDropdown(false);

    // Re-render with new sort
    renderFilteredAndSortedPlaylists();
}

/**
 * Toggles sort dropdown visibility
 * @param {boolean} show - Optional force show/hide
 */
function toggleSortDropdown(show) {
    const dropdown = document.getElementById('sortDropdown');
    const sortBtn = document.getElementById('sortBtn');

    if (show === undefined) {
        show = dropdown.hasAttribute('hidden');
    }

    if (show) {
        dropdown.removeAttribute('hidden');
        sortBtn.setAttribute('aria-expanded', 'true');
    } else {
        dropdown.setAttribute('hidden', '');
        sortBtn.setAttribute('aria-expanded', 'false');
    }
}

/**
 * Sets up event listeners for search and sort
 */
function setupSearchAndSortListeners() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearchInput);
    }

    // Clear search button
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', clearSearch);
    }

    // Sort button
    const sortBtn = document.getElementById('sortBtn');
    if (sortBtn) {
        sortBtn.addEventListener('click', () => toggleSortDropdown());
    }

    // Sort options
    const sortOptions = document.querySelectorAll('.sort-option');
    sortOptions.forEach(option => {
        option.addEventListener('click', () => {
            const sortBy = option.getAttribute('data-sort');
            handleSortChange(sortBy);
        });
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (event) => {
        const sortContainer = document.querySelector('.sort-container');
        if (sortContainer && !sortContainer.contains(event.target)) {
            toggleSortDropdown(false);
        }
    });
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    loadPlaylists();
    setupCRUDListeners();
    setupSearchAndSortListeners();
});
