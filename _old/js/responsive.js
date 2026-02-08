/**
 * Responsive functionality for GroupThing application
 * Handles collapsible sections and other mobile-specific features
 */

document.addEventListener('DOMContentLoaded', () => {
    // Only apply collapsible sections on mobile devices
    if (window.innerWidth <= 768) {
        setupCollapsibleSections();
    }

    // Listen for window resize events to apply/remove collapsible sections
    window.addEventListener('resize', () => {
        if (window.innerWidth <= 768) {
            setupCollapsibleSections();
        } else {
            removeCollapsibleSections();
        }
    });
});

/**
 * Set up collapsible sections for mobile view
 */
function setupCollapsibleSections() {
    const sectionHeaders = document.querySelectorAll('.section-header');

    sectionHeaders.forEach(header => {
        // Skip if already initialized
        if (header.getAttribute('data-initialized') === 'true') {
            return;
        }

        // Find the next sibling that is a section-content
        const content = header.nextElementSibling;
        if (!content || !content.classList.contains('section-content')) {
            return;
        }

        // Add click event to toggle collapse
        header.addEventListener('click', (e) => {
            // Don't collapse if clicking on a child element that's interactive
            const target = e.target;
            if (target !== header && target instanceof HTMLElement && (
                target.tagName === 'BUTTON' ||
                target.tagName === 'SELECT' ||
                target.tagName === 'INPUT'
            )) {
                return;
            }

            header.classList.toggle('collapsed');
            content.classList.toggle('collapsed');
        });

        // Mark as initialized
        header.setAttribute('data-initialized', 'true');
    });

    // Determine which sections should be expanded by default on mobile
    const expandedSectionSelectors = [
        '.class-lists-panel .section-header', // First section (class lists)
        '.groups-preview-panel .section-header', // Generated groups
        '.incompatible-panel .section-header' // Incompatible pairs
    ];

    // Collapse all sections except the ones that should be expanded by default
    const allHeaders = Array.from(document.querySelectorAll('.section-header'));
    allHeaders.forEach(header => {
        // Check if this header should be expanded
        const shouldBeExpanded = expandedSectionSelectors.some(selector =>
            header.closest(selector.split(' ')[0]) && header.matches(selector.split(' ')[1])
        );

        if (!shouldBeExpanded) {
            header.classList.add('collapsed');
            const content = header.nextElementSibling;
            if (content && content.classList.contains('section-content')) {
                content.classList.add('collapsed');
            }
        }
    });
}

/**
 * Remove collapsible functionality for desktop view
 */
function removeCollapsibleSections() {
    const sectionHeaders = document.querySelectorAll('.section-header');
    const sectionContents = document.querySelectorAll('.section-content');

    // Remove collapsed class from all headers and contents
    sectionHeaders.forEach(header => {
        header.classList.remove('collapsed');
    });

    sectionContents.forEach(content => {
        content.classList.remove('collapsed');
    });
}

/**
 * Adjust viewport height for mobile browsers
 * This helps with the "100vh" issue on mobile browsers where the address bar affects the viewport height
 */
function setMobileViewportHeight() {
    // First we get the viewport height and multiply it by 1% to get a value for a vh unit
    const vh = window.innerHeight * 0.01;
    // Then we set the value in the --vh custom property to the root of the document
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

// Set the viewport height initially and on resize
setMobileViewportHeight();
window.addEventListener('resize', setMobileViewportHeight);
