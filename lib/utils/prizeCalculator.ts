import { Prize } from '@/lib/types';

/**
 * Calculate prize distribution based on number of players
 */
export function calculatePrizes(
  totalPrizePool: number,
  playerCount: number,
  customStructure?: number[]
): Prize[] {
  const structure = customStructure || getDefaultStructure(playerCount);

  return structure.map((percentage, index) => ({
    position: index + 1,
    amount: roundToHalf(totalPrizePool * percentage / 100),
    percentage,
  }));
}

/**
 * Get default prize structure based on player count
 */
function getDefaultStructure(playerCount: number): number[] {
  if (playerCount <= 5) return [100];
  if (playerCount <= 10) return [70, 30];
  if (playerCount <= 20) return [50, 30, 20];
  if (playerCount <= 30) return [40, 25, 15, 10, 6, 4];

  // For 31+ players
  return [35, 22, 14, 10, 7, 5, 4, 3];
}

/**
 * Round to nearest 0.50
 */
function roundToHalf(amount: number): number {
  return Math.round(amount * 2) / 2;
}

/**
 * Get default prize structure percentages for display
 */
export function getDefaultPrizeStructure(playerCount: number): number[] {
  return getDefaultStructure(playerCount);
}
