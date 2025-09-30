/**
 * Group Generation
 * Simple algorithm for creating student groups
 */

const Groups = {
  /**
   * Animal emojis for group names (expanded to support 25+ groups)
   */
  animals: [
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
    { emoji: '🐺', name: 'Wolves' },
    { emoji: '🦇', name: 'Bats' },
    { emoji: '🦋', name: 'Butterflies' },
    { emoji: '🐝', name: 'Bees' },
    { emoji: '🦎', name: 'Lizards' },
    { emoji: '🐍', name: 'Snakes' },
    { emoji: '🦆', name: 'Ducks' },
    { emoji: '🦢', name: 'Swans' },
    { emoji: '🐧', name: 'Penguins' },
    { emoji: '🦩', name: 'Flamingos' },
    { emoji: '🦚', name: 'Peacocks' },
    { emoji: '🦜', name: 'Parrots' },
    { emoji: '🐳', name: 'Whales' },
    { emoji: '🦈', name: 'Sharks' }
  ],

  /**
   * Shuffle an array (Fisher-Yates)
   */
  shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },

  /**
   * Check if groups satisfy pairing rule constraints
   */
  isValid(groups, pairingRules) {
    if (!pairingRules || pairingRules.length === 0) {
      return true;
    }

    for (const rule of pairingRules) {
      // Handle old format (simple array of pairs)
      if (Array.isArray(rule) && !rule.type) {
        const [student1, student2] = rule;
        for (const group of groups) {
          if (group.includes(student1) && group.includes(student2)) {
            return false; // Old format = never together
          }
        }
        continue;
      }

      // Handle new format with type field
      if (rule.type === 'never') {
        // Check that no group contains all these students together
        for (const group of groups) {
          const allInGroup = rule.students.every(s => group.includes(s));
          if (allInGroup) {
            return false;
          }
        }
      } else if (rule.type === 'always') {
        // Check that all students in this rule are in the same group
        const studentsInRule = rule.students;
        let foundGroupWithAll = false;

        for (const group of groups) {
          const allInThisGroup = studentsInRule.every(s => group.includes(s));
          if (allInThisGroup) {
            foundGroupWithAll = true;
            break;
          }
        }

        if (!foundGroupWithAll) {
          return false;
        }
      }
    }

    return true;
  },

  /**
   * Distribute students into groups evenly
   */
  distribute(students, groupSize) {
    if (students.length === 0) return [];
    if (students.length <= groupSize) return [students];

    // Calculate number of groups
    let numGroups = Math.ceil(students.length / groupSize);

    // Adjust if we'd have a single-person group
    if (students.length % numGroups === 1 && numGroups > 1) {
      numGroups--;
    }

    // Create groups
    const groups = Array.from({ length: numGroups }, () => []);

    // Distribute students round-robin style
    students.forEach((student, i) => {
      groups[i % numGroups].push(student);
    });

    // Safety check: merge any single-person groups (unless group size is intentionally 1)
    if (groupSize > 1) {
      const singleGroups = groups.filter(g => g.length === 1);
      if (singleGroups.length > 0) {
        singleGroups.forEach(singleGroup => {
          const multiGroups = groups.filter(g => g !== singleGroup && g.length > 1);
          if (multiGroups.length > 0) {
            // Add to smallest group
            multiGroups.sort((a, b) => a.length - b.length);
            multiGroups[0].push(singleGroup[0]);
          }
        });
        // Remove single-person groups
        return groups.filter(g => g.length > 1);
      }
    }

    return groups;
  },

  /**
   * Generate groups with constraints
   */
  generate(students, groupSize, pairingRules = []) {
    if (!students || students.length === 0) {
      return [];
    }

    // Try up to 50 times to satisfy constraints
    const maxAttempts = 50;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const shuffled = this.shuffle(students);
      const groups = this.distribute(shuffled, groupSize);

      if (this.isValid(groups, pairingRules)) {
        return { groups, constraintsSatisfied: true };
      }

      attempts++;
    }

    // If we can't satisfy constraints, return best attempt
    console.warn('Could not satisfy all pairing rule constraints after 50 attempts');
    const shuffled = this.shuffle(students);
    return {
      groups: this.distribute(shuffled, groupSize),
      constraintsSatisfied: false
    };
  },

  /**
   * Get group name (emoji or numbered)
   */
  getGroupName(index, useEmoji = true) {
    if (useEmoji) {
      const animal = this.animals[index % this.animals.length];
      return `${animal.emoji} ${animal.name}`;
    }
    return `Group ${index + 1}`;
  }
};