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

// ========================================
// Mock Student Practice Data
// ========================================

const MOCK_STUDENTS = [
  "Emma Chen",
  "Liam Rodriguez",
  "Sophia Patel",
  "Noah Williams",
  "Olivia Johnson",
  "Ava Martinez",
  "Jackson Lee",
  "Isabella Kim",
];

// Generate realistic mock practice data for students
const generateMockPracticeData = () => {
  const studentData = {};
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const daysInCurrentMonth = new Date(
    currentYear,
    currentMonth + 1,
    0,
  ).getDate();

  MOCK_STUDENTS.forEach((student) => {
    const practiceDays = new Set();
    const practiceProb = 0.4 + Math.random() * 0.5; // 40-90% practice rate

    for (
      let day = 1;
      day <= Math.min(daysInCurrentMonth, today.getDate());
      day += 1
    ) {
      if (Math.random() < practiceProb) {
        const key = dateKey(currentYear, currentMonth, day);
        practiceDays.add(key);
      }
    }

    studentData[student] = practiceDays;
  });

  return studentData;
};

// ========================================
// Leaderboard Calculations
// ========================================

// Calculate total practice days for a student in current month
const calculateMonthlyPracticeDays = (practiceDays, year, monthIndex) => {
  let count = 0;
  practiceDays.forEach((dateStr) => {
    const [y, m] = dateStr.split("-");
    if (parseInt(y) === year && parseInt(m) === monthIndex + 1) {
      count += 1;
    }
  });
  return count;
};

// Calculate longest consecutive streak in current month
const calculateLongestStreak = (practiceDays, year, monthIndex) => {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  let maxStreak = 0;
  let currentStreak = 0;

  for (let day = 1; day <= daysInMonth; day += 1) {
    const key = dateKey(year, monthIndex, day);
    if (practiceDays.has(key)) {
      currentStreak += 1;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  return maxStreak;
};

// Generate leaderboard for monthly practice days
const generatePracticeDaysLeaderboard = (studentData, year, monthIndex) => {
  const rankings = MOCK_STUDENTS.map((student) => {
    const days = calculateMonthlyPracticeDays(
      studentData[student],
      year,
      monthIndex,
    );
    return { student, days };
  });

  rankings.sort((a, b) => b.days - a.days);
  return rankings.slice(0, 5);
};

// Generate leaderboard for longest streaks
const generateStreakLeaderboard = (studentData, year, monthIndex) => {
  const rankings = MOCK_STUDENTS.map((student) => {
    const streak = calculateLongestStreak(
      studentData[student],
      year,
      monthIndex,
    );
    return { student, streak };
  });

  rankings.sort((a, b) => b.streak - a.streak);
  return rankings.slice(0, 5);
};

// ========================================
// Rendering Functions
// ========================================

const renderPracticeDaysLeaderboard = () => {
  const leaderboard = generatePracticeDaysLeaderboard(
    mockStudentData,
    viewYear,
    viewMonth,
  );
  const listEl = document.getElementById("practiceDaysLeaderboard");

  listEl.innerHTML = "";

  leaderboard.forEach((entry, index) => {
    const li = document.createElement("li");
    li.className = "leaderboard-item";

    const rank = document.createElement("span");
    rank.className = "rank";
    rank.textContent = `${index + 1}.`;

    const name = document.createElement("span");
    name.className = "student-name";
    name.textContent = entry.student;

    const stat = document.createElement("span");
    stat.className = "stat";
    stat.textContent = `${entry.days} ${entry.days === 1 ? "day" : "days"}`;

    li.appendChild(rank);
    li.appendChild(name);
    li.appendChild(stat);
    listEl.appendChild(li);
  });
};

const renderStreakLeaderboard = () => {
  const leaderboard = generateStreakLeaderboard(
    mockStudentData,
    viewYear,
    viewMonth,
  );
  const listEl = document.getElementById("longestStreakLeaderboard");

  listEl.innerHTML = "";

  leaderboard.forEach((entry, index) => {
    const li = document.createElement("li");
    li.className = "leaderboard-item";

    const rank = document.createElement("span");
    rank.className = "rank";
    rank.textContent = `${index + 1}.`;

    const name = document.createElement("span");
    name.className = "student-name";
    name.textContent = entry.student;

    const stat = document.createElement("span");
    stat.className = "stat";
    stat.textContent = `${entry.streak} day ${entry.streak === 1 ? "streak" : "streak"}`;

    li.appendChild(rank);
    li.appendChild(name);
    li.appendChild(stat);
    listEl.appendChild(li);
  });
};

const renderLeaderboards = () => {
  renderPracticeDaysLeaderboard();
  renderStreakLeaderboard();
};

// ========================================
// Calendar State & Elements
// ========================================

const today = new Date();
let viewYear = today.getFullYear();
let viewMonth = today.getMonth();
const completedByDate = {};

// Generate mock data once
const mockStudentData = generateMockPracticeData();

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

  // Update leaderboards when month changes
  renderLeaderboards();
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
