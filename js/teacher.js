/**
 * teacher.js - Teacher view functionality for GroupThing
 * Handles class list management, student management, incompatible pairs configuration, and group generation
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const classListContainer = document.getElementById('class-list-container');
    const listSelector = document.getElementById('list-selector');
    const currentListName = document.getElementById('current-list-name');
    const studentList = document.getElementById('student-list');
    const newStudentInput = document.getElementById('new-student-input');
    const addStudentBtn = document.getElementById('add-student-btn');
    const removeStudentBtn = document.getElementById('remove-student-btn');
    const groupSizeInput = document.getElementById('group-size-input');
    const groupSizeDisplay = document.getElementById('group-size-display');
    const generateGroupsBtn = document.getElementById('generate-groups-btn');
    const useEmojiNamesToggle = document.getElementById('use-emoji-names-toggle');
    const blacklistPairs = document.getElementById('incompatible-pairs');
    const blacklistStudent1 = document.getElementById('incompatible-student1');
    const selectedIncompatibleStudents = document.getElementById('selected-incompatible-students');
    const addIncompatibleStudentBtn = document.getElementById('add-incompatible-student-btn');
    const addBlacklistBtn = document.getElementById('add-incompatible-btn');
    const removeBlacklistBtn = document.getElementById('remove-incompatible-btn');
    const groupingRulesHeader = document.querySelector('.incompatible-panel .collapsible-header');
    const groupingRulesContent = document.querySelector('.incompatible-panel .section-content');
    const groupsPreviewContainer = document.getElementById('groups-preview-container');
    const listModal = document.getElementById('list-modal');
    const modalTitle = document.getElementById('modal-title');
    const listNameInput = document.getElementById('list-name-input');
    const saveListBtn = document.getElementById('save-list-btn');
    const cancelListBtn = document.getElementById('cancel-list-btn');
    const newListBtn = document.getElementById('new-list-btn');
    const loadSampleBtn = document.getElementById('load-sample-btn');
    const clearAllBtn = document.getElementById('clear-all-btn');
    const closeModal = document.querySelector('.close-modal');
    const studentViewLink = document.querySelector('.view-toggle');
    const exportSettingsBtn = document.getElementById('export-settings-btn');
    const importSettingsBtn = document.getElementById('import-settings-btn');
    const importModal = document.getElementById('import-modal');
    const importFileInput = document.getElementById('import-file-input');
    const confirmImportBtn = document.getElementById('confirm-import-btn');
    const cancelImportBtn = document.getElementById('cancel-import-btn');
    const importError = document.getElementById('import-error');

    // State variables
    let selectedStudents = [];
    let selectedBlacklistPairs = [];
    let editingListId = null;
    let draggedItem = null;

    // Drag and drop handlers for class list reordering
    function handleDragStart(e) {
        draggedItem = this;
        this.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', this.innerHTML);
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        return false;
    }

    function handleDragEnter(e) {
        this.classList.add('drag-over');
    }

    function handleDragLeave(e) {
        this.classList.remove('drag-over');
    }

    function handleDrop(e) {
        e.stopPropagation();
        e.preventDefault();

        if (draggedItem !== this) {
            // Get the positions of the dragged item and drop target
            const allItems = Array.from(classListContainer.querySelectorAll('.class-item'));
            const draggedIndex = allItems.indexOf(draggedItem);
            const dropIndex = allItems.indexOf(this);

            // Reorder the items in the DOM
            if (dropIndex < draggedIndex) {
                classListContainer.insertBefore(draggedItem, this);
            } else {
                classListContainer.insertBefore(draggedItem, this.nextSibling);
            }

            // Update the order in storage
            saveListOrder();
        }

        this.classList.remove('drag-over');
        return false;
    }

    function handleDragEnd(e) {
        this.classList.remove('dragging');
        document.querySelectorAll('.class-item').forEach(item => {
            item.classList.remove('drag-over');
        });
    }

    /**
     * Save the current order of class lists to storage
     */
    function saveListOrder() {
        const lists = StorageManager.getLists();
        const newOrder = {};

        // Get the current order from the DOM
        document.querySelectorAll('.class-item').forEach((item, index) => {
            const listId = item.dataset.id;
            if (listId && lists[listId]) {
                newOrder[listId] = lists[listId];
            }
        });

        // Save the new order to storage
        StorageManager.setLists(newOrder);
    }

    // Initialise the UI
    InitialiseUI();

    // Update student view link
    updateStudentViewLink();

    // State variables for multi-student grouping rules
    let selectedIncompatibleStudentsList = [];

    // Event listeners
    newListBtn.addEventListener('click', openNewListModal);
    loadSampleBtn.addEventListener('click', loadSampleData);
    clearAllBtn.addEventListener('click', clearAllData);
    useEmojiNamesToggle.addEventListener('change', toggleEmojiNames);
    closeModal.addEventListener('click', closeListModal);
    cancelListBtn.addEventListener('click', closeListModal);
    saveListBtn.addEventListener('click', saveList);
    listSelector.addEventListener('change', handleListSelection);
    addStudentBtn.addEventListener('click', addStudent);
    newStudentInput.addEventListener('keydown', (e) => {
        // Allow Shift+Enter to create a new line without submitting
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Prevent default to avoid adding a newline AND submitting
            addStudent();
        }
    });
    removeStudentBtn.addEventListener('click', removeSelectedStudents);
    groupSizeInput.addEventListener('input', updateGroupSizeDisplay);
    generateGroupsBtn.addEventListener('click', generateGroups);
    addIncompatibleStudentBtn.addEventListener('click', addIncompatibleStudent);
    addBlacklistBtn.addEventListener('click', addBlacklistGroup);
    removeBlacklistBtn.addEventListener('click', removeSelectedBlacklistPairs);
    exportSettingsBtn.addEventListener('click', exportSettings);
    importSettingsBtn.addEventListener('click', openImportModal);
    confirmImportBtn.addEventListener('click', importSettings);
    cancelImportBtn.addEventListener('click', closeImportModal);
    importModal.querySelector('.close-modal').addEventListener('click', closeImportModal);

    // Collapsible header for grouping rules
    if (groupingRulesHeader) {
        groupingRulesHeader.addEventListener('click', toggleGroupingRules);
    }

    // Student view link - close grouping rules when switching to student view
    if (studentViewLink) {
        studentViewLink.addEventListener('click', () => {
            // Ensure grouping rules are collapsed when switching to student view
            if (groupingRulesContent && !groupingRulesContent.classList.contains('collapsed')) {
                groupingRulesContent.classList.add('collapsed');
                if (groupingRulesHeader) {
                    groupingRulesHeader.classList.remove('active');
                }
            }
        });
    }

    /**
     * Toggle the grouping rules section visibility
     */
    function toggleGroupingRules() {
        if (groupingRulesContent) {
            groupingRulesContent.classList.toggle('collapsed');
            groupingRulesHeader.classList.toggle('active');
        }
    }

    /**
     * Initialise the UI with data from storage
     */
    function InitialiseUI() {
        // Load class lists
        loadClassLists();

        // Load current list if exists
        const currentListId = StorageManager.getCurrentListId();
        if (currentListId) {
            listSelector.value = currentListId;
            loadCurrentList(currentListId);
        }
    }

/**
 * Load class lists from storage and populate UI
 */
function loadClassLists() {
    const lists = StorageManager.getLists();

    // Clear existing lists
    classListContainer.innerHTML = '';
    listSelector.innerHTML = '<option value="">Select a list...</option>';

    // Add each list to UI
    for (const [id, list] of Object.entries(lists)) {
        // Add to class list panel
        const listItem = document.createElement('div');
        listItem.className = 'class-item';
        listItem.dataset.id = id;
        listItem.draggable = true;
        listItem.innerHTML = `
            <span class="drag-handle">⋮⋮</span>
            <span>${list.name}</span>
            <div class="class-item-actions">
                <button class="edit-list" title="Edit list name">✏️</button>
                <button class="delete-list" title="Delete list">🗑️</button>
            </div>
        `;
        classListContainer.appendChild(listItem);

        // Add click event to select list
        listItem.addEventListener('click', (e) => {
            if (!e.target.closest('.class-item-actions') && !e.target.closest('.drag-handle')) {
                selectList(id);
            }
        });

        // Add edit and delete events
        listItem.querySelector('.edit-list').addEventListener('click', () => openEditListModal(id, list.name));
        listItem.querySelector('.delete-list').addEventListener('click', () => deleteList(id));

        // Add drag events
        listItem.addEventListener('dragstart', handleDragStart);
        listItem.addEventListener('dragover', handleDragOver);
        listItem.addEventListener('dragenter', handleDragEnter);
        listItem.addEventListener('dragleave', handleDragLeave);
        listItem.addEventListener('drop', handleDrop);
        listItem.addEventListener('dragend', handleDragEnd);

        // Add to dropdown
        const option = document.createElement('option');
        option.value = id;
        option.textContent = list.name;
        listSelector.appendChild(option);
    }
}

    /**
     * Load the current list data
     * @param {string} listId - The ID of the list to load
     */
    function loadCurrentList(listId) {
        const list = StorageManager.getList(listId);
        if (!list) return;

        // Update UI with list data
        currentListName.textContent = list.name;
        groupSizeInput.value = list.groupSize;
        groupSizeDisplay.textContent = list.groupSize;

        // Set emoji names toggle
        if (useEmojiNamesToggle) {
            useEmojiNamesToggle.checked = list.useEmojiNames !== false; // Default to true if not set
        }

        // Load students
        loadStudents(list.students);

        // Load incompatible pairs
        loadIncompatiblePairs(list.blacklist);

        // Load groups if they exist
        if (list.currentGroups) {
            displayGroups(list.currentGroups);
        } else {
            groupsPreviewContainer.innerHTML = '<p class="empty-state">No groups generated yet. Use the "Generate Groups" button to create groups.</p>';
        }

        // Update active class
        document.querySelectorAll('.class-item').forEach(item => {
            item.classList.toggle('active', item.dataset.id === listId);
        });

        // Update storage
        StorageManager.setCurrentList(listId);

        // Update student view link with current list ID
        updateStudentViewLink();
    }

    /**
     * Load students into the UI
     * @param {Array} students - Array of student names
     */
    function loadStudents(students) {
        // Clear existing students
        studentList.innerHTML = '';
        selectedStudents = [];

        // Add each student to list
        students.forEach(student => {
            const li = document.createElement('li');
            li.className = 'student-item';
            li.textContent = student;
            li.addEventListener('click', () => toggleStudentSelection(li, student));
            studentList.appendChild(li);
        });

        // Update blacklist dropdowns
        updateBlacklistDropdowns();
    }

    /**
     * Load incompatible pairs into the UI
     * @param {Array} blacklist - Array of incompatible pairs
     */
    function loadIncompatiblePairs(blacklist) {
        // Clear existing incompatible pairs
        blacklistPairs.innerHTML = '';
        selectedBlacklistPairs = [];

        // Add each pair to list
        blacklist.forEach(pair => {
            const li = document.createElement('li');
            li.className = 'incompatible-item';
            li.textContent = `${pair[0]} & ${pair[1]}`;
            li.dataset.student1 = pair[0];
            li.dataset.student2 = pair[1];
            li.addEventListener('click', () => toggleBlacklistSelection(li, pair));
            blacklistPairs.appendChild(li);
        });
    }

    /**
     * Update the incompatible pairs dropdown options based on current students
     */
    function updateBlacklistDropdowns() {
        const currentListId = StorageManager.getCurrentListId();
        if (!currentListId) return;

        const list = StorageManager.getList(currentListId);
        if (!list) return;

        // Clear existing options
        blacklistStudent1.innerHTML = '<option value="">Select a student</option>';

        // Add each student as an option
        list.students.forEach(student => {
            const option = document.createElement('option');
            option.value = student;
            option.textContent = student;
            blacklistStudent1.appendChild(option);
        });
    }

    /**
     * Toggle selection of a student
     * @param {HTMLElement} element - The student list item
     * @param {string} student - The student name
     */
    function toggleStudentSelection(element, student) {
        const isSelected = element.classList.toggle('selected');

        if (isSelected) {
            selectedStudents.push(student);
        } else {
            selectedStudents = selectedStudents.filter(s => s !== student);
        }
    }

    /**
     * Toggle selection of an incompatible pair
     * @param {HTMLElement} element - The incompatible pair list item
     * @param {Array} pair - The incompatible pair
     */
    function toggleBlacklistSelection(element, pair) {
        const isSelected = element.classList.toggle('selected');

        if (isSelected) {
            selectedBlacklistPairs.push(pair);
        } else {
            selectedBlacklistPairs = selectedBlacklistPairs.filter(p =>
                !(p[0] === pair[0] && p[1] === pair[1]));
        }
    }

    /**
     * Open the modal for creating a new list
     */
    function openNewListModal() {
        modalTitle.textContent = 'Create New Class List';
        listNameInput.value = '';
        editingListId = null;
        listModal.style.display = 'flex';
        listNameInput.focus();
    }

    /**
     * Open the modal for editing a list
     * @param {string} listId - The ID of the list to edit
     * @param {string} listName - The current name of the list
     */
    function openEditListModal(listId, listName) {
        modalTitle.textContent = 'Edit Class List';
        listNameInput.value = listName;
        editingListId = listId;
        listModal.style.display = 'flex';
        listNameInput.focus();
    }

    /**
     * Close the list modal
     */
    function closeListModal() {
        listModal.style.display = 'none';
    }

    /**
     * Save the list (create new or update existing)
     */
    function saveList() {
        const listName = listNameInput.value.trim();

        if (!listName) {
            GroupThing.showError('Please enter a list name');
            return;
        }

        if (editingListId) {
            // Update existing list
            const list = StorageManager.getList(editingListId);
            if (list) {
                list.name = listName;
                StorageManager.saveList(editingListId, list);
            }
        } else {
            // Create new list
            const newListId = StorageManager.createList(listName);
            selectList(newListId);
        }

        // Reload lists and close modal
        loadClassLists();
        closeListModal();
    }

    /**
     * Delete a list
     * @param {string} listId - The ID of the list to delete
     */
    function deleteList(listId) {
        if (confirm('Are you sure you want to delete this list?')) {
            StorageManager.deleteList(listId);
            loadClassLists();

            // If deleted list was current, clear UI
            if (StorageManager.getCurrentListId() === null) {
                currentListName.textContent = 'None Selected';
                studentList.innerHTML = '';
                blacklistPairs.innerHTML = '';
                groupsPreviewContainer.innerHTML = '<p class="empty-state">No groups generated yet. Use the "Generate Groups" button to create groups.</p>';
            }
        }
    }

    /**
     * Handle list selection from dropdown
     */
    function handleListSelection() {
        const listId = listSelector.value;
        if (listId) {
            selectList(listId);
        }
    }

    /**
     * Select a list and load its data
     * @param {string} listId - The ID of the list to select
     */
    function selectList(listId) {
        listSelector.value = listId;
        loadCurrentList(listId);
    }

    /**
     * Add a new student or multiple students to the current list
     */
    function addStudent() {
        const studentInput = newStudentInput.value.trim();
        const currentListId = StorageManager.getCurrentListId();

        if (!currentListId) {
            GroupThing.showError('Please select or create a class list first');
            return;
        }

        if (!studentInput) {
            GroupThing.showError('Please enter at least one student name');
            return;
        }

        const list = StorageManager.getList(currentListId);
        if (!list) return;

        // Check if input contains multiple lines (multiple students)
        if (studentInput.includes('\n')) {
            // Split by newlines and filter out empty lines
            const studentNames = studentInput.split('\n')
                .map(name => name.trim())
                .filter(name => name.length > 0);

            let addedCount = 0;
            let duplicateCount = 0;

            // Add each student
            studentNames.forEach(name => {
                // Skip if student already exists
                if (list.students.includes(name)) {
                    duplicateCount++;
                    return;
                }

                // Add student to list
                list.students.push(name);
                addedCount++;
            });

            // Save the updated list
            StorageManager.saveList(currentListId, list);

            // Update UI
            loadStudents(list.students);
            newStudentInput.value = '';
            newStudentInput.focus();

            // Show success/warning message
            if (addedCount > 0) {
                let message = `Added ${addedCount} student${addedCount !== 1 ? 's' : ''}`;
                if (duplicateCount > 0) {
                    message += ` (${duplicateCount} duplicate${duplicateCount !== 1 ? 's' : ''} skipped)`;
                }
                GroupThing.showError(message, 3000);
            } else if (duplicateCount > 0) {
                GroupThing.showError(`All ${duplicateCount} student${duplicateCount !== 1 ? 's' : ''} already exist in the list`);
            }
        } else {
            // Single student case
            const studentName = studentInput;

            // Check if student already exists
            if (list.students.includes(studentName)) {
                GroupThing.showError('This student is already in the list');
                return;
            }

            // Add student to list
            list.students.push(studentName);
            StorageManager.saveList(currentListId, list);

            // Update UI
            loadStudents(list.students);
            newStudentInput.value = '';
            newStudentInput.focus();
        }
    }

    /**
     * Remove selected students from the current list
     */
    function removeSelectedStudents() {
        if (selectedStudents.length === 0) {
            GroupThing.showError('Please select students to remove');
            return;
        }

        const currentListId = StorageManager.getCurrentListId();
        if (!currentListId) return;

        const list = StorageManager.getList(currentListId);
        if (!list) return;

        // Remove selected students
        list.students = list.students.filter(student => !selectedStudents.includes(student));

        // Also remove from incompatible pairs
        list.blacklist = list.blacklist.filter(pair =>
            !selectedStudents.includes(pair[0]) && !selectedStudents.includes(pair[1]));

        // Save changes
        StorageManager.saveList(currentListId, list);

        // Update UI
        loadStudents(list.students);
        loadIncompatiblePairs(list.blacklist);
    }

    /**
     * Update the displayed group size value
     */
    function updateGroupSizeDisplay() {
        const size = parseInt(groupSizeInput.value);
        groupSizeDisplay.textContent = size;

        // Update storage
        const currentListId = StorageManager.getCurrentListId();
        if (currentListId) {
            StorageManager.updateGroupSize(currentListId, size);
        }
    }

    /**
     * Add a student to the incompatible students list
     */
    function addIncompatibleStudent() {
        const student = blacklistStudent1.value;

        if (!student) {
            GroupThing.showError('Please select a student to add');
            return;
        }

        // Check if student is already in the list
        if (selectedIncompatibleStudentsList.includes(student)) {
            GroupThing.showError('This student is already in the incompatible group');
            return;
        }

        // Add to the list
        selectedIncompatibleStudentsList.push(student);

        // Update UI
        updateSelectedIncompatibleStudentsUI();

        // Clear selection
        blacklistStudent1.value = '';
    }

    /**
     * Update the UI to show selected incompatible students
     */
    function updateSelectedIncompatibleStudentsUI() {
        selectedIncompatibleStudents.innerHTML = '';

        selectedIncompatibleStudentsList.forEach(student => {
            const tag = document.createElement('div');
            tag.className = 'student-tag';
            tag.innerHTML = `
                ${student} <span class="remove-tag" data-student="${student}">×</span>
            `;

            // Add click event to remove tag
            tag.querySelector('.remove-tag').addEventListener('click', (e) => {
                e.stopPropagation();
                removeIncompatibleStudent(student);
            });

            selectedIncompatibleStudents.appendChild(tag);
        });
    }

    /**
     * Remove a student from the incompatible students list
     * @param {string} student - The student to remove
     */
    function removeIncompatibleStudent(student) {
        selectedIncompatibleStudentsList = selectedIncompatibleStudentsList.filter(s => s !== student);
        updateSelectedIncompatibleStudentsUI();
    }

    /**
     * Add a group of incompatible students to the blacklist
     */
    function addBlacklistGroup() {
        const currentListId = StorageManager.getCurrentListId();

        if (!currentListId) {
            GroupThing.showError('Please select or create a class list first');
            return;
        }

        if (selectedIncompatibleStudentsList.length < 2) {
            GroupThing.showError('Please select at least two students for the incompatible group');
            return;
        }

        const list = StorageManager.getList(currentListId);
        if (!list) return;

        // Create all possible pairs from the selected students
        for (let i = 0; i < selectedIncompatibleStudentsList.length; i++) {
            for (let j = i + 1; j < selectedIncompatibleStudentsList.length; j++) {
                const student1 = selectedIncompatibleStudentsList[i];
                const student2 = selectedIncompatibleStudentsList[j];

                // Check if pair already exists (in either order)
                const pairExists = list.blacklist.some(pair =>
                    (pair[0] === student1 && pair[1] === student2) ||
                    (pair[0] === student2 && pair[1] === student1));

                if (!pairExists) {
                    // Add pair to incompatible pairs
                    list.blacklist.push([student1, student2]);
                }
            }
        }

        // Save changes
        StorageManager.saveList(currentListId, list);

        // Update UI
        loadIncompatiblePairs(list.blacklist);

        // Store count before clearing
        const count = selectedIncompatibleStudentsList.length;

        // Clear selected students
        selectedIncompatibleStudentsList = [];
        updateSelectedIncompatibleStudentsUI();

        // Show success message
        GroupThing.showError(`Added ${count} students to grouping rules`, 3000);
    }

    /**
     * Remove selected incompatible pairs from the current list
     */
    function removeSelectedBlacklistPairs() {
        if (selectedBlacklistPairs.length === 0) {
            GroupThing.showError('Please select incompatible pairs to remove');
            return;
        }

        const currentListId = StorageManager.getCurrentListId();
        if (!currentListId) return;

        const list = StorageManager.getList(currentListId);
        if (!list) return;

        // Remove selected pairs
        list.blacklist = list.blacklist.filter(pair => {
            return !selectedBlacklistPairs.some(selectedPair =>
                (pair[0] === selectedPair[0] && pair[1] === selectedPair[1]) ||
                (pair[0] === selectedPair[1] && pair[1] === selectedPair[0]));
        });

        // Save changes
        StorageManager.saveList(currentListId, list);

        // Update UI
        loadIncompatiblePairs(list.blacklist);
    }

    /**
     * Generate groups based on current settings
     */
    function generateGroups() {
        const currentListId = StorageManager.getCurrentListId();

        if (!currentListId) {
            GroupThing.showError('Please select or create a class list first');
            return;
        }

        const list = StorageManager.getList(currentListId);
        if (!list) return;

        if (list.students.length === 0) {
            GroupThing.showError('Please add students to the list first');
            return;
        }

        // Generate groups
        const groupSize = parseInt(groupSizeInput.value);
        const groups = GroupThing.generateGroups(list.students, groupSize, list.blacklist);

        // Save groups
        StorageManager.saveGroups(currentListId, groups);

        // Display groups
        displayGroups(groups);

        // Update student view link
        updateStudentViewLink();
    }

    /**
     * Display generated groups in the preview container
     * @param {Array} groups - Array of generated groups
     */
    function displayGroups(groups) {
        groupsPreviewContainer.innerHTML = '';

        // Get current list to check if emoji names are enabled
        const currentListId = StorageManager.getCurrentListId();
        const currentList = StorageManager.getList(currentListId);
        const useEmojiNames = currentList && currentList.useEmojiNames !== false;

        groups.forEach((group, index) => {
            const groupElement = document.createElement('div');
            groupElement.className = 'preview-group';

            const groupTitle = document.createElement('h3');
            groupTitle.className = 'preview-group-title';
            groupTitle.textContent = GroupThing.formatGroupName(index, useEmojiNames);

            const membersList = document.createElement('ul');
            membersList.className = 'preview-group-members';

            group.forEach(student => {
                const memberItem = document.createElement('li');
                memberItem.className = 'preview-group-member';
                memberItem.textContent = student;
                membersList.appendChild(memberItem);
            });

            groupElement.appendChild(groupTitle);
            groupElement.appendChild(membersList);
            groupsPreviewContainer.appendChild(groupElement);
        });
    }

    /**
     * Toggle emoji names for groups
     */
    function toggleEmojiNames() {
        const currentListId = StorageManager.getCurrentListId();
        if (!currentListId) return;

        const list = StorageManager.getList(currentListId);
        if (!list) return;

        // Update the setting
        list.useEmojiNames = useEmojiNamesToggle.checked;
        StorageManager.saveList(currentListId, list);

        // Update the display if groups exist
        if (list.currentGroups && list.currentGroups.length > 0) {
            displayGroups(list.currentGroups);
        }
    }

    /**
     * Update the student view link with the current list ID and data
     */
    function updateStudentViewLink() {
        if (studentViewLink) {
            const currentListId = StorageManager.getCurrentListId();
            if (currentListId) {
                // Get the current list data
                const list = StorageManager.getList(currentListId);
                if (list && list.currentGroups && list.currentGroups.length > 0) {
                    // Create a simplified version of the list data to pass in the URL
                    const listData = {
                        id: currentListId,
                        name: list.name,
                        groups: list.currentGroups
                    };

                    // Encode the data as a base64 string to avoid URL encoding issues
                    const encodedData = btoa(JSON.stringify(listData));

                    // Set the href with both the list ID and the encoded data
                    studentViewLink.href = `student.html?list=${currentListId}&data=${encodedData}`;
                    console.log('Updated student view link with list data');
                } else {
                    // If no groups exist, just pass the list ID
                    studentViewLink.href = `student.html?list=${currentListId}`;
                    console.log('Updated student view link with list ID only');
                }
            } else {
                studentViewLink.href = 'student.html';
                console.log('No current list, using default student view link');
            }
        }
    }

    /**
     * Load sample data with example students and groups
     */
    function loadSampleData() {
        // Check if there's existing data
        const lists = StorageManager.getLists();
        const hasExistingData = Object.keys(lists).length > 0;

        if (hasExistingData) {
            if (!confirm('This will replace your existing data. Are you sure you want to load sample data?')) {
                return;
            }
        }

        // Clear existing data
        StorageManager.clearAll();

        // Create sample class lists
        const class1Id = StorageManager.createList('Class 1A');
        const class2Id = StorageManager.createList('Science Group');
        const class3Id = StorageManager.createList('Book Club');

        // Add students to Class 1A
        const class1Students = [
            'Alice Smith', 'Stephen Fry', 'David Attenborough',
            'Diana Prince', 'Malala Yousafzai', 'Fiona Apple',
            'Jenny Lewis', 'Maynard James', 'Nancy Drew',
        ];
        const class1 = StorageManager.getList(class1Id);
        class1.students = class1Students;
        class1.blacklist = [['Alice Smith', 'David Attenborough'], ['Maynard James', 'Nancy Drew']];
        class1.groupSize = 3;
        StorageManager.saveList(class1Id, class1);

        // Add students to Science Group
        const class2Students = [
            'Jane Foster', 'Bruce Banner', 'Barry Allen',
            'Steve Rogers', 'Wanda Maximoff', 'David Mitchell',
            'Peter Parker', 'Scott Lang', 'Rocket Raccoon',
            'Li Junjie', 'Wang Yichen', 'Chen Zihan'
        ];
        const class2 = StorageManager.getList(class2Id);
        class2.students = class2Students;
        class2.groupSize = 3;
        StorageManager.saveList(class2Id, class2);

        // Add students to Book Club
        const class3Students = [
            'Maynard James', 'Nancy Drew', 'Charlie Weasley',
            'Emilia Airhart', 'Ada Lovelace', 'Grace Hopper',
            'Serena Williams', 'Ethan Hunt', 'Jacinda Ardern'
        ];
        const class3 = StorageManager.getList(class3Id);
        class3.students = class3Students;
        class3.groupSize = 3;
        StorageManager.saveList(class3Id, class3);

        // Generate groups for Class 1A
        const class1Groups = GroupThing.generateGroups(class1Students, class1.groupSize, class1.blacklist);
        StorageManager.saveGroups(class1Id, class1Groups);

        // Set current list to Class 1A
        StorageManager.setCurrentList(class1Id);

        // Reload UI
        loadClassLists();
        loadCurrentList(class1Id);

        // Show success message
        GroupThing.showError('Sample data loaded successfully!', 3000);
    }

    /**
     * Clear all data from storage
     */
    function clearAllData() {
        if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
            StorageManager.clearAll();

            // Reset UI
            classListContainer.innerHTML = '';
            listSelector.innerHTML = '<option value="">Select a list...</option>';
            currentListName.textContent = 'None Selected';
            studentList.innerHTML = '';
            blacklistPairs.innerHTML = '';
            groupsPreviewContainer.innerHTML = '<p class="empty-state">No groups generated yet. Use the "Generate Groups" button to create groups.</p>';

            // Show success message
            GroupThing.showError('All data has been cleared.', 3000);
        }
    }

    /**
     * Export settings to a JSON file
     */
    function exportSettings() {
        try {
            StorageManager.exportSettings();
            GroupThing.showError('Settings exported successfully!', 3000);
        } catch (error) {
            console.error('Error exporting settings:', error);
            GroupThing.showError('Error exporting settings. Please try again.');
        }
    }

    /**
     * Open the import settings modal
     */
    function openImportModal() {
        importFileInput.value = '';
        importError.style.display = 'none';
        importError.textContent = '';
        importModal.style.display = 'flex';
    }

    /**
     * Close the import settings modal
     */
    function closeImportModal() {
        importModal.style.display = 'none';
    }

    /**
     * Import settings from a JSON file
     */
    function importSettings() {
        const file = importFileInput.files[0];

        if (!file) {
            importError.textContent = 'Please select a file to import';
            importError.style.display = 'block';
            return;
        }

        if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
            importError.textContent = 'Please select a JSON file';
            importError.style.display = 'block';
            return;
        }

        // Confirm before overwriting existing data
        const lists = StorageManager.getLists();
        const hasExistingData = Object.keys(lists).length > 0;

        if (hasExistingData) {
            if (!confirm('This will replace your existing data. Are you sure you want to import settings?')) {
                return;
            }
        }

        // Import the settings
        StorageManager.importSettings(file)
            .then(data => {
                // Close the modal
                closeImportModal();

                // Reload the UI
                loadClassLists();

                // Load the current list if one is set
                const currentListId = StorageManager.getCurrentListId();
                if (currentListId) {
                    loadCurrentList(currentListId);
                }

                // Show success message
                GroupThing.showError('Settings imported successfully!', 3000);
            })
            .catch(error => {
                console.error('Error importing settings:', error);
                importError.textContent = `Error importing settings: ${error.message}`;
                importError.style.display = 'block';
            });
    }
});
