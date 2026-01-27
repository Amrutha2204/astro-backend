export interface GunaMilanResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  verdict: 'Excellent' | 'Good' | 'Average' | 'Below Average';
  gunas: Array<{
    name: string;
    score: number;
    maxScore: number;
    description: string;
  }>;
}

export interface CompatibilityResult {
  gunaMilan: GunaMilanResult;
  doshas: {
    manglik: string;
    nadi: string;
    bhakoot: string;
  };
  strengths: string[];
  challenges: string[];
  overallVerdict: string;
}
