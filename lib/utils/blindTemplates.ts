import { BlindLevel } from '@/lib/types';

export interface BlindTemplate {
  name: string;
  description: string;
  levelDuration: number; // minutes
  levels: Omit<BlindLevel, 'id' | 'tournament_id'>[];
}

export const BLIND_TEMPLATES: BlindTemplate[] = [
  {
    name: 'Turbo',
    description: 'Parties rapides (5 min/niveau)',
    levelDuration: 5,
    levels: [
      { level_number: 1, small_blind: 25, big_blind: 50, ante: 0 },
      { level_number: 2, small_blind: 50, big_blind: 100, ante: 0 },
      { level_number: 3, small_blind: 75, big_blind: 150, ante: 0 },
      { level_number: 4, small_blind: 100, big_blind: 200, ante: 25 },
      { level_number: 5, small_blind: 150, big_blind: 300, ante: 25 },
      { level_number: 6, small_blind: 200, big_blind: 400, ante: 50 },
      { level_number: 7, small_blind: 300, big_blind: 600, ante: 75 },
      { level_number: 8, small_blind: 400, big_blind: 800, ante: 100 },
      { level_number: 9, small_blind: 500, big_blind: 1000, ante: 100 },
      { level_number: 10, small_blind: 600, big_blind: 1200, ante: 200 },
      { level_number: 11, small_blind: 800, big_blind: 1600, ante: 200 },
      { level_number: 12, small_blind: 1000, big_blind: 2000, ante: 300 },
    ],
  },
  {
    name: 'Normal',
    description: 'Rythme standard (10 min/niveau)',
    levelDuration: 10,
    levels: [
      { level_number: 1, small_blind: 25, big_blind: 50, ante: 0 },
      { level_number: 2, small_blind: 50, big_blind: 100, ante: 0 },
      { level_number: 3, small_blind: 75, big_blind: 150, ante: 0 },
      { level_number: 4, small_blind: 100, big_blind: 200, ante: 0 },
      { level_number: 5, small_blind: 150, big_blind: 300, ante: 25 },
      { level_number: 6, small_blind: 200, big_blind: 400, ante: 50 },
      { level_number: 7, small_blind: 250, big_blind: 500, ante: 50 },
      { level_number: 8, small_blind: 300, big_blind: 600, ante: 75 },
      { level_number: 9, small_blind: 400, big_blind: 800, ante: 100 },
      { level_number: 10, small_blind: 500, big_blind: 1000, ante: 100 },
      { level_number: 11, small_blind: 600, big_blind: 1200, ante: 200 },
      { level_number: 12, small_blind: 800, big_blind: 1600, ante: 200 },
      { level_number: 13, small_blind: 1000, big_blind: 2000, ante: 300 },
      { level_number: 14, small_blind: 1500, big_blind: 3000, ante: 400 },
      { level_number: 15, small_blind: 2000, big_blind: 4000, ante: 500 },
    ],
  },
  {
    name: 'Deep Stack',
    description: 'Parties longues (15 min/niveau)',
    levelDuration: 15,
    levels: [
      { level_number: 1, small_blind: 25, big_blind: 50, ante: 0 },
      { level_number: 2, small_blind: 50, big_blind: 100, ante: 0 },
      { level_number: 3, small_blind: 75, big_blind: 150, ante: 0 },
      { level_number: 4, small_blind: 100, big_blind: 200, ante: 0 },
      { level_number: 5, small_blind: 125, big_blind: 250, ante: 0 },
      { level_number: 6, small_blind: 150, big_blind: 300, ante: 25 },
      { level_number: 7, small_blind: 200, big_blind: 400, ante: 50 },
      { level_number: 8, small_blind: 250, big_blind: 500, ante: 50 },
      { level_number: 9, small_blind: 300, big_blind: 600, ante: 75 },
      { level_number: 10, small_blind: 400, big_blind: 800, ante: 100 },
      { level_number: 11, small_blind: 500, big_blind: 1000, ante: 100 },
      { level_number: 12, small_blind: 600, big_blind: 1200, ante: 150 },
      { level_number: 13, small_blind: 800, big_blind: 1600, ante: 200 },
      { level_number: 14, small_blind: 1000, big_blind: 2000, ante: 300 },
      { level_number: 15, small_blind: 1200, big_blind: 2400, ante: 400 },
      { level_number: 16, small_blind: 1500, big_blind: 3000, ante: 500 },
      { level_number: 17, small_blind: 2000, big_blind: 4000, ante: 500 },
      { level_number: 18, small_blind: 2500, big_blind: 5000, ante: 1000 },
    ],
  },
];

export function getBlindTemplate(name: string): BlindTemplate | undefined {
  return BLIND_TEMPLATES.find((t) => t.name === name);
}
