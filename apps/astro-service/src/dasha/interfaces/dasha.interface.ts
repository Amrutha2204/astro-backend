export interface DashaPeriod {
  dasha: string;
  antardasha: string;
  pratyantardasha?: string;
  startDate: string;
  endDate: string;
  planet: string;
  duration: number;
}

export interface DashaDetails {
  current: {
    mahadasha: string;
    antardasha: string;
    pratyantardasha?: string;
    startDate: string;
    endDate: string;
    planet: string;
    remainingDays: number;
  };
  timeline: DashaPeriod[];
}
