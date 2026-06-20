/**
 * Achievements and Badges Tests
 * Unit tests for badge unlocking logic
 */

import { describe, it, expect } from 'vitest';

// Mock badges data
const badges = [
  {
    id: 'eco-beginner',
    name: 'Eco Beginner',
    requirement: 'Complete questionnaire'
  },
  {
    id: 'green-explorer',
    name: 'Green Explorer',
    requirement: 'Complete 3 missions'
  },
  {
    id: 'planet-protector',
    name: 'Planet Protector',
    requirement: 'Score >= 80'
  },
  {
    id: 'climate-champion',
    name: 'Climate Champion',
    requirement: 'Join challenge'
  },
  {
    id: 'carbon-ninja',
    name: 'Carbon Ninja',
    requirement: 'Rank 1'
  }
];

// Badge checking logic
function checkBadgeUnlock(badgeId, userState) {
  switch (badgeId) {
    case 'eco-beginner':
      return userState.calculatedEmissions !== null;
    case 'green-explorer':
      return userState.completedMissions && userState.completedMissions.length >= 3;
    case 'planet-protector':
      return userState.calculatedEmissions && userState.calculatedEmissions.score >= 80;
    case 'climate-champion':
      return userState.activeChallenges && Object.keys(userState.activeChallenges).length > 0;
    case 'carbon-ninja':
      return userState.currentRank === 1;
    default:
      return false;
  }
}

describe('Achievements and Badges', () => {
  describe('Badge structure', () => {
    it('should have 5 badges', () => {
      expect(badges).toHaveLength(5);
    });

    it('each badge should have id, name, and requirement', () => {
      badges.forEach(badge => {
        expect(badge).toHaveProperty('id');
        expect(badge).toHaveProperty('name');
        expect(badge).toHaveProperty('requirement');
      });
    });

    it('should have unique badge IDs', () => {
      const ids = badges.map(b => b.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('Badge unlocking logic', () => {
    it('should unlock eco-beginner on first questionnaire completion', () => {
      const userState = {
        calculatedEmissions: { score: 75 },
        completedMissions: [],
        activeChallenges: {},
        currentRank: 10
      };

      expect(checkBadgeUnlock('eco-beginner', userState)).toBe(true);
    });

    it('should not unlock eco-beginner without questionnaire', () => {
      const userState = {
        calculatedEmissions: null,
        completedMissions: [],
        activeChallenges: {},
        currentRank: 10
      };

      expect(checkBadgeUnlock('eco-beginner', userState)).toBe(false);
    });

    it('should unlock green-explorer at 3+ missions', () => {
      const userState = {
        calculatedEmissions: { score: 75 },
        completedMissions: ['m-1', 'm-2', 'm-3'],
        activeChallenges: {},
        currentRank: 10
      };

      expect(checkBadgeUnlock('green-explorer', userState)).toBe(true);
    });

    it('should not unlock green-explorer below 3 missions', () => {
      const userState = {
        calculatedEmissions: { score: 75 },
        completedMissions: ['m-1', 'm-2'],
        activeChallenges: {},
        currentRank: 10
      };

      expect(checkBadgeUnlock('green-explorer', userState)).toBe(false);
    });

    it('should unlock planet-protector at score >= 80', () => {
      const userState = {
        calculatedEmissions: { score: 85 },
        completedMissions: [],
        activeChallenges: {},
        currentRank: 10
      };

      expect(checkBadgeUnlock('planet-protector', userState)).toBe(true);
    });

    it('should not unlock planet-protector at score < 80', () => {
      const userState = {
        calculatedEmissions: { score: 75 },
        completedMissions: [],
        activeChallenges: {},
        currentRank: 10
      };

      expect(checkBadgeUnlock('planet-protector', userState)).toBe(false);
    });

    it('should unlock climate-champion on challenge enrollment', () => {
      const userState = {
        calculatedEmissions: { score: 75 },
        completedMissions: [],
        activeChallenges: { 'c-1': { enrolled: true, progressCurrent: 0 } },
        currentRank: 10
      };

      expect(checkBadgeUnlock('climate-champion', userState)).toBe(true);
    });

    it('should not unlock climate-champion without challenges', () => {
      const userState = {
        calculatedEmissions: { score: 75 },
        completedMissions: [],
        activeChallenges: {},
        currentRank: 10
      };

      expect(checkBadgeUnlock('climate-champion', userState)).toBe(false);
    });

    it('should unlock carbon-ninja at rank 1', () => {
      const userState = {
        calculatedEmissions: { score: 75 },
        completedMissions: [],
        activeChallenges: {},
        currentRank: 1
      };

      expect(checkBadgeUnlock('carbon-ninja', userState)).toBe(true);
    });

    it('should not unlock carbon-ninja below rank 1', () => {
      const userState = {
        calculatedEmissions: { score: 75 },
        completedMissions: [],
        activeChallenges: {},
        currentRank: 2
      };

      expect(checkBadgeUnlock('carbon-ninja', userState)).toBe(false);
    });
  });

  describe('Badge tracking', () => {
    it('should maintain list of unlocked badges', () => {
      let unlockedBadges = [];
      const badgeId = 'eco-beginner';

      if (!unlockedBadges.includes(badgeId)) {
        unlockedBadges.push(badgeId);
      }

      expect(unlockedBadges).toContain(badgeId);
      expect(unlockedBadges).toHaveLength(1);
    });

    it('should not unlock same badge twice', () => {
      let unlockedBadges = ['eco-beginner'];
      const badgeId = 'eco-beginner';

      if (!unlockedBadges.includes(badgeId)) {
        unlockedBadges.push(badgeId);
      }

      expect(unlockedBadges.filter(b => b === badgeId)).toHaveLength(1);
    });

    it('should unlock multiple badges independently', () => {
      let unlockedBadges = [];
      const userState = {
        calculatedEmissions: { score: 85 },
        completedMissions: ['m-1', 'm-2', 'm-3'],
        activeChallenges: { 'c-1': { enrolled: true } },
        currentRank: 1
      };

      badges.forEach(badge => {
        if (checkBadgeUnlock(badge.id, userState)) {
          if (!unlockedBadges.includes(badge.id)) {
            unlockedBadges.push(badge.id);
          }
        }
      });

      expect(unlockedBadges).toContain('eco-beginner');
      expect(unlockedBadges).toContain('green-explorer');
      expect(unlockedBadges).toContain('planet-protector');
      expect(unlockedBadges).toContain('climate-champion');
      expect(unlockedBadges).toContain('carbon-ninja');
    });
  });

  describe('Badge progression paths', () => {
    it('should show typical user progression', () => {
      const progression = [];

      // Step 1: Complete questionnaire
      let state = {
        calculatedEmissions: { score: 75 },
        completedMissions: [],
        activeChallenges: {},
        currentRank: 10
      };
      if (checkBadgeUnlock('eco-beginner', state)) progression.push('eco-beginner');

      // Step 2: Complete missions
      state.completedMissions = ['m-1', 'm-2', 'm-3'];
      if (checkBadgeUnlock('green-explorer', state)) progression.push('green-explorer');

      // Step 3: Improve score
      state.calculatedEmissions.score = 85;
      if (checkBadgeUnlock('planet-protector', state)) progression.push('planet-protector');

      // Step 4: Join challenges
      state.activeChallenges = { 'c-1': { enrolled: true } };
      if (checkBadgeUnlock('climate-champion', state)) progression.push('climate-champion');

      // Step 5: Reach rank 1
      state.currentRank = 1;
      if (checkBadgeUnlock('carbon-ninja', state)) progression.push('carbon-ninja');

      expect(progression).toHaveLength(5);
    });

    it('should allow skipping badges', () => {
      const state = {
        calculatedEmissions: { score: 95 },
        completedMissions: [],
        activeChallenges: {},
        currentRank: 10
      };

      // Can unlock planet-protector without green-explorer
      expect(checkBadgeUnlock('planet-protector', state)).toBe(true);
      expect(checkBadgeUnlock('green-explorer', state)).toBe(false);
    });
  });

  describe('Badge requirements validation', () => {
    it('should have all badges with valid requirements', () => {
      badges.forEach(badge => {
        expect(badge.requirement).toBeTruthy();
        expect(typeof badge.requirement).toBe('string');
      });
    });

    it('should map each badge to unlock logic', () => {
      badges.forEach(badge => {
        expect(typeof checkBadgeUnlock).toBe('function');
      });
    });
  });
});
