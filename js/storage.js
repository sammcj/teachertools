/**
 * Storage Manager
 * Handles LocalStorage operations for Emma's Teacher Tools
 */

const Storage = {
  STORAGE_KEY: 'emmaTeacherTools_v2',
  VERSION: '2.0.0',

  /**
   * Get default data structure
   */
  getDefaultData() {
    return {
      lists: {},
      currentListId: null,
      version: this.VERSION
    };
  },

  /**
   * Initialise storage with default data if needed
   */
  init() {
    const data = this.getData();
    console.log('Storage.init() - Current data:', data);
    console.log('Storage.init() - Has version?', !!data?.version);
    if (!data || !data.version) {
      console.log('Storage.init() - Initialising with default data (THIS WILL ERASE EXISTING DATA!)');
      this.saveData(this.getDefaultData());
    } else {
      console.log('Storage.init() - Using existing data');
    }
  },

  /**
   * Get all data from storage
   */
  getData() {
    try {
      console.log('Storage.getData() - Using key:', this.STORAGE_KEY);
      const raw = localStorage.getItem(this.STORAGE_KEY);
      console.log('Storage.getData() - Raw from localStorage:', raw ? raw.substring(0, 100) + '...' : 'NULL');
      console.log('Storage.getData() - Raw length:', raw ? raw.length : 0);

      if (!raw) {
        console.log('Storage.getData() - No data found, checking all localStorage keys:');
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          console.log(`  - ${key}: ${localStorage.getItem(key)?.substring(0, 50)}...`);
        }
      }

      const data = raw ? JSON.parse(raw) : this.getDefaultData();
      console.log('Storage.getData() - Parsed data has', Object.keys(data.lists || {}).length, 'lists');
      return data;
    } catch (error) {
      console.error('Error reading from storage:', error);
      return this.getDefaultData();
    }
  },

  /**
   * Save all data to storage
   */
  saveData(data) {
    try {
      console.log('Storage.saveData() - Saving data with', Object.keys(data.lists || {}).length, 'lists, currentListId:', data.currentListId);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      console.log('Storage.saveData() - Save complete');
      return true;
    } catch (error) {
      console.error('Error saving to storage:', error);
      return false;
    }
  },

  /**
   * Get all class lists
   */
  getLists() {
    return this.getData().lists;
  },

  /**
   * Get a specific class list by ID
   */
  getList(listId) {
    const lists = this.getLists();
    return lists[listId] || null;
  },

  /**
   * Create a new class list
   */
  createList(name) {
    const data = this.getData();
    const listId = `list_${Date.now()}`;

    data.lists[listId] = {
      name,
      students: [],
      pairingRules: [], // Changed from incompatiblePairs to support both types
      groupSize: 3,
      groups: null,
      useEmojiNames: true
    };

    this.saveData(data);
    return listId;
  },

  /**
   * Update a class list
   */
  updateList(listId, updates) {
    const data = this.getData();
    if (data.lists[listId]) {
      data.lists[listId] = { ...data.lists[listId], ...updates };
      return this.saveData(data);
    }
    return false;
  },

  /**
   * Delete a class list
   */
  deleteList(listId) {
    const data = this.getData();
    if (data.lists[listId]) {
      delete data.lists[listId];
      if (data.currentListId === listId) {
        data.currentListId = null;
      }
      return this.saveData(data);
    }
    return false;
  },

  /**
   * Reorder class lists
   */
  reorderLists(orderedIds) {
    const data = this.getData();
    const newLists = {};

    orderedIds.forEach(id => {
      if (data.lists[id]) {
        newLists[id] = data.lists[id];
      }
    });

    data.lists = newLists;
    return this.saveData(data);
  },

  /**
   * Get current list ID
   */
  getCurrentListId() {
    const data = this.getData();
    console.log('Storage - getCurrentListId called, full data:', data);
    return data.currentListId;
  },

  /**
   * Set current list ID
   */
  setCurrentListId(listId) {
    const data = this.getData();
    data.currentListId = listId;
    console.log('Storage - Setting current list ID to:', listId);
    const success = this.saveData(data);
    console.log('Storage - Save successful:', success, 'Verify:', this.getCurrentListId());
    return success;
  },

  /**
   * Export all data to JSON file
   */
  exportData() {
    const data = this.getData();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `teacher-tools-backup-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);

    return true;
  },

  /**
   * Import data from JSON file
   */
  async importData(file) {
    return new Promise((resolve, reject) => {
      if (!file || file.type !== 'application/json') {
        reject(new Error('Please select a valid JSON file'));
        return;
      }

      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);

          if (!data.lists || typeof data.lists !== 'object') {
            reject(new Error('Invalid backup file format'));
            return;
          }

          // Merge with default structure
          const importedData = {
            ...this.getDefaultData(),
            ...data
          };

          this.saveData(importedData);
          resolve(importedData);
        } catch (error) {
          reject(new Error('Failed to parse JSON file'));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  },

  /**
   * Clear all data
   */
  clearAll() {
    localStorage.removeItem(this.STORAGE_KEY);
    this.init();
    return true;
  },

  /**
   * Load sample data for demo
   */
  loadSampleData() {
    const data = this.getDefaultData();

    // Class 1A
    const class1Id = `list_${Date.now()}`;
    data.lists[class1Id] = {
      name: 'Class 1A',
      students: [
        'Alice Smith', 'Bob Johnson', 'Charlie Brown',
        'Diana Prince', 'Emma Watson', 'Frank Miller',
        'Grace Hopper', 'Henry Ford', 'Iris West'
      ],
      pairingRules: [
        { type: 'never', students: ['Alice Smith', 'Charlie Brown'] },
        { type: 'never', students: ['Bob Johnson', 'Frank Miller'] },
        { type: 'always', students: ['Grace Hopper', 'Henry Ford'] }
      ],
      groupSize: 3,
      groups: null,
      useEmojiNames: true
    };

    // Science Group
    const class2Id = `list_${Date.now() + 1}`;
    data.lists[class2Id] = {
      name: 'Science Group',
      students: [
        'Jane Foster', 'Bruce Banner', 'Peter Parker',
        'Tony Stark', 'Natasha Romanoff', 'Steve Rogers'
      ],
      pairingRules: [],
      groupSize: 3,
      groups: null,
      useEmojiNames: true
    };

    data.currentListId = class1Id;
    this.saveData(data);
    return class1Id;
  }
};

// Initialise on load
Storage.init();