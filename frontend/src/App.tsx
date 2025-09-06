import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DateTime } from 'luxon'
import { Coordinates, CalculationMethod, PrayerTimes, Qibla, Madhab, CalculationParameters, HighLatitudeRule, PolarCircleResolution } from 'adhan'
import CountdownTimer from './components/CountdownTimer'
import SideMenu from "./components/SideMenu"

type Location = { lat: number; lon: number; tz: string; label?: string }

type MethodName =
  | 'ISNA (North America)'
  | 'Muslim World League'
  | 'Umm al-Qura (Makkah)'
  | 'Egyptian General Authority'
  | 'Dubai'
  | 'Kuwait'
  | 'Qatar'
  | 'Singapore'
  | 'Tehran'
  | 'Turkey'

// Mapping of method names to their corresponding CalculationParameters functions

const methodMapping: Record<string, () => CalculationParameters> = {
  'ISNA (North America)': CalculationMethod.NorthAmerica,
  'Muslim World League': CalculationMethod.MuslimWorldLeague,
  'Umm al-Qura (Makkah)': CalculationMethod.UmmAlQura,
  'Egyptian General Authority': CalculationMethod.Egyptian,
  'Dubai': CalculationMethod.Dubai,
  'Kuwait': CalculationMethod.Kuwait,
  'Qatar': CalculationMethod.Qatar,
  'Singapore': CalculationMethod.Singapore,
  'Tehran': CalculationMethod.Tehran,
  'Turkey': CalculationMethod.Turkey
}

function makeParams(method: keyof typeof methodMapping, madhab: 'Shafi' | 'Hanafi') {
  const base = methodMapping[method]() // fresh CalculationParameters
  base.madhab = madhab === 'Hanafi' ? Madhab.Hanafi : Madhab.Shafi
  base.highLatitudeRule = HighLatitudeRule.MiddleOfTheNight
  base.polarCircleResolution = PolarCircleResolution.AqrabBalad
  return base
}

// Important Islamic dates for the next year (2025-2026)
const IMPORTANT_DATES = [
  { name: "Mawlid an-Nabi", date: "2025-09-04", hijriDate: "12 Rabi al-Awwal 1447" },
  { name: "Isra and Mi'raj", date: "2026-01-26", hijriDate: "27 Rajab 1447" },
  { name: "Mid-Sha'ban (Shab-e-Barat)", date: "2026-02-13", hijriDate: "15 Sha'ban 1447" },
  { name: "Ramadan Begins", date: "2026-02-28", hijriDate: "1 Ramadan 1447" },
  { name: "Laylat al-Qadr", date: "2026-03-26", hijriDate: "27 Ramadan 1447" },
  { name: "Eid al-Fitr", date: "2026-03-29", hijriDate: "1 Shawwal 1447" },
  { name: "Day of Arafah", date: "2026-06-03", hijriDate: "9 Dhul Hijjah 1447" },
  { name: "Eid al-Adha", date: "2026-06-04", hijriDate: "10 Dhul Hijjah 1447" },
  { name: "Islamic New Year", date: "2026-06-25", hijriDate: "1 Muharram 1448" },
  { name: "Day of Ashura", date: "2026-07-04", hijriDate: "10 Muharram 1448" },
  { name: "Mawlid an-Nabi", date: "2026-08-23", hijriDate: "12 Rabi al-Awwal 1448" }
];

const formatTime = (d: Date, tz: string, use24h: boolean) => {
  const dt = DateTime.fromJSDate(d).setZone(tz)
  return dt.toFormat(use24h ? 'HH:mm' : 'h:mm a')
}

// Helper function to get timezone from coordinates
const getTimezoneFromCoords = async (lat: number, lon: number): Promise<string> => {
  try {
    // Using TimeZoneDB free API (you'll need to get a free API key)
    // For now, we'll use a simple fallback approach
    const response = await fetch(`https://api.timezonedb.com/v2.1/get-time-zone?key=YOUR_API_KEY&format=json&by=position&lat=${lat}&lng=${lon}`)
    const data = await response.json()
    return data.zoneName || Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    // Fallback: estimate timezone based on longitude
    const offsetHours = Math.round(lon / 15)
    const utcOffset = Math.max(-12, Math.min(12, offsetHours))
    return `UTC${utcOffset >= 0 ? '+' : ''}${utcOffset}`
  }
}

const defaultTZ = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'


const getNextPrayerName = (times: PrayerTimes, loc: Location): string | null => {
  const now = DateTime.now().setZone(loc.tz)
  const prayerTimes: [string, Date][] = [
    ['Fajr', times.fajr],
    ['Sunrise', times.sunrise],
    ['Dhuhr', times.dhuhr],
    ['Asr', times.asr],
    ['Maghrib', times.maghrib],
    ['Isha', times.isha],
  ]
  
  for (const [name, time] of prayerTimes) {
    const prayerTime = DateTime.fromJSDate(time).setZone(loc.tz)
    if (prayerTime > now) {
      return name
    }
  }
  return 'Fajr' // Next day's Fajr
}

export default function App() {
  const [loc, setLoc] = useState<Location | null>(null)
  const [date, setDate] = useState(DateTime.now().toISODate()!)
  const [method, setMethod] = useState<keyof typeof methodMapping>('ISNA (North America)')
  const [madhab, setMadhab] = useState<'Shafi' | 'Hanafi'>('Hanafi')
  const [use24h, setUse24h] = useState(false)
  const [notifOn, setNotifOn] = useState(false)
  const [query, setQuery] = useState('')
  const [hijri, setHijri] = useState<string>('')
  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: DateTime } | null>(null)
  const [prayerPassed, setPrayerPassed] = useState(0)
  const [showCalendar, setShowCalendar] = useState(false)
  const notifTimers = useRef<number[]>([])

  // Get upcoming important dates (next 3)
  const upcomingDates = useMemo(() => {
    const today = DateTime.now().toISODate()!
    return IMPORTANT_DATES
      .filter(event => event.date >= today)
      .slice(0, 3)
      .map(event => ({
        ...event,
        daysUntil: DateTime.fromISO(event.date).diff(DateTime.now(), 'days').days
      }))
  }, [])

  // Geolocate on first load
  useEffect(() => {
    if (!loc && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLoc({ lat: pos.coords.latitude, lon: pos.coords.longitude, tz: defaultTZ })
        },
        () => {
          setLoc({ lat: 43.6532, lon: -79.3832, tz: defaultTZ, label: 'Toronto (fallback)' })
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    } else if (!navigator.geolocation) {
      setLoc({ lat: 43.6532, lon: -79.3832, tz: defaultTZ, label: 'Toronto (fallback)' })
    }
  }, [])

  // Hijri from backend
  useEffect(() => {
    if (!loc) return
    fetch(`/api/hijri?timezone=${encodeURIComponent(loc.tz)}&date=${date}`)
      .then(r => r.json())
      .then(data => {
        if (data?.hijri?.formatted_en) setHijri(data.hijri.formatted_en)
      })
      .catch(() => setHijri(''))
  }, [loc, date])

  const coords = useMemo(() => {
    if (!loc) return null
    return new Coordinates(loc.lat, loc.lon)
  }, [loc])

  const params = useMemo(() => makeParams(method, madhab), [method, madhab])

  const times = useMemo(() => {
    if (!coords || !loc) return null
    const d = DateTime.fromISO(date).setZone(loc.tz || 'UTC')
    const jsDate = new Date(d.year, d.month - 1, d.day)
    try {
      return new PrayerTimes(coords, jsDate, params)
    } catch {
      return null
    }
  }, [coords, date, params, loc?.tz])

  useEffect(() => {
    if (!times || !loc || !coords || !params) return;

    const now = DateTime.now().setZone(loc.tz);
    const prayerTimes: [string, Date][] = [
      ['Fajr', times.fajr],
      ['Sunrise', times.sunrise],
      ['Dhuhr', times.dhuhr],
      ['Asr', times.asr],
      ['Maghrib', times.maghrib],
      ['Isha', times.isha],
    ];

    let next: { name: string; time: DateTime } | null = null;

    for (const [name, time] of prayerTimes) {
      const prayerTime = DateTime.fromJSDate(time).setZone(loc.tz);
      if (prayerTime > now) {
        next = { name, time: prayerTime };
        break;
      }
    }

    if (!next) {
      const tomorrow = now.plus({ days: 1 });
      const tomorrowDate = new Date(tomorrow.year, tomorrow.month - 1, tomorrow.day);
      const tomorrowTimes = new PrayerTimes(coords, tomorrowDate, params);
      next = { name: 'Fajr', time: DateTime.fromJSDate(tomorrowTimes.fajr).setZone(loc.tz) };
    }
    
    setNextPrayer(next);
  }, [times, loc, coords, params, prayerPassed]);

  const qiblaDeg = useMemo(() => {
    if (!coords) return null
    try {
      return Qibla(coords)
    } catch {
      return null
    }
  }, [coords])

  const scheduleNotifications = () => {
    if (!times || !loc) return
    notifTimers.current.forEach(t => clearTimeout(t))
    notifTimers.current = []
    const now = DateTime.now().setZone(loc.tz)
    const entries: [string, Date][] = [
      ['Fajr', times.fajr],
      ['Sunrise', times.sunrise],
      ['Dhuhr', times.dhuhr],
      ['Asr', times.asr],
      ['Maghrib', times.maghrib],
      ['Isha', times.isha],
    ]
    for (const [name, t] of entries) {
      const tt = DateTime.fromJSDate(t).setZone(loc.tz)
      const diff = tt.diff(now).as('milliseconds')
      if (diff > 0) {
        const id = window.setTimeout(() => {
          new Notification(`${name}`, { body: `${name} time: ${tt.toFormat(use24h ? 'HH:mm' : 'h:mm a')}` })
          try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.type = 'sine'; osc.frequency.value = 554.37
            osc.connect(gain); gain.connect(ctx.destination)
            gain.gain.value = 0.05; osc.start(); setTimeout(() => { osc.stop(); ctx.close() }, 1200)
          } catch {}
        }, diff)
        notifTimers.current.push(id)
      }
    }
  }

  useEffect(() => {
    if (!('Notification' in window)) return
    if (notifOn) {
      if (Notification.permission === 'granted') {
        scheduleNotifications()
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(p => {
          if (p === 'granted') scheduleNotifications()
          else setNotifOn(false)
        })
      } else {
        setNotifOn(false)
      }
    } else {
      notifTimers.current.forEach(t => clearTimeout(t))
      notifTimers.current = []
    }
    return () => {
      notifTimers.current.forEach(t => clearTimeout(t))
      notifTimers.current = []
    }
  }, [notifOn, times, use24h, loc?.tz])

  const handleSearch = async () => {
    if (!query.trim()) return
    
    try {
      // Step 1: Get coordinates from Nominatim
      const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
      const geocodeRes = await fetch(geocodeUrl)
      const geocodeData = await geocodeRes.json()
      
      if (Array.isArray(geocodeData) && geocodeData.length > 0) {
        const first = geocodeData[0]
        const lat = parseFloat(first.lat)
        const lon = parseFloat(first.lon)
        
        // Step 2: Get proper timezone for the location
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
        
        setLoc({ 
          lat, 
          lon, 
          tz: timezone, 
          label: first.display_name 
        })
      }
    } catch (error) {
      console.error('Search failed:', error)
    }
  }

    const timezoneName = new Intl.DateTimeFormat('en-US', {
      timeZone: loc?.tz,
      timeZoneName: 'long',
    }).formatToParts(new Date())
      .find(part => part.type === 'timeZoneName')?.value;

  return (
    <div className="bg-brand-green min-h-screen">
      <div className="max-w-4xl mx-auto p-3 sm:p-4 font-sans">

        <header className="relative flex flex-col items-center justify-center gap-3 mb-6 text-center px-4">
          <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
            <span className="absolute inset-0 flex justify-center items-center pointer-events-none text-goldish opacity-20 select-none whitespace-nowrap text-[8vw] sm:text-[6vw] leading-none">
              بسم الله الرحمن الرحيم
            </span>
          </div>

          <div className="relative z-10 flex flex-col items-center justify-center text-center py-6 space-y-3">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-brand-gold drop-shadow-lg mb-2">
              Islamic Prayer App
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-brand-white/80 px-4">
              Daily prayers, Qibla, and Hijri calendar
            </p>
          </div>
        </header>

        {nextPrayer && times && <CountdownTimer nextPrayerName={nextPrayer.name} nextPrayerTime={nextPrayer.time} onCountdownFinished={() => setPrayerPassed(c => c + 1)} />}

        {/* Prayer Times and Hijri Section */}
        <section className="grid md:grid-cols-3 gap-3 sm:gap-4 md:items-stretch">
          <div className="md:col-span-2 p-3 sm:p-4 rounded-2xl border border-brand-gold flex flex-col">
            <h2 className="font-semibold mb-3 text-brand-gold">Prayer Times</h2>
            
            {!times || !loc ? (
              <div>Loading...</div>
            ) : (
              <>
                {/* Current Location Display */}
                <div className="mb-4 p-3 bg-brand-gold/10 rounded-lg border border-brand-gold/30">
                  <div className="text-xs text-brand-gold/80">Showing times for:</div>
                  <div className="text-sm font-semibold text-brand-gold">
                    {loc?.label || `${loc?.lat.toFixed(4)}, ${loc?.lon.toFixed(4)}`}
                  </div>
                  <div className="text-xs text-brand-white/70">
                    Timezone: {loc?.tz}
                  </div>
                </div>
                
                {/* Prayer Time Cards */}
                <div className={`flex-1 flex flex-col ${showCalendar ? 'space-y-3 justify-start' : 'space-y-2 justify-center'}`}>
                  {[
                    ['Fajr', times.fajr],
                    ['Sunrise', times.sunrise],
                    ['Dhuhr', times.dhuhr],
                    ['Asr', times.asr],
                    ['Maghrib', times.maghrib],
                    ['Isha', times.isha],
                  ].map(([label, t]) => {
                    const isNextPrayer = times && loc && getNextPrayerName(times, loc) === label
                    return (
                      <div key={label as string} className={`border rounded-xl px-5 flex items-center justify-between transition-colors ${
                        showCalendar ? 'py-4' : 'py-2'
                      } ${
                        isNextPrayer 
                          ? 'border-brand-gold bg-brand-gold/10 hover:bg-brand-gold/15' 
                          : 'border-brand-white/20 bg-brand-green/5 hover:bg-brand-green/10'
                      }`}>
                        <div className="flex flex-col">
                          <div className={`${showCalendar ? 'text-lg' : 'text-sm'} font-medium ${isNextPrayer ? 'text-brand-gold' : 'text-brand-white'}`}>
                            {typeof label === 'string' ? label : label.toString()}
                          </div>
                          <div className="text-xs text-brand-white/60">
                            {DateTime.fromJSDate(t as Date).setZone(loc.tz).toRelative()}
                          </div>
                        </div>  
                        <div className={`font-bold ${showCalendar ? 'text-2xl' : 'text-lg'} ${isNextPrayer ? 'text-brand-gold' : 'text-brand-gold'}`}>
                          {formatTime(t as Date, loc.tz, use24h)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          <div className="p-3 sm:p-4 rounded-2xl border border-brand-gold flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xxl font-semibold text-brand-gold">Hijri:</div>
              <button
                onClick={() => setShowCalendar(!showCalendar)}
                className="text-xs bg-brand-gold text-brand-green px-2 py-1 rounded hover:bg-yellow-400 transition-colors"
              >
                📅 {showCalendar ? 'Hide' : 'Calendar'}
              </button>
            </div>
            <div className="text-base sm:text-lg font-semibold text-brand-gold break-words mb-4">
              {hijri || '...'}
            </div>

            {/* Important Upcoming Dates */}
            <div className={`space-y-2 ${showCalendar ? '' : 'flex-1 flex flex-col'}`}>
              <h3 className="text-xl font-semibold text-brand-gold border-b border-brand-gold/30 pb-1">
                Upcoming Events
              </h3>
              {upcomingDates.map((event, idx) => (
                <div key={idx} className="bg-brand-green/10 p-2 rounded-lg border border-brand-gold/20">
                  <div className="text-l font-semibold text-brand-gold">{event.name}</div>
                  <div className="text-l text-brand-white/80">{event.hijriDate}</div>
                  <div className="text-l text-brand-white/60">
                    {Math.ceil(event.daysUntil)} days away
                  </div>
                </div>
              ))}
            </div>

            {/* Expandable Full Calendar */}
            {showCalendar && (
              <div className="flex-1 p-3 bg-brand-green/10 rounded-lg border border-brand-gold/30">
                <h3 className="text-sm font-semibold text-brand-gold mb-3">Islamic Calendar</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {IMPORTANT_DATES.map((event, idx) => {
                    const eventDate = DateTime.fromISO(event.date)
                    const isPast = eventDate < DateTime.now()
                    return (
                      <div key={idx} className={`p-2 rounded border text-xs ${
                        isPast 
                          ? 'border-brand-white/10 text-brand-white/40' 
                          : 'border-brand-gold/20 text-brand-white'
                      }`}>
                        <div className="font-medium">{event.name}</div>
                        <div className="text-brand-gold/80">{event.hijriDate}</div>
                        <div className="text-brand-white/60">
                          {eventDate.toFormat('MMM dd, yyyy')}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </section>

        <footer className="text-center text-xs text-brand-white/50 mt-8">
          Built with React + FastAPI. Methods via adhan.js. Your location never leaves your browser except for Hijri date request.
        </footer>
      </div>
      
      <SideMenu
        use24h={use24h}
        setUse24h={setUse24h}
        notifOn={notifOn}
        setNotifOn={setNotifOn}
        method={method}
        setMethod={setMethod}
        madhab={madhab}
        setMadhab={setMadhab}
        loc={loc}
        setLoc={setLoc}
        query={query}
        setQuery={setQuery}
        handleSearch={handleSearch}
        date={date}
        setDate={setDate}
      />
    </div>
  )
}