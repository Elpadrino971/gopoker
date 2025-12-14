'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Card, CardBody, CardHeader } from '@/components/common/Card';
import { CashGame, CashGamePlayer, CashGameTransaction } from '@/lib/types';
import { formatCurrency } from '@/lib/utils/formatters';
import { optimizeSettlements } from '@/lib/utils/settlementOptimizer';

export default function CashGameDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const [cashGame, setCashGame] = useState<CashGame | null>(null);
  const [players, setPlayers] = useState<CashGamePlayer[]>([]);

  // Form states
  const [playerName, setPlayerName] = useState('');
  const [buyInAmount, setBuyInAmount] = useState('100');
  const [cashOutAmount, setCashOutAmount] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

  useEffect(() => {
    loadCashGameData();
  }, [unwrappedParams.id]);

  const loadCashGameData = async () => {
    try {
      // Load cash game
      const { data: gameData, error: gameError } = await supabase
        .from('cash_games')
        .select('*')
        .eq('id', unwrappedParams.id)
        .single();

      if (gameError) throw gameError;
      setCashGame(gameData);

      // Load players
      const { data: playersData, error: playersError } = await supabase
        .from('cash_game_players')
        .select('*')
        .eq('cash_game_id', unwrappedParams.id)
        .order('joined_at');

      if (playersError) throw playersError;
      setPlayers(playersData || []);
    } catch (error) {
      console.error('Error loading cash game:', error);
    }
  };

  const addPlayer = async () => {
    if (!playerName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('cash_game_players')
        .insert({
          cash_game_id: unwrappedParams.id,
          player_name: playerName.trim(),
          total_buy_in: parseFloat(buyInAmount),
          total_cash_out: 0,
          net_result: -parseFloat(buyInAmount),
        })
        .select()
        .single();

      if (error) throw error;

      // Add transaction
      await supabase.from('cash_game_transactions').insert({
        cash_game_player_id: data.id,
        type: 'buy_in',
        amount: parseFloat(buyInAmount),
      });

      setPlayers([...players, data]);
      setPlayerName('');
      setBuyInAmount('100');
    } catch (error) {
      console.error('Error adding player:', error);
    }
  };

  const addBuyIn = async (playerId: string) => {
    const amount = parseFloat(buyInAmount);
    if (!amount) return;

    try {
      const player = players.find(p => p.id === playerId);
      if (!player) return;

      const newTotal = player.total_buy_in + amount;
      const newNet = player.total_cash_out - newTotal;

      await supabase
        .from('cash_game_players')
        .update({
          total_buy_in: newTotal,
          net_result: newNet,
        })
        .eq('id', playerId);

      await supabase.from('cash_game_transactions').insert({
        cash_game_player_id: playerId,
        type: 'buy_in',
        amount,
      });

      setPlayers(players.map(p =>
        p.id === playerId
          ? { ...p, total_buy_in: newTotal, net_result: newNet }
          : p
      ));
    } catch (error) {
      console.error('Error adding buy-in:', error);
    }
  };

  const cashOut = async (playerId: string) => {
    const amount = parseFloat(cashOutAmount);
    if (!amount) return;

    try {
      const player = players.find(p => p.id === playerId);
      if (!player) return;

      const newTotal = player.total_cash_out + amount;
      const newNet = newTotal - player.total_buy_in;

      await supabase
        .from('cash_game_players')
        .update({
          total_cash_out: newTotal,
          net_result: newNet,
        })
        .eq('id', playerId);

      await supabase.from('cash_game_transactions').insert({
        cash_game_player_id: playerId,
        type: 'cash_out',
        amount,
      });

      setPlayers(players.map(p =>
        p.id === playerId
          ? { ...p, total_cash_out: newTotal, net_result: newNet }
          : p
      ));

      setCashOutAmount('');
      setSelectedPlayer(null);
    } catch (error) {
      console.error('Error cashing out:', error);
    }
  };

  const endSession = async () => {
    if (!confirm('Terminer la session ?')) return;

    try {
      await supabase
        .from('cash_games')
        .update({
          status: 'completed',
          ended_at: new Date().toISOString(),
        })
        .eq('id', unwrappedParams.id);

      setCashGame(prev => prev ? { ...prev, status: 'completed' } : null);
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  if (!cashGame) {
    return (
      <div className="container mx-auto px-4 py-16">
        <p className="text-center text-gray-600 dark:text-gray-400">Chargement...</p>
      </div>
    );
  }

  const settlements = cashGame.status === 'completed' ? optimizeSettlements(players) : [];
  const totalPot = players.reduce((sum, p) => sum + p.total_buy_in, 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()}>
          ← Retour
        </Button>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {cashGame.name || `Cash Game ${new Date(cashGame.started_at).toLocaleDateString()}`}
        </h1>

        {cashGame.status === 'active' && (
          <Button variant="danger" onClick={endSession}>
            Terminer la session
          </Button>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Players */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Joueurs ({players.length})
              </h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-3 mb-4">
                {players.map((player) => (
                  <div key={player.id} className="p-4 rounded-lg border border-gray-300 dark:border-gray-600">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {player.player_name}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          In: {formatCurrency(player.total_buy_in)} • Out: {formatCurrency(player.total_cash_out)}
                        </div>
                      </div>

                      <div className={`text-2xl font-bold ${
                        player.net_result > 0
                          ? 'text-green-600 dark:text-green-400'
                          : player.net_result < 0
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {player.net_result > 0 ? '+' : ''}{formatCurrency(player.net_result)}
                      </div>
                    </div>

                    {cashGame.status === 'active' && (
                      <div className="flex gap-2 mt-3">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => addBuyIn(player.id)}
                        >
                          +{buyInAmount}€
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setSelectedPlayer(selectedPlayer === player.id ? null : player.id)}
                        >
                          Cash out
                        </Button>
                      </div>
                    )}

                    {selectedPlayer === player.id && (
                      <div className="flex gap-2 mt-3">
                        <Input
                          type="number"
                          step="0.5"
                          value={cashOutAmount}
                          onChange={(e) => setCashOutAmount(e.target.value)}
                          placeholder="Montant"
                        />
                        <Button variant="primary" onClick={() => cashOut(player.id)}>
                          OK
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {cashGame.status === 'active' && (
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Nom du joueur"
                    onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
                  />
                  <Input
                    type="number"
                    step="10"
                    value={buyInAmount}
                    onChange={(e) => setBuyInAmount(e.target.value)}
                    placeholder="Buy-in"
                    className="w-32"
                  />
                  <Button variant="primary" onClick={addPlayer} disabled={!playerName.trim()}>
                    Ajouter
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Settlements */}
          {cashGame.status === 'completed' && settlements.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Settlements
                </h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  {settlements.map((settlement, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="text-gray-900 dark:text-white">
                        <span className="font-semibold">{settlement.from}</span>
                        {' paie '}
                        <span className="font-semibold">{settlement.to}</span>
                      </div>
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(settlement.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Résumé
              </h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total pot</span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(totalPot)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Joueurs</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {players.length}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Type</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {cashGame.game_type}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Blinds</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(cashGame.small_blind)} / {formatCurrency(cashGame.big_blind)}
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
