/**
 * common.js - Shared functions for GroupThing
 * Contains utility functions used by both teacher and student views
 */

const GroupThing = {
    // Animal emojis and their corresponding names for group naming
    animalEmojis: [
        { emoji: '🦁', name: 'Lions' },
        { emoji: '🐯', name: 'Tigers' },
        { emoji: '🐻', name: 'Bears' },
        { emoji: '🐨', name: 'Koalas' },
        { emoji: '🐼', name: 'Pandas' },
        { emoji: '🦊', name: 'Foxes' },
        { emoji: '🐰', name: 'Rabbits' },
        { emoji: '🐶', name: 'Puppies' },
        { emoji: '🐱', name: 'Kittens' },
        { emoji: '🦉', name: 'Owls' },
        { emoji: '🦅', name: 'Eagles' },
        { emoji: '🐢', name: 'Turtles' },
        { emoji: '🐬', name: 'Dolphins' },
        { emoji: '🦒', name: 'Giraffes' },
        { emoji: '🐘', name: 'Elephants' },
        { emoji: '🦘', name: 'Kangaroos' }
    ],
    /**
     * Generate random groups from a list of students
     * @param {Array} students - Array of student names
     * @param {number} groupSize - Size of each group
     * @param {Array} blacklist - Array of pairs that cannot be in the same group
     * @returns {Array} Array of groups, each containing student names
     */
    generateGroups(students, groupSize, blacklist = []) {
        if (!students || students.length === 0) {
            return [];
        }

        // Make a copy of the students array to avoid modifying the original
        const shuffledStudents = [...students];

        // Shuffle the students array
        this.shuffleArray(shuffledStudents);

        // Try to generate groups that satisfy blacklist constraints
        let attempts = 0;
        const maxAttempts = 50; // Limit attempts to prevent infinite loops
        let validGroups = null;

        while (attempts < maxAttempts && !validGroups) {
            // Create groups
            const groups = this.createGroups(shuffledStudents, groupSize);

            // Check if groups satisfy blacklist constraints
            if (this.validateGroups(groups, blacklist)) {
                validGroups = groups;
                break;
            }

            // If not valid, reshuffle and try again
            this.shuffleArray(shuffledStudents);
            attempts++;
        }

        // If we couldn't find a valid grouping, return the last attempt
        if (!validGroups) {
            console.warn(`Could not satisfy all blacklist constraints after ${maxAttempts} attempts.`);
            validGroups = this.createGroups(shuffledStudents, groupSize);
        }

        return validGroups;
    },

    /**
     * Create groups from a list of students
     * @param {Array} students - Array of student names
     * @param {number} groupSize - Size of each group
     * @returns {Array} Array of groups
     */
    createGroups(students, groupSize) {
        const groups = [];
        const numStudents = students.length;
        const numGroups = Math.ceil(numStudents / groupSize);

        // Create empty groups
        for (let i = 0; i < numGroups; i++) {
            groups.push([]);
        }

        // Distribute students evenly
        for (let i = 0; i < numStudents; i++) {
            const groupIndex = i % numGroups;
            groups[groupIndex].push(students[i]);
        }

        return groups;
    },

    /**
     * Validate that groups satisfy blacklist constraints
     * @param {Array} groups - Array of groups
     * @param {Array} blacklist - Array of pairs that cannot be in the same group
     * @returns {boolean} True if valid, false otherwise
     */
    validateGroups(groups, blacklist) {
        if (!blacklist || blacklist.length === 0) {
            return true;
        }

        // Check each group against blacklist
        for (const group of groups) {
            for (const pair of blacklist) {
                const [student1, student2] = pair;
                if (group.includes(student1) && group.includes(student2)) {
                    return false;
                }
            }
        }

        return true;
    },

    /**
     * Shuffle an array using Fisher-Yates algorithm
     * @param {Array} array - The array to shuffle
     */
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    },

    /**
     * Generate a unique ID
     * @returns {string} A unique ID
     */
    generateId() {
        return '_' + Math.random().toString(36).substr(2, 9);
    },

    /**
     * Format a group name
     * @param {number} index - The group index
     * @param {boolean} useEmojiNames - Whether to use emoji names (true) or group numbers (false)
     * @returns {string} Formatted group name
     */
    formatGroupName(index, useEmojiNames = false) {
        if (useEmojiNames) {
            // Use modulo to cycle through the available emojis if there are more groups than emojis
            const emojiIndex = index % this.animalEmojis.length;
            const animal = this.animalEmojis[emojiIndex];
            return `${animal.emoji} ${animal.name}`;
        } else {
            return `Group ${index + 1}`;
        }
    },

    /**
     * Get emoji for a group
     * @param {number} index - The group index
     * @returns {string} Emoji character
     */
    getGroupEmoji(index) {
        const emojiIndex = index % this.animalEmojis.length;
        return this.animalEmojis[emojiIndex].emoji;
    },

    /**
     * Get URL parameters
     * @returns {Object} Object containing URL parameters
     */
    getUrlParams() {
        const params = {};
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);

        for (const [key, value] of urlParams.entries()) {
            params[key] = value;
        }

        return params;
    },

    /**
     * Create URL with parameters
     * @param {string} baseUrl - The base URL
     * @param {Object} params - Object containing parameters
     * @returns {string} URL with parameters
     */
    createUrlWithParams(baseUrl, params) {
        const url = new URL(baseUrl, window.location.origin);

        for (const [key, value] of Object.entries(params)) {
            url.searchParams.append(key, value);
        }

        return url.toString();
    },

    /**
     * Display an error message
     * @param {string} message - The error message
     * @param {number} duration - Duration in milliseconds
     */
    showError(message, duration = 3000) {
        // Check if error container exists, create if not
        let errorContainer = document.getElementById('error-container');

        if (!errorContainer) {
            errorContainer = document.createElement('div');
            errorContainer.id = 'error-container';
            errorContainer.style.position = 'fixed';
            errorContainer.style.top = '20px';
            errorContainer.style.left = '50%';
            errorContainer.style.transform = 'translateX(-50%)';
            errorContainer.style.zIndex = '1000';
            document.body.appendChild(errorContainer);
        }

        // Create error message element
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        errorElement.style.backgroundColor = 'var(--error-color)';
        errorElement.style.color = 'white';
        errorElement.style.padding = '10px 20px';
        errorElement.style.borderRadius = '4px';
        errorElement.style.marginBottom = '10px';
        errorElement.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';

        // Add to container
        errorContainer.appendChild(errorElement);

        // Remove after duration
        setTimeout(() => {
            errorElement.style.opacity = '0';
            errorElement.style.transition = 'opacity 0.5s ease';

            setTimeout(() => {
                errorContainer.removeChild(errorElement);

                // Remove container if empty
                if (errorContainer.children.length === 0) {
                    document.body.removeChild(errorContainer);
                }
            }, 500);
        }, duration);
    }
};
