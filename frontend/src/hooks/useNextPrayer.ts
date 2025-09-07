import { useEffect, useState } from 'react';
import { DateTime } from 'luxon';
import { PrayerTimes, Coordinates } from 'adhan';
import { useSettings } from '../context/SettingsContext';
import { makeParams } from '../utils/adhan';

export const useNextPrayer = (times: PrayerTimes | null, coords: Coordinates | null) => {
  const { location, method, madhab } = useSettings();
  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: DateTime } | null>(null);

  useEffect(() => {
    if (!times || !location || !coords) return;

    const now = DateTime.now().setZone(location.tz);
    const prayerEntries: [string, Date][] = [
      ['Fajr', times.fajr],
      ['Sunrise', times.sunrise],
      ['Dhuhr', times.dhuhr],
      ['Asr', times.asr],
      ['Maghrib', times.maghrib],
      ['Isha', times.isha],
    ];

    let next: { name: string; time: DateTime } | null = null;

    for (const [name, time] of prayerEntries) {
      const prayerTime = DateTime.fromJSDate(time).setZone(location.tz);
      if (prayerTime > now) {
        next = { name, time: prayerTime };
        break;
      }
    }

    if (!next) {
      const tomorrow = now.plus({ days: 1 });
      const tomorrowDate = new Date(tomorrow.year, tomorrow.month - 1, tomorrow.day);
      const params = makeParams(method, madhab);
      const tomorrowTimes = new PrayerTimes(coords, tomorrowDate, params);
      next = { name: 'Fajr', time: DateTime.fromJSDate(tomorrowTimes.fajr).setZone(location.tz) };
    }

    setNextPrayer(next);
  }, [times, location, coords]);

  return nextPrayer;
};
