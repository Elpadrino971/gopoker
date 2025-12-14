'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/common/Button';
import { Card, CardBody } from '@/components/common/Card';
import { Tournament } from '@/lib/types';
import { formatCurrency, formatRelativeTime } from '@/lib/utils/formatters';

export default function TournamentsPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadTournaments();
    }
  }, [isAuthenticated, user]);

  const loadTournaments = async () => {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTournaments(data || []);
    } catch (error) {
      console.error('Error loading tournaments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      scheduled: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      running: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      paused: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    };

    const labels = {
      scheduled: 'Programmé',
      running: 'En cours',
      paused: 'En pause',
      completed: 'Terminé',
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
            Connectez-vous pour voir vos tournois
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
          Mes Tournois
        </h1>
        <Link href="/tournaments/new">
          <Button variant="primary">Créer un tournoi</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      ) : tournaments.length === 0 ? (
        <Card>
          <CardBody>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎰</div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Aucun tournoi
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Créez votre premier tournoi pour commencer
              </p>
              <Link href="/tournaments/new">
                <Button variant="primary">Créer un tournoi</Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tournaments.map((tournament) => (
            <Card
              key={tournament.id}
              hover
              onClick={() => router.push(`/tournaments/${tournament.id}`)}
            >
              <CardBody>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {tournament.name}
                      </h3>
                      {getStatusBadge(tournament.status)}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>Buy-in: {formatCurrency(tournament.buy_in_amount)}</span>
                      <span>•</span>
                      <span>Stack: {tournament.starting_stack.toLocaleString()}</span>
                      <span>•</span>
                      <span>Niveaux: {tournament.level_duration} min</span>
                      <span>•</span>
                      <span>{formatRelativeTime(tournament.created_at)}</span>
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
