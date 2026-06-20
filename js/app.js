// EcoQuest AI - Main Application Controller
// Handles SPA navigation, user state, database sync, interactive charts, and page events

(function() {
  // -------------------------------------------------
  // 1. STATE INITIALIZATION & LOCAL STORAGE BINDINGS
  // -------------------------------------------------
  
  const DEFAULT_STATE = {
    username: "",
    avatar: "🛡️",
    xp: 0,
    level: 1,
    streak: 0,
    lastActiveDate: "",
    co2Saved: 0.0, // cumulative kg CO2 saved from completed items
    completedMissions: [], // IDs of completed missions today
    completedHabits: [], // IDs of checked habits today
    unlockedBadges: [], // badge ID strings
    activeChallenges: {}, // challengeID -> { progressCurrent, enrolled: bool }
    calculatorAnswers: null, // user answers
    calculatedEmissions: null, // calculation results
    quizQuestionIndex: 0,
    chatHistory: [],
    weeklyReport: null
  };

  let state = {};
  let breakdownChart = null;

  // Load state from local storage or set default
  function loadState() {
    try {
      const stored = localStorage.getItem("ecoquest_user_state");
      if (stored) {
        state = JSON.parse(stored);
        // Sync structures in case of upgrades
        state = Object.assign({}, DEFAULT_STATE, state);
      } else {
        state = Object.assign({}, DEFAULT_STATE);
      }
    } catch (e) {
      console.error("Failed to load local storage state:", e);
      state = Object.assign({}, DEFAULT_STATE);
    }
  }

  // Save current state to local storage
  function saveState() {
    try {
      localStorage.setItem("ecoquest_user_state", JSON.stringify(state));
    } catch (e) {
      console.error("Failed to save local storage state:", e);
    }
  }

  // Reset State (for debugging or starting clean)
  window.resetEcoQuestState = function() {
    state = Object.assign({}, DEFAULT_STATE);
    saveState();
    location.reload();
  };

  // -------------------------------------------------
  // 2. HELPER UTILS (TOASTS, CONFETTI)
  // -------------------------------------------------

  function showToast(message, type = "success") {
    const box = document.getElementById("toast-alerts-box");
    if (!box) return;

    const toast = document.createElement("div");
    toast.className = "toast-message";
    
    // Choose icon based on type
    let icon = "🔔";
    if (type === "success") icon = "✅";
    if (type === "xp") icon = "⚡";
    if (type === "badge") icon = "🎖️";
    if (type === "info") icon = "💡";

    toast.innerHTML = `<span style="font-size: 18px;">${icon}</span> <span>${message}</span>`;
    box.appendChild(toast);

    // Fade out and remove after 3.5 seconds
    setTimeout(() => {
      toast.style.transition = "all 0.5s ease";
      toast.style.opacity = "0";
      toast.style.transform = "translateY(-10px)";
      setTimeout(() => {
        toast.remove();
      }, 500);
    }, 3500);
  }

  function triggerConfetti(multiplier = 1) {
    if (typeof confetti === "function") {
      confetti({
        particleCount: 50 * multiplier,
        spread: 60 * multiplier,
        origin: { y: 0.75 },
        colors: ['#10b981', '#14b8a6', '#34d399', '#22c55e']
      });
    }
  }

  // Helper to get formatted date string
  function getTodayDateString() {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  // -------------------------------------------------
  // 3. XP & LEVELING SYSTEM
  // -------------------------------------------------

  function addXP(amount) {
    if (amount <= 0) return;
    
    state.xp += amount;
    showToast(`Earned +${amount} XP!`, "xp");

    // Level formula: 100 XP per level
    const newLevel = Math.floor(state.xp / 100) + 1;
    if (newLevel > state.level) {
      state.level = newLevel;
      triggerConfetti(2);
      showToast(`LEVEL UP! You are now Eco Level ${state.level}! 🎉`, "success");
    }

    saveState();
    updateGlobalUI();
    updateLeaderboard();
    checkBadgesUnlock();
  }

  // -------------------------------------------------
  // 4. COMMUNITY LEADERBOARD SYNC
  // -------------------------------------------------

  function updateLeaderboard() {
    const box = document.getElementById("leaderboard-rankings-box");
    if (!box) return;

    // Get default leaderboard copy
    let list = JSON.parse(JSON.stringify(window.EcoQuestData.mockLeaderboard));

    // Find and update user stats in mock board
    let userEntry = list.find(item => item.isUser);
    if (userEntry) {
      userEntry.xp = state.xp;
      userEntry.name = state.username || "User (You)";
      userEntry.avatar = state.avatar || "🛡️";
      // Count completed missions in state
      userEntry.missions = state.completedMissions ? state.completedMissions.length : 0;
    }

    // Sort list by XP descending
    list.sort((a, b) => b.xp - a.xp);

    // Find user current rank index
    const userIndex = list.findIndex(item => item.isUser);
    const userRank = userIndex + 1;

    // Update state rank counter
    state.currentRank = userRank;
    
    // Inject items into HTML
    box.innerHTML = "";
    list.forEach((item, index) => {
      const isUserCls = item.isUser ? "user-highlight" : "";
      const rank = index + 1;
      
      const el = document.createElement("div");
      el.className = `leaderboard-item ${isUserCls}`;
      el.innerHTML = `
        <div class="leader-rank-col">${rank}</div>
        <div class="leader-info-col">
          <div class="leader-avatar">${item.avatar}</div>
          <div>
            <div class="leader-name">${item.name}</div>
            <div class="leader-meta">${item.missions} missions completed</div>
          </div>
        </div>
        <div class="leader-xp-col">
          <div class="leader-xp-value">${item.xp}</div>
          <div class="leader-xp-label">XP</div>
        </div>
      `;
      box.appendChild(el);
    });

    // Update rank overview card on dashboard
    const rankValEl = document.getElementById("dashboard-rank-val");
    if (rankValEl) {
      if (userRank === 1) rankValEl.innerText = "1st (Leader)";
      else if (userRank === 2) rankValEl.innerText = "2nd (Expert)";
      else if (userRank === 3) rankValEl.innerText = "3rd (Advocate)";
      else rankValEl.innerText = `${userRank}th Place`;
    }
  }

  // -------------------------------------------------
  // 5. CORE WIDGETS RENDERING
  // -------------------------------------------------

  function updateGlobalUI() {
    // 1. Set username/avatar inside Header/Sidebar
    const userHeaderBtn = document.getElementById("auth-header-btn");
    const headerStats = document.getElementById("header-quick-stats-widget");
    const sidebarUserCard = document.getElementById("sidebar-user-card");

    if (state.username) {
      // User is authenticated
      if (userHeaderBtn) {
        userHeaderBtn.innerText = `${state.avatar} ${state.username}`;
        userHeaderBtn.className = "btn btn-secondary btn-sm";
      }
      if (headerStats) headerStats.style.display = "flex";
      if (sidebarUserCard) sidebarUserCard.style.display = "flex";
      
      // Update sidebar profile card
      document.getElementById("sidebar-user-avatar").innerText = state.avatar;
      document.getElementById("sidebar-user-name").innerText = state.username;
      document.getElementById("sidebar-user-level").innerText = `Eco Level ${state.level}`;

      // Update XP Ratio
      const nextLevelXP = state.level * 100;
      const currentLevelStartXP = (state.level - 1) * 100;
      const levelProgressXP = state.xp - currentLevelStartXP;
      document.getElementById("sidebar-user-xp-ratio").innerText = `${levelProgressXP}/100 XP`;
      document.getElementById("sidebar-user-xp-bar").style.width = `${levelProgressXP}%`;

      // Update Header numeric stats
      document.getElementById("header-streak-val").innerText = state.streak;
      document.getElementById("header-xp-val").innerText = state.xp;
    } else {
      // Unauthenticated state
      if (userHeaderBtn) {
        userHeaderBtn.innerText = "Get Started";
        userHeaderBtn.className = "btn btn-primary btn-sm";
      }
      if (headerStats) headerStats.style.display = "none";
      if (sidebarUserCard) sidebarUserCard.style.display = "none";
    }

    // 2. Update Dashboard Overview Counters
    const co2SavedEl = document.getElementById("dashboard-co2-saved-val");
    const treesSavedEl = document.getElementById("dashboard-trees-saved-val");
    const streakLargeEl = document.getElementById("dashboard-streak-count-large");

    if (co2SavedEl) co2SavedEl.innerText = `${state.co2Saved.toFixed(1)} kg`;
    if (treesSavedEl) {
      // 1 mature tree absorbs approx 22kg CO2 annually.
      const treesCount = state.co2Saved / 22;
      treesSavedEl.innerText = treesCount.toFixed(2);
    }
    if (streakLargeEl) streakLargeEl.innerText = `${state.streak} Days`;

    // 3. Update Dashboard Carbon Score circular gauge
    const scoreValEl = document.getElementById("dashboard-score-val");
    const scoreTitleEl = document.getElementById("dashboard-score-title");
    const scoreFeedbackEl = document.getElementById("dashboard-score-feedback");
    const gradeBadgeEl = document.getElementById("dashboard-grade-badge");
    const gaugeFillEl = document.getElementById("dashboard-gauge-fill");

    if (state.calculatedEmissions) {
      const e = state.calculatedEmissions;
      if (scoreValEl) scoreValEl.innerText = e.score;
      if (scoreTitleEl) scoreTitleEl.innerText = e.title;
      if (scoreFeedbackEl) scoreFeedbackEl.innerText = e.feedback;
      if (gradeBadgeEl) {
        gradeBadgeEl.innerText = `Grade ${e.grade}`;
        gradeBadgeEl.style.display = "inline-flex";
      }
      
      if (gaugeFillEl) {
        // Gauge perimeter is 2 * PI * r = 2 * 3.1415 * 70 = ~440. Correct dashoffset math:
        const strokeDashOffset = 440 - (440 * e.score) / 100;
        gaugeFillEl.style.strokeDashoffset = strokeDashOffset;
      }
    } else {
      if (scoreValEl) scoreValEl.innerText = "--";
      if (scoreTitleEl) scoreTitleEl.innerText = "Uncalculated Footprint";
      if (scoreFeedbackEl) scoreFeedbackEl.innerText = "Welcome! Fill out the calculator wizard under the Calculator tab to assess your score.";
      if (gradeBadgeEl) gradeBadgeEl.style.display = "none";
      if (gaugeFillEl) gaugeFillEl.style.strokeDashoffset = 440;
    }
  }

  // -------------------------------------------------
  // 6. DAILY ECO-MISSIONS SYSTEM
  // -------------------------------------------------

  function renderDailyMissions() {
    const list = document.getElementById("dashboard-missions-list");
    if (!list) return;

    list.innerHTML = "";

    window.EcoQuestData.defaultMissions.forEach(m => {
      const isCompleted = state.completedMissions.includes(m.id);
      const activeCls = isCompleted ? "checked" : "";
      
      const item = document.createElement("div");
      item.className = "checklist-item";
      item.innerHTML = `
        <div class="checklist-left">
          <div class="checklist-checkbox-custom ${activeCls}" data-mission-id="${m.id}" role="checkbox" aria-checked="${isCompleted}">
            <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div class="checklist-content">
            <span class="checklist-title">${m.title}</span>
            <span class="checklist-desc">${m.desc} (${m.difficulty})</span>
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <span class="checklist-badge xp-val">+${m.xp} XP</span>
          <span class="checklist-badge">-${m.impact}kg CO2</span>
        </div>
      `;
      list.appendChild(item);
    });

    // Add click listeners to checkboxes
    list.querySelectorAll(".checklist-checkbox-custom").forEach(box => {
      box.addEventListener("click", function() {
        const mId = this.getAttribute("data-mission-id");
        toggleMissionCompletion(mId, this);
      });
    });
  }

  function toggleMissionCompletion(missionId, checkboxEl) {
    if (!state.username) {
      showToast("Please save your profile avatar first!", "info");
      openAuthModal();
      return;
    }

    const mission = window.EcoQuestData.defaultMissions.find(m => m.id === missionId);
    if (!mission) return;

    const isCompleted = state.completedMissions.includes(missionId);

    if (isCompleted) {
      // Undo completion
      state.completedMissions = state.completedMissions.filter(id => id !== missionId);
      state.co2Saved = Math.max(0, state.co2Saved - mission.impact);
      // Deduct XP (don't level down below 1, but subtract XP value)
      state.xp = Math.max(0, state.xp - mission.xp);
      checkboxEl.classList.remove("checked");
      checkboxEl.setAttribute("aria-checked", "false");
      showToast(`Removed completion for: ${mission.title}`, "info");
    } else {
      // Mark complete
      state.completedMissions.push(missionId);
      state.co2Saved += mission.impact;
      checkboxEl.classList.add("checked");
      checkboxEl.setAttribute("aria-checked", "true");
      triggerConfetti();
      addXP(mission.xp);
      showToast(`Completed Daily Mission: ${mission.title}! Saved ${mission.impact}kg CO2!`, "success");
      
      // Update streak daily multiplier check
      updateStreakProgress();
    }

    saveState();
    updateGlobalUI();
    renderDailyMissions();
    checkBadgesUnlock();
  }

  function updateStreakProgress() {
    const today = getTodayDateString();
    
    if (state.lastActiveDate === today) {
      return; // Already active today
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (state.lastActiveDate === yesterdayStr) {
      state.streak += 1;
      showToast(`Eco streak extended! ${state.streak} Days active! 🔥`, "success");
    } else {
      state.streak = 1;
      showToast("New active Eco Streak started! Keep going! 🔥", "success");
    }

    state.lastActiveDate = today;
    saveState();
  }

  // -------------------------------------------------
  // 7. HABIT CHECKLIST & CHALLENGES
  // -------------------------------------------------

  function initHabitTracker() {
    const habits = document.querySelectorAll("#hub-page .habit-checkbox");
    habits.forEach(box => {
      const habitId = box.getAttribute("data-habit-id");
      const isCompleted = state.completedHabits.includes(habitId);
      
      if (isCompleted) {
        box.classList.add("checked");
      }

      box.addEventListener("click", function() {
        toggleHabitCompletion(habitId, this);
      });
    });
  }

  function toggleHabitCompletion(habitId, checkboxEl) {
    if (!state.username) {
      showToast("Please save your profile avatar first!", "info");
      openAuthModal();
      return;
    }

    const isCompleted = state.completedHabits.includes(habitId);

    if (isCompleted) {
      state.completedHabits = state.completedHabits.filter(id => id !== habitId);
      state.xp = Math.max(0, state.xp - 5);
      checkboxEl.classList.remove("checked");
      showToast("Habit unchecked.", "info");
    } else {
      state.completedHabits.push(habitId);
      checkboxEl.classList.add("checked");
      triggerConfetti(0.5);
      addXP(5);
      showToast("Habit completed! Keep building clean routines! 💪", "success");
      updateStreakProgress();
    }

    saveState();
    updateGlobalUI();
  }

  function renderChallenges() {
    const deck = document.getElementById("challenges-container-deck");
    const dashActiveBox = document.getElementById("dashboard-active-challenges");
    if (!deck) return;

    deck.innerHTML = "";
    let activeHTML = "";

    window.EcoQuestData.challenges.forEach(c => {
      const userChal = state.activeChallenges[c.id] || { enrolled: false, progressCurrent: 0 };
      const isEnrolled = userChal.enrolled;
      const progressPercent = isEnrolled ? Math.round((userChal.progressCurrent / c.progressTotal) * 100) : 0;
      
      let buttonHTML = `<button class="btn btn-primary btn-sm enroll-challenge-btn" data-challenge-id="${c.id}">Enroll in Challenge</button>`;
      if (isEnrolled) {
        if (userChal.progressCurrent >= c.progressTotal) {
          buttonHTML = `<span style="font-weight: bold; color: var(--primary);">✓ Completed & XP Claimed</span>`;
        } else {
          buttonHTML = `
            <div style="display: flex; gap: 8px; width: 100%;">
              <button class="btn btn-accent btn-sm checkoff-challenge-btn" style="flex:1;" data-challenge-id="${c.id}">Log Day Progress</button>
              <button class="btn btn-secondary btn-sm leave-challenge-btn" data-challenge-id="${c.id}">Abandon</button>
            </div>
          `;
        }
      }

      const card = document.createElement("div");
      card.className = "challenge-card-item";
      card.innerHTML = `
        <div class="challenge-header-row">
          <h4 class="challenge-title-h4">${c.title}</h4>
          <span class="challenge-dur-tag">${c.duration}</span>
        </div>
        <p class="challenge-desc-p">${c.desc}</p>
        
        <div class="challenge-rewards-row">
          <span class="reward-xp-pill">⚡ +${c.xpReward} XP</span>
          <span class="reward-co2-pill">☁️ -${c.co2Reward}kg CO2 Reward</span>
        </div>

        ${isEnrolled ? `
        <div class="challenge-progress-group">
          <div class="challenge-progress-text-row">
            <span>Enrolled Progress</span>
            <span>Day ${userChal.progressCurrent} of ${c.progressTotal} (${progressPercent}%)</span>
          </div>
          <div class="challenge-progress-bar-outer">
            <div class="challenge-progress-bar-inner" style="width: ${progressPercent}%;"></div>
          </div>
        </div>
        ` : ''}

        <div style="margin-top: 8px; display: flex; justify-content: flex-end;">
          ${buttonHTML}
        </div>
      `;
      deck.appendChild(card);

      // Aggregate HTML for dashboard active widgets
      if (isEnrolled && userChal.progressCurrent < c.progressTotal) {
        activeHTML += `
          <div class="challenge-card-item" style="padding: 14px; background: rgba(255,255,255,0.01);">
            <div style="display: flex; justify-content: space-between; font-size:13px; font-weight:700;">
              <span>${c.title}</span>
              <span>Day ${userChal.progressCurrent}/${c.progressTotal}</span>
            </div>
            <div class="challenge-progress-bar-outer" style="height: 4px; margin-top: 8px;">
              <div class="challenge-progress-bar-inner" style="width: ${progressPercent}%;"></div>
            </div>
            <div style="margin-top: 10px; text-align: right;">
              <button class="btn btn-accent btn-sm checkoff-challenge-btn" style="padding: 4px 10px; font-size: 11px;" data-challenge-id="${c.id}">Log Day</button>
            </div>
          </div>
        `;
      }
    });

    if (dashActiveBox) {
      if (activeHTML) {
        dashActiveBox.innerHTML = activeHTML;
      } else {
        dashActiveBox.innerHTML = `
          <div style="font-size: 13px; color: var(--text-secondary); text-align: center; padding: 20px;">
            No challenges active. <br>
            <button class="btn btn-secondary btn-sm" style="margin-top: 10px;" id="dashboard-go-challenges-btn-active">Browse Challenges</button>
          </div>
        `;
        const goBtn = document.getElementById("dashboard-go-challenges-btn-active");
        if (goBtn) goBtn.addEventListener("click", () => navigateToTab("hub-page"));
      }
    }

    // Attach listeners
    document.querySelectorAll(".enroll-challenge-btn").forEach(btn => {
      btn.addEventListener("click", function() {
        enrollChallenge(this.getAttribute("data-challenge-id"));
      });
    });

    document.querySelectorAll(".checkoff-challenge-btn").forEach(btn => {
      btn.addEventListener("click", function() {
        advanceChallenge(this.getAttribute("data-challenge-id"));
      });
    });

    document.querySelectorAll(".leave-challenge-btn").forEach(btn => {
      btn.addEventListener("click", function() {
        leaveChallenge(this.getAttribute("data-challenge-id"));
      });
    });
  }

  function enrollChallenge(id) {
    if (!state.username) {
      showToast("Please save your profile avatar first!", "info");
      openAuthModal();
      return;
    }
    
    state.activeChallenges[id] = { enrolled: true, progressCurrent: 0 };
    saveState();
    renderChallenges();
    showToast("Successfully enrolled! Perform the daily tips to progress daily. 📅", "success");
    checkBadgesUnlock();
  }

  function advanceChallenge(id) {
    const c = window.EcoQuestData.challenges.find(ch => ch.id === id);
    const userChal = state.activeChallenges[id];
    if (!c || !userChal) return;

    userChal.progressCurrent += 1;
    updateStreakProgress();

    if (userChal.progressCurrent >= c.progressTotal) {
      // Completed Challenge!
      state.co2Saved += c.co2Reward;
      saveState();
      triggerConfetti(3);
      addXP(c.xpReward);
      showToast(`Congratulations! You completed the ${c.title}! Saved ${c.co2Reward}kg CO2! 🏆`, "success");
    } else {
      showToast(`Day logged! Keep up the consistency. Progress: ${userChal.progressCurrent}/${c.progressTotal} days.`, "success");
    }

    saveState();
    updateGlobalUI();
    renderChallenges();
    checkBadgesUnlock();
  }

  function leaveChallenge(id) {
    if (confirm("Are you sure you want to abandon this challenge? Progress will be lost.")) {
      delete state.activeChallenges[id];
      saveState();
      renderChallenges();
      showToast("Enrolled challenge abandoned.", "info");
    }
  }

  // -------------------------------------------------
  // 8. ACHIEVEMENT SYSTEM
  // -------------------------------------------------

  function renderBadges() {
    const box = document.getElementById("achievement-badges-box");
    if (!box) return;

    box.innerHTML = "";

    window.EcoQuestData.badges.forEach(b => {
      const isUnlocked = state.unlockedBadges.includes(b.id);
      const lockedCls = isUnlocked ? "unlocked" : "locked";
      const statusText = isUnlocked ? "Unlocked" : "Locked";

      const card = document.createElement("div");
      card.className = `badge-card ${lockedCls}`;
      card.innerHTML = `
        <div class="badge-icon-box bg-gradient-to-br ${b.color}">${b.icon}</div>
        <div class="badge-name">${b.name}</div>
        <div class="badge-status">${statusText}</div>
        <div class="badge-tooltip">
          <strong>${b.name}</strong><br>
          ${b.desc}<br><br>
          <span style="color:#34d399; font-size:10px;">Req: ${b.requirement}</span>
        </div>
      `;
      box.appendChild(card);
    });
  }

  function checkBadgesUnlock() {
    let unlockedAny = false;

    window.EcoQuestData.badges.forEach(b => {
      if (state.unlockedBadges.includes(b.id)) return; // Already unlocked

      let passes = false;

      if (b.id === 'eco-beginner') {
        // questionnaire completed
        passes = (state.calculatedEmissions !== null);
      }
      else if (b.id === 'green-explorer') {
        // completed 3 daily missions
        passes = (state.completedMissions && state.completedMissions.length >= 3);
      }
      else if (b.id === 'planet-protector') {
        // carbon score >= 80
        passes = (state.calculatedEmissions && state.calculatedEmissions.score >= 80);
      }
      else if (b.id === 'climate-champion') {
        // joined any challenge
        passes = (Object.keys(state.activeChallenges).length > 0);
      }
      else if (b.id === 'carbon-ninja') {
        // User is Rank 1
        passes = (state.currentRank === 1);
      }

      if (passes) {
        state.unlockedBadges.push(b.id);
        unlockedAny = true;
        triggerConfetti(2.5);
        showToast(`UNLOCKED BADGE: ${b.name}! ${b.icon} 🎖️`, "badge");
      }
    });

    if (unlockedAny) {
      saveState();
      renderBadges();
    }
  }

  // -------------------------------------------------
  // 9. SUSTAINABILITY QUIZ & KNOWLEDGE CENTRE
  // -------------------------------------------------

  function renderQuizQuestion() {
    const qText = document.getElementById("quiz-question-txt");
    const optionsBox = document.getElementById("quiz-options-box");
    const feedbackBox = document.getElementById("quiz-feedback-container");
    const nextBtn = document.getElementById("quiz-next-question-btn");
    
    if (!qText || !optionsBox) return;

    feedbackBox.style.display = "none";
    nextBtn.style.display = "none";
    
    const pool = window.EcoQuestData.quizQuestions;
    const qIndex = state.quizQuestionIndex % pool.length;
    const q = pool[qIndex];

    qText.innerHTML = `<span class="quiz-question-badge" style="display: inline-block; font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--accent); background: var(--accent-glow); padding: 4px 10px; border-radius: 12px; margin-bottom: 12px; border: 1px solid rgba(20, 184, 166, 0.15);">Question ${qIndex + 1} of ${pool.length}</span><br>${q.question}`;
    optionsBox.innerHTML = "";
    
    q.options.forEach((opt, idx) => {
      const btn = document.createElement("button");
      btn.className = "quiz-option-btn";
      btn.innerText = opt;
      btn.addEventListener("click", function() {
        evaluateQuizAnswer(idx, q.correctIndex, q.explanation, this);
      });
      optionsBox.appendChild(btn);
    });

    state.isQuizAnswered = false;
  }

  function evaluateQuizAnswer(selectedIdx, correctIdx, explanation, btnEl) {
    if (state.isQuizAnswered) return; // Prevent double answers
    
    state.isQuizAnswered = true;
    const options = document.querySelectorAll(".quiz-option-btn");
    
    // Highlight correct & wrong options
    options[correctIdx].classList.add("correct");
    if (selectedIdx !== correctIdx) {
      btnEl.classList.add("incorrect");
    }

    const titleTxt = document.getElementById("quiz-feedback-title-txt");
    const expTxt = document.getElementById("quiz-explanation-txt");
    const feedbackBox = document.getElementById("quiz-feedback-container");

    if (selectedIdx === correctIdx) {
      titleTxt.innerText = "Correct answer! 🎉";
      titleTxt.style.color = "#10b981";
      triggerConfetti(0.8);
      
      // Award XP
      addXP(25);
      updateStreakProgress();
    } else {
      titleTxt.innerText = "Incorrect answer ❌";
      titleTxt.style.color = "#ef4444";
    }

    expTxt.innerText = explanation;
    feedbackBox.style.display = "block";

    // Show Next Question button
    document.getElementById("quiz-next-question-btn").style.display = "inline-block";
    saveState();
  }

  function initKnowledgeBase() {
    const list = document.getElementById("knowledge-faq-list");
    if (!list) return;

    list.innerHTML = "";
    window.EcoQuestData.knowledgeCenter.forEach(item => {
      const el = document.createElement("div");
      el.className = "knowledge-item";
      el.innerHTML = `
        <div class="knowledge-header">
          <span>${item.title} (${item.category})</span>
          <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <div class="knowledge-body">
          <p><strong>Summary:</strong> ${item.summary}</p><br>
          <p>${item.content}</p>
        </div>
      `;

      el.querySelector(".knowledge-header").addEventListener("click", function() {
        el.classList.toggle("active");
      });

      list.appendChild(el);
    });
  }

  // -------------------------------------------------
  // 10. CARBON SCORE CALCULATOR FORM
  // -------------------------------------------------

  let currentWizardStep = 1;

  function initCalculatorWizard() {
    currentWizardStep = 1;
    showWizardStep(1);

    // Step cards click handler
    const cards = document.querySelectorAll("#car-type-selector .visual-select-card");
    cards.forEach(card => {
      card.addEventListener("click", function() {
        cards.forEach(c => c.classList.remove("selected"));
        this.classList.add("selected");
      });
    });

    const nextBtn = document.getElementById("wizard-next-btn");
    const prevBtn = document.getElementById("wizard-prev-btn");

    if (nextBtn) {
      nextBtn.onclick = function() {
        if (currentWizardStep < 4) {
          currentWizardStep += 1;
          showWizardStep(currentWizardStep);
        } else {
          submitCalculatorForm();
        }
      };
    }

    if (prevBtn) {
      prevBtn.onclick = function() {
        if (currentWizardStep > 1) {
          currentWizardStep -= 1;
          showWizardStep(currentWizardStep);
        }
      };
    }

    // Results buttons
    const recalcBtn = document.getElementById("results-recalculate-btn");
    if (recalcBtn) {
      recalcBtn.onclick = function() {
        document.getElementById("calculator-card-results").style.display = "none";
        document.getElementById("calculator-card-wizard").style.display = "block";
        currentWizardStep = 1;
        showWizardStep(1);
      };
    }
  }

  function showWizardStep(step) {
    // Hide all steps
    document.querySelectorAll(".form-step").forEach(el => el.classList.remove("active"));
    document.querySelectorAll(".wizard-step-indicator").forEach(el => {
      el.classList.remove("active");
      el.classList.remove("completed");
    });

    // Show selected step
    document.getElementById(`form-step-${step}`).classList.add("active");
    
    // Manage indicators state
    for (let i = 1; i <= 4; i++) {
      const ind = document.getElementById(`wizard-indicator-${i}`);
      if (i < step) ind.classList.add("completed");
      if (i === step) ind.classList.add("active");
    }

    // Buttons labels & visibility
    const prevBtn = document.getElementById("wizard-prev-btn");
    const nextBtn = document.getElementById("wizard-next-btn");
    
    if (prevBtn) {
      prevBtn.style.visibility = step === 1 ? "hidden" : "visible";
    }

    if (nextBtn) {
      nextBtn.innerText = step === 4 ? "Submit Footprint" : "Next Step";
    }
  }

  function submitCalculatorForm() {
    // Collect Inputs
    const carUsage = parseFloat(document.getElementById("input-car-usage").value) || 0;
    
    const selectedCarCard = document.querySelector("#car-type-selector .visual-select-card.selected");
    const carType = selectedCarCard ? selectedCarCard.getAttribute("data-value") : "petrol";
    
    const transitUsage = parseFloat(document.getElementById("input-transit-usage").value) || 0;
    const activeTransit = parseFloat(document.getElementById("input-active-transit").value) || 0;
    
    const electricity = parseFloat(document.getElementById("input-electricity").value) || 0;
    const acUsage = parseFloat(document.getElementById("input-ac-usage").value) || 0;
    const applianceRating = document.getElementById("input-efficiency").value;
    
    const vegMeals = parseInt(document.getElementById("input-veg-meals").value) || 0;
    const nonVegMeals = parseInt(document.getElementById("input-nonveg-meals").value) || 0;
    const packagedFood = document.getElementById("input-packaged").value;
    
    const purchases = parseInt(document.getElementById("input-purchases").value) || 0;
    const fastFashion = document.getElementById("input-fashion").value;

    // Validate meal sums (must not exceed 21 standard meals)
    if (vegMeals + nonVegMeals > 21) {
      showToast("Total meals per week cannot exceed 21 standard meals (3/day)!", "info");
      return;
    }

    const answers = {
      carUsage, carType, publicTransport: transitUsage, bikeUsage: activeTransit,
      electricityUsage: electricity, acUsage, applianceEfficiency: applianceRating,
      vegetarianMeals: vegMeals, nonVegetarianMeals: nonVegMeals, packagedFood,
      monthlyPurchases: purchases, fastFashion
    };

    // Calculate emissions
    const results = window.EcoQuestCalculator.calculate(answers);

    // Save to State
    state.calculatorAnswers = answers;
    state.calculatedEmissions = results;
    
    // Add first calculation bonus XP
    if (!state.unlockedBadges.includes("eco-beginner")) {
      addXP(100);
    }
    
    saveState();
    triggerConfetti(3);
    showToast("Carbon footprint calculated successfully! Score updated.", "success");
    checkBadgesUnlock();
    updateGlobalUI();
    updateLeaderboard();
    
    // Render Results layout
    renderCalculatorResults();
    
    // Setup AI Coach initial assessment & weekly goals
    initAICoachAssessment();

    // Reset twin sliders to 0
    resetTwinSliders();
  }

  function renderCalculatorResults() {
    document.getElementById("calculator-card-wizard").style.display = "none";
    const rCard = document.getElementById("calculator-card-results");
    rCard.style.display = "block";

    const e = state.calculatedEmissions;
    if (!e) return;

    document.getElementById("results-monthly-co2").innerText = `${e.monthlyCO2} kg`;
    document.getElementById("results-yearly-co2").innerText = `${e.yearlyCO2} kg`;
    document.getElementById("results-score-index").innerText = `${e.score} / 100`;
    document.getElementById("results-grade").innerText = e.grade;

    // Set title and feedbacks
    document.getElementById("results-title-badge").innerText = e.title;
    document.getElementById("results-feedback-text").innerText = e.feedback;

    // Category shares
    document.getElementById("results-share-transport").innerText = `${e.shares.transport}%`;
    document.getElementById("results-share-energy").innerText = `${e.shares.energy}%`;
    document.getElementById("results-share-food").innerText = `${e.shares.food}%`;
    document.getElementById("results-share-shopping").innerText = `${e.shares.shopping}%`;

    // Progress bar sizes
    document.getElementById("results-bar-transport").style.width = `${e.shares.transport}%`;
    document.getElementById("results-bar-energy").style.width = `${e.shares.energy}%`;
    document.getElementById("results-bar-food").style.width = `${e.shares.food}%`;
    document.getElementById("results-bar-shopping").style.width = `${e.shares.shopping}%`;

    // Re-render chart on dashboard
    renderBreakdownChart();
  }

  // -------------------------------------------------
  // 11. AI CARBON COACH INTERACTIVE CHAT ENGINE
  // -------------------------------------------------

  function initAICoachAssessment() {
    state.chatHistory = [];
    const answers = state.calculatorAnswers;
    const emissions = state.calculatedEmissions;
    
    if (!answers || !emissions) {
      appendCoachMessage("Hello! I am your AI Eco Coach. Please complete the Carbon Score Calculator form first so I can analyze your daily routines and customize a plan for you!");
      return;
    }

    const initialGlow = `Hi **${state.username || "Friend"}**! I have completed your baseline emissions analysis. Your annual carbon footprint is **${emissions.yearlyCO2} kg CO2**, which gives you a Sustainability Score of **${emissions.score}/100** (Grade **${emissions.grade}**).

Here are my top observations from your lifestyle:`;

    appendCoachMessage(initialGlow);

    // Dynamic suggestions based on scores
    setTimeout(() => {
      showTypingIndicator();
      setTimeout(() => {
        hideTypingIndicator();
        let tips = [];
        
        if (emissions.breakdown.transport > 300) {
          tips.push("🚗 **Transport**: Your driving habits account for a significant share of your emissions. Consider shifting shorter trips to cycling/walking, or carpooling to save CO2.");
        }
        if (emissions.breakdown.energy > 250) {
          tips.push("❄️ **Energy**: AC cooling or phantom standby draw is pulling down your score. Adjusting your thermostat by 1°C or unplugging devices from the wall could trim substantial monthly weight.");
        }
        if (emissions.breakdown.food > 200) {
          tips.push("🥩 **Diet**: Meat meals represent heavy water and land usage. Shifting 3 more meals a week to plant-based choices can cut dietary emissions by up to 15%.");
        }
        if (emissions.breakdown.shopping > 100) {
          tips.push("🛍️ **Shopping**: Fast fashion items carry significant logistic margins. Buying premium, durable garments or choosing second-hand can boost your circular economy score.");
        }

        if (tips.length === 0) {
          tips.push("🌟 You are living very consciously! Continue checking off daily missions to maintain your rank leadership.");
        }

        appendCoachMessage(tips.join("\n\n"));
        
        // Auto-assign weekly goals to state
        generateWeeklyGoalsList(answers, emissions);
        renderWeeklyGoals();
        renderCoachSuggestions();
      }, 1000);
    }, 800);
  }

  function generateWeeklyGoalsList(answers, emissions) {
    let goals = [];

    if (answers.carUsage > 50) {
      goals.push({ id: 'g-transit', text: 'Replace 30km of car usage with transit or cycling', completed: false, category: 'Transport' });
    } else {
      goals.push({ id: 'g-walk', text: 'Walk or bike for all trips under 2km', completed: false, category: 'Transport' });
    }

    if (answers.acUsage > 2) {
      goals.push({ id: 'g-ac', text: 'Reduce AC usage by 1 hour daily', completed: false, category: 'Energy' });
    } else {
      goals.push({ id: 'g-standby', text: 'Unplug all home chargers when not charging devices', completed: false, category: 'Energy' });
    }

    if (answers.nonVegetarianMeals > 4) {
      goals.push({ id: 'g-diet', text: 'Have at least 4 plant-based meatless days', completed: false, category: 'Food' });
    } else {
      goals.push({ id: 'g-bottle', text: 'Avoid purchasing single-use plastic water bottles entirely', completed: false, category: 'Shopping' });
    }

    state.weeklyGoals = goals;
    saveState();
  }

  function renderWeeklyGoals() {
    const list = document.getElementById("coach-goals-checklist");
    if (!list) return;

    list.innerHTML = "";
    if (!state.weeklyGoals || state.weeklyGoals.length === 0) {
      list.innerHTML = `<div style="font-size:12px; color:var(--text-secondary); text-align:center;">Complete the calculator form to generate weekly goals.</div>`;
      return;
    }

    state.weeklyGoals.forEach(g => {
      const activeCls = g.completed ? "checked" : "";
      const item = document.createElement("div");
      item.className = "checklist-item";
      item.innerHTML = `
        <div class="checklist-left">
          <div class="checklist-checkbox-custom ${activeCls}" data-goal-id="${g.id}">
            <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div class="checklist-content">
            <span class="checklist-title">${g.text}</span>
            <span class="checklist-desc">${g.category} Target</span>
          </div>
        </div>
        <span class="checklist-badge xp-val">+75 XP</span>
      `;
      
      item.querySelector(".checklist-checkbox-custom").onclick = function() {
        toggleGoalCompletion(g.id, this);
      };

      list.appendChild(item);
    });
  }

  function toggleGoalCompletion(goalId, checkboxEl) {
    const goalIndex = state.weeklyGoals.findIndex(g => g.id === goalId);
    if (goalIndex === -1) return;

    const g = state.weeklyGoals[goalIndex];
    g.completed = !g.completed;

    if (g.completed) {
      checkboxEl.classList.add("checked");
      triggerConfetti(1.5);
      addXP(75);
      state.co2Saved += 25.0; // Weekly goal grants substantial CO2 savings
      showToast(`Weekly Goal Completed: ${g.text}! Earned 75 XP!`, "success");
    } else {
      checkboxEl.classList.remove("checked");
      state.xp = Math.max(0, state.xp - 75);
      state.co2Saved = Math.max(0, state.co2Saved - 25.0);
      showToast("Goal unchecked.", "info");
    }

    saveState();
    updateGlobalUI();
    renderWeeklyGoals();
  }

  function appendCoachMessage(text, isUser = false) {
    const box = document.getElementById("chat-messages-box");
    if (!box) return;

    // Convert markup bold tags manually to HTML bold tags for rendering
    const formattedText = text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br>");

    const msg = document.createElement("div");
    msg.className = `chat-message ${isUser ? 'user' : 'coach'}`;
    msg.innerHTML = formattedText;
    box.appendChild(msg);

    // Scroll to bottom
    box.scrollTop = box.scrollHeight;
    
    // Save to history
    state.chatHistory.push({ text, isUser });
    saveState();
  }

  function showTypingIndicator() {
    const box = document.getElementById("chat-messages-box");
    if (!box) return;

    const ind = document.createElement("div");
    ind.className = "chat-typing-indicator";
    ind.id = "chat-typing-bubble";
    ind.innerHTML = `
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    `;
    box.appendChild(ind);
    box.scrollTop = box.scrollHeight;
  }

  function hideTypingIndicator() {
    const ind = document.getElementById("chat-typing-bubble");
    if (ind) ind.remove();
  }

  // Handle typing input send
  function handleSendMessage() {
    const input = document.getElementById("chat-user-input-field");
    if (!input) return;

    const text = input.value.trim();
    if (!text) return;

    input.value = "";
    appendCoachMessage(text, true);
    
    showTypingIndicator();
    setTimeout(() => {
      hideTypingIndicator();
      generateCoachResponse(text);
    }, 1200);
  }

  // Simulated AI response processor
  function generateCoachResponse(query) {
    const q = query.toLowerCase();
    
    let reply = "";
    if (q.includes("ac") || q.includes("cool") || q.includes("electricity")) {
      reply = "💡 **AC & Electricity**: Setting your AC temperature to 24°C (75°F) instead of 20°C can trim energy usage by up to 18%. Also, remember to turn off unused switches and unplug electronic standbys to eliminate phantom draws.";
    } else if (q.includes("car") || q.includes("drive") || q.includes("cycle") || q.includes("walk")) {
      reply = "🚴 **Commuting**: Cars are high emissions sources. Swapping a standard petrol car commute for a public transit bus cuts emissions by 75%. Swapping for walking or cycling reduces them to zero, while boosting cardio!";
    } else if (q.includes("food") || q.includes("diet") || q.includes("meat") || q.includes("vegetarian")) {
      reply = "🥗 **Food Diet**: Shifting meat consumption is the single most powerful action to trim dietary load. Try starting with 'Meat-Free Mondays' and replacing dairy milk with almond or oat milk.";
    } else if (q.includes("fashion") || q.includes("shop") || q.includes("purchases")) {
      reply = "🛍️ **Circular Economy**: Avoid fast fashion outlets that use low-quality synthetics (like polyester). Invest in high-durability fabrics or explore local thrift shops to support the circular economy.";
    } else if (q.includes("tree")) {
      reply = "🌳 **Trees Equivalent**: A mature forest tree absorbs about 22kg of CO2 per year. When we save 220kg of CO2 on the dashboard, it is directly equivalent to planting 10 trees!";
    } else if (q.includes("save") || q.includes("reduce") || q.includes("score") || q.includes("footprint") || q.includes("improve") || q.includes("tip") || q.includes("hack")) {
      if (state.calculatedEmissions) {
        const e = state.calculatedEmissions;
        const b = e.breakdown;
        
        let highestCat = "transport";
        let maxVal = b.transport;
        if (b.energy > maxVal) { highestCat = "energy"; maxVal = b.energy; }
        if (b.food > maxVal) { highestCat = "food"; maxVal = b.food; }
        if (b.shopping > maxVal) { highestCat = "shopping"; maxVal = b.shopping; }
        
        let customAdvice = "";
        if (highestCat === "transport") {
          customAdvice = "Your highest emissions source is **Transportation** (" + b.transport + " kg CO2/year). I suggest replacing short car trips with walking or cycling, or commuting via public transit.";
        } else if (highestCat === "energy") {
          customAdvice = "Your highest emissions source is **Home Energy** (" + b.energy + " kg CO2/year). I recommend raising your AC temperature to 24°C (75°F), hang-drying clothes, and unplugging phantom standby power.";
        } else if (highestCat === "food") {
          customAdvice = "Your highest emissions source is **Diet & Food** (" + b.food + " kg CO2/year). Moving 3-4 meals a week to plant-based options or avoiding heavily packaged fast food will make a massive impact.";
        } else if (highestCat === "shopping") {
          customAdvice = "Your highest emissions source is **Shopping & Fashion** (" + b.shopping + " kg CO2/year). Swapping fast fashion purchases with durable, second-hand items will help lower manufacturing demand.";
        }
        
        reply = `Looking at your carbon calculator results, your current annual carbon footprint is **${e.yearlyCO2} kg CO2** (Grade **${e.grade}**). ${customAdvice} Ask me more about this specific category!`;
      } else {
        reply = "To give you personalized reduction advice, please calculate your footprint first using the **Calculator** tab. In general, you can start by shifting to a vegetarian diet, adjusting your thermostat, and walking for short trips.";
      }
    } else if (q.includes("hello") || q.includes("hi") || q.includes("hey")) {
      reply = `Hello! I am your AI Eco Coach. How can I help you improve your sustainability rating today? You can ask about commuting, AC settings, meatless diets, or circular fashion!`;
    } else {
      reply = "That is a great question! Reducing our carbon footprint requires conscious, day-by-day effort. Let's start by looking at your highest emission categories and finding small habits to improve.";
    }

    appendCoachMessage(reply);
    renderCoachSuggestions();
  }

  function renderCoachSuggestions() {
    const box = document.getElementById("chat-suggestions-container");
    if (!box) return;

    box.innerHTML = "";
    const options = [
      "How to reduce AC usage?",
      "Can food choices lower emissions?",
      "Why does driving have a high footprint?"
    ];

    options.forEach(opt => {
      const chip = document.createElement("div");
      chip.className = "chat-chip";
      chip.innerText = opt;
      chip.addEventListener("click", function() {
        appendCoachMessage(opt, true);
        showTypingIndicator();
        setTimeout(() => {
          hideTypingIndicator();
          generateCoachResponse(opt);
        }, 1000);
      });
      box.appendChild(chip);
    });
  }

  // Load chat history if exists
  function loadChatHistory() {
    const box = document.getElementById("chat-messages-box");
    if (!box) return;

    box.innerHTML = "";
    if (state.chatHistory && state.chatHistory.length > 0) {
      state.chatHistory.forEach(msg => {
        // Render history message without adding back to array
        const formattedText = msg.text
          .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
          .replace(/\n/g, "<br>");

        const el = document.createElement("div");
        el.className = `chat-message ${msg.isUser ? 'user' : 'coach'}`;
        el.innerHTML = formattedText;
        box.appendChild(el);
      });
      box.scrollTop = box.scrollHeight;
    } else {
      initAICoachAssessment();
    }
  }

  // -------------------------------------------------
  // 12. CARBON TWIN SIMULATOR ENGINE
  // -------------------------------------------------

  function initTwinSimulator() {
    const inputCommute = document.getElementById("slider-input-commute");
    const inputAC = document.getElementById("slider-input-ac");
    const inputBulbs = document.getElementById("slider-input-bulbs");
    const inputMeat = document.getElementById("slider-input-meat");

    if (!inputCommute) return;

    // Attach slider input event listeners
    inputCommute.oninput = function() {
      document.getElementById("slider-val-commute").innerText = `${this.value} km/week`;
      recalculateTwinEmissions();
    };

    inputAC.oninput = function() {
      document.getElementById("slider-val-ac").innerText = `${this.value} hours/day`;
      recalculateTwinEmissions();
    };

    inputBulbs.oninput = function() {
      document.getElementById("slider-val-bulbs").innerText = `${this.value}% replaced`;
      recalculateTwinEmissions();
    };

    inputMeat.oninput = function() {
      document.getElementById("slider-val-meat").innerText = `${this.value} meals/week`;
      recalculateTwinEmissions();
    };
  }

  function resetTwinSliders() {
    const sliders = ["commute", "ac", "bulbs", "meat"];
    sliders.forEach(s => {
      const el = document.getElementById(`slider-input-${s}`);
      if (el) {
        el.value = 0;
        el.dispatchEvent(new Event("input"));
      }
    });
  }

  function recalculateTwinEmissions() {
    const answers = state.calculatorAnswers;
    const emissions = state.calculatedEmissions;

    if (!answers || !emissions) {
      document.getElementById("twin-yearly-co2-val").innerText = "-- kg";
      document.getElementById("twin-annual-savings-val").innerText = "0 kg CO2";
      document.getElementById("twin-financial-savings-val").innerText = "$0.00 / year";
      document.getElementById("twin-trees-val").innerText = "0.0";
      return;
    }

    // Grab current slider values
    const commuteVal = parseFloat(document.getElementById("slider-input-commute").value) || 0;
    const acVal = parseFloat(document.getElementById("slider-input-ac").value) || 0;
    const bulbsVal = parseFloat(document.getElementById("slider-input-bulbs").value) || 0;
    const meatVal = parseFloat(document.getElementById("slider-input-meat").value) || 0;

    // 1. COMMUTING CO2 SAVED:
    // Max range commute is user weekly carUsage. Clamp slider value to user weekly car usage.
    const actualCommuteSavedKm = Math.min(commuteVal, answers.carUsage);
    const carFactor = window.EcoQuestCalculator.FACTORS.transport[answers.carType + "_car"] || 0.18;
    const commuteSavedMonthly = actualCommuteSavedKm * carFactor * 4.33; // factor weeks in a month
    const commuteSavedYearly = commuteSavedMonthly * 12;

    // 2. AC CO2 SAVED:
    // Clamp to user AC daily hours
    const actualACSavedHrs = Math.min(acVal, answers.acUsage);
    const acSavedMonthly = actualACSavedHrs * 30 * window.EcoQuestCalculator.FACTORS.energy.ac_hour;
    const acSavedYearly = acSavedMonthly * 12;

    // 3. LED LIGHT BULBS SAVED:
    // Switching to 100% LEDs can reduce household lighting energy by approx 75%
    // Standard lighting represents 15% of electricity bill
    const lightingPctSaved = (bulbsVal / 100) * 0.75 * 0.15;
    const electricitySavedKWh = answers.electricityUsage * lightingPctSaved;
    const bulbsSavedMonthly = electricitySavedKWh * window.EcoQuestCalculator.FACTORS.energy.electricity_kwh;
    const bulbsSavedYearly = bulbsSavedMonthly * 12;

    // 4. MEAT SWAP SAVED:
    // Clamp to user weekly non-vegetarian meals
    const actualMeatSavedMeals = Math.min(meatVal, answers.nonVegetarianMeals);
    const dietaryFactorDiff = window.EcoQuestCalculator.FACTORS.food.non_vegetarian_meal - window.EcoQuestCalculator.FACTORS.food.vegetarian_meal;
    const foodSavedMonthly = actualMeatSavedMeals * dietaryFactorDiff * 4.33;
    const foodSavedYearly = foodSavedMonthly * 12;

    // 5. SUM ALL PROJECTIONS
    const totalYearlySavings = commuteSavedYearly + acSavedYearly + bulbsSavedYearly + foodSavedYearly;
    const twinYearlyCO2 = Math.max(200, emissions.yearlyCO2 - totalYearlySavings);

    // Compute Twin Sustainability Index & Grade
    let twinScore = 100;
    if (twinYearlyCO2 <= 2000) {
      twinScore = 100;
    } else if (twinYearlyCO2 >= 18000) {
      twinScore = 5;
    } else {
      twinScore = 100 - Math.round(((twinYearlyCO2 - 2000) / 16000) * 95);
    }

    let twinGrade = 'F';
    if (twinScore >= 90) twinGrade = 'A+';
    else if (twinScore >= 80) twinGrade = 'A';
    else if (twinScore >= 70) twinGrade = 'B';
    else if (twinScore >= 50) twinGrade = 'C';
    else if (twinScore >= 30) twinGrade = 'D';

    // Financial Savings calculation
    // Assume Average Petrol Car gas costs $0.15 / km, electricity $0.16 / kWh
    const carFuelMoneySaved = actualCommuteSavedKm * 0.15 * 4.33 * 12;
    const acElecMoneySaved = actualACSavedHrs * 1.1 * 30 * 0.16 * 12; // assumes average 1.1kW draw
    const lightingMoneySaved = answers.electricityUsage * lightingPctSaved * 0.16 * 12;
    const foodCostSaved = actualMeatSavedMeals * 1.5 * 4.33 * 12; // Meat meals cost approx $1.50 more than veg meals
    const totalMoneySaved = carFuelMoneySaved + acElecMoneySaved + lightingMoneySaved + foodCostSaved;

    // Trees equivalents
    const twinTrees = totalYearlySavings / 22;

    // Render variables
    document.getElementById("twin-yearly-co2-val").innerText = `${Math.round(twinYearlyCO2)} kg`;
    document.getElementById("twin-annual-savings-val").innerText = `${Math.round(totalYearlySavings)} kg CO2`;
    document.getElementById("twin-financial-savings-val").innerText = `$${totalMoneySaved.toFixed(2)} / year`;
    document.getElementById("twin-trees-val").innerText = twinTrees.toFixed(1);
    
    document.getElementById("twin-score-index-txt").textContent = twinScore;
    document.getElementById("twin-grade-txt").innerText = `Grade ${twinGrade} (Carbon Twin)`;

    // Twin Gauge Offset
    const twinOffset = 280 - (280 * twinScore) / 100;
    document.getElementById("twin-gauge-offset").style.strokeDashoffset = twinOffset;
  }

  // -------------------------------------------------
  // 13. WEEKLY CLIMATE REPORT GENERATOR
  // -------------------------------------------------

  function renderWeeklyReport() {
    const dateEl = document.getElementById("report-date-str");
    const nameEl = document.getElementById("report-user-header");
    const scoreNum = document.getElementById("report-score-num");
    const co2SavedEl = document.getElementById("report-co2-num");
    const streakNum = document.getElementById("report-streak-num");
    const evaluationBox = document.getElementById("report-lifestyle-analysis");
    const checklistBox = document.getElementById("report-action-checklist");

    if (!dateEl) return;

    // Format Current Date
    const today = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    dateEl.innerText = `Generated on ${today.toLocaleDateString("en-US", options)}`;

    nameEl.innerText = `${state.username || "Guest"}'s Weekly Climate Report`;
    
    // Summary values
    scoreNum.innerText = state.calculatedEmissions ? state.calculatedEmissions.score : "--";
    co2SavedEl.innerText = `${state.co2Saved.toFixed(1)} kg`;
    streakNum.innerText = `${state.streak}d`;

    // AI Analysis Content based on results
    if (state.calculatedEmissions) {
      const e = state.calculatedEmissions;
      
      let text = `Based on your calculated score of **${e.score}/100**, your carbon footprint is rated as **${e.grade} (${e.title})**. Your weekly emission baseline is approximately **${Math.round(e.monthlyCO2 / 4.33)} kg CO2**. `;
      
      if (e.score >= 80) {
        text += "You are exhibiting highly conscious ecological habits. Most of your emissions are minimal. Continue enforcing your current habits and use public transport for medium journeys.";
      } else if (e.score >= 50) {
        text += "Your carbon footprint represents a moderate strain on planetary systems. Shifting your commuting choices and cooling systems is necessary. Try reducing AC cooling by 1 hour daily to trim energy load.";
      } else {
        text += "WARNING: Your footprint exceeds safe ecological standards significantly. High driving indices and electricity draw require immediate adjustment. Swap short driving trips with walking or cycling, and unplug electronic standbys immediately.";
      }

      evaluationBox.innerHTML = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

      // Generate action checklist recommendations
      checklistBox.innerHTML = "";
      const tips = [];
      const answers = state.calculatorAnswers;

      if (answers.carUsage > 40) {
        tips.push(`Commute Swap: Reduce car driving by 20% by using public transit (saves ~${Math.round(answers.carUsage * 0.2 * 0.18 * 52)}kg CO2/year)`);
      }
      if (answers.acUsage > 2) {
        tips.push(`Smart AC Limit: Limit AC cooling by 1 hour daily (saves ~${Math.round(1 * 30 * 0.45 * 12)}kg CO2/year)`);
      }
      if (answers.nonVegetarianMeals > 4) {
        tips.push(`Meatless Substitution: Swap 3 meat meals per week for vegetarian options (saves ~${Math.round(3 * 1.7 * 52)}kg CO2/year)`);
      }
      if (answers.fastFashion === "frequently") {
        tips.push("Circular Shopping: Stop buying fast-fashion garments for the next 30 days (saves ~120kg CO2/month)");
      }
      tips.push("Standby Clean: Unplug household chargers from outlets when not in use (saves ~50kg CO2/year)");

      tips.forEach(t => {
        const item = document.createElement("div");
        item.className = "report-checklist-item";
        item.innerHTML = `<span class="report-bullet">✓</span> <span>${t}</span>`;
        checklistBox.appendChild(item);
      });

      // Update badge indicator status
      document.getElementById("report-status-badge").innerText = e.score >= 80 ? "👑" : (e.score >= 50 ? "🌱" : "⚠️");
    } else {
      evaluationBox.innerHTML = `Please complete the Carbon Score Calculator form first. Once your details are analyzed, the AI Coach will generate your weekly lifestyle assessment and target reduction checklist here.`;
      checklistBox.innerHTML = `
        <div class="report-checklist-item">
          <span class="report-bullet">•</span>
          <span>No suggestions available. Complete the calculator form to populate recommendations.</span>
        </div>
      `;
      document.getElementById("report-status-badge").innerText = "🌱";
    }
  }

  // -------------------------------------------------
  // 14. AUTHENTICATION & LOGIN MODAL
  // -------------------------------------------------

  function openAuthModal() {
    const modal = document.getElementById("auth-modal");
    if (modal) {
      modal.classList.add("active");
      
      // Focus input
      const input = document.getElementById("auth-input-username");
      if (input) {
        input.value = state.username || "";
        input.focus();
      }

      // Sync avatar selection
      const avatars = document.querySelectorAll("#avatar-grid-selector .visual-select-card");
      avatars.forEach(card => {
        if (card.getAttribute("data-avatar") === state.avatar) {
          card.classList.add("selected");
        } else {
          card.classList.remove("selected");
        }
      });
    }
  }

  function closeAuthModal() {
    const modal = document.getElementById("auth-modal");
    if (modal) modal.classList.remove("active");
  }

  function handleSaveProfile() {
    const input = document.getElementById("auth-input-username");
    if (!input) return;

    const username = input.value.trim();
    if (!username) return;

    const selectedAvatarCard = document.querySelector("#avatar-grid-selector .visual-select-card.selected");
    const avatar = selectedAvatarCard ? selectedAvatarCard.getAttribute("data-avatar") : "🛡️";

    state.username = username;
    state.avatar = avatar;

    if (state.streak === 0) {
      state.streak = 1;
      state.lastActiveDate = getTodayDateString();
    }

    saveState();
    closeAuthModal();
    updateGlobalUI();
    updateLeaderboard();
    
    showToast(`Profile saved! Welcome ${username}! 🌱`, "success");
    triggerConfetti(1.5);
  }

  // -------------------------------------------------
  // 15. INTERACTIVE CHART.JS WRAPPER
  // -------------------------------------------------

  function renderBreakdownChart() {
    const canvas = document.getElementById("dashboard-breakdown-chart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Destroy existing chart to avoid overlay glitching
    if (breakdownChart) {
      breakdownChart.destroy();
    }

    // Default placeholder data or loaded state
    let chartData = [25, 25, 25, 25];
    let chartLabels = ["Transportation", "Home Energy", "Diet & Food", "Shopping"];

    if (state.calculatedEmissions) {
      const b = state.calculatedEmissions.breakdown;
      chartData = [b.transport, b.energy, b.food, b.shopping];
    }

    const isDark = document.body.classList.contains("dark-theme");
    const labelColor = isDark ? "#94a3b8" : "#475569";
    const gridColor = isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)";

    breakdownChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: chartLabels,
        datasets: [{
          label: 'Annual Emitted CO2 (kg)',
          data: chartData,
          backgroundColor: [
            'rgba(16, 185, 129, 0.75)', // Green
            'rgba(20, 184, 166, 0.75)', // Teal
            'rgba(245, 158, 11, 0.75)', // Amber
            'rgba(59, 130, 246, 0.75)'  // Blue
          ],
          borderColor: [
            '#10b981',
            '#14b8a6',
            '#f59e0b',
            '#3b82f6'
          ],
          borderWidth: 1.5,
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            padding: 12,
            titleFont: { family: 'Outfit', size: 14, weight: 'bold' },
            bodyFont: { family: 'Inter', size: 13 },
            cornerRadius: 12,
            backgroundColor: isDark ? '#0f172a' : '#ffffff',
            titleColor: isDark ? '#ffffff' : '#0f172a',
            bodyColor: isDark ? '#94a3b8' : '#475569',
            borderColor: 'rgba(16, 185, 129, 0.2)',
            borderWidth: 1
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: labelColor,
              font: { family: 'Outfit', size: 12 }
            }
          },
          y: {
            grid: {
              color: gridColor
            },
            ticks: {
              color: labelColor,
              font: { family: 'Inter', size: 11 }
            }
          }
        }
      }
    });
  }

  // -------------------------------------------------
  // 16. SPA NAVIGATION ROUTER
  // -------------------------------------------------

  function navigateToTab(targetId) {
    // Select all sections
    const tabs = document.querySelectorAll(".tab-content");
    const navLinks = document.querySelectorAll(".nav-link");

    // Hide all
    tabs.forEach(t => t.classList.remove("active"));
    navLinks.forEach(link => {
      if (link.getAttribute("data-target") === targetId) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });

    // Show selected
    const activeTab = document.getElementById(targetId);
    if (activeTab) {
      activeTab.classList.add("active");
      window.scrollTo(0, 0);
    }

    // Update Header Page Title
    const titleHeader = document.getElementById("page-title-heading");
    if (titleHeader) {
      let pageTitle = "EcoQuest AI";
      if (targetId === "dashboard-page") pageTitle = "User Dashboard";
      if (targetId === "calculator-page") pageTitle = "Footprint Calculator";
      if (targetId === "coach-page") pageTitle = "AI Carbon Coach";
      if (targetId === "twin-page") pageTitle = "Carbon Twin Simulator";
      if (targetId === "hub-page") pageTitle = "Climate Knowledge Hub";
      if (targetId === "leaderboard-page") pageTitle = "Community Leaderboard";
      if (targetId === "report-page") pageTitle = "Weekly Climate Report";
      
      titleHeader.innerText = pageTitle;
    }

    // Trigger tab specific loads
    if (targetId === "dashboard-page") {
      renderDailyMissions();
      renderBreakdownChart();
    }
    else if (targetId === "coach-page") {
      loadChatHistory();
      renderWeeklyGoals();
    }
    else if (targetId === "twin-page") {
      recalculateTwinEmissions();
    }
    else if (targetId === "hub-page") {
      renderQuizQuestion();
      renderChallenges();
    }
    else if (targetId === "leaderboard-page") {
      updateLeaderboard();
      renderBadges();
    }
    else if (targetId === "report-page") {
      renderWeeklyReport();
    }
  }

  // -------------------------------------------------
  // 17. INITIALIZATION BLOCK
  // -------------------------------------------------

  document.addEventListener("DOMContentLoaded", function() {
    loadState();

    // 1. Hook up Navigation triggers
    const navLinks = document.querySelectorAll(".nav-link");
    navLinks.forEach(link => {
      link.addEventListener("click", function(e) {
        e.preventDefault();
        const target = this.getAttribute("data-target");
        
        // Navigation Guard: Enforce profile setup for personalized tabs
        if (target !== "landing-page" && target !== "calculator-page" && !state.username) {
          showToast("Please set up your profile to access this tab!", "info");
          openAuthModal();
          return;
        }
        
        navigateToTab(target);
      });
    });

    // 2. Auth Buttons & Overlay Modals
    const authBtn = document.getElementById("auth-header-btn");
    const closeBtn = document.getElementById("auth-close-btn");
    const authForm = document.getElementById("auth-form-submit");

    if (authBtn) authBtn.onclick = openAuthModal;
    if (closeBtn) closeBtn.onclick = closeAuthModal;
    
    if (authForm) {
      authForm.addEventListener("submit", function(e) {
        e.preventDefault();
        handleSaveProfile();
      });
    }

    // Hero buttons
    const heroBtn1 = document.getElementById("hero-get-started-btn");
    const heroBtn2 = document.getElementById("hero-features-btn");
    const ctaBtn = document.getElementById("cta-calculate-btn");

    if (heroBtn1) heroBtn1.onclick = () => navigateToTab("calculator-page");
    if (ctaBtn) ctaBtn.onclick = () => navigateToTab("calculator-page");
    if (heroBtn2) {
      heroBtn2.onclick = () => {
        const feat = document.getElementById("eco-features-anchor");
        if (feat) feat.scrollIntoView({ behavior: 'smooth' });
      };
    }

    // Quiz options clicker inside modal selector grid
    const avatarCards = document.querySelectorAll("#avatar-grid-selector .visual-select-card");
    avatarCards.forEach(card => {
      card.addEventListener("click", function() {
        avatarCards.forEach(c => c.classList.remove("selected"));
        this.classList.add("selected");
      });
    });

    // Redirect buttons in results card
    const resCoachBtn = document.getElementById("results-go-coach-btn");
    const resDashBtn = document.getElementById("results-go-dashboard-btn");
    if (resCoachBtn) resCoachBtn.onclick = () => navigateToTab("coach-page");
    if (resDashBtn) resDashBtn.onclick = () => navigateToTab("dashboard-page");

    // Next question trigger in quiz
    const nextQuestionBtn = document.getElementById("quiz-next-question-btn");
    if (nextQuestionBtn) {
      nextQuestionBtn.onclick = function() {
        state.quizQuestionIndex += 1;
        saveState();
        renderQuizQuestion();
      };
    }

    // 3. Theme switch handler
    const themeBtn = document.getElementById("theme-toggle-btn");
    if (themeBtn) {
      themeBtn.onclick = function() {
        document.body.classList.toggle("light-theme");
        
        // Save current theme setting in local state
        state.lightThemeActive = document.body.classList.contains("light-theme");
        saveState();
        
        // Re-draw chart to adapt tick grid colors
        if (breakdownChart) renderBreakdownChart();
      };
    }

    // Sync saved theme state
    if (state.lightThemeActive) {
      document.body.classList.add("light-theme");
    } else {
      document.body.classList.remove("light-theme");
    }

    // 4. Chat Send Trigger
    const chatForm = document.getElementById("chat-input-form");
    if (chatForm) {
      chatForm.addEventListener("submit", function(e) {
        e.preventDefault();
        handleSendMessage();
      });
    }

    // 5. Weekly PDF print report button
    const printReportBtn = document.getElementById("print-report-btn");
    if (printReportBtn) {
      printReportBtn.onclick = function() {
        window.print();
      };
    }

    // Initialize all modular elements
    updateGlobalUI();
    renderDailyMissions();
    initCalculatorWizard();
    initAICoachAssessment();
    initTwinSimulator();
    initKnowledgeBase();
    initHabitTracker();
    renderChallenges();

    // Check if initial questionnaire was already filled
    if (state.calculatedEmissions) {
      renderCalculatorResults();
    }
  })();
})();
