import React, { useEffect, useMemo, useRef, useState } from 'react'
import { DateTime } from 'luxon'
import { Coordinates, CalculationMethod, PrayerTimes, Qibla, Madhab, CalculationParameters } from 'adhan'
import CountdownTimer from './components/CountdownTimer'

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
  const notifTimers = useRef<number[]>([])

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
    if (!coords) return null
    const d = DateTime.fromISO(date).setZone(loc?.tz || 'UTC')
    // Construct JS Date in local tz
    const jsDate = new Date(d.year, d.month - 1, d.day)
    try {
      return new PrayerTimes(coords, jsDate, params)
    } catch {
      return null
    }
  }, [coords, date, params, loc?.tz])

  useEffect(() => {
    if (!times || !loc) return;

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
      const tomorrow = DateTime.fromISO(date).plus({ days: 1 }).setZone(loc.tz || 'UTC');
      const tomorrowDate = new Date(tomorrow.year, tomorrow.month - 1, tomorrow.day);
      if (coords) {
        const tomorrowTimes = new PrayerTimes(coords, tomorrowDate, params);
        next = { name: 'Fajr', time: DateTime.fromJSDate(tomorrowTimes.fajr).setZone(loc.tz) };
      }
    }

    setNextPrayer(next);
  }, [times, loc, date, coords, params]);

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
    <div className="bg-brand-green text-brand-white min-h-screen">
      <div className="max-w-4xl mx-auto p-4 font-sans">

<header className="relative flex flex-col items-center justify-center gap-6 mb-8 text-center">
  {/* Background Arabic calligraphy */}
  <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
    <span className="text-[6rem] md:text-[10rem] font-arabic text-brand-gold opacity-20 select-none whitespace-nowrap mt-14">
      بسم الله الرحمن الرحيم
    </span>
  </div>

  {/* Foreground content */}
  <div className="relative z-10 flex flex-col items-center justify-center text-center py-12 space-y-6">
    <h1 className="text-5xl md:text-6xl font-bold text-brand-gold drop-shadow-lg mb-4">
      Islamic Prayer App
    </h1>
    <p className="text-lg md:text-xl text-brand-white/80">
      Daily prayers, Qibla, and Hijri calendar
    </p>
  </div>

  {/* Toggles */}
  <div className="relative z-10 flex flex-col md:flex-row items-center justify-center gap-4">
    <label className="text-sm md:text-base flex items-center gap-2 cursor-pointer transition-transform duration-300 hover:scale-105">
      <input
        type="checkbox"
        className="mr-2 accent-brand-gold"
        checked={use24h}
        onChange={e => setUse24h(e.target.checked)}
      />
      24h Clock
    </label>
    
    <label className="text-sm md:text-base flex items-center gap-2 cursor-pointer transition-transform duration-300 hover:scale-105">
      <input
        type="checkbox"
        className="mr-2 accent-brand-gold"
        checked={notifOn}
        onChange={e => setNotifOn(e.target.checked)}
      />
      Prayer Reminders
    </label>
  </div>
</header>



      {nextPrayer && <CountdownTimer nextPrayerName={nextPrayer.name} nextPrayerTime={nextPrayer.time} />}

      <section className="grid md:grid-cols-3 gap-4 mb-4">
        <div className="md:col-span-2 p-4 rounded-2xl border border-brand-gold/30">
          <div className="flex items-center gap-2 mb-3">
            <input
              placeholder="Search city or address"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="border border-brand-white/20 bg-brand-green/50 rounded px-3 py-2 w-full focus:ring-brand-gold focus:border-brand-gold"
            />
            <button onClick={handleSearch} className="px-4 py-2 bg-brand-gold text-brand-green font-bold rounded hover:bg-yellow-400 transition-colors">Find</button>
          </div>
          <div className="text-sm text-brand-white/70 mb-2">
            {loc?.label ? `Location: ${loc.label}` : loc ? `Lat ${loc.lat.toFixed(4)}, Lon ${loc.lon.toFixed(4)}` : 'Locating...'}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-brand-white/70">Method</label>
              <select value={method} onChange={e => setMethod(e.target.value as any)} className="w-full border border-brand-white/20 bg-brand-green/50 rounded px-2 py-2">
                {Object.keys(METHODS).map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-brand-white/70">Asr Madhab</label>
              <select value={madhab} onChange={e => setMadhab(e.target.value as any)} className="w-full border border-brand-white/20 bg-brand-green/50 rounded px-2 py-2">
                <option value="Shafi">Shafi</option>
                <option value="Hanafi">Hanafi</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-brand-white/70">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border border-brand-white/20 bg-brand-green/50 rounded px-2 py-2"/>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-brand-gold/30">
          <div className="text-sm text-brand-white/70">Hijri (backend):</div>
          <div className="text-lg font-semibold text-brand-gold">{hijri || '...'}</div>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 p-4 rounded-2xl border border-brand-gold/30">
          <h2 className="font-semibold mb-3 text-brand-gold">Prayer Times</h2>
          {!times || !loc ? (
            <div>Loading...</div>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
              {[
                ['Fajr', times.fajr],
                ['Sunrise', times.sunrise],
                ['Dhuhr', times.dhuhr],
                ['Asr', times.asr],
                ['Maghrib', times.maghrib],
                ['Isha', times.isha],
              ].map(([label, t]) => (
                <div key={label as string} className="border border-brand-white/20 rounded-xl px-3 py-2 flex items-center justify-between">
                  <div>{typeof label === 'object' && label instanceof Date ? label.toLocaleString() : label}</div>
                  <div className="font-medium text-brand-gold">
                    {formatTime(t as Date, loc.tz, use24h)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 rounded-2xl border border-brand-gold/30">
          <h2 className="font-semibold mb-3 text-brand-gold">Qibla</h2>
          {!qiblaDeg ? (
            <div>Calculating...</div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-40 h-40 rounded-full border-2 border-brand-white/30 relative">
                <div className="absolute inset-0 flex items-center justify-center text-xs text-brand-white/70">N</div>
                <div className="origin-bottom absolute left-1/2 -translate-x-1/2 bottom-1/2 w-0 h-1/2"
                     style={{ transform: `translateX(-50%) rotate(${qiblaDeg}deg)` }}>
                  <div className="w-1 h-full bg-brand-gold mx-auto rounded-full"></div>
                </div>
              </div>
              <div className="text-sm text-brand-white/70">Bearing: {qiblaDeg.toFixed(1)}° from North</div>
            </div>
          )}
        </div>
      </section>

      <footer className="text-center text-xs text-brand-white/50 mt-8">
        Built with React + FastAPI. Methods via adhan.js. Your location never leaves your browser except for Hijri date request.
      </footer>
    </div>
  </div>
  )
}
