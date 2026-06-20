/**
 * EcoQuest AI - Carbon Footprint Calculator Engine
 * Provides conversion factors and calculation logic for user input variables
 * @module EcoQuestCalculator
 */

window.EcoQuestCalculator = {
  // Constants for CO2 emissions factors (in kg CO2 equivalents)
  FACTORS: {
    // Transportation: per kilometer
    transport: {
      petrol_car: 0.185,    // kg CO2 per km
      diesel_car: 0.171,    // kg CO2 per km
      hybrid_car: 0.098,    // kg CO2 per km
      electric_car: 0.045,  // kg CO2 per km (assuming grid charging average)
      public_transport: 0.040, // kg CO2 per passenger km
      bike: 0.000,
      walking: 0.000
    },

    // Home Energy: electricity per kWh, AC per hour, appliance efficiency modifier
    energy: {
      electricity_kwh: 0.410, // kg CO2 per kWh (average grid mix)
      ac_hour: 0.450,         // kg CO2 per hour of AC (assumes average 1.1kW power draw)
      appliance_modifiers: {
        low: 1.25,     // inefficient appliance modifier (+25% energy consumption)
        medium: 1.00,  // standard efficiency
        high: 0.75     // Energy Star / highly efficient (-25% energy consumption)
      }
    },

    // Food: per meal or dietary tier
    food: {
      vegetarian_meal: 0.75,     // kg CO2 per meal
      non_vegetarian_meal: 2.45, // kg CO2 per meal (higher due to beef/lamb/pork production)
      packaged_diet: {
        low: 0.50,               // minimal packaged foods, bulk purchases (kg CO2/day)
        medium: 1.20,            // average packaged foods (kg CO2/day)
        high: 2.50               // heavy packaged, pre-cooked meals, plastic wraps (kg CO2/day)
      }
    },

    // Shopping: per item or tier
    shopping: {
      purchase_item: 12.5,       // kg CO2 average per manufacturing + shipping of basic retail item
      fast_fashion: {
        never: 0,
        sometimes: 45.0,         // kg CO2 per month (occasional fast-fashion purchases)
        frequently: 120.0        // kg CO2 per month (heavy fast-fashion shopping habit)
      }
    }
  },

  /**
   * Calculates monthly and yearly CO2 emissions based on user parameters
   * @param {Object} inputs User input values
   * @param {number} inputs.carUsage Weekly car usage in kilometers
   * @param {string} inputs.carType Type of car (petrol, diesel, hybrid, electric)
   * @param {number} inputs.publicTransport Weekly public transport in kilometers
   * @param {number} inputs.bikeUsage Weekly bike usage in kilometers
   * @param {number} inputs.acUsage Daily AC usage in hours
   * @param {number} inputs.electricityUsage Monthly electricity in kWh
   * @param {string} inputs.applianceEfficiency Efficiency level (high, medium, low)
   * @param {number} inputs.vegetarianMeals Weekly vegetarian meals
   * @param {number} inputs.nonVegetarianMeals Weekly non-vegetarian meals
   * @param {string} inputs.packagedFood Packaged food consumption level
   * @param {number} inputs.monthlyPurchases Monthly new product purchases
   * @param {string} inputs.fastFashion Fast fashion frequency level
   * @returns {Object} Calculated emission report with scores and grades
   * @throws {Error} If inputs are invalid
   */
  calculate: function(inputs) {
    // Validate inputs
    if (!inputs || typeof inputs !== 'object') {
      throw new Error('Invalid inputs: must be an object');
    }

    // Sanitize and validate numeric inputs
    const sanitizeNumber = (val, defaultVal = 0, min = 0, max = Infinity) => {
      const num = parseFloat(val) || defaultVal;
      if (num < min) return min;
      if (num > max) return max;
      return Math.max(0, num);
    };

    // Defaults in case inputs are missing
    const i = Object.assign({
      carUsage: 0,
      carType: 'petrol',
      bikeUsage: 0,
      walking: 0,
      publicTransport: 0,
      acUsage: 0, // hours per day
      electricityUsage: 0, // kWh per month
      applianceEfficiency: 'medium',
      vegetarianMeals: 14, // out of 21 standard meals a week
      nonVegetarianMeals: 7, // out of 21 standard meals a week
      packagedFood: 'medium',
      monthlyPurchases: 2,
      fastFashion: 'sometimes'
    }, inputs);

    // Validate numeric inputs
    i.carUsage = sanitizeNumber(i.carUsage, 0, 0, 1000);
    i.publicTransport = sanitizeNumber(i.publicTransport, 0, 0, 1000);
    i.bikeUsage = sanitizeNumber(i.bikeUsage, 0, 0, 1000);
    i.acUsage = sanitizeNumber(i.acUsage, 0, 0, 24);
    i.electricityUsage = sanitizeNumber(i.electricityUsage, 0, 0, 10000);
    i.vegetarianMeals = sanitizeNumber(i.vegetarianMeals, 14, 0, 21);
    i.nonVegetarianMeals = sanitizeNumber(i.nonVegetarianMeals, 7, 0, 21);
    i.monthlyPurchases = sanitizeNumber(i.monthlyPurchases, 2, 0, 100);

    // Validate meal sum
    if (i.vegetarianMeals + i.nonVegetarianMeals > 21) {
      i.vegetarianMeals = 14;
      i.nonVegetarianMeals = 7;
    }

    // Validate car type
    const validCarTypes = ['petrol', 'diesel', 'hybrid', 'electric'];
    if (!validCarTypes.includes(i.carType)) {
      i.carType = 'petrol';
    }

    // Validate appliance efficiency
    const validEfficiency = ['low', 'medium', 'high'];
    if (!validEfficiency.includes(i.applianceEfficiency)) {
      i.applianceEfficiency = 'medium';
    }

    // Validate packaged food level
    const validPackagedFood = ['low', 'medium', 'high'];
    if (!validPackagedFood.includes(i.packagedFood)) {
      i.packagedFood = 'medium';
    }

    // Validate fast fashion level
    const validFastFashion = ['never', 'sometimes', 'frequently'];
    if (!validFastFashion.includes(i.fastFashion)) {
      i.fastFashion = 'sometimes';
    }

    // 1. Transportation Calculations (Weekly -> Monthly factor = 4.33 weeks per month)
    const weeksPerMonth = 4.33;
    let transportEmissions = 0;
    
    // Car
    const carFactor = this.FACTORS.transport[i.carType + '_car'] || this.FACTORS.transport.petrol_car;
    transportEmissions += i.carUsage * carFactor * weeksPerMonth;
    
    // Public Transport
    transportEmissions += i.publicTransport * this.FACTORS.transport.public_transport * weeksPerMonth;
    
    // Bike & Walking have 0 factors

    // 2. Home Energy Calculations
    let energyEmissions = 0;
    const efficiencyModifier = this.FACTORS.energy.appliance_modifiers[i.applianceEfficiency] || 1.0;

    // AC (daily usage converted to monthly: 30 days)
    const acMonthlyCO2 = i.acUsage * 30 * this.FACTORS.energy.ac_hour;
    
    // Electricity (kWh directly monthly)
    const electricityMonthlyCO2 = i.electricityUsage * this.FACTORS.energy.electricity_kwh;

    // Sum modified by efficiency of appliances
    energyEmissions = (acMonthlyCO2 + electricityMonthlyCO2) * efficiencyModifier;

    // 3. Food Calculations
    let foodEmissions = 0;
    
    // Meal types (weekly -> monthly)
    const vegCO2 = i.vegetarianMeals * this.FACTORS.food.vegetarian_meal * weeksPerMonth;
    const nonVegCO2 = i.nonVegetarianMeals * this.FACTORS.food.non_vegetarian_meal * weeksPerMonth;
    foodEmissions += vegCO2 + nonVegCO2;

    // Packaged food impact (daily factor -> monthly: 30 days)
    const packagedFactor = this.FACTORS.food.packaged_diet[i.packagedFood] || 1.20;
    foodEmissions += packagedFactor * 30;

    // 4. Shopping Calculations
    let shoppingEmissions = 0;
    
    // Standard retail item purchases
    shoppingEmissions += i.monthlyPurchases * this.FACTORS.shopping.purchase_item;

    // Fast fashion habits
    const fastFashionCO2 = this.FACTORS.shopping.fast_fashion[i.fastFashion] || 45.0;
    shoppingEmissions += fastFashionCO2;

    // Aggregate results (in kg CO2)
    const monthlyTotal = transportEmissions + energyEmissions + foodEmissions + shoppingEmissions;
    const yearlyTotal = monthlyTotal * 12;

    // Sustainability score calculation (0 to 100)
    // Baseline logic:
    // Excellent (Under 2.2 tons/year / ~183kg/month): Score 100
    // Standard Target (Under 4.5 tons/year / ~375kg/month): Score 80-99
    // Heavy Carbon Footprint (Over 18 tons/year / ~1500kg/month): Score 0-15
    let score = 100;
    if (yearlyTotal <= 2000) {
      score = 100;
    } else if (yearlyTotal >= 18000) {
      score = 5;
    } else {
      // Linear scaling between 2,000 kg and 18,000 kg CO2
      score = 100 - Math.round(((yearlyTotal - 2000) / 16000) * 95);
    }
    
    // Climate Grade logic
    let grade = 'F';
    let title = 'Climate Sinner';
    let feedback = '';

    if (score >= 90) {
      grade = 'A+';
      title = 'Planet Guardian';
      feedback = 'Outstanding! Your footprint is well within the sustainable threshold for global temperatures. You are leading the charge for a cleaner planet!';
    } else if (score >= 80) {
      grade = 'A';
      title = 'Green Hero';
      feedback = 'Excellent job! You are living very consciously. With just a few minor tweaks, you can become a gold-standard Planet Guardian.';
    } else if (score >= 70) {
      grade = 'B';
      title = 'Eco Explorer';
      feedback = 'Good work! You are making active efforts to stay green. Try to reduce single-occupancy driving and increase plant-based meals to boost your score.';
    } else if (score >= 50) {
      grade = 'C';
      title = 'Habit Changer';
      feedback = 'Moderate footprint. Your habits show some effort, but high electricity consumption or travel habits are weighing down your score. Try our Carbon Twin tool to simulate easy reductions!';
    } else if (score >= 30) {
      grade = 'D';
      title = 'Carbon Heavyweight';
      feedback = 'High footprint. Your lifestyle exceeds sustainable limits significantly. Swapping fast fashion purchases and cycling short distances can make a massive impact.';
    } else {
      grade = 'F';
      title = 'Climate Sinner';
      feedback = 'Critical footprint! Your emissions are extremely high, representing severe planetary strain. Unplug standby items, reduce electricity draw, and try meat-free days immediately.';
    }

    return {
      monthlyCO2: Math.round(monthlyTotal),
      yearlyCO2: Math.round(yearlyTotal),
      score: score,
      grade: grade,
      title: title,
      feedback: feedback,
      breakdown: {
        transport: Math.round(transportEmissions),
        energy: Math.round(energyEmissions),
        food: Math.round(foodEmissions),
        shopping: Math.round(shoppingEmissions)
      },
      shares: {
        transport: monthlyTotal > 0 ? Math.round((transportEmissions / monthlyTotal) * 100) : 25,
        energy: monthlyTotal > 0 ? Math.round((energyEmissions / monthlyTotal) * 100) : 25,
        food: monthlyTotal > 0 ? Math.round((foodEmissions / monthlyTotal) * 100) : 25,
        shopping: monthlyTotal > 0 ? Math.round((shoppingEmissions / monthlyTotal) * 100) : 25
      }
    };
  },

  /**
   * Calculate sustainability score from yearly CO2 emissions
   * @param {number} yearlyTotal Yearly CO2 emissions in kg
   * @returns {number} Score from 0-100
   */
  calculateScore: function(yearlyTotal) {
    if (yearlyTotal <= 2000) return 100;
    if (yearlyTotal >= 18000) return 5;
    return 100 - Math.round(((yearlyTotal - 2000) / 16000) * 95);
  },

  /**
   * Calculate grade and title from score
   * @param {number} score Sustainability score (0-100)
   * @returns {Object} Object with grade, title, and feedback
   */
  getGradeInfo: function(score) {
    if (score >= 90) {
      return {
        grade: 'A+',
        title: 'Planet Guardian',
        feedback: 'Outstanding! Your footprint is well within the sustainable threshold for global temperatures. You are leading the charge for a cleaner planet!'
      };
    } else if (score >= 80) {
      return {
        grade: 'A',
        title: 'Green Hero',
        feedback: 'Excellent job! You are living very consciously. With just a few minor tweaks, you can become a gold-standard Planet Guardian.'
      };
    } else if (score >= 70) {
      return {
        grade: 'B',
        title: 'Eco Explorer',
        feedback: 'Good work! You are making active efforts to stay green. Try to reduce single-occupancy driving and increase plant-based meals to boost your score.'
      };
    } else if (score >= 50) {
      return {
        grade: 'C',
        title: 'Habit Changer',
        feedback: 'Moderate footprint. Your habits show some effort, but high electricity consumption or travel habits are weighing down your score. Try our Carbon Twin tool to simulate easy reductions!'
      };
    } else if (score >= 30) {
      return {
        grade: 'D',
        title: 'Carbon Heavyweight',
        feedback: 'High footprint. Your lifestyle exceeds sustainable limits significantly. Swapping fast fashion purchases and cycling short distances can make a massive impact.'
      };
    } else {
      return {
        grade: 'F',
        title: 'Climate Sinner',
        feedback: 'Critical footprint! Your emissions are extremely high, representing severe planetary strain. Unplug standby items, reduce electricity draw, and try meat-free days immediately.'
      };
    }
  }
};

// Export for testing in Node.js environment if module.exports is available
if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.EcoQuestCalculator;
}
