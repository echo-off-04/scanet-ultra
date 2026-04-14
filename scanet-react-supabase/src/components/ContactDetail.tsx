import { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Link2,
  Star,
  Calendar,
  MessageSquare,
  Edit,
  Trash2,
  Save,
  PhoneCall,
  Video,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../lib/database.types';

type Contact = Database['public']['Tables']['contacts']['Row'];
type Interaction = Database['public']['Tables']['interactions']['Row'];

interface ContactDetailProps {
  contact: Contact;
  onClose: () => void;
  onUpdate: () => void;
}

export function ContactDetail({ contact, onClose, onUpdate }: ContactDetailProps) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [showAddInteraction, setShowAddInteraction] = useState(false);
  const [editedContact, setEditedContact] = useState(contact);
  const [newInteraction, setNewInteraction] = useState({
    interaction_type: 'note' as const,
    subject: '',
    description: '',
  });

  useEffect(() => {
    loadInteractions();

    // Subscribe to interactions changes for this contact
    const interactionsSubscription = supabase
      .channel(`interactions-${contact.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'interactions',
        filter: `contact_id=eq.${contact.id}`
      }, () => {
        loadInteractions();
      })
      .subscribe();

    return () => {
      interactionsSubscription.unsubscribe();
    };
  }, [contact.id]);

  const loadInteractions = async () => {
    try {
      const { data, error } = await supabase
        .from('interactions')
        .select('*')
        .eq('contact_id', contact.id)
        .order('interaction_date', { ascending: false });

      if (error) throw error;
      setInteractions(data || []);
    } catch (error) {
      console.error('Error loading interactions:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('contacts')
        .update({
          full_name: editedContact.full_name,
          email: editedContact.email,
          phone: editedContact.phone,
          company: editedContact.company,
          job_title: editedContact.job_title,
          linkedin_url: editedContact.linkedin_url,
          rating: editedContact.rating,
          status: editedContact.status,
          notes: editedContact.notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', contact.id);

      if (error) throw error;
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating contact:', error);
      toast.error('Failed to update contact');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this contact?')) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('contacts').delete().eq('id', contact.id);

      if (error) throw error;
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Failed to delete contact');
    } finally {
      setLoading(false);
    }
  };

  const handleAddInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('interactions').insert({
        contact_id: contact.id,
        user_id: user.id,
        interaction_type: newInteraction.interaction_type,
        subject: newInteraction.subject,
        description: newInteraction.description,
      });

      if (error) throw error;
      setNewInteraction({ interaction_type: 'note', subject: '', description: '' });
      setShowAddInteraction(false);
      loadInteractions();
    } catch (error) {
      console.error('Error adding interaction:', error);
      toast.error('Failed to add interaction');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const interactionIcons = {
    call: PhoneCall,
    email: Mail,
    meeting: Video,
    note: FileText,
  };

  const statusColors: Record<string, string> = {
    lead: 'bg-orange-100 text-orange-700 border-orange-200',
    prospect: 'bg-amber-100 text-amber-700 border-amber-200',
    client: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    partner: 'bg-violet-100 text-violet-700 border-violet-200',
    collaborateur: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    ami: 'bg-pink-100 text-pink-700 border-pink-200',
    fournisseur: 'bg-amber-100 text-amber-700 border-amber-200',
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-primary px-6 py-6 rounded-t-3xl">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              {editedContact.avatar_url ? (
                <img
                  src={editedContact.avatar_url}
                  alt={editedContact.full_name}
                  className="w-20 h-20 rounded-2xl object-cover border-4 border-white/30"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-2xl font-bold border-4 border-white/30">
                  {getInitials(editedContact.full_name)}
                </div>
              )}
              <div>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedContact.full_name}
                    onChange={(e) =>
                      setEditedContact({ ...editedContact, full_name: e.target.value })
                    }
                    className="text-2xl font-bold bg-white/20 text-white px-3 py-1 rounded-xl border-2 border-white/30 focus:outline-none focus:border-white"
                  />
                ) : (
                  <h2 className="text-2xl font-bold text-white">
                    {editedContact.full_name}
                  </h2>
                )}
                {editedContact.rating && (
                  <div className="flex items-center gap-1 mt-1">
                    {[...Array(editedContact.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="p-2 bg-white hover:bg-white/90 text-teal-700 rounded-xl transition-colors disabled:opacity-50"
                  >
                    <Save className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-colors"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={loading}
                    className="p-2 bg-white/20 hover:bg-red-500 text-white rounded-xl transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={onClose}
                    className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            {isEditing ? (
              <select
                value={editedContact.status}
                onChange={(e) =>
                  setEditedContact({
                    ...editedContact,
                    status: e.target.value as any,
                  })
                }
                className="px-4 py-2 bg-white/20 text-white border-2 border-white/30 rounded-xl focus:outline-none focus:border-white"
              >
                <option value="lead">Lead</option>
                <option value="prospect">Prospect</option>
                <option value="client">Client</option>
                <option value="partner">Partenaire</option>
                <option value="collaborateur">Collaborateur</option>
                <option value="ami">Ami(e)</option>
                <option value="fournisseur">Fournisseur</option>
              </select>
            ) : (
              <span
                className={`px-4 py-2 rounded-xl text-sm font-medium ${
                  statusColors[editedContact.status]
                }`}
              >
                {editedContact.status}
              </span>
            )}
            {editedContact.source && (
              <span className="px-4 py-2 bg-white/20 text-white rounded-xl text-sm font-medium">
                {editedContact.source}
              </span>
            )}
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Contact Information
              </h3>

              {isEditing ? (
                <div className="space-y-3">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={editedContact.email || ''}
                      onChange={(e) =>
                        setEditedContact({ ...editedContact, email: e.target.value })
                      }
                      className="input-modern pl-10"
                      placeholder="Email"
                    />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={editedContact.phone || ''}
                      onChange={(e) =>
                        setEditedContact({ ...editedContact, phone: e.target.value })
                      }
                      className="input-modern pl-10"
                      placeholder="Phone"
                    />
                  </div>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={editedContact.company || ''}
                      onChange={(e) =>
                        setEditedContact({ ...editedContact, company: e.target.value })
                      }
                      className="input-modern pl-10"
                      placeholder="Company"
                    />
                  </div>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={editedContact.job_title || ''}
                      onChange={(e) =>
                        setEditedContact({ ...editedContact, job_title: e.target.value })
                      }
                      className="input-modern pl-10"
                      placeholder="Job Title"
                    />
                  </div>
                  <div className="relative">
                    <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="url"
                      value={editedContact.linkedin_url || ''}
                      onChange={(e) =>
                        setEditedContact({
                          ...editedContact,
                          linkedin_url: e.target.value,
                        })
                      }
                      className="input-modern pl-10"
                      placeholder="LinkedIn URL"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {editedContact.email && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <div className="p-2 bg-blue-50 rounded-2xl">
                        <Mail className="w-5 h-5 text-blue-600" />
                      </div>
                      <a
                        href={`mailto:${editedContact.email}`}
                        className="hover:text-teal-600 transition-colors"
                      >
                        {editedContact.email}
                      </a>
                    </div>
                  )}
                  {editedContact.phone && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <div className="p-2 bg-green-50 rounded-2xl">
                        <Phone className="w-5 h-5 text-green-600" />
                      </div>
                      <a
                        href={`tel:${editedContact.phone}`}
                        className="hover:text-blue-600 transition-colors"
                      >
                        {editedContact.phone}
                      </a>
                    </div>
                  )}
                  {editedContact.company && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <div className="p-2 bg-gray-50 rounded-2xl">
                        <Building2 className="w-5 h-5 text-gray-600" />
                      </div>
                      <span>{editedContact.company}</span>
                    </div>
                  )}
                  {editedContact.job_title && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <div className="p-2 bg-gray-50 rounded-2xl">
                        <Briefcase className="w-5 h-5 text-gray-600" />
                      </div>
                      <span>{editedContact.job_title}</span>
                    </div>
                  )}
                  {editedContact.linkedin_url && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <div className="p-2 bg-blue-50 rounded-2xl">
                        <Link2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <a
                        href={editedContact.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-teal-600 transition-colors truncate"
                      >
                        LinkedIn Profile
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Notes</h3>
              {isEditing ? (
                <textarea
                  value={editedContact.notes || ''}
                  onChange={(e) =>
                    setEditedContact({ ...editedContact, notes: e.target.value })
                  }
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                  placeholder="Add notes about this contact..."
                />
              ) : (
                <div className="bg-gray-50 rounded-xl p-4 min-h-[150px]">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {editedContact.notes || 'No notes yet'}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Interaction History
              </h3>
              <button
                onClick={() => setShowAddInteraction(!showAddInteraction)}
                className="btn-primary text-sm"
              >
                + Add Interaction
              </button>
            </div>

            {showAddInteraction && (
              <form
                onSubmit={handleAddInteraction}
                className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3"
              >
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={newInteraction.interaction_type}
                    onChange={(e) =>
                      setNewInteraction({
                        ...newInteraction,
                        interaction_type: e.target.value as any,
                      })
                    }
                    className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="note">Note</option>
                    <option value="call">Call</option>
                    <option value="email">Email</option>
                    <option value="meeting">Meeting</option>
                  </select>
                  <input
                    type="text"
                    value={newInteraction.subject}
                    onChange={(e) =>
                      setNewInteraction({
                        ...newInteraction,
                        subject: e.target.value,
                      })
                    }
                    placeholder="Subject"
                    className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <textarea
                  value={newInteraction.description}
                  onChange={(e) =>
                    setNewInteraction({
                      ...newInteraction,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  placeholder="Description..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddInteraction(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 btn-primary disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {interactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No interactions yet
                </div>
              ) : (
                interactions.map((interaction) => {
                  const Icon = interactionIcons[interaction.interaction_type];
                  return (
                    <div
                      key={interaction.id}
                      className="bg-gray-50 rounded-2xl p-4 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-white rounded-xl shadow-sm">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-1">
                            <h4 className="font-medium text-gray-900">
                              {interaction.subject || interaction.interaction_type}
                            </h4>
                            <span className="text-xs text-gray-500">
                              {new Date(interaction.interaction_date).toLocaleDateString()}
                            </span>
                          </div>
                          {interaction.description && (
                            <p className="text-sm text-gray-600">
                              {interaction.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
