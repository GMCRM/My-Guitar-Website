import React, { useMemo, useState } from "react";

const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const colorVars = {
  "--light-green": "#87aa6a",
  "--medium-green": "#66732c",
  "--dark-green": "#535925",
  "--light-brown": "#bc6a1b",
  "--dark-brown": "#602718",
  "--forest-50": "#f4f7f0",
  "--forest-100": "#e8f1dc",
  "--cream-50": "#fef9f5",
  "--cream-100": "#fdf4ed",
} as const;

const pad2 = (value: number) => value.toString().padStart(2, "0");

const dateKey = (year: number, monthIndex: number, day: number) =>
  `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;

const isSameDate = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const buildMonthGrid = (year: number, monthIndex: number) => {
  const firstOfMonth = new Date(year, monthIndex, 1);
  const startDayIndex = firstOfMonth.getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const grid: Array<number | null> = [];

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

export default function HabitTrackerCalendar() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [completedByDate, setCompletedByDate] = useState<Record<string, boolean>>(
    {}
  );

  const monthLabel = useMemo(() => {
    const formatter = new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
    });
    return formatter.format(new Date(viewYear, viewMonth, 1));
  }, [viewYear, viewMonth]);

  const grid = useMemo(
    () => buildMonthGrid(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  const isCurrentMonth =
    viewYear === today.getFullYear() && viewMonth === today.getMonth();

  const handlePreviousMonth = () => {
    const previousMonthDate = new Date(viewYear, viewMonth - 1, 1);
    setViewYear(previousMonthDate.getFullYear());
    setViewMonth(previousMonthDate.getMonth());
  };

  const handleNextMonth = () => {
    if (isCurrentMonth) return;
    const nextMonthDate = new Date(viewYear, viewMonth + 1, 1);
    setViewYear(nextMonthDate.getFullYear());
    setViewMonth(nextMonthDate.getMonth());
  };

  const toggleCompleted = (day: number) => {
    const key = dateKey(viewYear, viewMonth, day);
    setCompletedByDate((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="habit-calendar" style={colorVars}>
      <div className="calendar-header">
        <button
          type="button"
          className="nav-button"
          aria-label="Previous month"
          onClick={handlePreviousMonth}
        >
          5
        </button>
        <div className="month-label">{monthLabel}</div>
        <button
          type="button"
          className="nav-button"
          aria-label="Next month"
          onClick={handleNextMonth}
          disabled={isCurrentMonth}
        >
          7
        </button>
      </div>

      <div className="weekday-row">
        {dayLabels.map((label) => (
          <div key={label} className="weekday-cell">
            {label}
          </div>
        ))}
      </div>

      <div className="calendar-grid">
        {grid.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="day-cell empty" />;
          }

          const key = dateKey(viewYear, viewMonth, day);
          const isCompleted = Boolean(completedByDate[key]);
          const isToday = isSameDate(today, new Date(viewYear, viewMonth, day));

          return (
            <button
              key={key}
              type="button"
              className={`day-cell ${isToday ? "today" : ""}`}
              onClick={() => toggleCompleted(day)}
            >
              <span className="day-number">{day}</span>
              {isCompleted && <span className="completed-indicator" />}
            </button>
          );
        })}
      </div>

      <style>
        {`
          .habit-calendar {
            font-family: "Helvetica Neue", Arial, sans-serif;
            background: var(--cream-50);
            color: var(--dark-brown);
            padding: 24px;
            border-radius: 16px;
            max-width: 520px;
            margin: 0 auto;
            box-shadow: 0 10px 30px rgba(96, 39, 24, 0.12);
          }

          .calendar-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 16px;
          }

          .month-label {
            font-size: 1.4rem;
            font-weight: 700;
            color: var(--dark-green);
            text-align: center;
            flex: 1;
          }

          .nav-button {
            border: none;
            background: var(--forest-100);
            color: var(--dark-green);
            width: 36px;
            height: 36px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 1.2rem;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s ease, opacity 0.2s ease;
          }

          .nav-button:disabled {
            opacity: 0.4;
            cursor: default;
          }

          .weekday-row,
          .calendar-grid {
            display: grid;
            grid-template-columns: repeat(7, minmax(0, 1fr));
            gap: 8px;
          }

          .weekday-cell {
            text-align: center;
            font-size: 0.85rem;
            font-weight: 600;
            color: var(--medium-green);
          }

          .calendar-grid {
            margin-top: 10px;
          }

          .day-cell {
            position: relative;
            border: 1px solid var(--forest-100);
            background: var(--cream-100);
            border-radius: 12px;
            height: 58px;
            cursor: pointer;
            color: var(--dark-brown);
            font-weight: 600;
            font-size: 1rem;
            display: flex;
            align-items: flex-start;
            justify-content: flex-end;
            padding: 8px;
            transition: transform 0.15s ease, border-color 0.2s ease;
          }

          .day-cell:hover {
            transform: translateY(-2px);
            border-color: var(--light-green);
          }

          .day-cell.empty {
            background: transparent;
            border: none;
            cursor: default;
            box-shadow: none;
          }

          .day-cell.today {
            border-color: var(--light-brown);
            box-shadow: 0 0 0 2px rgba(188, 106, 27, 0.2);
          }

          .day-number {
            z-index: 1;
          }

          .completed-indicator {
            position: absolute;
            inset: 8px;
            border-radius: 50%;
            background: var(--light-green);
            opacity: 0.5;
          }
        `}
      </style>
    </div>
  );
}
