import { HouseSystem } from '../../common/constants/astrology.constants';

export interface BirthDetails {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  latitude: number;
  longitude: number;
  houseSystem?: HouseSystem;
}

export interface VedicChartData {
  lagna: {
    sign: string;
    degree: number;
    longitude: number;
  };
  sunSign: {
    sign: string;
    degree: number;
    longitude: number;
  };
  moonSign: {
    sign: string;
    degree: number;
    longitude: number;
  };
  planets: Array<{
    planet: string;
    sign: string;
    degree: number;
    longitude: number;
    nakshatra?: string;
    pada?: number;
  }>;
  houses: Array<{
    house: number;
    sign: string;
    degree: number;
    longitude: number;
  }>;
}
