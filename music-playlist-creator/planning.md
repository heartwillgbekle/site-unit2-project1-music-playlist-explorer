## Music Playlist Explorer — Planning Spec

### Data Shape

#### Data Schema

**Playlist Object:**
- `playlistID` (number) — unique identifier for the playlist
- `playlistName` (string) — the display name/title of the playlist
- `playlistCreator` (string) — the name of the person or entity who created the playlist
- `playlistCoverUrl` (string) — URL or path to the playlist cover image
- `likeCount` (number) — the total number of likes the playlist has received
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

### AI Feature Spec (Milestone 8)
[Leave blank — fill in before Milestone 8]

### Decisions Log
[One entry per milestone where you make spec-informed decisions]