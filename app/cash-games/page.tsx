'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/common/Button';
import { Card, CardBody } from '@/components/common/Card';
import { CashGame } from '@/lib/types';
import { formatCurrency, formatRelativeTime } from '@/lib/utils/formatters';

export default function CashGamesPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [cashGames, setCashGames] = useState<CashGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadCashGames();
    }
  }, [isAuthenticated, user]);

  const loadCashGames = async () => {
    try {
      const { data, error } = await supabase
        .from('cash_games')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCashGames(data || []);
    } catch (error) {
      console.error('Error loading cash games:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    };

    const labels = {
      active: 'En cours',
      completed: 'Terminée',
    };

    return (
      <span className={`px-2 py-1 rounded-md text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Connectez-vous pour voir vos cash games
          </h1>
          <Link href="/auth/login">
            <Button variant="primary">Se connecter</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Cash Games
        </h1>
        <Link href="/cash-games/new">
          <Button variant="primary">Nouvelle session</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      ) : cashGames.length === 0 ? (
        <Card>
          <CardBody>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💰</div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Aucune session
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Créez votre première session de cash game
              </p>
              <Link href="/cash-games/new">
                <Button variant="primary">Nouvelle session</Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4">
          {cashGames.map((game) => (
            <Card
              key={game.id}
              hover
              onClick={() => router.push(`/cash-games/${game.id}`)}
            >
              <CardBody>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {game.name || `Cash Game ${new Date(game.started_at).toLocaleDateString()}`}
                      </h3>
                      {getStatusBadge(game.status)}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>{game.game_type}</span>
                      <span>•</span>
                      <span>Blinds: {formatCurrency(game.small_blind)} / {formatCurrency(game.big_blind)}</span>
                      <span>•</span>
                      <span>{formatRelativeTime(game.started_at)}</span>
                    </div>
                  </div>

                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
