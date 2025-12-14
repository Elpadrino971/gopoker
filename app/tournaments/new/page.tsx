'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Card, CardBody, CardHeader } from '@/components/common/Card';
import { BLIND_TEMPLATES } from '@/lib/utils/blindTemplates';

export default function NewTournamentPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    buyInAmount: '20',
    startingStack: '10000',
    levelDuration: '10',
    maxRebuys: '1',
    maxAddons: '1',
    lateRegistrationLevels: '4',
    blindTemplate: 'Normal',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Redirect if not authenticated
  if (!authLoading && !isAuthenticated) {
    router.push('/auth/login');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create tournament
      const { data: tournament, error: tournamentError } = await supabase
        .from('tournaments')
        .insert({
          organizer_id: user.id,
          name: formData.name,
          buy_in_amount: parseFloat(formData.buyInAmount),
          starting_stack: parseInt(formData.startingStack),
          level_duration: parseInt(formData.levelDuration),
          max_rebuys: parseInt(formData.maxRebuys),
          max_addons: parseInt(formData.maxAddons),
          late_registration_levels: parseInt(formData.lateRegistrationLevels),
          status: 'scheduled',
        })
        .select()
        .single();

      if (tournamentError) throw tournamentError;

      // Create blind levels
      const template = BLIND_TEMPLATES.find((t) => t.name === formData.blindTemplate);
      if (template) {
        const blindLevels = template.levels.map((level) => ({
          tournament_id: tournament.id,
          ...level,
        }));

        const { error: blindsError } = await supabase
          .from('blind_levels')
          .insert(blindLevels);

        if (blindsError) throw blindsError;
      }

      // Redirect to tournament detail
      router.push(`/tournaments/${tournament.id}`);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Créer un Tournoi
        </h1>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Paramètres du tournoi
            </h2>
          </CardHeader>

          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* General Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Informations générales
                </h3>

                <Input
                  label="Nom du tournoi"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Sunday Poker"
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Buy-in (€)"
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.buyInAmount}
                    onChange={(e) => setFormData({ ...formData, buyInAmount: e.target.value })}
                    required
                  />

                  <Input
                    label="Stack de départ"
                    type="number"
                    step="1000"
                    min="1000"
                    value={formData.startingStack}
                    onChange={(e) => setFormData({ ...formData, startingStack: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Blind Structure */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Structure des blinds
                </h3>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Template de blinds
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {BLIND_TEMPLATES.map((template) => (
                      <button
                        key={template.name}
                        type="button"
                        onClick={() => setFormData({ ...formData, blindTemplate: template.name, levelDuration: template.levelDuration.toString() })}
                        className={`
                          p-4 rounded-lg border-2 text-left transition-all
                          ${formData.blindTemplate === template.name
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                          }
                        `}
                      >
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {template.name}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {template.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <Input
                  label="Durée des niveaux (minutes)"
                  type="number"
                  min="3"
                  max="60"
                  value={formData.levelDuration}
                  onChange={(e) => setFormData({ ...formData, levelDuration: e.target.value })}
                  required
                />
              </div>

              {/* Options */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Options
                </h3>

                <div className="grid grid-cols-3 gap-4">
                  <Input
                    label="Rebuys max"
                    type="number"
                    min="0"
                    max="10"
                    value={formData.maxRebuys}
                    onChange={(e) => setFormData({ ...formData, maxRebuys: e.target.value })}
                  />

                  <Input
                    label="Add-ons max"
                    type="number"
                    min="0"
                    max="10"
                    value={formData.maxAddons}
                    onChange={(e) => setFormData({ ...formData, maxAddons: e.target.value })}
                  />

                  <Input
                    label="Late reg (niveaux)"
                    type="number"
                    min="0"
                    max="20"
                    value={formData.lateRegistrationLevels}
                    onChange={(e) => setFormData({ ...formData, lateRegistrationLevels: e.target.value })}
                  />
                </div>
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
                  {isSubmitting ? 'Création...' : 'Créer le tournoi'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
