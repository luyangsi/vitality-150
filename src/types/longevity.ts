export type LongevityPillar =
  | 'zone2_cardio'
  | 'vo2max'
  | 'hrv_readiness'
  | 'strength'
  | 'mobility'
  | 'sleep_recovery';

export interface HRVEntry {
  date: string;
  hrvMs: number;
  restingHeartRate?: number;
  readinessScore?: number;
  notes?: string;
}

export interface VO2MaxEntry {
  date: string;
  estimatedVO2Max: number;
  testMethod: 'cooper_12min' | 'rockport_1mile' | 'resting_hr_estimate' | 'device_sync' | 'manual';
  notes?: string;
}

export interface Zone2Session {
  date: string;
  durationMinutes: number;
  avgHeartRate?: number;
  activityType: 'run' | 'bike' | 'row' | 'swim' | 'walk' | 'other';
  notes?: string;
}

export interface MobilityAssessment {
  date: string;
  overallScore: number;   // 0-100
  components: {
    hipFlexorLeft?: number;
    hipFlexorRight?: number;
    ankleLeft?: number;
    ankleRight?: number;
    thoracicRotation?: number;
    shoulderFlexion?: number;
    hamstringLeft?: number;
    hamstringRight?: number;
  };
  notes?: string;
}

export interface StrengthBenchmark {
  date: string;
  bodyweightKg: number;
  gripStrengthKg?: number;
  legPressRatio?: number;
  deadliftRatio?: number;
  pushUpCount?: number;
  pullUpCount?: number;
}

export interface DailyLongevityLog {
  date: string;          // YYYY-MM-DD (primary key)
  hrv?: HRVEntry;
  zone2?: Zone2Session;
  mobilityScore?: number;
  sleepHours?: number;
  sleepQuality?: number; // 1-5
  stressLevel?: number;  // 1-5
  alcoholUnits?: number;
  notes?: string;
  muscleSoreness?: Partial<Record<string, number>>;  // muscle group → 1-5
  injuryNotes?: string;
}

export interface LongevityScore {
  date: string;
  overall: number;       // 0-100
  breakdown: Record<LongevityPillar, number>;
  trend: 'improving' | 'stable' | 'declining';
}

export interface UserProfile {
  name: string;
  birthYear: number;
  gender: 'male' | 'female' | 'other';
  bodyweightKg: number;
  heightCm: number;
  maxHeartRate?: number;
  zone2HrFloor?: number;
  zone2HrCeiling?: number;
  weightUnit: 'kg' | 'lbs';
  zone2WeeklyTargetMinutes: number;
  onboardingComplete: boolean;
  createdAt: string;
}

export interface LongevityState {
  dailyLogs: DailyLongevityLog[];
  vo2MaxHistory: VO2MaxEntry[];
  mobilityHistory: MobilityAssessment[];
  strengthBenchmarks: StrengthBenchmark[];
  profile: UserProfile;
}
