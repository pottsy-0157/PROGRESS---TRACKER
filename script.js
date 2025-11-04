// ===== Navbar Scroll Effect =====
window.addEventListener("scroll", () => {
  const navbar = document.getElementById("navbar");
  if (navbar) navbar.classList.toggle("scrolled", window.scrollY > 50);
});

// ===== Weekly Calendar / Reminder System =====
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
    const diff = date.getDate() - date.getDay(); // start on Sunday
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

      // Example preset sessions
      const isMon = day.getDay() === 1;
      const isTue = day.getDay() === 2;
      const isWed = day.getDay() === 3;
      const isThu = day.getDay() === 4;
      const isFri = day.getDay() === 5;
      const isSat = day.getDay() === 6;

      if (isMon)
        addSession(sessions, "LOWER STRENGTH + EASY RUN", "06:00", day);
      if (isTue) addSession(sessions, "MOBILITY + RECOVERY", "06:00", day);
      if (isWed) addSession(sessions, "GRIP AND RIP (ERGS)", "06:00", day);
      if (isThu) addSession(sessions, "MOBILITY + RECOVERY", "06:00", day);
      if (isFri) {
        addSession(sessions, "PUSH / CORE", "06:00", day);
        addSession(sessions, "GRIP AND RIP (ERGS)", "06:00", day);
      }
      if (isSat) addSession(sessions, "HYROX SATURDAY", "07:30", day);

      dayEl.appendChild(header);
      dayEl.appendChild(sessions);
      grid.appendChild(dayEl);
    }
  }

  function addSession(container, name, time, dayDate) {
    const pill = document.createElement("div");
    pill.className = "session-pill";
    pill.innerHTML = `<span>${time} • ${name}</span>`;

    const remindBtn = document.createElement("button");
    remindBtn.className = "remind-btn";
    remindBtn.textContent = "Remind";
    remindBtn.addEventListener("click", () => {
      const dt = combineDateAndTime(dayDate, time);
      ensureNotificationPermission().then((allowed) => {
        if (!allowed) {
          if (toast)
            toast.textContent = "Enable notifications to receive reminders.";
          setTimeout(() => (toast.textContent = ""), 2000);
          return;
        }
        const rem = { name, time, when: dt.getTime() };
        storeReminder(rem);
        scheduleReminder(rem);
        if (toast)
          toast.textContent = `Reminder set for ${name} at ${formatTime(dt)}.`;
        setTimeout(() => (toast.textContent = ""), 2000);
      });
    });

    const calBtn = document.createElement("button");
    calBtn.className = "addcal-btn";
    calBtn.textContent = "+ Calendar";
    calBtn.addEventListener("click", () => {
      const dt = combineDateAndTime(dayDate, time);
      downloadICS({
        title: name,
        description: `${name} class`,
        start: dt,
        durationMinutes: 60,
      });
    });

    pill.appendChild(remindBtn);
    pill.appendChild(calBtn);
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
      } else resolve(false);
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
    return `${y}${m}${d}T${hh}${mm}00Z`;
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

  prev.addEventListener("click", () => {
    anchor = new Date(anchor.getTime() - MS_DAY * 7);
    render();
  });
  next.addEventListener("click", () => {
    anchor = new Date(anchor.getTime() + MS_DAY * 7);
    render();
  });

  render();
})();

// ===== Graph / Calendar Toggle =====
document.addEventListener("DOMContentLoaded", () => {
  const graphBtn = document.getElementById("graphViewBtn");
  const calBtn = document.getElementById("calendarViewBtn");
  const graphView = document.getElementById("graphView");
  const calView = document.getElementById("calendarView");
  const hideBtn = document.getElementById("hideViewBtn");

  if (!graphBtn || !calBtn || !graphView || !calView) return;

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

  function hideViews() {
    graphView.classList.add("hidden");
    calView.classList.add("hidden");
    graphBtn.classList.remove("active");
    calBtn.classList.remove("active");
  }

  graphBtn.addEventListener("click", showGraph);
  calBtn.addEventListener("click", showCalendar);
  if (hideBtn) hideBtn.addEventListener("click", hideViews);

  showGraph(); // default view
});
