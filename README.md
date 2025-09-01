NEXT STEPS

Qibla box size adjustment.
dynamic bg
side menu?
break down each block of main.py
update UI

# Islamic Prayer App

A modern, dynamic web app for prayer times, Qibla direction, and Hijri date.

- **Frontend:** React + Vite + Tailwind
- **Backend:** Python FastAPI (serves API + static build)
- **Prayer Calculations:** [adhan.js](https://github.com/batoulapps/adhan-js)
- **Qibla:** adhan.js (client) and a Python endpoint example
- **Hijri:** Python API via `hijri-converter`

## Features

- Auto-detects your location (or search any city)
- Multiple calculation methods + Shafi / Hanafi Asr
- 12h/24h time formatting
- Browser notifications (soft chime) for prayer reminders
- Clean UI with responsive cards
- Qibla compass (numeric bearing with a visual indicator)
- Hijri date via backend

## Prerequisites

- **Node.js** 18+
- **Python** 3.10+

## Quick Start

```bash
# 1) Frontend
cd frontend
npm install
npm run build

# 2) Backend
cd ../backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt

# 3) Run API + static hosting
uvicorn main:app --reload
```

Open http://127.0.0.1:8000/ in your browser.

> If you prefer to develop the frontend interactively, run `npm run dev` in `/frontend` and access the API at `http://127.0.0.1:8000`. (CORS is enabled for dev.)

## Notes

- **Permissions:** the browser will ask for location (for accurate times) and notifications (if you toggle reminders).
- **Hijri converter:** make sure `hijri-converter` is installed; otherwise the API returns a fallback message.
- **Qibla bearing:** shown numerically and with a simple compass indicator. On some devices, compass heading may need orientation permission in the browser settings.

## Project Structure

```
islamic-prayer-app/
  backend/
    main.py
    requirements.txt
  frontend/
    index.html
    package.json
    tsconfig.json
    vite.config.ts
    tailwind.config.js
    postcss.config.js
    src/
      App.tsx
      main.tsx
      styles.css
    public/
```

## Customization

- Change default calculation method in `App.tsx` by switching the `METHODS` map default.
- Styling uses Tailwind; edit `/src/styles.css` or component classes.
- To add more features (monthly timetable, persistent settings), store options in `localStorage` and/or create additional API routes in `main.py`.
