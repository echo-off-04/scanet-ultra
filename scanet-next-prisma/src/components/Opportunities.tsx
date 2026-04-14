'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Target, Plus, Search, TrendingUp,
    DollarSign, Calendar, Edit, Trash2, MoreVertical, X,
    ChevronDown, CheckCircle, XCircle, Clock, Star
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useKpis } from '@/contexts/KpiContext';
import { formatCurrency, convertCurrency, convertAllToBaseCurrency, SUPPORTED_CURRENCIES } from '@/lib/currency';
import { sendOpportunityWonEmail, getEmailPreferences } from '@/lib/emailService';

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

    const formattedAmount = formatCurrency(convertedAmount ?? 0, userCurrency);

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

            const res = await fetch('/api/opportunities?notStatus=won,lost&hasCloseDate=true');
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();

            const expiredOpportunities = (data || []).filter((opp: any) => {
                if (!opp.expected_close_date) return false;
                const closeDate = new Date(opp.expected_close_date);
                return closeDate < today;
            });

            for (const opp of expiredOpportunities) {
                await fetch(`/api/opportunities/${opp.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        status: 'lost',
                        probability: 1,
                    }),
                });
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
            await checkExpiredOpportunities();

            const params = new URLSearchParams();
            if (statusFilter !== 'all') params.append('status', statusFilter);
            params.append('sort', sortBy);
            params.append('includeContact', 'true');

            const res = await fetch(`/api/opportunities?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch opportunities');
            const data = await res.json();

            setOpportunities((data || []) as Opportunity[]);
        } catch (error) {
            console.error('Error fetching opportunities:', error);
        } finally {
            setLoading(false);
        }
    }, [statusFilter, sortBy, checkExpiredOpportunities]);

    const fetchContacts = useCallback(async () => {
        try {
            const res = await fetch('/api/contacts?sort=full_name');
            if (!res.ok) throw new Error('Failed to fetch contacts');
            const data = await res.json();
            setContacts((data.contacts || data || []) as Contact[]);
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
    }, [statusFilter, sortBy, fetchOpportunities]);

    useEffect(() => {
        fetchContacts();
    }, [fetchContacts]);

    useEffect(() => {
        calculateConvertedStats();
    }, [opportunities, userCurrency]);

    const handleDelete = async (opportunityId: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette opportunité ?')) return;

        try {
            const res = await fetch(`/api/opportunities/${opportunityId}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to delete');
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
            };

            if (newStatus === 'lost') {
                updateData.probability = 1;
            } else if (newStatus === 'won') {
                updateData.probability = 5;
            }

            const res = await fetch(`/api/opportunities/${opportunityId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData),
            });
            if (!res.ok) throw new Error('Failed to update status');

            // Send email if status changed to won
            if (newStatus === 'won') {
                const opportunity = opportunities.find(o => o.id === opportunityId);
                if (opportunity && profile?.email) {
                    const prefs = await getEmailPreferences(profile.id);
                    if (!prefs || (prefs as any).opportunity_emails !== false) {
                        const emailResult = await sendOpportunityWonEmail(
                            profile.id,
                            profile.email,
                            profile.full_name || profile.email,
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

        const allItems = opportunities.map(o => ({ amount: o.amount, currency: o.currency }));
        const totalAmount = await convertAllToBaseCurrency(allItems, userCurrency);

        const wonItems = opportunities.filter(o => o.status === 'won').map(o => ({ amount: o.amount, currency: o.currency }));
        const wonAmount = await convertAllToBaseCurrency(wonItems, userCurrency);

        let weightedAmount = 0;
        for (const opp of opportunities.filter(o => o.status !== 'lost')) {
            const converted = await convertCurrency(opp.amount || 0, opp.currency || 'EUR', userCurrency);
            if (converted !== null) {
                weightedAmount += converted * ((opp.probability || 3) * 20) / 100;
            }
        }

        setConvertedStats({ totalAmount, wonAmount, weightedAmount });
    };

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

            {/* Stats en grille moderne */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                {/* Total Opportunities - Dark card */}
                <div className="group relative overflow-hidden">
                    <div className="relative rounded-xl lg:rounded-2xl p-4 lg:p-5 border transition-all duration-300 hover:-translate-y-0.5 overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700/50 shadow-[0_4px_16px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
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
                                    <Target className="w-3.5 h-3.5 transition-colors duration-300 text-white/90" strokeWidth={2} />
                                </div>
                                <p className="text-[10px] lg:text-xs font-medium uppercase tracking-wider text-white/70">Total</p>
                            </div>
                            <p className="text-2xl lg:text-3xl font-bold text-white">{stats.total}</p>
                        </div>
                    </div>
                </div>

                {/* Montant total */}
                <div className="group relative overflow-hidden">
                    <div className="relative rounded-xl lg:rounded-2xl p-4 lg:p-5 border transition-all duration-300 hover:-translate-y-0.5 overflow-hidden bg-white border-gray-200/80 shadow-sm hover:shadow-md">
                        <div className="absolute inset-0 opacity-30 overflow-hidden">
                            <svg className="w-full h-full" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                                <path d="M0,100 Q25,80 50,100 T100,100 Q125,120 150,100 T200,100 L200,200 L0,200 Z" fill="#3B82F6" opacity="0.15" />
                                <path d="M0,120 Q25,100 50,120 T100,120 Q125,140 150,120 T200,120 L200,200 L0,200 Z" fill="#3B82F6" opacity="0.1" />
                            </svg>
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2 lg:mb-3">
                                <div className="p-1.5 rounded-lg transition-transform duration-300 group-hover:scale-110 bg-blue-50">
                                    <DollarSign className="w-3.5 h-3.5 transition-colors duration-300 text-blue-600" strokeWidth={2} />
                                </div>
                                <p className="text-[10px] lg:text-xs font-medium uppercase tracking-wider text-gray-500">Pipeline</p>
                            </div>
                            <p className="text-lg lg:text-xl font-bold text-gray-900 truncate" title={formatCurrency(stats.totalAmount, userCurrency)}>
                                {formatCurrency(stats.totalAmount, userCurrency)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Gagné */}
                <div className="group relative overflow-hidden">
                    <div className="relative rounded-xl lg:rounded-2xl p-4 lg:p-5 border transition-all duration-300 hover:-translate-y-0.5 overflow-hidden bg-white border-gray-200/80 shadow-sm hover:shadow-md">
                        <div className="absolute inset-0 opacity-30 overflow-hidden">
                            <svg className="w-full h-full" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                                <path d="M0,100 Q25,80 50,100 T100,100 Q125,120 150,100 T200,100 L200,200 L0,200 Z" fill="#10B981" opacity="0.15" />
                                <path d="M0,120 Q25,100 50,120 T100,120 Q125,140 150,120 T200,120 L200,200 L0,200 Z" fill="#10B981" opacity="0.1" />
                            </svg>
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2 lg:mb-3">
                                <div className="p-1.5 rounded-lg transition-transform duration-300 group-hover:scale-110 bg-emerald-50">
                                    <CheckCircle className="w-3.5 h-3.5 transition-colors duration-300 text-emerald-600" strokeWidth={2} />
                                </div>
                                <p className="text-[10px] lg:text-xs font-medium uppercase tracking-wider text-gray-500">Gagné</p>
                            </div>
                            <p className="text-lg lg:text-xl font-bold text-gray-900 truncate" title={formatCurrency(stats.wonAmount, userCurrency)}>
                                {formatCurrency(stats.wonAmount, userCurrency)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Pondéré */}
                <div className="group relative overflow-hidden">
                    <div className="relative rounded-xl lg:rounded-2xl p-4 lg:p-5 border transition-all duration-300 hover:-translate-y-0.5 overflow-hidden bg-white border-gray-200/80 shadow-sm hover:shadow-md">
                        <div className="absolute inset-0 opacity-30 overflow-hidden">
                            <svg className="w-full h-full" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                                <path d="M0,100 Q25,80 50,100 T100,100 Q125,120 150,100 T200,100 L200,200 L0,200 Z" fill="#F59E0B" opacity="0.15" />
                                <path d="M0,120 Q25,100 50,120 T100,120 Q125,140 150,120 T200,120 L200,200 L0,200 Z" fill="#F59E0B" opacity="0.1" />
                            </svg>
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2 lg:mb-3">
                                <div className="p-1.5 rounded-lg transition-transform duration-300 group-hover:scale-110 bg-amber-50">
                                    <TrendingUp className="w-3.5 h-3.5 transition-colors duration-300 text-amber-600" strokeWidth={2} />
                                </div>
                                <p className="text-[10px] lg:text-xs font-medium uppercase tracking-wider text-gray-500">Pondéré</p>
                            </div>
                            <p className="text-lg lg:text-xl font-bold text-gray-900 truncate" title={formatCurrency(stats.weightedAmount, userCurrency)}>
                                {formatCurrency(stats.weightedAmount, userCurrency)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pipeline visuel */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-4 lg:p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Pipeline</h3>
                <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-gray-100">
                    {stats.total > 0 && (
                        <>
                            {stats.prospect > 0 && (
                                <div
                                    className="bg-blue-400 transition-all duration-500"
                                    style={{ width: `${(stats.prospect / stats.total) * 100}%` }}
                                    title={`Prospect: ${stats.prospect}`}
                                />
                            )}
                            {stats.negotiation > 0 && (
                                <div
                                    className="bg-amber-400 transition-all duration-500"
                                    style={{ width: `${(stats.negotiation / stats.total) * 100}%` }}
                                    title={`Négociation: ${stats.negotiation}`}
                                />
                            )}
                            {stats.won > 0 && (
                                <div
                                    className="bg-emerald-400 transition-all duration-500"
                                    style={{ width: `${(stats.won / stats.total) * 100}%` }}
                                    title={`Gagné: ${stats.won}`}
                                />
                            )}
                            {stats.lost > 0 && (
                                <div
                                    className="bg-red-400 transition-all duration-500"
                                    style={{ width: `${(stats.lost / stats.total) * 100}%` }}
                                    title={`Perdu: ${stats.lost}`}
                                />
                            )}
                        </>
                    )}
                </div>
                <div className="flex flex-wrap gap-4 mt-3">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                        Prospect ({stats.prospect})
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        Négociation ({stats.negotiation})
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                        Gagné ({stats.won})
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                        Perdu ({stats.lost})
                    </div>
                </div>
            </div>

            {/* Recherche et filtres */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Rechercher une opportunité..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 text-sm bg-white"
                    />
                </div>

                <div className="flex gap-2">
                    <div className="relative">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
                            className="appearance-none pl-4 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 text-sm bg-white cursor-pointer"
                        >
                            <option value="all">Tous les statuts</option>
                            <option value="prospect">Prospect</option>
                            <option value="negotiation">Négociation</option>
                            <option value="won">Gagné</option>
                            <option value="lost">Perdu</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>

                    <div className="relative">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                            className="appearance-none pl-4 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 text-sm bg-white cursor-pointer"
                        >
                            <option value="date_desc">Plus récent</option>
                            <option value="date_asc">Plus ancien</option>
                            <option value="amount_desc">Montant ↓</option>
                            <option value="amount_asc">Montant ↑</option>
                            <option value="probability_desc">Probabilité ↓</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Liste des opportunités */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-200/80 p-5 animate-pulse">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-gray-200" />
                                <div className="flex-1">
                                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                                </div>
                            </div>
                            <div className="h-6 bg-gray-200 rounded w-1/3 mb-3" />
                            <div className="h-3 bg-gray-200 rounded w-full" />
                        </div>
                    ))}
                </div>
            ) : filteredOpportunities.length === 0 ? (
                <div className="text-center py-20">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Target className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Aucune opportunité</h3>
                    <p className="text-gray-500 mb-6">
                        {searchQuery ? 'Aucun résultat pour votre recherche' : 'Commencez à créer des opportunités pour suivre vos ventes'}
                    </p>
                    {!searchQuery && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-6 py-3 bg-gradient-to-r from-[#0E3A5D] to-[#1e5a8e] text-white rounded-full font-semibold hover:shadow-lg transition-all"
                        >
                            Créer une opportunité
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredOpportunities.map((opp) => {
                        const statusConfig = getStatusConfig(opp.status);
                        const StatusIcon = statusConfig.icon;

                        return (
                            <div
                                key={opp.id}
                                className="group bg-white rounded-2xl border border-gray-200/80 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer relative"
                                onClick={() => setSelectedOpportunity(opp)}
                            >
                                {/* Contact info */}
                                <div className="flex items-center justify-between mb-4">
                                    <div
                                        className="flex items-center gap-3 cursor-pointer hover:opacity-80"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (opp.contact && onContactSelect) {
                                                onContactSelect(opp.contact.id);
                                            }
                                        }}
                                    >
                                        {opp.contact?.avatar_url ? (
                                            <img
                                                src={opp.contact.avatar_url}
                                                alt={opp.contact.full_name}
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
                                                {getInitials(opp.contact)}
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-medium text-gray-900 text-sm">{opp.contact?.full_name || 'Contact inconnu'}</p>
                                            {opp.contact?.company && (
                                                <p className="text-xs text-gray-500">{opp.contact.company}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action menu */}
                                    <div className="relative">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActionMenuId(actionMenuId === opp.id ? null : opp.id);
                                            }}
                                            className="p-1.5 rounded-lg hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <MoreVertical className="w-4 h-4 text-gray-400" />
                                        </button>

                                        {actionMenuId === opp.id && (
                                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingOpportunity(opp);
                                                        setShowAddModal(true);
                                                        setActionMenuId(null);
                                                    }}
                                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                >
                                                    <Edit className="w-4 h-4" /> Modifier
                                                </button>
                                                {opp.status !== 'won' && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleStatusChange(opp.id, 'won');
                                                        }}
                                                        className="w-full px-4 py-2 text-left text-sm text-emerald-600 hover:bg-emerald-50 flex items-center gap-2"
                                                    >
                                                        <CheckCircle className="w-4 h-4" /> Marquer gagné
                                                    </button>
                                                )}
                                                {opp.status !== 'lost' && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleStatusChange(opp.id, 'lost');
                                                        }}
                                                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                    >
                                                        <XCircle className="w-4 h-4" /> Marquer perdu
                                                    </button>
                                                )}
                                                <hr className="my-1" />
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(opp.id);
                                                    }}
                                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                >
                                                    <Trash2 className="w-4 h-4" /> Supprimer
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Title */}
                                <h3 className="font-semibold text-gray-900 mb-2">{opp.title}</h3>

                                {/* Amount */}
                                {opp.amount !== null && (
                                    <ConvertedAmount
                                        opportunityId={opp.id}
                                        amount={opp.amount}
                                        currency={opp.currency}
                                        userCurrency={userCurrency}
                                    />
                                )}

                                {/* Status & Probability */}
                                <div className="flex items-center justify-between mt-3">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                                        <StatusIcon className="w-3.5 h-3.5" />
                                        {statusConfig.label}
                                    </span>
                                    <StarRating value={Math.round((opp.probability || 0) / 20)} readOnly size="sm" />
                                </div>

                                {/* Close date */}
                                {opp.expected_close_date && (
                                    <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-500">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {new Date(opp.expected_close_date).toLocaleDateString('fr-FR')}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add/Edit Modal */}
            {showAddModal && (
                <OpportunityModal
                    opportunity={editingOpportunity}
                    contacts={contacts}
                    userCurrency={userCurrency}
                    onClose={() => {
                        setShowAddModal(false);
                        setEditingOpportunity(null);
                    }}
                    onSuccess={() => {
                        setShowAddModal(false);
                        setEditingOpportunity(null);
                        fetchOpportunities();
                        refreshOpportunities();
                    }}
                />
            )}

            {/* Detail Modal */}
            {selectedOpportunity && (
                <OpportunityDetailModal
                    opportunity={selectedOpportunity}
                    userCurrency={userCurrency}
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
                    onStatusChange={(status) => {
                        handleStatusChange(selectedOpportunity.id, status);
                        setSelectedOpportunity(null);
                    }}
                    onContactSelect={onContactSelect}
                />
            )}
        </div>
    );
}

// OpportunityModal
function OpportunityModal({
    opportunity,
    contacts,
    userCurrency,
    onClose,
    onSuccess,
}: {
    opportunity: Opportunity | null;
    contacts: Contact[];
    userCurrency: string;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [contactId, setContactId] = useState(opportunity?.contact_id || '');
    const [title, setTitle] = useState(opportunity?.title || '');
    const [amount, setAmount] = useState(opportunity?.amount?.toString() || '');
    const [currency, setCurrency] = useState(opportunity?.currency || userCurrency);
    const [status, setStatus] = useState<'prospect' | 'negotiation' | 'won' | 'lost'>(opportunity?.status || 'prospect');
    const [probability, setProbability] = useState(Math.round((opportunity?.probability || 60) / 20));
    const [expectedCloseDate, setExpectedCloseDate] = useState(opportunity?.expected_close_date || '');
    const [description, setDescription] = useState(opportunity?.description || '');
    const [loading, setLoading] = useState(false);
    const [contactSearch, setContactSearch] = useState('');

    const filteredContacts = contacts.filter(c =>
        c.full_name?.toLowerCase().includes(contactSearch.toLowerCase()) ||
        c.company?.toLowerCase().includes(contactSearch.toLowerCase())
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!contactId || !title) {
            toast.error('Veuillez sélectionner un contact et entrer un titre');
            return;
        }

        try {
            setLoading(true);
            const probabilityPercent = probability * 20;

            const body = {
                contact_id: contactId,
                title,
                amount: amount ? parseFloat(amount) : null,
                currency,
                status,
                probability: probabilityPercent,
                expected_close_date: expectedCloseDate || null,
                description: description || null,
            };

            if (opportunity) {
                const res = await fetch(`/api/opportunities/${opportunity.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                });
                if (!res.ok) throw new Error('Failed to update');
                toast.success('Opportunité mise à jour');
            } else {
                const res = await fetch('/api/opportunities', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                });
                if (!res.ok) throw new Error('Failed to create');
                toast.success('Opportunité créée');
            }

            onSuccess();
        } catch (error) {
            console.error('Error saving opportunity:', error);
            toast.error('Erreur lors de l\'enregistrement');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900">
                            {opportunity ? 'Modifier l\'opportunité' : 'Nouvelle opportunité'}
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Contact selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact *</label>
                        <input
                            type="text"
                            placeholder="Rechercher un contact..."
                            value={contactSearch}
                            onChange={(e) => setContactSearch(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 mb-2"
                        />
                        <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-xl">
                            {filteredContacts.map((c) => (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => {
                                        setContactId(c.id);
                                        setContactSearch(c.full_name);
                                    }}
                                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 ${contactId === c.id ? 'bg-blue-50 text-blue-700' : ''
                                        }`}
                                >
                                    {c.avatar_url ? (
                                        <img src={c.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                                            {c.full_name?.[0]}
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-medium">{c.full_name}</p>
                                        {c.company && <p className="text-xs text-gray-500">{c.company}</p>}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                            placeholder="Projet..."
                            required
                        />
                    </div>

                    {/* Amount & Currency */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Montant</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                                placeholder="10000"
                                step="0.01"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Devise</label>
                            <select
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                            >
                                {SUPPORTED_CURRENCIES.map((c) => (
                                    <option key={c.code} value={c.code}>
                                        {c.code} ({c.symbol})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Status & Probability */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value as any)}
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                            >
                                <option value="prospect">Prospect</option>
                                <option value="negotiation">Négociation</option>
                                <option value="won">Gagné</option>
                                <option value="lost">Perdu</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date de clôture</label>
                            <input
                                type="date"
                                value={expectedCloseDate}
                                onChange={(e) => setExpectedCloseDate(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                            />
                        </div>
                    </div>

                    {/* Star Rating */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Probabilité</label>
                        <StarRating value={probability} onChange={setProbability} size="lg" />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 resize-none"
                            rows={3}
                            placeholder="Détails supplémentaires..."
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3 bg-gradient-to-r from-[#0E3A5D] to-[#1e5a8e] text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                        >
                            {loading ? 'Enregistrement...' : (opportunity ? 'Modifier' : 'Créer')}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                        >
                            Annuler
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// OpportunityDetailModal
function OpportunityDetailModal({
    opportunity,
    userCurrency,
    onClose,
    onEdit,
    onDelete,
    onStatusChange,
    onContactSelect,
}: {
    opportunity: Opportunity;
    userCurrency: string;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onStatusChange: (status: 'prospect' | 'negotiation' | 'won' | 'lost') => void;
    onContactSelect?: (contactId: string) => void;
}) {
    const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
        prospect: { label: 'Prospect', color: 'text-blue-700', bg: 'bg-blue-100' },
        negotiation: { label: 'Négociation', color: 'text-amber-700', bg: 'bg-amber-100' },
        won: { label: 'Gagné', color: 'text-emerald-700', bg: 'bg-emerald-100' },
        lost: { label: 'Perdu', color: 'text-red-700', bg: 'bg-red-100' },
    };

    const currentStatus = statusConfig[opportunity.status] || statusConfig.prospect;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${currentStatus.bg} ${currentStatus.color}`}>
                            {currentStatus.label}
                        </span>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">{opportunity.title}</h2>

                    {/* Contact */}
                    {opportunity.contact && (
                        <div
                            className="flex items-center gap-3 mb-6 cursor-pointer hover:opacity-80"
                            onClick={() => {
                                if (onContactSelect) {
                                    onContactSelect(opportunity.contact!.id);
                                    onClose();
                                }
                            }}
                        >
                            {opportunity.contact.avatar_url ? (
                                <img
                                    src={opportunity.contact.avatar_url}
                                    alt={opportunity.contact.full_name}
                                    className="w-12 h-12 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                                    {opportunity.contact.full_name?.[0]?.toUpperCase()}
                                </div>
                            )}
                            <div>
                                <p className="font-medium text-gray-900">{opportunity.contact.full_name}</p>
                                {opportunity.contact.company && (
                                    <p className="text-sm text-gray-500">{opportunity.contact.company}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Amount */}
                    {opportunity.amount !== null && (
                        <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                            <p className="text-sm text-gray-500 mb-1">Montant</p>
                            <ConvertedAmount
                                opportunityId={opportunity.id}
                                amount={opportunity.amount}
                                currency={opportunity.currency}
                                userCurrency={userCurrency}
                                size="large"
                            />
                        </div>
                    )}

                    {/* Details */}
                    <div className="space-y-3 mb-6">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Probabilité</span>
                            <StarRating value={Math.round((opportunity.probability || 0) / 20)} readOnly size="sm" />
                        </div>
                        {opportunity.expected_close_date && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">Date de clôture</span>
                                <span className="text-gray-900 font-medium">
                                    {new Date(opportunity.expected_close_date).toLocaleDateString('fr-FR')}
                                </span>
                            </div>
                        )}
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Créé le</span>
                            <span className="text-gray-900">
                                {new Date(opportunity.created_at).toLocaleDateString('fr-FR')}
                            </span>
                        </div>
                    </div>

                    {/* Description */}
                    {opportunity.description && (
                        <div className="mb-6">
                            <p className="text-sm text-gray-500 mb-1">Description</p>
                            <p className="text-sm text-gray-700">{opportunity.description}</p>
                        </div>
                    )}

                    {/* Quick status change */}
                    <div className="mb-6">
                        <p className="text-sm text-gray-500 mb-2">Changer le statut</p>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(statusConfig).map(([key, config]) => (
                                <button
                                    key={key}
                                    onClick={() => onStatusChange(key as any)}
                                    disabled={key === opportunity.status}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${key === opportunity.status
                                        ? `${config.bg} ${config.color} opacity-50 cursor-not-allowed`
                                        : `${config.bg} ${config.color} hover:opacity-80`
                                        }`}
                                >
                                    {config.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={onEdit}
                            className="flex-1 py-3 bg-gradient-to-r from-[#0E3A5D] to-[#1e5a8e] text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                            <Edit className="w-4 h-4" /> Modifier
                        </button>
                        <button
                            onClick={onDelete}
                            className="px-4 py-3 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-all flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
