export interface DoshaDetails {
  manglik: {
    hasDosha: boolean;
    description: string;
    severity?: 'High' | 'Medium' | 'Low' | 'None';
  };
  nadi: {
    hasDosha: boolean;
    description: string;
  };
  bhakoot: {
    hasDosha: boolean;
    description: string;
  };
  totalDoshas: number;
}
