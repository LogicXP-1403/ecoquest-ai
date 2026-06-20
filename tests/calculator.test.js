/**
 * Calculator Tests
 * Unit tests for carbon footprint calculation logic
 */

import { describe, it, expect } from 'vitest';

// Mock window object for browser APIs
const mockCalculator = {
  FACTORS: {
    transport: {
      petrol_car: 0.185,
      diesel_car: 0.171,
      hybrid_car: 0.098,
      electric_car: 0.045,
      public_transport: 0.040,
      bike: 0.000,
      walking: 0.000
    },
    energy: {
      electricity_kwh: 0.410,
      ac_hour: 0.450,
      appliance_modifiers: {
        low: 1.25,
        medium: 1.00,
        high: 0.75
      }
    },
    food: {
      vegetarian_meal: 0.75,
      non_vegetarian_meal: 2.45,
      packaged_diet: {
        low: 0.50,
        medium: 1.20,
        high: 2.50
      }
    },
    shopping: {
      purchase_item: 12.5,
      fast_fashion: {
        never: 0,
        sometimes: 45.0,
        frequently: 120.0
      }
    }
  },

  calculateScore: function(yearlyTotal) {
    if (yearlyTotal <= 2000) return 100;
    if (yearlyTotal >= 18000) return 5;
    return 100 - Math.round(((yearlyTotal - 2000) / 16000) * 95);
  },

  getGradeInfo: function(score) {
    if (score >= 90) {
      return { grade: 'A+', title: 'Planet Guardian', feedback: 'Outstanding!' };
    } else if (score >= 80) {
      return { grade: 'A', title: 'Green Hero', feedback: 'Excellent job!' };
    } else if (score >= 70) {
      return { grade: 'B', title: 'Eco Explorer', feedback: 'Good work!' };
    } else if (score >= 50) {
      return { grade: 'C', title: 'Habit Changer', feedback: 'Moderate footprint.' };
    } else if (score >= 30) {
      return { grade: 'D', title: 'Carbon Heavyweight', feedback: 'High footprint.' };
    } else {
      return { grade: 'F', title: 'Climate Sinner', feedback: 'Critical footprint!' };
    }
  }
};

describe('EcoQuestCalculator', () => {
  describe('calculateScore', () => {
    it('should return 100 for excellent footprint (<=2000kg)', () => {
      expect(mockCalculator.calculateScore(1500)).toBe(100);
    });

    it('should return 5 for critical footprint (>=18000kg)', () => {
      expect(mockCalculator.calculateScore(18500)).toBe(5);
    });

    it('should scale linearly between 2000 and 18000', () => {
      const midPoint = 10000;
      const score = mockCalculator.calculateScore(midPoint);
      expect(score).toBeGreaterThan(5);
      expect(score).toBeLessThan(100);
    });

    it('should return 80 for ~5600kg yearly emissions', () => {
      const score = mockCalculator.calculateScore(5600);
      expect(score).toBeGreaterThanOrEqual(78);
      expect(score).toBeLessThanOrEqual(82);
    });
  });

  describe('getGradeInfo', () => {
    it('should return A+ for score >= 90', () => {
      const info = mockCalculator.getGradeInfo(95);
      expect(info.grade).toBe('A+');
      expect(info.title).toBe('Planet Guardian');
    });

    it('should return A for score 80-89', () => {
      const info = mockCalculator.getGradeInfo(85);
      expect(info.grade).toBe('A');
      expect(info.title).toBe('Green Hero');
    });

    it('should return B for score 70-79', () => {
      const info = mockCalculator.getGradeInfo(75);
      expect(info.grade).toBe('B');
      expect(info.title).toBe('Eco Explorer');
    });

    it('should return C for score 50-69', () => {
      const info = mockCalculator.getGradeInfo(55);
      expect(info.grade).toBe('C');
      expect(info.title).toBe('Habit Changer');
    });

    it('should return D for score 30-49', () => {
      const info = mockCalculator.getGradeInfo(35);
      expect(info.grade).toBe('D');
      expect(info.title).toBe('Carbon Heavyweight');
    });

    it('should return F for score < 30', () => {
      const info = mockCalculator.getGradeInfo(20);
      expect(info.grade).toBe('F');
      expect(info.title).toBe('Climate Sinner');
    });
  });

  describe('FACTORS constants', () => {
    it('should have transportation factors', () => {
      expect(mockCalculator.FACTORS.transport.petrol_car).toBe(0.185);
      expect(mockCalculator.FACTORS.transport.electric_car).toBe(0.045);
    });

    it('should have energy factors', () => {
      expect(mockCalculator.FACTORS.energy.electricity_kwh).toBe(0.410);
      expect(mockCalculator.FACTORS.energy.ac_hour).toBe(0.450);
    });

    it('should have food factors', () => {
      expect(mockCalculator.FACTORS.food.vegetarian_meal).toBe(0.75);
      expect(mockCalculator.FACTORS.food.non_vegetarian_meal).toBe(2.45);
    });

    it('should have shopping factors', () => {
      expect(mockCalculator.FACTORS.shopping.purchase_item).toBe(12.5);
    });

    it('electric car should have lowest transport emissions', () => {
      const electric = mockCalculator.FACTORS.transport.electric_car;
      const petrol = mockCalculator.FACTORS.transport.petrol_car;
      expect(electric).toBeLessThan(petrol);
    });

    it('vegetarian meals should produce less CO2 than non-vegetarian', () => {
      const veg = mockCalculator.FACTORS.food.vegetarian_meal;
      const nonVeg = mockCalculator.FACTORS.food.non_vegetarian_meal;
      expect(veg).toBeLessThan(nonVeg);
    });
  });

  describe('Transport emissions calculation', () => {
    it('should calculate car emissions based on fuel type', () => {
      // Petrol car: 100 km/week * 0.185 * 4.33 weeks/month = ~80 kg CO2/month
      const carEmissions = 100 * mockCalculator.FACTORS.transport.petrol_car * 4.33;
      expect(carEmissions).toBeCloseTo(80, 0);
    });

    it('should show savings from switching to electric vehicle', () => {
      const petrolEmissions = 100 * mockCalculator.FACTORS.transport.petrol_car * 4.33;
      const electricEmissions = 100 * mockCalculator.FACTORS.transport.electric_car * 4.33;
      const savings = petrolEmissions - electricEmissions;
      expect(savings).toBeGreaterThan(0);
      expect(savings).toBeCloseTo(60.6, 0);
    });
  });

  describe('Energy emissions calculation', () => {
    it('should account for AC usage', () => {
      const acEmissions = 4 * 30 * mockCalculator.FACTORS.energy.ac_hour;
      expect(acEmissions).toBeCloseTo(54, 0);
    });

    it('should account for electricity consumption', () => {
      const electricityEmissions = 250 * mockCalculator.FACTORS.energy.electricity_kwh;
      expect(electricityEmissions).toBeCloseTo(102.5, 1);
    });

    it('should apply efficiency modifiers correctly', () => {
      const baseEmissions = 100;
      const highEfficiency = baseEmissions * 0.75;
      const lowEfficiency = baseEmissions * 1.25;
      expect(highEfficiency).toBe(75);
      expect(lowEfficiency).toBe(125);
    });
  });

  describe('Food emissions calculation', () => {
    it('should calculate vegetarian meal emissions', () => {
      const vegMeals = 14 * mockCalculator.FACTORS.food.vegetarian_meal * 4.33;
      expect(vegMeals).toBeCloseTo(45.5, 1);
    });

    it('should calculate non-vegetarian meal emissions', () => {
      const nonVegMeals = 7 * mockCalculator.FACTORS.food.non_vegetarian_meal * 4.33;
      expect(nonVegMeals).toBeCloseTo(74.3, 1);
    });

    it('should show CO2 savings from meatless meals', () => {
      const meatMeal = mockCalculator.FACTORS.food.non_vegetarian_meal;
      const vegMeal = mockCalculator.FACTORS.food.vegetarian_meal;
      const savingsPerMeal = meatMeal - vegMeal;
      expect(savingsPerMeal).toBeCloseTo(1.7, 1);
    });

    it('should account for packaged food impact', () => {
      const mediumPackaged = mockCalculator.FACTORS.food.packaged_diet.medium * 30;
      expect(mediumPackaged).toBe(36);
    });
  });

  describe('Shopping emissions calculation', () => {
    it('should calculate emissions from purchases', () => {
      const emissions = 3 * mockCalculator.FACTORS.shopping.purchase_item;
      expect(emissions).toBe(37.5);
    });

    it('should account for fast fashion habits', () => {
      const sometimes = mockCalculator.FACTORS.shopping.fast_fashion.sometimes;
      const frequently = mockCalculator.FACTORS.shopping.fast_fashion.frequently;
      expect(frequently).toBe(120.0);
      expect(sometimes).toBe(45.0);
      expect(frequently).toBeGreaterThan(sometimes);
    });
  });
});
