## Music Playlist Explorer — Planning Spec

### Data Shape

#### Data Schema

**Playlist Object:**
- `playlistID` (number) — unique identifier for the playlist
- `playlistName` (string) — the display name/title of the playlist
- `playlistCreator` (string) — the name of the person or entity who created the playlist
- `playlistCoverUrl` (string) — URL or path to the playlist cover image
- `likeCount` (number) — the total number of likes the playlist has received
- `liked` (boolean) — whether the current user has liked this playlist (default: false)
- `songs` (array of song objects) — collection of songs contained in this playlist

**Song Object:**
- `songID` (number) — unique identifier for the song
- `songTitle` (string) — the title/name of the song
- `songArtist` (string) — the name of the artist who performed the song
- `songCoverUrl` (string) — URL or path to the song's cover art
- `likeCount` (number) — the total number of likes this individual song has received
- `liked` (boolean) — whether the current user has liked this song (default: false)

### UI and Interaction Rules

#### Main Sections of the Homepage

**Header**
- Fixed navigation bar at the top of the page
- Contains the app logo/title ("Music Playlist Explorer")
- Persistent across all views for brand consistency

**Main Content Area**
- Scrollable grid of playlist cards organized vertically by sections:
  - "Trending Playlists"
  - "Recently Played"
  - "Popular Collections"
  - Each section has a heading and displays 3-6 playlist cards per row (responsive to viewport width)
- Uses horizontal scrolling carousels for additional playlists beyond the first row, similar to Apple Music's approach
- Generous whitespace between sections for visual clarity

**Footer**
- App information
- Links to social media or additional resources

#### Playlist Card Interaction

**When a user clicks a playlist card:**
- A modal overlay slides up from the bottom of the screen (mobile-first pattern inspired by Spotify's share sheets)
- The modal displays the full playlist details:
  - Playlist cover image
  - Playlist title and creator/curator name
  - Track list showing:
    - Song cover art
    - Song title
    - Artist name
    - Like button (heart icon) for each track
  - Action buttons at the top of the modal:
    - Shuffle button
    - Close button (X icon)
- The background content dims (overlay with semi-transparent dark background) to focus attention on the modal
- The page scroll is disabled while the modal is open to prevent background scrolling

#### Modal Dismissal Behavior

**When a user clicks outside the modal:**
- The modal closes with a smooth slide-down animation
- The background overlay fades out
- Page scrolling is re-enabled
- The homepage returns to the exact scroll position before the modal opened

**Alternative dismissal methods:**
- Clicking the close button (X) in the modal header
- Pressing the Escape key on desktop (accessibility consideration)

#### Like Button Interaction

**When a user clicks the heart icon on a song:**
- **Visual toggle behavior:**
  - Unfilled heart → filled/solid heart (state changes instantly)
  - Filled heart → unfilled heart (toggle off)
- **Visual feedback:**
  - Brief scale animation (heart "pops" slightly larger then returns to size)
  - Color changes from gray/outline to red/pink when liked
  - The liked state persists even after closing and reopening the modal
- **Counter update:**
  - The like count next to the heart increments by 1 when liked
  - Decrements by 1 when unliked
  - Changes are immediate and visible without page refresh
- No confirmation dialog or navigation occurs — it's a quick, in-place toggle action

#### Shuffle Button Functionality

**When a user clicks the shuffle button:**
- **Location:** Positioned prominently at the top of the playlist modal, near the close button
- **Visual design:** Icon showing crossed arrows (standard shuffle symbol)
- **Behavior:**
  - Randomizes the display order of songs in the track list
  - The shuffle operates on the visual presentation only (doesn't affect underlying data)
  - Button state changes visually to indicate shuffle is active:
    - Active state: Highlighted/colored background or icon
    - Inactive state: Gray/outlined icon
- **Toggle functionality:**
  - First click: activates shuffle, reorders tracks randomly, button shows active state
  - Second click: deactivates shuffle, returns tracks to original order, button returns to inactive state
- **Persistence:** Shuffle state resets when modal is closed (each playlist opens in default order)

#### Additional Interaction Patterns

**Card hover states (desktop):**
- Playlist cards show subtle elevation (shadow increase) on hover
- Cursor changes to pointer to indicate clickability
- Optional: brief scale transform (card grows 2-3%)

**Responsive behavior:**
- Grid adjusts from 5-6 cards per row (large desktop) → 3-4 cards (tablet) → 2 cards or single column (mobile)
- Modal becomes full-screen on mobile devices for better readability
- Touch gestures supported: swipe down to close modal on mobile

**Loading states:**
- Skeleton cards appear while playlist data is loading
- Smooth transitions when content populates

**Accessibility:**
- All interactive elements keyboard navigable (Tab key)
- Focus indicators visible on all clickable elements
- Screen reader announcements for state changes (liked/unliked, shuffle on/off)
- ARIA labels for icon-only buttons

### Function Specs

#### `renderPlaylistCards(playlists)`
**Purpose:** Dynamically generates playlist card elements from playlist data and displays them on the page.

**Input:**
- `playlists` (array of playlist objects) — the array of playlists to render

**Output/Side Effects:**
- Creates and appends playlist card elements to the `.playlist-cards` container
- Displays "No playlists found" message if the array is empty
- Returns nothing (void function)

**DOM Target:**
- Appends to: `.playlist-cards` container element

**Data Fields Used:**
- `playlistID` — set as `data-playlist-id` attribute on the card
- `playlistCoverUrl` — set as `src` for the playlist cover image
- `playlistName` — displayed as the card title and image alt text
- `playlistCreator` — displayed as the creator name
- `likeCount` — displayed next to the heart icon

**Behavior:**
- Clears existing content in the container before rendering
- If the playlists array is empty, displays a user-friendly "No playlists found" message
- For each playlist, creates an `<article>` element with the class `playlist-card`
- Each card is clickable and can trigger modal display (handled by separate event listener)

#### `populatePlaylistModal(playlist)`
**Purpose:** Populates the modal overlay with detailed playlist information including track list.

**Input:**
- `playlist` (playlist object) — the complete playlist object to display

**Output/Side Effects:**
- Updates `.modal-playlist-cover` image src and alt text
- Updates `.modal-playlist-title` with playlist name
- Updates `.modal-playlist-creator` with creator name (prefixed with "by ")
- Clears and rebuilds `.track-list` with song items from `playlist.songs`
- Returns nothing (void function)

**DOM Target:**
- Updates elements within: `#playlistModal` modal overlay

**Data Fields Used:**
- Playlist level: `playlistCoverUrl`, `playlistName`, `playlistCreator`, `songs`
- Song level: `songID`, `songCoverUrl`, `songTitle`, `songArtist`, `likeCount`, `liked`

**Behavior:**
- Each track item includes a like button with current like state
- Heart icon shows ♡ (unfilled) for unliked, ♥ (filled) for liked songs
- Does not handle modal display (show/hide) — only populates content
- Clears existing track list before adding new tracks to prevent duplicates

#### `openModal(playlist)`
**Purpose:** Opens the modal overlay and displays the selected playlist's details.

**Input:**
- `playlist` (playlist object) — the playlist to display in the modal

**Output/Side Effects:**
- Calls `populatePlaylistModal()` to update modal content
- Removes `hidden` attribute from `#playlistModal`
- Sets `body` overflow to `hidden` to prevent background scrolling
- Returns nothing (void function)

**DOM Target:**
- Modifies: `#playlistModal` and `document.body`

**Behavior:**
- Modal slides up/fades in (animation handled by CSS)
- Background page becomes non-scrollable
- Modal content shows the playlist details

#### `closeModal()`
**Purpose:** Closes the modal overlay and restores page scrolling.

**Input:**
- None

**Output/Side Effects:**
- Adds `hidden` attribute to `#playlistModal`
- Restores `body` overflow to default (re-enables scrolling)
- Returns nothing (void function)

**DOM Target:**
- Modifies: `#playlistModal` and `document.body`

**Behavior:**
- Modal slides down/fades out (animation handled by CSS)
- Background page scrolling is restored
- User returns to exact scroll position before modal opened

#### Event Listeners Setup

**`setupPlaylistCardListeners()`**
- Attaches click listeners to all `.playlist-card` elements
- On click: finds matching playlist by `data-playlist-id` and calls `openModal()`
- Called after `renderPlaylistCards()` completes

**`setupModalCloseListeners()`**
- Backdrop click: closes modal when `.modal-backdrop` is clicked
- Close button: closes modal when `.close-btn` is clicked
- Escape key: closes modal when Escape is pressed (only if modal is visible)
- Called once during initialization

#### `togglePlaylistLike(playlistID, buttonElement)`
**Purpose:** Toggles the like state of a playlist, updating both the data model and DOM representation.

**Input:**
- `playlistID` (number) — ID of the playlist to toggle
- `buttonElement` (HTMLElement) — the `.playlist-likes-btn` DOM element that was clicked

**Output/Side Effects:**
- Updates `playlist.liked` boolean in `playlistsData`
- Increments or decrements `playlist.likeCount` in `playlistsData`
- Updates button's `data-liked` attribute
- Updates heart icon text (♡ ↔ ♥)
- Updates like count display
- Returns nothing (void function)

**DOM Target:**
- Updates elements within: `.playlist-likes-btn` on playlist cards

**Data Fields Used:**
- Playlist level: `playlistID`, `liked`, `likeCount`

**Behavior - Branch 1: Like (Unliked → Liked)**

*Trigger:* User clicks like button when `data-liked="false"` (unliked state)

*Data Model Changes:*
1. Find playlist in `playlistsData` by `playlistID`
2. Set `playlist.liked = true` (user has now liked this playlist)
3. Increment `playlist.likeCount` by 1

*DOM Updates:*
1. Set button `data-liked="true"` (triggers CSS green background)
2. Change heart icon from `♡` to `♥` (filled heart)
3. Update like count display to show new count

*Visual Result:*
- Button changes from gray to green background
- Heart icon changes to filled (♥)
- Like count increments by 1
- Heart "pops" with animation (CSS handles automatically)

*Constraints:*
- Like count MUST increment by exactly 1
- Heart icon MUST change from ♡ to ♥
- `data-liked` attribute MUST be string "true" (not boolean)
- Changes persist in `playlistsData` for the session
- User can only like a playlist once at a time (toggling prevents multiple likes)

**Behavior - Branch 2: Unlike (Liked → Unliked)**

*Trigger:* User clicks like button when `data-liked="true"` (already liked)

*Data Model Changes:*
1. Find playlist in `playlistsData` by `playlistID`
2. Set `playlist.liked = false` (user no longer likes this playlist)
3. Decrement `playlist.likeCount` by 1 (minimum 0)

*DOM Updates:*
1. Set button `data-liked="false"` (removes CSS green background rule)
2. Change heart icon from `♥` to `♡` (unfilled heart)
3. Update like count display to show new count

*Visual Result:*
- Button changes from green to gray background
- Heart icon changes to unfilled (♡)
- Like count decrements by 1
- Smooth transition back to default state

*Constraints:*
- Like count MUST decrement by exactly 1
- Heart icon MUST change from ♥ to ♡
- `data-liked` attribute MUST be string "false" (not boolean)
- Like count MUST NOT go below 0 (use `Math.max(0, ...)`)
- Changes persist in `playlistsData` for the session
- The constraint that ensures a user can only like once: The `data-liked` attribute acts as a toggle - when true, clicking unlikes; when false, clicking likes. The boolean state prevents duplicate likes.

**Edge Cases:**
- Multiple clicks: Each click toggles state correctly (like → unlike → like)
- Like count at 0: Unliking protects against negative values with `Math.max(0, count - 1)`
- Page refresh: Likes reset to initial state (no localStorage/backend persistence)

#### `setupPlaylistLikeListeners()`
**Purpose:** Attaches click event listeners to all playlist like buttons on cards.

**Input:**
- None (reads from DOM)

**Output/Side Effects:**
- Attaches click handler to every `.playlist-likes-btn` element
- Returns nothing (void function)

**DOM Target:**
- Targets all `.playlist-likes-btn` buttons in `.playlist-cards` container

**Data Fields Used:**
- `data-playlist-id` from parent `.playlist-card` element

**Behavior:**
- Called after `renderPlaylistCards()` creates all playlist cards
- Prevents event propagation to avoid triggering card click (modal open)
- Extracts playlist ID from parent card's `data-playlist-id` attribute
- Calls `togglePlaylistLike()` with playlist ID and button element

**Why needed:**
- Like buttons are dynamically created each time playlists render
- Event listeners must be re-attached after DOM reconstruction
- Must stop propagation to prevent card click from opening modal

### AI Feature Spec (Milestone 8)
[Leave blank — fill in before Milestone 8]

### Decisions Log
[One entry per milestone where you make spec-informed decisions]