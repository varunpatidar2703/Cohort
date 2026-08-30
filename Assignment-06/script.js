/*
  TaskFlow — Vanilla JavaScript DOM Assignment

  No framework or library is used.
  This file intentionally demonstrates core DOM APIs.
*/

const taskForm = document.getElementById("taskForm");
const taskTitleInput = document.getElementById("taskTitle");
const taskCategoryInput = document.getElementById("taskCategory");
const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const filterCategory = document.getElementById("filterCategory");
const filterStatus = document.getElementById("filterStatus");
const clearAllButton = document.getElementById("clearAll");
const themeToggle = document.getElementById("themeToggle");

const totalCount = document.getElementById("totalCount");
const pendingCount = document.getElementById("pendingCount");
const completedCount = document.getElementById("completedCount");

const valueProperty = document.getElementById("valueProperty");
const valueAttribute = document.getElementById("valueAttribute");

let tasks = JSON.parse(localStorage.getItem("taskflow-tasks") || "[]");

// ---------- Utility ----------

function saveTasks() {
  localStorage.setItem("taskflow-tasks", JSON.stringify(tasks));
}

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// ---------- Task Creation ----------

function createTaskCard(task) {
  // Required: createElement()
  const card = document.createElement("article");

  // Required custom data attributes.
  card.setAttribute("data-id", task.id);
  card.setAttribute("data-status", task.status);
  card.setAttribute("data-category", task.category);

  card.classList.add("task-card");

  if (task.status === "completed") {
    card.classList.add("completed");
  }

  const info = document.createElement("div");
  info.classList.add("task-info");

  const title = document.createElement("h3");
  title.classList.add("task-title");

  // Required: createTextNode()
  title.append(document.createTextNode(task.title));

  const meta = document.createElement("p");
  meta.classList.add("task-meta");

  const statusText = task.status === "completed" ? "Completed" : "Pending";
  meta.append(document.createTextNode(`${task.category} • ${statusText}`));

  info.append(title);
  info.append(meta);

  const actions = document.createElement("div");
  actions.classList.add("task-actions");

  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "action-btn edit";
  editButton.dataset.action = "edit";
  editButton.append(document.createTextNode("✏️ Edit"));

  const completeButton = document.createElement("button");
  completeButton.type = "button";
  completeButton.className = "action-btn complete";
  completeButton.dataset.action = "complete";
  completeButton.append(
    document.createTextNode(task.status === "completed" ? "↩️ Undo" : "✓ Complete")
  );

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "action-btn delete";
  deleteButton.dataset.action = "delete";
  deleteButton.append(document.createTextNode("🗑️ Delete"));

  actions.append(editButton, completeButton, deleteButton);

  // append()
  card.append(info, actions);

  // before(), after(), replaceWith() and remove() are demonstrated
  // in the edit/delete helper functions below.

  return card;
}

function renderTasks() {
  taskList.replaceChildren();

  const searchTerm = searchInput.value.trim().toLowerCase();
  const category = filterCategory.value;
  const status = filterStatus.value;

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm);
    const matchesCategory = category === "all" || task.category === category;
    const matchesStatus = status === "all" || task.status === status;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Required bonus: DocumentFragment
  const fragment = document.createDocumentFragment();

  filteredTasks.forEach((task) => {
    fragment.append(createTaskCard(task));
  });

  taskList.append(fragment);

  emptyState.hidden = filteredTasks.length !== 0;
  emptyState.textContent = tasks.length === 0
    ? "No tasks yet. Add your first task above."
    : "No tasks match your current search/filter.";

  updateCounters();
}

function updateCounters() {
  const completed = tasks.filter((task) => task.status === "completed").length;
  const pending = tasks.length - completed;

  totalCount.textContent = tasks.length;
  pendingCount.textContent = pending;
  completedCount.textContent = completed;
}

// ---------- Add Task ----------

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = taskTitleInput.value.trim();

  if (!title) {
    taskTitleInput.focus();
    return;
  }

  const newTask = {
    id: createId(),
    title,
    category: taskCategoryInput.value,
    status: "pending"
  };

  tasks.push(newTask);
  saveTasks();
  renderTasks();

  taskForm.reset();
  taskTitleInput.focus();
});

// ---------- Event Delegation ----------

/*
  Instead of adding 3 listeners to every task card, we add ONE listener
  to the parent #taskList.

  The event bubbles from the clicked button -> task card -> taskList.
  We inspect event.target.closest() to determine which action was clicked.
*/
taskList.addEventListener("click", (event) => {
  const actionButton = event.target.closest("[data-action]");

  if (!actionButton) return;

  const card = actionButton.closest("[data-id]");
  if (!card) return;

  // dataset reads data-id without manually calling getAttribute().
  const id = card.dataset.id;
  const action = actionButton.dataset.action;

  if (action === "delete") {
    deleteTask(id, card);
  }

  if (action === "edit") {
    editTask(id, card);
  }

  if (action === "complete") {
    toggleComplete(id, card);
  }
});

// ---------- Complete ----------

function toggleComplete(id, card) {
  const task = tasks.find((item) => item.id === id);
  if (!task) return;

  task.status = task.status === "completed" ? "pending" : "completed";

  // setAttribute() updates the custom data-status attribute.
  card.setAttribute("data-status", task.status);

  // classList manipulates CSS classes.
  card.classList.toggle("completed", task.status === "completed");

  saveTasks();
  renderTasks();
}

// ---------- Delete ----------

function deleteTask(id, card) {
  if (!confirm("Delete this task?")) return;

  tasks = tasks.filter((task) => task.id !== id);
  saveTasks();

  // Required: remove()
  card.remove();

  renderTasks();
}

// ---------- Edit + replaceWith() ----------

function editTask(id, card) {
  const task = tasks.find((item) => item.id === id);
  if (!task) return;

  const input = document.createElement("input");
  input.type = "text";
  input.value = task.title;
  input.className = "edit-input";
  input.setAttribute("aria-label", "Edit task title");

  const saveButton = document.createElement("button");
  saveButton.type = "button";
  saveButton.className = "action-btn complete";
  saveButton.append(document.createTextNode("💾 Save"));

  const cancelButton = document.createElement("button");
  cancelButton.type = "button";
  cancelButton.className = "action-btn";
  cancelButton.append(document.createTextNode("Cancel"));

  const editor = document.createElement("div");
  editor.style.display = "flex";
  editor.style.flex = "1";
  editor.style.gap = "8px";
  editor.append(input, saveButton, cancelButton);

  // Required: before()
  card.before(document.createComment("Edit mode starts here"));

  // Required: after()
  card.after(document.createComment("Edit mode is active"));

  // Required: replaceWith()
  card.replaceWith(editor);
  input.focus();
  input.select();

  saveButton.addEventListener("click", () => {
    const newTitle = input.value.trim();

    if (!newTitle) {
      input.focus();
      return;
    }

    task.title = newTitle;
    saveTasks();
    renderTasks();
  });

  cancelButton.addEventListener("click", () => {
    renderTasks();
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") saveButton.click();
    if (event.key === "Escape") cancelButton.click();
  });
}

// ---------- Attributes vs Properties ----------

/*
  IMPORTANT DIFFERENCE:

  input.value
    = a DOM PROPERTY representing the input's CURRENT live value.

  input.getAttribute("value")
    = the HTML ATTRIBUTE value written in the markup.

  Changing input.value does NOT automatically change the "value" attribute.

  Example:
    <input value="Initial">

    input.value = "Changed";
    input.getAttribute("value") still returns "Initial".

  This is why properties and attributes should not be treated as identical.
*/
taskTitleInput.addEventListener("input", () => {
  valueProperty.textContent = taskTitleInput.value || "(empty)";
  valueAttribute.textContent =
    taskTitleInput.getAttribute("value") ?? "(no value attribute)";
});

function showAttributeExamples() {
  // getAttribute()
  const currentId = document.body.getAttribute("data-theme");

  // hasAttribute()
  const hasTheme = document.body.hasAttribute("data-theme");

  console.log("getAttribute('data-theme'):", currentId);
  console.log("hasAttribute('data-theme'):", hasTheme);

  // setAttribute() is used by the theme toggle and task cards.

  // removeAttribute() demonstration:
  const demo = document.createElement("div");
  demo.setAttribute("data-demo", "temporary");
  console.log("Before removeAttribute:", demo.hasAttribute("data-demo"));
  demo.removeAttribute("data-demo");
  console.log("After removeAttribute:", demo.hasAttribute("data-demo"));
}

showAttributeExamples();

// ---------- Theme Toggle ----------

function setTheme(theme) {
  // dataset
  document.documentElement.dataset.theme = theme;

  // setAttribute()
  document.body.setAttribute("data-theme", theme);

  document.documentElement.classList.toggle("dark-theme", theme === "dark");
  document.body.classList.toggle("dark-theme", theme === "dark");

  themeToggle.dataset.currentTheme = theme;
  themeToggle.setAttribute("aria-pressed", String(theme === "dark"));

  themeToggle.textContent = theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode";

  localStorage.setItem("taskflow-theme", theme);
}

themeToggle.addEventListener("click", () => {
  const currentTheme = document.body.dataset.theme || "light";
  setTheme(currentTheme === "light" ? "dark" : "light");
});

// ---------- Search / Filters ----------

searchInput.addEventListener("input", renderTasks);
filterCategory.addEventListener("change", renderTasks);
filterStatus.addEventListener("change", renderTasks);

// ---------- Clear All ----------

clearAllButton.addEventListener("click", () => {
  if (tasks.length === 0) return;

  if (!confirm("Delete all tasks?")) return;

  tasks = [];
  saveTasks();
  renderTasks();
});

// ---------- Event Propagation: Bubbling & Capturing ----------

const grandparent = document.getElementById("grandparent");
const parent = document.getElementById("parent");
const propagationButton = document.getElementById("propagationButton");

/*
  CAPTURING phase:
  The event travels DOWN the DOM tree:
  Grandparent -> Parent -> Child
*/
grandparent.addEventListener(
  "click",
  () => console.log("CAPTURING: Grandparent"),
  true
);

parent.addEventListener(
  "click",
  () => console.log("CAPTURING: Parent"),
  true
);

propagationButton.addEventListener(
  "click",
  () => console.log("CAPTURING: Child"),
  true
);

/*
  BUBBLING phase:
  The event travels UP the DOM tree:
  Child -> Parent -> Grandparent

  addEventListener's third parameter defaults to false,
  meaning the bubbling phase is used.
*/
grandparent.addEventListener("click", () => {
  console.log("BUBBLING: Grandparent");
});

parent.addEventListener("click", () => {
  console.log("BUBBLING: Parent");
});

propagationButton.addEventListener("click", () => {
  console.log("BUBBLING: Child");
});

// ---------- Initial Load ----------

const savedTheme = localStorage.getItem("taskflow-theme") || "light";
setTheme(savedTheme);
renderTasks();

valueProperty.textContent = taskTitleInput.value || "(empty)";
valueAttribute.textContent =
  taskTitleInput.getAttribute("value") ?? "(no value attribute)";
