const workoutInput = document.getElementById("workoutDetails");
const detectedType = document.getElementById("detectedType");
const previewWorkout = document.getElementById("previewWorkout");
const addBtn = document.getElementById("addBtn");

function parseWorkout(text) {
  const lower = text.toLowerCase();
  let type = "General Workout";
  if (lower.includes("run") || lower.includes("cardio") || lower.includes("km"))
    type = "Cardio";
  if (
    lower.includes("bench") ||
    lower.includes("squat") ||
    lower.includes("deadlift")
  )
    type = "Strength Training";
  if (lower.includes("hyrox") || lower.includes("sled"))
    type = "Hyrox / Functional";
  if (
    lower.includes("amrap") ||
    lower.includes("emom") ||
    lower.includes("rounds")
  )
    type = "CrossFit";

  const formatted = text
    .replace(/\b(\d+)\s?(reps?|sets?)\b/gi, "<strong>$1 $2</strong>")
    .replace(
      /\b(\d+)\s?(min|minutes?|km|m|seconds?)\b/gi,
      "<strong>$1 $2</strong>"
    )
    .replace(/\b(AMRAP|EMOM|RFT|RX)\b/gi, "<strong>$1</strong>");

  return { type, formatted };
}

workoutInput.addEventListener("input", () => {
  const text = workoutInput.value.trim();
  if (!text) {
    detectedType.textContent = "";
    previewWorkout.textContent = "";
    return;
  }

  const { type, formatted } = parseWorkout(text);
  detectedType.textContent = `Detected Type: ${type}`;
  previewWorkout.innerHTML = formatted;
});

addBtn.addEventListener("click", () => {
  const text = workoutInput.value.trim();
  if (!text) return;

  const { type, formatted } = parseWorkout(text);

  // ✅ save to localStorage (simulating database)
  const workoutData = {
    type,
    content: formatted,
    date: new Date().toLocaleString(),
  };

  localStorage.setItem("currentWorkout", JSON.stringify(workoutData));

  alert("✅ Workout added! It will appear on the user page.");
  workoutInput.value = "";
  detectedType.textContent = "";
  previewWorkout.textContent = "";
});

document.addEventListener("DOMContentLoaded", () => {
  const data = localStorage.getItem("currentWorkout");
  if (!data) return;

  const { content, type, date } = JSON.parse(data);

  const wrapper = document.getElementById("workoutTextWrapper");
  const text = document.getElementById("workoutText");
  const title = document.getElementById("workout-title");
  const time = document.getElementById("workout-time");
  const day = document.getElementById("workout-day");

  text.innerHTML = content;
  wrapper.style.display = "block";

  title.textContent = `${type} Session`;
  time.textContent = new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  day.textContent = new Date(date).toLocaleDateString([], {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
});

// Dynamic navbar background on scroll
window.addEventListener("scroll", function () {
  const navbar = document.getElementById("navbar");
  if (navbar) {
    navbar.classList.toggle("scrolled", window.scrollY > 50);
  }
});

// Weekly planner / reminders
(function () {
  const grid = document.getElementById("weekGrid");
  const label = document.getElementById("weekLabel");
  const prev = document.getElementById("prevWeek");
  const next = document.getElementById("nextWeek");
  const toast = document.getElementById("reminderToast");
  if (!grid || !label || !prev || !next) return;

  const MS_DAY = 86400000;
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  let anchor = new Date();

  function startOfWeek(d) {
    const date = new Date(d);
    const diff = date.getDate() - date.getDay(); // Sunday start
    return new Date(date.setDate(diff));
  }

  function formatShort(date) {
    return `${weekdays[date.getDay()]} ${date.getDate()}`;
  }

  function render() {
    const start = startOfWeek(anchor);
    const end = new Date(start.getTime() + MS_DAY * 6);
    label.textContent = `${start.toLocaleDateString(
      "en-GB"
    )} - ${end.toLocaleDateString("en-GB")}`;
    grid.innerHTML = "";

    for (let i = 0; i < 7; i++) {
      const day = new Date(start.getTime() + MS_DAY * i);
      const dayEl = document.createElement("div");
      dayEl.className = "day-card";

      const header = document.createElement("div");
      header.className = "day-header";
      header.innerHTML = `<span>${formatShort(day)}</span>`;

      const sessions = document.createElement("div");
      sessions.className = "day-sessions";

      // Example: add stuff to the calendar -----------------------------------------------------
      const isMon = day.getDay() === 1;
      const isTue = day.getDay() === 2;
      const isWed = day.getDay() === 3;
      const isThu = day.getDay() === 4;
      const isFri = day.getDay() === 5;
      const isSat = day.getDay() === 6;
      const isSun = day.getDay() === 0;
      if (isMon) {
        addSession(sessions, "LOWER STRENGTH + EASY RUN", "06:00", day);
      }
      if (isTue) {
        addSession(sessions, "MOBILITY + RECOVERY", "06:00", day);
      }
      if (isWed) {
        addSession(sessions, "CONDITIONING / ROW FOCUS", "06:00", day);
      }
      if (isWed) {
        addSession(sessions, "ELEV8 RUN CLUB", "18:00", day);
      }

      if (isThu) {
        addSession(sessions, "MOBILITY + RECOVERY", "06:00", day);
      }
      if (isFri) {
        addSession(sessions, "PUSH / CORE", "06:00", day);
      }
      if (isSat) {
        addSession(sessions, "HYROX SATURDAY", "07:30", day);
      }
      if (isSun) {
        addSession(sessions, "LONG RUN + CORE", "06:00", day);
      }

      dayEl.appendChild(header);
      dayEl.appendChild(sessions);
      grid.appendChild(dayEl);
    }
  }

  function addSession(container, name, time, dayDate) {
    const pill = document.createElement("div");
    pill.className = "session-pill";
    pill.innerHTML = `<span>${time} • ${name}</span>`;
    const btn = document.createElement("button");
    btn.className = "remind-btn";
    btn.textContent = "Remind";
    btn.addEventListener("click", function () {
      const dt = combineDateAndTime(dayDate, time);
      ensureNotificationPermission().then((allowed) => {
        if (!allowed) {
          if (toast)
            toast.textContent = "Enable notifications to receive reminders.";
          setTimeout(() => {
            if (toast) toast.textContent = "";
          }, 2000);
          return;
        }
        const rem = { name, time, when: dt.getTime() };
        storeReminder(rem);
        scheduleReminder(rem);
        if (toast)
          toast.textContent = `Reminder set for ${name} at ${formatTime(dt)}.`;
        setTimeout(() => {
          if (toast && toast.textContent.includes(name)) toast.textContent = "";
        }, 2000);
      });
    });

    const addCal = document.createElement("button");
    addCal.className = "addcal-btn";
    addCal.textContent = "+ Calendar";
    addCal.addEventListener("click", function () {
      const dt = combineDateAndTime(dayDate, time);
      downloadICS({
        title: name,
        description: `${name} class`,
        start: dt,
        durationMinutes: 60,
      });
    });

    pill.appendChild(btn);
    pill.appendChild(addCal);
    container.appendChild(pill);
  }

  function combineDateAndTime(dayDate, hhmm) {
    const [hh, mm] = hhmm.split(":").map((v) => parseInt(v, 10));
    const d = new Date(dayDate);
    d.setHours(hh, mm, 0, 0);
    return d;
  }

  function formatTime(d) {
    return d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  function ensureNotificationPermission() {
    return new Promise((resolve) => {
      if (!("Notification" in window)) return resolve(false);
      if (Notification.permission === "granted") return resolve(true);
      if (Notification.permission !== "denied") {
        Notification.requestPermission().then((perm) =>
          resolve(perm === "granted")
        );
      } else {
        resolve(false);
      }
    });
  }

  function scheduleReminder(rem) {
    const delay = rem.when - Date.now();
    if (delay <= 0) return;
    setTimeout(() => {
      try {
        new Notification(rem.name, { body: `Starting at ${rem.time}` });
      } catch {}
    }, Math.min(delay, 2147483647));
  }

  function storeReminder(rem) {
    try {
      const list = JSON.parse(localStorage.getItem("reminders") || "[]");
      list.push(rem);
      localStorage.setItem("reminders", JSON.stringify(list));
    } catch {}
  }

  // Restore scheduled reminders on load
  (function restore() {
    try {
      const list = JSON.parse(localStorage.getItem("reminders") || "[]");
      list.forEach((r) => scheduleReminder(r));
    } catch {}
  })();

  function pad(n) {
    return n.toString().padStart(2, "0");
  }
  function toICSDate(dt) {
    const y = dt.getUTCFullYear();
    const m = pad(dt.getUTCMonth() + 1);
    const d = pad(dt.getUTCDate());
    const hh = pad(dt.getUTCHours());
    const mm = pad(dt.getUTCMinutes());
    const ss = "00";
    return `${y}${m}${d}T${hh}${mm}${ss}Z`;
  }
  function escapeICS(s) {
    return String(s)
      .replace(/\\/g, "\\\\")
      .replace(/\n/g, "\\n")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;");
  }
  function downloadICS({ title, description, start, durationMinutes }) {
    const end = new Date(start.getTime() + durationMinutes * 60000);
    const uid = `${start.getTime()}-${Math.random()
      .toString(36)
      .slice(2)}@elev8`;
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//ELEV8//Schedule//EN",
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${toICSDate(new Date())}`,
      `DTSTART:${toICSDate(start)}`,
      `DTEND:${toICSDate(end)}`,
      `SUMMARY:${escapeICS(title)}`,
      `DESCRIPTION:${escapeICS(description)}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, "_")}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  prev.addEventListener("click", function () {
    anchor = new Date(anchor.getTime() - MS_DAY * 7);
    render();
  });
  next.addEventListener("click", function () {
    anchor = new Date(anchor.getTime() + MS_DAY * 7);
    render();
  });

  render();
})();

// Hamburger menu toggle for mobile
const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("mobileNavLinks");
if (hamburger && navLinks) {
  hamburger.addEventListener("click", function () {
    navLinks.classList.toggle("open");
  });
}

// Utility: Get next weekday date with ordinal suffix
function getWeekdayDate(targetDay) {
  const today = new Date();
  const dayOfWeek = today.getDay();
  let diff = targetDay - dayOfWeek;
  if (diff < 0) diff += 7;
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + diff);

  const options = {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  };
  let dateStr = targetDate.toLocaleDateString("en-GB", options);

  // Ordinal suffix
  const dayNum = targetDate.getDate();
  let suffix = "th";
  if (dayNum % 10 === 1 && dayNum !== 11) suffix = "st";
  else if (dayNum % 10 === 2 && dayNum !== 12) suffix = "nd";
  else if (dayNum % 10 === 3 && dayNum !== 13) suffix = "rd";
  dateStr = dateStr.replace(dayNum, `${dayNum}${suffix}`);

  return dateStr;
}

// Set dates for session cards
const dateMap = {
  "monday-date": 1, // Monday
  "tuesday-date": 2, // Tuesday
  "wednesday-date": 3, // Wednesday
  "thursday-date": 4, // Thursday
  "friday-date": 5, // Friday
  "saturday-date": 6, // Saturday
  "sunday-date": 0, // Sunday
};
Object.entries(dateMap).forEach(([id, dayNum]) => {
  const el = document.getElementById(id);
  if (el) el.textContent = getWeekdayDate(dayNum);
});

// Example class start time (replace with dynamic values if needed)

const classStart = new Date("2025-09-05T06:00:00+01:00"); // 6:00 am BST, 5 Sept 2025

function formatClassTime(date) {
  const options = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/London",
  };
  return `Started: ${date
    .toLocaleDateString("en-GB", options)
    .replace(",", "")} at ${date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/London",
  })} BST`;
}

window.addEventListener("DOMContentLoaded", function () {
  const now = new Date();
  if (now >= classStart) {
    document.getElementById("bookingStatus").style.display = "block";
    document.getElementById("classStartedTime").textContent =
      formatClassTime(classStart);
  }
});

// Show more / less sessions toggle
const toggleText = document.getElementById("toggleSessionsText");
const hiddenCards = document.querySelectorAll(".session-card.hidden");
let showingMore = false;
if (toggleText) {
  toggleText.addEventListener("click", function () {
    showingMore = !showingMore;
    hiddenCards.forEach((card) => {
      card.style.display = showingMore ? "block" : "none";
    });
    toggleText.textContent = showingMore ? "Show Less" : "Show More";
  });
}

document.querySelectorAll(".session-card").forEach((card) => {
  const dateStr = card.getAttribute("data-date");
  if (dateStr) {
    const date = new Date(dateStr);
    const options = { weekday: "long" };
    const day = date.toLocaleDateString("en-GB", options);
    const daySpan = card.querySelector(".session-day");
    if (daySpan) daySpan.textContent = day;
  }
});

document.querySelectorAll(".session-group").forEach((group) => {
  const dayNum = parseInt(group.getAttribute("data-day"), 10);
  const dateHeading = group.querySelector(".session-date");
  if (dateHeading) dateHeading.textContent = getWeekdayDate(dayNum);
});

// Workout page: copy and toggle logic (delegated; safe if elements absent)
window.addEventListener("DOMContentLoaded", function () {
  const copyBtn = document.getElementById("copyWorkoutBtn");
  const workoutText = document.getElementById("workoutText");
  if (copyBtn && workoutText) {
    copyBtn.addEventListener("click", function () {
      const text = workoutText.innerText.trim();
      if (!text) return;
      navigator.clipboard
        .writeText(text)
        .then(function () {
          const original = copyBtn.textContent;
          copyBtn.textContent = "Copied!";
          setTimeout(function () {
            copyBtn.textContent = original;
          }, 1200);
        })
        .catch(function () {
          const textarea = document.createElement("textarea");
          textarea.value = text;
          document.body.appendChild(textarea);
          textarea.select();
          try {
            document.execCommand("copy");
          } catch (e) {}
          document.body.removeChild(textarea);
        });
    });
  }

  const toggleBtn = document.getElementById("toggleWorkoutBtn");
  const wrapper = document.getElementById("workoutTextWrapper");
  const card = document.getElementById("workoutDetail");
  if (toggleBtn && wrapper) {
    // Initialize collapsed
    wrapper.style.maxHeight = "0px";
    toggleBtn.setAttribute("aria-expanded", "false");
    toggleBtn.textContent = "Show workout";

    toggleBtn.addEventListener("click", function () {
      const isOpen = wrapper.classList.toggle("open");
      toggleBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
      toggleBtn.textContent = isOpen ? "Hide workout" : "Show workout";
      if (isOpen) {
        wrapper.style.maxHeight = wrapper.scrollHeight + "px";
        if (card) card.classList.add("expanded");
      } else {
        wrapper.style.maxHeight = "0px";
        if (card) card.classList.remove("expanded");
      }
    });
  }

  // Subscribe form
  const subscribeForm = document.getElementById("subscribeForm");
  const subscribeEmail = document.getElementById("subscribeEmail");
  const subscribeMessage = document.getElementById("subscribeMessage");
  if (subscribeForm && subscribeEmail && subscribeMessage) {
    subscribeForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const email = subscribeEmail.value.trim();
      const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!valid) {
        subscribeMessage.textContent = "Please enter a valid email.";
        subscribeMessage.style.color = "#ff6b6b";
        return;
      }
      // Simulate success
      subscribeMessage.textContent = "Thanks! You're subscribed.";
      subscribeMessage.style.color = "#9eff9e";
      subscribeEmail.value = "";
    });
  }
});

// Simple auth and tracker
(function () {
  const loginForm = document.getElementById("loginForm");
  const authEmail = document.getElementById("authEmail");
  const authPassword = document.getElementById("authPassword");
  const authMessage = document.getElementById("authMessage");
  const logoutBtn = document.getElementById("logoutBtn");
  const logForm = document.getElementById("logForm");
  const logDate = document.getElementById("logDate");
  const logTitle = document.getElementById("logTitle");
  const logMetric = document.getElementById("logMetric");
  const logsTbody = document.getElementById("logsTbody");
  const logsEmpty = document.getElementById("logsEmpty");
  const statMonthCount = document.getElementById("statMonthCount");

  function getUserKey() {
    try {
      return localStorage.getItem("userEmail") || null;
    } catch {
      return null;
    }
  }

  if (loginForm && authEmail && authPassword) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const email = authEmail.value.trim();
      const pwd = authPassword.value.trim();
      if (!email || !pwd) {
        if (authMessage) authMessage.textContent = "Enter email and password.";
        return;
      }
      try {
        localStorage.setItem("userEmail", email);
        localStorage.setItem(`user:${email}:password`, pwd);
        window.location.href = "account.html";
      } catch {
        if (authMessage)
          authMessage.textContent = "Unable to store credentials.";
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      try {
        localStorage.removeItem("userEmail");
      } catch {}
      window.location.href = "login.html";
    });
  }

  function renderLogs(email) {
    if (!logsTbody || !logsEmpty) return;
    logsTbody.innerHTML = "";
    try {
      const raw = localStorage.getItem(`user:${email}:logs`) || "[]";
      const logs = JSON.parse(raw);
      logs.sort((a, b) => b.date.localeCompare(a.date));

      // monthly count
      if (statMonthCount) {
        const now = new Date();
        const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
          2,
          "0"
        )}`;
        const count = logs.filter((l) => (l.date || "").startsWith(ym)).length;
        statMonthCount.textContent = String(count);
      }

      if (logs.length === 0) {
        logsEmpty.style.display = "block";
        return;
      }
      logsEmpty.style.display = "none";

      logs.forEach((log, idx) => {
        const tr = document.createElement("tr");
        const tdDate = document.createElement("td");
        const tdTitle = document.createElement("td");
        const tdMetric = document.createElement("td");
        const tdAct = document.createElement("td");
        tdDate.textContent = log.date;
        tdTitle.textContent = log.title;
        tdMetric.textContent = log.metric || "";
        const del = document.createElement("button");
        del.className = "log-del";
        del.textContent = "Delete";
        del.addEventListener("click", function () {
          deleteLog(email, idx);
        });
        tdAct.appendChild(del);
        tr.appendChild(tdDate);
        tr.appendChild(tdTitle);
        tr.appendChild(tdMetric);
        tr.appendChild(tdAct);
        logsTbody.appendChild(tr);
      });
    } catch {}
  }

  function deleteLog(email, index) {
    try {
      const key = `user:${email}:logs`;
      const list = JSON.parse(localStorage.getItem(key) || "[]");
      list.splice(index, 1);
      localStorage.setItem(key, JSON.stringify(list));
      renderLogs(email);
    } catch {}
  }

  if (logForm && logDate && logTitle) {
    const email = getUserKey();
    if (!email) {
      window.location.href = "login.html";
      return;
    }
    renderLogs(email);
    logForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const date = logDate.value;
      const title = logTitle.value.trim();
      const metric = logMetric ? logMetric.value.trim() : "";
      if (!date || !title) return;
      try {
        const key = `user:${email}:logs`;
        const list = JSON.parse(localStorage.getItem(key) || "[]");
        list.push({ date, title, metric });
        localStorage.setItem(key, JSON.stringify(list));
        renderLogs(email);
        logTitle.value = "";
        if (logMetric) logMetric.value = "";
      } catch {}
    });
  }
})();

// Workout tracker with Chart.js
// Requires <canvas id="progressChart"></canvas> and Chart.js included
// Example HTML structure:
document.addEventListener("DOMContentLoaded", () => {
  const store = {
    run: { data: [], labels: [], distances: [], unit: "min" },
    ski: { data: [], labels: [], distances: [], unit: "min" },
    row: { data: [], labels: [], distances: [], unit: "min" },
    weights: { data: [], labels: [], distances: [], unit: "kg" },
  };

  let currentType = "run";

  // LocalStorage helpers
  function saveData() {
    localStorage.setItem("trackerStore", JSON.stringify(store));
  }
  function loadData() {
    const saved = localStorage.getItem("trackerStore");
    if (saved) {
      const parsed = JSON.parse(saved);
      for (let type in parsed) {
        store[type] = parsed[type];
      }
    }
  }
  loadData();

  // Elements
  const canvas = document.getElementById("progressChart");
  const ctx = canvas.getContext("2d");
  const btns = document.querySelectorAll(".tracker-btn");
  const form = document.getElementById("logForm");
  const timeInput = document.getElementById("workoutValue");
  const distanceInput = document.getElementById("workoutDistance");
  const summary = document.getElementById("paceSummary");
  const undoBtn = document.getElementById("undoBtn");
  const chartScroll = document.getElementById("chartScroll");

  // Chart
  const chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Progress",
          data: [],
          borderColor: "#ffd700",
          backgroundColor: "rgba(255,215,0,0.15)",
          tension: 0.25,
          fill: true,
          pointRadius: 5,
          pointHoverRadius: 8,
          hitRadius: 15, // 🔥 easier to click/tap
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const idx = ctx.dataIndex;
              const val = ctx.raw;
              if (currentType === "weights") return `Weight: ${val} kg`;
              const distance =
                store[currentType].distances[idx] ||
                (currentType === "run" ? 5 : 500);
              const pace =
                val / (currentType === "run" ? distance : distance / 500);
              const seconds = Math.round(pace * 60);
              const mm = Math.floor(seconds / 60);
              const ss = seconds % 60;
              return `Time: ${val} min — Distance: ${distance}${
                currentType === "run" ? " km" : " m"
              } — Pace: ${mm}:${String(ss).padStart(2, "0")}${
                currentType === "run" ? " min/km" : " min/500m"
              }`;
            },
          },
        },
      },
      scales: {
        x: { ticks: { color: "#aaa" }, grid: { color: "#333" } },
        y: { ticks: { color: "#aaa", stepSize: 5 }, grid: { color: "#333" } },
      },
    },
  });

  // Update Chart
  function updateChart() {
    chart.data.labels = store[currentType].labels.slice();
    chart.data.datasets[0].data = store[currentType].data.slice();
    chart.update();
    if (chartScroll) chartScroll.scrollLeft = chartScroll.scrollWidth; // auto-scroll to newest
    saveData();
  }
  updateChart(); // initial render with loaded data

  // Workout Buttons
  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      btns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      currentType = btn.dataset.type;
      updateChart();
      summary.textContent = "";
      timeInput.value = "";
      distanceInput.value = "";

      if (currentType === "weights") {
        distanceInput.style.display = "none";
      } else {
        distanceInput.style.display = "inline-block";
        distanceInput.placeholder =
          currentType === "run" ? "Distance (km)" : "Distance (meters)";
      }
    });
  });

  // Log Workout
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const time = parseFloat(timeInput.value);
    let distance = parseFloat(distanceInput.value);

    if (currentType === "weights") {
      if (isNaN(time)) return alert("Enter a valid weight");
      store[currentType].data.push(time);
      store[currentType].labels.push(
        `W${store[currentType].labels.length + 1}`
      );
      store[currentType].distances.push(1);
      summary.textContent = `Logged ${time} kg`;
    } else {
      if (isNaN(time)) return alert("Enter valid time");
      if (isNaN(distance)) distance = currentType === "run" ? 5 : 500;
      store[currentType].data.push(time);
      store[currentType].labels.push(
        `W${store[currentType].labels.length + 1}`
      );
      store[currentType].distances.push(distance);

      const pace = time / (currentType === "run" ? distance : distance / 500);
      const seconds = Math.round(pace * 60);
      const mm = Math.floor(seconds / 60);
      const ss = seconds % 60;
      summary.textContent = `Logged ${time} min — Distance: ${distance}${
        currentType === "run" ? " km" : " m"
      } — Pace: ${mm}:${String(ss).padStart(2, "0")}${
        currentType === "run" ? " min/km" : " min/500m"
      }`;
    }

    timeInput.value = "";
    distanceInput.value = "";
    timeInput.focus();
    updateChart();
  });

  // Undo
  undoBtn.addEventListener("click", () => {
    if (store[currentType].data.length === 0)
      return alert("No entries to undo.");
    store[currentType].data.pop();
    store[currentType].labels.pop();
    store[currentType].distances.pop();
    summary.textContent = "Last entry removed";
    updateChart();
  });
});
// Toggle chart visibility
document.addEventListener("DOMContentLoaded", () => {
  const graphBtn = document.getElementById("graphViewBtn");
  const calBtn = document.getElementById("calendarViewBtn");
  const graphView = document.getElementById("graphView");
  const calView = document.getElementById("calendarView");
  const hideBtn = document.getElementById("hideViewBtn");

  function showGraph() {
    graphBtn.classList.add("active");
    calBtn.classList.remove("active");
    graphView.classList.remove("hidden");
    calView.classList.add("hidden");
  }

  function showCalendar() {
    calBtn.classList.add("active");
    graphBtn.classList.remove("active");
    calView.classList.remove("hidden");
    graphView.classList.add("hidden");
  }

  graphBtn.addEventListener("click", showGraph);
  calBtn.addEventListener("click", showCalendar);

  hideBtn.addEventListener("click", () => {
    if (!graphView.classList.contains("hidden")) {
      graphView.classList.add("hidden");
      hideBtn.textContent = "Show Graph ";
    } else if (!calView.classList.contains("hidden")) {
      calView.classList.add("hidden");
      hideBtn.textContent = "Show Calendar ";
    } else {
      // Restore whichever tab is active
      if (graphBtn.classList.contains("active")) {
        graphView.classList.remove("hidden");
        hideBtn.textContent = "Hide View ";
      } else {
        calView.classList.remove("hidden");
        hideBtn.textContent = "Hide View ";
      }
    }
  });
});
