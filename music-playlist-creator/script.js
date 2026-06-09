// Global variable to store playlist data
let playlistsData = [];

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

    // Create likes container
    const likesDiv = document.createElement('div');
    likesDiv.className = 'playlist-likes';

    // Create heart icon
    const heartIcon = document.createElement('span');
    heartIcon.className = 'heart-icon';
    heartIcon.textContent = '♡';

    // Create like count
    const likeCount = document.createElement('span');
    likeCount.className = 'like-count';
    likeCount.textContent = playlist.likeCount;

    // Append heart and count to likes div
    likesDiv.appendChild(heartIcon);
    likesDiv.appendChild(likeCount);

    // Append all elements to card
    card.appendChild(coverImg);
    card.appendChild(infoDiv);
    card.appendChild(likesDiv);

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

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    loadPlaylists();
});
