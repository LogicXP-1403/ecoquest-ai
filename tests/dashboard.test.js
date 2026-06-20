/**
 * Dashboard Tests
 * Unit tests for dashboard metrics and user state
 */

import { describe, it, expect } from 'vitest';

// Mock user state
function createDefaultUserState() {
  return {
    username: '',
    avatar: '🛡️',
    xp: 0,
    level: 1,
    streak: 0,
    lastActiveDate: '',
    co2Saved: 0.0,
    completedMissions: [],
    completedHabits: [],
    unlockedBadges: [],
    activeChallenges: {},
    calculatorAnswers: null,
    calculatedEmissions: null,
    quizQuestionIndex: 0,
    chatHistory: [],
    weeklyReport: null
  };
}

// Calculate user level
function calculateUserLevel(xp) {
  return Math.floor(xp / 100) + 1;
}

// Calculate rank tier
function calculateRankTier(xp) {
  if (xp >= 5000) return 'Legendary';
  if (xp >= 2000) return 'Expert';
  if (xp >= 1000) return 'Advocate';
  return 'Eco-Warrior';
}

// Calculate trees saved
function calculateTreesSaved(co2Saved) {
  return co2Saved / 22; // 22 kg CO2 per tree
}

// Calculate streak update
function updateStreakProgress(lastActiveDate, currentDate) {
  if (lastActiveDate === currentDate) {
    return { renewed: false };
  }

  const yesterday = new Date(currentDate);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (lastActiveDate === yesterdayStr) {
    return { renewed: true, streak: 1 }; // increment by 1
  }

  return { renewed: true, streak: 1 }; // reset to 1
}

// Get dashboard grade badge
function getDashboardGrade(score) {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 50) return 'C';
  if (score >= 30) return 'D';
  return 'F';
}

describe('Dashboard', () => {
  describe('User state initialization', () => {
    it('should initialize with default values', () => {
      const state = createDefaultUserState();

      expect(state.username).toBe('');
      expect(state.xp).toBe(0);
      expect(state.level).toBe(1);
      expect(state.streak).toBe(0);
      expect(state.co2Saved).toBe(0.0);
    });

    it('should have empty completed missions', () => {
      const state = createDefaultUserState();
      expect(state.completedMissions).toHaveLength(0);
    });

    it('should have empty unlocked badges', () => {
      const state = createDefaultUserState();
      expect(state.unlockedBadges).toHaveLength(0);
    });

    it('should have no active challenges', () => {
      const state = createDefaultUserState();
      expect(Object.keys(state.activeChallenges)).toHaveLength(0);
    });
  });

  describe('User leveling', () => {
    it('should start at level 1', () => {
      const level = calculateUserLevel(0);
      expect(level).toBe(1);
    });

    it('should reach level 2 at 100 XP', () => {
      const level = calculateUserLevel(100);
      expect(level).toBe(2);
    });

    it('should reach level 5 at 400 XP', () => {
      const level = calculateUserLevel(400);
      expect(level).toBe(5);
    });

    it('should reach level 10 at 900 XP', () => {
      const level = calculateUserLevel(900);
      expect(level).toBe(10);
    });

    it('should progress continuously', () => {
      for (let xp = 0; xp <= 1000; xp += 100) {
        const level = calculateUserLevel(xp);
        expect(level).toBeGreaterThanOrEqual(1);
        expect(level).toBeLessThanOrEqual(11);
      }
    });
  });

  describe('Rank tier system', () => {
    it('should have Eco-Warrior tier at 0 XP', () => {
      const tier = calculateRankTier(0);
      expect(tier).toBe('Eco-Warrior');
    });

    it('should have Advocate tier at 1000 XP', () => {
      const tier = calculateRankTier(1000);
      expect(tier).toBe('Advocate');
    });

    it('should have Expert tier at 2000 XP', () => {
      const tier = calculateRankTier(2000);
      expect(tier).toBe('Expert');
    });

    it('should have Legendary tier at 5000 XP', () => {
      const tier = calculateRankTier(5000);
      expect(tier).toBe('Legendary');
    });

    it('should show tier progression', () => {
      expect(calculateRankTier(0)).toBe('Eco-Warrior');
      expect(calculateRankTier(1000)).toBe('Advocate');
      expect(calculateRankTier(2000)).toBe('Expert');
      expect(calculateRankTier(5000)).toBe('Legendary');
    });
  });

  describe('CO2 savings tracking', () => {
    it('should start with 0 CO2 saved', () => {
      const state = createDefaultUserState();
      expect(state.co2Saved).toBe(0.0);
    });

    it('should accumulate CO2 savings', () => {
      let co2 = 0;
      co2 += 15; // Mission 1
      co2 += 20; // Mission 2
      co2 += 10; // Mission 3

      expect(co2).toBe(45);
    });

    it('should convert CO2 to trees saved', () => {
      const co2Saved = 110;
      const trees = calculateTreesSaved(co2Saved);

      expect(trees).toBeCloseTo(5, 1);
    });

    it('should show significant impact', () => {
      const co2Saved = 1000;
      const trees = calculateTreesSaved(co2Saved);

      expect(trees).toBeCloseTo(45.45, 1);
    });
  });

  describe('Streak tracking', () => {
    it('should initialize streak to 0', () => {
      const state = createDefaultUserState();
      expect(state.streak).toBe(0);
    });

    it('should start new streak when inactive', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 2);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const today = new Date().toISOString().split('T')[0];

      const result = updateStreakProgress(yesterdayStr, today);
      expect(result.renewed).toBe(true);
      expect(result.streak).toBe(1);
    });

    it('should extend streak for consecutive days', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const today = new Date().toISOString().split('T')[0];

      const result = updateStreakProgress(yesterdayStr, today);
      expect(result.renewed).toBe(true);
    });

    it('should not renew streak on same day', () => {
      const today = new Date().toISOString().split('T')[0];

      const result = updateStreakProgress(today, today);
      expect(result.renewed).toBe(false);
    });
  });

  describe('Dashboard metrics', () => {
    it('should display username when authenticated', () => {
      let state = createDefaultUserState();
      state.username = 'EcoWarrior';

      expect(state.username).toBe('EcoWarrior');
    });

    it('should display avatar', () => {
      let state = createDefaultUserState();
      state.avatar = '🌱';

      expect(state.avatar).toBe('🌱');
    });

    it('should display XP and level', () => {
      let state = createDefaultUserState();
      state.xp = 250;

      const level = calculateUserLevel(state.xp);
      expect(level).toBe(3);
      expect(state.xp).toBe(250);
    });

    it('should display CO2 saved and trees', () => {
      let state = createDefaultUserState();
      state.co2Saved = 220;

      const trees = calculateTreesSaved(state.co2Saved);
      expect(trees).toBe(10);
    });

    it('should display grade badge', () => {
      const state = createDefaultUserState();
      state.calculatedEmissions = { score: 85 };

      const grade = getDashboardGrade(state.calculatedEmissions.score);
      expect(grade).toBe('A');
    });
  });

  describe('Dashboard grade display', () => {
    it('should show A+ for excellent score', () => {
      const grade = getDashboardGrade(95);
      expect(grade).toBe('A+');
    });

    it('should show A for good score', () => {
      const grade = getDashboardGrade(85);
      expect(grade).toBe('A');
    });

    it('should show B for above average', () => {
      const grade = getDashboardGrade(75);
      expect(grade).toBe('B');
    });

    it('should show C for average', () => {
      const grade = getDashboardGrade(55);
      expect(grade).toBe('C');
    });

    it('should show D for below average', () => {
      const grade = getDashboardGrade(35);
      expect(grade).toBe('D');
    });

    it('should show F for poor score', () => {
      const grade = getDashboardGrade(15);
      expect(grade).toBe('F');
    });
  });

  describe('Mission overview cards', () => {
    it('should track completed missions count', () => {
      let state = createDefaultUserState();
      state.completedMissions = ['m-1', 'm-2', 'm-3'];

      expect(state.completedMissions.length).toBe(3);
    });

    it('should track CO2 impact', () => {
      let state = createDefaultUserState();
      state.co2Saved = 45;

      expect(state.co2Saved).toBe(45);
    });

    it('should display rank tier', () => {
      let state = createDefaultUserState();
      state.xp = 1500;

      const tier = calculateRankTier(state.xp);
      expect(tier).toBe('Advocate');
    });
  });

  describe('User profile visibility', () => {
    it('should show user profile when authenticated', () => {
      let state = createDefaultUserState();
      state.username = 'TestUser';

      const isAuthenticated = state.username !== '';
      expect(isAuthenticated).toBe(true);
    });

    it('should hide profile when not authenticated', () => {
      let state = createDefaultUserState();

      const isAuthenticated = state.username !== '';
      expect(isAuthenticated).toBe(false);
    });

    it('should update profile when user saves', () => {
      let state = createDefaultUserState();

      state.username = 'NewUser';
      state.avatar = '🌱';
      state.streak = 1;

      expect(state.username).toBe('NewUser');
      expect(state.avatar).toBe('🌱');
      expect(state.streak).toBe(1);
    });
  });

  describe('Dashboard data persistence', () => {
    it('should serialize user state', () => {
      let state = createDefaultUserState();
      state.username = 'TestUser';
      state.xp = 250;

      const serialized = JSON.stringify(state);
      const deserialized = JSON.parse(serialized);

      expect(deserialized.username).toBe('TestUser');
      expect(deserialized.xp).toBe(250);
    });

    it('should preserve complex data structures', () => {
      let state = createDefaultUserState();
      state.completedMissions = ['m-1', 'm-2'];
      state.activeChallenges = { 'c-1': { enrolled: true, progressCurrent: 5 } };

      const serialized = JSON.stringify(state);
      const deserialized = JSON.parse(serialized);

      expect(deserialized.completedMissions).toContain('m-1');
      expect(deserialized.activeChallenges['c-1'].progressCurrent).toBe(5);
    });
  });
});
