/**
 * teacher-data.js - Data operations for Teacher view in GroupThing
 * Handles class list management, student management, incompatible pairs, and group generation logic
 */

const TeacherData = {
    /**
     * Create a new class list
     * @param {string} listName - The name of the new list
     * @returns {string} The ID of the new list
     */
    createList(listName) {
        if (!listName.trim()) {
            GroupThing.showError('Please enter a list name');
            return null;
        }

        return StorageManager.createList(listName);
    },

    /**
     * Update an existing class list
     * @param {string} listId - The ID of the list to update
     * @param {string} listName - The new name for the list
     * @returns {boolean} Success status
     */
    updateList(listId, listName) {
        if (!listName.trim()) {
            GroupThing.showError('Please enter a list name');
            return false;
        }

        const list = StorageManager.getList(listId);
        if (list) {
            list.name = listName;
            StorageManager.saveList(listId, list);
            return true;
        }
        return false;
    },

    /**
     * Delete a class list
     * @param {string} listId - The ID of the list to delete
     * @returns {boolean} Success status
     */
    deleteList(listId) {
        if (confirm('Are you sure you want to delete this list?')) {
            StorageManager.deleteList(listId);
            return true;
        }
        return false;
    },

    /**
     * Save the current order of class lists to storage
     * @param {Array} orderedListIds - Array of list IDs in the desired order
     */
    saveListOrder(orderedListIds) {
        const lists = StorageManager.getLists();
        const newOrder = {};

        // Reorder based on the provided order
        orderedListIds.forEach(listId => {
            if (listId && lists[listId]) {
                newOrder[listId] = lists[listId];
            }
        });

        // Save the new order to storage
        StorageManager.setLists(newOrder);
    },

    /**
     * Add a new student or multiple students to a class list
     * @param {string} listId - The ID of the list to add students to
     * @param {string} studentInput - Student name(s), can be multiple if separated by newlines
     * @returns {Object} Result with counts of added and duplicate students
     */
    addStudents(listId, studentInput) {
        if (!listId) {
            GroupThing.showError('Please select or create a class list first');
            return { success: false };
        }

        if (!studentInput.trim()) {
            GroupThing.showError('Please enter at least one student name');
            return { success: false };
        }

        const list = StorageManager.getList(listId);
        if (!list) return { success: false };

        let addedCount = 0;
        let duplicateCount = 0;

        // Check if input contains multiple lines (multiple students)
        if (studentInput.includes('\n')) {
            // Split by newlines and filter out empty lines
            const studentNames = studentInput.split('\n')
                .map(name => name.trim())
                .filter(name => name.length > 0);

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
        } else {
            // Single student case
            const studentName = studentInput.trim();

            // Check if student already exists
            if (list.students.includes(studentName)) {
                duplicateCount++;
            } else {
                // Add student to list
                list.students.push(studentName);
                addedCount++;
            }
        }

        // Save the updated list
        StorageManager.saveList(listId, list);

        return {
            success: true,
            addedCount,
            duplicateCount
        };
    },

    /**
     * Remove students from a class list
     * @param {string} listId - The ID of the list
     * @param {Array} studentsToRemove - Array of student names to remove
     * @returns {boolean} Success status
     */
    removeStudents(listId, studentsToRemove) {
        if (studentsToRemove.length === 0) {
            GroupThing.showError('Please select students to remove');
            return false;
        }

        if (!listId) return false;

        const list = StorageManager.getList(listId);
        if (!list) return false;

        // Remove selected students
        list.students = list.students.filter(student => !studentsToRemove.includes(student));

        // Also remove from incompatible pairs
        list.blacklist = list.blacklist.filter(pair =>
            !studentsToRemove.includes(pair[0]) && !studentsToRemove.includes(pair[1]));

        // Save changes
        StorageManager.saveList(listId, list);
        return true;
    },

    /**
     * Update the group size for a class list
     * @param {string} listId - The ID of the list
     * @param {number} size - The new group size
     */
    updateGroupSize(listId, size) {
        if (listId) {
            StorageManager.updateGroupSize(listId, size);
        }
    },

    /**
     * Add incompatible pairs to a class list
     * @param {string} listId - The ID of the list
     * @param {Array} students - Array of student names that are incompatible with each other
     * @returns {boolean} Success status
     */
    addIncompatiblePairs(listId, students) {
        if (!listId) {
            GroupThing.showError('Please select or create a class list first');
            return false;
        }

        if (students.length < 2) {
            GroupThing.showError('Please select at least two students for the incompatible group');
            return false;
        }

        const list = StorageManager.getList(listId);
        if (!list) return false;

        let addedCount = 0;

        // Create all possible pairs from the selected students
        for (let i = 0; i < students.length; i++) {
            for (let j = i + 1; j < students.length; j++) {
                const student1 = students[i];
                const student2 = students[j];

                // Check if pair already exists (in either order)
                const pairExists = list.blacklist.some(pair =>
                    (pair[0] === student1 && pair[1] === student2) ||
                    (pair[0] === student2 && pair[1] === student1));

                if (!pairExists) {
                    // Add pair to incompatible pairs
                    list.blacklist.push([student1, student2]);
                    addedCount++;
                }
            }
        }

        // Save changes
        StorageManager.saveList(listId, list);
        return addedCount > 0;
    },

    /**
     * Remove incompatible pairs from a class list
     * @param {string} listId - The ID of the list
     * @param {Array} pairsToRemove - Array of pairs to remove
     * @returns {boolean} Success status
     */
    removeIncompatiblePairs(listId, pairsToRemove) {
        if (pairsToRemove.length === 0) {
            GroupThing.showError('Please select incompatible pairs to remove');
            return false;
        }

        if (!listId) return false;

        const list = StorageManager.getList(listId);
        if (!list) return false;

        // Remove selected pairs
        list.blacklist = list.blacklist.filter(pair => {
            return !pairsToRemove.some(selectedPair =>
                (pair[0] === selectedPair[0] && pair[1] === selectedPair[1]) ||
                (pair[0] === selectedPair[1] && pair[1] === selectedPair[0]));
        });

        // Save changes
        StorageManager.saveList(listId, list);
        return true;
    },

    /**
     * Generate groups for a class list
     * @param {string} listId - The ID of the list
     * @returns {Array|null} Generated groups or null if error
     */
    generateGroups(listId) {
        if (!listId) {
            GroupThing.showError('Please select or create a class list first');
            return null;
        }

        const list = StorageManager.getList(listId);
        if (!list) return null;

        if (list.students.length === 0) {
            GroupThing.showError('Please add students to the list first');
            return null;
        }

        // Generate groups
        const groups = GroupThing.generateGroups(list.students, list.groupSize, list.blacklist);

        // Save groups
        StorageManager.saveGroups(listId, groups);
        return groups;
    },

    /**
     * Toggle emoji names for a class list
     * @param {string} listId - The ID of the list
     * @param {boolean} useEmoji - Whether to use emoji names
     * @returns {boolean} Success status
     */
    toggleEmojiNames(listId, useEmoji) {
        if (!listId) return false;

        const list = StorageManager.getList(listId);
        if (!list) return false;

        // Update the setting
        list.useEmojiNames = useEmoji;
        StorageManager.saveList(listId, list);
        return true;
    },

    /**
     * Load sample data with example students and groups
     * @returns {string} ID of the selected list
     */
    loadSampleData() {
        // Check if there's existing data
        const lists = StorageManager.getLists();
        const hasExistingData = Object.keys(lists).length > 0;

        if (hasExistingData) {
            if (!confirm('This will replace your existing data. Are you sure you want to load sample data?')) {
                return null;
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

        return class1Id;
    },

    /**
     * Clear all data from storage
     * @returns {boolean} Success status
     */
    clearAllData() {
        if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
            StorageManager.clearAll();
            return true;
        }
        return false;
    },

    /**
     * Export settings to a JSON file
     * @returns {boolean} Success status
     */
    exportSettings() {
        try {
            StorageManager.exportSettings();
            return true;
        } catch (error) {
            console.error('Error exporting settings:', error);
            GroupThing.showError('Error exporting settings. Please try again.');
            return false;
        }
    },

    /**
     * Import settings from a JSON file
     * @param {File} file - The JSON file to import
     * @returns {Promise} A promise that resolves when the import is complete
     */
    importSettings(file) {
        if (!file) {
            return Promise.reject(new Error('Please select a file to import'));
        }

        if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
            return Promise.reject(new Error('Please select a JSON file'));
        }

        // Confirm before overwriting existing data
        const lists = StorageManager.getLists();
        const hasExistingData = Object.keys(lists).length > 0;

        if (hasExistingData) {
            if (!confirm('This will replace your existing data. Are you sure you want to import settings?')) {
                return Promise.reject(new Error('Import cancelled'));
            }
        }

        // Import the settings
        return StorageManager.importSettings(file);
    },

    /**
     * Create a student view link URL
     * @param {string} listId - The ID of the list
     * @returns {string} The URL for the student view
     */
    createStudentViewLink(listId) {
        if (!listId) return 'student.html';

        // Get the current list data
        const list = StorageManager.getList(listId);
        if (list && list.currentGroups && list.currentGroups.length > 0) {
            // Create a simplified version of the list data to pass in the URL
            const listData = {
                id: listId,
                name: list.name,
                groups: list.currentGroups
            };

            // Encode the data as a base64 string to avoid URL encoding issues
            const encodedData = btoa(JSON.stringify(listData));

            // Return the URL with both the list ID and the encoded data
            return `student.html?list=${listId}&data=${encodedData}`;
        } else {
            // If no groups exist, just pass the list ID
            return `student.html?list=${listId}`;
        }
    }
};
