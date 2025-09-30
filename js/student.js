/**
 * Student View Controller
 * Displays generated groups for students
 */

class StudentView {
  constructor() {
    this.init();
  }

  init() {
    this.cacheDOM();
    this.loadGroups();
  }

  cacheDOM() {
    this.className = document.getElementById('class-name');
    this.groupsContainer = document.getElementById('groups-container');
    this.emptyState = document.getElementById('empty-state');
    this.confettiContainer = document.getElementById('confetti-container');
  }

  loadGroups() {
    // Try to load from URL parameters first
    const params = Utils.getUrlParams();

    if (params.data) {
      const data = Utils.decodeFromUrl(params.data);
      if (data && data.groups) {
        this.displayGroups(data.groups, data.name, data.useEmoji);
        return;
      }
    }

    // Fall back to storage
    const listId = params.list || Storage.getCurrentListId();
    console.log('Student view - Loading list ID:', listId);

    if (!listId) {
      console.log('Student view - No list ID found');
      // Check if there are any lists at all
      const allLists = Storage.getLists();
      const listIds = Object.keys(allLists);
      console.log('Student view - Available lists:', listIds);

      if (listIds.length === 1) {
        // If there's only one list, use it automatically
        const autoListId = listIds[0];
        console.log('Student view - Auto-selecting only available list:', autoListId);
        const list = Storage.getList(autoListId);
        if (list && list.groups && list.groups.length > 0) {
          this.displayGroups(list.groups, list.name, list.useEmojiNames);
          return;
        }
      }

      this.showEmptyState();
      return;
    }

    const list = Storage.getList(listId);
    console.log('Student view - Loaded list:', list);

    if (!list) {
      console.log('Student view - List not found');
      this.showEmptyState('List not found');
      return;
    }

    if (!list.groups || list.groups.length === 0) {
      console.log('Student view - No groups in list');
      this.showEmptyState();
      return;
    }

    console.log('Student view - Displaying groups:', list.groups);
    this.displayGroups(list.groups, list.name, list.useEmojiNames);
  }

  displayGroups(groups, name = 'Class Groups', useEmoji = true) {
    this.className.textContent = name;

    // Hide empty state and show groups
    if (this.emptyState) {
      this.emptyState.classList.add('hidden');
      this.emptyState.style.display = 'none';
    }
    if (this.groupsContainer) {
      this.groupsContainer.classList.remove('hidden');
      this.groupsContainer.style.display = 'flex';
      this.groupsContainer.innerHTML = '';
    }

    // Check if we need rectangular layout
    const hasLargeGroups = groups.some(g => g.length > 6);
    if (hasLargeGroups) {
      this.groupsContainer.classList.add('rectangular');
    }

    // Create group bubbles
    groups.forEach((group, index) => {
      const bubble = this.createGroupBubble(group, index, useEmoji);
      this.groupsContainer.appendChild(bubble);
    });

    // Create confetti
    this.createConfetti();
  }

  createGroupBubble(group, index, useEmoji) {
    const bubble = document.createElement('div');
    bubble.className = 'group-bubble animate__animated animate__bounceIn';
    bubble.style.animationDelay = `${index * 0.1}s`;

    const groupName = Groups.getGroupName(index, useEmoji);

    const title = document.createElement('h2');
    title.className = 'group-title';
    title.textContent = groupName;
    bubble.appendChild(title);

    const membersList = document.createElement('ul');
    membersList.className = 'group-members';

    group.forEach(student => {
      const memberItem = document.createElement('li');
      memberItem.className = 'group-member';
      memberItem.textContent = student;
      membersList.appendChild(memberItem);
    });

    bubble.appendChild(membersList);

    return bubble;
  }

  createConfetti() {
    const colours = [
      '#ffafcc', // pink
      '#a0e7e5', // mint
      '#b8c0ff', // lavender
      '#ffd166', // yellow
      '#ff9cee', // magenta
      '#ffc8a2', // peach
      '#c1fba4', // light green
      '#9bf6ff'  // light blue
    ];

    const confettiCount = 100;

    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';

      const size = Math.random() * 10 + 5;
      const colour = colours[Math.floor(Math.random() * colours.length)];
      const left = Math.random() * 100;
      const delay = Math.random() * 2;
      const duration = Math.random() * 2 + 2;

      confetti.style.width = `${size}px`;
      confetti.style.height = `${size}px`;
      confetti.style.backgroundColor = colour;
      confetti.style.left = `${left}%`;
      confetti.style.animationDelay = `${delay}s`;
      confetti.style.animationDuration = `${duration}s`;

      this.confettiContainer.appendChild(confetti);
    }

    // Clean up after animation
    setTimeout(() => {
      this.confettiContainer.innerHTML = '';
    }, 5000);
  }

  showEmptyState(message) {
    this.groupsContainer.classList.add('hidden');
    this.emptyState.classList.remove('hidden');

    if (message) {
      this.emptyState.querySelector('.empty-state-text').textContent = message;
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.studentViewInstance = new StudentView();
});