import { useState, useEffect } from 'react';
import { Target, Plus, Edit, Trash2, Save, X, TrendingUp, Users, DollarSign, Award, ChevronUp, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Objective {
  id: string;
  event_id: string;
  user_id: string;
  objective_type: 'primary' | 'secondary';
  metric_type: 'people_count' | 'opportunity_value' | 'quality_score';
  title: string;
  description: string | null;
  target_value: number;
  current_value: number;
  unit: string;
  achieved: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

interface EventObjectivesProps {
  eventId: string;
}

const METRIC_TYPES = [
  { value: 'people_count', label: 'Nombre de personnes', icon: Users, unit: 'personnes' },
  { value: 'opportunity_value', label: 'Valeur d\'opportunité', icon: DollarSign, unit: '€' },
  { value: 'quality_score', label: 'Score de qualité', icon: Award, unit: '%' },
];

export function EventObjectives({ eventId }: EventObjectivesProps) {
  const { user } = useAuth();
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    metric_type: 'people_count' as 'people_count' | 'opportunity_value' | 'quality_score',
    title: '',
    description: '',
    target_value: 0,
    current_value: 0,
    unit: 'personnes',
  });

  useEffect(() => {
    loadObjectives();
  }, [eventId]);

  const loadObjectives = async () => {
    try {
      const { data, error } = await supabase
        .from('event_objectives')
        .select('*')
        .eq('event_id', eventId)
        .order('priority', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setObjectives(data || []);
    } catch (error) {
      console.error('Error loading objectives:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingId) {
        const { error } = await supabase
          .from('event_objectives')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const maxPriority = objectives.length > 0
          ? Math.max(...objectives.map(o => o.priority))
          : 0;

        const { error } = await supabase
          .from('event_objectives')
          .insert({
            event_id: eventId,
            user_id: user.id,
            objective_type: 'primary',
            ...formData,
            priority: maxPriority + 1,
          });

        if (error) throw error;
      }

      await loadObjectives();
      resetForm();
    } catch (error) {
      console.error('Error saving objective:', error);
      toast.error('Erreur lors de la sauvegarde de l\'objectif');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet objectif ?')) return;

    try {
      const deletedObj = objectives.find(o => o.id === id);
      if (!deletedObj) return;

      const { error } = await supabase
        .from('event_objectives')
        .delete()
        .eq('id', id);

      if (error) throw error;

      const toUpdate = objectives
        .filter(o => o.id !== id && o.priority > deletedObj.priority)
        .map(o => ({
          id: o.id,
          priority: o.priority - 1,
        }));

      for (const obj of toUpdate) {
        await supabase
          .from('event_objectives')
          .update({ priority: obj.priority })
          .eq('id', obj.id);
      }

      await loadObjectives();
    } catch (error) {
      console.error('Error deleting objective:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleEdit = (objective: Objective) => {
    setFormData({
      metric_type: objective.metric_type,
      title: objective.title,
      description: objective.description || '',
      target_value: objective.target_value,
      current_value: objective.current_value,
      unit: objective.unit,
    });
    setEditingId(objective.id);
    setShowAddModal(true);
  };

  const updateCurrentValue = async (id: string, newValue: number) => {
    try {
      const objective = objectives.find(o => o.id === id);
      if (!objective) return;

      const achieved = newValue >= objective.target_value;

      const { error } = await supabase
        .from('event_objectives')
        .update({
          current_value: newValue,
          achieved,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      await loadObjectives();
    } catch (error) {
      console.error('Error updating current value:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      metric_type: 'people_count',
      title: '',
      description: '',
      target_value: 0,
      current_value: 0,
      unit: 'personnes',
    });
    setEditingId(null);
    setShowAddModal(false);
  };

  const getMetricIcon = (metricType: string) => {
    const metric = METRIC_TYPES.find(m => m.value === metricType);
    return metric ? metric.icon : Target;
  };

  const calculateProgress = (current: number, target: number) => {
    if (target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  };

  const moveObjective = async (objectiveId: string, direction: 'up' | 'down') => {
    try {
      const currentIndex = objectives.findIndex(o => o.id === objectiveId);
      if (currentIndex === -1) return;

      const currentObj = objectives[currentIndex];
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

      if (targetIndex < 0 || targetIndex >= objectives.length) return;

      const targetObj = objectives[targetIndex];

      await supabase
        .from('event_objectives')
        .update({ priority: targetObj.priority })
        .eq('id', currentObj.id);

      await supabase
        .from('event_objectives')
        .update({ priority: currentObj.priority })
        .eq('id', targetObj.id);

      await loadObjectives();
    } catch (error) {
      console.error('Error moving objective:', error);
      toast.error('Erreur lors du déplacement');
    }
  };

  if (loading) {
    return <div className="animate-pulse h-32 bg-gray-100 rounded-2xl"></div>;
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-600" />
          Objectifs mesurables
        </h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all text-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          Ajouter
        </button>
      </div>

      {objectives.length === 0 ? (
        <div className="text-center py-8">
          <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">Aucun objectif défini</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            Définir votre premier objectif
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {objectives.map((objective, index) => {
            const Icon = getMetricIcon(objective.metric_type);
            const progress = calculateProgress(objective.current_value, objective.target_value);

            return (
              <div
                key={objective.id}
                className="p-4 bg-gradient-to-r from-blue-50/50 to-sky-50/30 rounded-xl border border-blue-100 hover:border-blue-200 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 bg-blue-600 rounded-lg">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                          Objectif {index + 1}
                        </span>
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">{objective.title}</h4>
                      {objective.description && (
                        <p className="text-sm text-gray-600">{objective.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveObjective(objective.id, 'up')}
                      disabled={index === 0}
                      className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Déplacer vers le haut"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveObjective(objective.id, 'down')}
                      disabled={index === objectives.length - 1}
                      className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Déplacer vers le bas"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(objective)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(objective.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Progression</span>
                    <span className="font-bold text-gray-900">
                      {objective.current_value} / {objective.target_value} {objective.unit}
                    </span>
                  </div>
                  <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`absolute top-0 left-0 h-full rounded-full transition-all ${
                        objective.achieved ? 'bg-green-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={objective.current_value}
                      onChange={(e) => updateCurrentValue(objective.id, parseFloat(e.target.value) || 0)}
                      className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      step="0.01"
                    />
                    {objective.achieved && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-semibold">
                        <TrendingUp className="w-3 h-3" />
                        Atteint
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingId ? 'Modifier l\'objectif' : 'Nouvel objectif'}
              </h2>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Type de métrique
                </label>
                <select
                  value={formData.metric_type}
                  onChange={(e) => {
                    const metricType = e.target.value as typeof formData.metric_type;
                    const metric = METRIC_TYPES.find(m => m.value === metricType);
                    setFormData({
                      ...formData,
                      metric_type: metricType,
                      unit: metric?.unit || 'personnes',
                    });
                  }}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {METRIC_TYPES.map((metric) => (
                    <option key={metric.value} value={metric.value}>
                      {metric.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Titre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Rencontrer 50 décideurs"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Détails de l'objectif..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Valeur cible <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.target_value}
                    onChange={(e) => setFormData({ ...formData, target_value: parseFloat(e.target.value) || 0 })}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="50"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Valeur actuelle
                  </label>
                  <input
                    type="number"
                    value={formData.current_value}
                    onChange={(e) => setFormData({ ...formData, current_value: parseFloat(e.target.value) || 0 })}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Unité
                </label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="personnes, €, %..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold flex items-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {editingId ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
