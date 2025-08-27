from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pathlib import Path
from math import radians, degrees, sin, cos, atan2, tan
from datetime import datetime, date
from zoneinfo import ZoneInfo

try:
    from hijri_converter import convert
    HIJRI_AVAILABLE = True
except Exception:
    HIJRI_AVAILABLE = False

app = FastAPI(title="Islamic Prayer App API", version="1.0.0")

# Allow local dev from Vite or any host by default
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Utility: Qibla bearing ---
KAABA_LAT = 21.422487
KAABA_LON = 39.826206

def qibla_bearing(lat: float, lon: float) -> float:
    """Return initial bearing (0..360) from North toward Kaaba."""
    lat1 = radians(lat)
    lon1 = radians(lon)
    lat2 = radians(KAABA_LAT)
    lon2 = radians(KAABA_LON)
    dlon = lon2 - lon1
    y = sin(dlon)
    x = cos(lat1) * tan(lat2) - sin(lat1) * cos(dlon)
    brng = atan2(y, x)
    deg = (degrees(brng) + 360.0) % 360.0
    return deg

# --- API: health ---
@app.get("/api/health")
def health():
    return {"status": "ok"}

# --- API: qibla ---
@app.get("/api/qibla")
def api_qibla(lat: float = Query(...), lon: float = Query(...)):
    try:
        bearing = qibla_bearing(lat, lon)
        return {"bearing": bearing}
    except Exception as e:
        return JSONResponse(status_code=400, content={"error": str(e)})

# --- API: hijri ---
@app.get("/api/hijri")
def api_hijri(
    timezone: str = Query("UTC"),
    iso_date: str | None = Query(None, alias="date"),
):
    """Return Hijri date for the given Gregorian date (or today in timezone)."""
    try:
        if iso_date:
            # Expect YYYY-MM-DD
            y, m, d = [int(x) for x in iso_date.split("-")]
            gdate = date(y, m, d)
        else:
            now = datetime.now(ZoneInfo(timezone))
            gdate = now.date()

        if HIJRI_AVAILABLE:
            h = convert.Gregorian(gdate.year, gdate.month, gdate.day).to_hijri()
            # Manual month names for consistency
            months_en = [
                "Muharram","Safar","Rabi' al-awwal","Rabi' al-thani","Jumada al-awwal","Jumada al-thani",
                "Rajab","Sha'ban","Ramadan","Shawwal","Dhu al-Qi'dah","Dhu al-Hijjah"
            ]
            months_ar = [
                "محرم","صفر","ربيع الأول","ربيع الآخر","جمادى الأولى","جمادى الآخرة",
                "رجب","شعبان","رمضان","شوال","ذو القعدة","ذو الحجة"
            ]
            month_index = int(h.month) - 1
            return {
                "gregorian": gdate.isoformat(),
                "hijri": {
                    "day": int(h.day),
                    "month": int(h.month),
                    "month_en": months_en[month_index],
                    "month_ar": months_ar[month_index],
                    "year": int(h.year),
                    "formatted_en": f"{int(h.day)} {months_en[month_index]} {int(h.year)} AH",
                },
            }
        else:
            # Fallback: just return Gregorian if hijri-converter is not installed
            return {
                "gregorian": gdate.isoformat(),
                "hijri": {
                    "day": None, "month": None, "month_en": None, "month_ar": None, "year": None,
                    "formatted_en": "Install hijri-converter to enable Hijri date",
                },
            }
    except Exception as e:
        return JSONResponse(status_code=400, content={"error": str(e)})

# --- Serve static frontend (built with Vite) ---
BASE_DIR = Path(__file__).resolve().parent
DIST_DIR = (BASE_DIR.parent / "frontend" / "dist").resolve()
INDEX_FILE = DIST_DIR / "index.html"

if DIST_DIR.exists():
    app.mount("/", StaticFiles(directory=str(DIST_DIR), html=True), name="static")

# Optional fallback if StaticFiles isn't mounted (no build yet)
@app.get("/")
def root_fallback():
    if INDEX_FILE.exists():
        return FileResponse(str(INDEX_FILE))
    return {"message": "Frontend not built yet. Build it by running `npm run build` in ./frontend"}
