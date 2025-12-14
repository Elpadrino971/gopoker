import { Settlement, CashGamePlayer } from '@/lib/types';

/**
 * Optimize settlements to minimize number of transactions
 */
export function optimizeSettlements(players: CashGamePlayer[]): Settlement[] {
  const settlements: Settlement[] = [];

  // Calculate net result for each player
  const playerResults = players.map((p) => ({
    name: p.player_name,
    amount: p.net_result,
  }));

  // Separate winners and losers
  const winners = playerResults.filter((p) => p.amount > 0).sort((a, b) => b.amount - a.amount);
  const losers = playerResults.filter((p) => p.amount < 0).sort((a, b) => a.amount - b.amount);

  let winnerIdx = 0;
  let loserIdx = 0;

  while (winnerIdx < winners.length && loserIdx < losers.length) {
    const winner = winners[winnerIdx];
    const loser = losers[loserIdx];

    const amount = Math.min(
      Math.abs(winner.amount),
      Math.abs(loser.amount)
    );

    if (amount > 0) {
      settlements.push({
        from: loser.name,
        to: winner.name,
        amount: roundToHalf(amount),
      });
    }

    winner.amount -= amount;
    loser.amount += amount;

    if (Math.abs(winner.amount) < 0.01) winnerIdx++;
    if (Math.abs(loser.amount) < 0.01) loserIdx++;
  }

  return settlements;
}

function roundToHalf(amount: number): number {
  return Math.round(amount * 2) / 2;
}
