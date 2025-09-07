import { useEffect, useRef } from 'react';
import { DateTime } from 'luxon';
import { PrayerTimes } from 'adhan';
import { useSettings } from '../context/SettingsContext';

export const useNotifications = (times: PrayerTimes | null) => {
  const { location, use24h, notifOn } = useSettings();
  const notifTimers = useRef<number[]>([]);

  useEffect(() => {
    if (!times || !location) return;

    // Clear existing timeouts
    notifTimers.current.forEach(t => clearTimeout(t));
    notifTimers.current = [];

    if (!('Notification' in window)) return;

    if (notifOn) {
      if (Notification.permission === 'granted') {
        scheduleNotifications();
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(p => {
          if (p === 'granted') scheduleNotifications();
        });
      }
    }

    return () => {
      notifTimers.current.forEach(t => clearTimeout(t));
      notifTimers.current = [];
    };
  }, [notifOn, times, use24h, location?.tz]);

  const scheduleNotifications = () => {
    if (!times || !location) return;
    const now = DateTime.now().setZone(location.tz);
    const entries: [string, Date][] = [
      ['Fajr', times.fajr],
      ['Sunrise', times.sunrise],
      ['Dhuhr', times.dhuhr],
      ['Asr', times.asr],
      ['Maghrib', times.maghrib],
      ['Isha', times.isha],
    ];

    for (const [name, t] of entries) {
      const tt = DateTime.fromJSDate(t).setZone(location.tz);
      const diff = tt.diff(now).as('milliseconds');
      if (diff > 0) {
        const id = window.setTimeout(() => {
          new Notification(`${name}`, {
            body: `${name} time: ${tt.toFormat(use24h ? 'HH:mm' : 'h:mm a')}`,
          });

          try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = 554.37;
            osc.connect(gain);
            gain.connect(ctx.destination);
            gain.gain.value = 0.05;
            osc.start();
            setTimeout(() => {
              osc.stop();
              ctx.close();
            }, 1200);
          } catch {}
        }, diff);
        notifTimers.current.push(id);
      }
    }
  };
};
