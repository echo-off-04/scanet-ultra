import { useState, useEffect, useCallback } from 'react';
import {
    Package, Plus, Search, Edit, Trash2, X, ChevronDown,
    Layers, Coins, Clock, CheckCircle, Tag, MoreVertical,
    FolderPlus, Eye, EyeOff, Send, Image, Users, Filter
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { sendOfferEmail, sendOfferPackEmail } from '../lib/emailService';

// Types
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

interface ContactGroup {
    id: string;
    name: string;
    color: string | null;
}

interface OffersProps {
    onOfferSelect?: (offerId: string) => void;
}

type TabType = 'offers' | 'packs';
type FilterType = 'all' | 'active' | 'inactive';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function Offers(_props: OffersProps) {
    const { profile } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('offers');
    const [offers, setOffers] = useState<Offer[]>([]);
    const [packs, setPacks] = useState<OfferPack[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<FilterType>('active');

    // Contacts and groups for sending offers
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [contactGroups, setContactGroups] = useState<ContactGroup[]>([]);

    // Modals state
    const [showOfferModal, setShowOfferModal] = useState(false);
    const [showPackModal, setShowPackModal] = useState(false);
    const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
    const [editingPack, setEditingPack] = useState<OfferPack | null>(null);
    const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
    const [selectedPack, setSelectedPack] = useState<OfferPack | null>(null);
    const [actionMenuId, setActionMenuId] = useState<string | null>(null);

    // Send offer modal
    const [showSendModal, setShowSendModal] = useState(false);
    const [sendingOffer, setSendingOffer] = useState<Offer | OfferPack | null>(null);
    const [sendingType, setSendingType] = useState<'offer' | 'pack'>('offer');

    // Fetch contacts and groups
    const fetchContactsAndGroups = useCallback(async () => {
        try {
            const [contactsRes, groupsRes] = await Promise.all([
                supabase.from('contacts').select('id, full_name, email, avatar_url').order('full_name'),
                supabase.from('contact_groups').select('id, name, color').order('name')
            ]);
            if (contactsRes.data) setContacts(contactsRes.data as Contact[]);
            if (groupsRes.data) setContactGroups(groupsRes.data as ContactGroup[]);
        } catch (error) {
            console.error('Error fetching contacts and groups:', error);
        }
    }, []);

    // Fetch offers
    const fetchOffers = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('offers')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOffers((data || []) as Offer[]);
        } catch (error) {
            console.error('Error fetching offers:', error);
        }
    }, []);

    // Fetch packs with their offers
    const fetchPacks = useCallback(async () => {
        try {
            const { data: packsData, error: packsError } = await supabase
                .from('offer_packs')
                .select('*')
                .order('created_at', { ascending: false });

            if (packsError) throw packsError;

            // Pour chaque pack, récupérer les offres associées
            const packsWithOffers = await Promise.all(
                ((packsData || []) as OfferPack[]).map(async (pack) => {
                    const { data: itemsData, error: itemsError } = await supabase
                        .from('offer_pack_items')
                        .select(`
                            offer_id,
                            offer:offers (*)
                        `)
                        .eq('pack_id', pack.id);

                    if (itemsError) {
                        console.error('Error fetching pack items:', itemsError);
                        return { ...pack, offers: [] as Offer[] };
                    }

                    const offers = (itemsData || [])
                        .map((item: { offer: Offer | Offer[] | null }) => {
                            if (Array.isArray(item.offer)) return item.offer[0];
                            return item.offer;
                        })
                        .filter((offer): offer is Offer => offer !== null);

                    return { ...pack, offers };
                })
            );

            setPacks(packsWithOffers);
        } catch (error) {
            console.error('Error fetching packs:', error);
        }
    }, []);

    // Load data
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([fetchOffers(), fetchPacks(), fetchContactsAndGroups()]);
            setLoading(false);
        };
        loadData();

        // Subscribe to offers changes
        const offersSubscription = supabase
            .channel('offers-changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'offers'
            }, () => {
                fetchOffers();
            })
            .subscribe();

        // Subscribe to offer packs changes
        const packsSubscription = supabase
            .channel('packs-changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'offer_packs'
            }, () => {
                fetchPacks();
            })
            .subscribe();

        // Subscribe to offer pack items changes
        const packItemsSubscription = supabase
            .channel('pack-items-changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'offer_pack_items'
            }, () => {
                fetchPacks();
            })
            .subscribe();

        return () => {
            offersSubscription.unsubscribe();
            packsSubscription.unsubscribe();
            packItemsSubscription.unsubscribe();
        };
    }, [fetchOffers, fetchPacks, fetchContactsAndGroups]);

    // Delete offer
    const handleDeleteOffer = async (offerId: string, fromPackOnly?: string) => {
        if (fromPackOnly) {
            // Supprimer uniquement du pack
            if (!confirm('Retirer cette offre du pack ?')) return;
            try {
                const { error } = await supabase
                    .from('offer_pack_items')
                    .delete()
                    .eq('pack_id', fromPackOnly)
                    .eq('offer_id', offerId);

                if (error) throw error;
                fetchPacks();
            } catch (error) {
                console.error('Error removing offer from pack:', error);
            }
        } else {
            // Supprimer complètement l'offre
            if (!confirm('Êtes-vous sûr de vouloir supprimer cette offre ? Elle sera également retirée de tous les packs.')) return;
            try {
                const { error } = await supabase
                    .from('offers')
                    .delete()
                    .eq('id', offerId);

                if (error) throw error;
                fetchOffers();
                fetchPacks();
                setActionMenuId(null);
            } catch (error) {
                console.error('Error deleting offer:', error);
            }
        }
    };

    // Delete pack
    const handleDeletePack = async (packId: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce pack ? Les offres qu\'il contient ne seront pas supprimées.')) return;
        try {
            const { error } = await supabase
                .from('offer_packs')
                .delete()
                .eq('id', packId);

            if (error) throw error;
            fetchPacks();
            setActionMenuId(null);
        } catch (error) {
            console.error('Error deleting pack:', error);
        }
    };

    // Handle sending offer to contacts
    const handleSendOffer = async (recipientIds: string[], groupIds: string[], message: string) => {
        if (!sendingOffer) return;

        console.log('[Offers] Starting to send offer...');
        const loadingToast = toast.loading('Envoi des emails en cours...');

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Non authentifié');

            // Get sender profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, company')
                .eq('id', user.id)
                .single();

            const senderName = profile?.full_name || profile?.company || 'Un partenaire';

            // Get all contact IDs from groups
            let allRecipientIds = [...recipientIds];
            if (groupIds.length > 0) {
                const { data: groupMembers } = await supabase
                    .from('contact_group_members')
                    .select('contact_id')
                    .in('group_id', groupIds);

                if (groupMembers) {
                    allRecipientIds = [
                        ...allRecipientIds,
                        ...groupMembers.map(m => m.contact_id)
                    ];
                }
            }

            // Remove duplicates
            allRecipientIds = [...new Set(allRecipientIds)];

            // Get contact details
            const { data: contactsData } = await supabase
                .from('contacts')
                .select('id, email, full_name')
                .in('id', allRecipientIds);

            if (!contactsData || contactsData.length === 0) {
                throw new Error('Aucun contact avec email trouvé');
            }

            const contactsWithEmail = contactsData.filter(c => c.email);

            if (contactsWithEmail.length === 0) {
                throw new Error('Aucun contact avec email trouvé');
            }

            let successCount = 0;
            let failCount = 0;

            // Send emails to each contact
            for (const contact of contactsWithEmail) {
                try {
                    let emailResult;

                    if (sendingType === 'offer') {
                        const offer = sendingOffer as Offer;
                        emailResult = await sendOfferEmail(contact.email!, {
                            title: offer.title,
                            description: offer.description || undefined,
                            price: offer.price || 0,
                            currency: offer.currency || 'EUR',
                            image_url: offer.image_url || undefined,
                            features: offer.features || undefined,
                            billing_type: offer.billing_type || undefined,
                            senderName,
                            message: message,
                        });
                    } else {
                        const pack = sendingOffer as OfferPack;

                        // Get pack items
                        const { data: packItems } = await supabase
                            .from('offer_pack_items')
                            .select(`
                                quantity,
                                offers (
                                    id,
                                    title,
                                    description,
                                    price
                                )
                            `)
                            .eq('pack_id', pack.id);

                        const items = (packItems || []).map((item: any) => ({
                            title: item.offers?.title || '',
                            description: item.offers?.description || undefined,
                            price: item.offers?.price || 0,
                            quantity: item.quantity || 1,
                        }));

                        emailResult = await sendOfferPackEmail(contact.email!, {
                            title: pack.name,
                            description: pack.description || undefined,
                            total_price: pack.price || 0,
                            discount_percentage: pack.discount_percentage || undefined,
                            currency: 'EUR',
                            items,
                            senderName,
                            message: message,
                        });
                    }

                    if (emailResult.success && emailResult.trackingToken) {
                        // Insert offer send record with tracking
                        await supabase.from('offer_sends').insert({
                            user_id: user.id,
                            offer_id: sendingType === 'offer' ? sendingOffer.id : null,
                            pack_id: sendingType === 'pack' ? sendingOffer.id : null,
                            recipient_contact_ids: [contact.id],
                            recipient_group_ids: groupIds,
                            message: message || null,
                            status: 'sent',
                            tracking_token: emailResult.trackingToken,
                            email_log_id: emailResult.emailLogId,
                            email_sent_at: new Date().toISOString(),
                        });

                        successCount++;
                    } else {
                        failCount++;
                        console.error('Failed to send email to:', contact.email, emailResult.error);
                    }
                } catch (error) {
                    failCount++;
                    console.error('Error sending to contact:', contact.email, error);
                }
            }

            toast.dismiss(loadingToast);

            if (successCount > 0) {
                toast.success(`${successCount} email${successCount > 1 ? 's' : ''} envoyé${successCount > 1 ? 's' : ''} avec succès !`);
            }

            if (failCount > 0) {
                toast.error(`${failCount} email${failCount > 1 ? 's' : ''} n'${failCount > 1 ? 'ont' : 'a'} pas pu être envoyé${failCount > 1 ? 's' : ''}`);
            }

            setShowSendModal(false);
            setSendingOffer(null);
        } catch (error) {
            toast.dismiss(loadingToast);
            console.error('[Offers] Error sending offer:', error);
            toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'envoi de l\'offre');
        }
    };

    // Filter offers by search and status
    const filteredOffers = offers.filter((offer) => {
        // Status filter
        if (filterStatus === 'active' && !offer.is_active) return false;
        if (filterStatus === 'inactive' && offer.is_active) return false;

        // Search filter
        if (!searchQuery) return true;
        const search = searchQuery.toLowerCase();
        return (
            offer.title.toLowerCase().includes(search) ||
            offer.description?.toLowerCase().includes(search) ||
            offer.category?.toLowerCase().includes(search)
        );
    });

    // Filter packs by search and status
    const filteredPacks = packs.filter((pack) => {
        // Status filter
        if (filterStatus === 'active' && !pack.is_active) return false;
        if (filterStatus === 'inactive' && pack.is_active) return false;

        // Search filter
        if (!searchQuery) return true;
        const search = searchQuery.toLowerCase();
        return (
            pack.name.toLowerCase().includes(search) ||
            pack.description?.toLowerCase().includes(search)
        );
    });

    // Stats
    const stats = {
        totalOffers: offers.length,
        activeOffers: offers.filter(o => o.is_active).length,
        totalPacks: packs.length,
        activePacks: packs.filter(p => p.is_active).length,
    };

    // Format currency
    const formatCurrency = (amount: number | null, currency: string | null = 'EUR') => {
        if (amount === null) return '-';
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: currency || 'EUR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header minimaliste */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-2">Offres</h1>
                    <p className="text-lg text-gray-500">
                        {activeTab === 'offers' ? `${stats.totalOffers} offre${stats.totalOffers !== 1 ? 's' : ''}` : `${stats.totalPacks} pack${stats.totalPacks !== 1 ? 's' : ''}`}
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => setShowOfferModal(true)}
                        className="group relative overflow-hidden bg-gradient-to-r from-[#0E3A5D] to-[#1e5a8e] text-white px-8 py-4 rounded-full hover:from-[#0E3A5D]-800 hover:to-[#1e5a8e]-700 transition-all font-semibold shadow-2xl hover:shadow-3xl transform hover:scale-105 flex items-center gap-3"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 group-hover:translate-x-full transition-transform duration-700" />
                        <Plus className="w-5 h-5 relative z-10" />
                        <span className="relative z-10">Nouvelle offre</span>
                    </button>
                    <button
                        onClick={() => setShowPackModal(true)}
                        className="px-8 py-4 border-2 border-gray-900 rounded-full font-semibold text-gray-900 hover:bg-gray-900 hover:text-white transition-all flex items-center gap-3"
                    >
                        <FolderPlus className="w-5 h-5" />
                        <span>Nouveau pack</span>
                    </button>
                </div>
            </div>

            {/* Stats en grille moderne */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                {/* Total Offres - Dark card */}
                <div className="group relative overflow-hidden rounded-xl lg:rounded-2xl">
                    <div className="relative rounded-xl lg:rounded-2xl p-4 lg:p-5 border transition-all duration-300 hover:-translate-y-1 overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700/50 shadow-[0_8px_20px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.5)]">
                        <div className="absolute inset-0 opacity-30 overflow-hidden">
                            <svg className="w-full h-full" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                                <path d="M0,100 Q25,80 50,100 T100,100 Q125,120 150,100 T200,100 L200,200 L0,200 Z" fill="white" opacity="0.375" />
                                <path d="M0,120 Q25,100 50,120 T100,120 Q125,140 150,120 T200,120 L200,200 L0,200 Z" fill="white" opacity="0.3" />
                            </svg>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/5 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500 rounded-xl lg:rounded-2xl" />
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-xl lg:rounded-2xl" />
                        <div className="absolute inset-[1px] rounded-xl lg:rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] pointer-events-none" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2 lg:mb-3">
                                <div className="p-1.5 rounded-lg transition-transform duration-300 group-hover:scale-110 bg-white/10">
                                    <Package className="w-3.5 h-3.5 transition-colors duration-300 text-white/90" strokeWidth={2} />
                                </div>
                                <p className="text-[10px] lg:text-xs font-medium uppercase tracking-wider text-white/70">Total Offres</p>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">{stats.totalOffers}</h3>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Offres actives */}
                <div className="group relative overflow-hidden rounded-xl lg:rounded-2xl">
                    <div className="relative rounded-xl lg:rounded-2xl p-4 lg:p-5 border transition-all duration-300 hover:-translate-y-1 overflow-hidden bg-white border-gray-200 shadow-[0_4px_12px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
                        <div className="absolute inset-0 opacity-30 overflow-hidden">
                            <svg className="w-full h-full" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                                <path d="M0,100 Q25,80 50,100 T100,100 Q125,120 150,100 T200,100 L200,200 L0,200 Z" fill="#10b981" opacity="0.2" />
                                <path d="M0,120 Q25,100 50,120 T100,120 Q125,140 150,120 T200,120 L200,200 L0,200 Z" fill="#10b981" opacity="0.16" />
                            </svg>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl lg:rounded-2xl" />
                        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl lg:rounded-2xl" />
                        <div className="absolute -inset-1 rounded-xl lg:rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-xl" style={{ backgroundColor: '#10b981' }} />
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2 lg:mb-3">
                                <div className="p-1.5 rounded-lg transition-transform duration-300 group-hover:scale-110" style={{ backgroundColor: '#10b98115' }}>
                                    <CheckCircle className="w-3.5 h-3.5 transition-colors duration-300" strokeWidth={2} style={{ color: '#10b981' }} />
                                </div>
                                <p className="text-[10px] lg:text-xs font-medium uppercase tracking-wider text-gray-500">Actives</p>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-2xl lg:text-3xl font-bold tracking-tight text-emerald-600">{stats.activeOffers}</h3>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Total Packs */}
                <div className="group relative overflow-hidden rounded-xl lg:rounded-2xl">
                    <div className="relative rounded-xl lg:rounded-2xl p-4 lg:p-5 border transition-all duration-300 hover:-translate-y-1 overflow-hidden bg-white border-gray-200 shadow-[0_4px_12px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
                        <div className="absolute inset-0 opacity-30 overflow-hidden">
                            <svg className="w-full h-full" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                                <path d="M0,100 Q25,80 50,100 T100,100 Q125,120 150,100 T200,100 L200,200 L0,200 Z" fill="#6366f1" opacity="0.2" />
                                <path d="M0,120 Q25,100 50,120 T100,120 Q125,140 150,120 T200,120 L200,200 L0,200 Z" fill="#6366f1" opacity="0.16" />
                            </svg>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl lg:rounded-2xl" />
                        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl lg:rounded-2xl" />
                        <div className="absolute -inset-1 rounded-xl lg:rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-xl" style={{ backgroundColor: '#6366f1' }} />
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2 lg:mb-3">
                                <div className="p-1.5 rounded-lg transition-transform duration-300 group-hover:scale-110" style={{ backgroundColor: '#6366f115' }}>
                                    <Layers className="w-3.5 h-3.5 transition-colors duration-300" strokeWidth={2} style={{ color: '#6366f1' }} />
                                </div>
                                <p className="text-[10px] lg:text-xs font-medium uppercase tracking-wider text-gray-500">Total Packs</p>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-2xl lg:text-3xl font-bold tracking-tight text-gray-900">{stats.totalPacks}</h3>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Packs actifs */}
                <div className="group relative overflow-hidden rounded-xl lg:rounded-2xl">
                    <div className="relative rounded-xl lg:rounded-2xl p-4 lg:p-5 border transition-all duration-300 hover:-translate-y-1 overflow-hidden bg-white border-gray-200 shadow-[0_4px_12px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
                        <div className="absolute inset-0 opacity-30 overflow-hidden">
                            <svg className="w-full h-full" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                                <path d="M0,100 Q25,80 50,100 T100,100 Q125,120 150,100 T200,100 L200,200 L0,200 Z" fill="#f59e0b" opacity="0.2" />
                                <path d="M0,120 Q25,100 50,120 T100,120 Q125,140 150,120 T200,120 L200,200 L0,200 Z" fill="#f59e0b" opacity="0.16" />
                            </svg>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-amber-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl lg:rounded-2xl" />
                        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl lg:rounded-2xl" />
                        <div className="absolute -inset-1 rounded-xl lg:rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-xl" style={{ backgroundColor: '#f59e0b' }} />
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2 lg:mb-3">
                                <div className="p-1.5 rounded-lg transition-transform duration-300 group-hover:scale-110" style={{ backgroundColor: '#f59e0b15' }}>
                                    <Tag className="w-3.5 h-3.5 transition-colors duration-300" strokeWidth={2} style={{ color: '#f59e0b' }} />
                                </div>
                                <p className="text-[10px] lg:text-xs font-medium uppercase tracking-wider text-gray-500">Packs Actifs</p>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-2xl lg:text-3xl font-bold tracking-tight text-amber-600">{stats.activePacks}</h3>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs modernes avec scroll */}
            <div className="bg-white rounded-3xl border border-gray-200 p-2 w-full max-w-full overflow-x-auto scrollbar-hide">
                <div className="flex gap-2 min-w-max">
                    <button
                        onClick={() => setActiveTab('offers')}
                        className={`px-6 py-3 rounded-2xl font-semibold transition-all flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${activeTab === 'offers'
                            ? 'bg-gray-900 text-white shadow-lg'
                            : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        <Package className="w-4 h-4" />
                        Offres ({filteredOffers.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('packs')}
                        className={`px-6 py-3 rounded-2xl font-semibold transition-all flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${activeTab === 'packs'
                            ? 'bg-gray-900 text-white shadow-lg'
                            : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        <Layers className="w-4 h-4" />
                        Packs ({filteredPacks.length})
                    </button>
                </div>
            </div>

            {/* Recherche et filtres épurés */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder={activeTab === 'offers' ? 'Rechercher une offre...' : 'Rechercher un pack...'}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 bg-gray-50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all text-gray-900 placeholder-gray-400"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <Filter className="w-5 h-5 text-gray-400" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as FilterType)}
                            className="appearance-none pl-4 pr-10 py-4 bg-gray-50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all cursor-pointer text-gray-900 font-medium"
                        >
                            <option value="all">Toutes</option>
                            <option value="active">Actives</option>
                            <option value="inactive">Inactives</option>
                        </select>
                        <ChevronDown className="w-5 h-5 text-gray-400 pointer-events-none -ml-9" />
                    </div>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="bg-white rounded-3xl border border-gray-200 p-6 animate-pulse">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gray-200" />
                                <div className="flex-1">
                                    <div className="h-5 bg-gray-200 rounded w-1/3 mb-2" />
                                    <div className="h-4 bg-gray-200 rounded w-1/4" />
                                </div>
                                <div className="h-8 bg-gray-200 rounded w-24" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : activeTab === 'offers' ? (
                // Liste des offres
                filteredOffers.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-gray-200 p-16 text-center">
                        <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <Package className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">
                            {searchQuery ? 'Aucune offre trouvée' : 'Aucune offre'}
                        </h3>
                        <p className="text-gray-500 mb-8 max-w-md mx-auto text-lg">
                            {searchQuery
                                ? 'Modifiez vos filtres pour voir plus de résultats.'
                                : 'Créez votre première offre pour la proposer à vos clients.'}
                        </p>
                        {!searchQuery && (
                            <button
                                onClick={() => setShowOfferModal(true)}
                                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#0E3A5D] to-[#1e5a8e] text-white rounded-full hover:from-[#0E3A5D]-800 hover:to-[#1e5a8e]-700 transition-all font-semibold shadow-2xl"
                            >
                                <Plus className="w-5 h-5" />
                                Créer votre première offre
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredOffers.map((offer) => (
                            <div key={offer.id} className="relative">
                                {/* Menu kebab au-dessus de la card */}
                                <div className="absolute top-4 right-4 z-10">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActionMenuId(actionMenuId === offer.id ? null : offer.id);
                                        }}
                                        className="p-2 bg-white/90 backdrop-blur-sm hover:bg-white rounded-xl transition-all shadow-lg"
                                    >
                                        <MoreVertical className="w-5 h-5 text-gray-600" />
                                    </button>

                                    {actionMenuId === offer.id && (
                                        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-200 py-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingOffer(offer);
                                                    setShowOfferModal(true);
                                                    setActionMenuId(null);
                                                }}
                                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                            >
                                                <Edit className="w-4 h-4" />
                                                Modifier
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSendingOffer(offer);
                                                    setSendingType('offer');
                                                    setShowSendModal(true);
                                                    setActionMenuId(null);
                                                }}
                                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                            >
                                                <Send className="w-4 h-4" />
                                                Envoyer
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteOffer(offer.id);
                                                }}
                                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Supprimer
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Card de l'offre */}
                                <div
                                    className="bg-white rounded-3xl border border-gray-200 overflow-hidden hover:border-gray-900 hover:shadow-2xl transition-all duration-300 cursor-pointer group"
                                    onClick={() => setSelectedOffer(offer)}
                                >
                                    {/* Image de l'offre */}
                                    {offer.image_url && (
                                        <div className="w-full h-48 overflow-hidden">
                                            <img
                                                src={offer.image_url}
                                                alt={offer.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                            />
                                        </div>
                                    )}

                                    <div className="p-6">
                                        <div className="flex items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${offer.is_active ? 'bg-emerald-50' : 'bg-gray-100'
                                                    }`}>
                                                    {offer.is_active ? (
                                                        <Eye className="w-5 h-5 text-emerald-600" />
                                                    ) : (
                                                        <EyeOff className="w-5 h-5 text-gray-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-gray-900">{offer.title}</h4>
                                                    {offer.category && (
                                                        <span className="text-xs text-gray-500">{offer.category}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                {offer.description && (
                                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{offer.description}</p>
                                )}

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Coins className="w-4 h-4 text-gray-400" />
                                        <span className="font-bold text-gray-900">
                                            {formatCurrency(offer.price, offer.currency)}
                                        </span>
                                    </div>
                                    {offer.duration && (
                                        <div className="flex items-center gap-1 text-sm text-gray-500">
                                            <Clock className="w-4 h-4" />
                                            {offer.duration}
                                        </div>
                                    )}
                                </div>

                                    {offer.features && offer.features.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                            <p className="text-xs text-gray-500 mb-2">{offer.features.length} fonctionnalité(s)</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            </div>
                        ))}
                    </div>
                )
            ) : (
                // Liste des packs
                filteredPacks.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-gray-200 p-16 text-center">
                        <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <Layers className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">
                            {searchQuery ? 'Aucun pack trouvé' : 'Aucun pack'}
                        </h3>
                        <p className="text-gray-500 mb-8 max-w-md mx-auto text-lg">
                            {searchQuery
                                ? 'Modifiez vos filtres pour voir plus de résultats.'
                                : 'Créez des packs pour regrouper plusieurs offres.'}
                        </p>
                        {!searchQuery && (
                            <button
                                onClick={() => setShowPackModal(true)}
                                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#0E3A5D] to-[#1e5a8e] text-white rounded-full hover:from-[#0E3A5D]-800 hover:to-[#1e5a8e]-700 transition-all font-semibold shadow-2xl"
                            >
                                <FolderPlus className="w-5 h-5" />
                                Créer votre premier pack
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6">
                        {filteredPacks.map((pack) => (
                            <div key={pack.id} className="relative">
                                {/* Menu kebab au-dessus de la card */}
                                <div className="absolute top-4 right-4 z-50">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActionMenuId(actionMenuId === `pack-${pack.id}` ? null : `pack-${pack.id}`);
                                        }}
                                        className="p-2 bg-white/90 backdrop-blur-sm hover:bg-white rounded-xl transition-all shadow-lg"
                                    >
                                        <MoreVertical className="w-5 h-5 text-gray-600" />
                                    </button>

                                    {actionMenuId === `pack-${pack.id}` && (
                                        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-200 py-2 z-50">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingPack(pack);
                                                    setShowPackModal(true);
                                                    setActionMenuId(null);
                                                }}
                                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                            >
                                                <Edit className="w-4 h-4" />
                                                Modifier
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSendingOffer(pack);
                                                    setSendingType('pack');
                                                    setShowSendModal(true);
                                                    setActionMenuId(null);
                                                }}
                                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                            >
                                                <Send className="w-4 h-4" />
                                                Envoyer
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeletePack(pack.id);
                                                }}
                                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Supprimer le pack
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Card du pack */}
                                <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden hover:border-gray-900 hover:shadow-2xl transition-all duration-300">
                                    {/* En-tête du pack */}
                                    <div
                                        className="p-6 cursor-pointer hover:bg-gray-50/50 transition-all"
                                        onClick={() => setSelectedPack(selectedPack?.id === pack.id ? null : pack)}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-4">
                                                {pack.image_url ? (
                                                    <img
                                                        src={pack.image_url}
                                                        alt={pack.name}
                                                        className="w-16 h-16 rounded-xl object-cover border border-gray-200"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                            const parent = (e.target as HTMLImageElement).parentElement;
                                                            if (parent) {
                                                                const fallback = document.createElement('div');
                                                                fallback.className = `w-12 h-12 rounded-xl flex items-center justify-center ${pack.is_active ? 'bg-violet-50' : 'bg-gray-100'}`;
                                                                fallback.innerHTML = `<svg class="w-6 h-6 ${pack.is_active ? 'text-violet-600' : 'text-gray-400'}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`;
                                                                parent.appendChild(fallback);
                                                            }
                                                        }}
                                                    />
                                                ) : (
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${pack.is_active ? 'bg-violet-50' : 'bg-gray-100'
                                                        }`}>
                                                        <Layers className={`w-6 h-6 ${pack.is_active ? 'text-violet-600' : 'text-gray-400'}`} />
                                                    </div>
                                                )}
                                                <div>
                                                    <h4 className="font-semibold text-gray-900 text-lg">{pack.name}</h4>
                                                    {pack.description && (
                                                        <p className="text-sm text-gray-500 mt-1 break-words">{pack.description}</p>
                                                    )}
                                                    <div className="flex items-center gap-4 mt-2">
                                                        <span className="text-sm text-gray-500">
                                                            {pack.offers?.length || 0} offre(s)
                                                        </span>
                                                        {pack.discount_percentage && pack.discount_percentage > 0 && (
                                                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                                                                -{pack.discount_percentage}%
                                                            </span>
                                                        )}
                                                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${pack.is_active
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : 'bg-gray-100 text-gray-600'
                                                            }`}>
                                                            {pack.is_active ? 'Actif' : 'Inactif'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                {pack.price && pack.price > 0 && (
                                                    <div className="flex flex-col items-end mr-2">
                                                        <span className="text-2xl font-bold text-gray-900">
                                                            {new Intl.NumberFormat('fr-FR', {
                                                                style: 'currency',
                                                                currency: profile?.currency || 'EUR',
                                                                minimumFractionDigits: 0,
                                                                maximumFractionDigits: 2
                                                            }).format(pack.price)}
                                                        </span>
                                                        {pack.discount_percentage && pack.discount_percentage > 0 && (
                                                            <span className="text-xs text-emerald-600 font-medium">
                                                                Économie de {pack.discount_percentage}%
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${selectedPack?.id === pack.id ? 'rotate-180' : ''
                                                    }`} />
                                            </div>
                                        </div>
                                    </div>

                                {/* Contenu du pack (offres) */}
                                {selectedPack?.id === pack.id && (
                                    <div className="border-t border-gray-200 p-6 bg-gray-50">
                                        {pack.offers && pack.offers.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {pack.offers.map((offer) => (
                                                    <div
                                                        key={offer.id}
                                                        className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all"
                                                    >
                                                        <div className="flex items-start justify-between mb-3">
                                                            <h5 className="font-medium text-gray-900">{offer.title}</h5>
                                                            <button
                                                                onClick={() => handleDeleteOffer(offer.id, pack.id)}
                                                                className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-600 transition-colors"
                                                                title="Retirer du pack"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                        {offer.description && (
                                                            <p className="text-sm text-gray-500 mb-3 line-clamp-2">{offer.description}</p>
                                                        )}
                                                        <div className="flex items-center justify-between text-sm">
                                                            <span className="font-semibold text-gray-900">
                                                                {formatCurrency(offer.price, offer.currency)}
                                                            </span>
                                                            {offer.duration && (
                                                                <span className="text-gray-500">{offer.duration}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8">
                                                <p className="text-gray-500">Aucune offre dans ce pack</p>
                                                <button
                                                    onClick={() => {
                                                        setEditingPack(pack);
                                                        setShowPackModal(true);
                                                    }}
                                                    className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
                                                >
                                                    Ajouter des offres →
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}

            {/* Modal Offre */}
            {showOfferModal && (
                <OfferModal
                    offer={editingOffer}
                    onClose={() => {
                        setShowOfferModal(false);
                        setEditingOffer(null);
                    }}
                    onSaved={() => {
                        fetchOffers();
                        setShowOfferModal(false);
                        setEditingOffer(null);
                    }}
                />
            )}

            {/* Modal Pack */}
            {showPackModal && (
                <PackModal
                    pack={editingPack}
                    offers={offers}
                    onClose={() => {
                        setShowPackModal(false);
                        setEditingPack(null);
                    }}
                    onSaved={() => {
                        fetchPacks();
                        setShowPackModal(false);
                        setEditingPack(null);
                    }}
                />
            )}

            {/* Modal détail offre */}
            {selectedOffer && (
                <OfferDetailModal
                    offer={selectedOffer}
                    onClose={() => setSelectedOffer(null)}
                    onEdit={() => {
                        setEditingOffer(selectedOffer);
                        setShowOfferModal(true);
                        setSelectedOffer(null);
                    }}
                    onDelete={() => {
                        handleDeleteOffer(selectedOffer.id);
                        setSelectedOffer(null);
                    }}
                />
            )}

            {/* Modal envoi d'offre */}
            {showSendModal && sendingOffer && (
                <SendOfferModal
                    item={sendingOffer}
                    type={sendingType}
                    contacts={contacts}
                    groups={contactGroups}
                    onClose={() => {
                        setShowSendModal(false);
                        setSendingOffer(null);
                    }}
                    onSend={handleSendOffer}
                />
            )}

            {/* Overlay pour fermer le menu action */}
            {actionMenuId && (
                <div
                    className="fixed inset-0 z-0"
                    onClick={() => setActionMenuId(null)}
                />
            )}
        </div>
    );
}

// ============================================
// Modal pour créer/modifier une offre
// ============================================
interface OfferModalProps {
    offer: Offer | null;
    onClose: () => void;
    onSaved: () => void;
}

function OfferModal({ offer, onClose, onSaved }: OfferModalProps) {
    const { profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>(offer?.image_url || '');
    const [formData, setFormData] = useState({
        title: offer?.title || '',
        description: offer?.description || '',
        price: offer?.price?.toString() || '',
        currency: offer?.currency || profile?.currency || 'EUR',
        duration: offer?.duration || '',
        billing_type: offer?.billing_type || 'fixed' as 'hourly' | 'daily' | 'fixed' | 'unit',
        hourly_rate: offer?.hourly_rate?.toString() || '',
        estimated_hours: offer?.estimated_hours?.toString() || '',
        daily_rate: offer?.daily_rate?.toString() || '',
        estimated_days: offer?.estimated_days?.toString() || '',
        unit_price: offer?.unit_price?.toString() || '',
        quantity: offer?.quantity?.toString() || '',
        category: offer?.category || '',
        features: offer?.features?.join('\n') || '',
        is_active: offer?.is_active ?? true,
        image_url: offer?.image_url || '',
    });

    // Calcul automatique du prix selon le type de facturation
    const calculatePrice = () => {
        switch (formData.billing_type) {
            case 'hourly':
                if (formData.hourly_rate && formData.estimated_hours) {
                    return (parseFloat(formData.hourly_rate) * parseFloat(formData.estimated_hours)).toFixed(2);
                }
                break;
            case 'daily':
                if (formData.daily_rate && formData.estimated_days) {
                    return (parseFloat(formData.daily_rate) * parseFloat(formData.estimated_days)).toFixed(2);
                }
                break;
            case 'unit':
                if (formData.unit_price && formData.quantity) {
                    return (parseFloat(formData.unit_price) * parseFloat(formData.quantity)).toFixed(2);
                }
                break;
            case 'fixed':
                return formData.price;
        }
        return formData.price;
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const uploadImage = async (userId: string): Promise<string | null> => {
        if (!imageFile) return formData.image_url || null;

        try {
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${userId}/${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('offer-images')
                .upload(fileName, imageFile);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('offer-images')
                .getPublicUrl(fileName);

            return publicUrl;
        } catch (error) {
            console.error('Error uploading image:', error);
            return null;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Non authentifié');

            const imageUrl = await uploadImage(user.id);

            const features = formData.features
                .split('\n')
                .map(f => f.trim())
                .filter(f => f.length > 0);

            // Calculer le prix selon le type de facturation
            const calculatedPrice = calculatePrice();

            const payload = {
                user_id: user.id,
                title: formData.title,
                description: formData.description || null,
                price: calculatedPrice ? parseFloat(calculatedPrice) : null,
                currency: formData.currency,
                duration: formData.duration || null,
                billing_type: formData.billing_type,
                hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
                estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null,
                daily_rate: formData.daily_rate ? parseFloat(formData.daily_rate) : null,
                estimated_days: formData.estimated_days ? parseInt(formData.estimated_days) : null,
                unit_price: formData.unit_price ? parseFloat(formData.unit_price) : null,
                quantity: formData.quantity ? parseInt(formData.quantity) : null,
                category: formData.category || null,
                features: features.length > 0 ? features : null,
                is_active: formData.is_active,
                image_url: imageUrl || null,
                updated_at: new Date().toISOString(),
            };

            if (offer) {
                const { error } = await supabase
                    .from('offers')
                    .update(payload as never)
                    .eq('id', offer.id);

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('offers')
                    .insert(payload as never);

                if (error) throw error;
            }

            onSaved();
        } catch (error) {
            console.error('Error saving offer:', error);
            toast.error('Erreur lors de l\'enregistrement de l\'offre');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
                    <h2 className="text-xl font-bold text-gray-900">
                        {offer ? 'Modifier l\'offre' : 'Nouvelle offre'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Titre */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Titre de l'offre *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Ex: Accompagnement Premium"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D] transition-all"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Décrivez votre offre..."
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D] transition-all resize-none"
                        />
                    </div>

                    {/* Type de facturation et devise */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Type de facturation *
                            </label>
                            <select
                                required
                                value={formData.billing_type}
                                onChange={(e) => setFormData({ ...formData, billing_type: e.target.value as 'hourly' | 'daily' | 'fixed' | 'unit' })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D] transition-all"
                            >
                                <option value="fixed">Prix fixe</option>
                                <option value="hourly">Par taux horaire</option>
                                <option value="daily">Par taux journalier</option>
                                <option value="unit">Par pack/unité</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Devise
                            </label>
                            <select
                                value={formData.currency}
                                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D] transition-all"
                            >
                                <option value="EUR">EUR</option>
                                <option value="USD">USD</option>
                                <option value="GBP">GBP</option>
                                <option value="XOF">XOF</option>
                                <option value="XAF">XAF</option>
                            </select>
                        </div>
                    </div>

                    {/* Champs conditionnels selon le type de facturation */}
                    {formData.billing_type === 'fixed' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Prix fixe
                            </label>
                            <input
                                type="number"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                placeholder="0"
                                min="0"
                                step="0.01"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D] transition-all"
                            />
                        </div>
                    )}

                    {formData.billing_type === 'hourly' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Taux horaire
                                </label>
                                <input
                                    type="number"
                                    value={formData.hourly_rate}
                                    onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                                    placeholder="0"
                                    min="0"
                                    step="0.01"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D] transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nombre d'heures estimées
                                </label>
                                <input
                                    type="number"
                                    value={formData.estimated_hours}
                                    onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                                    placeholder="0"
                                    min="0"
                                    step="0.5"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D] transition-all"
                                />
                            </div>
                        </div>
                    )}

                    {formData.billing_type === 'daily' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Taux journalier
                                </label>
                                <input
                                    type="number"
                                    value={formData.daily_rate}
                                    onChange={(e) => setFormData({ ...formData, daily_rate: e.target.value })}
                                    placeholder="0"
                                    min="0"
                                    step="0.01"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D] transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nombre de jours estimés
                                </label>
                                <input
                                    type="number"
                                    value={formData.estimated_days}
                                    onChange={(e) => setFormData({ ...formData, estimated_days: e.target.value })}
                                    placeholder="0"
                                    min="0"
                                    step="1"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D] transition-all"
                                />
                            </div>
                        </div>
                    )}

                    {formData.billing_type === 'unit' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Prix par unité/pack
                                </label>
                                <input
                                    type="number"
                                    value={formData.unit_price}
                                    onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                                    placeholder="0"
                                    min="0"
                                    step="0.01"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D] transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Quantité
                                </label>
                                <input
                                    type="number"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                    placeholder="0"
                                    min="0"
                                    step="1"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D] transition-all"
                                />
                            </div>
                        </div>
                    )}

                    {/* Prix calculé automatiquement */}
                    {formData.billing_type !== 'fixed' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-blue-900">Prix calculé automatiquement:</span>
                                <span className="text-lg font-bold text-blue-900">
                                    {calculatePrice() ? `${parseFloat(calculatePrice()!).toFixed(2)} ${formData.currency}` : '-'}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Catégorie */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Catégorie
                        </label>
                        <input
                            type="text"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            placeholder="Ex: Conseil, Formation"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D] transition-all"
                        />
                    </div>

                    {/* Fonctionnalités */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Fonctionnalités (une par ligne)
                        </label>
                        <textarea
                            value={formData.features}
                            onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                            placeholder="Support prioritaire&#10;Accès illimité&#10;Rapports mensuels"
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D] transition-all resize-none"
                        />
                    </div>

                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <span className="flex items-center gap-2">
                                <Image className="w-4 h-4" />
                                Image de l'offre
                            </span>
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D] transition-all"
                        />
                        {imagePreview && (
                            <div className="mt-2">
                                <img
                                    src={imagePreview}
                                    alt="Aperçu"
                                    className="w-full h-32 object-cover rounded-xl border border-gray-200"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Statut actif */}
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="is_active"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            className="w-5 h-5 rounded border-gray-300 text-[#0E3A5D] focus:ring-[#0E3A5D]"
                        />
                        <label htmlFor="is_active" className="text-sm text-gray-700">
                            Offre active (visible)
                        </label>
                    </div>

                    {/* Boutons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !formData.title}
                            className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Enregistrement...' : offer ? 'Modifier' : 'Créer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ============================================
// Modal pour créer/modifier un pack
// ============================================
interface PackModalProps {
    pack: OfferPack | null;
    offers: Offer[];
    onClose: () => void;
    onSaved: () => void;
}

function PackModal({ pack, offers, onClose, onSaved }: PackModalProps) {
    const [loading, setLoading] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>(pack?.image_url || '');
    const [isPriceManuallySet, setIsPriceManuallySet] = useState(false);
    const [formData, setFormData] = useState({
        name: pack?.name || '',
        description: pack?.description || '',
        discount_percentage: pack?.discount_percentage?.toString() || '',
        price: pack?.price?.toString() || '',
        is_active: pack?.is_active ?? true,
        image_url: pack?.image_url || '',
        selectedOffers: pack?.offers?.map(o => o.id) || [] as string[],
    });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const uploadImage = async (userId: string): Promise<string | null> => {
        if (!imageFile) return formData.image_url || null;

        try {
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${userId}/${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('offer-images')
                .upload(fileName, imageFile);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('offer-images')
                .getPublicUrl(fileName);

            return publicUrl;
        } catch (error) {
            console.error('Error uploading image:', error);
            return null;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Non authentifié');

            const imageUrl = await uploadImage(user.id);

            const payload = {
                user_id: user.id,
                name: formData.name,
                description: formData.description || null,
                discount_percentage: formData.discount_percentage ? parseFloat(formData.discount_percentage) : null,
                price: formData.price ? parseFloat(formData.price) : null,
                is_active: formData.is_active,
                image_url: imageUrl || null,
                updated_at: new Date().toISOString(),
            };

            let packId = pack?.id;

            if (pack) {
                const { error } = await supabase
                    .from('offer_packs')
                    .update(payload as never)
                    .eq('id', pack.id);

                if (error) throw error;
            } else {
                const { data, error } = await supabase
                    .from('offer_packs')
                    .insert(payload as never)
                    .select('id')
                    .single();

                if (error) throw error;
                packId = (data as { id: string }).id;
            }

            // Mettre à jour les offres du pack
            if (packId) {
                // Supprimer les anciennes associations
                await supabase
                    .from('offer_pack_items')
                    .delete()
                    .eq('pack_id', packId);

                // Ajouter les nouvelles associations
                if (formData.selectedOffers.length > 0) {
                    const items = formData.selectedOffers.map(offerId => ({
                        pack_id: packId,
                        offer_id: offerId,
                    }));

                    const { error: itemsError } = await supabase
                        .from('offer_pack_items')
                        .insert(items as never);

                    if (itemsError) throw itemsError;
                }
            }

            onSaved();
        } catch (error) {
            console.error('Error saving pack:', error);
            toast.error('Erreur lors de l\'enregistrement du pack');
        } finally {
            setLoading(false);
        }
    };

    const toggleOffer = (offerId: string) => {
        setFormData(prev => ({
            ...prev,
            selectedOffers: prev.selectedOffers.includes(offerId)
                ? prev.selectedOffers.filter(id => id !== offerId)
                : [...prev.selectedOffers, offerId]
        }));
        // Réinitialiser le prix manuel quand les offres changent
        setIsPriceManuallySet(false);
    };

    // Calcul automatique du prix du pack (uniquement si non modifié manuellement)
    useEffect(() => {
        // Ne pas calculer automatiquement si l'utilisateur a saisi un prix manuellement
        if (isPriceManuallySet) return;

        const selectedOfferObjects = offers.filter(o => formData.selectedOffers.includes(o.id));
        const totalPrice = selectedOfferObjects.reduce((sum, offer) => sum + (offer.price || 0), 0);

        let finalPrice = totalPrice;
        if (formData.discount_percentage) {
            const discount = parseFloat(formData.discount_percentage);
            if (!isNaN(discount) && discount > 0) {
                finalPrice = totalPrice * (1 - discount / 100);
            }
        }

        setFormData(prev => ({
            ...prev,
            price: finalPrice > 0 ? finalPrice.toFixed(2) : ''
        }));
    }, [formData.selectedOffers, formData.discount_percentage, offers, isPriceManuallySet]);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
                    <h2 className="text-xl font-bold text-gray-900">
                        {pack ? 'Modifier le pack' : 'Nouveau pack'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Nom */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nom du pack *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ex: Pack Starter"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D] transition-all"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Décrivez ce pack..."
                            rows={2}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D] transition-all resize-none"
                        />
                    </div>

                    {/* Prix et Réduction */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Prix du pack (€)
                            </label>
                            <input
                                type="number"
                                value={formData.price}
                                onChange={(e) => {
                                    setFormData({ ...formData, price: e.target.value });
                                    setIsPriceManuallySet(true);
                                }}
                                placeholder="0"
                                min="0"
                                step="0.01"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D] transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Réduction (%)
                            </label>
                            <input
                                type="number"
                                value={formData.discount_percentage}
                                onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                                placeholder="0"
                                min="0"
                                max="100"
                                step="0.01"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D] transition-all"
                            />
                        </div>
                    </div>

                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <span className="flex items-center gap-2">
                                <Image className="w-4 h-4" />
                                Image du pack
                            </span>
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D] transition-all"
                        />
                        {imagePreview && (
                            <div className="mt-2">
                                <img
                                    src={imagePreview}
                                    alt="Aperçu"
                                    className="w-full h-32 object-cover rounded-xl border border-gray-200"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Statut actif */}
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="pack_is_active"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            className="w-5 h-5 rounded border-gray-300 text-[#0E3A5D] focus:ring-[#0E3A5D]"
                        />
                        <label htmlFor="pack_is_active" className="text-sm text-gray-700">
                            Pack actif (visible)
                        </label>
                    </div>

                    {/* Sélection des offres */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Offres incluses
                        </label>
                        {offers.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-xl">
                                Aucune offre disponible. Créez d'abord des offres.
                            </p>
                        ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-xl p-3">
                                {offers.map((offer) => (
                                    <label
                                        key={offer.id}
                                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${formData.selectedOffers.includes(offer.id)
                                            ? 'bg-blue-50 border border-blue-200'
                                            : 'hover:bg-gray-50 border border-transparent'
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={formData.selectedOffers.includes(offer.id)}
                                            onChange={() => toggleOffer(offer.id)}
                                            className="w-5 h-5 rounded border-gray-300 text-[#0E3A5D] focus:ring-[#0E3A5D]"
                                        />
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">{offer.title}</p>
                                            {offer.price !== null && (
                                                <p className="text-sm text-gray-500">
                                                    {new Intl.NumberFormat('fr-FR', {
                                                        style: 'currency',
                                                        currency: offer.currency || 'EUR',
                                                    }).format(offer.price)}
                                                    {offer.duration && ` / ${offer.duration}`}
                                                </p>
                                            )}
                                        </div>
                                        <span className={`px-2 py-0.5 text-xs rounded-full ${offer.is_active
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {offer.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                            {formData.selectedOffers.length} offre(s) sélectionnée(s)
                        </p>
                    </div>

                    {/* Boutons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !formData.name}
                            className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Enregistrement...' : pack ? 'Modifier' : 'Créer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ============================================
// Modal détail offre
// ============================================
interface OfferDetailModalProps {
    offer: Offer;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

function OfferDetailModal({ offer, onClose, onEdit, onDelete }: OfferDetailModalProps) {
    const formatCurrency = (amount: number | null, currency: string | null = 'EUR') => {
        if (amount === null) return '-';
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: currency || 'EUR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-xl sm:rounded-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
                <div className="p-4 sm:p-6 border-b border-gray-200 flex items-start sm:items-center justify-between sticky top-0 bg-white rounded-t-xl sm:rounded-t-2xl">
                    <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-1 min-w-0 pr-2">
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ${offer.is_active ? 'bg-emerald-50' : 'bg-gray-100'
                            }`}>
                            {offer.is_active ? (
                                <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                            ) : (
                                <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-base sm:text-xl font-bold text-gray-900 break-words line-clamp-2">{offer.title}</h2>
                            {offer.category && (
                                <span className="text-xs sm:text-sm text-gray-500 break-words line-clamp-1">{offer.category}</span>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                    >
                        <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
                    </button>
                </div>

                <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
                    {/* Image de l'offre */}
                    {offer.image_url && (
                        <div className="w-full">
                            <img
                                src={offer.image_url}
                                alt={offer.title}
                                className="w-full h-48 sm:h-56 lg:h-64 object-cover rounded-lg sm:rounded-xl border border-gray-200"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                        </div>
                    )}

                    {/* Prix et durée */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gray-50 rounded-lg sm:rounded-xl p-4 sm:p-6 gap-4 sm:gap-0">
                        <div>
                            <p className="text-xs sm:text-sm text-gray-500 mb-1">Prix</p>
                            <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                                {formatCurrency(offer.price, offer.currency)}
                            </p>
                        </div>
                        {offer.duration && (
                            <div className="sm:text-right">
                                <p className="text-xs sm:text-sm text-gray-500 mb-1">Durée</p>
                                <p className="text-base sm:text-lg font-medium text-gray-900 flex items-center gap-2">
                                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                                    {offer.duration}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    {offer.description && (
                        <div>
                            <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3">Description</h3>
                            <p className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap break-words">{offer.description}</p>
                        </div>
                    )}

                    {/* Fonctionnalités */}
                    {offer.features && offer.features.length > 0 && (
                        <div>
                            <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3">Fonctionnalités incluses</h3>
                            <ul className="space-y-2">
                                {offer.features.map((feature, index) => (
                                    <li key={index} className="flex items-start gap-2 sm:gap-3">
                                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                        <span className="text-sm sm:text-base text-gray-700 break-words">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Meta infos */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 pt-3 sm:pt-4 border-t border-gray-200">
                        <span>
                            Créé le {new Date(offer.created_at).toLocaleDateString('fr-FR')}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium w-fit ${offer.is_active
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-gray-100 text-gray-600'
                            }`}>
                            {offer.is_active ? 'Active' : 'Inactive'}
                        </span>
                    </div>

                    {/* Boutons d'action */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
                        <button
                            onClick={onClose}
                            className="w-full sm:flex-1 px-4 sm:px-6 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl font-medium text-sm sm:text-base text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Fermer
                        </button>
                        <button
                            onClick={onEdit}
                            className="w-full sm:flex-1 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-medium text-sm sm:text-base text-white transition-colors flex items-center justify-center gap-2"
                            style={{ backgroundColor: '#0E3A5D' }}
                        >
                            <Edit className="w-4 h-4" />
                            Modifier
                        </button>
                        <button
                            onClick={() => {
                                if (confirm('Êtes-vous sûr de vouloir supprimer cette offre ?')) {
                                    onDelete();
                                }
                            }}
                            className="w-full sm:flex-1 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-medium text-sm sm:text-base text-white bg-red-600 hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            Supprimer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
// ============================================
// Modal pour envoyer une offre
// ============================================
interface SendOfferModalProps {
    item: Offer | OfferPack;
    type: 'offer' | 'pack';
    contacts: Contact[];
    groups: ContactGroup[];
    onClose: () => void;
    onSend: (recipientIds: string[], groupIds: string[], message: string) => void;
}

function SendOfferModal({ item, type, contacts, groups, onClose, onSend }: SendOfferModalProps) {
    const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
    const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
    const [message, setMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'contacts' | 'groups'>('contacts');

    const filteredContacts = contacts.filter(c =>
        c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredGroups = groups.filter(g =>
        g.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleContact = (id: string) => {
        setSelectedContacts(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    const toggleGroup = (id: string) => {
        setSelectedGroups(prev =>
            prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
        );
    };

    const handleSubmit = () => {
        if (selectedContacts.length === 0 && selectedGroups.length === 0) {
            toast.error('Veuillez sélectionner au moins un destinataire');
            return;
        }
        if (!message.trim()) {
            toast.error('Veuillez saisir un message');
            return;
        }
        onSend(selectedContacts, selectedGroups, message);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Envoyer l'offre</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {type === 'offer' ? (item as Offer).title : (item as OfferPack).name}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-4 border-b border-gray-100">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]"
                        />
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('contacts')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                            activeTab === 'contacts'
                                ? 'border-b-2 border-[#0E3A5D] text-[#0E3A5D]'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <span className="flex items-center justify-center gap-2">
                            <Users className="w-4 h-4" />
                            Contacts ({selectedContacts.length})
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('groups')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                            activeTab === 'groups'
                                ? 'border-b-2 border-[#0E3A5D] text-[#0E3A5D]'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <span className="flex items-center justify-center gap-2">
                            <Layers className="w-4 h-4" />
                            Groupes ({selectedGroups.length})
                        </span>
                    </button>
                </div>

                {/* Liste */}
                <div className="flex-1 overflow-y-auto p-4 min-h-[200px] max-h-[300px]">
                    {activeTab === 'contacts' ? (
                        filteredContacts.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                Aucun contact trouvé
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredContacts.map((contact) => (
                                    <label
                                        key={contact.id}
                                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                                            selectedContacts.includes(contact.id)
                                                ? 'bg-blue-50 border border-blue-200'
                                                : 'hover:bg-gray-50 border border-transparent'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedContacts.includes(contact.id)}
                                            onChange={() => toggleContact(contact.id)}
                                            className="w-5 h-5 rounded border-gray-300 text-[#0E3A5D] focus:ring-[#0E3A5D]"
                                        />
                                        {contact.avatar_url ? (
                                            <img
                                                src={contact.avatar_url}
                                                alt={contact.full_name}
                                                className="w-10 h-10 rounded-lg object-cover"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white font-medium text-sm">
                                                {contact.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 truncate">{contact.full_name}</p>
                                            {contact.email && (
                                                <p className="text-sm text-gray-500 truncate">{contact.email}</p>
                                            )}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )
                    ) : (
                        filteredGroups.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                Aucun groupe trouvé
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredGroups.map((group) => (
                                    <label
                                        key={group.id}
                                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                                            selectedGroups.includes(group.id)
                                                ? 'bg-blue-50 border border-blue-200'
                                                : 'hover:bg-gray-50 border border-transparent'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedGroups.includes(group.id)}
                                            onChange={() => toggleGroup(group.id)}
                                            className="w-5 h-5 rounded border-gray-300 text-[#0E3A5D] focus:ring-[#0E3A5D]"
                                        />
                                        <div
                                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                                            style={{ backgroundColor: group.color || '#6B7280' }}
                                        >
                                            <Layers className="w-5 h-5 text-white" />
                                        </div>
                                        <p className="font-medium text-gray-900">{group.name}</p>
                                    </label>
                                ))}
                            </div>
                        )
                    )}
                </div>

                {/* Message */}
                <div className="p-4 border-t border-gray-100">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Votre message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Présentez votre offre et expliquez pourquoi elle pourrait intéresser vos contacts..."
                        rows={4}
                        required
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D] transition-all resize-none"
                    />
                </div>

                {/* Boutons */}
                <div className="p-4 border-t border-gray-200 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={selectedContacts.length === 0 && selectedGroups.length === 0}
                        className="flex-1 px-6 py-3 bg-[#0E3A5D] text-white rounded-xl font-medium hover:bg-[#0E3A5D]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <Send className="w-4 h-4" />
                        Envoyer
                    </button>
                </div>
            </div>
        </div>
    );
}