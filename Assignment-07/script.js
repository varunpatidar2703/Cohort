const AUTH_KEYS = {
      users: "fintrackpro_users",
      session: "fintrackpro_session"
    };

    function loadUsers() {
      try { return JSON.parse(localStorage.getItem(AUTH_KEYS.users)) || []; }
      catch { return []; }
    }
    function saveUsers(users) {
      localStorage.setItem(AUTH_KEYS.users, JSON.stringify(users));
    }
    function normalizedEmail(email) {
      return String(email || "").trim().toLowerCase();
    }
    function currentUser() {
      const email = localStorage.getItem(AUTH_KEYS.session);
      if (!email) return null;
      return loadUsers().find(u => u.email === email) || null;
    }
    function showAuthError(id, message) {
      const el = document.getElementById(id);
      el.textContent = message;
      el.style.display = "block";
    }
    function hideAuthMessages() {
      document.querySelectorAll(".auth-error,.auth-success").forEach(el => {
        el.style.display = "none";
        el.textContent = "";
      });
    }
    function showAuthPanel(panel) {
      hideAuthMessages();
      document.getElementById("loginPanel").style.display = panel === "login" ? "block" : "none";
      document.getElementById("registerPanel").style.display = panel === "register" ? "block" : "none";
    }
    function showApp() {
      document.getElementById("authScreen").style.display = "none";
      document.getElementById("appNav").style.display = "flex";
      document.getElementById("appMain").style.display = "block";
      const user = currentUser();
      if (user) {
        localStorage.setItem(KEYS.name, user.name);
        document.getElementById("profileName").value = user.name;
      }
      applyDarkMode();
      refresh();
    }
    function showAuth() {
      document.getElementById("authScreen").style.display = "flex";
      document.getElementById("appNav").style.display = "none";
      document.getElementById("appMain").style.display = "none";
      showAuthPanel("login");
    }

    document.getElementById("showRegister").addEventListener("click", () => {
      document.getElementById("registerForm").reset();
      showAuthPanel("register");
    });
    document.getElementById("showLogin").addEventListener("click", () => {
      document.getElementById("loginForm").reset();
      showAuthPanel("login");
    });

    document.querySelectorAll(".show-password").forEach(btn => {
      btn.addEventListener("click", () => {
        const input = document.getElementById(btn.dataset.target);
        const showing = input.type === "text";
        input.type = showing ? "password" : "text";
        btn.textContent = showing ? "Show" : "Hide";
      });
    });

    document.getElementById("registerForm").addEventListener("submit", e => {
      e.preventDefault();
      const name = document.getElementById("registerName").value.trim();
      const email = normalizedEmail(document.getElementById("registerEmail").value);
      const password = document.getElementById("registerPassword").value;
      const confirm = document.getElementById("registerConfirm").value;
      const users = loadUsers();

      if (name.length < 2) return showAuthError("registerError", "Please enter a valid display name.");
      if (!email) return showAuthError("registerError", "Please enter a valid email address.");
      if (password.length < 6) return showAuthError("registerError", "Password must be at least 6 characters.");
      if (password !== confirm) return showAuthError("registerError", "Passwords do not match.");
      if (users.some(u => u.email === email)) return showAuthError("registerError", "An account with this email already exists.");

      users.push({
        id: Date.now(),
        name,
        email,
        password,
        createdAt: new Date().toISOString()
      });
      saveUsers(users);
      localStorage.setItem(AUTH_KEYS.session, email);
      localStorage.setItem(KEYS.name, name);

      const success = document.getElementById("registerSuccess");
      success.textContent = "Registration successful. Opening your dashboard…";
      success.style.display = "block";

      setTimeout(showApp, 450);
    });

    document.getElementById("loginForm").addEventListener("submit", e => {
      e.preventDefault();
      const email = normalizedEmail(document.getElementById("loginEmail").value);
      const password = document.getElementById("loginPassword").value;
      const user = loadUsers().find(u => u.email === email && u.password === password);

      if (!user) return showAuthError("loginError", "Incorrect email or password.");
      localStorage.setItem(AUTH_KEYS.session, user.email);
      localStorage.setItem(KEYS.name, user.name);
      showApp();
    });


    const KEYS = {
      transactions: "fintrackpro_transactions",
      name: "fintrackpro_name",
      currency: "fintrackpro_currency",
      dark: "fintrackpro_dark"
    };
    const symbols = { USD:"$", EUR:"€", GBP:"£", INR:"₹", JPY:"¥" };
    let transactions = loadTransactions();
    let activeFilter = "all";
    let chart = null;

    function loadTransactions() {
      try { return JSON.parse(localStorage.getItem(KEYS.transactions)) || []; }
      catch { return []; }
    }
    function saveTransactions() {
      localStorage.setItem(KEYS.transactions, JSON.stringify(transactions));
    }
    function currencyCode() { return localStorage.getItem(KEYS.currency) || "INR"; }
    function formatMoney(value) {
      const code = currencyCode();
      return `${symbols[code]}${Number(value).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`;
    }
    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[c]));
    }
    function calculateTotals() {
      let income = 0, expense = 0;
      transactions.forEach(t => t.type === "income" ? income += Number(t.amount) : expense += Number(t.amount));
      return { income, expense, balance: income - expense };
    }

    function refresh() {
      updateCards();
      renderTable();
      renderChart();
      updateWelcome();
    }

    function updateCards() {
      const t = calculateTotals();
      document.getElementById("balance").textContent = formatMoney(t.balance);
      document.getElementById("income").textContent = formatMoney(t.income);
      document.getElementById("expense").textContent = formatMoney(t.expense);
      document.getElementById("count").textContent = transactions.length;
    }

    function renderTable() {
      const body = document.getElementById("transactionBody");
      let list = [...transactions].sort((a,b) => b.date.localeCompare(a.date) || b.id - a.id);
      if (activeFilter !== "all") list = list.filter(t => t.type === activeFilter);

      if (!list.length) {
        body.innerHTML = `<tr><td colspan="5" class="empty">No transactions found. Click <strong>+ Add Transaction</strong> to get started.</td></tr>`;
        return;
      }
      body.innerHTML = list.map(t => `
        <tr>
          <td>${escapeHtml(new Date(t.date + "T00:00:00").toLocaleDateString(undefined,{day:"2-digit",month:"short",year:"numeric"}))}</td>
          <td><strong>${escapeHtml(t.description)}</strong></td>
          <td><span class="tag">${escapeHtml(t.category)}</span></td>
          <td class="${t.type === "income" ? "amount-income" : "amount-expense"}">${t.type === "income" ? "+" : "−"}${formatMoney(t.amount)}</td>
          <td><button class="delete" data-id="${t.id}">Delete</button></td>
        </tr>`).join("");

      body.querySelectorAll(".delete").forEach(btn => {
        btn.addEventListener("click", () => deleteTransaction(Number(btn.dataset.id)));
      });
    }

    function renderChart() {
      const ctx = document.getElementById("cashFlowChart");
      if (chart) chart.destroy();

      const grouped = {};
      transactions.forEach(t => {
        if (!grouped[t.date]) grouped[t.date] = {income:0, expense:0};
        grouped[t.date][t.type] += Number(t.amount);
      });
      const dates = Object.keys(grouped).sort();
      const isDark = document.body.classList.contains("dark");
      const grid = isDark ? "#26334b" : "#e6eaf0";
      const text = isDark ? "#9ca9c2" : "#697386";

      chart = new Chart(ctx, {
        type: "bar",
        data: {
          labels: dates.length ? dates.map(d => new Date(d+"T00:00:00").toLocaleDateString(undefined,{day:"2-digit",month:"short"})) : ["No data"],
          datasets: [
            { label:"Income", data: dates.length ? dates.map(d=>grouped[d].income) : [0], backgroundColor:"#16a34a", borderRadius:6, maxBarThickness:38 },
            { label:"Expense", data: dates.length ? dates.map(d=>grouped[d].expense) : [0], backgroundColor:"#dc2626", borderRadius:6, maxBarThickness:38 }
          ]
        },
        options: {
          responsive:true, maintainAspectRatio:false,
          plugins:{ legend:{ labels:{ color:text, usePointStyle:true, boxWidth:8 } }, tooltip:{ callbacks:{ label: c => ` ${c.dataset.label}: ${formatMoney(c.raw)}` } } },
          scales:{
            x:{ stacked:false, grid:{display:false}, ticks:{color:text}},
            y:{ beginAtZero:true, grid:{color:grid}, ticks:{color:text, callback:v=>symbols[currencyCode()]+Number(v).toLocaleString()}}
          }
        }
      });
    }

    function deleteTransaction(id) {
      const item = transactions.find(t => t.id === id);
      if (!item) return;
      if (!confirm(`Delete "${item.description}"?`)) return;
      transactions = transactions.filter(t => t.id !== id);
      saveTransactions();
      refresh();
      toast("Transaction deleted.");
    }

    function openModal() {
      document.getElementById("transactionModal").classList.add("open");
      document.getElementById("formError").style.display = "none";
      document.getElementById("description").focus();
    }
    function closeModal() {
      document.getElementById("transactionModal").classList.remove("open");
      document.getElementById("transactionForm").reset();
      document.getElementById("date").value = today();
      document.querySelector('input[name="type"][value="income"]').checked = true;
    }
    function today() { return new Date().toISOString().slice(0,10); }

    document.getElementById("transactionForm").addEventListener("submit", e => {
      e.preventDefault();
      const form = new FormData(e.target);
      const description = String(form.get("description") || "").trim();
      const amount = Number(form.get("amount"));
      const date = String(form.get("date") || "");
      const category = String(form.get("category") || "");
      const type = String(form.get("type") || "");
      const error = document.getElementById("formError");

      if (!description || !amount || amount <= 0 || !date || !category || !["income","expense"].includes(type)) {
        error.textContent = "Please complete every field with a valid value.";
        error.style.display = "block";
        return;
      }
      transactions.push({ id: Date.now(), type, description, amount, date, category });
      saveTransactions();
      closeModal();
      refresh();
      toast("Transaction saved.");
    });

    function showPage(page) {
      document.querySelectorAll(".page").forEach(p => p.classList.toggle("active", p.id === page));
      document.querySelectorAll(".nav-link").forEach(n => n.classList.toggle("active", n.dataset.page === page));
      window.scrollTo({top:0, behavior:"smooth"});
    }

    function updateWelcome() {
      const name = localStorage.getItem(KEYS.name);
      const hour = new Date().getHours();
      const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
      document.getElementById("welcomeTitle").textContent = name ? `${greeting}, ${name}` : greeting;
    }

    function applyDarkMode() {
      const enabled = localStorage.getItem(KEYS.dark) === "true";
      document.body.classList.toggle("dark", enabled);
      document.getElementById("darkMode").checked = enabled;
    }

    function toast(message) {
      const el = document.getElementById("toast");
      el.textContent = message; el.classList.add("show");
      clearTimeout(window.__toast);
      window.__toast = setTimeout(() => el.classList.remove("show"), 2200);
    }

    document.querySelectorAll(".nav-link").forEach(btn => btn.addEventListener("click", () => showPage(btn.dataset.page)));
    document.getElementById("openModal").addEventListener("click", openModal);
    document.getElementById("closeModal").addEventListener("click", closeModal);
    document.getElementById("cancelModal").addEventListener("click", closeModal);
    document.getElementById("transactionModal").addEventListener("click", e => { if (e.target.id === "transactionModal") closeModal(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

    document.querySelectorAll(".filter").forEach(btn => btn.addEventListener("click", () => {
      activeFilter = btn.dataset.filter;
      document.querySelectorAll(".filter").forEach(b => b.classList.toggle("active", b === btn));
      renderTable();
    }));

    document.getElementById("date").value = today();
    document.getElementById("profileName").value = localStorage.getItem(KEYS.name) || "";
    document.getElementById("currency").value = currencyCode();

    document.getElementById("saveProfile").addEventListener("click", () => {
      const name = document.getElementById("profileName").value.trim();
      localStorage.setItem(KEYS.name, name);
      const email = localStorage.getItem(AUTH_KEYS.session);
      if (email) {
        const users = loadUsers();
        const index = users.findIndex(u => u.email === email);
        if (index >= 0) {
          users[index].name = name;
          saveUsers(users);
        }
      }
      updateWelcome(); toast("Profile saved.");
    });

    document.getElementById("saveCurrency").addEventListener("click", () => {
      localStorage.setItem(KEYS.currency, document.getElementById("currency").value);
      refresh(); toast("Currency updated.");
    });

    document.getElementById("darkMode").addEventListener("change", e => {
      localStorage.setItem(KEYS.dark, String(e.target.checked));
      applyDarkMode();
      renderChart();
      toast(e.target.checked ? "Dark mode enabled." : "Light mode enabled.");
    });

    document.getElementById("resetBtn").addEventListener("click", () => {
      if (!confirm("Reset all transactions, profile, currency, and theme? This cannot be undone.")) return;
      Object.values(KEYS).forEach(k => localStorage.removeItem(k));
      transactions = [];
      activeFilter = "all";
      document.getElementById("profileName").value = "";
      document.getElementById("currency").value = "INR";
      document.querySelectorAll(".filter").forEach(b => b.classList.toggle("active", b.dataset.filter === "all"));
      applyDarkMode();
      refresh();
      toast("All data has been reset.");
    });

    // Simple session check: no real authentication required by the specification.
    document.getElementById("logoutBtn").addEventListener("click", () => {
      if (!confirm("Log out of this session?")) return;
      localStorage.removeItem(AUTH_KEYS.session);
      showAuth();
      toast("Logged out successfully.");
    });

    if (currentUser()) {
      showApp();
    } else {
      showAuth();
    }