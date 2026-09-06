// FocusFlow Productivity Dashboard
// Core concepts used: DOM manipulation, event handling, Local Storage,
// Fetch API, Date Object, setInterval and reusable rendering functions.

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

const STORAGE = {
  todos: "focusflow-todos",
  planner: "focusflow-planner",
  goals: "focusflow-goals",
  theme: "productivity-theme"
};

const state = {
  todos: JSON.parse(localStorage.getItem(STORAGE.todos) || "[]"),
  planner: JSON.parse(localStorage.getItem(STORAGE.planner) || "{}"),
  goals: JSON.parse(localStorage.getItem(STORAGE.goals) || "[]"),
  activeFeature: null,
  timer: {
    workSeconds: 25 * 60,
    breakSeconds: 5 * 60,
    remaining: 25 * 60,
    session: "Work Session",
    running: false,
    interval: null
  }
};

const featureView = $("#featureView");
const dashboardView = $("#dashboardView");
const featurePanel = $("#featurePanel");
const toast = $("#toast");

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => toast.classList.remove("show"), 2200);
}

// ---------- Navigation ----------
const featureDefinitions = {
  todo: {
    title: "Todo List",
    subtitle: "Create, prioritize and complete your tasks."
  },
  planner: {
    title: "Daily Planner",
    subtitle: "Assign a note or task to each hour of your day."
  },
  pomodoro: {
    title: "Pomodoro Timer",
    subtitle: "Focus for 25 minutes, then take a short break."
  },
  goals: {
    title: "Daily Goals",
    subtitle: "Set today's targets and track your progress."
  }
};

function openFeature(name) {
  if (!featureDefinitions[name]) return;
  state.activeFeature = name;
  dashboardView.classList.add("hidden");
  featureView.classList.remove("hidden");
  renderFeature(name);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function closeFeature() {
  stopTimer();
  state.activeFeature = null;
  featureView.classList.add("hidden");
  dashboardView.classList.remove("hidden");
  updateDashboardSummaries();
}

function panelHeader(name) {
  const f = featureDefinitions[name];
  return `
    <div class="panel-head">
      <button class="back-btn" id="backToDashboard">← Dashboard</button>
      <div class="panel-title">
        <h2>${f.title}</h2>
        <p>${f.subtitle}</p>
      </div>
    </div>
  `;
}

function renderFeature(name) {
  if (name === "todo") renderTodo();
  if (name === "planner") renderPlanner();
  if (name === "pomodoro") renderPomodoro();
  if (name === "goals") renderGoals();
  $("#backToDashboard").addEventListener("click", closeFeature);
}

// ---------- Todo List ----------
function renderTodo() {
  featurePanel.innerHTML = panelHeader("todo") + `
    <form class="add-row" id="todoForm">
      <input class="field" id="todoInput" maxlength="160" autocomplete="off" placeholder="What needs to be done?">
      <button class="primary-btn" type="submit">+ Add Task</button>
    </form>
    <div class="list" id="todoList"></div>
  `;
  renderTodoList();
  $("#todoForm").addEventListener("submit", e => {
    e.preventDefault();
    const input = $("#todoInput");
    const text = input.value.trim();
    if (!text) {
      showToast("Please enter a task.");
      input.focus();
      return;
    }
    state.todos.unshift({
      id: Date.now().toString(),
      text,
      completed: false,
      important: false
    });
    save(STORAGE.todos, state.todos);
    input.value = "";
    renderTodoList();
    updateDashboardSummaries();
  });
}

function renderTodoList() {
  const list = $("#todoList");
  if (!list) return;
  if (!state.todos.length) {
    list.innerHTML = `<div class="empty">No tasks yet. Add your first task above.</div>`;
    return;
  }
  list.innerHTML = state.todos.map(todo => `
    <div class="list-item ${todo.completed ? "completed" : ""}" data-id="${todo.id}">
      <input class="check todo-complete" type="checkbox" ${todo.completed ? "checked" : ""} aria-label="Complete task">
      <span class="item-text">${escapeHTML(todo.text)}</span>
      <button class="star-btn ${todo.important ? "important" : ""}" data-action="important" aria-label="Mark important">${todo.important ? "★" : "☆"}</button>
      <button class="delete-btn" data-action="delete" aria-label="Delete task">×</button>
    </div>
  `).join("");
}

$("#dashboardView").addEventListener("click", e => {
  const card = e.target.closest("[data-feature]");
  if (card) openFeature(card.dataset.feature);
});

featureView.addEventListener("click", e => {
  const item = e.target.closest(".list-item");
  if (!item || state.activeFeature !== "todo") return;
  const todo = state.todos.find(t => t.id === item.dataset.id);
  if (!todo) return;

  if (e.target.matches(".todo-complete")) todo.completed = e.target.checked;
  if (e.target.dataset.action === "important") todo.important = !todo.important;
  if (e.target.dataset.action === "delete") state.todos = state.todos.filter(t => t.id !== todo.id);

  save(STORAGE.todos, state.todos);
  renderTodoList();
  updateDashboardSummaries();
});

// ---------- Daily Planner ----------
const plannerHours = Array.from({ length: 16 }, (_, i) => i + 7); // 07:00–22:00

function formatHour(h) {
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${String(hour).padStart(2, "0")}:00 ${suffix}`;
}

function renderPlanner() {
  featurePanel.innerHTML = panelHeader("planner") + `
    <div class="planner-list" id="plannerList">
      ${plannerHours.map(h => `
        <label class="planner-row" data-hour="${h}">
          <span class="time-label">${formatHour(h)}</span>
          <input class="planner-input" data-planner-hour="${h}" maxlength="200"
                 placeholder="Add a plan for ${formatHour(h)}..."
                 value="${escapeAttr(state.planner[h] || "")}">
        </label>
      `).join("")}
    </div>
  `;
  highlightCurrentPlannerHour();
  $$(".planner-input").forEach(input => {
    input.addEventListener("input", e => {
      const hour = e.target.dataset.plannerHour;
      const value = e.target.value.trim();
      if (value) state.planner[hour] = value;
      else delete state.planner[hour];
      save(STORAGE.planner, state.planner);
    });
  });
}

function highlightCurrentPlannerHour() {
  const hour = new Date().getHours();
  $$(".planner-row").forEach(row => row.classList.toggle("current", Number(row.dataset.hour) === hour));
}

// ---------- Daily Goals ----------
function renderGoals() {
  featurePanel.innerHTML = panelHeader("goals") + `
    <div class="goals-progress">
      <div class="progress-meta"><span id="goalCount">0 of 0 completed</span><span id="goalPercent">0%</span></div>
      <div class="progress-track"><div class="progress-bar" id="goalProgress"></div></div>
    </div>
    <form class="add-row" id="goalForm">
      <input class="field" id="goalInput" maxlength="160" autocomplete="off" placeholder="What's one goal for today?">
      <button class="primary-btn" type="submit">+ Add Goal</button>
    </form>
    <div class="list" id="goalList"></div>
  `;
  renderGoalList();
  $("#goalForm").addEventListener("submit", e => {
    e.preventDefault();
    const input = $("#goalInput");
    const text = input.value.trim();
    if (!text) {
      showToast("Please enter a goal.");
      input.focus();
      return;
    }
    state.goals.push({ id: Date.now().toString(), text, completed: false });
    save(STORAGE.goals, state.goals);
    input.value = "";
    renderGoalList();
    updateDashboardSummaries();
  });
}

function renderGoalList() {
  const list = $("#goalList");
  if (!list) return;
  const completed = state.goals.filter(g => g.completed).length;
  const total = state.goals.length;
  const percent = total ? Math.round(completed / total * 100) : 0;
  $("#goalCount").textContent = `${completed} of ${total} completed`;
  $("#goalPercent").textContent = `${percent}%`;
  $("#goalProgress").style.width = `${percent}%`;

  list.innerHTML = total ? state.goals.map(goal => `
    <div class="list-item ${goal.completed ? "completed" : ""}" data-goal-id="${goal.id}">
      <input class="check goal-complete" type="checkbox" ${goal.completed ? "checked" : ""} aria-label="Complete goal">
      <span class="item-text">${escapeHTML(goal.text)}</span>
      <button class="delete-btn goal-delete" aria-label="Delete goal">×</button>
    </div>
  `).join("") : `<div class="empty">No goals yet. Add something you want to accomplish today.</div>`;
}

featureView.addEventListener("change", e => {
  if (e.target.matches(".goal-complete")) {
    const row = e.target.closest("[data-goal-id]");
    const goal = state.goals.find(g => g.id === row.dataset.goalId);
    if (goal) goal.completed = e.target.checked;
    save(STORAGE.goals, state.goals);
    renderGoalList();
    updateDashboardSummaries();
  }
});

featureView.addEventListener("click", e => {
  if (e.target.matches(".goal-delete")) {
    const row = e.target.closest("[data-goal-id]");
    state.goals = state.goals.filter(g => g.id !== row.dataset.goalId);
    save(STORAGE.goals, state.goals);
    renderGoalList();
    updateDashboardSummaries();
  }
});

// ---------- Pomodoro ----------
function renderPomodoro() {
  featurePanel.innerHTML = panelHeader("pomodoro") + `
    <div class="timer-wrap">
      <div class="session-label" id="sessionLabel">${state.timer.session.toUpperCase()}</div>
      <div class="timer-display" id="timerDisplay">${formatTimer(state.timer.remaining)}</div>
      <div class="timer-controls">
        <button class="primary-btn" id="timerStart">▶ Start</button>
        <button class="secondary-btn" id="timerPause">Ⅱ Pause</button>
        <button class="secondary-btn" id="timerReset">↻ Reset</button>
      </div>
      <p class="timer-note">Default: 25-minute work session • 5-minute break</p>
    </div>
  `;
  updateTimerDisplay();
  $("#timerStart").addEventListener("click", startTimer);
  $("#timerPause").addEventListener("click", pauseTimer);
  $("#timerReset").addEventListener("click", resetTimer);
}

function formatTimer(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function updateTimerDisplay() {
  const display = $("#timerDisplay");
  const label = $("#sessionLabel");
  if (display) display.textContent = formatTimer(state.timer.remaining);
  if (label) label.textContent = state.timer.session.toUpperCase();
}

function startTimer() {
  if (state.timer.running) return; // Prevent multiple intervals.
  state.timer.running = true;
  clearInterval(state.timer.interval);
  state.timer.interval = setInterval(() => {
    state.timer.remaining -= 1;
    updateTimerDisplay();
    if (state.timer.remaining <= 0) {
      clearInterval(state.timer.interval);
      state.timer.running = false;
      notifyTimerComplete();
    }
  }, 1000);
  showToast("Pomodoro started.");
}

function pauseTimer() {
  clearInterval(state.timer.interval);
  state.timer.interval = null;
  state.timer.running = false;
  showToast("Timer paused.");
}

function stopTimer() {
  clearInterval(state.timer.interval);
  state.timer.interval = null;
  state.timer.running = false;
}

function resetTimer() {
  stopTimer();
  state.timer.session = "Work Session";
  state.timer.remaining = state.timer.workSeconds;
  updateTimerDisplay();
  showToast("Timer reset.");
}

function notifyTimerComplete() {
  updateTimerDisplay();
  showToast(`${state.timer.session} complete! Great work.`);
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain); gain.connect(ctx.destination);
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(.2, ctx.currentTime + .02);
    gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + .5);
    oscillator.start(); oscillator.stop(ctx.currentTime + .5);
  } catch (_) {}
}

// ---------- Quote Fetch API ----------
async function fetchQuote() {
  const text = $("#quoteText"), author = $("#quoteAuthor"), button = $("#newQuoteBtn");
  if (!text) return;
  button.disabled = true;
  text.textContent = "Finding a fresh thought...";
  author.textContent = "— Loading";
  try {
    // Quotable is a free quote endpoint and does not require a client-side API key.
    const response = await fetch("https://api.quotable.io/random", { cache: "no-store" });
    if (!response.ok) throw new Error("Quote request failed");
    const data = await response.json();
    text.textContent = data.content;
    author.textContent = `— ${data.author || "Unknown"}`;
  } catch (error) {
    text.textContent = "Small steps every day create remarkable results.";
    author.textContent = "— FocusFlow fallback";
  } finally {
    button.disabled = false;
  }
}

$("#newQuoteBtn").addEventListener("click", fetchQuote);

// ---------- Weather Fetch API + Geolocation ----------
const weatherCodes = {
  0: ["Clear sky", "☀"], 1: ["Mainly clear", "🌤"], 2: ["Partly cloudy", "⛅"], 3: ["Overcast", "☁"],
  45: ["Fog", "🌫"], 48: ["Rime fog", "🌫"], 51: ["Light drizzle", "🌦"], 53: ["Drizzle", "🌦"],
  55: ["Heavy drizzle", "🌧"], 61: ["Light rain", "🌦"], 63: ["Rain", "🌧"], 65: ["Heavy rain", "🌧"],
  71: ["Light snow", "🌨"], 73: ["Snow", "🌨"], 75: ["Heavy snow", "❄"], 80: ["Rain showers", "🌦"],
  81: ["Rain showers", "🌧"], 82: ["Heavy showers", "🌧"], 95: ["Thunderstorm", "⛈"],
  96: ["Thunderstorm", "⛈"], 99: ["Thunderstorm", "⛈"]
};

async function fetchWeather(latitude, longitude, locationName = "Your location") {
  const location = $("#weatherLocation"), temp = $("#weatherTemp"), condition = $("#weatherCondition");
  const humidity = $("#weatherHumidity"), wind = $("#weatherWind"), icon = $("#weatherIcon");
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Weather request failed");
    const data = await response.json();
    const current = data.current;
    const weather = weatherCodes[current.weather_code] || ["Current conditions", "☁"];
    location.textContent = locationName;
    temp.textContent = `${Math.round(current.temperature_2m)}°`;
    condition.textContent = weather[0];
    humidity.textContent = `${Math.round(current.relative_humidity_2m)}%`;
    wind.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
    icon.textContent = weather[1];
  } catch (_) {
    location.textContent = "Weather unavailable";
    temp.textContent = "--°";
    condition.textContent = "Try again later";
    humidity.textContent = "--%";
    wind.textContent = "-- km/h";
  }
}

function loadWeather() {
  if (!navigator.geolocation) {
    fetchWeather(21.2514, 81.6296, "Raipur");
    return;
  }
  navigator.geolocation.getCurrentPosition(
    pos => fetchWeather(pos.coords.latitude, pos.coords.longitude, "Your location"),
    () => fetchWeather(21.2514, 81.6296, "Raipur")
  );
}

// ---------- Date & Time ----------
let clockInterval = null;

function updateDateTime() {
  const now = new Date();
  const time12 = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const timeShort = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const date = now.toLocaleDateString([], { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

  $("#headerTime").textContent = time12;
  $("#headerDate").textContent = date;
  $("#mainTime").textContent = timeShort;
  $("#mainDate").textContent = date;
  $("#heroDay").textContent = now.toLocaleDateString([], { weekday: "long" });
  $("#heroDate").textContent = now.toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
  $("#greeting").textContent = getGreeting(now.getHours());
  applyDynamicBackground(now.getHours());

  if (state.activeFeature === "planner") highlightCurrentPlannerHour();
}

function getGreeting(hour) {
  if (hour >= 5 && hour < 12) return "GOOD MORNING";
  if (hour >= 12 && hour < 17) return "GOOD AFTERNOON";
  if (hour >= 17 && hour < 21) return "GOOD EVENING";
  return "GOOD NIGHT";
}

// ---------- Dynamic Background ----------
function applyDynamicBackground(hour) {
  let background;
  if (hour >= 5 && hour < 11) {
    background = "radial-gradient(circle at 15% 10%, #ffe9cf, transparent 35%), linear-gradient(135deg,#f8fbff,#fff4df)";
  } else if (hour >= 11 && hour < 17) {
    background = "radial-gradient(circle at 80% 15%, #d9f4ff, transparent 38%), linear-gradient(135deg,#f4fbff,#eaf3ff)";
  } else if (hour >= 17 && hour < 21) {
    background = "radial-gradient(circle at 80% 10%, #ffd8bd, transparent 35%), linear-gradient(135deg,#fff1e7,#eeeaff)";
  } else {
    background = "radial-gradient(circle at 75% 10%, #30375f, transparent 35%), linear-gradient(135deg,#10162d,#202541)";
  }
  document.documentElement.style.setProperty("--dynamic-bg", background);
}

// ---------- Theme ----------
function applyTheme(theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  $("#themeIcon").textContent = theme === "dark" ? "☀" : "☾";
}

$("#themeToggle").addEventListener("click", () => {
  const theme = document.documentElement.classList.contains("dark") ? "light" : "dark";
  localStorage.setItem(STORAGE.theme, theme);
  applyTheme(theme);
});

// ---------- Dashboard Summaries ----------
function updateDashboardSummaries() {
  const pending = state.todos.filter(t => !t.completed).length;
  const completedGoals = state.goals.filter(g => g.completed).length;
  $("#todoSummary").textContent = `${pending} task${pending === 1 ? "" : "s"} remaining`;
  $("#goalsSummary").textContent = `${completedGoals}/${state.goals.length} goals complete`;
}

// ---------- Utilities ----------
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}
function escapeAttr(value) {
  return escapeHTML(value);
}

// ---------- Startup ----------
(function init() {
  const savedTheme = localStorage.getItem(STORAGE.theme) || (document.documentElement.classList.contains("dark") ? "dark" : "light");
  applyTheme(savedTheme);

  updateDateTime();
  clearInterval(clockInterval);
  clockInterval = setInterval(updateDateTime, 1000);

  fetchQuote();
  loadWeather();
  updateDashboardSummaries();
})();
