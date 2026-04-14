import { useState, useEffect, useCallback } from 'react';
import {
    Target, Plus, Search, TrendingUp,
    DollarSign, Calendar, Edit, Trash2, MoreVertical, X,
    ChevronDown, CheckCircle, XCircle, Clock, Star
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useKpis } from '../contexts/KpiContext';
import { formatCurrency, convertCurrency, convertAllToBaseCurrency, SUPPORTED_CURRENCIES } from '../lib/currency';
import { sendOpportunityWonEmail, getEmailPreferences } from '../lib/emailService';

// Composant pour afficher les montants convertis
interface ConvertedAmountProps {
    opportunityId: string;
    amount: number | null;
    currency: string | null;
    userCurrency: string;
    size?: 'normal' | 'large';
}

function ConvertedAmount({ opportunityId, amount, currency, userCurrency, size = 'normal' }: ConvertedAmountProps) {
    const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const convert = async () => {
            if (amount === null) {
                setConvertedAmount(null);
                setLoading(false);
                return;
            }

            if (currency === userCurrency) {
                setConvertedAmount(amount);
                setLoading(false);
                return;
            }

            setLoading(true);
            const converted = await convertCurrency(amount, currency || 'EUR', userCurrency);
            setConvertedAmount(converted);
            setLoading(false);
        };

        convert();
    }, [amount, currency, userCurrency]);

    if (loading) {
        return (
            <p className={`${size === 'large' ? 'text-2xl md:text-3xl' : 'text-lg md:text-xl'} font-bold text-gray-400`}>
                ...
            </p>
        );
    }

    const formattedAmount = formatCurrency(convertedAmount, userCurrency);

    return (
        <p
            className={`${size === 'large' ? 'text-2xl md:text-3xl' : 'text-lg md:text-xl'} font-bold text-gray-900 truncate`}
            title={formattedAmount}
        >
            {formattedAmount}
        </p>
    );
}

// Composant de notation par étoiles
interface StarRatingProps {
    value: number;
    onChange?: (value: number) => void;
    readOnly?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

function StarRating({ value, onChange, readOnly = false, size = 'md' }: StarRatingProps) {
    const [hoverValue, setHoverValue] = useState<number | null>(null);

    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6'
    };

    const displayValue = hoverValue !== null ? hoverValue : value;

    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    disabled={readOnly}
                    onClick={() => !readOnly && onChange?.(star)}
                    onMouseEnter={() => !readOnly && setHoverValue(star)}
                    onMouseLeave={() => !readOnly && setHoverValue(null)}
                    className={`${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
                >
                    <Star
                        className={`${sizeClasses[size]} ${star <= displayValue
                                ? 'fill-amber-400 text-amber-400'
                                : 'fill-gray-200 text-gray-200'
                            } transition-colors`}
                    />
                </button>
            ))}
        </div>
    );
}

interface Contact {
    id: string;
    full_name: string;
    company: string | null;
    avatar_url: string | null;
    email: string | null;
    phone: string | null;
    job_title: string | null;
    status: string;
}

interface Opportunity {
    id: string;
    contact_id: string;
    user_id: string;
    title: string;
    amount: number | null;
    currency: string | null;
    status: 'prospect' | 'negotiation' | 'won' | 'lost';
    probability: number | null;
    expected_close_date: string | null;
    description: string | null;
    created_at: string;
    updated_at: string;
    contact?: Contact;
}

interface OpportunitiesProps {
    onContactSelect?: (contactId: string) => void;
}

type FilterStatus = 'all' | 'prospect' | 'negotiation' | 'won' | 'lost';
type SortOption = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc' | 'probability_desc';

export function Opportunities({ onContactSelect }: OpportunitiesProps) {
    const { profile } = useAuth();
    const { refreshOpportunities } = useKpis();
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
    const [sortBy, setSortBy] = useState<SortOption>('date_desc');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);
    const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [actionMenuId, setActionMenuId] = useState<string | null>(null);
    const [userCurrency, setUserCurrency] = useState<string>('EUR');
    const [convertedStats, setConvertedStats] = useState({
        totalAmount: 0,
        wonAmount: 0,
        weightedAmount: 0
    });

    const checkExpiredOpportunities = useCallback(async () => {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Récupérer les opportunités non terminées avec une date de clôture passée
            const { data, error } = await supabase
                .from('contact_opportunities')
                .select('id, expected_close_date, status')
                .not('status', 'in', '(won,lost)')
                .not('expected_close_date', 'is', null);

            if (error) throw error;

            const expiredOpportunities = (data || []).filter(opp => {
                if (!opp.expected_close_date) return false;
                const closeDate = new Date(opp.expected_close_date);
                return closeDate < today;
            });

            // Mettre à jour chaque opportunité expirée
            for (const opp of expiredOpportunities) {
                await supabase
                    .from('contact_opportunities')
                    .update({
                        status: 'lost',
                        probability: 1,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', opp.id);
            }

            if (expiredOpportunities.length > 0) {
                console.log(`${expiredOpportunities.length} opportunité(s) expirée(s) marquée(s) comme perdue(s)`);
            }
        } catch (error) {
            console.error('Error checking expired opportunities:', error);
        }
    }, []);

    const fetchOpportunities = useCallback(async () => {
        setLoading(true);
        try {
            // Vérifier et mettre à jour les opportunités expirées d'abord
            await checkExpiredOpportunities();

            let query = supabase
                .from('contact_opportunities')
                .select(`
          *,
          contact:contacts (*)
        `);

            // Filter by status
            if (statusFilter !== 'all') {
                query = query.eq('status', statusFilter);
            }

            // Sort
            switch (sortBy) {
                case 'date_desc':
                    query = query.order('created_at', { ascending: false });
                    break;
                case 'date_asc':
                    query = query.order('created_at', { ascending: true });
                    break;
                case 'amount_desc':
                    query = query.order('amount', { ascending: false, nullsFirst: false });
                    break;
                case 'amount_asc':
                    query = query.order('amount', { ascending: true, nullsFirst: false });
                    break;
                case 'probability_desc':
                    query = query.order('probability', { ascending: false, nullsFirst: false });
                    break;
            }

            const { data, error } = await query;

            if (error) throw error;
            setOpportunities((data || []) as Opportunity[]);
        } catch (error) {
            console.error('Error fetching opportunities:', error);
        } finally {
            setLoading(false);
        }
    }, [statusFilter, sortBy, checkExpiredOpportunities]);

    const fetchContacts = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('contacts')
                .select('*')
                .order('full_name');

            if (error) {
                console.error('Contacts fetch error:', error);
                throw error;
            }

            console.log('Contacts fetched:', data?.length);
            setContacts((data || []) as Contact[]);
        } catch (error) {
            console.error('Error fetching contacts:', error);
        }
    }, []);

    useEffect(() => {
        if (profile) {
            setUserCurrency((profile as any).preferred_currency || 'EUR');
        }
    }, [profile]);

    useEffect(() => {
        fetchOpportunities();

        // Subscribe to opportunities changes
        const opportunitiesSubscription = supabase
            .channel('opportunities-changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'contact_opportunities'
            }, () => {
                fetchOpportunities();
            })
            .subscribe();

        return () => {
            opportunitiesSubscription.unsubscribe();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter, sortBy]);

    useEffect(() => {
        fetchContacts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        calculateConvertedStats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [opportunities, userCurrency]);

    const handleDelete = async (opportunityId: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette opportunité ?')) return;

        try {
            const { error } = await supabase
                .from('contact_opportunities')
                .delete()
                .eq('id', opportunityId);

            if (error) throw error;
            fetchOpportunities();
            refreshOpportunities();
            setActionMenuId(null);
        } catch (error) {
            console.error('Error deleting opportunity:', error);
        }
    };

    const handleStatusChange = async (opportunityId: string, newStatus: 'prospect' | 'negotiation' | 'won' | 'lost') => {
        try {
            const updateData: any = {
                status: newStatus,
                updated_at: new Date().toISOString()
            };

            // Auto-set probability based on status
            if (newStatus === 'lost') {
                updateData.probability = 1;
            } else if (newStatus === 'won') {
                updateData.probability = 5;
            }

            const { error } = await supabase
                .from('contact_opportunities')
                .update(updateData)
                .eq('id', opportunityId);

            if (error) throw error;

            // Send email if status changed to won
            if (newStatus === 'won') {
                const opportunity = opportunities.find(o => o.id === opportunityId);
                if (opportunity) {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user?.email) {
                        const { data: prefs } = await getEmailPreferences(user.id);
                        if (!prefs || prefs.opportunity_emails !== false) {
                            const emailResult = await sendOpportunityWonEmail(
                                user.email,
                                opportunity.title,
                                opportunity.amount || 0,
                                opportunity.id
                            );
                            if (emailResult.success) {
                                toast.success('Email de félicitations envoyé !');
                            }
                        }
                    }
                }
            }

            fetchOpportunities();
            refreshOpportunities();
            setActionMenuId(null);
        } catch (error) {
            console.error('Error updating opportunity status:', error);
        }
    };

    const filteredOpportunities = opportunities.filter((opp) => {
        if (!searchQuery) return true;
        const search = searchQuery.toLowerCase();
        return (
            opp.title.toLowerCase().includes(search) ||
            opp.contact?.full_name?.toLowerCase().includes(search) ||
            opp.contact?.company?.toLowerCase().includes(search) ||
            opp.description?.toLowerCase().includes(search)
        );
    });

    const calculateConvertedStats = async () => {
        if (opportunities.length === 0) {
            setConvertedStats({ totalAmount: 0, wonAmount: 0, weightedAmount: 0 });
            return;
        }

        // Convertir tous les montants dans la devise de l'utilisateur
        const allItems = opportunities.map(o => ({ amount: o.amount, currency: o.currency }));
        const totalAmount = await convertAllToBaseCurrency(allItems, userCurrency);

        const wonItems = opportunities.filter(o => o.status === 'won').map(o => ({ amount: o.amount, currency: o.currency }));
        const wonAmount = await convertAllToBaseCurrency(wonItems, userCurrency);

        // Montant pondéré avec conversion
        let weightedAmount = 0;
        for (const opp of opportunities.filter(o => o.status !== 'lost')) {
            const converted = await convertCurrency(opp.amount || 0, opp.currency || 'EUR', userCurrency);
            if (converted !== null) {
                weightedAmount += converted * ((opp.probability || 3) * 20) / 100;
            }
        }

        setConvertedStats({ totalAmount, wonAmount, weightedAmount });
    };

    // Calcul des statistiques
    const stats = {
        total: opportunities.length,
        totalAmount: convertedStats.totalAmount,
        wonAmount: convertedStats.wonAmount,
        prospect: opportunities.filter(o => o.status === 'prospect').length,
        negotiation: opportunities.filter(o => o.status === 'negotiation').length,
        won: opportunities.filter(o => o.status === 'won').length,
        lost: opportunities.filter(o => o.status === 'lost').length,
        weightedAmount: convertedStats.weightedAmount,
    };


    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'prospect':
                return { label: 'Prospect', color: 'bg-blue-100 text-blue-700', icon: Clock };
            case 'negotiation':
                return { label: 'Négociation', color: 'bg-amber-100 text-amber-700', icon: TrendingUp };
            case 'won':
                return { label: 'Gagné', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle };
            case 'lost':
                return { label: 'Perdu', color: 'bg-red-100 text-red-700', icon: XCircle };
            default:
                return { label: status, color: 'bg-gray-100 text-gray-700', icon: Clock };
        }
    };

    const getInitials = (contact: Contact | undefined) => {
        if (!contact) return '??';
        const names = contact.full_name?.split(' ') || [];
        if (names.length >= 2) {
            return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
        }
        return contact.full_name?.slice(0, 2).toUpperCase() || '??';
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header minimaliste */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-2">Opportunités</h1>
                    <p className="text-lg text-gray-500">{stats.total} opportunité{stats.total !== 1 ? 's' : ''}</p>
                </div>

                <button
                    onClick={() => setShowAddModal(true)}
                    className="group relative overflow-hidden bg-gradient-to-r from-[#0E3A5D] to-[#1e5a8e] text-white px-8 py-4 rounded-full hover:from-[#0E3A5D]-800 hover:to-[#1e5a8e]-700 transition-all font-semibold shadow-2xl hover:shadow-3xl transform hover:scale-105 flex items-center gap-3"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 group-hover:translate-x-full transition-transform duration-700" />
                    <Plus className="w-5 h-5 relative z-10" />
                    <span className="relative z-10">Nouvelle opportunité</span>
                </button>
            </div>

            {/* Stats en grille moderne - Style EventsList */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                {/* Total Opportunities - Dark card */}
                <div className="group relative overflow-hidden">
                    <div className="relative rounded-xl lg:rounded-2xl p-4 lg:p-5 border transition-all duration-300 hover:-translate-y-0.5 overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700/50 shadow-[0_4px_16px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
                        {/* Waves background */}
                        <div className="absolute inset-0 opacity-30 overflow-hidden">
                            <svg className="w-full h-full" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                                <path d="M0,100 Q25,80 50,100 T100,100 Q125,120 150,100 T200,100 L200,200 L0,200 Z" fill="white" opacity="0.375" />
                                <path d="M0,120 Q25,100 50,120 T100,120 Q125,140 150,120 T200,120 L200,200 L0,200 Z" fill="white" opacity="0.3" />
                            </svg>
                        </div>

                        {/* Glossy effects */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/5 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500 rounded-xl lg:rounded-2xl" />
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-xl lg:rounded-2xl" />
                        <div className="absolute inset-[1px] rounded-xl lg:rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] pointer-events-none" />

                        {/* Content */}
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2 lg:mb-3">
                                <div className="p-1.5 rounded-lg transition-transform duration-300 group-hover:scale-110 bg-white/10">
                                    <Target className="w-3.5 h-3.5 transition-colors duration-300 text-white/90" strokeWidth={2} />
                                </div>
                                <p className="text-[10px] lg:text-xs font-medium uppercase tracking-wider text-white/70">
                                    Total
                                </p>
                            </div>

                            <div className="flex items-baseline gap-2">
                                <h3 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">
                                    {stats.total}
                                </h3>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Montant total */}
                <div className="group relative overflow-hidden">
                    <div className="relative rounded-xl lg:rounded-2xl p-4 lg:p-5 border transition-all duration-300 hover:-translate-y-0.5 overflow-hidden bg-white border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)]">
                        {/* Waves background */}
                        <div className="absolute inset-0 opacity-30 overflow-hidden">
                            <svg className="w-full h-full" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                                <path d="M0,100 Q25,80 50,100 T100,100 Q125,120 150,100 T200,100 L200,200 L0,200 Z" fill="#3b82f6" opacity="0.2" />
                                <path d="M0,120 Q25,100 50,120 T100,120 Q125,140 150,120 T200,120 L200,200 L0,200 Z" fill="#3b82f6" opacity="0.16" />
                            </svg>
                        </div>

                        {/* Light card effects */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl lg:rounded-2xl" />
                        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl lg:rounded-2xl" />
                        <div className="absolute -inset-1 rounded-xl lg:rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-xl" style={{ backgroundColor: '#3b82f6' }} />

                        {/* Content */}
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2 lg:mb-3">
                                <div className="p-1.5 rounded-lg transition-transform duration-300 group-hover:scale-110" style={{ backgroundColor: '#3b82f615' }}>
                                    <DollarSign className="w-3.5 h-3.5 transition-colors duration-300" strokeWidth={2} style={{ color: '#3b82f6' }} />
                                </div>
                                <p className="text-[10px] lg:text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Montant Total
                                </p>
                            </div>

                            <div className="flex items-baseline gap-2">
                                <h3 className="text-lg lg:text-xl font-bold tracking-tight text-gray-900 truncate" title={formatCurrency(stats.totalAmount, userCurrency)}>
                                    {formatCurrency(stats.totalAmount, userCurrency)}
                                </h3>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Montant gagné */}
                <div className="group relative overflow-hidden">
                    <div className="relative rounded-xl lg:rounded-2xl p-4 lg:p-5 border transition-all duration-300 hover:-translate-y-0.5 overflow-hidden bg-white border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)]">
                        {/* Waves background */}
                        <div className="absolute inset-0 opacity-30 overflow-hidden">
                            <svg className="w-full h-full" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                                <path d="M0,100 Q25,80 50,100 T100,100 Q125,120 150,100 T200,100 L200,200 L0,200 Z" fill="#10b981" opacity="0.2" />
                                <path d="M0,120 Q25,100 50,120 T100,120 Q125,140 150,120 T200,120 L200,200 L0,200 Z" fill="#10b981" opacity="0.16" />
                            </svg>
                        </div>

                        {/* Light card effects */}
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl lg:rounded-2xl" />
                        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl lg:rounded-2xl" />
                        <div className="absolute -inset-1 rounded-xl lg:rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-xl" style={{ backgroundColor: '#10b981' }} />

                        {/* Content */}
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2 lg:mb-3">
                                <div className="p-1.5 rounded-lg transition-transform duration-300 group-hover:scale-110" style={{ backgroundColor: '#10b98115' }}>
                                    <CheckCircle className="w-3.5 h-3.5 transition-colors duration-300" strokeWidth={2} style={{ color: '#10b981' }} />
                                </div>
                                <p className="text-[10px] lg:text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Gagné
                                </p>
                            </div>

                            <div className="flex items-baseline gap-2">
                                <h3 className="text-lg lg:text-xl font-bold tracking-tight text-emerald-600 truncate" title={formatCurrency(stats.wonAmount, userCurrency)}>
                                    {formatCurrency(stats.wonAmount, userCurrency)}
                                </h3>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Montant pondéré */}
                <div className="group relative overflow-hidden">
                    <div className="relative rounded-xl lg:rounded-2xl p-4 lg:p-5 border transition-all duration-300 hover:-translate-y-0.5 overflow-hidden bg-white border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)]">
                        {/* Waves background */}
                        <div className="absolute inset-0 opacity-30 overflow-hidden">
                            <svg className="w-full h-full" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                                <path d="M0,100 Q25,80 50,100 T100,100 Q125,120 150,100 T200,100 L200,200 L0,200 Z" fill="#f59e0b" opacity="0.2" />
                                <path d="M0,120 Q25,100 50,120 T100,120 Q125,140 150,120 T200,120 L200,200 L0,200 Z" fill="#f59e0b" opacity="0.16" />
                            </svg>
                        </div>

                        {/* Light card effects */}
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-amber-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl lg:rounded-2xl" />
                        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl lg:rounded-2xl" />
                        <div className="absolute -inset-1 rounded-xl lg:rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-xl" style={{ backgroundColor: '#f59e0b' }} />

                        {/* Content */}
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2 lg:mb-3">
                                <div className="p-1.5 rounded-lg transition-transform duration-300 group-hover:scale-110" style={{ backgroundColor: '#f59e0b15' }}>
                                    <TrendingUp className="w-3.5 h-3.5 transition-colors duration-300" strokeWidth={2} style={{ color: '#f59e0b' }} />
                                </div>
                                <p className="text-[10px] lg:text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Pondéré
                                </p>
                            </div>

                            <div className="flex items-baseline gap-2">
                                <h3 className="text-lg lg:text-xl font-bold tracking-tight text-gray-900 truncate" title={formatCurrency(stats.weightedAmount, userCurrency)}>
                                    {formatCurrency(stats.weightedAmount, userCurrency)}
                                </h3>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pipeline visuel */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6 lg:p-8">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Pipeline commercial</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="text-center">
                        <div className="h-3 bg-blue-100 rounded-full mb-3 overflow-hidden">
                            <div
                                className="h-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                                style={{ width: stats.total > 0 ? `${(stats.prospect / stats.total) * 100}%` : '0%' }}
                            />
                        </div>
                        <p className="text-2xl font-bold text-gray-900 mb-1">{stats.prospect}</p>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Prospects</p>
                    </div>
                    <div className="text-center">
                        <div className="h-3 bg-amber-100 rounded-full mb-3 overflow-hidden">
                            <div
                                className="h-3 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-500"
                                style={{ width: stats.total > 0 ? `${(stats.negotiation / stats.total) * 100}%` : '0%' }}
                            />
                        </div>
                        <p className="text-2xl font-bold text-gray-900 mb-1">{stats.negotiation}</p>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Négociation</p>
                    </div>
                    <div className="text-center">
                        <div className="h-3 bg-emerald-100 rounded-full mb-3 overflow-hidden">
                            <div
                                className="h-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-500"
                                style={{ width: stats.total > 0 ? `${(stats.won / stats.total) * 100}%` : '0%' }}
                            />
                        </div>
                        <p className="text-2xl font-bold text-gray-900 mb-1">{stats.won}</p>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Gagnés</p>
                    </div>
                    <div className="text-center">
                        <div className="h-3 bg-red-100 rounded-full mb-3 overflow-hidden">
                            <div
                                className="h-3 bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all duration-500"
                                style={{ width: stats.total > 0 ? `${(stats.lost / stats.total) * 100}%` : '0%' }}
                            />
                        </div>
                        <p className="text-2xl font-bold text-gray-900 mb-1">{stats.lost}</p>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Perdus</p>
                    </div>
                </div>
            </div>

            {/* Recherche et filtres épurés */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Rechercher une opportunité..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 bg-gray-50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all text-gray-900 placeholder-gray-400"
                        />
                    </div>

                    <div className="flex gap-3">
                        <div className="relative">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
                                className="appearance-none pl-4 pr-10 py-4 bg-gray-50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all cursor-pointer text-gray-900 font-medium"
                            >
                                <option value="all">Tous les statuts</option>
                                <option value="prospect">Prospects</option>
                                <option value="negotiation">Négociation</option>
                                <option value="won">Gagnés</option>
                                <option value="lost">Perdus</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        </div>

                        <div className="relative">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as SortOption)}
                                className="appearance-none pl-4 pr-10 py-4 bg-gray-50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all cursor-pointer text-gray-900 font-medium"
                            >
                                <option value="date_desc">Plus récent</option>
                                <option value="date_asc">Plus ancien</option>
                                <option value="amount_desc">Montant ↓</option>
                                <option value="amount_asc">Montant ↑</option>
                                <option value="probability_desc">Probabilité ↓</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Liste des opportunités */}
            {loading ? (
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="bg-white rounded-3xl border border-gray-200 p-6 animate-pulse">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gray-200" />
                                <div className="flex-1">
                                    <div className="h-5 bg-gray-200 rounded w-1/3 mb-2" />
                                    <div className="h-4 bg-gray-200 rounded w-1/4" />
                                </div>
                                <div className="h-8 bg-gray-200 rounded w-24" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredOpportunities.length === 0 ? (
                <div className="bg-white rounded-3xl border border-gray-200 p-16 text-center">
                    <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <Target className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                        {searchQuery || statusFilter !== 'all'
                            ? 'Aucune opportunité trouvée'
                            : 'Aucune opportunité'}
                    </h3>
                    <p className="text-gray-500 mb-8 max-w-md mx-auto text-lg">
                        {searchQuery || statusFilter !== 'all'
                            ? 'Modifiez vos filtres pour voir plus de résultats.'
                            : 'Commencez à suivre vos opportunités commerciales pour mieux piloter votre activité.'}
                    </p>
                    {!searchQuery && statusFilter === 'all' && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#0E3A5D] to-[#1e5a8e] text-white rounded-full hover:from-[#0E3A5D]-800 hover:to-[#1e5a8e]-700 transition-all font-semibold shadow-2xl"
                        >
                            <Plus className="w-5 h-5" />
                            Créer votre première opportunité
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredOpportunities.map((opportunity) => {
                        const statusConfig = getStatusConfig(opportunity.status);
                        const StatusIcon = statusConfig.icon;

                        return (
                            <div
                                key={opportunity.id}
                                className="bg-white rounded-3xl border border-gray-200 p-6 hover:border-gray-900 hover:shadow-2xl transition-all duration-300 group cursor-pointer"
                                onClick={() => setSelectedOpportunity(opportunity)}
                            >
                                <div className="flex items-start gap-4">
                                    {/* Avatar contact */}
                                    <button
                                        onClick={() => opportunity.contact && onContactSelect?.(opportunity.contact.id)}
                                        className="flex-shrink-0"
                                    >
                                        {opportunity.contact?.avatar_url ? (
                                            <img
                                                src={opportunity.contact.avatar_url}
                                                alt={opportunity.contact.full_name}
                                                className="w-12 h-12 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0E3A5D] to-[#1e5a8e] flex items-center justify-center">
                                                <span className="text-white text-sm font-semibold">
                                                    {getInitials(opportunity.contact)}
                                                </span>
                                            </div>
                                        )}
                                    </button>

                                    {/* Infos principales */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <h4 className="font-semibold text-gray-900 truncate">{opportunity.title}</h4>
                                                <button
                                                    onClick={() => opportunity.contact && onContactSelect?.(opportunity.contact.id)}
                                                    className="text-sm text-gray-500 hover:text-[#0E3A5D] transition-colors"
                                                >
                                                    {opportunity.contact?.full_name}
                                                    {opportunity.contact?.company && (
                                                        <span className="text-gray-400"> • {opportunity.contact.company}</span>
                                                    )}
                                                </button>
                                            </div>

                                            {/* Montant */}
                                            <div className="text-right flex-shrink-0">
                                                <ConvertedAmount
                                                    opportunityId={opportunity.id}
                                                    amount={opportunity.amount}
                                                    currency={opportunity.currency}
                                                    userCurrency={userCurrency}
                                                />
                                                {opportunity.currency && opportunity.currency !== userCurrency && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        ({formatCurrency(opportunity.amount, opportunity.currency)})
                                                    </p>
                                                )}
                                                {opportunity.probability !== null && (
                                                    <div className="flex items-center justify-end gap-1 mt-1">
                                                        <StarRating value={opportunity.probability} readOnly size="sm" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Description */}
                                        {opportunity.description && (
                                            <p className="text-sm text-gray-600 mt-2 line-clamp-2">{opportunity.description}</p>
                                        )}

                                        {/* Meta infos */}
                                        <div className="flex items-center gap-4 mt-3 flex-wrap">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                                                <StatusIcon className="w-3.5 h-3.5" />
                                                {statusConfig.label}
                                            </span>

                                            {opportunity.expected_close_date && (
                                                (() => {
                                                    const closeDate = new Date(opportunity.expected_close_date);
                                                    const today = new Date();
                                                    today.setHours(0, 0, 0, 0);
                                                    const isExpired = closeDate < today && opportunity.status !== 'won' && opportunity.status !== 'lost';

                                                    return (
                                                        <span className={`inline-flex items-center gap-1.5 text-xs ${isExpired ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            Clôture prévue : {new Date(opportunity.expected_close_date).toLocaleDateString('fr-FR')}
                                                            {isExpired && <span className="text-red-600">(Expirée)</span>}
                                                        </span>
                                                    );
                                                })()
                                            )}

                                            <span className="text-xs text-gray-400">
                                                Créé le {new Date(opportunity.created_at).toLocaleDateString('fr-FR')}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="relative flex-shrink-0">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActionMenuId(actionMenuId === opportunity.id ? null : opportunity.id);
                                            }}
                                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            <MoreVertical className="w-5 h-5 text-gray-400" />
                                        </button>

                                        {actionMenuId === opportunity.id && (
                                            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-200 py-2 z-10">
                                                <div className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                    Changer le statut
                                                </div>
                                                {opportunity.status !== 'prospect' && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleStatusChange(opportunity.id, 'prospect');
                                                        }}
                                                        className="w-full px-4 py-2.5 text-left text-sm font-medium text-gray-700 hover:bg-blue-50 transition-colors flex items-center gap-2"
                                                    >
                                                        <Clock className="w-4 h-4 text-blue-600" />
                                                        Marquer comme Prospect
                                                    </button>
                                                )}
                                                {opportunity.status !== 'negotiation' && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleStatusChange(opportunity.id, 'negotiation');
                                                        }}
                                                        className="w-full px-4 py-2.5 text-left text-sm font-medium text-gray-700 hover:bg-amber-50 transition-colors flex items-center gap-2"
                                                    >
                                                        <TrendingUp className="w-4 h-4 text-amber-600" />
                                                        Marquer en Négociation
                                                    </button>
                                                )}
                                                {opportunity.status !== 'won' && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleStatusChange(opportunity.id, 'won');
                                                        }}
                                                        className="w-full px-4 py-2.5 text-left text-sm font-medium text-gray-700 hover:bg-emerald-50 transition-colors flex items-center gap-2"
                                                    >
                                                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                                                        Marquer comme Gagné
                                                    </button>
                                                )}
                                                {opportunity.status !== 'lost' && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleStatusChange(opportunity.id, 'lost');
                                                        }}
                                                        className="w-full px-4 py-2.5 text-left text-sm font-medium text-gray-700 hover:bg-red-50 transition-colors flex items-center gap-2"
                                                    >
                                                        <XCircle className="w-4 h-4 text-red-600" />
                                                        Marquer comme Perdu
                                                    </button>
                                                )}

                                                <div className="border-t border-gray-200 my-2"></div>

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingOpportunity(opportunity);
                                                        setShowAddModal(true);
                                                        setActionMenuId(null);
                                                    }}
                                                    className="w-full px-4 py-2.5 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                    Modifier
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(opportunity.id);
                                                    }}
                                                    className="w-full px-4 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Supprimer
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal d'ajout/modification */}
            {showAddModal && (
                <OpportunityModal
                    opportunity={editingOpportunity}
                    contacts={contacts}
                    onClose={() => {
                        setShowAddModal(false);
                        setEditingOpportunity(null);
                    }}
                    onSaved={() => {
                        fetchOpportunities();
                        refreshOpportunities();
                        setShowAddModal(false);
                        setEditingOpportunity(null);
                    }}
                />
            )}

            {/* Modal de détails */}
            {selectedOpportunity && (
                <OpportunityDetailModal
                    opportunity={selectedOpportunity}
                    onClose={() => setSelectedOpportunity(null)}
                    onEdit={() => {
                        setEditingOpportunity(selectedOpportunity);
                        setShowAddModal(true);
                        setSelectedOpportunity(null);
                    }}
                    onDelete={() => {
                        handleDelete(selectedOpportunity.id);
                        setSelectedOpportunity(null);
                    }}
                    onContactClick={onContactSelect}
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

// Modal pour ajouter/modifier une opportunité
interface OpportunityModalProps {
    opportunity: Opportunity | null;
    contacts: Contact[];
    onClose: () => void;
    onSaved: () => void;
}

function OpportunityModal({ opportunity, contacts, onClose, onSaved }: OpportunityModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        contact_id: opportunity?.contact_id || '',
        title: opportunity?.title || '',
        amount: opportunity?.amount?.toString() || '',
        currency: opportunity?.currency || 'EUR',
        status: opportunity?.status || 'prospect',
        probability: opportunity?.probability || 3, // Note par étoiles de 1 à 5
        expected_close_date: opportunity?.expected_close_date || '',
        description: opportunity?.description || '',
    });

    // Auto-set 1 étoile quand le statut est "perdu"
    const handleStatusChange = (newStatus: 'prospect' | 'negotiation' | 'won' | 'lost') => {
        if (newStatus === 'lost') {
            setFormData({ ...formData, status: newStatus, probability: 1 });
        } else if (newStatus === 'won') {
            setFormData({ ...formData, status: newStatus, probability: 5 });
        } else {
            setFormData({ ...formData, status: newStatus });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Non authentifié');

            const payload = {
                contact_id: formData.contact_id,
                user_id: user.id,
                title: formData.title,
                amount: formData.amount ? parseFloat(formData.amount) : null,
                currency: formData.currency,
                status: formData.status,
                probability: formData.probability, // Note par étoiles (1-5)
                expected_close_date: formData.expected_close_date || null,
                description: formData.description || null,
                updated_at: new Date().toISOString(),
            };

            if (opportunity) {
                const { error } = await supabase
                    .from('contact_opportunities')
                    .update(payload as never)
                    .eq('id', opportunity.id);

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('contact_opportunities')
                    .insert(payload as never);

                if (error) throw error;
            }

            onSaved();
        } catch (error) {
            console.error('Error saving opportunity:', error);
            toast.error('Erreur lors de l\'enregistrement de l\'opportunité');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white rounded-t-3xl z-10">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {opportunity ? 'Modifier l\'opportunité' : 'Nouvelle opportunité'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Contact */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Contact associé * {contacts.length === 0 && <span className="text-amber-600 text-xs">(chargement...)</span>}
                        </label>
                        <select
                            required
                            value={formData.contact_id}
                            onChange={(e) => setFormData({ ...formData, contact_id: e.target.value })}
                            disabled={contacts.length === 0}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D] transition-all disabled:bg-gray-50 disabled:text-gray-400"
                        >
                            <option value="">{contacts.length === 0 ? 'Chargement des contacts...' : 'Sélectionner un contact'}</option>
                            {contacts.length > 0 && contacts.map((contact) => (
                                <option key={contact.id} value={contact.id}>
                                    {contact.full_name} {contact.company ? `(${contact.company})` : ''}
                                </option>
                            ))}
                        </select>
                        {contacts.length === 0 && (
                            <p className="text-xs text-gray-500 mt-2">Aucun contact pour le moment.</p>
                        )}
                    </div>

                    {/* Titre */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Titre de l'opportunité *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Ex: Contrat de service annuel"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D] transition-all"
                        />
                    </div>

                    {/* Montant et devise */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Montant
                            </label>
                            <input
                                type="number"
                                value={formData.amount}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (value === '' || parseFloat(value) <= 9999999999.99) {
                                        setFormData({ ...formData, amount: value });
                                    }
                                }}
                                placeholder="0"
                                min="0"
                                max="9999999999.99"
                                step="0.01"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D] transition-all"
                            />
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
                                {SUPPORTED_CURRENCIES.map((currency) => (
                                    <option key={currency.code} value={currency.code}>
                                        {currency.code}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Statut et notation */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Statut
                            </label>
                            <select
                                value={formData.status}
                                onChange={(e) => handleStatusChange(e.target.value as 'prospect' | 'negotiation' | 'won' | 'lost')}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D] transition-all"
                            >
                                <option value="prospect">Prospect</option>
                                <option value="negotiation">Négociation</option>
                                <option value="won">Gagné</option>
                                <option value="lost">Perdu</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Probabilité de gains
                            </label>
                            <div className="flex items-center h-[50px] px-4 border border-gray-200 rounded-xl bg-white">
                                <StarRating
                                    value={formData.probability}
                                    onChange={(value) => setFormData({ ...formData, probability: value })}
                                    size="lg"
                                />
                            </div>
                            {formData.status === 'lost' && (
                                <p className="text-xs text-amber-600 mt-1">
                                    Probabilité automatiquement définie à 1 étoile (perdu)
                                </p>
                            )}
                            {formData.status === 'won' && (
                                <p className="text-xs text-emerald-600 mt-1">
                                    Probabilité automatiquement définie à 5 étoiles (gagné)
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Date de clôture */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Date de clôture prévue
                        </label>
                        <input
                            type="date"
                            value={formData.expected_close_date}
                            onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })}
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
                            placeholder="Détails de l'opportunité..."
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D] transition-all resize-none"
                        />
                    </div>

                    {/* Boutons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-4 border-2 border-gray-200 rounded-2xl font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !formData.contact_id || !formData.title}
                            className="flex-1 px-6 py-4 rounded-2xl font-semibold text-white bg-gradient-to-r from-[#0E3A5D] to-[#1e5a8e] hover:from-[#0E3A5D]-800 hover:to-[#1e5a8e]-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
                        >
                            {loading ? 'Enregistrement...' : opportunity ? 'Modifier' : 'Créer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
interface OpportunityDetailModalProps {
    opportunity: Opportunity;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onContactClick?: (contactId: string) => void;
}

function OpportunityDetailModal({
    opportunity,
    onClose,
    onEdit,
    onDelete,
    onContactClick
}: OpportunityDetailModalProps) {
    const { profile } = useAuth();
    const { refreshOpportunities } = useKpis();
    const [userCurrency, setUserCurrency] = useState<string>('EUR');

    useEffect(() => {
        if (profile) {
            setUserCurrency((profile as any).preferred_currency || 'EUR');
        }
    }, [profile]);

    const handleQuickStatusChange = async (newStatus: 'prospect' | 'negotiation' | 'won' | 'lost') => {
        try {
            const updateData: any = {
                status: newStatus,
                updated_at: new Date().toISOString()
            };

            if (newStatus === 'lost') {
                updateData.probability = 1;
            } else if (newStatus === 'won') {
                updateData.probability = 5;
            }

            const { error } = await supabase
                .from('contact_opportunities')
                .update(updateData)
                .eq('id', opportunity.id);

            if (error) throw error;

            // Send email if status changed to won
            if (newStatus === 'won') {
                const { data: { user } } = await supabase.auth.getUser();
                if (user?.email) {
                    const { data: prefs } = await getEmailPreferences(user.id);
                    if (!prefs || prefs.opportunity_emails !== false) {
                        const emailResult = await sendOpportunityWonEmail(
                            user.email,
                            opportunity.title,
                            opportunity.amount || 0,
                            opportunity.id
                        );
                        if (emailResult.success) {
                            toast.success('Email de félicitations envoyé !');
                        }
                    }
                }
            }

            refreshOpportunities();
            onClose();
        } catch (error) {
            console.error('Error updating opportunity status:', error);
        }
    };

    const statusConfig = {
        'prospect': { label: 'Prospect', color: 'bg-blue-100 text-blue-700', icon: Clock },
        'negotiation': { label: 'Négociation', color: 'bg-amber-100 text-amber-700', icon: TrendingUp },
        'won': { label: 'Gagné', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
        'lost': { label: 'Perdu', color: 'bg-red-100 text-red-700', icon: XCircle }
    };

    const config = statusConfig[opportunity.status];
    const StatusIcon = config.icon;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="p-4 sm:p-6 lg:p-8 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl sm:rounded-t-3xl z-10">
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 pr-2 line-clamp-2">{opportunity.title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0"
                    >
                        <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
                    </button>
                </div>

                <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
                    {/* En-tête avec contact et montant */}
                    <div className="flex flex-col sm:flex-row items-start gap-4 sm:justify-between">
                        <div className="flex items-start gap-3 sm:gap-4 w-full sm:w-auto">
                            {opportunity.contact?.avatar_url ? (
                                <img
                                    src={opportunity.contact.avatar_url}
                                    alt={opportunity.contact.full_name}
                                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover flex-shrink-0"
                                />
                            ) : (
                                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-[#0E3A5D] to-[#1e5a8e] flex items-center justify-center flex-shrink-0">
                                    <span className="text-white text-base sm:text-lg font-semibold">
                                        {(() => {
                                            const names = opportunity.contact?.full_name?.split(' ') || [];
                                            if (names.length >= 2) {
                                                return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
                                            }
                                            return opportunity.contact?.full_name?.slice(0, 2).toUpperCase() || '??';
                                        })()}
                                    </span>
                                </div>
                            )}
                            <div className="min-w-0 flex-1">
                                <button
                                    onClick={() => opportunity.contact && onContactClick?.(opportunity.contact.id)}
                                    className="text-base sm:text-lg font-semibold text-gray-900 hover:text-[#0E3A5D] transition-colors truncate block w-full text-left"
                                >
                                    {opportunity.contact?.full_name}
                                </button>
                                {opportunity.contact?.company && (
                                    <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate">{opportunity.contact.company}</p>
                                )}
                                {opportunity.contact?.job_title && (
                                    <p className="text-xs sm:text-sm text-gray-500 truncate">{opportunity.contact.job_title}</p>
                                )}
                            </div>
                        </div>

                        <div className="w-full sm:w-auto text-left sm:text-right">
                            <ConvertedAmount
                                opportunityId={opportunity.id}
                                amount={opportunity.amount}
                                currency={opportunity.currency}
                                userCurrency={userCurrency}
                                size="large"
                            />
                            {opportunity.currency && opportunity.currency !== userCurrency && (
                                <p className="text-xs sm:text-sm text-gray-500 mt-2">
                                    Original: {formatCurrency(opportunity.amount, opportunity.currency)}
                                </p>
                            )}
                            {opportunity.probability !== null && (
                                <div className="flex items-center sm:justify-end gap-2 mt-2">
                                    <span className="text-xs sm:text-sm text-gray-500">Probabilité:</span>
                                    <StarRating value={opportunity.probability} readOnly size="md" />
                                </div>
                            )}
                        </div>
                    </div>

                    <hr className="border-gray-200" />

                    {/* Statut et dates */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                        <div>
                            <p className="text-xs sm:text-sm text-gray-500 mb-2">Statut</p>
                            <span className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium ${config.color}`}>
                                <StatusIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                                {config.label}
                            </span>
                        </div>
                        {opportunity.expected_close_date && (
                            <div>
                                <p className="text-xs sm:text-sm text-gray-500 mb-2">Clôture prévue</p>
                                {(() => {
                                    const closeDate = new Date(opportunity.expected_close_date);
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    const isExpired = closeDate < today && opportunity.status !== 'won' && opportunity.status !== 'lost';

                                    return (
                                        <div>
                                            <p className={`text-xs sm:text-sm font-medium ${isExpired ? 'text-red-600' : 'text-gray-900'}`}>
                                                {new Date(opportunity.expected_close_date).toLocaleDateString('fr-FR')}
                                            </p>
                                            {isExpired && (
                                                <p className="text-xs text-red-600 font-semibold mt-1">
                                                    Date de clôture dépassée
                                                </p>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                        <div>
                            <p className="text-xs sm:text-sm text-gray-500 mb-2">Créée le</p>
                            <p className="text-xs sm:text-sm font-medium text-gray-900">
                                {new Date(opportunity.created_at).toLocaleDateString('fr-FR')}
                            </p>
                        </div>
                    </div>

                    {opportunity.description && (
                        <>
                            <hr className="border-gray-200" />
                            <div>
                                <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-3">Description</h3>
                                <div className="bg-gray-50 rounded-lg p-3 sm:p-4 max-h-60 overflow-y-auto">
                                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">{opportunity.description}</p>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Informations de contact */}
                    {opportunity.contact && (
                        <>
                            <hr className="border-gray-200" />
                            <div>
                                <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-4">Coordonnées</h3>
                                <div className="space-y-3">
                                    {opportunity.contact.email && (
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                                            <span className="text-xs sm:text-sm text-gray-500 sm:w-20 font-medium sm:font-normal">Email:</span>
                                            <a
                                                href={`mailto:${opportunity.contact.email}`}
                                                className="text-xs sm:text-sm text-[#0E3A5D] hover:underline break-all"
                                            >
                                                {opportunity.contact.email}
                                            </a>
                                        </div>
                                    )}
                                    {opportunity.contact.phone && (
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                                            <span className="text-xs sm:text-sm text-gray-500 sm:w-20 font-medium sm:font-normal">Téléphone:</span>
                                            <a
                                                href={`tel:${opportunity.contact.phone}`}
                                                className="text-xs sm:text-sm text-[#0E3A5D] hover:underline"
                                            >
                                                {opportunity.contact.phone}
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Actions rapides de statut */}
                    <hr className="border-gray-200" />
                    <div>
                        <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-4">Actions rapides</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                            {opportunity.status !== 'prospect' && (
                                <button
                                    onClick={() => handleQuickStatusChange('prospect')}
                                    className="px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-blue-200 bg-blue-50 text-blue-700 rounded-xl sm:rounded-2xl font-semibold hover:bg-blue-100 hover:border-blue-300 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm"
                                >
                                    <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                                    <span className="truncate">Marquer Prospect</span>
                                </button>
                            )}
                            {opportunity.status !== 'negotiation' && (
                                <button
                                    onClick={() => handleQuickStatusChange('negotiation')}
                                    className="px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-amber-200 bg-amber-50 text-amber-700 rounded-xl sm:rounded-2xl font-semibold hover:bg-amber-100 hover:border-amber-300 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm"
                                >
                                    <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                                    <span className="truncate">Marquer Négociation</span>
                                </button>
                            )}
                            {opportunity.status !== 'won' && (
                                <button
                                    onClick={() => handleQuickStatusChange('won')}
                                    className="px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-emerald-200 bg-emerald-50 text-emerald-700 rounded-xl sm:rounded-2xl font-semibold hover:bg-emerald-100 hover:border-emerald-300 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm"
                                >
                                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                    <span className="truncate">Marquer Gagné</span>
                                </button>
                            )}
                            {opportunity.status !== 'lost' && (
                                <button
                                    onClick={() => handleQuickStatusChange('lost')}
                                    className="px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-red-200 bg-red-50 text-red-700 rounded-xl sm:rounded-2xl font-semibold hover:bg-red-100 hover:border-red-300 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm"
                                >
                                    <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                    <span className="truncate">Marquer Perdu</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Boutons d'action */}
                    <hr className="border-gray-200" />
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <button
                            onClick={onClose}
                            className="w-full sm:flex-1 px-4 sm:px-6 py-3 sm:py-4 border-2 border-gray-200 rounded-xl sm:rounded-2xl font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all text-sm sm:text-base"
                        >
                            Fermer
                        </button>
                        <button
                            onClick={onEdit}
                            className="w-full sm:flex-1 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold text-white transition-all hover:shadow-lg flex items-center justify-center gap-2 bg-gradient-to-r from-[#0E3A5D] to-[#1e5a8e] hover:from-[#0E3A5D]-800 hover:to-[#1e5a8e]-700 text-sm sm:text-base"
                        >
                            <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                            Modifier
                        </button>
                        <button
                            onClick={() => {
                                if (confirm('Êtes-vous sûr de vouloir supprimer cette opportunité ?')) {
                                    onDelete();
                                }
                            }}
                            className="w-full sm:flex-1 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 transition-all hover:shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base"
                        >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            Supprimer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}