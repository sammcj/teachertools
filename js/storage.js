/**
 * storage.js - Handles LocalStorage operations for GroupThing
 * Manages saving and loading class lists, blacklists, and group configurations
 */

const StorageManager = {
    // Storage key for all GroupThing data
    STORAGE_KEY: 'groupThing_data',

    // Default data structure
    defaultData: {
        lists: {},
        currentList: null
    },

    /**
     * Initialize storage with default data if not exists
     */
    init() {
        if (!localStorage.getItem(this.STORAGE_KEY)) {
            this.saveData(this.defaultData);
        }
    },

    /**
     * Get all data from storage
     * @returns {Object} The stored data
     */
    getData() {
        try {
            const data = JSON.parse(localStorage.getItem(this.STORAGE_KEY));
            return data || this.defaultData;
        } catch (error) {
            console.error('Error retrieving data from storage:', error);
            return this.defaultData;
        }
    },

    /**
     * Save data to storage
     * @param {Object} data - The data to save
     */
    saveData(data) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving data to storage:', error);
        }
    },

    /**
     * Get all class lists
     * @returns {Object} All class lists
     */
    getLists() {
        return this.getData().lists;
    },

    /**
     * Get a specific class list by ID
     * @param {string} listId - The ID of the list to get
     * @returns {Object|null} The class list or null if not found
     */
    getList(listId) {
        const lists = this.getLists();
        return lists[listId] || null;
    },

    /**
     * Save a class list
     * @param {string} listId - The ID of the list
     * @param {Object} listData - The list data to save
     */
    saveList(listId, listData) {
        const data = this.getData();
        data.lists[listId] = listData;
        this.saveData(data);
    },

    /**
     * Delete a class list
     * @param {string} listId - The ID of the list to delete
     */
    deleteList(listId) {
        const data = this.getData();
        if (data.lists[listId]) {
            delete data.lists[listId];

            // If the deleted list was the current list, set currentList to null
            if (data.currentList === listId) {
                data.currentList = null;
            }

            this.saveData(data);
        }
    },

    /**
     * Set the current active list
     * @param {string} listId - The ID of the list to set as current
     */
    setCurrentList(listId) {
        const data = this.getData();
        data.currentList = listId;
        this.saveData(data);
    },

    /**
     * Get the current active list ID
     * @returns {string|null} The current list ID or null if none
     */
    getCurrentListId() {
        return this.getData().currentList;
    },

    /**
     * Get the current active list data
     * @returns {Object|null} The current list data or null if none
     */
    getCurrentList() {
        const currentId = this.getCurrentListId();
        return currentId ? this.getList(currentId) : null;
    },

    /**
     * Create a new empty class list
     * @param {string} name - The name of the new list
     * @returns {string} The ID of the new list
     */
    createList(name) {
        const listId = 'list_' + Date.now();
        const newList = {
            name: name,
            students: [],
            blacklist: [],
            groupSize: 4,
            currentGroups: null
        };

        this.saveList(listId, newList);
        return listId;
    },

    /**
     * Update the students in a list
     * @param {string} listId - The ID of the list
     * @param {Array} students - Array of student names
     */
    updateStudents(listId, students) {
        const list = this.getList(listId);
        if (list) {
            list.students = students;
            this.saveList(listId, list);
        }
    },

    /**
     * Update the blacklist in a list
     * @param {string} listId - The ID of the list
     * @param {Array} blacklist - Array of blacklisted pairs
     */
    updateBlacklist(listId, blacklist) {
        const list = this.getList(listId);
        if (list) {
            list.blacklist = blacklist;
            this.saveList(listId, list);
        }
    },

    /**
     * Update the group size for a list
     * @param {string} listId - The ID of the list
     * @param {number} size - The new group size
     */
    updateGroupSize(listId, size) {
        const list = this.getList(listId);
        if (list) {
            list.groupSize = size;
            this.saveList(listId, list);
        }
    },

    /**
     * Save generated groups for a list
     * @param {string} listId - The ID of the list
     * @param {Array} groups - The generated groups
     */
    saveGroups(listId, groups) {
        const list = this.getList(listId);
        if (list) {
            list.currentGroups = groups;
            this.saveList(listId, list);
        }
    },

    /**
     * Get the current groups for a list
     * @param {string} listId - The ID of the list
     * @returns {Array|null} The current groups or null if none
     */
    getGroups(listId) {
        const list = this.getList(listId);
        return list ? list.currentGroups : null;
    },

    /**
     * Clear all data from storage (for testing or reset)
     */
    clearAll() {
        localStorage.removeItem(this.STORAGE_KEY);
        this.init();
    }
};

// Initialize storage when the script loads
StorageManager.init();
