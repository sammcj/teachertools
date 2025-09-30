/**
 * Teacher View Controller
 * Main application logic for the teacher interface
 */

class TeacherApp {
  constructor() {
    this.currentListId = null;
    this.selectedStudents = [];
    this.selectedIncompatible = [];
    this.selectedRulesForRemoval = [];
    this.editingListId = null;

    this.init();
  }

  init() {
    this.cacheDOM();
    this.bindEvents();
    this.loadLists();
    this.loadCurrentList();
  }

  cacheDOM() {
    // Class list elements
    this.classListsContainer = document.getElementById('class-lists');
    this.listSelector = document.getElementById('list-selector');
    this.currentListName = document.getElementById('current-list-name');

    // Panels
    this.groupControls = document.getElementById('group-controls');
    this.studentPanel = document.getElementById('student-panel');
    this.rulesPanel = document.getElementById('rules-panel');
    this.groupsPanel = document.getElementById('groups-panel');

    // Student elements
    this.studentList = document.getElementById('student-list');
    this.studentInput = document.getElementById('student-input');
    this.addStudentBtn = document.getElementById('add-student-btn');
    this.removeStudentBtn = document.getElementById('remove-student-btn');

    // Group generation elements
    this.generateBtn = document.getElementById('generate-btn');
    this.groupSizeSlider = document.getElementById('group-size-slider');
    this.groupSizeDisplay = document.getElementById('group-size-display');
    this.emojiToggle = document.getElementById('emoji-toggle');
    this.groupsPreview = document.getElementById('groups-preview');

    // Rules elements
    this.rulesHeader = document.getElementById('rules-header');
    this.rulesContent = document.getElementById('rules-content');
    this.rulesToggle = document.getElementById('rules-toggle');
    this.rulesCount = document.getElementById('rules-count');
    this.incompatibleList = document.getElementById('incompatible-list');
    this.studentSelector = document.getElementById('student-selector');
    this.selectedStudentsContainer = document.getElementById('selected-students');
    this.addRuleBtn = document.getElementById('add-rule-btn');
    this.removeRuleBtn = document.getElementById('remove-rule-btn');
    this.ruleTypeNever = document.getElementById('rule-type-never');
    this.ruleTypeAlways = document.getElementById('rule-type-always');

    // Action buttons
    this.newListBtn = document.getElementById('new-list-btn');
    this.sampleDataBtn = document.getElementById('sample-data-btn');
    this.clearAllBtn = document.getElementById('clear-all-btn');
    this.exportBtn = document.getElementById('export-btn');
    this.importBtn = document.getElementById('import-btn');

    // Modals
    this.listModal = document.getElementById('list-modal');
    this.listModalTitle = document.getElementById('list-modal-title');
    this.listNameInput = document.getElementById('list-name-input');
    this.saveListBtn = document.getElementById('save-list-btn');
    this.cancelListBtn = document.getElementById('cancel-list-btn');
    this.listModalClose = document.getElementById('list-modal-close');

    this.importModal = document.getElementById('import-modal');
    this.importFileInput = document.getElementById('import-file-input');
    this.importError = document.getElementById('import-error');
    this.confirmImportBtn = document.getElementById('confirm-import-btn');
    this.cancelImportBtn = document.getElementById('cancel-import-btn');
    this.importModalClose = document.getElementById('import-modal-close');
  }

  bindEvents() {
    // List management
    this.newListBtn.addEventListener('click', () => this.openNewListModal());
    this.sampleDataBtn.addEventListener('click', () => this.loadSampleData());
    this.clearAllBtn.addEventListener('click', () => this.clearAll());
    this.listSelector.addEventListener('change', () => this.handleListChange());

    // Student management
    this.addStudentBtn.addEventListener('click', () => this.addStudents());
    this.removeStudentBtn.addEventListener('click', () => this.removeSelectedStudents());
    this.studentInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.addStudents();
      }
    });

    // Group generation
    this.generateBtn.addEventListener('click', () => this.generateGroups());
    this.groupSizeSlider.addEventListener('input', () => this.updateGroupSize());
    this.emojiToggle.addEventListener('change', () => this.toggleEmojiNames());

    // Rules management
    this.rulesHeader.addEventListener('click', () => this.toggleRulesPanel());
    this.studentSelector.addEventListener('change', () => this.handleStudentSelect());
    this.addRuleBtn.addEventListener('click', () => this.addIncompatibleRule());
    this.removeRuleBtn.addEventListener('click', () => this.removeSelectedRules());

    // Export/Import
    this.exportBtn.addEventListener('click', () => this.exportData());
    this.importBtn.addEventListener('click', () => this.openImportModal());
    this.confirmImportBtn.addEventListener('click', () => this.importData());

    // Modals
    this.saveListBtn.addEventListener('click', () => this.saveList());
    this.cancelListBtn.addEventListener('click', () => this.closeListModal());
    this.listModalClose.addEventListener('click', () => this.closeListModal());
    this.cancelImportBtn.addEventListener('click', () => this.closeImportModal());
    this.importModalClose.addEventListener('click', () => this.closeImportModal());

    // Click outside modals to close
    this.listModal.addEventListener('click', (e) => {
      if (e.target === this.listModal) this.closeListModal();
    });
    this.importModal.addEventListener('click', (e) => {
      if (e.target === this.importModal) this.closeImportModal();
    });
  }

  // List Management Methods

  loadLists() {
    const lists = Storage.getLists();
    this.classListsContainer.innerHTML = '';
    this.listSelector.innerHTML = '<option value="">Select a list...</option>';

    if (Object.keys(lists).length === 0) {
      this.classListsContainer.innerHTML = '<div class="empty-state"><p class="text-sm">No class lists yet</p></div>';
      return;
    }

    Object.entries(lists).forEach(([id, list]) => {
      // Add to sidebar
      const listItem = this.createListItem(id, list);
      this.classListsContainer.appendChild(listItem);

      // Add to dropdown
      const option = document.createElement('option');
      option.value = id;
      option.textContent = list.name;
      this.listSelector.appendChild(option);
    });
  }

  createListItem(id, list) {
    const div = document.createElement('div');
    div.className = 'card p-md cursor-pointer transition';
    div.dataset.listId = id;
    div.draggable = true;

    if (id === this.currentListId) {
      div.style.borderLeft = '4px solid var(--lavender)';
    }

    div.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-sm">
          <span class="drag-handle cursor-move select-none" style="opacity: 0.5;">⋮⋮</span>
          <span class="font-semibold">${list.name}</span>
        </div>
        <div class="flex gap-xs">
          <button class="btn-icon edit-list" title="Edit" data-id="${id}">✏️</button>
          <button class="btn-icon delete-list" title="Delete" data-id="${id}">🗑️</button>
        </div>
      </div>
      <div class="text-xs text-secondary mt-xs">
        ${list.students.length} students
      </div>
    `;

    // Click handler
    div.addEventListener('click', (e) => {
      if (!e.target.closest('.edit-list') &&
          !e.target.closest('.delete-list') &&
          !e.target.closest('.drag-handle')) {
        this.selectList(id);
      }
    });

    // Drag and drop handlers
    div.addEventListener('dragstart', (e) => {
      this.draggedItem = div;
      div.style.opacity = '0.5';
      e.dataTransfer.effectAllowed = 'move';
    });

    div.addEventListener('dragend', (e) => {
      div.style.opacity = '1';
      this.draggedItem = null;
      document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    });

    div.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      return false;
    });

    div.addEventListener('dragenter', (e) => {
      if (this.draggedItem !== div) {
        div.classList.add('drag-over');
      }
    });

    div.addEventListener('dragleave', (e) => {
      div.classList.remove('drag-over');
    });

    div.addEventListener('drop', (e) => {
      e.stopPropagation();
      e.preventDefault();

      if (this.draggedItem && this.draggedItem !== div) {
        const allItems = Array.from(this.classListsContainer.children);
        const draggedIndex = allItems.indexOf(this.draggedItem);
        const dropIndex = allItems.indexOf(div);

        if (dropIndex < draggedIndex) {
          this.classListsContainer.insertBefore(this.draggedItem, div);
        } else {
          this.classListsContainer.insertBefore(this.draggedItem, div.nextSibling);
        }

        this.saveListOrder();
      }

      div.classList.remove('drag-over');
      return false;
    });

    const editBtn = div.querySelector('.edit-list');
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openEditListModal(id, list.name);
    });

    const deleteBtn = div.querySelector('.delete-list');
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.deleteList(id);
    });

    return div;
  }

  saveListOrder() {
    const orderedIds = Array.from(this.classListsContainer.children)
      .map(item => item.dataset.listId)
      .filter(id => id);

    Storage.reorderLists(orderedIds);
    Utils.showToast('Order saved', 'success');
  }

  selectList(listId) {
    console.log('Teacher - Selecting list:', listId);
    this.currentListId = listId;
    Storage.setCurrentListId(listId);
    this.loadCurrentList();
    this.loadLists();
  }

  loadCurrentList() {
    const listId = Storage.getCurrentListId();

    if (!listId) {
      this.currentListName.textContent = 'Select a Class List';
      this.groupControls.classList.add('hidden');
      this.studentPanel.classList.add('hidden');
      this.rulesPanel.classList.add('hidden');
      this.groupsPanel.classList.add('hidden');
      return;
    }

    const list = Storage.getList(listId);
    if (!list) return;

    this.currentListId = listId;
    this.currentListName.textContent = list.name;
    this.listSelector.value = listId;

    // Show panels
    this.groupControls.classList.remove('hidden');
    this.studentPanel.classList.remove('hidden');
    this.rulesPanel.classList.remove('hidden');

    // Load data
    this.groupSizeSlider.value = list.groupSize;
    this.groupSizeDisplay.textContent = list.groupSize;
    this.emojiToggle.checked = list.useEmojiNames;

    this.loadStudents(list.students);
    this.loadIncompatiblePairs(list.pairingRules || list.incompatiblePairs || []);
    this.updateStudentSelector(list.students);

    if (list.groups) {
      this.displayGroups(list.groups, list.useEmojiNames);
    } else {
      this.groupsPanel.classList.add('hidden');
    }
  }

  openNewListModal() {
    this.editingListId = null;
    this.listModalTitle.textContent = 'Create New Class List';
    this.listNameInput.value = '';
    this.listModal.classList.add('active');
    this.listNameInput.focus();
  }

  openEditListModal(listId, listName) {
    this.editingListId = listId;
    this.listModalTitle.textContent = 'Edit Class List';
    this.listNameInput.value = listName;
    this.listModal.classList.add('active');
    this.listNameInput.focus();
  }

  saveList() {
    const name = this.listNameInput.value.trim();

    if (!name) {
      Utils.showToast('Please enter a list name', 'error');
      return;
    }

    if (this.editingListId) {
      // Update existing list
      Storage.updateList(this.editingListId, { name });
      Utils.showToast('List updated', 'success');
    } else {
      // Create new list
      const newId = Storage.createList(name);
      this.selectList(newId);
      Utils.showToast('List created', 'success');
    }

    this.closeListModal();
    this.loadLists();
  }

  closeListModal() {
    this.listModal.classList.remove('active');
  }

  deleteList(listId) {
    const list = Storage.getList(listId);
    if (!list) return;

    if (!Utils.confirm(`Delete "${list.name}"? This cannot be undone.`)) {
      return;
    }

    Storage.deleteList(listId);
    Utils.showToast('List deleted', 'success');

    if (this.currentListId === listId) {
      this.currentListId = null;
      Storage.setCurrentListId(null);
      this.loadCurrentList();
    }

    this.loadLists();
  }

  handleListChange() {
    const listId = this.listSelector.value;
    if (listId) {
      this.selectList(listId);
    }
  }

  loadSampleData() {
    if (Object.keys(Storage.getLists()).length > 0) {
      if (!Utils.confirm('This will replace your existing data. Continue?')) {
        return;
      }
    }

    const listId = Storage.loadSampleData();
    this.selectList(listId);
    this.loadLists();
    Utils.showToast('Sample data loaded', 'success');
  }

  clearAll() {
    if (!Utils.confirm('Clear all data? This cannot be undone.')) {
      return;
    }

    Storage.clearAll();
    this.currentListId = null;
    this.loadLists();
    this.loadCurrentList();
    Utils.showToast('All data cleared', 'success');
  }

  // Student Management Methods

  loadStudents(students) {
    this.studentList.innerHTML = '';
    this.selectedStudents = [];

    if (students.length === 0) {
      this.studentList.innerHTML = '<div class="empty-state"><p class="text-sm">No students yet</p></div>';
      return;
    }

    students.forEach(student => {
      const div = document.createElement('div');
      div.className = 'card p-sm cursor-pointer transition';
      div.textContent = student;
      div.dataset.student = student;

      div.addEventListener('click', () => {
        div.classList.toggle('student-selected');
        const index = this.selectedStudents.indexOf(student);
        if (index > -1) {
          this.selectedStudents.splice(index, 1);
        } else {
          this.selectedStudents.push(student);
        }
      });

      this.studentList.appendChild(div);
    });
  }

  addStudents() {
    const input = this.studentInput.value.trim();

    if (!input) {
      Utils.showToast('Please enter student name(s)', 'error');
      return;
    }

    const list = Storage.getList(this.currentListId);
    if (!list) return;

    // Split by newlines first, then by commas
    const names = input
      .split('\n')
      .flatMap(line => line.split(','))
      .map(n => n.trim())
      .filter(n => n);

    let addedCount = 0;
    let duplicateCount = 0;

    names.forEach(name => {
      if (list.students.includes(name)) {
        duplicateCount++;
      } else {
        list.students.push(name);
        addedCount++;
      }
    });

    Storage.updateList(this.currentListId, { students: list.students });

    if (addedCount > 0) {
      Utils.showToast(`Added ${addedCount} student(s)`, 'success');
      this.studentInput.value = '';
      this.loadCurrentList();
    }

    if (duplicateCount > 0) {
      Utils.showToast(`${duplicateCount} duplicate(s) skipped`, 'warning');
    }
  }

  removeSelectedStudents() {
    if (this.selectedStudents.length === 0) {
      Utils.showToast('Please select students to remove', 'error');
      return;
    }

    const list = Storage.getList(this.currentListId);
    if (!list) return;

    list.students = list.students.filter(s => !this.selectedStudents.includes(s));

    // Also remove from pairing rules
    if (!list.pairingRules && list.incompatiblePairs) {
      list.pairingRules = list.incompatiblePairs.map(pair => ({
        type: 'never',
        students: pair
      }));
    }

    list.pairingRules = list.pairingRules.filter(rule =>
      rule.students.every(s => !this.selectedStudents.includes(s))
    );

    Storage.updateList(this.currentListId, {
      students: list.students,
      pairingRules: list.pairingRules
    });

    Utils.showToast(`Removed ${this.selectedStudents.length} student(s)`, 'success');
    this.selectedStudents = [];
    this.loadCurrentList();
  }

  // Group Generation Methods

  updateGroupSize() {
    const size = parseInt(this.groupSizeSlider.value);
    this.groupSizeDisplay.textContent = size;

    if (this.currentListId) {
      Storage.updateList(this.currentListId, { groupSize: size });
    }
  }

  toggleEmojiNames() {
    const useEmoji = this.emojiToggle.checked;

    if (this.currentListId) {
      Storage.updateList(this.currentListId, { useEmojiNames: useEmoji });

      const list = Storage.getList(this.currentListId);
      if (list.groups) {
        this.displayGroups(list.groups, useEmoji);
      }
    }
  }

  generateGroups() {
    const list = Storage.getList(this.currentListId);
    if (!list) return;

    if (list.students.length === 0) {
      Utils.showToast('Please add students first', 'error');
      return;
    }

    // Migrate old format if needed
    if (!list.pairingRules && list.incompatiblePairs) {
      list.pairingRules = list.incompatiblePairs.map(pair => ({
        type: 'never',
        students: pair
      }));
      Storage.updateList(this.currentListId, { pairingRules: list.pairingRules });
    }

    const result = Groups.generate(
      list.students,
      list.groupSize,
      list.pairingRules || []
    );

    const groups = result.groups || result;

    Storage.updateList(this.currentListId, { groups });

    this.displayGroups(groups, list.useEmojiNames);

    if (result.constraintsSatisfied === false) {
      Utils.showToast('Groups generated, but could not satisfy all pairing rules', 'warning');
    } else {
      Utils.showToast('Groups generated!', 'success');
    }
  }

  displayGroups(groups, useEmoji) {
    this.groupsPreview.innerHTML = '';
    this.groupsPanel.classList.remove('hidden');

    groups.forEach((group, index) => {
      const card = document.createElement('div');
      card.className = 'card group-card animate__animated animate__fadeInUp';
      card.style.animationDelay = `${index * 0.025}s`;
      card.style.animationDuration = '0.3s';

      const groupName = Groups.getGroupName(index, useEmoji);

      card.innerHTML = `
        <h4 class="text-base font-semibold mb-xs text-primary">${groupName}</h4>
        <ul class="stack-xs">
          ${group.map(student => `<li class="text-sm">${student}</li>`).join('')}
        </ul>
      `;

      this.groupsPreview.appendChild(card);
    });
  }

  // Rules Management Methods

  toggleRulesPanel() {
    this.rulesContent.classList.toggle('hidden');
    this.rulesToggle.textContent = this.rulesContent.classList.contains('hidden') ? '▼' : '▲';
  }

  updateStudentSelector(students) {
    this.studentSelector.innerHTML = '<option value="">Select a student</option>';

    students.forEach(student => {
      const option = document.createElement('option');
      option.value = student;
      option.textContent = student;
      this.studentSelector.appendChild(option);
    });
  }

  handleStudentSelect() {
    const student = this.studentSelector.value;
    if (!student) return;

    if (this.selectedIncompatible.includes(student)) {
      Utils.showToast('Student already selected', 'warning');
      return;
    }

    this.selectedIncompatible.push(student);
    this.renderSelectedStudents();
    this.studentSelector.value = '';
  }

  renderSelectedStudents() {
    this.selectedStudentsContainer.innerHTML = '';

    this.selectedIncompatible.forEach(student => {
      const tag = document.createElement('div');
      tag.className = 'badge flex items-center gap-xs';
      tag.innerHTML = `
        ${student}
        <span class="cursor-pointer" data-student="${student}">×</span>
      `;

      tag.querySelector('span').addEventListener('click', () => {
        this.selectedIncompatible = this.selectedIncompatible.filter(s => s !== student);
        this.renderSelectedStudents();
      });

      this.selectedStudentsContainer.appendChild(tag);
    });
  }

  addIncompatibleRule() {
    if (this.selectedIncompatible.length < 2) {
      Utils.showToast('Select at least 2 students', 'error');
      return;
    }

    const list = Storage.getList(this.currentListId);
    if (!list) return;

    // Get rule type
    const ruleType = this.ruleTypeNever.checked ? 'never' : 'always';

    // Initialise pairingRules if it doesn't exist (for old data)
    if (!list.pairingRules) {
      list.pairingRules = [];
    }

    if (ruleType === 'always') {
      // For "always together" rules, store all students as a single rule
      const rule = {
        type: 'always',
        students: [...this.selectedIncompatible]
      };

      // Check if this exact rule already exists
      const exists = list.pairingRules.some(r =>
        r.type === 'always' &&
        r.students.length === rule.students.length &&
        r.students.every(s => rule.students.includes(s))
      );

      if (!exists) {
        list.pairingRules.push(rule);
        Storage.updateList(this.currentListId, { pairingRules: list.pairingRules });
        Utils.showToast('Added "always together" rule', 'success');
      } else {
        Utils.showToast('This rule already exists', 'warning');
      }
    } else {
      // For "never together" rules, create pairwise combinations
      let addedCount = 0;
      for (let i = 0; i < this.selectedIncompatible.length; i++) {
        for (let j = i + 1; j < this.selectedIncompatible.length; j++) {
          const rule = {
            type: 'never',
            students: [this.selectedIncompatible[i], this.selectedIncompatible[j]]
          };

          // Check if this pair already exists
          const exists = list.pairingRules.some(r =>
            r.type === 'never' &&
            r.students.length === 2 &&
            ((r.students[0] === rule.students[0] && r.students[1] === rule.students[1]) ||
             (r.students[0] === rule.students[1] && r.students[1] === rule.students[0]))
          );

          if (!exists) {
            list.pairingRules.push(rule);
            addedCount++;
          }
        }
      }

      Storage.updateList(this.currentListId, { pairingRules: list.pairingRules });

      if (addedCount > 0) {
        Utils.showToast(`Added ${addedCount} "never together" rule(s)`, 'success');
      } else {
        Utils.showToast('All rules already exist', 'warning');
      }
    }

    this.selectedIncompatible = [];
    this.renderSelectedStudents();
    this.loadIncompatiblePairs(list.pairingRules);
  }

  editRule(index, rule, ruleType) {
    const list = Storage.getList(this.currentListId);
    if (!list) return;

    // Get students from rule (handle both old and new formats)
    let students;
    if (Array.isArray(rule)) {
      students = rule;
    } else {
      students = rule.students;
    }

    // Populate the selected students for editing
    this.selectedIncompatible = [...students];
    this.renderSelectedStudents();

    // Set the rule type radio button
    if (ruleType === 'always') {
      this.ruleTypeAlways.checked = true;
    } else {
      this.ruleTypeNever.checked = true;
    }

    // Remove the old rule
    list.pairingRules.splice(index, 1);
    Storage.updateList(this.currentListId, { pairingRules: list.pairingRules });
    this.loadIncompatiblePairs(list.pairingRules);

    // Scroll to the rule input area and update the rules count
    this.rulesContent.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    Utils.showToast('Rule loaded for editing - modify and click "Add Rule" to save', 'info');
  }

  loadIncompatiblePairs(rules) {
    this.incompatibleList.innerHTML = '';
    this.selectedRulesForRemoval = [];

    // Handle both old format (arrays) and new format (objects)
    if (!rules) {
      rules = [];
    }

    // Update rules count badge
    const count = rules.length;
    this.rulesCount.textContent = `${count} rule${count !== 1 ? 's' : ''}`;

    if (rules.length === 0) {
      this.incompatibleList.innerHTML = '<div class="empty-state"><p class="text-sm">No rules yet</p></div>';
      return;
    }

    rules.forEach((rule, index) => {
      const div = document.createElement('div');
      div.className = 'card p-sm cursor-pointer transition';
      div.dataset.ruleIndex = index;

      // Handle old format (simple array) vs new format (object with type)
      let icon, label, students, ruleType;
      if (Array.isArray(rule)) {
        // Old format: ['Student1', 'Student2']
        icon = '❌';
        label = 'Never';
        students = rule.join(' & ');
        ruleType = 'never';
      } else {
        // New format: { type: 'never'/'always', students: [...] }
        icon = rule.type === 'never' ? '❌' : '✅';
        label = rule.type === 'never' ? 'Never' : 'Always';
        students = rule.students.join(', ');
        ruleType = rule.type;
      }

      div.innerHTML = `
        <div class="flex items-center justify-between gap-sm">
          <div class="flex items-center gap-xs flex-1">
            <span style="font-size: 1.1em;">${icon}</span>
            <span class="font-semibold text-xs">${label}:</span>
            <span class="text-sm">${students}</span>
          </div>
          <button class="btn btn-xs btn-secondary edit-rule-btn" data-rule-index="${index}" title="Edit rule">
            ✏️
          </button>
        </div>
      `;

      // Click to select for removal
      div.addEventListener('click', (e) => {
        // Don't toggle selection if clicking the edit button
        if (e.target.classList.contains('edit-rule-btn') || e.target.closest('.edit-rule-btn')) {
          return;
        }

        div.classList.toggle('student-selected');
        const idx = this.selectedRulesForRemoval.indexOf(index);
        if (idx > -1) {
          this.selectedRulesForRemoval.splice(idx, 1);
        } else {
          this.selectedRulesForRemoval.push(index);
        }
      });

      // Edit button handler
      const editBtn = div.querySelector('.edit-rule-btn');
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.editRule(index, rule, ruleType);
      });

      this.incompatibleList.appendChild(div);
    });
  }

  removeSelectedRules() {
    if (this.selectedRulesForRemoval.length === 0) {
      Utils.showToast('Please select rules to remove', 'error');
      return;
    }

    const list = Storage.getList(this.currentListId);
    if (!list) return;

    // Initialise pairingRules if using old format
    if (!list.pairingRules && list.incompatiblePairs) {
      list.pairingRules = list.incompatiblePairs.map(pair => ({
        type: 'never',
        students: pair
      }));
    }

    // Remove rules by index (in reverse to maintain indices)
    this.selectedRulesForRemoval.sort((a, b) => b - a).forEach(index => {
      list.pairingRules.splice(index, 1);
    });

    Storage.updateList(this.currentListId, { pairingRules: list.pairingRules });

    Utils.showToast(`Removed ${this.selectedRulesForRemoval.length} rule(s)`, 'success');
    this.selectedRulesForRemoval = [];
    this.loadIncompatiblePairs(list.pairingRules);
  }

  // Export/Import Methods

  exportData() {
    Storage.exportData();
    Utils.showToast('Config exported', 'success');
  }

  openImportModal() {
    this.importFileInput.value = '';
    this.importError.classList.add('hidden');
    this.importError.textContent = '';
    this.importModal.classList.add('active');
  }

  closeImportModal() {
    this.importModal.classList.remove('active');
  }

  async importData() {
    const file = this.importFileInput.files[0];

    if (!file) {
      this.importError.textContent = 'Please select a file';
      this.importError.classList.remove('hidden');
      return;
    }

    try {
      await Storage.importData(file);
      this.closeImportModal();
      this.loadLists();
      this.loadCurrentList();
      Utils.showToast('Data imported successfully', 'success');
    } catch (error) {
      this.importError.textContent = error.message;
      this.importError.classList.remove('hidden');
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new TeacherApp();
});