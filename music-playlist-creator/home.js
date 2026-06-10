// Global variables
let playlistsData = [];
let currentPlaylist = null;
let currentSlideIndex = 0;
let autoRotateInterval = null;
let resumeTimeout = null;
let touchStartX = 0;
let touchEndX = 0;
let isShuffled = false;
let originalSongOrder = null;

// AI API Configuration
const AI_API_CONFIG = {
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    apiKey: typeof API_KEY !== 'undefined' ? API_KEY : '',
    model: 'google/gemma-4-31b-it:free',
    timeout: 10000
};

/**
 * Fetches playlist data from data.json
 */
async function loadCarouselData() {
    try {
        const response = await fetch('data/data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        playlistsData = await response.json();

        if (!playlistsData || playlistsData.length === 0) {
            throw new Error('No playlists found');
        }

        // Build carousel slides
        buildCarouselSlides(playlistsData);
        buildCarouselIndicators(playlistsData.length);

        // Show first slide
        showSlide(0);

        // Setup event listeners
        setupCarouselListeners();

        // Start auto-rotation
        startAutoRotate();

    } catch (error) {
        console.error('Error loading carousel data:', error);
        displayErrorMessage();
    }
}

/**
 * Builds carousel slides from playlist data
 * @param {Array} playlists - Array of playlist objects
 */
function buildCarouselSlides(playlists) {
    const wrapper = document.getElementById('carouselWrapper');
    wrapper.innerHTML = '';

    playlists.forEach((playlist, index) => {
        const slide = document.createElement('div');
        slide.className = 'carousel-slide';
        slide.setAttribute('data-playlist-id', playlist.playlistID);
        slide.setAttribute('data-slide-index', index);
        slide.setAttribute('aria-label', `Slide ${index + 1} of ${playlists.length}: ${playlist.playlistName}`);

        // Background image
        const bgImg = document.createElement('img');
        bgImg.className = 'carousel-bg';
        bgImg.src = playlist.playlistCoverUrl;
        bgImg.alt = `${playlist.playlistName} cover`;

        // Overlay with playlist name
        const overlay = document.createElement('div');
        overlay.className = 'carousel-overlay';

        const playlistName = document.createElement('h2');
        playlistName.className = 'carousel-playlist-name';
        playlistName.textContent = playlist.playlistName;

        overlay.appendChild(playlistName);
        slide.appendChild(bgImg);
        slide.appendChild(overlay);

        // Click handler to open modal
        slide.addEventListener('click', () => {
            handleSlideClick(playlist.playlistID);
        });

        wrapper.appendChild(slide);
    });
}

/**
 * Builds indicator dots for carousel
 * @param {number} count - Number of slides
 */
function buildCarouselIndicators(count) {
    const indicators = document.getElementById('carouselIndicators');
    indicators.innerHTML = '';

    for (let i = 0; i < count; i++) {
        const dot = document.createElement('button');
        dot.className = 'carousel-dot';
        dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
        dot.setAttribute('data-slide-index', i);

        if (i === 0) {
            dot.classList.add('active');
            dot.setAttribute('aria-current', 'true');
        }

        dot.addEventListener('click', () => {
            goToSlide(i);
            pauseAutoRotate();
        });

        indicators.appendChild(dot);
    }
}

/**
 * Shows a specific slide by index
 * @param {number} index - Slide index to show
 */
function showSlide(index) {
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.carousel-dot');

    if (slides.length === 0) return;

    // Wrap around
    if (index >= slides.length) {
        currentSlideIndex = 0;
    } else if (index < 0) {
        currentSlideIndex = slides.length - 1;
    } else {
        currentSlideIndex = index;
    }

    // Update slides
    slides.forEach((slide, i) => {
        slide.classList.remove('active', 'prev');
        if (i === currentSlideIndex) {
            slide.classList.add('active');
        } else if (i < currentSlideIndex) {
            slide.classList.add('prev');
        }
    });

    // Update dots
    dots.forEach((dot, i) => {
        if (i === currentSlideIndex) {
            dot.classList.add('active');
            dot.setAttribute('aria-current', 'true');
        } else {
            dot.classList.remove('active');
            dot.removeAttribute('aria-current');
        }
    });
}

/**
 * Advances to next slide
 */
function nextSlide() {
    showSlide(currentSlideIndex + 1);
}

/**
 * Goes to previous slide
 */
function prevSlide() {
    showSlide(currentSlideIndex - 1);
}

/**
 * Jumps to specific slide
 * @param {number} index - Target slide index
 */
function goToSlide(index) {
    showSlide(index);
}

/**
 * Starts auto-rotation interval
 */
function startAutoRotate() {
    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }

    clearInterval(autoRotateInterval);
    autoRotateInterval = setInterval(() => {
        nextSlide();
    }, 5000);
}

/**
 * Pauses auto-rotation and resumes after delay
 */
function pauseAutoRotate() {
    clearInterval(autoRotateInterval);
    clearTimeout(resumeTimeout);

    // Resume after 3 seconds of no interaction
    resumeTimeout = setTimeout(() => {
        startAutoRotate();
    }, 3000);
}

/**
 * Handles swipe gesture
 */
function handleSwipe() {
    const swipeDistance = touchStartX - touchEndX;
    const threshold = 50;

    if (Math.abs(swipeDistance) > threshold) {
        if (swipeDistance > 0) {
            nextSlide(); // Swipe left
        } else {
            prevSlide(); // Swipe right
        }
        pauseAutoRotate();
    }
}

/**
 * Handles slide click to open modal
 * @param {number} playlistID - ID of clicked playlist
 */
function handleSlideClick(playlistID) {
    const playlist = playlistsData.find(p => p.playlistID === playlistID);
    if (playlist) {
        openModal(playlist);
    }
}

/**
 * Sets up all carousel event listeners
 */
function setupCarouselListeners() {
    const carousel = document.querySelector('.carousel-container');
    const prevBtn = document.getElementById('carouselPrev');
    const nextBtn = document.getElementById('carouselNext');

    // Previous/Next buttons
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            prevSlide();
            pauseAutoRotate();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            nextSlide();
            pauseAutoRotate();
        });
    }

    // Hover pause
    carousel.addEventListener('mouseenter', pauseAutoRotate);

    // Touch gestures
    carousel.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });

    carousel.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            prevSlide();
            pauseAutoRotate();
        } else if (e.key === 'ArrowRight') {
            nextSlide();
            pauseAutoRotate();
        }
    });
}

/**
 * Displays error message
 */
function displayErrorMessage() {
    const wrapper = document.getElementById('carouselWrapper');
    wrapper.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 100vh; color: #ffffff; text-align: center; padding: 2rem;">
            <div>
                <h2 style="font-size: 2rem; margin-bottom: 1rem;">Failed to load playlists</h2>
                <p style="font-size: 1.125rem; margin-bottom: 1.5rem;">Please try again later</p>
                <a href="index.html" style="display: inline-block; padding: 0.875rem 2rem; background: #1ED760; color: #ffffff; text-decoration: none; border-radius: 50px; font-weight: 600;">
                    Go to Playlist Library
                </a>
            </div>
        </div>
    `;
}

// ===== MODAL FUNCTIONALITY (Copied from script.js) =====

/**
 * Populates the modal with playlist data
 * @param {Object} playlist - Playlist object to display
 */
function populatePlaylistModal(playlist) {
    // Update cover image
    const coverImg = document.querySelector('.modal-playlist-cover');
    coverImg.src = playlist.playlistCoverUrl;
    coverImg.alt = `${playlist.playlistName} cover`;

    // Update title
    const title = document.querySelector('.modal-playlist-title');
    title.textContent = playlist.playlistName;

    // Update creator
    const creator = document.querySelector('.modal-playlist-creator');
    creator.textContent = `by ${playlist.playlistCreator}`;

    // Clear and populate track list
    const trackList = document.querySelector('.track-list');
    trackList.innerHTML = '';

    if (playlist.songs && playlist.songs.length > 0) {
        playlist.songs.forEach((song) => {
            const trackItem = document.createElement('li');
            trackItem.className = 'track-item';
            trackItem.setAttribute('data-track-id', song.songID);

            // Track cover
            const trackCover = document.createElement('img');
            trackCover.className = 'track-cover';
            trackCover.src = song.songCoverUrl;
            trackCover.alt = `${song.songTitle} cover`;

            // Track info
            const trackInfo = document.createElement('div');
            trackInfo.className = 'track-info';

            const trackTitle = document.createElement('h3');
            trackTitle.className = 'track-title';
            trackTitle.textContent = song.songTitle;

            const trackArtist = document.createElement('p');
            trackArtist.className = 'track-artist';
            trackArtist.textContent = song.songArtist;

            trackInfo.appendChild(trackTitle);
            trackInfo.appendChild(trackArtist);

            // Like button
            const likeBtn = document.createElement('button');
            likeBtn.className = 'like-btn';
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

            // Assemble track item
            trackItem.appendChild(trackCover);
            trackItem.appendChild(trackInfo);
            trackItem.appendChild(likeBtn);

            trackList.appendChild(trackItem);
        });
    }
}

/**
 * Opens the playlist modal
 * @param {Object} playlist - Playlist to display
 */
function openModal(playlist) {
    // Pause carousel
    clearInterval(autoRotateInterval);
    clearTimeout(resumeTimeout);

    currentPlaylist = playlist;
    const modal = document.getElementById('playlistModal');

    populatePlaylistModal(playlist);
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

    modal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
}

/**
 * Closes the playlist modal
 */
function closeModal() {
    const modal = document.getElementById('playlistModal');
    modal.setAttribute('hidden', '');
    document.body.style.overflow = 'auto';

    // Reset shuffle state
    isShuffled = false;
    originalSongOrder = null;

    // Restart auto-rotation after 2 seconds
    setTimeout(() => {
        startAutoRotate();
    }, 2000);
}

/**
 * Sets up modal close event listeners
 */
function setupModalCloseListeners() {
    const closeBtn = document.querySelector('.close-btn');
    const backdrop = document.querySelector('.modal-backdrop');

    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    if (backdrop) {
        backdrop.addEventListener('click', closeModal);
    }

    // Escape key to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modal = document.getElementById('playlistModal');
            if (!modal.hasAttribute('hidden')) {
                closeModal();
            }
        }
    });
}

/**
 * Toggles song like state
 * @param {number} playlistID - Playlist ID
 * @param {number} songID - Song ID
 * @param {HTMLElement} buttonElement - Like button element
 */
function toggleSongLike(playlistID, songID, buttonElement) {
    const currentLikedState = buttonElement.getAttribute('data-liked') === 'true';

    const playlist = playlistsData.find(p => p.playlistID === playlistID);
    if (!playlist) return;

    const song = playlist.songs.find(s => s.songID === songID);
    if (!song) return;

    const heartIcon = buttonElement.querySelector('.heart-icon');
    const likeCountSpan = buttonElement.querySelector('.like-count');

    if (!currentLikedState) {
        song.liked = true;
        song.likeCount = song.likeCount + 1;
        buttonElement.setAttribute('data-liked', 'true');
        heartIcon.textContent = '♥';
    } else {
        song.liked = false;
        song.likeCount = Math.max(0, song.likeCount - 1);
        buttonElement.setAttribute('data-liked', 'false');
        heartIcon.textContent = '♡';
    }

    likeCountSpan.textContent = song.likeCount;
}

/**
 * Sets up song like button listeners
 */
function setupSongLikeListeners() {
    const likeButtons = document.querySelectorAll('.track-list .like-btn');

    likeButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            event.stopPropagation();

            const trackItem = button.closest('.track-item');
            const songID = parseInt(trackItem.getAttribute('data-track-id'));

            if (currentPlaylist) {
                toggleSongLike(currentPlaylist.playlistID, songID, button);
            }
        });
    });
}

/**
 * Shuffles array using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} - Shuffled array
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
 * Toggles shuffle state for playlist
 */
function toggleShuffle() {
    if (!currentPlaylist) return;

    const shuffleBtn = document.querySelector('.shuffle-btn');
    const trackList = document.querySelector('.track-list');

    if (!isShuffled) {
        // Shuffle on
        originalSongOrder = [...currentPlaylist.songs];
        currentPlaylist.songs = shuffleArray(currentPlaylist.songs);
        isShuffled = true;
        shuffleBtn.setAttribute('data-shuffled', 'true');
    } else {
        // Shuffle off
        currentPlaylist.songs = originalSongOrder;
        isShuffled = false;
        shuffleBtn.setAttribute('data-shuffled', 'false');
    }

    // Re-render track list
    populatePlaylistModal(currentPlaylist);
    setupSongLikeListeners();
}

/**
 * Sets up shuffle button listener
 */
function setupShuffleListener() {
    const shuffleBtn = document.querySelector('.shuffle-btn');
    if (shuffleBtn) {
        shuffleBtn.addEventListener('click', toggleShuffle);
    }
}

// ===== AI DESCRIPTION FUNCTIONALITY =====

/**
 * Builds AI prompt for playlist description
 * @param {Object} playlist - Playlist object
 * @returns {string} - Formatted prompt
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
 */
async function getPlaylistDescription(playlist) {
    if (playlist.cachedDescription) {
        return playlist.cachedDescription;
    }

    const prompt = buildDescriptionPrompt(playlist);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AI_API_CONFIG.timeout);

    try {
        const response = await fetch(AI_API_CONFIG.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AI_API_CONFIG.apiKey}`,
                'HTTP-Referer': window.location.origin,
                'X-Title': 'Music Playlist Explorer'
            },
            body: JSON.stringify({
                model: AI_API_CONFIG.model,
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

        const data = await response.json();
        let description = data.choices?.[0]?.message?.content || '';
        description = description.trim();

        if (!description || description.length < 10) {
            throw new Error('Unable to generate description at this time.');
        }

        playlist.cachedDescription = description;
        return description;

    } catch (error) {
        clearTimeout(timeoutId);

        if (error.name === 'AbortError') {
            throw new Error('Request timed out. Please try again.');
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            throw new Error('Network error. Check your connection and try again.');
        } else {
            throw error;
        }
    }
}

/**
 * Handles get description button click
 */
async function handleGetDescription() {
    if (!currentPlaylist) return;

    const button = document.querySelector('.get-description-btn');
    const descriptionElem = document.querySelector('.playlist-description');
    const errorElem = document.querySelector('.description-error');

    descriptionElem.setAttribute('hidden', '');
    errorElem.setAttribute('hidden', '');

    button.disabled = true;
    button.classList.add('loading');
    const originalText = button.querySelector('.button-text').textContent;
    button.querySelector('.button-text').textContent = 'Generating';

    try {
        const description = await getPlaylistDescription(currentPlaylist);
        descriptionElem.textContent = description;
        descriptionElem.removeAttribute('hidden');
        button.style.display = 'none';
    } catch (error) {
        console.error('Error generating description:', error);
        errorElem.textContent = error.message;
        errorElem.removeAttribute('hidden');
    } finally {
        button.disabled = false;
        button.classList.remove('loading');
        button.querySelector('.button-text').textContent = originalText;
    }
}

/**
 * Sets up description button listener
 */
function setupDescriptionListener() {
    const button = document.querySelector('.get-description-btn');
    if (button) {
        button.addEventListener('click', handleGetDescription);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadCarouselData();
    setupModalCloseListeners();
});
