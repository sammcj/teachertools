/**
 * common.js - Shared functions for GroupThing
 * Contains utility functions used by both teacher and student views
 */

const GroupThing = {
    // Animal emojis and their corresponding names for group naming
    animalEmojis: [
        { emoji: '🦘', name: 'Kangaroos' },
        { emoji: '🐨', name: 'Koalas' },
        { emoji: '🐬', name: 'Dolphins' },
        { emoji: '🦒', name: 'Giraffes' },
        { emoji: '🐼', name: 'Pandas' },
        { emoji: '🐰', name: 'Rabbits' },
        { emoji: '🐶', name: 'Puppies' },
        { emoji: '🐱', name: 'Cats' },
        { emoji: '🦁', name: 'Lions' },
        { emoji: '🐻', name: 'Bears' },
        { emoji: '🐘', name: 'Elephants' },
        { emoji: '🦉', name: 'Owls' },
        { emoji: '🦅', name: 'Eagles' },
        { emoji: '🐢', name: 'Turtles' },
        { emoji: '🐯', name: 'Tigers' },
        { emoji: '🦊', name: 'Foxes' },
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
        // Handle edge cases
        if (students.length === 0) return [];
        if (students.length <= groupSize) return [students]; // Just one group if fewer students than group size

        // Special case: if we have exactly one more than a multiple of the group size
        // (which would result in a single-person group), reduce the number of groups by 1
        const numStudents = students.length;
        let numGroups = Math.ceil(numStudents / groupSize);

        // If we would end up with a single-person group, adjust the number of groups
        if (numStudents % numGroups === 1 && numGroups > 1) {
            numGroups--;
        }

        const groups = Array.from({ length: numGroups }, () => []);

        // Distribute students evenly among groups
        for (let i = 0; i < numStudents; i++) {
            const groupIndex = i % numGroups;
            groups[groupIndex].push(students[i]);
        }

        // Double-check for any single-person groups that might still exist
        // This is a safety check, but with the algorithm above, it shouldn't happen
        const singlePersonGroups = groups.filter(group => group.length === 1);

        if (singlePersonGroups.length > 0) {
            // For each single-person group
            for (const singleGroup of singlePersonGroups) {
                // Find the smallest group that has more than one person
                const multiPersonGroups = groups.filter(group => group !== singleGroup && group.length > 1);

                if (multiPersonGroups.length > 0) {
                    // Sort groups by size (ascending)
                    multiPersonGroups.sort((a, b) => a.length - b.length);

                    // Get the smallest multi-person group
                    const targetGroup = multiPersonGroups[0];

                    // Add the single person to this group
                    targetGroup.push(singleGroup[0]);

                    // Remove the single-person group
                    const singleGroupIndex = groups.findIndex(group => group === singleGroup);
                    groups.splice(singleGroupIndex, 1);
                }
            }
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
