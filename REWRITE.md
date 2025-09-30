# Emma's Teacher Tools - Rewrite Specification

## Project Overview

A web-based classroom management application built for Emma, a primary school teacher. The application provides tools to help manage classroom activities, with the primary feature being "GroupThing" - a student group generator.

**Core Principles:**
- Privacy-first: All data stored locally in browser (LocalStorage)
- No backend or server required: MUST be a static site deployable to GitHub Pages
- Offline-capable after initial load
- Simple, intuitive interface suitable for classroom use
- Visual appeal for young students

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

#### 4. Grouping Rules (Incompatible Pairs)

- Define students who cannot be grouped together
- Multi-student incompatible groupings (creates all pairwise combinations)
- Visual tags showing selected students for grouping rule
- Remove individual students from pending rule
- Remove existing incompatible pairs via selection
- Collapsible panel to save screen space
- Rules validated during group generation

#### 5. Group Naming System

- Toggle between emoji animal names and numbered groups (e.g., "Group 1")
- Setting stored per class list
- 16 predefined animal options:
  - 🦘 Kangaroos, 🐨 Koalas, 🐬 Dolphins, 🦒 Giraffes
  - 🐼 Pandas, 🐰 Rabbits, 🐶 Puppies, 🐱 Cats
  - 🦁 Lions, 🐻 Bears, 🐘 Elephants, 🦉 Owls
  - 🦅 Eagles, 🐢 Turtles, 🐯 Tigers, 🦊 Foxes
- Cycles through animals if more groups than available emojis

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
      "blacklist": [["Student 1", "Student 2"]],
      "groupSize": 3,
      "currentGroups": [["Group 1 members"], ["Group 2 members"]],
      "useEmojiNames": true
    }
  },
  "currentList": "list_[timestamp]",
  "version": "1.0.0"
}
```

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

## Footer Notice

"All data is stored _locally_ in your browser. Remember to export your config as a backup!"

This persistent reminder ensures users understand the data storage model and encourages regular backups.
