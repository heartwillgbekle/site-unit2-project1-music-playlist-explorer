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

#### `shuffleArray(array)`
**Purpose:** Shuffles an array using the Fisher-Yates algorithm, creating a new randomized array without modifying the original.

**Input:**
- `array` (Array) — the array to shuffle

**Output:**
- Returns new shuffled array (original array unchanged)

**Algorithm:**
- Fisher-Yates shuffle (unbiased randomization)
- Creates copy of input array using spread operator
- Iterates backwards from last element to first
- For each position i, picks random index j from 0 to i
- Swaps elements at positions i and j
- Returns shuffled copy

**Why Fisher-Yates:**
- Mathematically proven unbiased (every permutation equally likely)
- O(n) time complexity
- Industry standard algorithm

#### `toggleShuffle()`
**Purpose:** Toggles shuffle state for the currently displayed playlist in the modal.

**Input:**
- None (reads from global `currentPlaylist`, `isShuffled` state)

**Output/Side Effects:**
- Re-renders track list in shuffled or original order
- Updates `isShuffled` boolean flag
- Updates `originalSongOrder` array (saves/clears)
- Updates shuffle button's `data-shuffled` attribute
- Re-attaches song like listeners after DOM rebuild
- Returns nothing (void function)

**DOM Target:**
- `.track-list` — cleared and rebuilt
- `.shuffle-btn` — `data-shuffled` attribute updated

**Behavior - Branch 1: Shuffle On (isShuffled = false)**

*Trigger:* User clicks shuffle button when tracks are in original order

*Steps:*
1. Save original song order: `originalSongOrder = [...currentPlaylist.songs]`
2. Create shuffled array using `shuffleArray()`
3. Clear track list DOM: `trackList.innerHTML = ''`
4. Re-render tracks in shuffled order
5. Set `isShuffled = true`
6. Set button `data-shuffled="true"` (triggers CSS green state)
7. Re-attach like button listeners

*Visual Result:*
- Tracks appear in random order
- Shuffle button turns green, icon rotates 180°
- All songs still present (count unchanged)

**Behavior - Branch 2: Shuffle Off (isShuffled = true)**

*Trigger:* User clicks shuffle button when tracks are already shuffled

*Steps:*
1. Clear track list DOM: `trackList.innerHTML = ''`
2. Re-render tracks using saved `originalSongOrder` array
3. Set `isShuffled = false`
4. Set button `data-shuffled="false"` (removes CSS green state)
5. Re-attach like button listeners

*Visual Result:*
- Tracks return to original order
- Shuffle button returns to white, icon rotates back to 0°
- Song like states preserved

**Constraints:**
- Requires `currentPlaylist` to be set (guard clause exits early if null)
- Original `playlist.songs` array never modified (only visual reordering)
- Must re-attach event listeners after each DOM rebuild
- Shuffle state resets when modal closes

#### `setupShuffleListener()`
**Purpose:** Attaches click event listener to the shuffle button in the modal.

**Input:**
- None (reads from DOM)

**Output/Side Effects:**
- Attaches click handler to `.shuffle-btn` element
- Returns nothing (void function)

**DOM Target:**
- `.shuffle-btn` in modal header

**Behavior:**
- Called once when modal opens (in `openModal()`)
- Finds shuffle button via querySelector
- Attaches `toggleShuffle` as click handler
- Guard: only attaches if button exists

**Why needed:**
- Shuffle button is in modal, needs listener attached on modal open
- Simple event delegation, no need to re-attach on shuffle (button persists)

#### `toggleSongLike(playlistID, songID, buttonElement)`
**Purpose:** Toggles the like state of an individual song in the modal track list.

**Input:**
- `playlistID` (number) — ID of the playlist containing the song
- `songID` (number) — ID of the song to toggle
- `buttonElement` (HTMLElement) — the `.like-btn` DOM element that was clicked

**Output/Side Effects:**
- Updates `song.liked` boolean in `playlistsData`
- Increments or decrements `song.likeCount` in `playlistsData`
- Updates button's `data-liked` attribute
- Updates heart icon text (♡ ↔ ♥)
- Updates like count display
- Returns nothing (void function)

**DOM Target:**
- `.like-btn` button within `.track-item` in `.track-list`

**Data Fields Used:**
- Song level: `songID`, `liked`, `likeCount`

**Behavior:**
- Similar to `togglePlaylistLike()` but operates on songs in modal
- Like branch: Sets `liked: true`, increments count, shows filled heart
- Unlike branch: Sets `liked: false`, decrements count (min 0), shows unfilled heart
- Persists through shuffle (data not affected by visual reordering)

#### `setupSongLikeListeners()`
**Purpose:** Attaches click event listeners to all song like buttons in the modal track list.

**Input:**
- None (reads from DOM)

**Output/Side Effects:**
- Attaches click handler to every `.like-btn` element in modal
- Returns nothing (void function)

**DOM Target:**
- All `.like-btn` buttons within `.track-list`

**Behavior:**
- Called after modal populates or track list re-renders
- Must be re-called after shuffle (DOM is rebuilt)
- Prevents event bubbling with `stopPropagation()`
- Extracts song ID from parent `.track-item` data attribute
- Uses `currentPlaylist` global for playlist ID

**Why needed:**
- Song like buttons are dynamically created when modal populates
- Must be re-attached after shuffle/unshuffle (DOM rebuild)
- Each shuffle destroys and recreates track items, losing event listeners

### Featured Page Specification

#### Overview

The Featured Page is a dedicated landing page that showcases a randomly selected "Featured Playlist of the Day." It provides a magazine-style layout with the playlist displayed prominently, offering an immersive browsing experience before users explore the full playlist library.

**Purpose:**
- Create a visually striking entry point to the application
- Highlight one playlist in an editorial, curated style
- Provide seamless navigation to the All Playlists page
- Encourage discovery through randomization

---

#### Page Layout

**Two-Column Design (Desktop):**

```
┌─────────────────────────────────────────────────┐
│  HEADER (Navigation)                            │
│  [← All Playlists]  Music Playlist Explorer     │
├──────────────────┬──────────────────────────────┤
│                  │                              │
│   LEFT COLUMN    │     RIGHT COLUMN             │
│   (40% width)    │     (60% width)              │
│                  │                              │
│ ┌──────────────┐ │  "Featured Playlist"         │
│ │              │ │                              │
│ │   Playlist   │ │  Playlist Name               │
│ │     Cover    │ │  by Creator                  │
│ │   (Large)    │ │                              │
│ │              │ │  Description/Tags            │
│ │  300x300px   │ │                              │
│ │              │ │  ─────────────────────       │
│ └──────────────┘ │                              │
│                  │  Track List:                 │
│  Playlist Name   │  1. Song Title - Artist ♥ 127│
│  by Creator      │  2. Song Title - Artist ♥ 89 │
│                  │  3. Song Title - Artist ♥ 201│
│  ♥ 5 likes       │  4. Song Title - Artist ♥ 156│
│                  │  5. Song Title - Artist ♥ 94 │
│  [🔀 Shuffle]    │  6. Song Title - Artist ♥ 312│
│  [View All]      │                              │
│                  │  [⟳ New Random Playlist]     │
└──────────────────┴──────────────────────────────┘
```

**Mobile Layout (Stacked):**
- Header at top
- Playlist cover below (centered, full-width with padding)
- Playlist info below cover
- Track list below info
- Action buttons at bottom

---

#### Layout Sections

**1. Header / Navigation Bar**
- Fixed at top of page
- Contains:
  - Back arrow + "All Playlists" link (left)
  - App title "Music Playlist Explorer" (center)
  - Optional: Theme toggle or user menu (right)
- Background: Dark gradient matching main app header
- Sticky positioning

**2. Left Column (Playlist Showcase)**
- **Playlist Cover:**
  - Large image (300x300px on desktop, full-width on mobile)
  - Subtle box shadow for depth
  - Rounded corners (12px)
  - High-quality display
- **Playlist Metadata:**
  - Playlist name (large, bold typography)
  - Creator name (smaller, gray text with "by" prefix)
  - Like count with heart icon
  - Playlist tags (optional: "Chill", "Workout", "Summer", etc.)
- **Action Buttons:**
  - Shuffle button (🔀 Shuffle Playlist)
  - "View All Playlists" button (primary CTA)
  - Styled consistently with modal buttons

**3. Right Column (Track List)**
- **Section Header:**
  - "Featured Playlist" label
  - Subtitle: "Your daily playlist pick"
- **Track List Display:**
  - Numbered list (1-6)
  - Each track shows:
    - Track number
    - Song title
    - Artist name
    - Like count with heart icon
  - Hover effects (background highlight)
  - Like buttons interactive (same as modal)
- **Refresh Button:**
  - "New Random Playlist" button at bottom
  - Reloads page with different random selection
  - Icon: ⟳ (refresh/cycle icon)

**4. Footer (Optional)**
- Copyright info
- Links to social media
- Matches main app footer

---

#### Function Specifications

##### `selectRandomPlaylist(playlists)`

**Purpose:** Randomly selects one playlist from the available playlists array to feature on the page.

**Input:**
- `playlists` (Array) — array of all available playlist objects from `data.json`

**Output:**
- Returns a single playlist object (randomly selected)
- Returns `null` if playlists array is empty

**Algorithm:**
```javascript
1. Check if playlists array is empty or invalid
2. Generate random index: Math.floor(Math.random() * playlists.length)
3. Return playlist at that index
```

**When to run:**
- On page load (DOMContentLoaded event)
- When user clicks "New Random Playlist" button
- Could use localStorage to ensure different playlist than last visit

**Constraints:**
- Random selection should be truly random (no bias)
- Should not select same playlist twice in a row (use localStorage)
- Gracefully handles empty playlist array

##### `renderFeaturedPlaylist(playlist)`

**Purpose:** Populates the Featured Page with the selected playlist's data.

**Input:**
- `playlist` (Object) — the playlist object to display

**Output:**
- Returns nothing (void function)
- Side effects: Updates all DOM elements on page

**DOM Elements Updated:**
- `.featured-cover` — playlist cover image (`src`, `alt`)
- `.featured-title` — playlist name
- `.featured-creator` — creator name
- `.featured-likes` — like count
- `.featured-track-list` — complete track list (cleared and rebuilt)

**Data Fields Used:**
- Playlist: `playlistCoverUrl`, `playlistName`, `playlistCreator`, `likeCount`, `songs`
- Song: `songID`, `songTitle`, `songArtist`, `likeCount`, `liked`

**Behavior:**
- Clears existing track list before rendering
- Creates numbered track items (1. Song - Artist)
- Attaches like button event listeners to each track
- Updates page title to include playlist name
- Displays "No tracks" message if playlist.songs is empty

##### `loadFeaturedPage()`

**Purpose:** Main initialization function for the Featured Page.

**Input:**
- None (reads from data file)

**Output:**
- Returns nothing (void function)

**Flow:**
```javascript
1. Fetch data from data.json
2. Check for last viewed playlist in localStorage
3. Select random playlist (excluding last viewed if possible)
4. Render selected playlist
5. Store selected playlist ID in localStorage
6. Set up event listeners (shuffle, refresh, likes, navigation)
```

**Error Handling:**
- Display error message if data fails to load
- Show fallback UI if no playlists available

##### `refreshFeaturedPlaylist()`

**Purpose:** Selects and displays a new random playlist.

**Input:**
- None (reads from global `playlistsData`)

**Output:**
- Returns nothing (void function)

**Behavior:**
- Gets currently displayed playlist ID
- Selects new random playlist (different from current)
- Renders new playlist
- Updates localStorage
- Smooth transition animation (optional fade effect)

##### `setupFeaturedPageListeners()`

**Purpose:** Attaches all event listeners for the Featured Page.

**Input:**
- None

**Output:**
- Returns nothing (void function)

**Listeners to attach:**
- Shuffle button → shuffle current featured playlist's tracks
- Refresh button → `refreshFeaturedPlaylist()`
- Like buttons → `toggleSongLike()` for each track
- Navigation link → navigate to `index.html`

---

#### Navigation System

**From All Playlists Page (index.html) to Featured Page (featured.html):**

**Option 1: Navigation Link in Header**
```html
<nav class="main-nav">
  <a href="featured.html" class="nav-link">Featured</a>
  <a href="index.html" class="nav-link active">All Playlists</a>
</nav>
```

**Option 2: Featured Button/Banner**
- Add "View Featured Playlist" button in header
- Styled prominently to encourage clicks
- Icon: ⭐ or 🎵

**From Featured Page to All Playlists Page:**

**Back Navigation:**
```html
<a href="index.html" class="back-link">
  <span class="back-icon">←</span> All Playlists
</a>
```

**Primary CTA:**
- "View All Playlists" button in left column
- Large, prominent button
- Takes user to full library (index.html)

**Navigation Styling:**
- Consistent with app's design language
- Green accent color (#1ED760) for active states
- Smooth transitions on hover
- Clear visual hierarchy

**URL Structure:**
- Main page: `/` or `/index.html` (All Playlists)
- Featured page: `/featured.html` (Featured Playlist)
- Simple, clean URLs without query parameters

---

#### Data Flow

**Page Load Sequence:**
```
1. User navigates to featured.html
   ↓
2. loadFeaturedPage() runs on DOMContentLoaded
   ↓
3. Fetch data from data/data.json
   ↓
4. selectRandomPlaylist(playlists)
   ↓
5. renderFeaturedPlaylist(selectedPlaylist)
   ↓
6. setupFeaturedPageListeners()
   ↓
7. Page fully interactive
```

**Refresh Flow:**
```
1. User clicks "New Random Playlist" button
   ↓
2. refreshFeaturedPlaylist() called
   ↓
3. Select new random playlist (different from current)
   ↓
4. Fade out current content (optional animation)
   ↓
5. renderFeaturedPlaylist(newPlaylist)
   ↓
6. Fade in new content
   ↓
7. Update localStorage with new playlist ID
```

**Shuffle Flow (on Featured Page):**
```
1. User clicks shuffle button in left column
   ↓
2. toggleFeaturedShuffle() called
   ↓
3. Same logic as modal shuffle:
   - Save original order
   - Shuffle array using Fisher-Yates
   - Re-render track list
   - Update button state (green when active)
   ↓
4. Re-attach like listeners
```

---

#### Design Decisions

**1. Why Random Selection?**
- Creates serendipitous discovery experience
- Encourages exploration of full library
- No editorial bias (fair to all playlists)
- "Playlist of the Day" feel without manual curation

**2. Why Two-Column Layout?**
- Magazine/editorial aesthetic
- Focuses attention on cover art (visual impact)
- Separates metadata from content (clear hierarchy)
- Desktop-optimized, stacks well on mobile

**3. Why Separate HTML File?**
- Clean separation of concerns
- Different layout requires different structure
- Easier to maintain and test
- Can be deployed independently

**4. Why Include Shuffle on Featured Page?**
- Consistent with modal functionality
- Allows exploration without leaving page
- Demonstrates feature to new users
- Enhances featured playlist experience

**5. Why "New Random Playlist" Button?**
- Empowers user to explore without navigation
- Creates slot-machine/discovery excitement
- Reduces friction (no need to go back to All Playlists)
- Encourages multiple playlist views in one session

---

#### Responsive Design

**Desktop (>768px):**
- Two-column layout (40/60 split)
- Fixed navigation header
- Large playlist cover (300x300px)
- Track list scrollable if needed

**Tablet (768px - 480px):**
- Two-column layout collapses to 50/50
- Slightly smaller cover (250x250px)
- Navigation remains horizontal

**Mobile (<480px):**
- Single column, stacked layout
- Cover full-width with padding
- Navigation icon-only or hamburger menu
- Touch-optimized buttons (larger tap targets)
- Shuffle button full-width at bottom

---

#### Accessibility Considerations

**ARIA Labels:**
- `<main aria-label="Featured Playlist">`
- `<nav aria-label="Main Navigation">`
- `<button aria-label="Select new random playlist">`
- `<button aria-label="Shuffle playlist tracks">`

**Keyboard Navigation:**
- Tab order: Navigation → Shuffle → View All → Tracks → Refresh
- Enter/Space activates buttons
- Arrow keys navigate track list (optional enhancement)

**Screen Readers:**
- Descriptive alt text on playlist cover
- Live region announces playlist changes
- Meaningful link text ("All Playlists" not "Click Here")

**Focus Indicators:**
- Visible focus rings on all interactive elements
- High contrast focus states
- Consistent with main app styling

---

#### Enhancement Ideas (Future Iterations)

**1. Daily Featured Playlist:**
- Use date-based seeding for Math.random()
- Same playlist shown to all users on same day
- "Featured on [Date]" label

**2. Animated Transitions:**
- Fade/slide animation when changing playlists
- Smooth shuffle re-ordering (tracks slide into position)
- Page load animation (cover zooms in)

**3. Playlist Tags/Categories:**
- Display genre tags below playlist info
- Clickable tags filter main library by category
- Color-coded tag badges

**4. Social Sharing:**
- "Share this playlist" button
- Generates shareable link to specific playlist
- Social media preview cards

**5. Play Preview:**
- Audio player for 30-second song previews
- Spotify/Apple Music integration
- Play button on each track

**6. Playlist Stats:**
- Total duration (e.g., "24 minutes")
- Number of songs
- Average song length
- Creation date

---

#### File Structure

```
music-playlist-creator/
├── index.html              # All Playlists page (existing)
├── featured.html           # NEW: Featured page
├── style.css               # Shared styles (add featured styles)
├── script.js               # Main page JS (existing)
├── featured.js             # NEW: Featured page JS
├── data/
│   └── data.json          # Playlist data (existing)
└── assets/
    └── img/               # Images (existing)
```

**Shared Resources:**
- `style.css` — add featured page styles, reuse base styles
- `data/data.json` — same data source
- Same fonts, colors, design tokens

---

#### Implementation Checklist

**Planning Phase:**
- [x] Define page layout and sections
- [x] Specify random selection function
- [x] Specify render function
- [x] Plan navigation system
- [x] Design responsive breakpoints
- [x] Document accessibility requirements

**Implementation Phase:**
- [x] Create `featured.html` with semantic structure
- [x] Add Featured Page styles to `style.css`
- [x] Create `featured.js` with all functions
- [x] Implement `selectRandomPlaylist()`
- [x] Implement `renderFeaturedPlaylist()`
- [x] Implement shuffle functionality for featured page
- [x] Add navigation links to both pages
- [ ] Test random selection (no repeats)
- [ ] Test responsive design (mobile/tablet/desktop)
- [ ] Test all interactive features (shuffle, like, refresh)
- [ ] Verify accessibility (keyboard, screen reader)

### AI Feature Spec (Milestone 8)

#### Overview
Generate contextual playlist descriptions using AI to enhance the user experience and provide insight into each playlist's theme, mood, and musical style.

#### AI Model Configuration

**Role:** Music playlist curator and copywriter

**Task:** Generate an engaging, concise description for a music playlist that captures its vibe, mood, and theme.

**Inputs:**
- `playlistName` (string) - e.g., "Summer Vibes"
- `playlistCreator` (string) - e.g., "DJ Sunshine"
- `songs` (array of objects) - Each containing:
  - `songTitle` (string)
  - `songArtist` (string)

**Prompt Template:**
```
You are a music curator writing playlist descriptions for a music streaming app.

Generate a 2-3 sentence description for the following playlist:

Playlist: "{playlistName}"
Creator: {playlistCreator}
Songs:
{songs.map(song => `- "${song.songTitle}" by ${song.songArtist}`).join('\n')}

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

Description:
```

**Output Format:**
- Plain text string
- 2-3 sentences
- 40-80 words
- No markdown or special formatting
- Ends with period

**Constraints:**
- Keep it conversational and engaging
- Match the tone to the playlist genre/mood
- Avoid repetitive phrases across different playlists
- Be specific to the playlist's actual content
- No explicit content or controversial topics

**Failure Behavior:**
- API call fails: Display "Description unavailable. Please try again later."
- Timeout: Display "Request timed out. Please try again."
- Rate limit: Display "Too many requests. Please wait a moment and try again."
- Invalid response: Display "Unable to generate description at this time."
- Network error: Display "Network error. Check your connection and try again."

#### Function Spec: `getPlaylistDescription(playlist)`

**Purpose:** Calls the AI API to generate a description for a given playlist.

**Input:**
- `playlist` (object) - Complete playlist object from `playlistsData`

**Output:**
- Returns: `Promise<string>` - Resolves to generated description text
- Throws: Error with user-friendly message on failure

**API Call Structure:**
1. Check cache first (`playlist.cachedDescription`)
2. Build prompt from template using `buildDescriptionPrompt()`
3. Call AI API with fetch() using POST method
4. Handle HTTP errors (401/403/429/5xx) with specific messages
5. Parse JSON response and extract description text
6. Validate description exists and is non-empty (min 10 chars)
7. Cache result in `playlist.cachedDescription`
8. Return description string

**Error Handling:**
- Network errors: Try-catch with `fetch()`, show "Network error" message
- HTTP errors (4xx/5xx): Check `response.ok`, map status codes to messages
  - 401/403: "API authentication failed. Check your API key."
  - 429: "Too many requests. Please wait a moment and try again."
  - 500+: "Server error. Please try again later."
- Timeout: Use `AbortController` with 10-second timeout
- Invalid JSON: Try-catch on `response.json()`, fallback message
- Empty response: Validate description exists and length >= 10
- AbortError: "Request timed out. Please try again."

**Edge Cases:**
- Empty playlist (no songs): Skip description or return generic fallback
- Very short playlist (1-2 songs): Prompt still works with limited data
- Duplicate API calls: Cache check prevents redundant requests
- Modal closed during API call: AbortController cancels request

#### Function Spec: `buildDescriptionPrompt(playlist)`

**Purpose:** Constructs the AI prompt string from playlist data.

**Input:**
- `playlist` (object) - Playlist object containing name, creator, songs array

**Output:**
- Returns: `string` - Formatted prompt ready for API

**Behavior:**
- Maps playlist.songs to formatted list: `- "Title" by Artist`
- Joins song list with newlines
- Injects playlist name, creator, and song list into template
- Returns complete prompt string

#### Function Spec: `handleGetDescription()`

**Purpose:** Handles "Get Description" button click event.

**Input:**
- None (reads from global `currentPlaylist`)

**Output:**
- Returns: `void`
- Side effects: Updates DOM with description or error message

**Behavior:**
1. Guard clause: exits if `currentPlaylist` is null
2. Gets button, description, and error elements from DOM
3. Resets UI (hides description and error)
4. Shows loading state (disable button, add "loading" class, change text to "Generating")
5. Calls `await getPlaylistDescription(currentPlaylist)`
6. On success:
   - Displays description in `.playlist-description` element
   - Removes `hidden` attribute
   - Hides button (`display: none`)
7. On error:
   - Logs error to console
   - Displays error message in `.description-error` element
   - Removes `hidden` attribute
8. Finally block: resets loading state (enable button, remove class, restore text)

#### Function Spec: `setupDescriptionListener()`

**Purpose:** Attaches click event listener to "Get Description" button.

**Input:**
- None (queries DOM for button)

**Output:**
- Returns: `void`
- Side effect: Attaches event listener

**Behavior:**
- Queries DOM for `.get-description-btn`
- If button exists, attaches `handleGetDescription` as click handler
- Called from `openModal()` when modal opens

### Decisions Log
[One entry per milestone where you make spec-informed decisions]