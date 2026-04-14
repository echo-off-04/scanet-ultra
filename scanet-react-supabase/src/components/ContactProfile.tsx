import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Phone, Mail, MessageCircle, Share2, Star,
  Edit, Save, X, Plus, MapPin, Building2, Briefcase,
  TrendingUp, Calendar, History, StickyNote, Camera, Trash2, Edit3, Users,
  Tag, Target, Heart, Sparkles, ChevronRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { PhoneInput } from './PhoneInput';
import { COUNTRIES, getRegionsByCountryCode } from '../lib/countries';

interface ContactProfileProps {
  contactId: string;
  onBack: () => void;
  onNavigateToEnterprise?: () => void;
}

interface Contact {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  job_title: string | null;
  city: string | null;
  country: string | null;
  region: string | null;
  address: string | null;
  website: string | null;
  linkedin: string | null;
  twitter: string | null;
  notes: string | null;
  tags: string[] | null;
  is_favorite: boolean;
  avatar_url: string | null;
  rating: number;
  industry: string | null;
  company_size: string | null;
  last_activity_date: string | null;
  notes_count: number;
  status: string | null;
  relationship: string | null;
  is_member: boolean;
}

interface Note {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface Activity {
  id: string;
  activity_type: 'call' | 'email' | 'message' | 'meeting' | 'other';
  description: string;
  activity_date: string;
  created_at: string;
}

interface Opportunity {
  id: string;
  title: string;
  amount: number | null;
  currency: string;
  status: 'prospect' | 'negotiation' | 'won' | 'lost';
  probability: number;
  expected_close_date: string | null;
  description: string | null;
  created_at: string;
}

interface Event {
  id: string;
  name: string;
  start_date: string;
  location: string | null;
  description: string | null;
}

interface Relationship {
  id: string;
  related_contact: {
    id: string;
    full_name: string;
    company: string | null;
    job_title: string | null;
    avatar_url: string | null;
  };
  relationship_type: string;
  notes: string | null;
}

const ACTIVITY_TYPES = [
  { value: 'call', label: 'Appel', icon: Phone },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'message', label: 'Message', icon: MessageCircle },
  { value: 'meeting', label: 'Réunion', icon: Calendar },
  { value: 'other', label: 'Autre', icon: History },
];

const OPPORTUNITY_STATUS = [
  { value: 'prospect', label: 'Prospect', color: 'bg-gray-100 text-gray-800' },
  { value: 'negotiation', label: 'Négociation', color: 'bg-blue-100 text-blue-800' },
  { value: 'won', label: 'Gagné', color: 'bg-green-100 text-green-800' },
  { value: 'lost', label: 'Perdu', color: 'bg-red-100 text-red-800' },
];

const MAX_LENGTHS = {
  full_name: 100,
  email: 100,
  phone: 20,
  company: 100,
  job_title: 100,
  city: 50,
  address: 200,
  website: 200,
  linkedin: 200,
  twitter: 100,
  industry: 100,
  note: 1000,
  activity_description: 500,
  opportunity_title: 150,
  opportunity_description: 500,
  event_name: 150,
  event_location: 150,
  event_description: 500,
};

export function ContactProfile({ contactId, onBack, onNavigateToEnterprise }: ContactProfileProps) {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();
  const [contact, setContact] = useState<Contact | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContact, setEditedContact] = useState<Contact | null>(null);
  const [availableRegions, setAvailableRegions] = useState<string[]>([]);
  const [newNote, setNewNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [showOpportunityForm, setShowOpportunityForm] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [editingOpportunityId, setEditingOpportunityId] = useState<string | null>(null);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [enterpriseExists, setEnterpriseExists] = useState<boolean>(false);
  const [showEnterpriseWarning, setShowEnterpriseWarning] = useState(false);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [showAddRelationshipForm, setShowAddRelationshipForm] = useState(false);
  const [availableContacts, setAvailableContacts] = useState<Contact[]>([]);
  const [selectedRelatedContacts, setSelectedRelatedContacts] = useState<string[]>([]);
  const [relationshipType, setRelationshipType] = useState<string>('contact');
  const [contactSearchQuery, setContactSearchQuery] = useState<string>('');

  useEffect(() => {
    loadContactData();
  }, [contactId]);

  useEffect(() => {
    const checkEnterprise = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('enterprises')
          .select('id')
          .eq('owner_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error checking enterprise:', error);
          return;
        }
        setEnterpriseExists(!!data);
      } catch (error) {
        console.error('Error checking enterprise:', error);
      }
    };
    checkEnterprise();
  }, [user]);

  const loadContactData = async () => {
    try {
      setLoading(true);

      const { data: contactEventLinks } = await supabase
        .from('contact_events')
        .select('event_id')
        .eq('contact_id', contactId);

      const eventIds = contactEventLinks?.map(link => link.event_id) || [];

      const [contactRes, eventsRes, notesRes, activitiesRes, opportunitiesRes, relationshipsRes] = await Promise.all([
        supabase.from('contacts').select('*').eq('id', contactId).maybeSingle(),
        eventIds.length > 0
          ? supabase.from('events').select('*').in('id', eventIds).order('start_date', { ascending: false })
          : Promise.resolve({ data: [] }),
        supabase.from('contact_notes').select('*').eq('contact_id', contactId).order('created_at', { ascending: false }),
        supabase.from('contact_activities').select('*').eq('contact_id', contactId).order('activity_date', { ascending: false }).limit(20),
        supabase.from('contact_opportunities').select('*').eq('contact_id', contactId).order('created_at', { ascending: false }),
        supabase
          .from('contact_relationships')
          .select(`
            id,
            relationship_type,
            notes,
            related_contact:related_contact_id (
              id,
              full_name,
              company,
              job_title,
              avatar_url
            )
          `)
          .eq('contact_id', contactId),
      ]);

      if (contactRes.data) {
        setContact(contactRes.data);
        setEditedContact(contactRes.data);

        if (contactRes.data.country) {
          const country = COUNTRIES.find(c => c.name === contactRes.data.country);
          if (country) {
            const regions = getRegionsByCountryCode(country.code);
            setAvailableRegions(regions);
          }
        }
      }

      if (eventsRes.data) setEvents(eventsRes.data);
      if (notesRes.data) setNotes(notesRes.data);
      if (activitiesRes.data) setActivities(activitiesRes.data);
      if (opportunitiesRes.data) setOpportunities(opportunitiesRes.data);
      if (relationshipsRes.data) setRelationships(relationshipsRes.data as any);
    } catch (error) {
      console.error('Error loading contact data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getQualityLabel = (rating: number) => {
    if (rating >= 4.5) return { label: 'Excellent', color: 'text-green-600' };
    if (rating >= 3.5) return { label: 'Très bon', color: 'text-blue-600' };
    if (rating >= 2.5) return { label: 'Bon', color: 'text-yellow-600' };
    if (rating >= 1.5) return { label: 'Moyen', color: 'text-orange-600' };
    return { label: 'Faible', color: 'text-red-600' };
  };

  const toggleNoteExpansion = (noteId: string) => {
    setExpandedNotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      return newSet;
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !contact) return;

    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${contact.id}-${Date.now()}.${fileExt}`;
    const filePath = `${user?.id}/${fileName}`;

    try {
      setUploadingPhoto(true);

      const { error: uploadError } = await supabase.storage
        .from('contact-avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('contact-avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('contacts')
        .update({ avatar_url: publicUrl })
        .eq('id', contact.id);

      if (updateError) throw updateError;

      setContact({ ...contact, avatar_url: publicUrl });
      setEditedContact({ ...contact, avatar_url: publicUrl });
    } catch (error) {
      console.error('Error uploading photo:', error);
      showToast('Erreur', 'Erreur lors du téléchargement de la photo', 'error');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRatingChange = async (newRating: number) => {
    if (!contact) return;

    try {
      const { error } = await supabase
        .from('contacts')
        .update({ rating: newRating })
        .eq('id', contact.id);

      if (error) throw error;

      setContact({ ...contact, rating: newRating });
    } catch (error) {
      console.error('Error updating rating:', error);
    }
  };

  const handleToggleMember = async () => {
    if (!contact) return;

    const newIsMember = !contact.is_member;

    if (newIsMember && !enterpriseExists) {
      setShowEnterpriseWarning(true);
      return;
    }

    try {
      const { error } = await supabase
        .from('contacts')
        .update({ is_member: newIsMember })
        .eq('id', contact.id);

      if (error) throw error;

      setContact({ ...contact, is_member: newIsMember });
      setEditedContact({ ...contact, is_member: newIsMember });
    } catch (error) {
      console.error('Error updating member status:', error);
      showToast('Erreur', 'Erreur lors de la mise à jour du statut membre', 'error');
    }
  };

  const handleToggleFavorite = async () => {
    if (!contact) return;

    try {
      const newIsFavorite = !contact.is_favorite;
      const { error } = await supabase
        .from('contacts')
        .update({ is_favorite: newIsFavorite })
        .eq('id', contact.id);

      if (error) throw error;

      setContact({ ...contact, is_favorite: newIsFavorite });
      setEditedContact({ ...contact, is_favorite: newIsFavorite });
    } catch (error) {
      console.error('Error updating favorite status:', error);
      showToast('Erreur', 'Erreur lors de la mise à jour du statut favori', 'error');
    }
  };

  const handleSaveEdit = async () => {
    if (!editedContact) return;

    try {
      const updateData = {
        full_name: editedContact.full_name,
        email: editedContact.email || null,
        phone: editedContact.phone || null,
        company: editedContact.company || null,
        job_title: editedContact.job_title || null,
        city: editedContact.city || null,
        country: editedContact.country || null,
        region: editedContact.region || null,
        address: editedContact.address || null,
        website: editedContact.website || null,
        linkedin: editedContact.linkedin || null,
        twitter: editedContact.twitter || null,
        tags: editedContact.tags,
        is_favorite: editedContact.is_favorite,
        industry: editedContact.industry || null,
        company_size: editedContact.company_size || null,
        is_member: editedContact.is_member,
        status: editedContact.status || null,
        relationship: editedContact.relationship || null,
      };

      const { error } = await supabase
        .from('contacts')
        .update(updateData)
        .eq('id', editedContact.id);

      if (error) throw error;

      setContact(editedContact);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating contact:', error);
      showToast('Erreur', 'Erreur lors de la mise à jour du contact', 'error');
    }
  };

  const handleCancelEdit = () => {
    setEditedContact(contact);
    setIsEditing(false);
    setShowAddRelationshipForm(false);
    setSelectedRelatedContacts([]);
    setRelationshipType('contact');
    setContactSearchQuery('');
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !contact || !user) return;

    try {
      const { error } = await supabase
        .from('contact_notes')
        .insert({
          contact_id: contact.id,
          user_id: user.id,
          content: newNote,
        });

      if (error) throw error;

      setNewNote('');
      setShowNoteInput(false);
      loadContactData();
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const handleEditNote = async (noteId: string) => {
    if (!editingNoteContent.trim()) return;

    try {
      const { error } = await supabase
        .from('contact_notes')
        .update({
          content: editingNoteContent,
          updated_at: new Date().toISOString(),
        })
        .eq('id', noteId);

      if (error) throw error;

      setEditingNoteId(null);
      setEditingNoteContent('');
      loadContactData();
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette note ?')) return;

    try {
      const { error } = await supabase
        .from('contact_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      loadContactData();
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const handleDeleteContact = async () => {
    if (!contact) return;

    try {
      setDeleting(true);

      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contact.id);

      if (error) throw error;

      onBack();
    } catch (error) {
      console.error('Error deleting contact:', error);
      showToast('Erreur', 'Erreur lors de la suppression du contact', 'error');
      setDeleting(false);
    }
  };

  const handleDeleteOpportunity = async (opportunityId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette opportunité ?')) return;

    try {
      const { error } = await supabase
        .from('contact_opportunities')
        .delete()
        .eq('id', opportunityId);

      if (error) throw error;

      loadContactData();
    } catch (error) {
      console.error('Error deleting opportunity:', error);
      showToast('Erreur', 'Erreur lors de la suppression de l\'opportunité', 'error');
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette activité ?')) return;

    try {
      const { error } = await supabase
        .from('contact_activities')
        .delete()
        .eq('id', activityId);

      if (error) throw error;

      loadContactData();
    } catch (error) {
      console.error('Error deleting activity:', error);
      showToast('Erreur', 'Erreur lors de la suppression de l\'activité', 'error');
    }
  };

  const handleAddActivity = async (activityType: string, description: string, activityTime: string) => {
    if (!contact || !user) return;

    try {
      const { error } = await supabase
        .from('contact_activities')
        .insert({
          contact_id: contact.id,
          user_id: user.id,
          activity_type: activityType,
          description,
          activity_date: activityTime,
        });

      if (error) throw error;

      setShowActivityForm(false);
      loadContactData();
    } catch (error) {
      console.error('Error adding activity:', error);
    }
  };

  const loadAvailableContacts = async () => {
    if (!user || !contact) return;

    try {
      const existingRelationshipIds = relationships.map(r => r.related_contact.id);

      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)
        .neq('id', contact.id)
        .order('full_name');

      if (error) throw error;

      const filtered = data?.filter(c => !existingRelationshipIds.includes(c.id)) || [];
      setAvailableContacts(filtered);
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const handleAddRelationship = async () => {
    if (selectedRelatedContacts.length === 0 || !contact || !user) return;

    try {
      const relationshipsToInsert = selectedRelatedContacts.map(relatedContactId => ({
        user_id: user.id,
        contact_id: contact.id,
        related_contact_id: relatedContactId,
        relationship_type: relationshipType,
        notes: null,
      }));

      const { error } = await supabase
        .from('contact_relationships')
        .insert(relationshipsToInsert);

      if (error) throw error;

      const count = selectedRelatedContacts.length;
      showToast('Succès', `${count} contact${count > 1 ? 's ajoutés' : ' ajouté'} au réseau`, 'success');
      setShowAddRelationshipForm(false);
      setSelectedRelatedContacts([]);
      setRelationshipType('contact');
      setContactSearchQuery('');
      loadContactData();
    } catch (error) {
      console.error('Error adding relationship:', error);
      showToast('Erreur', 'Erreur lors de l\'ajout au réseau', 'error');
    }
  };

  const handleDeleteRelationship = async (relationshipId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir retirer ce contact du réseau ?')) return;

    try {
      const { error } = await supabase
        .from('contact_relationships')
        .delete()
        .eq('id', relationshipId);

      if (error) throw error;

      showToast('Succès', 'Contact retiré du réseau', 'success');
      loadContactData();
    } catch (error) {
      console.error('Error deleting relationship:', error);
      showToast('Erreur', 'Erreur lors de la suppression', 'error');
    }
  };

  const handleCall = () => {
    if (contact?.phone) {
      window.location.href = `tel:${contact.phone}`;
      const now = new Date().toISOString();
      handleAddActivity('call', `Appel vers ${contact.full_name}`, now);
    }
  };

  const handleEmail = () => {
    if (contact?.email) {
      window.location.href = `mailto:${contact.email}`;
      const now = new Date().toISOString();
      handleAddActivity('email', `Email envoyé à ${contact.full_name}`, now);
    }
  };

  const handleWhatsApp = () => {
    if (contact?.phone) {
      const phone = contact.phone.replace(/[^0-9]/g, '');
      window.open(`https://wa.me/${phone}`, '_blank');
      const now = new Date().toISOString();
      handleAddActivity('message', `Message WhatsApp à ${contact.full_name}`, now);
    }
  };

  const handleShare = async () => {
    if (!contact) return;

    const shareData = {
      title: contact.full_name,
      text: `Contact: ${contact.full_name}${contact.company ? ` - ${contact.company}` : ''}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(
          `${contact.full_name}${contact.company ? ` - ${contact.company}` : ''}\n${contact.email || ''}\n${contact.phone || ''}`
        );
        showToast('Succès', 'Informations copiées dans le presse-papier', 'success');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!editedContact) return;

    const countryName = e.target.value;
    const country = COUNTRIES.find(c => c.name === countryName);

    if (country) {
      const regions = getRegionsByCountryCode(country.code);
      setAvailableRegions(regions);
      setEditedContact({ ...editedContact, country: countryName, region: '' });
    } else {
      setEditedContact({ ...editedContact, country: '', region: '' });
      setAvailableRegions([]);
    }
  };

  const formatCurrency = (amount: number | null, currency: string) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency || 'EUR',
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading || !contact) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-[#0E3A5D] mx-auto"></div>
            <Sparkles className="w-6 h-6 text-[#0E3A5D] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-gray-600 font-medium mt-4">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  const displayContact = isEditing ? editedContact : contact;
  if (!displayContact) return null;

  // Calcul des statistiques pour les cartes
  const totalOpportunitiesAmount = opportunities.reduce((sum, opp) => sum + (opp.amount || 0), 0);
  const mainCurrency = opportunities.length > 0 ? opportunities[0].currency : 'EUR';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header avec image de couverture style 2026 */}
      <div className="relative">
        {/* Background avec effet glassmorphism */}
        <div className="h-56 sm:h-64 md:h-72 relative overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'url(https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=1920)',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
          <div className="absolute inset-0 bg-[#0E3A5D]/80"></div>
          <div className="absolute inset-0 backdrop-blur-[2px]"></div>

          {/* Effet de particules/confetti subtil */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-10 left-10 w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></div>
            <div className="absolute top-20 right-20 w-3 h-3 bg-pink-300 rounded-full animate-pulse delay-100"></div>
            <div className="absolute bottom-20 left-1/4 w-2 h-2 bg-blue-300 rounded-full animate-pulse delay-200"></div>
            <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-green-300 rounded-full animate-pulse delay-300"></div>
          </div>
        </div>

        {/* Navigation header */}
        <div className="absolute top-0 left-0 right-0 z-20">
          <div className="flex items-center justify-between p-4 sm:p-6">
            <button
              onClick={onBack}
              className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl hover:bg-white/30 transition-all duration-300 border border-white/20"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>

            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancelEdit}
                    className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl hover:bg-white/30 transition-all duration-300 border border-white/20"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="p-2.5 bg-white rounded-2xl hover:bg-gray-100 transition-all duration-300 shadow-lg"
                  >
                    <Save className="w-5 h-5 text-[#0E3A5D]" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl hover:bg-white/30 transition-all duration-300 border border-white/20"
                  >
                    <Edit className="w-5 h-5 text-white" />
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl hover:bg-red-500/50 transition-all duration-300 border border-white/20"
                  >
                    <Trash2 className="w-5 h-5 text-white" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Photo de profil centrée - Style 2026 */}
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-16 sm:-bottom-20 z-30">
          <div className="relative group">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-white p-1.5 shadow-2xl shadow-blue-600/20">
              <div className="w-full h-full rounded-full overflow-hidden bg-[#0E3A5D] flex items-center justify-center">
                {displayContact.avatar_url ? (
                  <img
                    src={displayContact.avatar_url}
                    alt={displayContact.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-4xl sm:text-5xl font-bold">
                    {displayContact.full_name ? displayContact.full_name.charAt(0).toUpperCase() : '?'}
                  </span>
                )}
              </div>
            </div>

            {/* Bouton upload photo */}
            <label
              htmlFor="avatar-upload"
              className="absolute bottom-2 right-2 p-2.5 bg-white rounded-full shadow-lg hover:shadow-xl cursor-pointer transition-all duration-300 hover:scale-110 border-2 border-gray-100"
            >
              {uploadingPhoto ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#0E3A5D] border-t-transparent"></div>
              ) : (
                <Camera className="w-4 h-4 text-[#0E3A5D]" />
              )}
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
              disabled={uploadingPhoto}
            />

            {/* Badge favori */}
            {displayContact.is_favorite && (
              <div className="absolute -top-1 -right-1 p-2 bg-amber-500 rounded-full shadow-lg">
                <Heart className="w-4 h-4 text-white fill-white" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="pt-20 sm:pt-24 pb-8">
        {/* Nom et infos de base */}
        <div className="text-center px-4 mb-6">
          {isEditing ? (
            <input
              type="text"
              value={displayContact.full_name}
              onChange={(e) =>
                setEditedContact({ ...displayContact, full_name: e.target.value.slice(0, MAX_LENGTHS.full_name) })
              }
              className="text-2xl sm:text-3xl font-bold text-gray-900 bg-gray-100 rounded-2xl px-4 py-2 w-full max-w-md mx-auto text-center border-2 border-blue-200 focus:border-[#0E3A5D] focus:outline-none transition-all"
              maxLength={MAX_LENGTHS.full_name}
              placeholder="Nom complet"
            />
          ) : (
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{displayContact.full_name}</h1>
          )}

          {displayContact.job_title && !isEditing && (
            <p className="text-gray-500 flex items-center justify-center gap-1.5 mt-2">
              <Briefcase className="w-4 h-4" />
              {displayContact.job_title}
            </p>
          )}

          {/* Badges de statut */}
          <div className="flex flex-wrap justify-center gap-2 mt-3">
            {displayContact.is_member && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-600 text-white shadow-sm">
                <Users className="w-3.5 h-3.5" />
                Membre
              </span>
            )}
            {displayContact.status && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#0E3A5D] text-white shadow-sm">
                <Target className="w-3.5 h-3.5" />
                {displayContact.status.charAt(0).toUpperCase() + displayContact.status.slice(1)}
              </span>
            )}
            {displayContact.company && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                <Building2 className="w-3.5 h-3.5" />
                {displayContact.company}
              </span>
            )}
          </div>
        </div>

        {/* Cartes de statistiques - Style 2026 */}
        <div className="px-4 mb-6">
          <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
            {/* Carte Coordonnées */}
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 overflow-hidden">
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 truncate px-1">
                  {(displayContact.email ? 1 : 0) + (displayContact.phone ? 1 : 0) + (displayContact.address ? 1 : 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1 truncate px-1">Coordonnées</p>
              </div>
            </div>

            {/* Carte Opportunités */}
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 overflow-hidden">
              <div className="text-center">
                <p
                  className="text-xl sm:text-2xl font-bold text-gray-900 truncate px-1 leading-tight cursor-default"
                  title={formatCurrency(totalOpportunitiesAmount, mainCurrency).replace(/\s/g, '')}
                >
                  {formatCurrency(totalOpportunitiesAmount, mainCurrency).replace(/\s/g, '')}
                </p>
                <p className="text-xs text-gray-500 mt-1 truncate px-1">Opportunités</p>
              </div>
            </div>

            {/* Carte Événements */}
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 overflow-hidden">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 truncate px-1">{events.length}</p>
                </div>
                <p className="text-xs text-gray-500 mt-1 truncate px-1">Événements</p>
              </div>
            </div>
          </div>
        </div>

        {/* Boutons d'action rapide - Style 2026 */}
        {!isEditing && (
          <div className="px-4 mb-6">
            <div className="flex justify-center gap-3 flex-wrap">
              {displayContact.phone && (
                <>
                  <button
                    onClick={handleCall}
                    className="flex items-center gap-2 px-5 py-3 bg-[#0E3A5D] text-white rounded-2xl hover:bg-blue-800 transition-all duration-300 shadow-lg shadow-blue-600/30 font-semibold text-sm"
                  >
                    <Phone className="w-4 h-4" />
                    <span className="hidden xs:inline">Appeler</span>
                  </button>
                  <button
                    onClick={handleWhatsApp}
                    className="flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all duration-300 shadow-lg shadow-emerald-500/30 font-semibold text-sm"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="hidden xs:inline">WhatsApp</span>
                  </button>
                </>
              )}
              {displayContact.email && (
                <button
                  onClick={handleEmail}
                  className="flex items-center gap-2 px-5 py-3 bg-white text-gray-700 rounded-2xl hover:bg-gray-50 transition-all duration-300 shadow-sm border border-gray-200 font-semibold text-sm"
                >
                  <Mail className="w-4 h-4" />
                  <span className="hidden xs:inline">Email</span>
                </button>
              )}
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-5 py-3 bg-white text-gray-700 rounded-2xl hover:bg-gray-50 transition-all duration-300 shadow-sm border border-gray-200 font-semibold text-sm"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden xs:inline">Partager</span>
              </button>
              <button
                onClick={handleToggleMember}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl transition-all duration-300 shadow-sm font-semibold text-sm ${displayContact.is_member
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                title={displayContact.is_member ? 'Retirer de mon entreprise' : 'Ajouter à mon entreprise'}
              >
                <Users className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Contenu des sections */}
        <div className="px-4 space-y-4 max-w-4xl mx-auto">

          {/* Section Évaluation - Style carte moderne */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <Star className="w-4 h-4 text-[#0E3A5D]" />
                </div>
                Évaluation
              </h2>
              <span className={`text-sm font-semibold ${getQualityLabel(displayContact.rating || 0).color}`}>
                {getQualityLabel(displayContact.rating || 0).label}
              </span>
            </div>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRatingChange(star)}
                  className="cursor-pointer hover:scale-125 transition-transform duration-200"
                >
                  <Star
                    className={`w-8 h-8 sm:w-10 sm:h-10 ${star <= (displayContact.rating || 0)
                        ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                        : 'text-gray-200'
                      }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Grille des sections principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Carte Coordonnées */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-xl">
                    <MapPin className="w-4 h-4 text-[#0E3A5D]" />
                  </div>
                  Coordonnées
                </h2>
              </div>

              <div className="space-y-3">
                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Email</label>
                      <input
                        type="email"
                        value={displayContact.email || ''}
                        onChange={(e) => setEditedContact({ ...displayContact, email: e.target.value.slice(0, MAX_LENGTHS.email) })}
                        className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D] transition-all text-sm"
                        placeholder="email@example.com"
                        maxLength={MAX_LENGTHS.email}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Téléphone</label>
                      <PhoneInput value={displayContact.phone || ''} onChange={(value) => setEditedContact({ ...displayContact, phone: value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Adresse</label>
                      <input
                        type="text"
                        value={displayContact.address || ''}
                        onChange={(e) => setEditedContact({ ...displayContact, address: e.target.value.slice(0, MAX_LENGTHS.address) })}
                        className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D] transition-all text-sm"
                        placeholder="123 rue de la Paix"
                        maxLength={MAX_LENGTHS.address}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Ville</label>
                        <input
                          type="text"
                          value={displayContact.city || ''}
                          onChange={(e) => setEditedContact({ ...displayContact, city: e.target.value.slice(0, MAX_LENGTHS.city) })}
                          className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D] transition-all text-sm"
                          placeholder="Paris"
                          maxLength={MAX_LENGTHS.city}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Région</label>
                        {availableRegions.length > 0 ? (
                          <select value={displayContact.region || ''} onChange={(e) => setEditedContact({ ...displayContact, region: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D] transition-all text-sm">
                            <option value="">Sélectionner...</option>
                            {availableRegions.map((region) => (<option key={region} value={region}>{region}</option>))}
                          </select>
                        ) : (
                          <input type="text" value={displayContact.region || ''} onChange={(e) => setEditedContact({ ...displayContact, region: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D] transition-all text-sm" placeholder="Région" />
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Pays</label>
                      <select value={displayContact.country || ''} onChange={handleCountryChange} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D] transition-all text-sm">
                        <option value="">Sélectionner...</option>
                        {COUNTRIES.map((country) => (<option key={country.code} value={country.name}>{country.flag} {country.name}</option>))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {displayContact.city && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                        <div className="p-2 bg-white rounded-xl shadow-sm">
                          <MapPin className="w-4 h-4 text-[#0E3A5D]" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Adresse</p>
                          <p className="font-medium text-gray-900">{displayContact.city}{displayContact.country && `, ${displayContact.country}`}</p>
                        </div>
                      </div>
                    )}
                    {displayContact.status && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                        <div className="p-2 bg-white rounded-xl shadow-sm">
                          <Target className="w-4 h-4 text-[#0E3A5D]" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">État</p>
                          <p className="font-medium text-gray-900 capitalize">{displayContact.status}</p>
                        </div>
                      </div>
                    )}
                    {displayContact.email && (
                      <a href={`mailto:${displayContact.email}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl hover:bg-blue-50 transition-colors group">
                        <div className="p-2 bg-white rounded-xl shadow-sm group-hover:bg-blue-100 transition-colors">
                          <Mail className="w-4 h-4 text-[#0E3A5D]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-gray-500">Email</p>
                          <p className="font-medium text-gray-900 truncate">{displayContact.email}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </a>
                    )}
                    {displayContact.phone && (
                      <a href={`tel:${displayContact.phone}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl hover:bg-blue-50 transition-colors group">
                        <div className="p-2 bg-white rounded-xl shadow-sm group-hover:bg-blue-100 transition-colors">
                          <Phone className="w-4 h-4 text-[#0E3A5D]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-gray-500">Téléphone</p>
                          <p className="font-medium text-gray-900">{displayContact.phone}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Carte Activité Professionnelle */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-xl">
                    <TrendingUp className="w-4 h-4 text-[#0E3A5D]" />
                  </div>
                  Activité Professionnelle
                </h2>
                {!isEditing && (
                  <button onClick={() => setShowOpportunityForm(true)} className="text-[#0E3A5D] hover:text-blue-800 text-sm font-semibold">
                    + Ajouter
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Entreprise</label>
                    <input type="text" value={displayContact.company || ''} onChange={(e) => setEditedContact({ ...displayContact, company: e.target.value.slice(0, MAX_LENGTHS.company) })} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D] transition-all text-sm" placeholder="Acme Inc." maxLength={MAX_LENGTHS.company} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Poste</label>
                    <input type="text" value={displayContact.job_title || ''} onChange={(e) => setEditedContact({ ...displayContact, job_title: e.target.value.slice(0, MAX_LENGTHS.job_title) })} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D] transition-all text-sm" placeholder="Directeur..." maxLength={MAX_LENGTHS.job_title} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Secteur</label>
                    <input type="text" value={displayContact.industry || ''} onChange={(e) => setEditedContact({ ...displayContact, industry: e.target.value.slice(0, MAX_LENGTHS.industry) })} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D] transition-all text-sm" placeholder="Technologie..." maxLength={MAX_LENGTHS.industry} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Taille entreprise</label>
                    <select value={displayContact.company_size || ''} onChange={(e) => setEditedContact({ ...displayContact, company_size: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D] transition-all text-sm">
                      <option value="">Sélectionner...</option>
                      <option value="freelance">Freelance</option>
                      <option value="self-employed">Indépendant</option>
                      <option value="1-10">1-10 employés</option>
                      <option value="11-50">11-50 employés</option>
                      <option value="51-200">51-200 employés</option>
                      <option value="201-500">201-500 employés</option>
                      <option value="501-1000">501-1000 employés</option>
                      <option value="1000+">1000+ employés</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {showOpportunityForm && (
                    <OpportunityForm contactId={contactId} onSuccess={() => { setShowOpportunityForm(false); loadContactData(); }} onCancel={() => setShowOpportunityForm(false)} />
                  )}

                  {opportunities.length > 0 ? (
                    opportunities.slice(0, 2).map((opp) => {
                      const statusInfo = OPPORTUNITY_STATUS.find(s => s.value === opp.status);
                      return (
                        <div key={opp.id} className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              <p
                                className="text-xl font-bold text-emerald-600 truncate cursor-default"
                                title={formatCurrency(opp.amount, opp.currency)}
                              >
                                {formatCurrency(opp.amount, opp.currency)}
                              </p>
                              <p
                                className="text-sm text-gray-600 mt-1 truncate cursor-default"
                                title={`${statusInfo?.label} : ${Math.round(opp.probability / 20)}`}
                              >
                                {statusInfo?.label} : {Math.round(opp.probability / 20)}
                              </p>
                            </div>
                            <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                              <span className="text-2xl">💰</span>
                            </div>
                          </div>
                          {opp.expected_close_date && (
                            <p className="text-xs text-gray-500">Clôture prévue : {formatDate(opp.expected_close_date)}</p>
                          )}
                          <div className="flex gap-1 mt-2">
                            <button onClick={() => setEditingOpportunityId(opp.id)} className="p-1.5 hover:bg-white/50 rounded-lg transition-colors"><Edit3 className="w-3.5 h-3.5 text-gray-500" /></button>
                            <button onClick={() => handleDeleteOpportunity(opp.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                          </div>
                          {editingOpportunityId === opp.id && (
                            <div className="mt-3">
                              <OpportunityEditForm opportunity={opp} onSuccess={() => { setEditingOpportunityId(null); loadContactData(); }} onCancel={() => setEditingOpportunityId(null)} />
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <TrendingUp className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">Aucune opportunité</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section Événements - Style 2026 */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <Calendar className="w-4 h-4 text-[#0E3A5D]" />
                </div>
                Événements
              </h2>
              <button onClick={() => setShowEventForm(true)} className="text-[#0E3A5D] hover:text-blue-800 text-sm font-semibold">
                + Ajouter
              </button>
            </div>

            {showEventForm && (
              <EventForm contactId={contactId} onSuccess={() => { setShowEventForm(false); loadContactData(); }} onCancel={() => setShowEventForm(false)} />
            )}

            <div className="space-y-2">
              {events.length > 0 ? (
                events.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-blue-50 transition-colors group cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-xl shadow-sm group-hover:bg-blue-100 transition-colors">
                        <Calendar className="w-4 h-4 text-[#0E3A5D]" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{event.name}</p>
                        <p className="text-sm text-gray-500">{formatDate(event.start_date)}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#0E3A5D] transition-colors" />
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Aucun événement enregistré</p>
                </div>
              )}
            </div>
          </div>

          {/* Section Réseau - Style 2026 */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <Users className="w-4 h-4 text-[#0E3A5D]" />
                </div>
                Réseau ({relationships.length})
              </h2>
              <button onClick={() => { loadAvailableContacts(); setShowAddRelationshipForm(true); }} className="text-[#0E3A5D] hover:text-blue-800 text-sm font-semibold">
                + Ajouter
              </button>
            </div>

            {showAddRelationshipForm && (
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Ajouter des contacts au réseau</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Type de relation
                    </label>
                    <select
                      value={relationshipType}
                      onChange={(e) => setRelationshipType(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900 transition-all cursor-pointer text-sm"
                    >
                      <option value="contact">Contact</option>
                      <option value="colleague">Collègue</option>
                      <option value="friend">Ami</option>
                      <option value="family">Famille</option>
                      <option value="partner">Partenaire</option>
                      <option value="client">Client</option>
                      <option value="supplier">Fournisseur</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Rechercher un contact
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={contactSearchQuery}
                        onChange={(e) => setContactSearchQuery(e.target.value)}
                        placeholder="Rechercher par nom, entreprise..."
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400 text-gray-900 transition-all text-sm"
                      />
                      {contactSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setContactSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Sélectionner des contacts
                    </label>
                    <div className="max-h-64 overflow-y-auto bg-white rounded-xl border border-gray-300 p-3 space-y-2">
                      {availableContacts
                        .filter(c => {
                          if (!contactSearchQuery) return true;
                          const query = contactSearchQuery.toLowerCase();
                          return (
                            c.full_name.toLowerCase().includes(query) ||
                            c.company?.toLowerCase().includes(query) ||
                            c.job_title?.toLowerCase().includes(query)
                          );
                        })
                        .map((availableContact) => (
                          <label
                            key={availableContact.id}
                            className="flex items-start gap-3 p-3 hover:bg-blue-50 rounded-xl cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={selectedRelatedContacts.includes(availableContact.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedRelatedContacts([...selectedRelatedContacts, availableContact.id]);
                                } else {
                                  setSelectedRelatedContacts(selectedRelatedContacts.filter(id => id !== availableContact.id));
                                }
                              }}
                              className="mt-0.5 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-400 cursor-pointer"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 text-sm truncate">
                                {availableContact.full_name}
                              </div>
                              {(availableContact.job_title || availableContact.company) && (
                                <div className="text-xs text-gray-500 truncate">
                                  {availableContact.job_title}
                                  {availableContact.job_title && availableContact.company && ' • '}
                                  {availableContact.company}
                                </div>
                              )}
                            </div>
                          </label>
                        ))}
                      {availableContacts.filter(c => {
                        if (!contactSearchQuery) return true;
                        const query = contactSearchQuery.toLowerCase();
                        return (
                          c.full_name.toLowerCase().includes(query) ||
                          c.company?.toLowerCase().includes(query) ||
                          c.job_title?.toLowerCase().includes(query)
                        );
                      }).length === 0 && (
                          <p className="text-sm text-gray-500 text-center py-6">
                            {contactSearchQuery ? 'Aucun contact trouvé' : 'Aucun contact disponible'}
                          </p>
                        )}
                    </div>
                    {selectedRelatedContacts.length > 0 && (
                      <p className="text-xs text-gray-600 mt-2 px-2">
                        {selectedRelatedContacts.length} contact{selectedRelatedContacts.length > 1 ? 's' : ''} sélectionné{selectedRelatedContacts.length > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleAddRelationship}
                      disabled={selectedRelatedContacts.length === 0}
                      className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                      Ajouter ({selectedRelatedContacts.length})
                    </button>
                    <button
                      onClick={() => {
                        setShowAddRelationshipForm(false);
                        setSelectedRelatedContacts([]);
                        setRelationshipType('contact');
                        setContactSearchQuery('');
                      }}
                      className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            )}

            {relationships.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {relationships.map((relationship) => (
                  <div
                    key={relationship.id}
                    className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:shadow-lg transition-all relative group"
                  >
                    {isEditing && (
                      <button
                        onClick={() => handleDeleteRelationship(relationship.id)}
                        className="absolute top-2 right-2 p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors opacity-0 group-hover:opacity-100 z-10"
                        title="Retirer du réseau"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <div
                      onClick={() => !isEditing && navigate(`/dashboard?view=contacts&contactId=${relationship.related_contact.id}`)}
                      className={!isEditing ? "cursor-pointer" : ""}
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-full bg-[#0E3A5D] flex items-center justify-center flex-shrink-0 overflow-hidden shadow-md mb-3">
                          {relationship.related_contact.avatar_url ? (
                            <img
                              src={relationship.related_contact.avatar_url}
                              alt={relationship.related_contact.full_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-white font-bold text-xl">
                              {relationship.related_contact.full_name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-900 truncate w-full hover:text-blue-600 transition-colors mb-1">
                          {relationship.related_contact.full_name}
                        </h3>
                        {relationship.related_contact.company && (
                          <p className="text-sm text-gray-600 truncate w-full mb-3">
                            {relationship.related_contact.company}
                          </p>
                        )}
                        <span className="inline-block px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                          {relationship.relationship_type === 'colleague' && 'Collègue'}
                          {relationship.relationship_type === 'friend' && 'Ami'}
                          {relationship.relationship_type === 'family' && 'Famille'}
                          {relationship.relationship_type === 'partner' && 'Partenaire'}
                          {relationship.relationship_type === 'client' && 'Client'}
                          {relationship.relationship_type === 'supplier' && 'Fournisseur'}
                          {relationship.relationship_type === 'contact' && 'Contact'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              !showAddRelationshipForm && (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">Aucun contact dans le réseau</p>
                  <button
                    onClick={() => {
                      loadAvailableContacts();
                      setShowAddRelationshipForm(true);
                    }}
                    className="px-6 py-2.5 bg-[#0E3A5D] text-white rounded-2xl hover:bg-blue-800 transition-all font-semibold shadow-lg shadow-blue-600/30"
                  >
                    Ajouter le premier contact
                  </button>
                </div>
              )
            )}
          </div>

          {/* Section Notes - Style 2026 */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <StickyNote className="w-4 h-4 text-[#0E3A5D]" />
                </div>
                Notes ({notes.length})
              </h2>
              <button onClick={() => setShowNoteInput(!showNoteInput)} className="text-[#0E3A5D] hover:text-blue-800 text-sm font-semibold">
                + Nouvelle
              </button>
            </div>

            {showNoteInput && (
              <div className="mb-4 p-4 bg-blue-50 rounded-2xl border border-blue-200">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value.slice(0, MAX_LENGTHS.note))}
                  placeholder="Ajouter une note..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                  maxLength={MAX_LENGTHS.note}
                />
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-gray-500">{newNote.length}/{MAX_LENGTHS.note}</span>
                  <div className="flex gap-2">
                    <button onClick={handleAddNote} className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all font-semibold text-sm shadow-lg shadow-blue-500/30">Enregistrer</button>
                    <button onClick={() => { setShowNoteInput(false); setNewNote(''); }} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold text-sm">Annuler</button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {notes.slice(0, 3).map((note) => {
                const isExpanded = expandedNotes.has(note.id);
                const shouldTruncate = note.content.length > 150;
                const displayContent = isExpanded || !shouldTruncate ? note.content : note.content.substring(0, 150) + '...';

                return (
                  <div key={note.id} className="p-4 bg-blue-50 rounded-2xl border border-blue-100 group">
                    {editingNoteId === note.id ? (
                      <div>
                        <textarea value={editingNoteContent} onChange={(e) => setEditingNoteContent(e.target.value.slice(0, MAX_LENGTHS.note))} rows={3} className="w-full px-3 py-2 bg-white border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none mb-2 text-sm" maxLength={MAX_LENGTHS.note} />
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">{editingNoteContent.length}/{MAX_LENGTHS.note}</span>
                          <div className="flex gap-2">
                            <button onClick={() => handleEditNote(note.id)} className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-xs font-semibold">Enregistrer</button>
                            <button onClick={() => { setEditingNoteId(null); setEditingNoteContent(''); }} className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-xs font-semibold">Annuler</button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-gray-900 text-sm whitespace-pre-wrap break-words">{displayContent}</p>
                        {shouldTruncate && (
                          <button onClick={() => toggleNoteExpansion(note.id)} className="text-blue-600 hover:text-blue-700 text-xs font-medium mt-1">{isExpanded ? 'Voir moins' : 'Voir plus'}</button>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-gray-500">{formatDateTime(note.created_at)}</p>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditingNoteId(note.id); setEditingNoteContent(note.content); }} className="p-1.5 hover:bg-blue-200 rounded-lg transition-colors"><Edit3 className="w-3.5 h-3.5 text-gray-600" /></button>
                            <button onClick={() => handleDeleteNote(note.id)} className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}

              {notes.length === 0 && !showNoteInput && (
                <div className="text-center py-8 text-gray-500">
                  <StickyNote className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Aucune note</p>
                </div>
              )}
            </div>
          </div>

          {/* Section Historique d'Activité - Style 2026 */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <History className="w-4 h-4 text-[#0E3A5D]" />
                </div>
                Historique
              </h2>
              <button onClick={() => setShowActivityForm(!showActivityForm)} className="text-[#0E3A5D] hover:text-blue-800 text-sm font-semibold">
                + Nouvelle
              </button>
            </div>

            {showActivityForm && (
              <div className="mb-4">
                <ActivityForm onSubmit={handleAddActivity} onCancel={() => setShowActivityForm(false)} />
              </div>
            )}

            <div className="space-y-2">
              {activities.slice(0, 5).map((activity) => {
                const activityInfo = ACTIVITY_TYPES.find((t) => t.value === activity.activity_type);
                const Icon = activityInfo?.icon || History;
                const activityEditing = editingActivityId === activity.id;

                return (
                  <div key={activity.id}>
                    {activityEditing ? (
                      <ActivityEditForm activity={activity} onSuccess={() => { setEditingActivityId(null); loadContactData(); }} onCancel={() => setEditingActivityId(null)} />
                    ) : (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl hover:bg-blue-50 transition-colors group">
                        <div className="p-2 bg-white rounded-xl shadow-sm group-hover:bg-blue-100 transition-colors">
                          <Icon className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{activityInfo?.label || activity.activity_type}</p>
                          {activity.description && <p className="text-xs text-gray-500 truncate">{activity.description}</p>}
                          <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(activity.activity_date)}</p>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setEditingActivityId(activity.id)} className="p-1.5 hover:bg-white rounded-lg transition-colors"><Edit3 className="w-3.5 h-3.5 text-gray-500" /></button>
                          <button onClick={() => handleDeleteActivity(activity.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {activities.length === 0 && !showActivityForm && (
                <div className="text-center py-8 text-gray-500">
                  <History className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Aucune activité enregistrée</p>
                </div>
              )}
            </div>
          </div>

          {/* Section supplémentaire pour le mode édition - Tags, statuts, etc */}
          {isEditing && (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="p-2 bg-gray-100 rounded-xl">
                  <Tag className="w-4 h-4 text-gray-600" />
                </div>
                Informations complémentaires
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Statut</label>
                    <select value={displayContact.status || ''} onChange={(e) => setEditedContact({ ...displayContact, status: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D] transition-all text-sm">
                      <option value="">Selectionner...</option>
                      <option value="lead">Lead</option>
                      <option value="prospect">Prospect</option>
                      <option value="client">Client</option>
                      <option value="partner">Partenaire</option>
                      <option value="collaborateur">Collaborateur</option>
                      <option value="ami">Ami(e)</option>
                      <option value="fournisseur">Fournisseur</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Relation</label>
                    <select value={displayContact.relationship || ''} onChange={(e) => setEditedContact({ ...displayContact, relationship: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D] transition-all text-sm">
                      <option value="">Sélectionner...</option>
                      <option value="professionnel">Professionnel</option>
                      <option value="personnel">Personnel</option>
                      <option value="familial">Familial</option>
                      <option value="ami">Ami</option>
                      <option value="collègue">Collègue</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Site web</label>
                  <input type="url" value={displayContact.website || ''} onChange={(e) => setEditedContact({ ...displayContact, website: e.target.value.slice(0, MAX_LENGTHS.website) })} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D] transition-all text-sm" placeholder="https://example.com" maxLength={MAX_LENGTHS.website} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">LinkedIn</label>
                    <input type="url" value={displayContact.linkedin || ''} onChange={(e) => setEditedContact({ ...displayContact, linkedin: e.target.value.slice(0, MAX_LENGTHS.linkedin) })} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D] transition-all text-sm" placeholder="linkedin.com/in/..." maxLength={MAX_LENGTHS.linkedin} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Twitter</label>
                    <input type="url" value={displayContact.twitter || ''} onChange={(e) => setEditedContact({ ...displayContact, twitter: e.target.value.slice(0, MAX_LENGTHS.twitter) })} className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D] transition-all text-sm" placeholder="twitter.com/..." maxLength={MAX_LENGTHS.twitter} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Tags</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {displayContact.tags && displayContact.tags.map((tag, index) => (
                      <span key={index} className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {tag}
                        <button type="button" onClick={() => { const newTags = [...(displayContact.tags || [])]; newTags.splice(index, 1); setEditedContact({ ...displayContact, tags: newTags }); }} className="ml-1 hover:text-blue-900"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input type="text" placeholder="Ajouter un tag..." className="flex-1 px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D] transition-all text-sm" onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); const input = e.currentTarget; const newTag = input.value.trim(); if (newTag && !(displayContact.tags || []).includes(newTag)) { setEditedContact({ ...displayContact, tags: [...(displayContact.tags || []), newTag] }); input.value = ''; } } }} />
                    <button type="button" onClick={(e) => { const input = e.currentTarget.previousElementSibling as HTMLInputElement; const newTag = input.value.trim(); if (newTag && !(displayContact.tags || []).includes(newTag)) { setEditedContact({ ...displayContact, tags: [...(displayContact.tags || []), newTag] }); input.value = ''; } }} className="px-4 py-2.5 bg-[#0E3A5D] text-white rounded-xl hover:bg-blue-800 transition-colors"><Plus className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Modal de suppression - Style 2026 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Supprimer le contact</h3>
              <p className="text-gray-600 mb-6">
                Êtes-vous sûr de vouloir supprimer <strong>{contact.full_name}</strong> ? Cette action est irréversible.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-2xl hover:bg-gray-200 transition-colors font-semibold disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDeleteContact}
                  disabled={deleting}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-2xl hover:bg-red-700 transition-all font-semibold disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-red-500/30"
                >
                  {deleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Suppression...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Supprimer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'avertissement entreprise - Style 2026 */}
      {showEnterpriseWarning && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-[#0E3A5D]" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Entreprise non configurée
              </h3>
              <p className="text-gray-600 mb-6">
                Pour ajouter des membres à votre entreprise, vous devez d'abord la créer dans la section Entreprise.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowEnterpriseWarning(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-2xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Plus tard
                </button>
                <button
                  onClick={() => {
                    setShowEnterpriseWarning(false);
                    onNavigateToEnterprise?.();
                  }}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30"
                >
                  Créer mon entreprise
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ActivityForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (type: string, description: string, activityTime: string) => void;
  onCancel: () => void;
}) {
  const [activityType, setActivityType] = useState('call');
  const [description, setDescription] = useState('');
  const [activityDate, setActivityDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Pour les réunions et les appels, on combine la date avec la tranche horaire
    let activityDateTime;
    if (activityType === 'meeting' || activityType === 'call') {
      const descriptionWithTime = `${description} (${startTime} - ${endTime})`;
      activityDateTime = `${activityDate}T${startTime}:00`;
      onSubmit(activityType, descriptionWithTime, activityDateTime);
    } else {
      // Pour les autres types d'activité, on utilise la date et l'heure de début
      activityDateTime = `${activityDate}T${startTime}:00`;
      onSubmit(activityType, description, activityDateTime);
    }

    setActivityType('call');
    setDescription('');
    setActivityDate(new Date().toISOString().split('T')[0]);
    setStartTime('09:00');
    setEndTime('10:00');
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-gray-50 rounded-xl mb-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
          <select
            value={activityType}
            onChange={(e) => setActivityType(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          >
            {ACTIVITY_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
          <input
            type="date"
            value={activityDate}
            onChange={(e) => setActivityDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
        </div>
      </div>

      {(activityType === 'meeting' || activityType === 'call') ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Heure de début *</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Heure de fin *</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Heure *</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, MAX_LENGTHS.activity_description))}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
          placeholder="Détails de l'activité..."
          rows={2}
          maxLength={MAX_LENGTHS.activity_description}
        />
        <span className="text-xs text-gray-500">{description.length}/{MAX_LENGTHS.activity_description} caractères</span>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold shadow-md"
        >
          Ajouter
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-semibold"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}

function ActivityEditForm({
  activity,
  onSuccess,
  onCancel,
}: {
  activity: Activity;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { showToast } = useNotifications();

  // Extraire les informations de l'activité existante
  const getActivityDetails = () => {
    const date = new Date(activity.activity_date);
    const dateStr = date.toISOString().split('T')[0];
    const timeStr = date.toTimeString().split(' ')[0].substring(0, 5);

    // Extraire la tranche horaire si elle existe dans la description
    const timeRangeMatch = activity.description?.match(/\((\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})\)/);
    let startTime = timeStr;
    let endTime = '10:00';
    let cleanDescription = activity.description || '';

    if (timeRangeMatch) {
      startTime = timeRangeMatch[1];
      endTime = timeRangeMatch[2];
      cleanDescription = activity.description.replace(/\s*\(\d{2}:\d{2}\s*-\s*\d{2}:\d{2}\)/, '');
    }

    return { dateStr, startTime, endTime, cleanDescription };
  };

  const { dateStr, startTime: initialStart, endTime: initialEnd, cleanDescription } = getActivityDetails();

  const [activityType, setActivityType] = useState(activity.activity_type);
  const [description, setDescription] = useState(cleanDescription);
  const [activityDate, setActivityDate] = useState(dateStr);
  const [startTime, setStartTime] = useState(initialStart);
  const [endTime, setEndTime] = useState(initialEnd);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      let finalDescription = description;
      if (activityType === 'meeting' || activityType === 'call') {
        finalDescription = `${description} (${startTime} - ${endTime})`;
      }

      const activityDateTime = `${activityDate}T${startTime}:00`;

      const { error } = await supabase
        .from('contact_activities')
        .update({
          activity_type: activityType,
          description: finalDescription,
          activity_date: activityDateTime,
        })
        .eq('id', activity.id);

      if (error) throw error;

      onSuccess();
    } catch (error) {
      console.error('Error updating activity:', error);
      showToast('Erreur', 'Erreur lors de la mise à jour de l\'activité', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white rounded-2xl border-2 border-blue-200 mb-2 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Type *</label>
          <select
            value={activityType}
            onChange={(e) => setActivityType(e.target.value as any)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          >
            {ACTIVITY_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Date *</label>
          <input
            type="date"
            value={activityDate}
            onChange={(e) => setActivityDate(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
        </div>
      </div>

      {(activityType === 'meeting' || activityType === 'call') ? (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Début *</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Fin *</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>
        </div>
      ) : (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Heure *</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, MAX_LENGTHS.activity_description))}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
          placeholder="Détails de l'activité..."
          rows={2}
          maxLength={MAX_LENGTHS.activity_description}
        />
        <span className="text-xs text-gray-500">{description.length}/{MAX_LENGTHS.activity_description}</span>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition-colors font-semibold shadow-md disabled:opacity-50"
        >
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-xl hover:bg-gray-300 transition-colors font-semibold disabled:opacity-50"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}

function EventForm({
  contactId,
  onSuccess,
  onCancel,
}: {
  contactId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const [name, setName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !eventDate || !user) return;

    try {
      setLoading(true);

      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .insert({
          user_id: user.id,
          name,
          category: 'networking',
          event_type: 'presentiel',
          status: 'completed',
          start_date: eventDate,
          location: location || null,
          description: description || null,
        })
        .select()
        .single();

      if (eventError) throw eventError;

      const { error: linkError } = await supabase
        .from('contact_events')
        .insert({
          contact_id: contactId,
          event_id: eventData.id,
        });

      if (linkError) throw linkError;

      onSuccess();
    } catch (error) {
      console.error('Error creating event:', error);
      showToast('Erreur', 'Erreur lors de la création de l\'événement', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-gray-50 rounded-xl mb-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'événement *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, MAX_LENGTHS.event_name))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Conférence, Salon..."
            maxLength={MAX_LENGTHS.event_name}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Lieu</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value.slice(0, MAX_LENGTHS.event_location))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Paris, France"
            maxLength={MAX_LENGTHS.event_location}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, MAX_LENGTHS.event_description))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Notes supplémentaires..."
            maxLength={MAX_LENGTHS.event_description}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold shadow-md disabled:opacity-50"
        >
          {loading ? 'Création...' : 'Ajouter'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-semibold disabled:opacity-50"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}

function OpportunityEditForm({
  opportunity,
  onSuccess,
  onCancel,
}: {
  opportunity: Opportunity;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { showToast } = useNotifications();
  const [title, setTitle] = useState(opportunity.title);
  const [amount, setAmount] = useState(opportunity.amount?.toString() || '');
  const [currency, setCurrency] = useState(opportunity.currency);
  const [status, setStatus] = useState<'prospect' | 'negotiation' | 'won' | 'lost'>(opportunity.status);
  const [probability, setProbability] = useState(Math.round(opportunity.probability / 20)); // Convert from percentage to stars
  const [expectedCloseDate, setExpectedCloseDate] = useState(opportunity.expected_close_date || '');
  const [description, setDescription] = useState(opportunity.description || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    try {
      setLoading(true);

      const probabilityPercent = probability * 20;

      const { error } = await supabase
        .from('contact_opportunities')
        .update({
          title,
          amount: amount ? parseFloat(amount) : null,
          currency,
          status,
          probability: probabilityPercent,
          expected_close_date: expectedCloseDate || null,
          description: description || null,
        })
        .eq('id', opportunity.id);

      if (error) throw error;

      onSuccess();
    } catch (error) {
      console.error('Error updating opportunity:', error);
      showToast('Erreur', 'Erreur lors de la mise à jour de l\'opportunité', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white rounded-2xl border-2 border-blue-200 mb-2 space-y-3">
      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Titre *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, MAX_LENGTHS.opportunity_title))}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Projet de développement..."
            maxLength={MAX_LENGTHS.opportunity_title}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Montant</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="10000"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Devise</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Statut</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {OPPORTUNITY_STATUS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Date de clôture</label>
            <input
              type="date"
              value={expectedCloseDate}
              onChange={(e) => setExpectedCloseDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Probabilité</label>
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setProbability(star)}
                  className="cursor-pointer hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-6 h-6 ${star <= probability
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                      }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-xs text-gray-600 font-medium">
              {probability} étoile{probability > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, MAX_LENGTHS.opportunity_description))}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            placeholder="Détails supplémentaires..."
            rows={2}
            maxLength={MAX_LENGTHS.opportunity_description}
          />
          <span className="text-xs text-gray-500">{description.length}/{MAX_LENGTHS.opportunity_description}</span>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition-colors font-semibold shadow-md disabled:opacity-50"
        >
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-xl hover:bg-gray-300 transition-colors font-semibold disabled:opacity-50"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}

function OpportunityForm({
  contactId,
  onSuccess,
  onCancel,
}: {
  contactId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [status, setStatus] = useState<'prospect' | 'negotiation' | 'won' | 'lost'>('prospect');
  const [probability, setProbability] = useState(3); // Sur une échelle de 1 à 5 étoiles
  const [expectedCloseDate, setExpectedCloseDate] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !user) return;

    try {
      setLoading(true);

      // Convertir la note en étoiles (1-5) en pourcentage (0-100)
      const probabilityPercent = probability * 20;

      const { error } = await supabase
        .from('contact_opportunities')
        .insert({
          contact_id: contactId,
          user_id: user.id,
          title,
          amount: amount ? parseFloat(amount) : null,
          currency,
          status,
          probability: probabilityPercent,
          expected_close_date: expectedCloseDate || null,
          description: description || null,
        });

      if (error) throw error;

      onSuccess();
    } catch (error) {
      console.error('Error creating opportunity:', error);
      showToast('Erreur', 'Erreur lors de la création de l\'opportunité', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-gray-50 rounded-xl mb-4 space-y-4 overflow-visible">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, MAX_LENGTHS.opportunity_title))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Projet de développement..."
            maxLength={MAX_LENGTHS.opportunity_title}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Montant</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="10000"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Devise</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {OPPORTUNITY_STATUS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de clôture prévue</label>
            <input
              type="date"
              value={expectedCloseDate}
              onChange={(e) => setExpectedCloseDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Probabilité de succès</label>
          <div className="flex items-center gap-4">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setProbability(star)}
                  className="cursor-pointer hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-8 h-8 ${star <= probability
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                      }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-sm text-gray-600 font-medium">
              {probability} étoile{probability > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, MAX_LENGTHS.opportunity_description))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            placeholder="Détails supplémentaires..."
            rows={3}
            maxLength={MAX_LENGTHS.opportunity_description}
          />
          <span className="text-xs text-gray-500">{description.length}/{MAX_LENGTHS.opportunity_description} caractères</span>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold shadow-md disabled:opacity-50"
        >
          {loading ? 'Création...' : 'Ajouter'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-semibold disabled:opacity-50"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}