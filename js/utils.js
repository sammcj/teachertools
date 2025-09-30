/**
 * Utilities
 * Helper functions for UI and general operations
 */

const Utils = {
  /**
   * Show toast notification
   */
  showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');

    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type} animate__animated animate__fadeInDown`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.remove('animate__fadeInDown');
      toast.classList.add('animate__fadeOutUp');

      setTimeout(() => {
        container.removeChild(toast);
        if (container.children.length === 0) {
          document.body.removeChild(container);
        }
      }, 300);
    }, 3000);
  },

  /**
   * Confirm action with user
   */
  confirm(message) {
    return window.confirm(message);
  },

  /**
   * Encode data for URL
   */
  encodeForUrl(data) {
    return btoa(JSON.stringify(data));
  },

  /**
   * Decode data from URL
   */
  decodeFromUrl(encoded) {
    try {
      return JSON.parse(atob(encoded));
    } catch (e) {
      return null;
    }
  },

  /**
   * Get URL parameters
   */
  getUrlParams() {
    const params = {};
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  },

  /**
   * Debounce function
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Generate unique ID
   */
  generateId() {
    return `_${Math.random().toString(36).substr(2, 9)}`;
  }
};