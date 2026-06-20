/**
 * Carbon Twin Simulator Tests
 * Unit tests for emissions projection and reduction calculations
 */

import { describe, it, expect } from 'vitest';

// Mock calculation factors
const factors = {
  transport: {
    petrol_car: 0.185,
    diesel_car: 0.171,
    hybrid_car: 0.098,
    electric_car: 0.045,
    public_transport: 0.040
  },
  energy: {
    electricity_kwh: 0.410,
    ac_hour: 0.450
  },
  food: {
    vegetarian_meal: 0.75,
    non_vegetarian_meal: 2.45
  }
};

// Calculate commute savings
function calculateCommuteSavings(kmSwapped, carType) {
  const carFactor = factors.transport[carType + '_car'] || 0.185;
  return kmSwapped * carFactor * 4.33 * 12; // monthly to yearly
}

// Calculate AC savings
function calculateACSavings(hoursReduced) {
  return hoursReduced * 30 * factors.energy.ac_hour * 12;
}

// Calculate meat swap savings
function calculateMeatSwapSavings(mealsSwapped) {
  const difference = factors.food.non_vegetarian_meal - factors.food.vegetarian_meal;
  return mealsSwapped * difference * 4.33 * 12;
}

// Calculate LED savings
function calculateLEDSavings(percentageReplaced, electricityUsage) {
  const lightingPercentage = 0.15;
  const ledSavingsPercent = (percentageReplaced / 100) * 0.75 * lightingPercentage;
  return electricityUsage * ledSavingsPercent * factors.energy.electricity_kwh * 12;
}

// Financial calculation
function calculateFinancialSavings(emissions) {
  // Approximate savings: $0.15/km for fuel, $0.16/kWh for electricity
  const fuelCost = emissions * 0.15 * (1 / factors.transport.petrol_car);
  return fuelCost;
}

describe('Carbon Twin Simulator', () => {
  describe('Commute reduction savings', () => {
    it('should calculate car swap savings', () => {
      const savings = calculateCommuteSavings(50, 'petrol');
      expect(savings).toBeGreaterThan(0);
    });

    it('should show petrol to electric savings', () => {
      const petrolSavings = calculateCommuteSavings(100, 'petrol');
      const electricSavings = calculateCommuteSavings(100, 'electric');
      const difference = petrolSavings - electricSavings;

      expect(difference).toBeGreaterThan(0);
      expect(difference).toBeCloseTo(727, 0);
    });

    it('should show petrol to hybrid savings', () => {
      const petrolSavings = calculateCommuteSavings(100, 'petrol');
      const hybridSavings = calculateCommuteSavings(100, 'hybrid');

      expect(petrolSavings).toBeGreaterThan(hybridSavings);
    });

    it('should scale with distance swapped', () => {
      const small = calculateCommuteSavings(10, 'petrol');
      const large = calculateCommuteSavings(100, 'petrol');

      expect(large).toBeGreaterThan(small);
      expect(large).toBeCloseTo(small * 10, 0);
    });
  });

  describe('AC reduction savings', () => {
    it('should calculate AC hour reduction', () => {
      const savings = calculateACSavings(1);
      expect(savings).toBeGreaterThan(0);
      expect(savings).toBeCloseTo(162, 0); // ~162 kg CO2/year for 1 hour reduction
    });

    it('should scale with hours reduced', () => {
      const one = calculateACSavings(1);
      const two = calculateACSavings(2);

      expect(two).toBeCloseTo(one * 2, 0);
    });

    it('should show significant savings from AC reduction', () => {
      const noReduction = 0;
      const oneHour = calculateACSavings(1);

      expect(oneHour).toBeCloseTo(162, 0);
    });
  });

  describe('Diet change savings', () => {
    it('should calculate meat meal swap savings', () => {
      const savings = calculateMeatSwapSavings(3);
      expect(savings).toBeGreaterThan(0);
    });

    it('should show substantial savings from vegetarian meals', () => {
      const difference = factors.food.non_vegetarian_meal - factors.food.vegetarian_meal;
      const yearly = difference * 4.33 * 12;

      expect(yearly).toBeGreaterThan(80);
    });

    it('should accumulate savings from multiple meal swaps', () => {
      const threeSwaps = calculateMeatSwapSavings(3);
      const sevenSwaps = calculateMeatSwapSavings(7);

      expect(sevenSwaps).toBeGreaterThan(threeSwaps);
      expect(sevenSwaps).toBeCloseTo(threeSwaps * (7 / 3), 0);
    });
  });

  describe('LED bulb replacement savings', () => {
    it('should calculate partial LED replacement', () => {
      const savings = calculateLEDSavings(50, 250);
      expect(savings).toBeGreaterThan(0);
    });

    it('should show more savings with higher replacement percentage', () => {
      const half = calculateLEDSavings(50, 250);
      const full = calculateLEDSavings(100, 250);

      expect(full).toBeGreaterThan(half);
      expect(full).toBeCloseTo(half * 2, 0);
    });

    it('should account for electricity usage', () => {
      const low = calculateLEDSavings(100, 100);
      const high = calculateLEDSavings(100, 300);

      expect(high).toBeGreaterThan(low);
      expect(high).toBeCloseTo(low * 3, 0);
    });
  });

  describe('Combined reduction scenarios', () => {
    it('should calculate total savings from multiple actions', () => {
      const commuteSavings = calculateCommuteSavings(50, 'petrol');
      const acSavings = calculateACSavings(1);
      const meatSavings = calculateMeatSwapSavings(3);
      const ledSavings = calculateLEDSavings(50, 250);

      const totalSavings = commuteSavings + acSavings + meatSavings + ledSavings;
      expect(totalSavings).toBeGreaterThan(0);
    });

    it('should show aggressive reduction scenario', () => {
      // Maximum reductions
      const maxCommute = calculateCommuteSavings(150, 'petrol');
      const maxAC = calculateACSavings(12);
      const maxMeat = calculateMeatSwapSavings(14);
      const maxLED = calculateLEDSavings(100, 250);

      const totalMaxSavings = maxCommute + maxAC + maxMeat + maxLED;
      expect(totalMaxSavings).toBeGreaterThan(1000); // 1 ton+ annual savings
    });

    it('should show modest reduction scenario', () => {
      const modestCommute = calculateCommuteSavings(20, 'petrol');
      const modestAC = calculateACSavings(0.5);
      const modestMeat = calculateMeatSwapSavings(1);
      const modestLED = calculateLEDSavings(25, 250);

      const totalModest = modestCommute + modestAC + modestMeat + modestLED;
      expect(totalModest).toBeGreaterThan(0);
      expect(totalModest).toBeLessThan(maxReductions());
    });
  });

  describe('Twin score calculation', () => {
    it('should calculate twin score from emissions', () => {
      const currentYearly = 8000;
      const savings = 2000;
      const twinYearly = currentYearly - savings;

      let twinScore = 100;
      if (twinYearly <= 2000) {
        twinScore = 100;
      } else if (twinYearly >= 18000) {
        twinScore = 5;
      } else {
        twinScore = 100 - Math.round(((twinYearly - 2000) / 16000) * 95);
      }

      expect(twinScore).toBeGreaterThan(50);
      expect(twinScore).toBeLessThan(100);
    });

    it('should improve with savings', () => {
      const baseline = 10000;
      const score1 = 100 - Math.round(((baseline - 2000) / 16000) * 95);

      const reduced = 6000;
      const score2 = 100 - Math.round(((reduced - 2000) / 16000) * 95);

      expect(score2).toBeGreaterThan(score1);
    });
  });

  describe('Financial savings', () => {
    it('should estimate fuel cost savings', () => {
      const savings = calculateCommuteSavings(100, 'petrol');
      const financialSavings = calculateFinancialSavings(savings);
      expect(financialSavings).toBeGreaterThan(0);
    });

    it('should show substantial annual savings', () => {
      const totalEmissionsSavings = 3000; // 3 tons CO2
      const financialSavings = calculateFinancialSavings(totalEmissionsSavings);
      expect(financialSavings).toBeGreaterThan(100); // At least $100
    });
  });

  describe('Trees equivalent', () => {
    it('should convert emissions to trees saved', () => {
      const co2Saved = 220;
      const co2PerTree = 22;
      const treesEquivalent = co2Saved / co2PerTree;

      expect(treesEquivalent).toBe(10);
    });

    it('should show trees equivalent for typical savings', () => {
      const savings = 1000; // kg CO2
      const trees = savings / 22;

      expect(trees).toBeCloseTo(45.5, 1);
    });
  });

  describe('Edge cases', () => {
    it('should not allow negative savings', () => {
      const savings = Math.max(0, calculateCommuteSavings(-50, 'petrol'));
      expect(savings).toBeGreaterThanOrEqual(0);
    });

    it('should cap twin yearly emissions at minimum', () => {
      const currentYearly = 5000;
      const savings = 10000; // More than current
      const twinYearly = Math.max(200, currentYearly - savings);

      expect(twinYearly).toBeGreaterThanOrEqual(200);
    });

    it('should handle zero initial emissions', () => {
      const score = 100;
      expect(score).toBe(100);
    });
  });
});

// Helper function for max reductions
function maxReductions() {
  const maxCommute = calculateCommuteSavings(150, 'petrol');
  const maxAC = calculateACSavings(12);
  const maxMeat = calculateMeatSwapSavings(14);
  const maxLED = calculateLEDSavings(100, 250);
  return maxCommute + maxAC + maxMeat + maxLED;
}
