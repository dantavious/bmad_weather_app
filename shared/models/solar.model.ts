export interface SolarPanel {
  wattage: number;      // Individual panel wattage
  quantity: number;     // Number of panels
  efficiency: number;   // 0-100 percentage
}

export interface SolarCalculationResult {
  totalDailyKwh: number;
  hourlyGeneration: HourlyGeneration[];
  peakHours: string[];
  cloudImpact: number;  // Percentage reduction
}

export interface HourlyGeneration {
  hour: string;         // "00:00" format
  kwh: number;
  irradiance: number;   // W/m²
}

export interface SolarIrradianceData {
  latitude: number;
  longitude: number;
  date: Date;
  hourlyIrradiance: number[];  // 24 hour array of W/m²
  sunriseHour: number;
  sunsetHour: number;
}