'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Card, CardBody, CardHeader } from '@/components/common/Card';

export default function NewCashGamePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    gameType: 'NLH',
    smallBlind: '0.25',
    bigBlind: '0.50',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!authLoading && !isAuthenticated) {
    router.push('/auth/login');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error: insertError } = await supabase
        .from('cash_games')
        .insert({
          organizer_id: user.id,
          name: formData.name || `Cash Game ${new Date().toLocaleDateString()}`,
          game_type: formData.gameType,
          small_blind: parseFloat(formData.smallBlind),
          big_blind: parseFloat(formData.bigBlind),
          status: 'active',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      router.push(`/cash-games/${data.id}`);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Nouveau Cash Game
        </h1>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Paramètres
            </h2>
          </CardHeader>

          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <Input
                label="Nom de la session (optionnel)"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Home Game Friday"
              />

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Type de jeu
                </label>
                <select
                  value={formData.gameType}
                  onChange={(e) => setFormData({ ...formData, gameType: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="NLH">No-Limit Hold'em</option>
                  <option value="PLO">Pot-Limit Omaha</option>
                  <option value="Mixed">Mixed Games</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Small Blind (€)"
                  type="number"
                  step="0.25"
                  min="0.01"
                  value={formData.smallBlind}
                  onChange={(e) => setFormData({ ...formData, smallBlind: e.target.value })}
                  required
                />

                <Input
                  label="Big Blind (€)"
                  type="number"
                  step="0.25"
                  min="0.01"
                  value={formData.bigBlind}
                  onChange={(e) => setFormData({ ...formData, bigBlind: e.target.value })}
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? 'Création...' : 'Démarrer la session'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
