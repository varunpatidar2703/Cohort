# TaskFlow — Vanilla JavaScript Task Manager

A complete beginner-friendly implementation of the DOM assignment using only:

- HTML
- CSS
- Vanilla JavaScript
- Browser APIs such as DOM and LocalStorage

## How to run

1. Extract/open this folder.
2. Double-click `index.html`, or use VS Code Live Server.
3. Open browser DevTools → Console to see the event propagation demonstration.

## Features

### Required
- Task creation form
- Dynamic task cards
- `createElement()`
- `createTextNode()`
- `append()`
- `prepend()`
- `before()`
- `after()`
- `replaceWith()`
- `remove()`
- `data-id`
- `data-status`
- `data-category`
- `getAttribute()`
- `setAttribute()`
- `removeAttribute()`
- `hasAttribute()`
- `dataset`
- Attributes vs Properties demonstration
- Dark/light theme
- `classList`
- `addEventListener()`
- Event delegation
- Event bubbling
- Event capturing
- Browser rendering pipeline visual section

### Bonus
- Search
- Category filter
- Status filter
- Total/pending/completed counters
- Clear all
- DocumentFragment
- LocalStorage

## Important learning notes

### Attributes vs Properties

For an input such as:

```html
<input value="Initial">
```

`input.value` is the current live DOM property.

`input.getAttribute("value")` reads the original/current HTML attribute.

For example:

```js
input.value = "Changed";

console.log(input.value);                 // Changed
console.log(input.getAttribute("value")); // Initial
```

The assignment intentionally displays this difference in the UI.

### Event Delegation

Only one `click` listener is attached to `#taskList`.

The listener checks:

```js
event.target.closest("[data-action]")
```

This means newly created task cards also work without creating new listeners for each card.

### Bubbling

```text
Child
  ↓
Parent
  ↓
Grandparent
```

The event starts at the target and travels upward.

### Capturing

```text
Grandparent
  ↓
Parent
  ↓
Child
```

The event travels from the top of the event path toward the target before the target handler runs.

## Suggested assignment demonstration

When submitting, show your instructor:

1. Add a task.
2. Inspect the task card and show its `data-*` attributes.
3. Complete the task and show `data-status` changing.
4. Edit the task.
5. Delete the task.
6. Search/filter tasks.
7. Toggle dark mode and inspect `data-theme`.
8. Type into Task Title and compare Property vs Attribute.
9. Open Console and click Child Button to demonstrate capturing and bubbling.
10. Explain the rendering pipeline section.
