NEXT STEPS

when clicking side menu, add smoothness to opening
deployment options
additional features

# 🕌 Islamic Prayer Times App

A modern, responsive web app that calculates daily prayer times based on your location, madhab, and calculation method. Built with React + Vite + FastAPI, it features countdowns, reminders, Qibla direction, and Hijri conversion — all wrapped in a clean, accessible UI.

---

## 🚀 Features

- 🌍 Location-based prayer time calculation using [Adhan.js](https://github.com/batoulapps/adhan-js)
- 🕰️ 12h/24h clock toggle
- 🔔 Prayer reminders (browser notifications)
- 🧭 Qibla direction calculator
- 📅 Hijri date conversion via FastAPI
- 🧠 Settings saved to localStorage
- 📱 Mobile-friendly responsive design
- ♿ Accessibility enhancements (ARIA labels, focus trap, contrast checks)

---

## 🛠️ Tech Stack

| Layer       | Tech Used                      | Why It Was Chosen                   |
| ----------- | ------------------------------ | ----------------------------------- |
| Frontend    | React + Vite + TypeScript      | Fast dev experience, type safety    |
| Styling     | Tailwind CSS                   | Utility-first, responsive design    |
| Time Logic  | Luxon                          | Robust timezone and date handling   |
| Prayer Calc | Adhan.js                       | Accurate, madhab-aware prayer times |
| Backend     | FastAPI                        | Lightweight, async-friendly API     |
| Testing     | Vitest + React Testing Library | Fast, modern unit testing           |
| CI          | GitHub Actions                 | Auto lint + test on push            |

---

## 📦 How to Run Locally

### 1. Clone the repo

```bash
git clone https://github.com/your-username/prayer-app.git
cd prayer-app
```

### 2. Install frontend dependencies

```bash
npm install
npm run dev
```

### 3. Run the FastAPI backend

```bash
cd backend
uvicorn main:app --reload
```

> The frontend proxies `/api` requests to FastAPI (e.g. `/api/hijri`, `/api/search`). Make sure both servers are running.

---

## 🧪 Testing

```bash
npm run test
```

Includes:

- ✅ “Next prayer calculation picks tomorrow Fajr after Isha”
- ✅ “Switching to 24h clock changes displayed time format”

---

## 📸 Screenshots

![Prayer Times UI](screenshots/prayer-times.png)  
![Settings Drawer](screenshots/settings-drawer.png)

> You can also embed a GIF demo using [LICEcap](https://www.cockos.com/licecap/) or Loom.

---

## 🧭 Roadmap

- [ ] PWA support (offline mode, installable)
- [ ] High-latitude rule handling
- [ ] Internationalization (i18n)
- [ ] Location autocomplete
- [ ] Reminder scheduling via service workers

---

## ⚠️ Known Limitations

- No persistent backend storage (all settings are local)
- Location search relies on OpenStreetMap and may be rate-limited
- Notifications require browser permission and may not work on all devices

---

## ♿ Accessibility Considerations

- ARIA labels on interactive elements
- Focus trap inside settings drawer
- Escape key closes drawer
- Color contrast tested for WCAG compliance

---

## 💼 Why This Matters

This project demonstrates:

- Clean architecture with shared context and hooks
- Real-world API integration and proxying
- Accessibility and performance awareness
- CI, linting, and testing discipline
