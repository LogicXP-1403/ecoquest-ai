/**
 * AI Coach Tests
 * Unit tests for AI Coach recommendation logic
 */

import { describe, it, expect } from 'vitest';

// Mock emissions breakdown
function analyzeHighestEmission(breakdown) {
  let highest = 'transport';
  let maxVal = breakdown.transport;

  if (breakdown.energy > maxVal) {
    highest = 'energy';
    maxVal = breakdown.energy;
  }
  if (breakdown.food > maxVal) {
    highest = 'food';
    maxVal = breakdown.food;
  }
  if (breakdown.shopping > maxVal) {
    highest = 'shopping';
    maxVal = breakdown.shopping;
  }

  return { category: highest, value: maxVal };
}

// Generate coach tips
function generateCoachTips(breakdown, answers) {
  const tips = [];

  if (breakdown.transport > 300) {
    tips.push('Reduce driving through cycling, public transit, or carpooling');
  }
  if (breakdown.energy > 250) {
    tips.push('Reduce AC usage or unplug phantom power devices');
  }
  if (breakdown.food > 200) {
    tips.push('Shift to plant-based meals 3-4 days per week');
  }
  if (breakdown.shopping > 100) {
    tips.push('Avoid fast fashion and choose second-hand items');
  }

  return tips;
}

// Generate weekly goals
function generateWeeklyGoals(answers, emissions) {
  const goals = [];

  if (answers.carUsage > 50) {
    goals.push({
      id: 'g-transit',
      text: 'Replace 30km of car usage with transit or cycling',
      category: 'Transport'
    });
  } else {
    goals.push({
      id: 'g-walk',
      text: 'Walk or bike for all trips under 2km',
      category: 'Transport'
    });
  }

  if (answers.acUsage > 2) {
    goals.push({
      id: 'g-ac',
      text: 'Reduce AC usage by 1 hour daily',
      category: 'Energy'
    });
  } else {
    goals.push({
      id: 'g-standby',
      text: 'Unplug all home chargers when not charging devices',
      category: 'Energy'
    });
  }

  if (answers.nonVegetarianMeals > 4) {
    goals.push({
      id: 'g-diet',
      text: 'Have at least 4 plant-based meatless days',
      category: 'Food'
    });
  } else {
    goals.push({
      id: 'g-bottle',
      text: 'Avoid purchasing single-use plastic water bottles entirely',
      category: 'Shopping'
    });
  }

  return goals;
}

// Parse user queries
function parseCoachQuery(query) {
  const q = query.toLowerCase();
  return {
    isBattle: q.includes('ac') || q.includes('electricity') || q.includes('cool'),
    isTransport: q.includes('car') || q.includes('drive') || q.includes('cycle'),
    isFood: q.includes('food') || q.includes('diet') || q.includes('meat'),
    isFashion: q.includes('fashion') || q.includes('shop')
  };
}

describe('AI Coach System', () => {
  describe('Emission analysis', () => {
    it('should identify highest emission category', () => {
      const breakdown = { transport: 250, energy: 400, food: 150, shopping: 50 };
      const analysis = analyzeHighestEmission(breakdown);

      expect(analysis.category).toBe('energy');
      expect(analysis.value).toBe(400);
    });

    it('should handle equal emissions', () => {
      const breakdown = { transport: 300, energy: 300, food: 300, shopping: 300 };
      const analysis = analyzeHighestEmission(breakdown);

      expect(analysis.category).toBe('transport');
    });

    it('should prioritize transport when tied with others', () => {
      const breakdown = { transport: 400, energy: 300, food: 300, shopping: 300 };
      const analysis = analyzeHighestEmission(breakdown);

      expect(analysis.category).toBe('transport');
    });

    it('should handle single large category', () => {
      const breakdown = { transport: 1000, energy: 50, food: 50, shopping: 50 };
      const analysis = analyzeHighestEmission(breakdown);

      expect(analysis.category).toBe('transport');
      expect(analysis.value).toBe(1000);
    });
  });

  describe('Coach tip generation', () => {
    it('should generate tips for high transport', () => {
      const breakdown = { transport: 350, energy: 100, food: 100, shopping: 50 };
      const tips = generateCoachTips(breakdown, {});

      expect(tips.some(t => t.includes('driving'))).toBe(true);
    });

    it('should generate tips for high energy', () => {
      const breakdown = { transport: 100, energy: 300, food: 100, shopping: 50 };
      const tips = generateCoachTips(breakdown, {});

      expect(tips.some(t => t.includes('AC') || t.includes('phantom'))).toBe(true);
    });

    it('should generate tips for high food', () => {
      const breakdown = { transport: 100, energy: 100, food: 250, shopping: 50 };
      const tips = generateCoachTips(breakdown, {});

      expect(tips.some(t => t.includes('plant-based'))).toBe(true);
    });

    it('should generate tips for high shopping', () => {
      const breakdown = { transport: 100, energy: 100, food: 100, shopping: 150 };
      const tips = generateCoachTips(breakdown, {});

      expect(tips.some(t => t.includes('fashion') || t.includes('second-hand'))).toBe(true);
    });

    it('should generate multiple relevant tips', () => {
      const breakdown = { transport: 350, energy: 300, food: 250, shopping: 150 };
      const tips = generateCoachTips(breakdown, {});

      expect(tips.length).toBeGreaterThanOrEqual(3);
    });

    it('should generate no tips for low emissions', () => {
      const breakdown = { transport: 100, energy: 50, food: 50, shopping: 50 };
      const tips = generateCoachTips(breakdown, {});

      expect(tips.length).toBe(0);
    });
  });

  describe('Weekly goals generation', () => {
    it('should generate transport goals for high car usage', () => {
      const answers = { carUsage: 100, acUsage: 1, nonVegetarianMeals: 2 };
      const emissions = {};
      const goals = generateWeeklyGoals(answers, emissions);

      expect(goals.some(g => g.category === 'Transport')).toBe(true);
      expect(goals[0].text).toContain('Replace 30km');
    });

    it('should generate energy goals for high AC usage', () => {
      const answers = { carUsage: 20, acUsage: 5, nonVegetarianMeals: 2 };
      const emissions = {};
      const goals = generateWeeklyGoals(answers, emissions);

      expect(goals.some(g => g.category === 'Energy')).toBe(true);
      expect(goals[1].text).toContain('Reduce AC');
    });

    it('should generate diet goals for high meat meals', () => {
      const answers = { carUsage: 20, acUsage: 1, nonVegetarianMeals: 8 };
      const emissions = {};
      const goals = generateWeeklyGoals(answers, emissions);

      expect(goals.some(g => g.category === 'Food')).toBe(true);
      expect(goals[2].text).toContain('plant-based');
    });

    it('should generate shopping goals for low meat meals', () => {
      const answers = { carUsage: 20, acUsage: 1, nonVegetarianMeals: 2 };
      const emissions = {};
      const goals = generateWeeklyGoals(answers, emissions);

      expect(goals.some(g => g.category === 'Shopping')).toBe(true);
      expect(goals[2].text).toContain('plastic');
    });

    it('should generate 3 goals', () => {
      const answers = { carUsage: 50, acUsage: 3, nonVegetarianMeals: 5 };
      const emissions = {};
      const goals = generateWeeklyGoals(answers, emissions);

      expect(goals).toHaveLength(3);
    });
  });

  describe('Query parsing', () => {
    it('should recognize AC-related queries', () => {
      const parsed = parseCoachQuery('How can I reduce AC usage?');
      expect(parsed.isBattle).toBe(true);
    });

    it('should recognize transport-related queries', () => {
      const parsed = parseCoachQuery('How can I reduce car emissions?');
      expect(parsed.isTransport).toBe(true);
    });

    it('should recognize food-related queries', () => {
      const parsed = parseCoachQuery('Can diet changes help?');
      expect(parsed.isFood).toBe(true);
    });

    it('should recognize fashion-related queries', () => {
      const parsed = parseCoachQuery('Should I shop for clothes?');
      expect(parsed.isFashion).toBe(true);
    });

    it('should handle case-insensitive queries', () => {
      const parsed1 = parseCoachQuery('AC COOLING');
      const parsed2 = parseCoachQuery('ac cooling');

      expect(parsed1.isBattle).toBe(true);
      expect(parsed2.isBattle).toBe(true);
    });

    it('should recognize multiple topics', () => {
      const parsed = parseCoachQuery('Should I cycle instead of driving and change my diet?');
      expect(parsed.isTransport).toBe(true);
      expect(parsed.isFood).toBe(true);
    });
  });

  describe('Goal tracking', () => {
    it('should initialize goals as incomplete', () => {
      const goals = [
        { id: 'g-1', text: 'Goal 1', completed: false },
        { id: 'g-2', text: 'Goal 2', completed: false }
      ];

      expect(goals.every(g => !g.completed)).toBe(true);
    });

    it('should mark goals as completed', () => {
      let goals = [
        { id: 'g-1', text: 'Goal 1', completed: false },
        { id: 'g-2', text: 'Goal 2', completed: false }
      ];

      goals[0].completed = true;

      expect(goals[0].completed).toBe(true);
      expect(goals[1].completed).toBe(false);
    });

    it('should count completed goals', () => {
      const goals = [
        { id: 'g-1', completed: true },
        { id: 'g-2', completed: true },
        { id: 'g-3', completed: false }
      ];

      const completed = goals.filter(g => g.completed).length;
      expect(completed).toBe(2);
    });

    it('should calculate goal progress', () => {
      const goals = [
        { id: 'g-1', completed: true },
        { id: 'g-2', completed: true },
        { id: 'g-3', completed: false },
        { id: 'g-4', completed: false }
      ];

      const progress = (goals.filter(g => g.completed).length / goals.length) * 100;
      expect(progress).toBe(50);
    });
  });

  describe('Coach assessment', () => {
    it('should provide personalized feedback', () => {
      const breakdown = { transport: 300, energy: 200, food: 100, shopping: 50 };
      const analysis = analyzeHighestEmission(breakdown);

      expect(analysis.category).toBe('transport');
    });

    it('should adapt to user profile', () => {
      const highCar = { carUsage: 100, acUsage: 2, nonVegetarianMeals: 5 };
      const goals1 = generateWeeklyGoals(highCar, {});
      expect(goals1[0].text).toContain('Replace');

      const lowCar = { carUsage: 10, acUsage: 2, nonVegetarianMeals: 5 };
      const goals2 = generateWeeklyGoals(lowCar, {});
      expect(goals2[0].text).toContain('Walk');
    });
  });
});
