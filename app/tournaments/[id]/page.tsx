'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Card, CardBody, CardHeader } from '@/components/common/Card';
import { Tournament, BlindLevel, TournamentPlayer, Prize } from '@/lib/types';
import { formatTime, formatCurrency } from '@/lib/utils/formatters';
import { calculatePrizes } from '@/lib/utils/prizeCalculator';

export default function TournamentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [blindLevels, setBlindLevels] = useState<BlindLevel[]>([]);
  const [players, setPlayers] = useState<TournamentPlayer[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);

  // Timer state
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // Add player form
  const [playerName, setPlayerName] = useState('');
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);

  useEffect(() => {
    loadTournamentData();
  }, [unwrappedParams.id]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && remainingSeconds > 0) {
      interval = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            // Level finished - move to next
            nextLevel();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, remainingSeconds]);

  // Calculate prizes when players change
  useEffect(() => {
    if (players.length > 0 && tournament) {
      const totalPrizePool = players.reduce((sum, p) => sum + (p.total_invested || 0), 0);
      const calculatedPrizes = calculatePrizes(totalPrizePool, players.length);
      setPrizes(calculatedPrizes);
    }
  }, [players, tournament]);

  const loadTournamentData = async () => {
    try {
      // Load tournament
      const { data: tournamentData, error: tournamentError } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', unwrappedParams.id)
        .single();

      if (tournamentError) throw tournamentError;
      setTournament(tournamentData);

      // Load blind levels
      const { data: blindsData, error: blindsError } = await supabase
        .from('blind_levels')
        .select('*')
        .eq('tournament_id', unwrappedParams.id)
        .order('level_number');

      if (blindsError) throw blindsError;
      setBlindLevels(blindsData || []);

      // Load players
      const { data: playersData, error: playersError } = await supabase
        .from('tournament_players')
        .select('*')
        .eq('tournament_id', unwrappedParams.id)
        .order('created_at');

      if (playersError) throw playersError;
      setPlayers(playersData || []);

      // Set remaining seconds from tournament
      if (tournamentData.remaining_seconds) {
        setRemainingSeconds(tournamentData.remaining_seconds);
      } else if (tournamentData.level_duration) {
        setRemainingSeconds(tournamentData.level_duration * 60);
      }

      // Set running state
      if (tournamentData.status === 'running') {
        setIsRunning(true);
      }
    } catch (error) {
      console.error('Error loading tournament:', error);
    }
  };

  const startTournament = async () => {
    if (!tournament) return;

    try {
      const { error } = await supabase
        .from('tournaments')
        .update({
          status: 'running',
          started_at: new Date().toISOString(),
          remaining_seconds: tournament.level_duration * 60,
        })
        .eq('id', unwrappedParams.id);

      if (error) throw error;

      setIsRunning(true);
      setRemainingSeconds(tournament.level_duration * 60);
      setTournament({ ...tournament, status: 'running' });
    } catch (error) {
      console.error('Error starting tournament:', error);
    }
  };

  const pauseTournament = async () => {
    try {
      const { error } = await supabase
        .from('tournaments')
        .update({
          status: 'paused',
          remaining_seconds: remainingSeconds,
        })
        .eq('id', unwrappedParams.id);

      if (error) throw error;

      setIsRunning(false);
      setTournament(prev => prev ? { ...prev, status: 'paused' } : null);
    } catch (error) {
      console.error('Error pausing tournament:', error);
    }
  };

  const resumeTournament = () => {
    setIsRunning(true);
    supabase
      .from('tournaments')
      .update({ status: 'running' })
      .eq('id', unwrappedParams.id);

    setTournament(prev => prev ? { ...prev, status: 'running' } : null);
  };

  const nextLevel = async () => {
    if (!tournament) return;

    const newLevel = (tournament.current_level || 1) + 1;

    try {
      const { error } = await supabase
        .from('tournaments')
        .update({
          current_level: newLevel,
          remaining_seconds: tournament.level_duration * 60,
        })
        .eq('id', unwrappedParams.id);

      if (error) throw error;

      setTournament({ ...tournament, current_level: newLevel });
      setRemainingSeconds(tournament.level_duration * 60);
    } catch (error) {
      console.error('Error moving to next level:', error);
    }
  };

  const addPlayer = async () => {
    if (!playerName.trim() || !tournament) return;

    setIsAddingPlayer(true);
    try {
      const { data, error } = await supabase
        .from('tournament_players')
        .insert({
          tournament_id: unwrappedParams.id,
          player_name: playerName.trim(),
          buy_ins: 1,
          total_invested: tournament.buy_in_amount,
        })
        .select()
        .single();

      if (error) throw error;

      setPlayers([...players, data]);
      setPlayerName('');
    } catch (error) {
      console.error('Error adding player:', error);
    } finally {
      setIsAddingPlayer(false);
    }
  };

  const addRebuy = async (playerId: string) => {
    if (!tournament) return;

    const player = players.find(p => p.id === playerId);
    if (!player) return;

    try {
      const newRebuys = player.rebuys + 1;
      const newTotal = player.total_invested + tournament.buy_in_amount;

      const { error } = await supabase
        .from('tournament_players')
        .update({
          rebuys: newRebuys,
          total_invested: newTotal,
        })
        .eq('id', playerId);

      if (error) throw error;

      setPlayers(players.map(p =>
        p.id === playerId
          ? { ...p, rebuys: newRebuys, total_invested: newTotal }
          : p
      ));
    } catch (error) {
      console.error('Error adding rebuy:', error);
    }
  };

  const eliminatePlayer = async (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    const activePlayers = players.filter(p => p.status === 'active');
    const finishPosition = activePlayers.length;

    try {
      const { error } = await supabase
        .from('tournament_players')
        .update({
          status: 'eliminated',
          finish_position: finishPosition,
          eliminated_at: new Date().toISOString(),
        })
        .eq('id', playerId);

      if (error) throw error;

      setPlayers(players.map(p =>
        p.id === playerId
          ? { ...p, status: 'eliminated', finish_position: finishPosition }
          : p
      ));
    } catch (error) {
      console.error('Error eliminating player:', error);
    }
  };

  if (!tournament) {
    return (
      <div className="container mx-auto px-4 py-16">
        <p className="text-center text-gray-600 dark:text-gray-400">Chargement...</p>
      </div>
    );
  }

  const currentLevel = blindLevels.find(l => l.level_number === (tournament.current_level || 1));
  const nextBlindLevel = blindLevels.find(l => l.level_number === (tournament.current_level || 1) + 1);
  const activePlayers = players.filter(p => p.status === 'active');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()}>
          ← Retour
        </Button>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        {tournament.name}
      </h1>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Timer */}
        <div className="lg:col-span-2">
          <Card>
            <CardBody>
              <div className="text-center py-8">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  NIVEAU {tournament.current_level || 1}
                </div>

                {currentLevel && (
                  <div className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                    {currentLevel.small_blind} / {currentLevel.big_blind}
                    {currentLevel.ante > 0 && (
                      <span className="text-2xl text-gray-600 dark:text-gray-400 ml-2">
                        ({currentLevel.ante})
                      </span>
                    )}
                  </div>
                )}

                <div className="text-7xl font-mono font-bold text-blue-600 dark:text-blue-400 my-8">
                  {formatTime(remainingSeconds)}
                </div>

                {nextBlindLevel && (
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    Prochain niveau : {nextBlindLevel.small_blind} / {nextBlindLevel.big_blind}
                    {nextBlindLevel.ante > 0 && ` (${nextBlindLevel.ante})`}
                  </div>
                )}

                <div className="flex gap-3 justify-center">
                  {tournament.status === 'scheduled' && (
                    <Button variant="primary" size="lg" onClick={startTournament}>
                      Démarrer le tournoi
                    </Button>
                  )}

                  {tournament.status === 'running' && (
                    <>
                      <Button variant="secondary" size="lg" onClick={pauseTournament}>
                        Pause
                      </Button>
                      <Button variant="primary" size="lg" onClick={nextLevel}>
                        Niveau suivant
                      </Button>
                    </>
                  )}

                  {tournament.status === 'paused' && (
                    <Button variant="primary" size="lg" onClick={resumeTournament}>
                      Reprendre
                    </Button>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Players */}
          <Card className="mt-6">
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Joueurs ({activePlayers.length} en jeu)
              </h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-3 mb-4">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      player.status === 'eliminated'
                        ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-60'
                        : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {player.player_name}
                        {player.status === 'eliminated' && (
                          <span className="ml-2 text-sm text-red-600 dark:text-red-400">
                            (#{player.finish_position})
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {player.buy_ins} buy-in{player.buy_ins > 1 ? 's' : ''} + {player.rebuys} rebuy{player.rebuys > 1 ? 's' : ''} • {formatCurrency(player.total_invested)}
                      </div>
                    </div>

                    {player.status === 'active' && (
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => addRebuy(player.id)}
                          disabled={player.rebuys >= tournament.max_rebuys}
                        >
                          +Rebuy
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => eliminatePlayer(player.id)}
                        >
                          Éliminer
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Nom du joueur"
                  onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
                  disabled={isAddingPlayer}
                />
                <Button
                  variant="primary"
                  onClick={addPlayer}
                  disabled={!playerName.trim() || isAddingPlayer}
                >
                  Ajouter
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Prize Pool */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Prize Pool
              </h3>
            </CardHeader>
            <CardBody>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-4">
                {formatCurrency(players.reduce((sum, p) => sum + p.total_invested, 0))}
              </div>

              <div className="space-y-2">
                {prizes.slice(0, 5).map((prize) => (
                  <div key={prize.position} className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {prize.position === 1 ? '🥇' : prize.position === 2 ? '🥈' : prize.position === 3 ? '🥉' : `${prize.position}e`}
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(prize.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Info */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Informations
              </h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Buy-in</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(tournament.buy_in_amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Stack</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {tournament.starting_stack.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Niveaux</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {tournament.level_duration} min
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Rebuys max</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {tournament.max_rebuys}
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
