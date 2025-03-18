/**
 * student.js - Student view functionality for GroupThing
 * Handles displaying groups in a visually appealing way
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const groupsContainer = document.getElementById('groups-container');
    const className = document.getElementById('class-name');

    // Initialize the UI
    initializeUI();

    /**
     * Initialize the UI with data from storage
     */
    function initializeUI() {
        try {
            // Check for list ID and encoded data in URL parameters
            let listId = null;
            let encodedData = null;

            // Method 1: Using URLSearchParams (standard way)
            try {
                const params = GroupThing.getUrlParams();
                console.log('URL Parameters (Method 1):', params);

                if (params.list) {
                    listId = params.list;
                    console.log('Found list ID in URL parameters:', listId);
                }

                if (params.data) {
                    encodedData = params.data;
                    console.log('Found encoded data in URL parameters');
                }
            } catch (e) {
                console.error('Error getting URL parameters using Method 1:', e);
            }

            // Method 2: Manual parsing (fallback for older browsers)
            if (!listId || !encodedData) {
                try {
                    const queryString = window.location.search;
                    console.log('Raw query string:', queryString);

                    if (queryString) {
                        const searchParams = queryString.substring(1).split('&');
                        for (const param of searchParams) {
                            const [key, value] = param.split('=');
                            if (key === 'list' && value && !listId) {
                                listId = decodeURIComponent(value);
                                console.log('Found list ID using manual parsing:', listId);
                            }
                            if (key === 'data' && value && !encodedData) {
                                encodedData = decodeURIComponent(value);
                                console.log('Found encoded data using manual parsing');
                            }
                        }
                    }
                } catch (e) {
                    console.error('Error getting URL parameters using Method 2:', e);
                }
            }

            // Try to decode the data if available
            if (encodedData) {
                try {
                    const decodedData = JSON.parse(atob(encodedData));
                    console.log('Successfully decoded data from URL:', decodedData);

                    // Display groups directly from the URL data
                    if (decodedData.name) {
                        className.textContent = decodedData.name;
                    }

                    if (decodedData.groups && decodedData.groups.length > 0) {
                        console.log('Displaying groups from URL data');
                        displayGroups(decodedData.groups);
                        return; // Exit early since we've displayed the groups
                    }
                } catch (e) {
                    console.error('Error decoding data from URL:', e);
                }
            }

            // Get current list ID from storage as fallback
            if (!listId) {
                try {
                    listId = StorageManager.getCurrentListId();
                    console.log('Using list ID from storage:', listId);
                } catch (e) {
                    console.error('Error getting current list ID from storage:', e);
                }
            }

            console.log('Final list ID to use:', listId);

            if (listId) {
                loadGroupsForList(listId);
            } else {
                showEmptyState('No list selected. Please return to the teacher view to select a list.');
            }
        } catch (error) {
            console.error('Error in initializeUI:', error);
            showEmptyState('An error occurred while initializing the view. Please try again.');
        }
    }

    /**
     * Load and display groups for a specific list
     * @param {string} listId - The ID of the list to load groups for
     */
    function loadGroupsForList(listId) {
        try {
            // Get all lists from storage for debugging
            let allLists = {};
            try {
                allLists = StorageManager.getLists();
                console.log('All Lists in Storage:', allLists);
                console.log('List IDs available:', Object.keys(allLists));
            } catch (e) {
                console.error('Error getting all lists:', e);
            }

            // Get the specific list
            let list = null;
            try {
                list = StorageManager.getList(listId);
                console.log('Retrieved List:', list);
            } catch (e) {
                console.error('Error getting list with ID:', listId, e);
            }

            if (!list) {
                console.error('List not found with ID:', listId);
                showEmptyState('List not found. Please ask your teacher to create a list.');
                return;
            }

            // Update class name
            try {
                className.textContent = list.name;
            } catch (e) {
                console.error('Error updating class name:', e);
            }

            // Check if groups exist
            if (!list.currentGroups || list.currentGroups.length === 0) {
                console.warn('No groups found for list:', listId);
                showEmptyState('No groups have been generated yet. Please ask your teacher to generate groups.');
                return;
            }

            console.log('Groups to display:', list.currentGroups);

            // Display groups
            displayGroups(list.currentGroups);
        } catch (error) {
            console.error('Error in loadGroupsForList:', error);
            showEmptyState('An error occurred while loading groups. Please try again.');
        }
    }

    /**
     * Display groups in a visually appealing way
     * @param {Array} groups - Array of groups to display
     */
    function displayGroups(groups) {
        try {
            // Clear container
            groupsContainer.innerHTML = '';

            // Check if we should use rectangular layout for many students
            const useRectangularLayout = groups.some(group => group.length > 6);
            if (useRectangularLayout) {
                groupsContainer.classList.add('rectangular-layout');
            } else {
                groupsContainer.classList.remove('rectangular-layout');
            }

            // Create and add group bubbles
            groups.forEach((group, index) => {
                try {
                    const groupBubble = document.createElement('div');
                    groupBubble.className = 'group-bubble';

                    // Add group title
                    const groupTitle = document.createElement('h2');
                    groupTitle.className = 'group-title';
                    groupTitle.textContent = GroupThing.formatGroupName(index);
                    groupBubble.appendChild(groupTitle);

                    // Add group members
                    const membersList = document.createElement('ul');
                    membersList.className = 'group-members';

                    group.forEach(student => {
                        const memberItem = document.createElement('li');
                        memberItem.className = 'group-member';
                        memberItem.textContent = student;
                        membersList.appendChild(memberItem);
                    });

                    groupBubble.appendChild(membersList);
                    groupsContainer.appendChild(groupBubble);

                    // Add a slight delay to each bubble for staggered animation
                    groupBubble.style.animationDelay = `${index * 0.1}s`;
                } catch (e) {
                    console.error('Error creating group bubble for group:', index, e);
                }
            });

            console.log('Groups displayed successfully');
        } catch (error) {
            console.error('Error in displayGroups:', error);
            showEmptyState('An error occurred while displaying groups. Please try again.');
        }
    }

    /**
     * Show empty state message
     * @param {string} message - Optional custom message
     */
    function showEmptyState(message = 'No groups have been generated yet. Please ask your teacher to generate groups.') {
        groupsContainer.innerHTML = `
            <div class="empty-state">
                <p>${message}</p>
                <p>Return to the <a href="index.html">Teacher View</a> to create groups.</p>
            </div>
        `;
    }

    /**
     * Handle window resize to adjust layout if needed
     */
    window.addEventListener('resize', () => {
        const currentListId = StorageManager.getCurrentListId();
        if (currentListId) {
            const list = StorageManager.getList(currentListId);
            if (list && list.currentGroups) {
                // Check if we need to switch layouts
                const useRectangularLayout = list.currentGroups.some(group => group.length > 6);
                groupsContainer.classList.toggle('rectangular-layout', useRectangularLayout);
            }
        }
    });
});
