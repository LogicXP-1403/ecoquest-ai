# EcoQuest AI - System Architecture

## Overview

EcoQuest AI is a gamified sustainability platform that helps users track their carbon footprint, receive personalized AI coaching, participate in challenges, and compete on a community leaderboard. The application is built as a Single Page Application (SPA) with vanilla JavaScript, Vite for build optimization, and comprehensive testing coverage with Vitest.

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface Layer                      │
│  (HTML/CSS - Landing, Dashboard, Calculator, Coach, etc.)  │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│              Application Controller (app.js)                │
│  - SPA Navigation Router                                   │
│  - Event Handlers                                          │
│  - State Management                                        │
│  - User Authentication Modal                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│           Business Logic Layer                             │
│  ┌────────────────────┐  ┌──────────────────────────┐     │
│  │ Calculator         │  │ Chart.js Integration    │     │
│  │ (calculator.js)    │  │ (Breakdown Visualization)│     │
│  │ - CO2 Calculations │  └──────────────────────────┘     │
│  │ - Score Grading    │                                   │
│  │ - Validation       │  ┌──────────────────────────┐     │
│  └────────────────────┘  │ Canvas Confetti          │     │
│                          │ (Celebration Effects)    │     │
│  ┌────────────────────┐  └──────────────────────────┘     │
│  │ Game Systems       │                                   │
│  │ - XP & Leveling    │  ┌──────────────────────────┐     │
│  │ - Missions         │  │ Local Storage Manager   │     │
│  │ - Badges           │  │ (State Persistence)    │     │
│  │ - Challenges       │  └──────────────────────────┘     │
│  │ - Leaderboard      │                                   │
│  └────────────────────┘                                   │
└──────────────────────────────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│           Static Data Layer (data.js)                       │
│  - Badges Definition                                        │
│  - Quiz Questions & Answers                                │
│  - Knowledge Center Content                                │
│  - Default Missions                                        │
│  - Challenges Templates                                   │
│  - Mock Leaderboard Data                                  │
└──────────────────────────────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│              Persistent Storage Layer                        │
│  - Browser LocalStorage (User State)                        │
│  - Theme Preference                                         │
│  - Progress & Achievements                                 │
└──────────────────────────────────────────────────────────────┘
```

## Core Modules

### 1. Calculator Module (`js/calculator.js`)

**Purpose**: Calculates carbon footprint based on user inputs.

**Key Functions**:
- `calculate(inputs)` - Main calculation engine
  - Validates user inputs
  - Calculates emissions by category (transport, energy, food, shopping)
  - Generates sustainability score (0-100)
  - Assigns climate grade (A+ to F)
  - Returns detailed breakdown and recommendations

- `calculateScore(yearlyTotal)` - Converts yearly emissions to score
  - Linear scaling from 2,000 kg (score 100) to 18,000 kg (score 5)

- `getGradeInfo(score)` - Maps score to grade, title, and feedback

**Calculation Factors**:
```
Transport: 0.185 kg CO2/km (petrol) to 0.045 kg CO2/km (electric)
Energy: 0.410 kg CO2/kWh (electricity), 0.450 kg CO2/hour (AC)
Food: 0.75 kg CO2/meal (vegetarian), 2.45 kg CO2/meal (non-vegetarian)
Shopping: 12.5 kg CO2/item, 45-120 kg CO2/month (fast fashion)
```

**Input Validation**:
- Clamps numeric values to safe ranges (0-1000 km, 0-24 hours, 0-21 meals)
- Validates categorical inputs (fuel type, efficiency, packaged food level)
- Enforces meal sum constraint (≤21 per week)

### 2. Application Controller (`js/app.js`)

**Purpose**: Orchestrates the entire application lifecycle and user interactions.

**Key Systems**:

#### State Management
- Centralized user state object with properties for XP, badges, completed missions, streaks
- LocalStorage persistence with error handling
- Atomic state updates with UI synchronization

#### Navigation Router
- Single-page application routing for 8 pages
- Navigation guards for authenticated-only pages
- Dynamic page title updates

#### Game Systems
- **XP & Leveling**: 100 XP per level, automatic level-up celebrations
- **Daily Missions**: Mission completion tracking, XP/CO2 rewards
- **Habits**: Habit tracking for daily eco-conscious behaviors
- **Challenges**: Multi-day challenges with progress tracking
- **Leaderboard**: Real-time ranking based on XP

#### UI Components
- Modal management (authentication, profile setup)
- Toast notifications (success, warnings, achievements)
- Chat interface for AI Coach
- Interactive sliders for Carbon Twin simulator
- Chart.js visualization for emissions breakdown

### 3. Static Data Layer (`js/data.js`)

**Badges** (5 total):
1. Eco Beginner - Complete questionnaire
2. Green Explorer - Complete 3 missions
3. Planet Protector - Score ≥80
4. Climate Champion - Join challenge
5. Carbon Ninja - Rank 1

**Quiz** (7 questions) covering:
- Transport emissions
- Phantom energy
- Diet impact
- Waste decomposition
- Fast fashion
- LED efficiency
- Carbon offsetting

**Knowledge Center** (4 topics):
- Carbon footprint basics
- Phantom loads impact
- Dietary changes
- Circular economy

**Missions** (5 daily):
- Meat-Free Day (40 XP, 15 kg CO2)
- Power-Down Hour (20 XP, 5 kg CO2)
- Eco Transit (50 XP, 20 kg CO2)
- Reusable Comrade (15 XP, 4 kg CO2)
- Standby Slayer (25 XP, 8 kg CO2)

**Challenges** (3 available):
- 7-Day Zero Waste (250 XP, 45 kg CO2)
- 15-Day Active Commute (500 XP, 90 kg CO2)
- 30-Day Energy Diet (1000 XP, 180 kg CO2)

## Data Flow

### User Registration Flow
```
1. User clicks "Get Started"
2. Auth modal opens
3. User enters username & selects avatar
4. State saved to localStorage
5. UI updates with user profile
6. Navigation access granted
```

### Carbon Footprint Calculation Flow
```
1. User completes 4-step wizard form
2. Calculator validates all inputs
3. Calculates emissions by category
4. Generates score and grade
5. Stores in state
6. Awards 100 XP (if first time)
7. Checks badge unlock conditions
8. Updates leaderboard ranking
9. Displays results with recommendations
```

### Mission Completion Flow
```
1. User clicks mission checkbox
2. Toggle completion state
3. Add XP and CO2 saved
4. Check for streak update
5. Verify badge unlock
6. Update leaderboard
7. Trigger confetti animation
8. Show success toast
```

## Component Structure

### Pages (8 Total)

1. **Landing Page** - Hero section, features, testimonials, CTAs
2. **Dashboard** - Score gauge, mission list, active challenges, daily streak
3. **Calculator** - 4-step wizard for emissions input
4. **AI Coach** - Chat interface and weekly goals
5. **Carbon Twin** - Interactive sliders for "what-if" scenarios
6. **Climate Hub** - Quiz, knowledge center, habits, challenges
7. **Leaderboard** - Ranked user list, achievement badges
8. **Weekly Report** - PDF-ready sustainability report

### Modal Dialogs

- **Auth Modal** - Username, avatar selection, profile save
- **Toast Container** - Notification popups (success, XP, badges, info)

## Testing Strategy

### Test Coverage Targets

- **Calculator Tests** (30+ tests)
  - Score calculation accuracy
  - Grade assignment logic
  - Input validation
  - Factor correctness
  - Category breakdowns

- **Missions Tests** (25+ tests)
  - Mission structure validation
  - XP and CO2 accumulation
  - Leveling formulas
  - Difficulty correlation
  - Mission filtering

- **Achievements Tests** (25+ tests)
  - Badge unlock conditions
  - Badge tracking logic
  - Progression paths
  - Multi-badge scenarios

- **Carbon Twin Tests** (25+ tests)
  - Emission reduction calculations
  - Financial savings estimates
  - Tree equivalents
  - Combined scenario modeling

- **Coach Tests** (25+ tests)
  - Emission analysis
  - Tip generation
  - Weekly goals
  - Query parsing
  - Goal tracking

- **Dashboard Tests** (25+ tests)
  - User state initialization
  - Level calculations
  - Rank tiers
  - CO2 accumulation
  - Streak logic
  - Metrics display

### Test Execution

```bash
# Run all tests
npm test

# Run with UI dashboard
npm run test:ui

# Generate coverage report
npm run test:coverage
```

## Security Considerations

### Input Validation
- All numeric inputs are sanitized and clamped to safe ranges
- Categorical inputs validated against allowed values
- Meal sum constraint prevents invalid states

### Data Protection
- No sensitive data stored in localStorage
- State validated on load (schema upgrade logic)
- XSS prevention through innerHTML sanitization

### Error Handling
- Try-catch blocks on localStorage operations
- Graceful fallback to defaults on parse errors
- Console error logging for debugging

## Performance Optimizations

1. **Chart Memoization** - Dashboard chart destroyed/recreated on theme change only
2. **Event Delegation** - Mission/challenge buttons use single listener
3. **Lazy Rendering** - Tab content renders on navigation only
4. **Typed Inputs** - HTML5 number inputs with min/max constraints
5. **Debounced Updates** - State saves batched during operations

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ JavaScript features
- LocalStorage support required
- CSS Grid and Flexbox support

## Future Enhancement Opportunities

1. **Backend Integration**
   - Replace mock leaderboard with real-time sync
   - Store user data in database
   - Implement actual AI Coach with LLM

2. **Mobile Optimization**
   - Responsive design improvements
   - Touch-friendly interface refinements

3. **Social Features**
   - Friend system
   - Social sharing of achievements
   - Team challenges

4. **Analytics**
   - User engagement metrics
   - Carbon impact statistics
   - Trend analysis

5. **Gamification Expansion**
   - Daily login bonuses
   - Seasonal events
   - Quest systems
