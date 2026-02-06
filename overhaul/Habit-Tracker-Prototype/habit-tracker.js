const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const pad2 = (value) => value.toString().padStart(2, "0");

const dateKey = (year, monthIndex, day) =>
  `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;

const isSameDate = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const buildMonthGrid = (year, monthIndex) => {
  const firstOfMonth = new Date(year, monthIndex, 1);
  const startDayIndex = firstOfMonth.getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const grid = [];

  // Leading empty slots for the first week
  for (let i = 0; i < startDayIndex; i += 1) {
    grid.push(null);
  }

  // Actual day numbers
  for (let day = 1; day <= daysInMonth; day += 1) {
    grid.push(day);
  }

  // Trailing empty slots to complete the final week
  while (grid.length % 7 !== 0) {
    grid.push(null);
  }

  return grid;
};

const today = new Date();
let viewYear = today.getFullYear();
let viewMonth = today.getMonth();
const completedByDate = {};

const monthLabelEl = document.getElementById("monthLabel");
const prevButton = document.getElementById("prevMonth");
const nextButton = document.getElementById("nextMonth");
const weekdayRow = document.getElementById("weekdayRow");
const calendarGrid = document.getElementById("calendarGrid");

const renderWeekdayLabels = () => {
  weekdayRow.innerHTML = "";
  dayLabels.forEach((label) => {
    const cell = document.createElement("div");
    cell.className = "weekday-cell";
    cell.textContent = label;
    weekdayRow.appendChild(cell);
  });
};

const renderMonth = () => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  });
  monthLabelEl.textContent = formatter.format(new Date(viewYear, viewMonth, 1));

  const isCurrentMonth =
    viewYear === today.getFullYear() && viewMonth === today.getMonth();
  nextButton.disabled = isCurrentMonth;

  const grid = buildMonthGrid(viewYear, viewMonth);
  calendarGrid.innerHTML = "";

  grid.forEach((day, index) => {
    if (!day) {
      const emptyCell = document.createElement("div");
      emptyCell.className = "day-cell empty";
      emptyCell.setAttribute("aria-hidden", "true");
      emptyCell.dataset.index = String(index);
      calendarGrid.appendChild(emptyCell);
      return;
    }

    const key = dateKey(viewYear, viewMonth, day);
    const isCompleted = Boolean(completedByDate[key]);
    const isToday = isSameDate(today, new Date(viewYear, viewMonth, day));

    const button = document.createElement("button");
    button.type = "button";
    button.className = `day-cell${isToday ? " today" : ""}`;
    button.setAttribute("aria-pressed", isCompleted ? "true" : "false");

    const dayNumber = document.createElement("span");
    dayNumber.className = "day-number";
    dayNumber.textContent = String(day);
    button.appendChild(dayNumber);

    if (isCompleted) {
      const indicator = document.createElement("span");
      indicator.className = "completed-indicator";
      button.appendChild(indicator);
    }

    button.addEventListener("click", () => {
      completedByDate[key] = !completedByDate[key];
      renderMonth();
    });

    calendarGrid.appendChild(button);
  });
};

prevButton.addEventListener("click", () => {
  const previousMonthDate = new Date(viewYear, viewMonth - 1, 1);
  viewYear = previousMonthDate.getFullYear();
  viewMonth = previousMonthDate.getMonth();
  renderMonth();
});

nextButton.addEventListener("click", () => {
  const isCurrentMonth =
    viewYear === today.getFullYear() && viewMonth === today.getMonth();
  if (isCurrentMonth) return;

  const nextMonthDate = new Date(viewYear, viewMonth + 1, 1);
  viewYear = nextMonthDate.getFullYear();
  viewMonth = nextMonthDate.getMonth();
  renderMonth();
});

renderWeekdayLabels();
renderMonth();
