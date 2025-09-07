import {
  CalculationMethod,
  CalculationParameters,
  Madhab,
  HighLatitudeRule,
  PolarCircleResolution
} from 'adhan';

export function makeParams(method: string, madhab: 'Shafi' | 'Hanafi'): CalculationParameters {
  const methodMapping: Record<string, () => CalculationParameters> = {
    'Muslim World League': CalculationMethod.MuslimWorldLeague,
    'ISNA (North America)': CalculationMethod.NorthAmerica,
    'Umm al-Qura (Makkah)': CalculationMethod.UmmAlQura,
    'Egyptian General Authority': CalculationMethod.Egyptian,
    'Dubai': CalculationMethod.Dubai,
    'Kuwait': CalculationMethod.Kuwait,
    'Qatar': CalculationMethod.Qatar,
    'Singapore': CalculationMethod.Singapore,
    'Tehran': CalculationMethod.Tehran,
    'Turkey': CalculationMethod.Turkey
  };

  const constructor = methodMapping[method];
  if (!constructor) throw new Error(`Unknown method: ${method}`);

  const base = constructor();
  base.madhab = madhab === 'Hanafi' ? Madhab.Hanafi : Madhab.Shafi;
  base.highLatitudeRule = HighLatitudeRule.MiddleOfTheNight;
  base.polarCircleResolution = PolarCircleResolution.AqrabBalad;

  return base;
}
