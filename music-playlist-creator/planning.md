## Music Playlist Explorer — Planning Spec

### Data Shape
[Leave blank — fill in before Milestone 3]

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
[Add function specs here as you plan each milestone]

### AI Feature Spec (Milestone 8)
[Leave blank — fill in before Milestone 8]

### Decisions Log
[One entry per milestone where you make spec-informed decisions]