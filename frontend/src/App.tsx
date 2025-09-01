import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DateTime } from 'luxon'
import { Coordinates, CalculationMethod, PrayerTimes, Qibla, Madhab, CalculationParameters } from 'adhan'
import CountdownTimer from './components/CountdownTimer'
import SideMenu from "./components/SideMenu"


type Location = { lat: number; lon: number; tz: string; label?: string }

const METHODS: Record<string, CalculationParameters> = {
  'Muslim World League': CalculationMethod.MuslimWorldLeague(),
  'ISNA (North America)': CalculationMethod.NorthAmerica(),
  'Umm al-Qura (Makkah)': CalculationMethod.UmmAlQura(),
  'Egyptian General Authority': CalculationMethod.Egyptian(),
  'Dubai': CalculationMethod.Dubai(),
  'Kuwait': CalculationMethod.Kuwait(),
  'Qatar': CalculationMethod.Qatar(),
  'Singapore': CalculationMethod.Singapore(),
  'Tehran': CalculationMethod.Tehran(),
  'Turkey': CalculationMethod.Turkey()
}

const formatTime = (d: Date, tz: string, use24h: boolean) => {
  const dt = DateTime.fromJSDate(d).setZone(tz)
  return dt.toFormat(use24h ? 'HH:mm' : 'h:mm a')
}

const defaultTZ = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

export default function App() {
  const [loc, setLoc] = useState<Location | null>(null)
  const [date, setDate] = useState(DateTime.now().toISODate()!)
  const [method, setMethod] = useState<keyof typeof METHODS>('Muslim World League')
  const [madhab, setMadhab] = useState<'Shafi' | 'Hanafi'>('Shafi')
  const [use24h, setUse24h] = useState(false)
  const [notifOn, setNotifOn] = useState(false)
  const [query, setQuery] = useState('')
  const [hijri, setHijri] = useState<string>('')
  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: DateTime } | null>(null);
  const [prayerPassed, setPrayerPassed] = useState(0); // State to trigger recalculation
  const notifTimers = useRef<number[]>([]);

  // Geolocate on first load
  useEffect(() => {
    if (!loc && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLoc({ lat: pos.coords.latitude, lon: pos.coords.longitude, tz: defaultTZ })
        },
        () => {
          // fallback to Toronto as a neutral default (user is in Canada)
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

  const params = useMemo(() => {
    const p = METHODS[method]
    p.madhab = (madhab === 'Hanafi') ? Madhab.Hanafi : Madhab.Shafi
    return p
  }, [method, madhab])

  const times = useMemo(() => {
    if (!coords || !loc) return null
    const d = DateTime.fromISO(date).setZone(loc.tz || 'UTC')
    // Construct JS Date in local tz
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

    // If all prayers for today are done, show Fajr for tomorrow
    if (!next) {
      const tomorrow = now.plus({ days: 1 });
      const tomorrowDate = new Date(tomorrow.year, tomorrow.month - 1, tomorrow.day);
      const tomorrowTimes = new PrayerTimes(coords, tomorrowDate, params);
      next = { name: 'Fajr', time: DateTime.fromJSDate(tomorrowTimes.fajr).setZone(loc.tz) };
    }
    
    setNextPrayer(next);
  }, [times, loc, coords, params, prayerPassed]); // Re-run when times change or when a prayer passes

  const qiblaDeg = useMemo(() => {
    if (!coords) return null
    try {
      return Qibla(coords)// degrees from North
    } catch {
      return null
    }
  }, [coords])

  // Notifications scheduling (simple)
  const scheduleNotifications = () => {
    if (!times || !loc) return
    // clear old timers
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
          // soft chime
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
    // cleanup on unmount
    return () => {
      notifTimers.current.forEach(t => clearTimeout(t))
      notifTimers.current = []
    }
  }, [notifOn, times, use24h, loc?.tz])

  const handleSearch = async () => {
    if (!query.trim()) return
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
    const res = await fetch(url)
    const data = await res.json()
    if (Array.isArray(data) && data.length > 0) {
      const first = data[0]
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      setLoc({ lat: parseFloat(first.lat), lon: parseFloat(first.lon), tz, label: first.display_name })
    }
  }

  return (
    <div className="bg-brand-green min-h-screen">
      <div className="max-w-4xl mx-auto p-3 sm:p-4 font-sans">

<header className="relative flex flex-col items-center justify-center gap-3 mb-6 text-center px-4">
  {/* Background Arabic calligraphy */}
  <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
    <span className="absolute inset-0 flex justify-center items-center pointer-events-none text-goldish opacity-20 select-none whitespace-nowrap text-[8vw] sm:text-[6vw] leading-none">
      بسم الله الرحمن الرحيم
    </span>
  </div>

  {/* Foreground content */}
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

{/* First section - just Prayer Times and Hijri date */}
<section className="grid md:grid-cols-3 gap-3 sm:gap-4">
  <div className="md:col-span-2 p-3 sm:p-4 rounded-2xl border border-brand-gold">
    <h2 className="font-semibold mb-3 text-brand-gold">Prayer Times</h2>
    {!times || !loc ? (
      <div>Loading...</div>
    ) : (
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2">
        {[
          ['Fajr', times.fajr],
          ['Sunrise', times.sunrise],
          ['Dhuhr', times.dhuhr],
          ['Asr', times.asr],
          ['Maghrib', times.maghrib],
          ['Isha', times.isha],
        ].map(([label, t]) => (
          <div key={label as string} className="border border-brand-white/20 rounded-xl px-2 sm:px-3 py-2 flex items-center justify-between">
            <div className="text-xs sm:text-sm">{typeof label === 'object' && label instanceof Date ? label.toLocaleString() : label}</div>
            <div className="font-medium text-brand-white text-xs sm:text-sm">
              {formatTime(t as Date, loc.tz, use24h)}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>

  <div className="p-3 sm:p-4 rounded-2xl border border-brand-gold">
    <div className="text-sm text-brand-gold">Hijri:</div>
    <div className="text-base sm:text-lg font-semibold text-brand-gold break-words">{hijri || '...'}</div>
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