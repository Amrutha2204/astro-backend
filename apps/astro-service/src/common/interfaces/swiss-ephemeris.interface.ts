export interface PlanetaryPosition {
  planet: string;
  longitude: number;
  latitude: number;
  distance: number;
  speed: number;
  sign: string;
  signDegree: number;
}

export interface HouseCusp {
  house: number;
  longitude: number;
  sign: string;
  signDegree: number;
}

export interface BirthChartData {
  ascendant: {
    longitude: number;
    sign: string;
    signDegree: number;
  };
  mc: {
    longitude: number;
    sign: string;
    signDegree: number;
  };
  planets: PlanetaryPosition[];
  houses: HouseCusp[];
  julianDay: number;
}
