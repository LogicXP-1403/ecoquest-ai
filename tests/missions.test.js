/**
 * Missions and XP System Tests
 * Unit tests for mission completion and XP calculations
 */

import { describe, it, expect } from 'vitest';

// Mock missions data
const defaultMissions = [
  { id: 'm-1', title: 'Meat-Free Day', xp: 40, impact: 15, difficulty: 'Medium' },
  { id: 'm-2', title: 'Power-Down Hour', xp: 20, impact: 5, difficulty: 'Easy' },
  { id: 'm-3', title: 'Eco Transit', xp: 50, impact: 20, difficulty: 'Hard' },
  { id: 'm-4', title: 'Reusable Comrade', xp: 15, impact: 4, difficulty: 'Easy' },
  { id: 'm-5', title: 'Standby Slayer', xp: 25, impact: 8, difficulty: 'Easy' }
];

// Mock level calculation
function calculateLevel(totalXP) {
  return Math.floor(totalXP / 100) + 1;
}

// Mock XP calculations
function addXP(currentXP, amount) {
  if (amount <= 0) return currentXP;
  return currentXP + amount;
}

// Mock CO2 savings calculation
function addCO2Saved(currentCO2, impact) {
  return currentCO2 + impact;
}

describe('Missions System', () => {
  describe('Mission structure', () => {
    it('should have valid mission structure', () => {
      const mission = defaultMissions[0];
      expect(mission).toHaveProperty('id');
      expect(mission).toHaveProperty('title');
      expect(mission).toHaveProperty('xp');
      expect(mission).toHaveProperty('impact');
      expect(mission).toHaveProperty('difficulty');
    });

    it('should have 5 default missions', () => {
      expect(defaultMissions).toHaveLength(5);
    });

    it('missions should have positive XP rewards', () => {
      defaultMissions.forEach(mission => {
        expect(mission.xp).toBeGreaterThan(0);
      });
    });

    it('missions should have positive CO2 impact', () => {
      defaultMissions.forEach(mission => {
        expect(mission.impact).toBeGreaterThan(0);
      });
    });

    it('missions should have valid difficulty levels', () => {
      const validDifficulties = ['Easy', 'Medium', 'Hard'];
      defaultMissions.forEach(mission => {
        expect(validDifficulties).toContain(mission.difficulty);
      });
    });
  });

  describe('Mission completion', () => {
    it('should add XP when mission is completed', () => {
      const mission = defaultMissions[0];
      const initialXP = 0;
      const newXP = addXP(initialXP, mission.xp);
      expect(newXP).toBe(40);
    });

    it('should add CO2 savings when mission is completed', () => {
      const mission = defaultMissions[0];
      const initialCO2 = 0;
      const newCO2 = addCO2Saved(initialCO2, mission.impact);
      expect(newCO2).toBe(15);
    });

    it('should not add negative XP', () => {
      const initialXP = 100;
      const newXP = addXP(initialXP, -50);
      expect(newXP).toBe(100);
    });

    it('should accumulate multiple mission completions', () => {
      let totalXP = 0;
      let totalCO2 = 0;

      for (let i = 0; i < 3; i++) {
        totalXP = addXP(totalXP, defaultMissions[i].xp);
        totalCO2 = addCO2Saved(totalCO2, defaultMissions[i].impact);
      }

      expect(totalXP).toBe(110); // 40 + 20 + 50
      expect(totalCO2).toBe(40); // 15 + 5 + 20
    });

    it('should track completed missions correctly', () => {
      const completedMissions = ['m-1', 'm-3'];
      const allMissions = defaultMissions.map(m => m.id);

      const incompleted = allMissions.filter(id => !completedMissions.includes(id));
      expect(incompleted).toHaveLength(3);
    });
  });

  describe('XP and Leveling', () => {
    it('should calculate level 1 at 0 XP', () => {
      expect(calculateLevel(0)).toBe(1);
    });

    it('should calculate level 2 at 100 XP', () => {
      expect(calculateLevel(100)).toBe(2);
    });

    it('should calculate level 5 at 400 XP', () => {
      expect(calculateLevel(400)).toBe(5);
    });

    it('should calculate level 10 at 900 XP', () => {
      expect(calculateLevel(900)).toBe(10);
    });

    it('should handle level ups correctly', () => {
      const xpBefore = 95;
      const xpAfter = addXP(xpBefore, 25); // 120 total
      const levelBefore = calculateLevel(xpBefore);
      const levelAfter = calculateLevel(xpAfter);

      expect(levelBefore).toBe(1);
      expect(levelAfter).toBe(2);
    });

    it('should calculate XP progress within level', () => {
      const totalXP = 150;
      const currentLevel = calculateLevel(totalXP);
      const levelStartXP = (currentLevel - 1) * 100;
      const progressXP = totalXP - levelStartXP;

      expect(currentLevel).toBe(2);
      expect(progressXP).toBe(50);
    });
  });

  describe('CO2 savings accumulation', () => {
    it('should calculate total CO2 saved', () => {
      const completedMissions = ['m-1', 'm-2', 'm-3'];
      let totalCO2 = 0;

      defaultMissions.forEach(mission => {
        if (completedMissions.includes(mission.id)) {
          totalCO2 = addCO2Saved(totalCO2, mission.impact);
        }
      });

      expect(totalCO2).toBe(40); // 15 + 5 + 20
    });

    it('should convert CO2 savings to trees equivalent', () => {
      const co2Saved = 110; // kg
      const co2PerTree = 22; // kg per year
      const treesEquivalent = co2Saved / co2PerTree;

      expect(treesEquivalent).toBeCloseTo(5, 1);
    });

    it('should handle large CO2 accumulation', () => {
      let totalCO2 = 0;
      for (let i = 0; i < 100; i++) {
        totalCO2 = addCO2Saved(totalCO2, 10);
      }
      expect(totalCO2).toBe(1000);
    });
  });

  describe('Mission difficulty', () => {
    it('should have harder missions with higher XP rewards', () => {
      const hardMission = defaultMissions.find(m => m.difficulty === 'Hard');
      const easyMission = defaultMissions.find(m => m.difficulty === 'Easy');

      expect(hardMission.xp).toBeGreaterThan(easyMission.xp);
    });

    it('should correlate difficulty with impact', () => {
      const hardMission = defaultMissions.find(m => m.difficulty === 'Hard');
      const mediumMission = defaultMissions.find(m => m.difficulty === 'Medium');

      expect(hardMission.impact).toBeGreaterThanOrEqual(mediumMission.impact);
    });
  });

  describe('Mission filtering and search', () => {
    it('should filter missions by difficulty', () => {
      const easyMissions = defaultMissions.filter(m => m.difficulty === 'Easy');
      expect(easyMissions.length).toBeGreaterThan(0);
      easyMissions.forEach(m => {
        expect(m.difficulty).toBe('Easy');
      });
    });

    it('should find mission by ID', () => {
      const mission = defaultMissions.find(m => m.id === 'm-3');
      expect(mission).toBeDefined();
      expect(mission.title).toBe('Eco Transit');
    });

    it('should return undefined for non-existent mission', () => {
      const mission = defaultMissions.find(m => m.id === 'm-999');
      expect(mission).toBeUndefined();
    });
  });
});
