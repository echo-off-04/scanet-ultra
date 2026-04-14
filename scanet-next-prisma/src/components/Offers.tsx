'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Package, Plus, Search, Edit, Trash2, X, ChevronDown,
    Layers, Coins, Clock, CheckCircle, Tag, MoreVertical,
    FolderPlus, Eye, EyeOff, Send, Filter, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface Offer {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    price: number | null;
    currency: string | null;
    duration: string | null;
    billing_type: 'hourly' | 'daily' | 'fixed' | 'unit';
    hourly_rate: number | null;
    estimated_hours: number | null;
    daily_rate: number | null;
    estimated_days: number | null;
    unit_price: number | null;
    quantity: number | null;
    category: string | null;
    features: string[] | null;
    is_active: boolean;
    image_url: string | null;
    created_at: string;
    updated_at: string;
}

interface OfferPack {
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    discount_percentage: number | null;
    price: number | null;
    is_active: boolean;
    image_url: string | null;
    created_at: string;
    updated_at: string;
    offers?: Offer[];
}

interface Contact {
    id: string;
    full_name: string;
    email: string | null;
    avatar_url: string | null;
}

interface OffersProps {
    onOfferSelect?: (offerId: string) => void;
}

type TabType = 'offers' | 'packs';
type FilterType = 'all' | 'active' | 'inactive';

export function Offers(_props: OffersProps) {
    const { profile } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('offers');
    const [offers, setOffers] = useState<Offer[]>([]);
    const [packs, setPacks] = useState<OfferPack[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<FilterType>('active');
    const [contacts, setContacts] = useState<Contact[]>([]);

    // Modals state
    const [showOfferModal, setShowOfferModal] = useState(false);
    const [showPackModal, setShowPackModal] = useState(false);
    const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
    const [editingPack, setEditingPack] = useState<OfferPack | null>(null);
    const [selectedPack, setSelectedPack] = useState<OfferPack | null>(null);
    const [actionMenuId, setActionMenuId] = useState<string | null>(null);

    // Send offer modal
    const [showSendModal, setShowSendModal] = useState(false);
    const [sendingOffer, setSendingOffer] = useState<Offer | OfferPack | null>(null);
    const [sendingType, setSendingType] = useState<'offer' | 'pack'>('offer');
    const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
    const [sendMessage, setSendMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    // Offer form
    const [offerForm, setOfferForm] = useState({
        title: '', description: '', price: '', currency: 'EUR', duration: '',
        billing_type: 'fixed' as string, category: '', features: '',
        is_active: true, image_url: '',
    });

    // Pack form
    const [packForm, setPackForm] = useState({
        name: '', description: '', discount_percentage: '', price: '',
        is_active: true, selectedOfferIds: [] as string[],
    });

    const fetchContacts = useCallback(async () => {
        try {
            const res = await fetch('/api/contacts');
            if (res.ok) { const data = await res.json(); setContacts(data); }
        } catch { /* ignore */ }
    }, []);

    const fetchOffers = useCallback(async () => {
        try {
            const res = await fetch('/api/offers');
            if (res.ok) { const data = await res.json(); setOffers(data); }
        } catch (error) {
            console.error('Error fetching offers:', error);
        }
    }, []);

    const fetchPacks = useCallback(async () => {
        try {
            const res = await fetch('/api/offer-packs');
            if (res.ok) { const data = await res.json(); setPacks(data); }
        } catch (error) {
            console.error('Error fetching packs:', error);
        }
    }, []);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([fetchOffers(), fetchPacks(), fetchContacts()]);
            setLoading(false);
        };
        loadData();
    }, [fetchOffers, fetchPacks, fetchContacts]);

    const handleDeleteOffer = async (offerId: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette offre ?')) return;
        try {
            const res = await fetch(`/api/offers/${offerId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error();
            fetchOffers();
            fetchPacks();
            setActionMenuId(null);
        } catch {
            toast.error('Erreur lors de la suppression');
        }
    };

    const handleDeletePack = async (packId: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce pack ?')) return;
        try {
            const res = await fetch(`/api/offer-packs/${packId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error();
            fetchPacks();
            setActionMenuId(null);
        } catch {
            toast.error('Erreur lors de la suppression');
        }
    };

    const handleSaveOffer = async () => {
        if (!offerForm.title.trim()) { toast.error('Le titre est requis'); return; }
        try {
            const body = {
                title: offerForm.title,
                description: offerForm.description || null,
                price: offerForm.price ? parseFloat(offerForm.price) : null,
                currency: offerForm.currency,
                duration: offerForm.duration || null,
                billing_type: offerForm.billing_type,
                category: offerForm.category || null,
                features: offerForm.features ? offerForm.features.split('\n').filter(Boolean) : null,
                is_active: offerForm.is_active,
                image_url: offerForm.image_url || null,
            };

            const url = editingOffer ? `/api/offers/${editingOffer.id}` : '/api/offers';
            const method = editingOffer ? 'PATCH' : 'POST';
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            if (!res.ok) throw new Error();
            toast.success(editingOffer ? 'Offre modifiée' : 'Offre créée');
            setShowOfferModal(false);
            setEditingOffer(null);
            resetOfferForm();
            fetchOffers();
        } catch {
            toast.error('Erreur lors de la sauvegarde');
        }
    };

    const handleSavePack = async () => {
        if (!packForm.name.trim()) { toast.error('Le nom est requis'); return; }
        try {
            const body = {
                name: packForm.name,
                description: packForm.description || null,
                discount_percentage: packForm.discount_percentage ? parseFloat(packForm.discount_percentage) : null,
                price: packForm.price ? parseFloat(packForm.price) : null,
                is_active: packForm.is_active,
                offer_ids: packForm.selectedOfferIds,
            };

            const url = editingPack ? `/api/offer-packs/${editingPack.id}` : '/api/offer-packs';
            const method = editingPack ? 'PATCH' : 'POST';
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            if (!res.ok) throw new Error();
            toast.success(editingPack ? 'Pack modifié' : 'Pack créé');
            setShowPackModal(false);
            setEditingPack(null);
            resetPackForm();
            fetchPacks();
        } catch {
            toast.error('Erreur lors de la sauvegarde');
        }
    };

    const handleSendOffer = async () => {
        if (!sendingOffer || selectedRecipients.length === 0) return;
        setIsSending(true);
        try {
            const res = await fetch('/api/offer-sends', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    offer_id: sendingType === 'offer' ? sendingOffer.id : null,
                    pack_id: sendingType === 'pack' ? sendingOffer.id : null,
                    recipient_contact_ids: selectedRecipients,
                    message: sendMessage || null,
                }),
            });
            if (!res.ok) throw new Error();
            const data = await res.json();
            toast.success(`${data.sent || selectedRecipients.length} email(s) envoyé(s)`);
            setShowSendModal(false);
            setSendingOffer(null);
            setSelectedRecipients([]);
            setSendMessage('');
        } catch {
            toast.error('Erreur lors de l\'envoi');
        } finally {
            setIsSending(false);
        }
    };

    const resetOfferForm = () => {
        setOfferForm({ title: '', description: '', price: '', currency: 'EUR', duration: '', billing_type: 'fixed', category: '', features: '', is_active: true, image_url: '' });
    };

    const resetPackForm = () => {
        setPackForm({ name: '', description: '', discount_percentage: '', price: '', is_active: true, selectedOfferIds: [] });
    };

    const openEditOffer = (offer: Offer) => {
        setOfferForm({
            title: offer.title, description: offer.description || '', price: offer.price?.toString() || '',
            currency: offer.currency || 'EUR', duration: offer.duration || '', billing_type: offer.billing_type || 'fixed',
            category: offer.category || '', features: offer.features?.join('\n') || '', is_active: offer.is_active,
            image_url: offer.image_url || '',
        });
        setEditingOffer(offer);
        setShowOfferModal(true);
        setActionMenuId(null);
    };

    const openEditPack = (pack: OfferPack) => {
        setPackForm({
            name: pack.name, description: pack.description || '',
            discount_percentage: pack.discount_percentage?.toString() || '',
            price: pack.price?.toString() || '', is_active: pack.is_active,
            selectedOfferIds: pack.offers?.map(o => o.id) || [],
        });
        setEditingPack(pack);
        setShowPackModal(true);
        setActionMenuId(null);
    };

    const filteredOffers = offers.filter(offer => {
        if (filterStatus === 'active' && !offer.is_active) return false;
        if (filterStatus === 'inactive' && offer.is_active) return false;
        if (!searchQuery) return true;
        const search = searchQuery.toLowerCase();
        return offer.title.toLowerCase().includes(search) || offer.description?.toLowerCase().includes(search) || offer.category?.toLowerCase().includes(search);
    });

    const filteredPacks = packs.filter(pack => {
        if (filterStatus === 'active' && !pack.is_active) return false;
        if (filterStatus === 'inactive' && pack.is_active) return false;
        if (!searchQuery) return true;
        const search = searchQuery.toLowerCase();
        return pack.name.toLowerCase().includes(search) || pack.description?.toLowerCase().includes(search);
    });

    const stats = {
        totalOffers: offers.length,
        activeOffers: offers.filter(o => o.is_active).length,
        totalPacks: packs.length,
        activePacks: packs.filter(p => p.is_active).length,
    };

    const fmtCurrency = (amount: number | null, currency: string | null = 'EUR') => {
        if (amount === null) return '-';
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency || 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-2">Offres</h1>
                    <p className="text-lg text-gray-500">
                        {activeTab === 'offers' ? `${stats.totalOffers} offre${stats.totalOffers !== 1 ? 's' : ''}` : `${stats.totalPacks} pack${stats.totalPacks !== 1 ? 's' : ''}`}
                    </p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => { resetOfferForm(); setEditingOffer(null); setShowOfferModal(true); }}
                        className="bg-gradient-to-r from-[#0E3A5D] to-[#1e5a8e] text-white px-8 py-4 rounded-full hover:shadow-xl transition-all font-semibold flex items-center gap-3">
                        <Plus className="w-5 h-5" />Nouvelle offre
                    </button>
                    <button onClick={() => { resetPackForm(); setEditingPack(null); setShowPackModal(true); }}
                        className="px-8 py-4 border-2 border-gray-900 rounded-full font-semibold text-gray-900 hover:bg-gray-900 hover:text-white transition-all flex items-center gap-3">
                        <FolderPlus className="w-5 h-5" />Nouveau pack
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                {[
                    { label: 'Total Offres', value: stats.totalOffers, icon: Package, color: 'text-white', bg: 'bg-gradient-to-br from-gray-900 to-gray-800' },
                    { label: 'Actives', value: stats.activeOffers, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-white' },
                    { label: 'Total Packs', value: stats.totalPacks, icon: Layers, color: 'text-gray-900', bg: 'bg-white' },
                    { label: 'Packs Actifs', value: stats.activePacks, icon: Tag, color: 'text-amber-600', bg: 'bg-white' },
                ].map((stat, i) => (
                    <div key={i} className={`rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all ${stat.bg}`}>
                        <div className="flex items-center gap-2 mb-3">
                            <stat.icon className={`w-4 h-4 ${i === 0 ? 'text-white/70' : 'text-gray-400'}`} />
                            <p className={`text-xs font-medium uppercase tracking-wider ${i === 0 ? 'text-white/70' : 'text-gray-500'}`}>{stat.label}</p>
                        </div>
                        <h3 className={`text-3xl font-bold ${stat.color}`}>{stat.value}</h3>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-3xl border border-gray-200 p-2">
                <div className="flex gap-2">
                    {(['offers', 'packs'] as TabType[]).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`px-6 py-3 rounded-2xl font-semibold transition-all flex items-center gap-2 ${activeTab === tab ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'}`}>
                            {tab === 'offers' ? <Package className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
                            {tab === 'offers' ? `Offres (${filteredOffers.length})` : `Packs (${filteredPacks.length})`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Search & filter */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input type="text" placeholder={activeTab === 'offers' ? 'Rechercher une offre...' : 'Rechercher un pack...'}
                            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 bg-gray-50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900 placeholder-gray-400" />
                    </div>
                    <div className="flex items-center gap-3">
                        <Filter className="w-5 h-5 text-gray-400" />
                        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as FilterType)}
                            className="pl-4 pr-10 py-4 bg-gray-50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900 font-medium">
                            <option value="all">Toutes</option>
                            <option value="active">Actives</option>
                            <option value="inactive">Inactives</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
            ) : activeTab === 'offers' ? (
                filteredOffers.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-gray-200 p-16 text-center">
                        <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <Package className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">{searchQuery ? 'Aucune offre trouvée' : 'Aucune offre'}</h3>
                        <p className="text-gray-500 mb-8 max-w-md mx-auto text-lg">
                            {searchQuery ? 'Modifiez vos filtres.' : 'Créez votre première offre pour la proposer à vos clients.'}
                        </p>
                        {!searchQuery && (
                            <button onClick={() => setShowOfferModal(true)}
                                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#0E3A5D] to-[#1e5a8e] text-white rounded-full font-semibold shadow-xl">
                                <Plus className="w-5 h-5" />Créer votre première offre
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredOffers.map(offer => (
                            <div key={offer.id} className="relative">
                                <div className="absolute top-4 right-4 z-10">
                                    <button onClick={e => { e.stopPropagation(); setActionMenuId(actionMenuId === offer.id ? null : offer.id); }}
                                        className="p-2 bg-white/90 backdrop-blur-sm hover:bg-white rounded-xl shadow-lg">
                                        <MoreVertical className="w-5 h-5 text-gray-600" />
                                    </button>
                                    {actionMenuId === offer.id && (
                                        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border py-2 z-50">
                                            <button onClick={() => openEditOffer(offer)} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                                <Edit className="w-4 h-4" />Modifier
                                            </button>
                                            <button onClick={() => { setSendingOffer(offer); setSendingType('offer'); setShowSendModal(true); setActionMenuId(null); }}
                                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                                <Send className="w-4 h-4" />Envoyer
                                            </button>
                                            <button onClick={() => handleDeleteOffer(offer.id)} className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                                                <Trash2 className="w-4 h-4" />Supprimer
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden hover:border-gray-900 hover:shadow-2xl transition-all duration-300 cursor-pointer group">
                                    {offer.image_url && (
                                        <div className="w-full h-48 overflow-hidden">
                                            <img src={offer.image_url} alt={offer.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                        </div>
                                    )}
                                    <div className="p-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${offer.is_active ? 'bg-emerald-50' : 'bg-gray-100'}`}>
                                                {offer.is_active ? <Eye className="w-5 h-5 text-emerald-600" /> : <EyeOff className="w-5 h-5 text-gray-400" />}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-gray-900">{offer.title}</h4>
                                                {offer.category && <span className="text-xs text-gray-500">{offer.category}</span>}
                                            </div>
                                        </div>
                                        {offer.description && <p className="text-sm text-gray-600 mb-4 line-clamp-2">{offer.description}</p>}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Coins className="w-4 h-4 text-gray-400" />
                                                <span className="font-bold text-gray-900">{fmtCurrency(offer.price, offer.currency)}</span>
                                            </div>
                                            {offer.duration && (
                                                <div className="flex items-center gap-1 text-sm text-gray-500">
                                                    <Clock className="w-4 h-4" />{offer.duration}
                                                </div>
                                            )}
                                        </div>
                                        {offer.features && offer.features.length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-gray-100">
                                                <p className="text-xs text-gray-500">{offer.features.length} fonctionnalité(s)</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            ) : (
                filteredPacks.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-gray-200 p-16 text-center">
                        <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <Layers className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">{searchQuery ? 'Aucun pack trouvé' : 'Aucun pack'}</h3>
                        <p className="text-gray-500 mb-8 max-w-md mx-auto text-lg">Créez des packs pour regrouper plusieurs offres.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {filteredPacks.map(pack => (
                            <div key={pack.id} className="relative">
                                <div className="absolute top-4 right-4 z-10">
                                    <button onClick={e => { e.stopPropagation(); setActionMenuId(actionMenuId === `pack-${pack.id}` ? null : `pack-${pack.id}`); }}
                                        className="p-2 bg-white/90 backdrop-blur-sm hover:bg-white rounded-xl shadow-lg">
                                        <MoreVertical className="w-5 h-5 text-gray-600" />
                                    </button>
                                    {actionMenuId === `pack-${pack.id}` && (
                                        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border py-2 z-50">
                                            <button onClick={() => openEditPack(pack)} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                                <Edit className="w-4 h-4" />Modifier
                                            </button>
                                            <button onClick={() => { setSendingOffer(pack); setSendingType('pack'); setShowSendModal(true); setActionMenuId(null); }}
                                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                                <Send className="w-4 h-4" />Envoyer
                                            </button>
                                            <button onClick={() => handleDeletePack(pack.id)} className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                                                <Trash2 className="w-4 h-4" />Supprimer
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden hover:border-gray-900 hover:shadow-2xl transition-all duration-300">
                                    <div className="p-6 cursor-pointer hover:bg-gray-50/50" onClick={() => setSelectedPack(selectedPack?.id === pack.id ? null : pack)}>
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${pack.is_active ? 'bg-violet-50' : 'bg-gray-100'}`}>
                                                    <Layers className={`w-6 h-6 ${pack.is_active ? 'text-violet-600' : 'text-gray-400'}`} />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-gray-900 text-lg">{pack.name}</h4>
                                                    {pack.description && <p className="text-sm text-gray-500 mt-1">{pack.description}</p>}
                                                    <div className="flex items-center gap-4 mt-2">
                                                        <span className="text-sm text-gray-500">{pack.offers?.length || 0} offre(s)</span>
                                                        {pack.discount_percentage && pack.discount_percentage > 0 && (
                                                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                                                                -{pack.discount_percentage}%
                                                            </span>
                                                        )}
                                                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${pack.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                                                            {pack.is_active ? 'Actif' : 'Inactif'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {pack.price && pack.price > 0 && (
                                                    <span className="text-2xl font-bold text-gray-900">{fmtCurrency(pack.price, profile?.preferred_currency || 'EUR')}</span>
                                                )}
                                                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${selectedPack?.id === pack.id ? 'rotate-180' : ''}`} />
                                            </div>
                                        </div>
                                    </div>

                                    {selectedPack?.id === pack.id && pack.offers && pack.offers.length > 0 && (
                                        <div className="border-t border-gray-100 p-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {pack.offers.map(offer => (
                                                    <div key={offer.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                                                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                                            <Package className="w-4 h-4 text-gray-400" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-gray-900 text-sm truncate">{offer.title}</p>
                                                            <p className="text-xs text-gray-500">{fmtCurrency(offer.price, offer.currency)}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}

            {/* Offer modal */}
            {showOfferModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => { setShowOfferModal(false); setEditingOffer(null); }}>
                    <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
                            <h2 className="text-xl font-bold text-gray-900">{editingOffer ? 'Modifier l\'offre' : 'Nouvelle offre'}</h2>
                            <button onClick={() => { setShowOfferModal(false); setEditingOffer(null); }} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                                <input type="text" value={offerForm.title} onChange={e => setOfferForm({ ...offerForm, title: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0E3A5D] text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea value={offerForm.description} onChange={e => setOfferForm({ ...offerForm, description: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0E3A5D] text-sm resize-none" rows={3} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Prix</label>
                                    <input type="number" value={offerForm.price} onChange={e => setOfferForm({ ...offerForm, price: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0E3A5D] text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Devise</label>
                                    <select value={offerForm.currency} onChange={e => setOfferForm({ ...offerForm, currency: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0E3A5D] text-sm">
                                        <option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option><option value="XOF">XOF</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type de facturation</label>
                                    <select value={offerForm.billing_type} onChange={e => setOfferForm({ ...offerForm, billing_type: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0E3A5D] text-sm">
                                        <option value="fixed">Forfait</option><option value="hourly">Horaire</option><option value="daily">Journalier</option><option value="unit">À l&apos;unité</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Durée</label>
                                    <input type="text" value={offerForm.duration} onChange={e => setOfferForm({ ...offerForm, duration: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0E3A5D] text-sm" placeholder="ex: 3 mois" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                                <input type="text" value={offerForm.category} onChange={e => setOfferForm({ ...offerForm, category: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0E3A5D] text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fonctionnalités (une par ligne)</label>
                                <textarea value={offerForm.features} onChange={e => setOfferForm({ ...offerForm, features: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0E3A5D] text-sm resize-none" rows={3} />
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={() => setOfferForm({ ...offerForm, is_active: !offerForm.is_active })}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${offerForm.is_active ? 'bg-[#0E3A5D]' : 'bg-gray-300'}`}>
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${offerForm.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                                <span className="text-sm text-gray-700">Active</span>
                            </div>
                            <div className="flex gap-3 pt-4 border-t">
                                <button onClick={() => { setShowOfferModal(false); setEditingOffer(null); }}
                                    className="flex-1 px-4 py-3 border rounded-xl text-gray-700 hover:bg-gray-50">Annuler</button>
                                <button onClick={handleSaveOffer}
                                    className="flex-1 px-4 py-3 bg-[#0E3A5D] text-white rounded-xl font-medium hover:bg-[#0c2d47]">
                                    {editingOffer ? 'Modifier' : 'Créer'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Pack modal */}
            {showPackModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => { setShowPackModal(false); setEditingPack(null); }}>
                    <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
                            <h2 className="text-xl font-bold text-gray-900">{editingPack ? 'Modifier le pack' : 'Nouveau pack'}</h2>
                            <button onClick={() => { setShowPackModal(false); setEditingPack(null); }} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                                <input type="text" value={packForm.name} onChange={e => setPackForm({ ...packForm, name: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0E3A5D] text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea value={packForm.description} onChange={e => setPackForm({ ...packForm, description: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0E3A5D] text-sm resize-none" rows={3} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Prix du pack</label>
                                    <input type="number" value={packForm.price} onChange={e => setPackForm({ ...packForm, price: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0E3A5D] text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Réduction (%)</label>
                                    <input type="number" value={packForm.discount_percentage} onChange={e => setPackForm({ ...packForm, discount_percentage: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0E3A5D] text-sm" min="0" max="100" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Offres incluses</label>
                                <div className="max-h-48 overflow-y-auto space-y-2 p-2 bg-gray-50 rounded-xl">
                                    {offers.map(offer => (
                                        <label key={offer.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white cursor-pointer">
                                            <input type="checkbox" checked={packForm.selectedOfferIds.includes(offer.id)}
                                                onChange={() => {
                                                    const ids = packForm.selectedOfferIds.includes(offer.id)
                                                        ? packForm.selectedOfferIds.filter(id => id !== offer.id)
                                                        : [...packForm.selectedOfferIds, offer.id];
                                                    setPackForm({ ...packForm, selectedOfferIds: ids });
                                                }}
                                                className="rounded border-gray-300 text-[#0E3A5D] focus:ring-[#0E3A5D]" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">{offer.title}</p>
                                                <p className="text-xs text-gray-500">{fmtCurrency(offer.price, offer.currency)}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={() => setPackForm({ ...packForm, is_active: !packForm.is_active })}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${packForm.is_active ? 'bg-[#0E3A5D]' : 'bg-gray-300'}`}>
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${packForm.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                                <span className="text-sm text-gray-700">Actif</span>
                            </div>
                            <div className="flex gap-3 pt-4 border-t">
                                <button onClick={() => { setShowPackModal(false); setEditingPack(null); }}
                                    className="flex-1 px-4 py-3 border rounded-xl text-gray-700 hover:bg-gray-50">Annuler</button>
                                <button onClick={handleSavePack}
                                    className="flex-1 px-4 py-3 bg-[#0E3A5D] text-white rounded-xl font-medium hover:bg-[#0c2d47]">
                                    {editingPack ? 'Modifier' : 'Créer'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Send modal */}
            {showSendModal && sendingOffer && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => { setShowSendModal(false); setSendingOffer(null); }}>
                    <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
                            <h2 className="text-xl font-bold text-gray-900">Envoyer {sendingType === 'offer' ? 'l\'offre' : 'le pack'}</h2>
                            <button onClick={() => { setShowSendModal(false); setSendingOffer(null); }} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Destinataires *</label>
                                <div className="max-h-48 overflow-y-auto space-y-2 p-2 bg-gray-50 rounded-xl">
                                    {contacts.filter(c => c.email).map(contact => (
                                        <label key={contact.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white cursor-pointer">
                                            <input type="checkbox" checked={selectedRecipients.includes(contact.id)}
                                                onChange={() => {
                                                    setSelectedRecipients(prev =>
                                                        prev.includes(contact.id) ? prev.filter(id => id !== contact.id) : [...prev, contact.id]
                                                    );
                                                }}
                                                className="rounded border-gray-300 text-[#0E3A5D] focus:ring-[#0E3A5D]" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{contact.full_name}</p>
                                                <p className="text-xs text-gray-500">{contact.email}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Message (optionnel)</label>
                                <textarea value={sendMessage} onChange={e => setSendMessage(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0E3A5D] text-sm resize-none" rows={3}
                                    placeholder="Ajoutez un message personnalisé..." />
                            </div>
                            <div className="flex gap-3 pt-4 border-t">
                                <button onClick={() => { setShowSendModal(false); setSendingOffer(null); }}
                                    className="flex-1 px-4 py-3 border rounded-xl text-gray-700 hover:bg-gray-50">Annuler</button>
                                <button onClick={handleSendOffer} disabled={selectedRecipients.length === 0 || isSending}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#0E3A5D] text-white rounded-xl font-medium hover:bg-[#0c2d47] disabled:opacity-50">
                                    {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    {isSending ? 'Envoi...' : `Envoyer (${selectedRecipients.length})`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
