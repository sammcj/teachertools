# Emma's Teacher Tools - Rewrite Specification

## Implementation Status

✅ **COMPLETED** - Full rewrite finished on 30 September 2025

**Key Changes from Original:**
- Unified single-page application (resolves localStorage scope issues with `file://` protocol)
- Modern CSS architecture with design tokens
- Improved visual feedback for student selection
- Drag-and-drop class list reordering
- Constraint satisfaction warnings
- Student view with confetti animation
- Responsive mobile-first design
- All files consolidated into `index.html` for simplicity

## Project Overview

A web-based classroom management application built for Emma, a primary school teacher. The application provides tools to help manage classroom activities, with the primary feature being "GroupThing" - a student group generator.

**Core Principles:**
- Privacy-first: All data stored locally in browser (LocalStorage)
- No backend or server required: MUST be a static site deployable to GitHub Pages
- Offline-capable after initial load
- Simple, intuitive interface suitable for classroom use
- Visual appeal for young students

**Extensibility:** Designed to support multiple teaching tools beyond GroupThing

## Current Features

### GroupThing: Student Group Generator

The main tool that allows teachers to create and manage student groups for classroom activities.

#### 1. Class List Management

- Create multiple class lists with custom names (e.g., "Class 1A", "Science Group", "Book Club")
- Edit class list names via modal dialogue
- Delete class lists with confirmation prompt
- Drag-and-drop reordering of class lists for custom organisation
- Dropdown selector to switch between lists
- Visual indicator showing currently active list
- Lists persist across sessions

#### 2. Student Management

- Add individual students by name
- Bulk add students (multiple names, one per line in textarea)
- Remove selected students (multi-select with click)
- Duplicate detection (warns when adding existing student)
- Visual student list with click-to-select functionality
- Students automatically removed from incompatible pairs when deleted
- Submit with Enter key (Shift+Enter for new line in bulk input)

#### 3. Group Generation Algorithm

- Configurable group size via slider (1-15 students per group)
- Intelligent distribution algorithm that prevents single-person groups
- Random shuffling using Fisher-Yates algorithm
- Respects incompatible pair constraints
- Multiple attempts (up to 50) to satisfy all constraints
- Falls back to best attempt if constraints cannot be satisfied
- Displays warning when constraints cannot be fully satisfied
- Generated groups stored with the class list

**Algorithm Behaviour:**
- Distributes students evenly across groups
- If distribution would create single-person group, reduces total number of groups
- Merges any remaining single-person groups into smallest existing groups
- Validates against blacklist after each generation attempt

#### 4. Grouping Rules (Pairing Rules)

- Define bidirectional pairing rules:
  - **Never together** (❌): Students who cannot be grouped together
  - **Always together** (✅): Students who must be in the same group
- Multi-student rule support (2+ students per rule)
- For "never" rules: Creates pairwise combinations (e.g., 3 students = 3 pairs)
- For "always" rules: Stores all students as single rule group
- Visual tags showing selected students for grouping rule
- Rule type indicators (❌/✅) in rule list display
- Remove individual students from pending rule
- Remove existing rules via selection
- Collapsible panel to save screen space
- Rules validated during group generation
- Backwards compatible with old "incompatible pairs" format

#### 5. Group Naming System

- Toggle between emoji animal names and numbered groups (e.g., "Group 1")
- Setting stored per class list
- 30 predefined animal options (supports classes with up to 30 groups):
  - 🦘 Kangaroos, 🐨 Koalas, 🐬 Dolphins, 🦒 Giraffes
  - 🐼 Pandas, 🐰 Rabbits, 🐶 Puppies, 🐱 Cats
  - 🦁 Lions, 🐻 Bears, 🐘 Elephants, 🦉 Owls
  - 🦅 Eagles, 🐢 Turtles, 🐯 Tigers, 🦊 Foxes
  - 🐺 Wolves, 🦇 Bats, 🦋 Butterflies, 🐝 Bees
  - 🦎 Lizards, 🐍 Snakes, 🦆 Ducks, 🦢 Swans
  - 🐧 Penguins, 🦩 Flamingos, 🦚 Peacocks, 🦜 Parrots
  - 🐳 Whales, 🦈 Sharks
- Cycles through animals if more than 30 groups needed

#### 6. Data Persistence & Portability

- All data stored in LocalStorage under key `groupThing_data`
- Export entire configuration to JSON file (`groupthing_settings.json`)
- Import configuration from JSON file with validation
- Confirmation dialog before overwriting existing data
- Sample data loader with 3 pre-populated class lists for demonstration
- Version tracking (currently "1.0.0")

**Data Structure:**
```json
{
  "lists": {
    "list_[timestamp]": {
      "name": "Class Name",
      "students": ["Student 1", "Student 2"],
      "pairingRules": [
        {
          "type": "never",
          "students": ["Student 1", "Student 2"]
        },
        {
          "type": "always",
          "students": ["Student 3", "Student 4", "Student 5"]
        }
      ],
      "groupSize": 3,
      "groups": [["Group 1 members"], ["Group 2 members"]],
      "useEmojiNames": true
    }
  },
  "currentListId": "list_[timestamp]",
  "version": "2.0.0"
}
```

**Note:** Old format with `incompatiblePairs: [["Student 1", "Student 2"]]` is automatically converted to new `pairingRules` format on load.

#### 7. Teacher View Interface

Primary management interface with four main sections:

**Class Lists Panel:**
- List of all created class lists
- Drag handles (⋮⋮) for reordering
- Edit (✏️) and Delete (🗑️) buttons per list
- Click to select list
- New List, Load Sample, Clear All Data buttons

**Current List Panel:**
- List selector dropdown
- Generate Groups button (large, primary action)
- Emoji names toggle checkbox
- Group size slider (1-15) with numeric display and labels
- Student list with multi-select
- Add student(s) textarea with Add/Remove buttons

**Grouping Rules Panel:**
- Collapsible section (collapsed by default)
- Student dropdown for selection
- Visual tags for selected students
- Add/Remove buttons for rules
- List of existing incompatible pairs

**Generated Groups Panel:**
- Preview of generated groups
- Group titles (emoji animals or numbers)
- Member lists for each group
- Empty state message when no groups generated

**Header Actions:**
- Export Config button (💾)
- Import Config button (📂)
- Switch to Student View button (🎓)

#### 8. Student View Interface

Simplified, read-only interface for displaying groups to students:

- Large, visually appealing group displays (bubble/card layout)
- Class name header
- Group title with emoji/number
- Member names in each group
- Confetti animation on page load (100 pieces, 5-second duration)
- Responsive layout (switches to rectangular for groups >6 students)
- Staggered animation for group appearance (0.1s delay per group)
- Empty state with helpful message if no groups exist
- Link back to Teacher View

**Privacy Considerations:**
The student view is designed for screen sharing and projection. It deliberately hides:
- Grouping rules/incompatible pairs (students won't know who can't be grouped together)
- Student management interface
- The complete student list (only shows those in generated groups)
- All teacher controls and configuration

This ensures teachers can project the groups without revealing sensitive pairing constraints.

**Data Loading:**
- Primary: URL parameters with base64-encoded group data
- Fallback: LocalStorage using current list ID
- Dual-method parameter parsing for browser compatibility

#### 9. UI/UX Features

**Visual Design:**
- Pastel colour scheme (pink, mint, lavender, yellow, peach, magenta, light green, light blue)
- Custom font stack
- Rounded corners and soft shadows
- Hover effects on interactive elements
- Smooth transitions and animations

**Responsive Design:**
- Mobile-first approach
- Adapts layout for different screen sizes
- Horizontal scrolling prevention
- Viewport-aware scaling
- Iframe responsive integration

**User Feedback:**
- Modal dialogue for create/edit/import actions
- Confirmation prompts for destructive actions
- Error messages with auto-dismiss (3-second default)
- Success messages for completed actions
- Loading indicators
- Empty states with guidance
- Visual selection states

#### 10. Technical Architecture

**File Structure:**
- `index.html` - Main entry point (loads GroupThing in iframe)
- `groupthing.html` - Teacher view
- `student.html` - Student view
- `main.html` - Alternative entry with tab system
- `test-groups.html` - Algorithm testing page

**JavaScript Modules:**
- `storage.js` - LocalStorage operations, export/import
- `common.js` - Shared utilities, group generation algorithm
- `teacher-data.js` - Data operations for teacher view
- `teacher-ui.js` - UI interactions for teacher view
- `student.js` - Student view functionality
- `responsive.js` - Mobile adaptations

**CSS Modules:**
- `fonts.css` - Typography
- `styles.css` - Global styles and variables
- `main.css` - Main page styles
- `teacher.css` - Teacher view styles
- `student.css` - Student view styles
- `responsive.css` - Mobile breakpoints

**Deployment:**
- GitHub Actions workflow for automatic deployment
- GitHub Pages hosting
- No build process required (static files)

### Future Tools (Placeholders)

Tab-based architecture supports additional tools:
- Quiz Maker (create interactive quizzes)
- Classroom Timer (activity and transition timers)

## Functional Requirements

### Must Have

1. **Multiple Class Management:** Support unlimited class lists with unique student rosters
2. **Flexible Group Sizes:** Handle any group size from 1-15 students
3. **Constraint Satisfaction:** Respect incompatible pair rules during generation
4. **No Single-Person Groups:** Algorithm must prevent isolated students
5. **Data Persistence:** All data survives browser refresh
6. **Export/Import:** Users can backup and restore their configuration
7. **Student Display:** Shareable view that shows generated groups clearly
8. **Mobile Support:** Functional on tablets and smartphones
9. **Privacy:** No data leaves the user's browser
10. **Visual Appeal:** Child-friendly, colourful interface

### Nice to Have

1. **Undo/Redo:** Revert group generation or data changes
2. **History:** Track previous group generations for a class
3. **Print View:** Printer-friendly group display
4. **Group Lock:** Pin specific students to specific groups
5. **Balance Criteria:** Even distribution by gender, ability level, etc.
6. **Notes:** Add notes to class lists or students
7. **Archive:** Soft-delete class lists instead of permanent removal

## Non-Functional Requirements

1. **Performance:** Group generation should complete in <500ms for typical class sizes (30 students)
2. **Browser Support:** Modern browsers (Chrome, Firefox, Safari)
3. **Offline:** Full functionality without internet connection after initial load
4. **Data Loss Prevention:** Prominent reminders to export configuration
5. **Intuitive:** First-time users should understand core features without documentation
6. **Responsive:** Smooth operation on devices from 320px to 4K displays

## Known Edge Cases & Solutions

1. **Single-Person Groups:** Prevented by adjusting number of groups and merging
2. **Impossible Constraints:** Attempts 50 times, warns user, provides best attempt
3. **Duplicate Students:** Detected and rejected with error message
4. **URL Parameter Parsing:** Dual-method fallback for browser compatibility
5. **Empty States:** Helpful messages guide users to next action
6. **Large Classes:** Rectangular layout activates for groups >6 students
7. **Many Groups:** Animal emojis cycle when >16 groups needed

## Design Considerations

1. **Target Audience:** Primary school teachers (non-technical users)
2. **Use Context:** Classroom environment with time pressure
3. **Student Visibility:** Student view optimised for projection/shared screen
4. **Privacy Concerns:** No account creation, no data collection, no tracking
5. **Portability:** Teachers should be able to move between devices via export/import
6. **Visual Hierarchy:** Most important actions (generate groups) are most prominent
7. **Error Prevention:** Confirmations for destructive actions, validation on inputs

## Implementation Notes

- Modular architecture allows clean separation of concerns
- Storage layer abstracts LocalStorage operations
- Algorithm is testable independently (see test-groups.html)
- Student view can work standalone via URL parameters
- Iframe approach allows tool isolation in multi-tool interface
- CSS variables enable consistent theming
- Sample data provides immediate usability for new users

## Recommended Libraries & Modern CSS Patterns for Rewrite

### Animation Libraries (Lightweight Options)

#### 1. Animate.css (Recommended - Simplest)
**Size:** ~80KB unminified, ~10KB minified
**CDN:** Available
**Best for:** Quick, ready-made animations without JavaScript

**Pros:**
- Pure CSS, no JavaScript required
- 80+ pre-built animations (entrances, exits, attention seekers)
- CSS custom properties for easy customisation
- Just add class names: `animate__animated animate__bounce`
- Can use only specific animations (tree-shakeable via npm)

**Cons:**
- Larger file size if using all animations
- Less control than custom animations

**Use cases for Teacher Tools:**
- Card entrance animations (bounceIn, fadeIn)
- Button feedback (pulse, heartBeat)
- Error messages (shake, wobble)
- Modal appearances (zoomIn, slideInDown)
- Group bubble entrances (backInUp, rollIn)

**Implementation:**
```html
<!-- CDN -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"/>

<!-- Usage -->
<div class="group-bubble animate__animated animate__bounceIn">...</div>
```

#### 2. Animista (Recommended - Most Flexible)
**Size:** 0KB (on-demand, copy what you need)
**CDN:** Not applicable (playground-based)
**Best for:** Custom selection without package overhead

**Pros:**
- Zero installation - visit playground, copy CSS
- Extensive customisation options in browser
- Only include animations you actually use
- Native CSS keyframes
- Perfect for keeping bundle size minimal

**Cons:**
- Manual process (visit site, copy code)
- No package updates

**Use cases for Teacher Tools:**
- Customised confetti fall animation
- Specific card hover effects
- Tailored entrance/exit transitions
- Unique text animations for group names

**Implementation:**
Visit [animista.net](https://animista.net/), configure animation, copy CSS:
```css
.rotate-in-center {
  animation: rotate-in-center 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
}
@keyframes rotate-in-center {
  0% { transform: rotate(-360deg); opacity: 0; }
  100% { transform: rotate(0); opacity: 1; }
}
```

#### 3. Motion One (Optional - Advanced)
**Size:** ~5KB minified
**Best for:** Complex JavaScript-driven animations

**Pros:**
- Tiny footprint (smaller than GSAP, Framer Motion)
- Modern Web Animations API
- Spring animations, timeline orchestration
- Excellent performance

**Cons:**
- Requires JavaScript knowledge
- May be overkill for simple animations

**Use cases for Teacher Tools:**
- Coordinated multi-element animations
- Physics-based drag interactions
- Complex state transitions

**Not recommended unless:** You need complex orchestrated animations that pure CSS can't handle.

### Modern CSS Patterns (No Libraries Required)

#### 1. View Transitions API
**Browser Support:** Chrome, Edge, Opera (Safari/Firefox in progress)
**Best for:** Smooth state transitions without JavaScript overhead

**Use cases:**
- Switching between teacher and student views
- Expanding group cards
- List reordering feedback
- Modal open/close transitions

**Implementation:**
```javascript
document.startViewTransition(() => {
  // Update DOM state
  container.innerHTML = newContent;
});
```

```css
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 0.5s;
}
```

**Benefits for Teacher Tools:**
- Crossfade between views
- Element position transitions (list reordering)
- No extra dependencies
- Smooth page transitions

#### 2. CSS Container Queries
**Browser Support:** All modern browsers (2023+)
**Best for:** Responsive components regardless of viewport

**Use cases:**
- Group cards that adapt to available space
- Student list that changes layout based on panel width
- Responsive typography in constrained spaces

**Implementation:**
```css
.group-container {
  container-type: inline-size;
}

@container (min-width: 400px) {
  .group-bubble {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

#### 3. Scroll-Snap
**Browser Support:** All modern browsers
**Best for:** Smooth scrolling between sections

**Use cases:**
- Mobile student view (snap between groups)
- Horizontal class list scrolling
- Smooth panel transitions

**Implementation:**
```css
.groups-container {
  scroll-snap-type: y mandatory;
  overflow-y: scroll;
}

.group-bubble {
  scroll-snap-align: start;
}
```

#### 4. Glassmorphism Effects
**Browser Support:** Modern browsers with backdrop-filter
**Best for:** Modern, playful UI aesthetic

**Use cases:**
- Modal overlays
- Floating action buttons
- Teacher control panels
- Card hover states

**Implementation:**
```css
.glass-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
```

#### 5. CSS Custom Properties (Variables) for Theming
**Browser Support:** All modern browsers
**Best for:** Consistent, maintainable colour schemes

**Implementation:**
```css
:root {
  --color-primary: #ffafcc;
  --color-mint: #a0e7e5;
  --color-lavender: #b8c0ff;
  --color-yellow: #ffd166;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --radius: 8px;
  --shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  --transition-speed: 0.3s;
}

.group-bubble {
  background: var(--color-primary);
  padding: var(--spacing-md);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  transition: transform var(--transition-speed);
}
```

#### 6. Modern Layout: CSS Grid + Flexbox
**Browser Support:** All modern browsers
**Best for:** Responsive, maintainable layouts

**Implementation:**
```css
/* Auto-fit cards with minimum width */
.groups-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

/* Flexbox for header controls */
.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
}
```

#### 7. CSS Animation Performance Patterns
**Best Practices:**
- Use `transform` and `opacity` for animations (GPU accelerated)
- Avoid animating `width`, `height`, `top`, `left`
- Use `will-change` sparingly for complex animations
- Prefer CSS transitions over JavaScript animation for simple effects

**Implementation:**
```css
/* Good: GPU accelerated */
.card {
  transition: transform 0.3s, opacity 0.3s;
}
.card:hover {
  transform: translateY(-5px) scale(1.02);
}

/* Avoid: Forces layout recalculation */
.card:hover {
  width: 310px; /* Don't do this */
  top: -5px;    /* Don't do this */
}
```

### Recommended Approach for Rewrite

**Core Strategy: Minimal dependencies, maximum native CSS**

1. **Use Animate.css** for quick, pre-built animations (~10KB minified)
   - Include only needed animations if using npm build
   - Or use Animista for completely zero-bundle approach

2. **Modern CSS features** for everything else:
   - View Transitions API for state changes
   - Container Queries for responsive components
   - CSS Grid + Flexbox for layout
   - Custom Properties for theming
   - Glassmorphism for modern aesthetic

3. **No JavaScript animation libraries needed** unless:
   - You need complex orchestrated animations
   - You want physics-based interactions
   - (Then consider Motion One at 5KB)

4. **Design inspiration:**
   - Duolingo-style bouncy interactions
   - Notion-style clean organisation
   - Linear-style subtle micro-animations
   - Maintain playful but professional aesthetic

### Visual Design Enhancements

**Colour System:**
```css
:root {
  /* Pastel primaries */
  --pink: #ffafcc;
  --mint: #a0e7e5;
  --lavender: #b8c0ff;
  --yellow: #ffd166;
  --magenta: #ff9cee;
  --peach: #ffc8a2;
  --light-green: #c1fba4;
  --light-blue: #9bf6ff;

  /* Semantic colours */
  --bg-primary: #fafafa;
  --text-primary: #2c3e50;
  --text-secondary: #6c757d;
  --success: #27AE60;
  --error: #E74C3C;
  --warning: #F39C12;
}
```

**Typography:**
```css
:root {
  --font-heading: 'Poppins', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

**Spacing Scale:**
```css
:root {
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  --space-2xl: 3rem;
}
```

## Development Checklist

### Phase 1: Project Setup & Foundation
- [ ] Create new project structure with clean directory organisation
- [ ] Set up CSS architecture with modern patterns
  - [ ] Create `styles/variables.css` with design tokens (colours, spacing, typography)
  - [ ] Create `styles/reset.css` with modern CSS reset
  - [ ] Create `styles/utilities.css` with common utility classes
  - [ ] Create `styles/layout.css` with grid/flexbox layouts
  - [ ] Create `styles/components.css` for reusable components
- [ ] Integrate Animate.css or set up Animista animations
- [ ] Set up modern font stack (Poppins, Inter, system fonts)
- [ ] Create colour system with CSS custom properties
- [ ] Implement spacing scale and sizing system

### Phase 2: Core Data Layer
- [ ] Rewrite `storage.js` module (keep it simple, it already works well)
  - [ ] LocalStorage get/set operations
  - [ ] Export to JSON functionality
  - [ ] Import from JSON with validation
  - [ ] Basic error handling
- [ ] Port the group generation algorithm from `common.js` (it's already simple and works!)
  - [ ] Shuffle students randomly (Fisher-Yates is just fancy way to say "shuffle properly")
  - [ ] Distribute into groups evenly (round-robin)
  - [ ] If someone would be alone, add them to smallest group
  - [ ] If there are "don't pair" rules, shuffle and retry up to 50 times
  - [ ] That's it! Don't overcomplicate this.
- [ ] Test with existing `test-groups.html` to verify it still works

### Phase 3: Teacher View - Layout & Structure
- [ ] Build teacher view HTML structure
  - [ ] Header with export/import/switch view controls
  - [ ] Class Lists panel (left sidebar)
  - [ ] Current List panel (main area)
  - [ ] Grouping Rules panel (collapsible)
  - [ ] Generated Groups preview panel
- [ ] Implement responsive layout
  - [ ] Mobile-first approach
  - [ ] Tablet breakpoints
  - [ ] Desktop optimisation
  - [ ] Container queries for adaptive components
- [ ] Add glassmorphism effects to modals and panels
- [ ] Implement smooth transitions between panels

### Phase 4: Teacher View - Class List Management
- [ ] Create class list UI components
  - [ ] List item card with drag handles
  - [ ] Edit/delete action buttons
  - [ ] Active state indicator
  - [ ] Empty state message
- [ ] Implement drag-and-drop reordering
  - [ ] Visual feedback during drag
  - [ ] Save order to storage
  - [ ] Smooth animations with View Transitions API
- [ ] Build modal dialogue for create/edit
  - [ ] Form validation
  - [ ] Enter key submission
  - [ ] Escape key cancellation
  - [ ] Backdrop click to close
- [ ] Add list selector dropdown
  - [ ] Sync with active list
  - [ ] Keyboard navigation support

### Phase 5: Teacher View - Student Management
- [ ] Build student list UI
  - [ ] Multi-select functionality
  - [ ] Visual selection states
  - [ ] Empty state handling
- [ ] Implement add student(s) functionality
  - [ ] Single student input
  - [ ] Bulk add (one per line)
  - [ ] Duplicate detection with warning
  - [ ] Enter to submit, Shift+Enter for new line
  - [ ] Success/error feedback messages
- [ ] Implement remove students functionality
  - [ ] Multi-select removal
  - [ ] Confirmation dialogue
  - [ ] Auto-remove from incompatible pairs
- [ ] Update incompatible pairs dropdown when students change

### Phase 6: Teacher View - Group Generation
- [ ] Build group size slider
  - [ ] Range input (1-15)
  - [ ] Visual numeric display
  - [ ] Smooth value updates
  - [ ] Save to storage on change
- [ ] Implement emoji names toggle
  - [ ] Checkbox UI
  - [ ] Sync with storage
  - [ ] Update preview on toggle
- [ ] Build generate groups button
  - [ ] Loading state during generation
  - [ ] Success animation
  - [ ] Error handling with messages
- [ ] Create groups preview UI
  - [ ] Card/bubble layout
  - [ ] Group titles (emoji animals or numbers)
  - [ ] Member lists
  - [ ] Empty state message
  - [ ] Staggered entrance animations (Animate.css or Animista)

### Phase 7: Teacher View - Grouping Rules
- [ ] Build collapsible panel
  - [ ] Smooth expand/collapse animation
  - [ ] Collapsed by default
  - [ ] Visual indicator (arrow icon)
- [ ] Create incompatible students selector
  - [ ] Dropdown for student selection
  - [ ] Visual tags for selected students
  - [ ] Remove tag functionality
  - [ ] Add multiple students to group
- [ ] Build incompatible pairs list
  - [ ] Display all pairs
  - [ ] Multi-select for removal
  - [ ] Empty state message
- [ ] Implement add/remove functionality
  - [ ] Create all pairwise combinations
  - [ ] Duplicate pair detection
  - [ ] Success/error feedback

### Phase 8: Teacher View - Export/Import
- [ ] Implement export functionality
  - [ ] Generate JSON from storage
  - [ ] Download with timestamp in filename
  - [ ] Success message with feedback
- [ ] Build import modal
  - [ ] File input (JSON only)
  - [ ] Validation and error messages
  - [ ] Confirmation before overwrite
  - [ ] Progress indicator
- [ ] Add sample data loader
  - [ ] Pre-populated class lists
  - [ ] Confirmation before overwrite
  - [ ] Auto-select first class after load

### Phase 9: Student View - UI & Display
- [ ] Build student view structure
  - [ ] Clean, minimal header with class name
  - [ ] Groups container
  - [ ] Switch to teacher view link
- [ ] Create group bubble/card components
  - [ ] Large, visually appealing design
  - [ ] Group title with emoji/number
  - [ ] Member names list
  - [ ] Responsive layout (rectangular for >6 students)
- [ ] Implement confetti animation
  - [ ] 100 pieces
  - [ ] Random colours from pastel palette
  - [ ] 5-second duration
  - [ ] Auto-cleanup after animation
- [ ] Add staggered entrance animations
  - [ ] 0.1s delay per group
  - [ ] Bounce or fade-in effect
- [ ] Handle empty states
  - [ ] No groups message
  - [ ] Link back to teacher view

### Phase 10: Student View - Data Loading
- [ ] Implement URL parameter handling
  - [ ] Parse list ID from URL
  - [ ] Parse base64-encoded group data
  - [ ] Dual-method fallback for compatibility
  - [ ] Error handling for malformed data
- [ ] Implement LocalStorage fallback
  - [ ] Read current list from storage
  - [ ] Display groups from storage
  - [ ] Handle missing data gracefully
- [ ] Create student view link generator (teacher side)
  - [ ] Encode current groups in URL
  - [ ] Update link when groups regenerate
  - [ ] Copy-to-clipboard functionality (optional enhancement)

### Phase 11: Responsive Design & Mobile
- [ ] Test all breakpoints
  - [ ] Mobile (320px - 767px)
  - [ ] Tablet (768px - 1023px)
  - [ ] Desktop (1024px+)
  - [ ] Desktop (WQHD/4k)
- [ ] Implement mobile-specific enhancements
  - [ ] Touch-friendly hit targets (min 44x44px)
  - [ ] Scroll-snap for student view groups
  - [ ] Hamburger menu if needed for header actions
  - [ ] Optimise drag-and-drop for touch
- [ ] Test on actual devices
  - [ ] iOS Safari
  - [ ] Android Chrome
  - [ ] Tablet landscape/portrait

### Phase 12: Accessibility
- [ ] Keyboard navigation
  - [ ] Tab order logical and complete
  - [ ] Focus indicators visible
  - [ ] Escape to close modals
  - [ ] Enter to submit forms
- [ ] Screen reader support
  - [ ] Semantic HTML elements
  - [ ] ARIA labels where needed
  - [ ] Alt text for visual elements
  - [ ] Announce dynamic content changes
- [ ] Colour contrast
  - [ ] All text meets WCAG AA standards (4.5:1)
  - [ ] Interactive elements clearly distinguishable
  - [ ] Error states clearly visible
- [ ] Reduced motion support
  - [ ] Respect `prefers-reduced-motion`
  - [ ] Disable animations for users who prefer reduced motion

### Phase 13: Performance Optimisation
- [ ] Minimise bundle size
  - [ ] Tree-shake unused Animate.css animations
  - [ ] Remove unused CSS
  - [ ] Optimise font loading (font-display: swap)
- [ ] Optimise animations
  - [ ] Use transform and opacity only
  - [ ] Avoid layout thrashing
  - [ ] Test 60fps on low-end devices
- [ ] Lazy load non-critical resources
  - [ ] Defer non-essential JavaScript
  - [ ] Load fonts asynchronously
- [ ] Test performance
  - [ ] Lighthouse audit (aim for 90+ performance)
  - [ ] Test on slow 3G connection
  - [ ] Measure group generation speed (<500ms)

### Phase 14: Browser Testing & Compatibility
- [ ] Ensure it will work in Firefox, Chrome and Safari
  - [ ] Chrome
  - [ ] Firefox
  - [ ] Safari
- [ ] Graceful degradation for unsupported features
  - [ ] View Transitions API fallback (instant switch)
  - [ ] Glassmorphism fallback (solid backgrounds)
  - [ ] Container queries fallback (media queries)
- [ ] Test offline functionality
  - [ ] Works after initial load without internet
  - [ ] Service worker (optional enhancement)

### Phase 15: Polish & User Experience
- [ ] Add loading states for all async operations
- [ ] Implement success/error toast messages
  - [ ] Auto-dismiss after 3 seconds
  - [ ] Smooth entrance/exit animations
  - [ ] Colour-coded by type (success/error/info)
- [ ] Add empty states with helpful guidance
  - [ ] New user onboarding hints
  - [ ] Clear next action suggestions
- [ ] Add confirmation dialogues for destructive actions
  - [ ] Delete class list
  - [ ] Clear all data
  - [ ] Import (overwrite existing)
- [ ] Implement footer reminder about local storage
  - [ ] Persistent across all pages
  - [ ] Subtle but visible
  - [ ] Link to export functionality

### Phase 16: Testing & Quality Assurance
- [ ] Functional testing
  - [ ] Create/edit/delete class lists
  - [ ] Add/remove students (single and bulk)
  - [ ] Add/remove incompatible pairs
  - [ ] Generate groups with various sizes
  - [ ] Export/import configuration
  - [ ] Switch between teacher and student views
- [ ] Edge case testing
  - [ ] Single student in class
  - [ ] Many incompatible pairs
  - [ ] Impossible constraint satisfaction
  - [ ] Empty class list
  - [ ] Browser storage limits
- [ ] Cross-browser testing
  - [ ] All features work in supported browsers
  - [ ] Visual consistency across browsers
- [ ] Usability testing
  - [ ] Test with actual teachers if possible
  - [ ] Gather feedback on workflow
  - [ ] Iterate based on feedback

### Phase 17: Documentation & Deployment
- [ ] Update README with new features and tech stack
- [ ] Verify GitHub Pages deployment configuration
- [ ] Add meta tags for social sharing
  - [ ] Open Graph tags
  - [ ] Twitter card tags
  - [ ] Favicon and app icons

### Phase 18: Future Enhancements (Post-MVP)
- [x] ~~Group history and undo/redo~~ (deferred)
- [x] ~~Group locking (pin students to groups)~~ (deferred)
- [ ] Additional teaching tools (see Multi-Tool Architecture below)

---

## Multi-Tool Architecture

### Vision

Emma's Teacher Tools is designed to be a **suite of teaching utilities** rather than a single-purpose application. The GroupThing tool is the first of many classroom management tools.

### Proposed Structure

```
teachertools/
├── index.html                    # Tool launcher/dashboard (CURRENT: GroupThing app)
├── tools/
│   ├── groupthing/
│   │   ├── index.html           # Move current index.html here
│   │   ├── js/                  # Tool-specific JS
│   │   └── README.md            # Tool documentation
│   ├── timer/                   # Future: Classroom timer
│   │   ├── index.html
│   │   └── ...
│   ├── randomiser/              # Future: Random student picker
│   │   ├── index.html
│   │   └── ...
│   └── quiz/                    # Future: Quick quiz generator
│       ├── index.html
│       └── ...
├── shared/
│   ├── styles/                  # Shared CSS framework
│   │   ├── variables.css        # Design tokens
│   │   ├── reset.css
│   │   ├── utilities.css
│   │   ├── layout.css
│   │   └── components.css
│   └── js/
│       ├── storage.js           # Generic storage wrapper
│       ├── utils.js             # Shared utilities
│       └── navigation.js        # Tool switching
├── assets/
│   ├── icons/                   # Tool icons
│   └── images/
├── README.md
└── DEPLOYMENT.md
```

### Tool Dashboard Design

**Landing Page (New index.html):**
```html
┌─────────────────────────────────────┐
│  Emma's Teacher Tools     📚 About  │
├─────────────────────────────────────┤
│                                     │
│  ┌───────────┐  ┌───────────┐     │
│  │ 👥        │  │ ⏱️         │     │
│  │ GroupThing│  │ Timer     │     │
│  │ Generate  │  │ Coming    │     │
│  │ groups    │  │ Soon      │     │
│  └───────────┘  └───────────┘     │
│                                     │
│  ┌───────────┐  ┌───────────┐     │
│  │ 🎲        │  │ 📝        │     │
│  │ Randomiser│  │ Quiz Maker│     │
│  │ Coming    │  │ Coming    │     │
│  │ Soon      │  │ Soon      │     │
│  └───────────┘  └───────────┘     │
│                                     │
│  Recently Used: GroupThing (2m ago)│
└─────────────────────────────────────┘
```

### Storage Namespace Strategy

**Current:** `emmaTeacherTools_v2` (single namespace)

**Proposed:**
- `emmaTools_groupthing_v1` - GroupThing data
- `emmaTools_timer_v1` - Timer presets
- `emmaTools_randomiser_v1` - Random picker settings
- `emmaTools_meta` - Cross-tool metadata (favourites, recent tools)

**Benefits:**
- Tools can't interfere with each other's data
- Individual tool data can be cleared without affecting others
- Easy to add new tools without migration
- Export/import can be tool-specific or global

### Tool Integration Guidelines

Each new tool should:
1. **Be self-contained** - All tool-specific code in `tools/[toolname]/`
2. **Use shared CSS** - Import from `shared/styles/`
3. **Use shared utilities** - Import from `shared/js/`
4. **Follow design system** - Use existing colour palette and components
5. **Namespaced storage** - Use tool-specific localStorage key
6. **Include metadata** - Tool name, description, icon, version in manifest
7. **Mobile-first** - Responsive design for all screen sizes
8. **Offline-capable** - Work without internet after initial load

### Tool Manifest Example

```json
{
  "id": "groupthing",
  "name": "GroupThing",
  "description": "Generate random student groups with constraints",
  "icon": "👥",
  "version": "2.0.0",
  "author": "Sam McLeod",
  "path": "tools/groupthing/index.html",
  "tags": ["groups", "students", "classroom"],
  "storageKey": "emmaTools_groupthing_v1",
  "offlineCapable": true
}
```

### Implementation Phases

#### Phase 1: Restructure (Optional)
- Move current `index.html` to `tools/groupthing/index.html`
- Move CSS to `shared/styles/`
- Move generic JS to `shared/js/`
- Create new landing page at root `index.html`
- Update all paths and references

**Alternative:** Keep current structure, add new tools as separate top-level files

#### Phase 2: Add Navigation
- Create tool launcher page with cards
- Add "Back to Tools" button in each tool
- Recent tools tracking
- Favourites system

#### Phase 3: New Tools
- Classroom Timer (Pomodoro-style)
- Random Student Picker (with fairness tracking)
- Quick Quiz Generator
- Seating Chart Designer

### Migration Path

**Option A: Big Bang** (Restructure everything at once)
- Pros: Clean, consistent structure
- Cons: Breaking changes for existing users

**Option B: Gradual** (Keep current, add new tools alongside)
- Pros: No breaking changes
- Cons: Inconsistent structure until migration

**Recommendation:** Option B - Keep `index.html` as GroupThing, add new tools as `timer.html`, `randomiser.html`, etc. Add a simple navigation menu to each tool's header.

---

## Development Tips

**Suggested Order:**
Work through phases 1-17 sequentially. Don't skip ahead as later phases depend on earlier ones.

**Testing Strategy:**
Test each phase thoroughly before moving to the next. Use browser DevTools and test on real devices early and often.

**Git Workflow:**
- Create feature branches for each phase
- Commit frequently with clear messages
- Use conventional commits (feat:, fix:, docs:, etc.)
- Tag releases (v2.0.0 for rewrite)

**Code Quality:**
- Keep functions small and focused
- Use meaningful variable names
- Comment complex logic
- Maintain separation of concerns (data/UI/storage)

**Performance Budget:**
- Total page size: <500KB
- Time to interactive: <3 seconds on 3G
- First contentful paint: <1.5 seconds

## Footer Notice

"All data is stored _locally_ in your browser. Remember to export your config as a backup!"

This persistent reminder ensures users understand the data storage model and encourages regular backups.
