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
    const decreaseSizeBtn = document.getElementById('decrease-size-btn');
    const increaseSizeBtn = document.getElementById('increase-size-btn');
    const generateGroupsBtn = document.getElementById('generate-groups-btn');
    const blacklistPairs = document.getElementById('incompatible-pairs');
    const blacklistStudent1 = document.getElementById('incompatible-student1');
    const blacklistStudent2 = document.getElementById('incompatible-student2');
    const addBlacklistBtn = document.getElementById('add-incompatible-btn');
    const removeBlacklistBtn = document.getElementById('remove-incompatible-btn');
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

    // Initialise the UI
    InitialiseUI();

    // Update student view link
    updateStudentViewLink();

    // Event listeners
    newListBtn.addEventListener('click', openNewListModal);
    loadSampleBtn.addEventListener('click', loadSampleData);
    clearAllBtn.addEventListener('click', clearAllData);
    closeModal.addEventListener('click', closeListModal);
    cancelListBtn.addEventListener('click', closeListModal);
    saveListBtn.addEventListener('click', saveList);
    listSelector.addEventListener('change', handleListSelection);
    addStudentBtn.addEventListener('click', addStudent);
    newStudentInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addStudent();
    });
    removeStudentBtn.addEventListener('click', removeSelectedStudents);
    decreaseSizeBtn.addEventListener('click', () => adjustGroupSize(-1));
    increaseSizeBtn.addEventListener('click', () => adjustGroupSize(1));
    generateGroupsBtn.addEventListener('click', generateGroups);
    addBlacklistBtn.addEventListener('click', addBlacklistPair);
    removeBlacklistBtn.addEventListener('click', removeSelectedBlacklistPairs);
    exportSettingsBtn.addEventListener('click', exportSettings);
    importSettingsBtn.addEventListener('click', openImportModal);
    confirmImportBtn.addEventListener('click', importSettings);
    cancelImportBtn.addEventListener('click', closeImportModal);
    importModal.querySelector('.close-modal').addEventListener('click', closeImportModal);

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
            listItem.innerHTML = `
                <span>${list.name}</span>
                <div class="class-item-actions">
                    <button class="edit-list" title="Edit list name">✏️</button>
                    <button class="delete-list" title="Delete list">🗑️</button>
                </div>
            `;
            classListContainer.appendChild(listItem);

            // Add click event to select list
            listItem.addEventListener('click', (e) => {
                if (!e.target.closest('.class-item-actions')) {
                    selectList(id);
                }
            });

            // Add edit and delete events
            listItem.querySelector('.edit-list').addEventListener('click', () => openEditListModal(id, list.name));
            listItem.querySelector('.delete-list').addEventListener('click', () => deleteList(id));

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
        blacklistStudent1.innerHTML = '<option value="">Select student 1</option>';
        blacklistStudent2.innerHTML = '<option value="">Select student 2</option>';

        // Add each student as an option
        list.students.forEach(student => {
            const option1 = document.createElement('option');
            option1.value = student;
            option1.textContent = student;
            blacklistStudent1.appendChild(option1);

            const option2 = document.createElement('option');
            option2.value = student;
            option2.textContent = student;
            blacklistStudent2.appendChild(option2);
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
     * Add a new student to the current list
     */
    function addStudent() {
        const studentName = newStudentInput.value.trim();
        const currentListId = StorageManager.getCurrentListId();

        if (!currentListId) {
            GroupThing.showError('Please select or create a class list first');
            return;
        }

        if (!studentName) {
            GroupThing.showError('Please enter a student name');
            return;
        }

        const list = StorageManager.getList(currentListId);
        if (!list) return;

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
     * Adjust the group size
     * @param {number} change - The amount to change the size by
     */
    function adjustGroupSize(change) {
        let size = parseInt(groupSizeInput.value) + change;

        // Ensure size is within valid range
        size = Math.max(2, Math.min(10, size));
        groupSizeInput.value = size;

        // Update storage
        const currentListId = StorageManager.getCurrentListId();
        if (currentListId) {
            StorageManager.updateGroupSize(currentListId, size);
        }
    }

    /**
     * Add an incompatible pair to the current list
     */
    function addBlacklistPair() {
        const student1 = blacklistStudent1.value;
        const student2 = blacklistStudent2.value;
        const currentListId = StorageManager.getCurrentListId();

        if (!currentListId) {
            GroupThing.showError('Please select or create a class list first');
            return;
        }

        if (!student1 || !student2) {
            GroupThing.showError('Please select both students for the incompatible pair');
            return;
        }

        if (student1 === student2) {
            GroupThing.showError('Please select two different students');
            return;
        }

        const list = StorageManager.getList(currentListId);
        if (!list) return;

        // Check if pair already exists (in either order)
        const pairExists = list.blacklist.some(pair =>
            (pair[0] === student1 && pair[1] === student2) ||
            (pair[0] === student2 && pair[1] === student1));

        if (pairExists) {
            GroupThing.showError('This incompatible pair already exists');
            return;
        }

        // Add pair to incompatible pairs
        list.blacklist.push([student1, student2]);
        StorageManager.saveList(currentListId, list);

        // Update UI
        loadIncompatiblePairs(list.blacklist);
        blacklistStudent1.value = '';
        blacklistStudent2.value = '';
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

        groups.forEach((group, index) => {
            const groupElement = document.createElement('div');
            groupElement.className = 'preview-group';

            const groupTitle = document.createElement('h3');
            groupTitle.className = 'preview-group-title';
            groupTitle.textContent = GroupThing.formatGroupName(index);

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
            'Alice Smith', 'Bob Johnson', 'Charlie Brown',
            'Diana Prince', 'Ethan Hunt', 'Fiona Apple',
            'George Miller', 'Hannah Baker', 'Ian Malcolm'
        ];
        const class1 = StorageManager.getList(class1Id);
        class1.students = class1Students;
        class1.blacklist = [['Alice Smith', 'Bob Johnson'], ['Charlie Brown', 'Diana Prince']];
        class1.groupSize = 3;
        StorageManager.saveList(class1Id, class1);

        // Add students to Science Group
        const class2Students = [
            'Jane Foster', 'Tony Stark', 'Bruce Banner',
            'Natasha Romanoff', 'Steve Rogers', 'Wanda Maximoff'
        ];
        const class2 = StorageManager.getList(class2Id);
        class2.students = class2Students;
        class2.groupSize = 2;
        StorageManager.saveList(class2Id, class2);

        // Add students to Book Club
        const class3Students = [
            'Harry Potter', 'Hermione Granger', 'Ron Weasley',
            'Luna Lovegood', 'Neville Longbottom'
        ];
        const class3 = StorageManager.getList(class3Id);
        class3.students = class3Students;
        class3.groupSize = 2;
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
