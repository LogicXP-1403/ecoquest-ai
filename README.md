<div align="center">

<img src="https://img.shields.io/badge/🌱-EcoQuest%20AI-10b981?style=for-the-badge&labelColor=0f172a" alt="EcoQuest AI" height="40"/>

# EcoQuest AI

### 🌍 Gamified Sustainability & Carbon Footprint Tracking Platform

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Visit_App-10b981?style=for-the-badge&labelColor=0f172a)](https://ecoquest-ai.netlify.app)
[![Made with Vite](https://img.shields.io/badge/Built_with-Vite-646cff?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![JavaScript](https://img.shields.io/badge/Vanilla-JavaScript-f7df1e?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](LICENSE)

> **Turn sustainability into an adventure.** Track your carbon footprint, get AI-personalized coaching, complete daily eco-missions, and compete on the global leaderboard — all in one sleek, gamified platform.

</div>

---

## ✨ Features at a Glance

<table>
<tr>
<td width="50%">

### 🧮 Carbon Footprint Calculator
A beautiful **4-step wizard** that collects your transport habits, energy usage, diet, and shopping patterns to calculate your personal CO₂ emissions and generate a Sustainability Score.

</td>
<td width="50%">

### 🤖 AI Carbon Coach
An intelligent chat coach that **analyzes your highest emission category** and delivers personalized, actionable tips. Ask it anything — from AC usage to diet swaps!

</td>
</tr>
<tr>
<td width="50%">

### 📊 Personal Dashboard
A real-time overview with a **circular gauge score**, emission breakdown bar chart (Chart.js), daily streaks, CO₂ saved counter, and trees-equivalent tracker.

</td>
<td width="50%">

### 🌀 Carbon Twin Simulator
Drag interactive sliders to simulate lifestyle changes — reducing commute, cutting AC hours, switching to LEDs, swapping meat meals — and see your **projected annual savings** in real time.

</td>
</tr>
<tr>
<td width="50%">

### 🌿 Climate Knowledge Hub
Test your climate IQ with a **quiz that tracks your progress** (`Question X of Y`), browse habit checklists, and enroll in multi-day eco challenges with daily progress logging.

</td>
<td width="50%">

### 🏆 Community Leaderboard
Compete with the global eco-community. Your **XP, rank, and mission count** update dynamically. Unlock badges like *Planet Protector*, *Climate Champion*, and *Carbon Ninja*.

</td>
</tr>
<tr>
<td width="50%">

### 📋 Weekly Climate Report
Auto-generated AI lifestyle analysis with a **printable PDF report** — showing your weekly score, CO₂ saved, streak, and a personalised action checklist.

</td>
<td width="50%">

### 🎮 Full Gamification Engine
- ⚡ XP points & level-up system
- 🔥 Daily streak tracker
- 🎖️ 5 unlockable achievement badges
- 🎉 Confetti celebrations on milestones
- 🔔 Smart toast notifications

</td>
</tr>
</table>

---

## 🖼️ Screenshots

| Home Page | Dashboard | Calculator |
|-----------|-----------|------------|
| ![Home](https://placehold.co/380x220/0f172a/10b981?text=🏠+Home+Page) | ![Dashboard](https://placehold.co/380x220/0f172a/14b8a6?text=📊+Dashboard) | ![Calculator](https://placehold.co/380x220/0f172a/22c55e?text=🧮+Calculator) |

| AI Coach | Carbon Twin | Leaderboard |
|----------|-------------|-------------|
| ![Coach](https://placehold.co/380x220/0f172a/10b981?text=🤖+AI+Coach) | ![Twin](https://placehold.co/380x220/0f172a/14b8a6?text=🌀+Twin+Sim) | ![Leaderboard](https://placehold.co/380x220/0f172a/22c55e?text=🏆+Leaderboard) |

---

## 🗂️ Project Structure

```
ecoquest-ai/
│
├── index.html              # Main HTML shell — 8 SPA tab sections
├── style.css               # Full design system (dark theme, glassmorphism, animations)
├── package.json            # Vite configuration
│
└── js/
    ├── app.js              # 🧠 Main SPA controller
    │                       #   • State management (localStorage)
    │                       #   • SPA navigation router + Navigation Guard
    │                       #   • Gamification engine (XP, levels, badges)
    │                       #   • AI Coach chat + personalized advice
    │                       #   • Carbon Twin simulator logic
    │                       #   • Daily missions & challenge tracker
    │                       #   • Weekly report generator
    │
    ├── calculator.js       # 📐 Emission calculation engine
    │                       #   • Transport, energy, food, shopping factors
    │                       #   • Score, grade, and category breakdown
    │
    └── data.js             # 📦 Static data store
                            #   • Missions, challenges, badges
                            #   • Quiz questions & knowledge centre
                            #   • Mock community leaderboard
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- npm

### Installation & Dev Server

```bash
# 1. Clone the repository
git clone https://github.com/LogicXP-1403/ecoquest-ai.git
cd ecoquest-ai

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Then open **http://localhost:5173/** in your browser. 🌱

### Production Build

```bash
npm run build
# Output → dist/ folder (ready to deploy)
```

---

## 🌐 Deployment

EcoQuest AI is a **100% static SPA** with no backend required. Deploy the `dist/` folder to any static host:

### ▶ Netlify (Recommended — One Click)
1. Run `npm run build`
2. Drag the `dist/` folder to **[netlify.com/drop](https://app.netlify.com/drop)**

### ▶ Vercel
```bash
npx vercel --prod
# Set: Build Command = npm run build, Output Dir = dist
```

### ▶ GitHub Pages
```bash
npm run build
npx gh-pages -d dist
```

### ▶ Firebase Hosting
```bash
npm run build
firebase init hosting   # public dir → dist
firebase deploy
```

---

## 🧠 How It Works

### State Management
All user data is stored in **`localStorage`** under the key `ecoquest_user_state`. The state is loaded on boot and saved after every interaction — no server, no database required.

```js
// Reset all data (useful for testing)
// Open browser console and run:
resetEcoQuestState()
```

### Navigation Guard
Protected tabs (Dashboard, AI Coach, etc.) are locked until the user sets up a profile. Attempting to navigate without a profile shows a toast and opens the profile modal.

### Emission Calculation
The calculator uses **real-world emission factors**:
- 🚗 Petrol car: `0.18 kg CO₂ / km`
- ⚡ Electricity: `0.45 kg CO₂ / kWh`
- 🥩 Non-veg meal: `3.3 kg CO₂ / meal`
- 🥦 Vegetarian meal: `1.6 kg CO₂ / meal`
- ❄️ AC (1.1kW unit): `0.45 kg CO₂ / hour`

The **Sustainability Score (0–100)** is inverse-scaled from annual CO₂ output, with letter grades A+ through F.

---

## 🎖️ Badge System

| Badge | Requirement |
|-------|-------------|
| 🌱 Eco Beginner | Complete the carbon calculator |
| 🧭 Green Explorer | Complete 3+ daily missions |
| 🌍 Planet Protector | Achieve a score of 80+ |
| 🏆 Climate Champion | Enroll in any eco challenge |
| 🥷 Carbon Ninja | Reach Rank #1 on the leaderboard |

---

## 🛠️ Tech Stack

| Technology | Role |
|------------|------|
| **HTML5** | Semantic SPA structure |
| **CSS3** | Design system, glassmorphism, animations |
| **Vanilla JavaScript** | SPA routing, state, all game logic |
| **Vite** | Dev server & production bundler |
| **Chart.js** | Emission breakdown bar chart |
| **Canvas Confetti** | Celebration animations |
| **localStorage** | Client-side state persistence |

---

## 🤝 Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Made with 💚 for a greener planet

**[⭐ Star this repo](https://github.com/LogicXP-1403/ecoquest-ai)** if you found it helpful!

[![GitHub stars](https://img.shields.io/github/stars/LogicXP-1403/ecoquest-ai?style=social)](https://github.com/LogicXP-1403/ecoquest-ai/stargazers)

</div>
