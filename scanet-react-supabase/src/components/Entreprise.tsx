import { useState, useEffect, useCallback } from 'react';
import {
    Building2, Users, Target, Plus, Search, ChevronRight, ChevronDown,
    Edit, Trash2, MoreVertical, X, UserPlus, FolderPlus, Flag,
    TrendingUp, Calendar, CheckCircle, Clock, AlertCircle, Layers,
    Settings, BarChart3, Users2, Briefcase, Star, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import type {
    Enterprise, Team, TeamMember, CustomGroup, CustomGroupMember,
    EnterpriseObjective, TeamObjective
} from '../lib/database.types';
import { AddContactModal } from './AddContactModal';

// =====================================================
// Types et Interfaces
// =====================================================

interface Contact {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    company: string | null;
    job_title: string | null;
    avatar_url: string | null;
    status: string;
    is_member?: boolean;
}

interface MemberObjective {
    id: string;
    member_id: string;
    enterprise_id: string;
    title: string;
    description: string | null;
    target_value: number | null;
    current_value: number;
    unit: string | null;
    currency: string;
    start_date: string | null;
    end_date: string | null;
    status: string;
    priority: string;
    linked_objective_type: string | null;
    linked_objective_id: string | null;
    created_by: string;
    created_at: string;
    updated_at: string;
}

type TabType = 'overview' | 'teams' | 'groups' | 'members' | 'objectives';

// =====================================================
// Composant Principal
// =====================================================

export function Enterprise() {
    const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
    const [enterprise, setEnterprise] = useState<Enterprise | null>(null);
    const [teams, setTeams] = useState<Team[]>([]);
    const [customGroups, setCustomGroups] = useState<CustomGroup[]>([]);
    const [enterpriseObjectives, setEnterpriseObjectives] = useState<EnterpriseObjective[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [selectedGroup, setSelectedGroup] = useState<CustomGroup | null>(null);
    const [showEnterpriseSelector, setShowEnterpriseSelector] = useState(false);

    // Modals
    const [showEnterpriseModal, setShowEnterpriseModal] = useState(false);
    const [showTeamModal, setShowTeamModal] = useState(false);
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [showObjectiveModal, setShowObjectiveModal] = useState(false);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [showTeamObjectiveModal, setShowTeamObjectiveModal] = useState(false);

    // Editing states
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);
    const [editingGroup, setEditingGroup] = useState<CustomGroup | null>(null);
    const [editingObjective, setEditingObjective] = useState<EnterpriseObjective | null>(null);
    const [editingTeamObjective, setEditingTeamObjective] = useState<TeamObjective | null>(null);
    const [parentTeamForNew, setParentTeamForNew] = useState<Team | null>(null);

    // =====================================================
    // Data Fetching
    // =====================================================

    const fetchEnterprise = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('enterprises')
                .select('*')
                .eq('owner_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const enterprisesList = (data || []) as Enterprise[];
            setEnterprises(enterprisesList);

            // Sélectionner la première entreprise par défaut si elle existe
            if (enterprisesList.length > 0 && !enterprise) {
                setEnterprise(enterprisesList[0]);
            }
        } catch (error) {
            console.error('Error fetching enterprise:', error);
        }
    }, [enterprise]);

    const fetchTeams = useCallback(async () => {
        if (!enterprise) return;

        try {
            const { data, error } = await supabase
                .from('teams')
                .select(`
          *,
          members:team_members(count)
        `)
                .eq('enterprise_id', enterprise.id)
                .order('level', { ascending: true })
                .order('name', { ascending: true });

            if (error) throw error;

            // Transform data to include members_count
            const teamsWithCount = (data || []).map(team => ({
                ...team,
                members_count: team.members?.[0]?.count || 0
            }));

            setTeams(teamsWithCount as Team[]);
        } catch (error) {
            console.error('Error fetching teams:', error);
        }
    }, [enterprise]);

    const fetchCustomGroups = useCallback(async () => {
        if (!enterprise) return;

        try {
            const { data, error } = await supabase
                .from('custom_groups')
                .select(`
          *,
          members:custom_group_members(count)
        `)
                .eq('enterprise_id', enterprise.id)
                .order('name');

            if (error) throw error;

            const groupsWithCount = (data || []).map(group => ({
                ...group,
                members_count: group.members?.[0]?.count || 0
            }));

            setCustomGroups(groupsWithCount as CustomGroup[]);
        } catch (error) {
            console.error('Error fetching groups:', error);
        }
    }, [enterprise]);

    const fetchEnterpriseObjectives = useCallback(async () => {
        if (!enterprise) return;

        try {
            const { data, error } = await supabase
                .from('enterprise_objectives')
                .select('*')
                .eq('enterprise_id', enterprise.id)
                .order('priority', { ascending: false })
                .order('created_at', { ascending: false });

            if (error) throw error;
            setEnterpriseObjectives((data || []) as EnterpriseObjective[]);
        } catch (error) {
            console.error('Error fetching objectives:', error);
        }
    }, [enterprise]);

    const fetchContacts = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('contacts')
                .select('*')
                .eq('user_id', user.id)
                .order('full_name');

            if (error) throw error;
            setContacts((data || []) as Contact[]);
        } catch (error) {
            console.error('Error fetching contacts:', error);
        }
    }, []);

    // Optimized parallel loading of enterprise data
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // Fetch enterprise and contacts in parallel
                await Promise.all([fetchEnterprise(), fetchContacts()]);
            } catch (error) {
                console.error('Error loading initial data:', error);
            }
            setLoading(false);
        };
        loadData();
    }, [fetchEnterprise, fetchContacts]);

    useEffect(() => {
        if (enterprise) {
            // Fetch all enterprise data in parallel for better performance
            Promise.all([
                fetchTeams(),
                fetchCustomGroups(),
                fetchEnterpriseObjectives()
            ]).catch(error => {
                console.error('Error fetching enterprise data:', error);
            });
        }
    }, [enterprise, fetchTeams, fetchCustomGroups, fetchEnterpriseObjectives]);

    // =====================================================
    // CRUD Operations - Enterprise
    // =====================================================

    const handleSaveEnterprise = async (data: Partial<Enterprise>) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Non authentifié');

            if (enterprise) {
                const { error } = await supabase
                    .from('enterprises')
                    .update(data as never)
                    .eq('id', enterprise.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('enterprises')
                    .insert({ ...data, owner_id: user.id } as never);
                if (error) throw error;
            }

            await fetchEnterprise();
            setShowEnterpriseModal(false);
        } catch (error) {
            console.error('Error saving enterprise:', error);
            toast.error('Erreur lors de l\'enregistrement');
        }
    };

    // =====================================================
    // CRUD Operations - Teams
    // =====================================================

    const handleSaveTeam = async (data: Partial<Team>) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !enterprise) throw new Error('Non authentifié');

            if (editingTeam) {
                const { error } = await supabase
                    .from('teams')
                    .update(data as never)
                    .eq('id', editingTeam.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('teams')
                    .insert({
                        ...data,
                        enterprise_id: enterprise.id,
                        manager_id: user.id
                    } as never);
                if (error) throw error;
            }

            await fetchTeams();
            setShowTeamModal(false);
            setEditingTeam(null);
            setParentTeamForNew(null);
        } catch (error) {
            console.error('Error saving team:', error);
            toast.error('Erreur lors de l\'enregistrement');
        }
    };

    const handleDeleteTeam = async (teamId: string) => {
        if (!confirm('Supprimer cette équipe et toutes ses sous-équipes ?')) return;

        try {
            const { error } = await supabase
                .from('teams')
                .delete()
                .eq('id', teamId);
            if (error) throw error;
            await fetchTeams();
            if (selectedTeam?.id === teamId) setSelectedTeam(null);
        } catch (error) {
            console.error('Error deleting team:', error);
            toast.error('Erreur lors de la suppression');
        }
    };

    // =====================================================
    // CRUD Operations - Team Members
    // =====================================================

    const handleAddTeamMember = async (teamId: string, contactId: string, role: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Non authentifié');

            const { error } = await supabase
                .from('team_members')
                .insert({
                    team_id: teamId,
                    contact_id: contactId,
                    user_id: user.id,
                    role: role || null
                } as never);

            if (error) throw error;
            await fetchTeams();
            setShowAddMemberModal(false);
        } catch (error) {
            console.error('Error adding member:', error);
            toast.error('Erreur lors de l\'ajout du membre');
        }
    };

    const handleRemoveTeamMember = async (memberId: string) => {
        if (!confirm('Retirer ce membre de l\'équipe ?')) return;

        try {
            const { error } = await supabase
                .from('team_members')
                .delete()
                .eq('id', memberId);
            if (error) throw error;
            await fetchTeams();
        } catch (error) {
            console.error('Error removing member:', error);
        }
    };

    const handleUpdateTeamMemberRole = async (memberId: string, newRole: string) => {
        try {
            const { error } = await supabase
                .from('team_members')
                .update({ role: newRole || null })
                .eq('id', memberId);
            if (error) throw error;
            await fetchTeams();
        } catch (error) {
            console.error('Error updating member role:', error);
            toast.error('Erreur lors de la mise à jour du rôle');
        }
    };

    // =====================================================
    // CRUD Operations - Custom Groups
    // =====================================================

    const handleSaveGroup = async (data: Partial<CustomGroup>) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !enterprise) throw new Error('Non authentifié');

            if (editingGroup) {
                const { error } = await supabase
                    .from('custom_groups')
                    .update(data as never)
                    .eq('id', editingGroup.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('custom_groups')
                    .insert({
                        ...data,
                        enterprise_id: enterprise.id,
                        created_by: user.id
                    } as never);
                if (error) throw error;
            }

            await fetchCustomGroups();
            setShowGroupModal(false);
            setEditingGroup(null);
        } catch (error) {
            console.error('Error saving group:', error);
            toast.error('Erreur lors de l\'enregistrement');
        }
    };

    const handleDeleteGroup = async (groupId: string) => {
        if (!confirm('Supprimer ce groupe ?')) return;

        try {
            const { error } = await supabase
                .from('custom_groups')
                .delete()
                .eq('id', groupId);
            if (error) throw error;
            await fetchCustomGroups();
            if (selectedGroup?.id === groupId) setSelectedGroup(null);
        } catch (error) {
            console.error('Error deleting group:', error);
        }
    };

    const handleAddGroupMember = async (groupId: string, contactId: string) => {
        try {
            const { error } = await supabase
                .from('custom_group_members')
                .insert({
                    group_id: groupId,
                    contact_id: contactId
                } as never);
            if (error) throw error;
            await fetchCustomGroups();
        } catch (error) {
            console.error('Error adding group member:', error);
        }
    };

    const handleRemoveGroupMember = async (memberId: string) => {
        try {
            const { error } = await supabase
                .from('custom_group_members')
                .delete()
                .eq('id', memberId);
            if (error) throw error;
            await fetchCustomGroups();
        } catch (error) {
            console.error('Error removing group member:', error);
        }
    };

    // =====================================================
    // CRUD Operations - Objectives
    // =====================================================

    const handleSaveObjective = async (data: Partial<EnterpriseObjective>) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !enterprise) throw new Error('Non authentifié');

            if (editingObjective) {
                const { error } = await supabase
                    .from('enterprise_objectives')
                    .update(data as never)
                    .eq('id', editingObjective.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('enterprise_objectives')
                    .insert({
                        ...data,
                        enterprise_id: enterprise.id,
                        created_by: user.id
                    } as never);
                if (error) throw error;
            }

            await fetchEnterpriseObjectives();
            setShowObjectiveModal(false);
            setEditingObjective(null);
        } catch (error) {
            console.error('Error saving objective:', error);
            toast.error('Erreur lors de l\'enregistrement');
        }
    };

    const handleDeleteObjective = async (objectiveId: string) => {
        if (!confirm('Supprimer cet objectif ?')) return;

        try {
            const { error } = await supabase
                .from('enterprise_objectives')
                .delete()
                .eq('id', objectiveId);
            if (error) throw error;
            await fetchEnterpriseObjectives();
        } catch (error) {
            console.error('Error deleting objective:', error);
        }
    };

    // =====================================================
    // Helpers
    // =====================================================

    const getTeamHierarchy = (teams: Team[]): Team[] => {
        const topLevelTeams = teams.filter(t => !t.parent_team_id);
        const addSubTeams = (team: Team): Team => ({
            ...team,
            sub_teams: teams
                .filter(t => t.parent_team_id === team.id)
                .map(addSubTeams)
        });
        return topLevelTeams.map(addSubTeams);
    };

    const getProgressPercentage = (current: number, target: number | null): number => {
        if (!target || target === 0) return 0;
        return Math.min(100, Math.round((current / target) * 100));
    };

    const getPriorityConfig = (priority: string) => {
        switch (priority) {
            case 'critical':
                return { label: 'Critique', color: 'bg-red-100 text-red-700', icon: AlertCircle };
            case 'high':
                return { label: 'Haute', color: 'bg-orange-100 text-orange-700', icon: TrendingUp };
            case 'medium':
                return { label: 'Moyenne', color: 'bg-blue-100 text-blue-700', icon: Flag };
            default:
                return { label: 'Basse', color: 'bg-gray-100 text-gray-700', icon: Clock };
        }
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'completed':
                return { label: 'Terminé', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle };
            case 'in_progress':
                return { label: 'En cours', color: 'bg-blue-100 text-blue-700', icon: TrendingUp };
            case 'cancelled':
                return { label: 'Annulé', color: 'bg-red-100 text-red-700', icon: X };
            default:
                return { label: 'Non démarré', color: 'bg-gray-100 text-gray-700', icon: Clock };
        }
    };

    // =====================================================
    // KPIs
    // =====================================================

    const kpis = {
        totalTeams: teams.length,
        totalMembers: teams.reduce((sum, t) => sum + (t.members_count || 0), 0),
        totalGroups: customGroups.length,
        objectivesCompleted: enterpriseObjectives.filter(o => o.status === 'completed').length,
        objectivesInProgress: enterpriseObjectives.filter(o => o.status === 'in_progress').length,
        objectivesTotal: enterpriseObjectives.length
    };

    // =====================================================
    // Render
    // =====================================================

    if (loading) {
        return (
            <div className="space-y-8 max-w-7xl mx-auto">
                <div className="animate-pulse space-y-6">
                    <div className="h-12 bg-gray-200 rounded-2xl w-1/3" />
                    <div className="grid grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-32 bg-gray-200 rounded-3xl" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Si pas d'entreprise configurée
    if (!enterprise && enterprises.length === 0) {
        return (
            <div className="space-y-8 max-w-7xl mx-auto">
                <div className="bg-white rounded-3xl border border-gray-200 p-16 text-center max-w-2xl mx-auto">
                    <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <Building2 className="w-12 h-12 text-gray-400" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                        Configurez votre entreprise
                    </h2>
                    <p className="text-gray-500 mb-8 text-lg">
                        Commencez par créer votre entreprise pour gérer vos équipes, définir des groupes personnalisés et suivre vos objectifs.
                    </p>
                    <button
                        onClick={() => setShowEnterpriseModal(true)}
                        className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-br from-[#0E3A5D] to-[#1e5a8e] text-white rounded-full hover:from-gray-800 hover:to-gray-700 transition-all font-semibold shadow-2xl"
                    >
                        <Plus className="w-5 h-5" />
                        Créer mon entreprise
                    </button>
                </div>

                {showEnterpriseModal && (
                    <EnterpriseModal
                        enterprise={null}
                        onClose={() => setShowEnterpriseModal(false)}
                        onSave={handleSaveEnterprise}
                    />
                )}
            </div>
        );
    }

    if (!enterprise) {
        return null;
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header minimaliste */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div className="flex items-center gap-4">
                    {enterprise.logo_url ? (
                        <img
                            src={enterprise.logo_url}
                            alt={enterprise.name}
                            className="w-20 h-20 rounded-3xl object-cover border-2 border-gray-200"
                        />
                    ) : (
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center shadow-lg">
                            <Building2 className="w-10 h-10 text-white" />
                        </div>
                    )}
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900">{enterprise.name}</h1>
                            {enterprises.length > 1 && (
                                <button
                                    onClick={() => setShowEnterpriseSelector(!showEnterpriseSelector)}
                                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Changer d'entreprise"
                                >
                                    <ChevronDown className="w-5 h-5 text-gray-500" />
                                </button>
                            )}
                        </div>
                        {enterprise.industry && (
                            <p className="text-lg text-gray-500 mt-1">{enterprise.industry}</p>
                        )}
                    </div>

                    {/* Sélecteur d'entreprise */}
                    {showEnterpriseSelector && enterprises.length > 1 && (
                        <div className="absolute top-24 left-24 bg-white rounded-3xl shadow-2xl border border-gray-200 p-6 z-50 w-96">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-gray-900">Vos entreprises</h3>
                                <button
                                    onClick={() => setShowEnterpriseSelector(false)}
                                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {enterprises.map((ent) => (
                                    <button
                                        key={ent.id}
                                        onClick={() => {
                                            setEnterprise(ent);
                                            setShowEnterpriseSelector(false);
                                        }}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                                            ent.id === enterprise.id
                                                ? 'bg-blue-50 border-2 border-blue-500'
                                                : 'hover:bg-gray-50 border-2 border-transparent'
                                        }`}
                                    >
                                        {ent.logo_url ? (
                                            <img
                                                src={ent.logo_url}
                                                alt={ent.name}
                                                className="w-10 h-10 rounded-lg object-cover"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#0E3A5D] to-[#1e5a8e] flex items-center justify-center">
                                                <Building2 className="w-5 h-5 text-white" />
                                            </div>
                                        )}
                                        <div className="flex-1 text-left">
                                            <div className="font-medium text-gray-900">{ent.name}</div>
                                            {ent.industry && (
                                                <div className="text-xs text-gray-500">{ent.industry}</div>
                                            )}
                                        </div>
                                        {ent.id === enterprise.id && (
                                            <CheckCircle className="w-5 h-5 text-blue-600" />
                                        )}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => {
                                    setShowEnterpriseModal(true);
                                    setShowEnterpriseSelector(false);
                                }}
                                className="w-full mt-3 pt-3 border-t border-gray-200 text-left px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2 text-blue-600 font-medium"
                            >
                                <Plus className="w-4 h-4" />
                                Créer une nouvelle entreprise
                            </button>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {enterprises.length > 1 && (
                        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
                            {enterprises.length} entreprise{enterprises.length > 1 ? 's' : ''}
                        </span>
                    )}
                    <button
                        onClick={() => setShowEnterpriseModal(true)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <Settings className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
            </div>

            {/* Stats en grille moderne */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                {/* Équipes - Dark card */}
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
                                    <Users className="w-3.5 h-3.5 transition-colors duration-300 text-white/90" strokeWidth={2} />
                                </div>
                                <p className="text-[10px] lg:text-xs font-medium uppercase tracking-wider text-white/70">Équipes</p>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">{kpis.totalTeams}</h3>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Membres */}
                <div className="group relative overflow-hidden">
                    <div className="relative rounded-xl lg:rounded-2xl p-4 lg:p-5 border transition-all duration-300 hover:-translate-y-0.5 overflow-hidden bg-white border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)]">
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
                                    <Users2 className="w-3.5 h-3.5 transition-colors duration-300" strokeWidth={2} style={{ color: '#10b981' }} />
                                </div>
                                <p className="text-[10px] lg:text-xs font-medium uppercase tracking-wider text-gray-500">Membres</p>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-2xl lg:text-3xl font-bold tracking-tight text-gray-900">{kpis.totalMembers}</h3>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Groupes */}
                <div className="group relative overflow-hidden">
                    <div className="relative rounded-xl lg:rounded-2xl p-4 lg:p-5 border transition-all duration-300 hover:-translate-y-0.5 overflow-hidden bg-white border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)]">
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
                                <p className="text-[10px] lg:text-xs font-medium uppercase tracking-wider text-gray-500">Groupes</p>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-2xl lg:text-3xl font-bold tracking-tight text-gray-900">{kpis.totalGroups}</h3>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Objectifs */}
                <div className="group relative overflow-hidden">
                    <div className="relative rounded-xl lg:rounded-2xl p-4 lg:p-5 border transition-all duration-300 hover:-translate-y-0.5 overflow-hidden bg-white border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)]">
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
                                    <Target className="w-3.5 h-3.5 transition-colors duration-300" strokeWidth={2} style={{ color: '#f59e0b' }} />
                                </div>
                                <p className="text-[10px] lg:text-xs font-medium uppercase tracking-wider text-gray-500">Objectifs</p>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-xl lg:text-2xl font-bold tracking-tight text-gray-900">
                                    {kpis.objectivesCompleted}/{kpis.objectivesTotal}
                                </h3>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs modernes avec scroll */}
            <div className="bg-white rounded-3xl border border-gray-200 p-2 w-full max-w-full overflow-x-auto scrollbar-hide">
                <div className="flex gap-2 min-w-max">
                    {[
                        { key: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
                        { key: 'teams', label: 'Équipes', icon: Users },
                        { key: 'groups', label: 'Groupes', icon: Layers },
                        { key: 'members', label: 'Membres', icon: Users2 },
                        { key: 'objectives', label: 'Objectifs', icon: Target }
                    ].map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key as TabType)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold transition-all whitespace-nowrap flex-shrink-0 ${activeTab === tab.key
                                        ? 'bg-gray-900 text-white shadow-lg'
                                        : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content */}
            {activeTab === 'overview' && (
                <OverviewTab
                    teams={teams}
                    customGroups={customGroups}
                    objectives={enterpriseObjectives}
                    onTeamSelect={(team) => {
                        setSelectedTeam(team);
                        setActiveTab('teams');
                    }}
                    onGroupSelect={(group) => {
                        setSelectedGroup(group);
                        setActiveTab('groups');
                    }}
                    getProgressPercentage={getProgressPercentage}
                    getStatusConfig={getStatusConfig}
                    getPriorityConfig={getPriorityConfig}
                />
            )}

            {activeTab === 'teams' && (
                <TeamsTab
                    teams={getTeamHierarchy(teams)}
                    allTeams={teams}
                    selectedTeam={selectedTeam}
                    onSelectTeam={setSelectedTeam}
                    onAddTeam={() => {
                        setEditingTeam(null);
                        setParentTeamForNew(null);
                        setShowTeamModal(true);
                    }}
                    onAddSubTeam={(parentTeam) => {
                        setEditingTeam(null);
                        setParentTeamForNew(parentTeam);
                        setShowTeamModal(true);
                    }}
                    onEditTeam={(team) => {
                        setEditingTeam(team);
                        setShowTeamModal(true);
                    }}
                    onDeleteTeam={handleDeleteTeam}
                    onAddMember={() => setShowAddMemberModal(true)}
                    onRemoveMember={handleRemoveTeamMember}
                    onUpdateMemberRole={handleUpdateTeamMemberRole}
                    onAddTeamObjective={() => {
                        setEditingTeamObjective(null);
                        setShowTeamObjectiveModal(true);
                    }}
                    contacts={contacts}
                    enterpriseId={enterprise.id}
                />
            )}

            {activeTab === 'groups' && (
                <GroupsTab
                    groups={customGroups}
                    selectedGroup={selectedGroup}
                    onSelectGroup={setSelectedGroup}
                    onAddGroup={() => {
                        setEditingGroup(null);
                        setShowGroupModal(true);
                    }}
                    onEditGroup={(group) => {
                        setEditingGroup(group);
                        setShowGroupModal(true);
                    }}
                    onDeleteGroup={handleDeleteGroup}
                    onAddMember={handleAddGroupMember}
                    onRemoveMember={handleRemoveGroupMember}
                    contacts={contacts}
                />
            )}

            {activeTab === 'members' && (
                <MembersTab
                    members={contacts.filter(c => c.is_member === true)}
                    allContacts={contacts}
                    onToggleMember={async (contactId: string, isMember: boolean) => {
                        try {
                            const { error } = await supabase
                                .from('contacts')
                                .update({ is_member: isMember } as never)
                                .eq('id', contactId);
                            if (error) throw error;
                            await fetchContacts();
                        } catch (error) {
                            console.error('Error updating member status:', error);
                            toast.error('Erreur lors de la mise à jour');
                        }
                    }}
                    onRefresh={fetchContacts}
                    enterpriseId={enterprise.id}
                />
            )}

            {activeTab === 'objectives' && (
                <ObjectivesTab
                    objectives={enterpriseObjectives}
                    onAddObjective={() => {
                        setEditingObjective(null);
                        setShowObjectiveModal(true);
                    }}
                    onEditObjective={(obj) => {
                        setEditingObjective(obj);
                        setShowObjectiveModal(true);
                    }}
                    onDeleteObjective={handleDeleteObjective}
                    getProgressPercentage={getProgressPercentage}
                    getStatusConfig={getStatusConfig}
                    getPriorityConfig={getPriorityConfig}
                />
            )}

            {/* Modals */}
            {showEnterpriseModal && (
                <EnterpriseModal
                    enterprise={enterprise}
                    onClose={() => setShowEnterpriseModal(false)}
                    onSave={handleSaveEnterprise}
                />
            )}

            {showTeamModal && (
                <TeamModal
                    team={editingTeam}
                    parentTeam={parentTeamForNew}
                    allTeams={teams}
                    onClose={() => {
                        setShowTeamModal(false);
                        setEditingTeam(null);
                        setParentTeamForNew(null);
                    }}
                    onSave={handleSaveTeam}
                />
            )}

            {showGroupModal && (
                <GroupModal
                    group={editingGroup}
                    onClose={() => {
                        setShowGroupModal(false);
                        setEditingGroup(null);
                    }}
                    onSave={handleSaveGroup}
                />
            )}

            {showObjectiveModal && (
                <ObjectiveModal
                    objective={editingObjective}
                    onClose={() => {
                        setShowObjectiveModal(false);
                        setEditingObjective(null);
                    }}
                    onSave={handleSaveObjective}
                />
            )}

            {showAddMemberModal && selectedTeam && (
                <AddMemberModal
                    teamId={selectedTeam.id}
                    contacts={contacts}
                    existingMemberIds={[]} // TODO: fetch existing members
                    onClose={() => setShowAddMemberModal(false)}
                    onSave={handleAddTeamMember}
                />
            )}

            {showTeamObjectiveModal && selectedTeam && (
                <TeamObjectiveModal
                    teamId={selectedTeam.id}
                    objective={editingTeamObjective}
                    enterpriseObjectives={enterpriseObjectives}
                    contacts={contacts}
                    onClose={() => {
                        setShowTeamObjectiveModal(false);
                        setEditingTeamObjective(null);
                    }}
                />
            )}
        </div>
    );
}

// =====================================================
// Overview Tab
// =====================================================

interface OverviewTabProps {
    teams: Team[];
    customGroups: CustomGroup[];
    objectives: EnterpriseObjective[];
    onTeamSelect: (team: Team) => void;
    onGroupSelect: (group: CustomGroup) => void;
    getProgressPercentage: (current: number, target: number | null) => number;
    getStatusConfig: (status: string) => { label: string; color: string; icon: React.ElementType };
    getPriorityConfig: (priority: string) => { label: string; color: string; icon: React.ElementType };
}

function OverviewTab({
    teams,
    customGroups,
    objectives,
    onTeamSelect,
    onGroupSelect,
    getProgressPercentage,
    getStatusConfig,
    getPriorityConfig
}: OverviewTabProps) {
    const recentObjectives = objectives.slice(0, 5);
    const topTeams = teams.slice(0, 5);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Objectifs récents */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-amber-600" />
                    Objectifs en cours
                </h3>
                {recentObjectives.length === 0 ? (
                    <p className="text-gray-500 text-sm">Aucun objectif défini</p>
                ) : (
                    <div className="space-y-4">
                        {recentObjectives.map((obj) => {
                            const progress = getProgressPercentage(obj.current_value, obj.target_value);
                            const priorityConfig = getPriorityConfig(obj.priority);
                            const PriorityIcon = priorityConfig.icon;

                            return (
                                <div key={obj.id} className="p-4 bg-gray-50 rounded-xl">
                                    <div className="flex items-start justify-between mb-2">
                                        <h4 className="font-medium text-gray-900 text-sm">{obj.title}</h4>
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${priorityConfig.color}`}>
                                            <PriorityIcon className="w-3 h-3" />
                                            {priorityConfig.label}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                        <div
                                            className="bg-[#0E3A5D] h-2 rounded-full transition-all"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500">{progress}% complété</p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Équipes */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Équipes
                </h3>
                {topTeams.length === 0 ? (
                    <p className="text-gray-500 text-sm">Aucune équipe créée</p>
                ) : (
                    <div className="space-y-3">
                        {topTeams.map((team) => (
                            <button
                                key={team.id}
                                onClick={() => onTeamSelect(team)}
                                className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                                        style={{ backgroundColor: `${team.color}20` }}
                                    >
                                        <Users className="w-5 h-5" style={{ color: team.color }} />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-medium text-gray-900 text-sm">{team.name}</p>
                                        <p className="text-xs text-gray-500">{team.members_count || 0} membres</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Groupes */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-violet-600" />
                    Groupes personnalisés
                </h3>
                {customGroups.length === 0 ? (
                    <p className="text-gray-500 text-sm">Aucun groupe créé</p>
                ) : (
                    <div className="space-y-3">
                        {customGroups.slice(0, 5).map((group) => (
                            <button
                                key={group.id}
                                onClick={() => onGroupSelect(group)}
                                className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                                        style={{ backgroundColor: `${group.color}20` }}
                                    >
                                        <Layers className="w-5 h-5" style={{ color: group.color }} />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-medium text-gray-900 text-sm">{group.name}</p>
                                        <p className="text-xs text-gray-500">{group.members_count || 0} membres</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Statistiques rapides */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-emerald-600" />
                    Statistiques
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-emerald-50 rounded-xl">
                        <p className="text-2xl font-bold text-emerald-600">
                            {objectives.filter(o => o.status === 'completed').length}
                        </p>
                        <p className="text-xs text-gray-600">Objectifs atteints</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-xl">
                        <p className="text-2xl font-bold text-blue-600">
                            {objectives.filter(o => o.status === 'in_progress').length}
                        </p>
                        <p className="text-xs text-gray-600">En progression</p>
                    </div>
                    <div className="text-center p-4 bg-amber-50 rounded-xl">
                        <p className="text-2xl font-bold text-amber-600">
                            {teams.filter(t => t.level === 1).length}
                        </p>
                        <p className="text-xs text-gray-600">Équipes principales</p>
                    </div>
                    <div className="text-center p-4 bg-violet-50 rounded-xl">
                        <p className="text-2xl font-bold text-violet-600">
                            {teams.filter(t => t.level > 1).length}
                        </p>
                        <p className="text-xs text-gray-600">Sous-équipes</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// =====================================================
// Teams Tab
// =====================================================

interface TeamsTabProps {
    teams: Team[];
    allTeams: Team[];
    selectedTeam: Team | null;
    onSelectTeam: (team: Team | null) => void;
    onAddTeam: () => void;
    onAddSubTeam: (parentTeam: Team) => void;
    onEditTeam: (team: Team) => void;
    onDeleteTeam: (teamId: string) => void;
    onAddMember: () => void;
    onRemoveMember: (memberId: string) => void;
    onUpdateMemberRole: (memberId: string, newRole: string) => void;
    onAddTeamObjective: () => void;
    contacts: Contact[];
    enterpriseId: string;
}

function TeamsTab({
    teams,
    allTeams,
    selectedTeam,
    onSelectTeam,
    onAddTeam,
    onAddSubTeam,
    onEditTeam,
    onDeleteTeam,
    onAddMember,
    onRemoveMember,
    onUpdateMemberRole,
    onAddTeamObjective,
    contacts,
    enterpriseId
}: TeamsTabProps) {
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [teamObjectives, setTeamObjectives] = useState<TeamObjective[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
    const [editingMemberRole, setEditingMemberRole] = useState('');
    const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
    const [assigningObjectiveToMember, setAssigningObjectiveToMember] = useState<{ memberId: string, contactId: string } | null>(null);

    const toggleTeamExpand = (teamId: string) => {
        setExpandedTeams(prev => {
            const newSet = new Set(prev);
            if (newSet.has(teamId)) {
                newSet.delete(teamId);
            } else {
                newSet.add(teamId);
            }
            return newSet;
        });
    };

    const handleAssignObjective = async (objectiveId: string, contactId: string) => {
        try {
            const { error } = await supabase
                .from('team_objectives')
                .update({ assigned_to: contactId })
                .eq('id', objectiveId);

            if (error) throw error;

            setAssigningObjectiveToMember(null);
            // Refresh objectives
            if (selectedTeam) {
                const { data } = await supabase
                    .from('team_objectives')
                    .select('*')
                    .eq('team_id', selectedTeam.id);
                if (data) setTeamObjectives(data);
            }
        } catch (error) {
            console.error('Error assigning objective:', error);
            toast.error('Erreur lors de l\'assignation de l\'objectif');
        }
    };

    // Fetch team members when selected team changes
    useEffect(() => {
        const fetchTeamData = async () => {
            if (!selectedTeam) {
                setTeamMembers([]);
                setTeamObjectives([]);
                return;
            }

            setLoadingMembers(true);
            try {
                // Fetch members
                const { data: members, error: membersError } = await supabase
                    .from('team_members')
                    .select(`
            *,
            contact:contacts(*)
          `)
                    .eq('team_id', selectedTeam.id);

                if (membersError) throw membersError;
                setTeamMembers((members || []) as TeamMember[]);

                // Fetch objectives
                const { data: objectives, error: objError } = await supabase
                    .from('team_objectives')
                    .select('*')
                    .eq('team_id', selectedTeam.id);

                if (objError) throw objError;
                setTeamObjectives((objectives || []) as TeamObjective[]);
            } catch (error) {
                console.error('Error fetching team data:', error);
            } finally {
                setLoadingMembers(false);
            }
        };

        fetchTeamData();
    }, [selectedTeam]);

    const renderTeamTree = (teamsToRender: Team[], depth = 0) => {
        return teamsToRender.map((team) => {
            const hasSubTeams = team.sub_teams && team.sub_teams.length > 0;
            const isExpanded = expandedTeams.has(team.id);

            return (
                <div key={team.id} style={{ marginLeft: depth * 24 }}>
                    <div className="flex items-center gap-1">
                        {hasSubTeams ? (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleTeamExpand(team.id);
                                }}
                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                            >
                                {isExpanded ? (
                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                ) : (
                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                )}
                            </button>
                        ) : (
                            <div className="w-6" />
                        )}
                        <button
                            onClick={() => onSelectTeam(team)}
                            className={`flex-1 flex items-center justify-between p-3 rounded-xl transition-colors ${selectedTeam?.id === team.id
                                    ? 'bg-[#0E3A5D] text-white'
                                    : 'bg-gray-50 hover:bg-gray-100'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                                    style={{
                                        backgroundColor: selectedTeam?.id === team.id ? 'rgba(255,255,255,0.2)' : `${team.color}20`
                                    }}
                                >
                                    <Users
                                        className="w-4 h-4"
                                        style={{ color: selectedTeam?.id === team.id ? 'white' : team.color }}
                                    />
                                </div>
                                <div className="text-left">
                                    <p className={`font-medium text-sm ${selectedTeam?.id === team.id ? 'text-white' : 'text-gray-900'}`}>
                                        {team.name}
                                    </p>
                                    <p className={`text-xs ${selectedTeam?.id === team.id ? 'text-white/70' : 'text-gray-500'}`}>
                                        Niveau {team.level} • {team.members_count || 0} membres
                                    </p>
                                </div>
                            </div>
                        </button>
                    </div>
                    {hasSubTeams && isExpanded && (
                        <div className="mt-1">
                            {renderTeamTree(team.sub_teams, depth + 1)}
                        </div>
                    )}
                </div>
            );
        });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Liste des équipes */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Structure des équipes</h3>
                    <button
                        onClick={onAddTeam}
                        className="p-2 bg-[#0E3A5D] text-white rounded-lg hover:bg-[#0c2e4a] transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                {teams.length === 0 ? (
                    <div className="text-center py-8">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm mb-4">Aucune équipe créée</p>
                        <button
                            onClick={onAddTeam}
                            className="btn-primary text-sm"
                        >
                            Créer une équipe
                        </button>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {renderTeamTree(teams)}
                    </div>
                )}
            </div>

            {/* Détails de l'équipe sélectionnée */}
            <div className="lg:col-span-2">
                {selectedTeam ? (
                    <div className="space-y-6">
                        {/* Header équipe */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div
                                        className="w-14 h-14 rounded-xl flex items-center justify-center"
                                        style={{ backgroundColor: `${selectedTeam.color}20` }}
                                    >
                                        <Users className="w-7 h-7" style={{ color: selectedTeam.color }} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">{selectedTeam.name}</h3>
                                        <p className="text-sm text-gray-500">
                                            Niveau {selectedTeam.level}
                                            {selectedTeam.parent_team_id && (
                                                <span> • Sous-équipe de {allTeams.find(t => t.id === selectedTeam.parent_team_id)?.name}</span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => onAddSubTeam(selectedTeam)}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                        title="Ajouter une sous-équipe"
                                    >
                                        <FolderPlus className="w-5 h-5 text-gray-500" />
                                    </button>
                                    <button
                                        onClick={() => onEditTeam(selectedTeam)}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <Edit className="w-5 h-5 text-gray-500" />
                                    </button>
                                    <button
                                        onClick={() => onDeleteTeam(selectedTeam.id)}
                                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5 text-red-500" />
                                    </button>
                                </div>
                            </div>
                            {selectedTeam.description && (
                                <p className="text-gray-600">{selectedTeam.description}</p>
                            )}
                        </div>

                        {/* Membres de l'équipe */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-semibold text-gray-900">Membres ({teamMembers.length})</h4>
                                <button
                                    onClick={onAddMember}
                                    className="btn-primary text-sm flex items-center gap-2"
                                >
                                    <UserPlus className="w-4 h-4" />
                                    Ajouter
                                </button>
                            </div>

                            {loadingMembers ? (
                                <div className="animate-pulse space-y-3">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="h-16 bg-gray-100 rounded-xl" />
                                    ))}
                                </div>
                            ) : teamMembers.length === 0 ? (
                                <p className="text-gray-500 text-sm text-center py-8">
                                    Aucun membre dans cette équipe
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {teamMembers.map((member) => (
                                        <div
                                            key={member.id}
                                            className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                                        >
                                            <div className="flex items-center gap-3 flex-1">
                                                {member.contact?.avatar_url ? (
                                                    <img
                                                        src={member.contact.avatar_url}
                                                        alt={member.contact.full_name}
                                                        className="w-10 h-10 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0E3A5D] to-[#1e5a8e] flex items-center justify-center">
                                                        <span className="text-white text-sm font-semibold">
                                                            {member.contact?.full_name?.charAt(0) || '?'}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-900">{member.contact?.full_name}</p>
                                                    {editingMemberId === member.id ? (
                                                        <input
                                                            type="text"
                                                            value={editingMemberRole}
                                                            onChange={(e) => setEditingMemberRole(e.target.value)}
                                                            placeholder="Ex: Chef de projet..."
                                                            className="mt-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20"
                                                            autoFocus
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    onUpdateMemberRole(member.id, editingMemberRole);
                                                                    setEditingMemberId(null);
                                                                    setEditingMemberRole('');
                                                                } else if (e.key === 'Escape') {
                                                                    setEditingMemberId(null);
                                                                    setEditingMemberRole('');
                                                                }
                                                            }}
                                                        />
                                                    ) : (
                                                        <p className="text-xs text-gray-500">
                                                            {member.role || member.contact?.job_title || 'Membre'}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {editingMemberId === member.id ? (
                                                    <>
                                                        <button
                                                            onClick={() => {
                                                                onUpdateMemberRole(member.id, editingMemberRole);
                                                                setEditingMemberId(null);
                                                                setEditingMemberRole('');
                                                            }}
                                                            className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                                                            title="Sauvegarder"
                                                        >
                                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setEditingMemberId(null);
                                                                setEditingMemberRole('');
                                                            }}
                                                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                                            title="Annuler"
                                                        >
                                                            <X className="w-4 h-4 text-gray-500" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => {
                                                                if (member.contact) {
                                                                    setAssigningObjectiveToMember({ memberId: member.id, contactId: member.contact.id });
                                                                }
                                                            }}
                                                            className="p-2 hover:bg-amber-50 rounded-lg transition-colors"
                                                            title="Assigner un objectif"
                                                        >
                                                            <Target className="w-4 h-4 text-amber-600" />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setEditingMemberId(member.id);
                                                                setEditingMemberRole(member.role || '');
                                                            }}
                                                            className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Modifier le rôle"
                                                        >
                                                            <Edit className="w-4 h-4 text-blue-600" />
                                                        </button>
                                                        <button
                                                            onClick={() => onRemoveMember(member.id)}
                                                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Retirer de l'équipe"
                                                        >
                                                            <Trash2 className="w-4 h-4 text-red-500" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {/* Modal d'assignation d'objectif */}
                                    {assigningObjectiveToMember && (
                                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setAssigningObjectiveToMember(null)}>
                                            <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="text-lg font-bold text-gray-900">Assigner un objectif</h3>
                                                    <button
                                                        onClick={() => setAssigningObjectiveToMember(null)}
                                                        className="p-2 hover:bg-gray-100 rounded-lg"
                                                    >
                                                        <X className="w-5 h-5 text-gray-500" />
                                                    </button>
                                                </div>

                                                {teamObjectives.length === 0 ? (
                                                    <p className="text-gray-500 text-center py-8">Aucun objectif disponible pour cette équipe</p>
                                                ) : (
                                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                                        {teamObjectives.map((obj) => (
                                                            <button
                                                                key={obj.id}
                                                                onClick={() => handleAssignObjective(obj.id, assigningObjectiveToMember.contactId)}
                                                                className="w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-xl text-left transition-colors"
                                                            >
                                                                <p className="font-medium text-gray-900">{obj.title}</p>
                                                                {obj.description && (
                                                                    <p className="text-sm text-gray-500 mt-1">{obj.description}</p>
                                                                )}
                                                                <div className="flex items-center gap-2 mt-2">
                                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                                        obj.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                                        obj.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                                                        'bg-gray-100 text-gray-700'
                                                                    }`}>
                                                                        {obj.status === 'completed' ? 'Terminé' :
                                                                         obj.status === 'in_progress' ? 'En cours' :
                                                                         'Non commencé'}
                                                                    </span>
                                                                    {obj.assigned_to && (
                                                                        <span className="text-xs text-gray-500">
                                                                            Déjà assigné
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Objectifs de l'équipe */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-semibold text-gray-900">Objectifs de l'équipe</h4>
                                <button
                                    onClick={onAddTeamObjective}
                                    className="btn-primary text-sm flex items-center gap-2"
                                >
                                    <Flag className="w-4 h-4" />
                                    Définir un objectif
                                </button>
                            </div>

                            {teamObjectives.length === 0 ? (
                                <p className="text-gray-500 text-sm text-center py-8">
                                    Aucun objectif défini pour cette équipe
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {teamObjectives.map((obj) => {
                                        const progress = obj.target_value
                                            ? Math.min(100, Math.round((obj.current_value / obj.target_value) * 100))
                                            : 0;

                                        return (
                                            <div key={obj.id} className="p-4 bg-gray-50 rounded-xl">
                                                <div className="flex items-start justify-between mb-2">
                                                    <h5 className="font-medium text-gray-900">{obj.title}</h5>
                                                    <span className={`px-2 py-1 rounded-full text-xs ${obj.status === 'completed'
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : 'bg-blue-100 text-blue-700'
                                                        }`}>
                                                        {obj.status === 'completed' ? 'Terminé' : 'En cours'}
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                                    <div
                                                        className="bg-emerald-500 h-2 rounded-full transition-all"
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                                <div className="flex justify-between text-xs text-gray-500">
                                                    <span>{obj.current_value} / {obj.target_value} {obj.unit}</span>
                                                    <span>{progress}%</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Sélectionnez une équipe
                        </h3>
                        <p className="text-gray-500">
                            Cliquez sur une équipe dans la liste pour voir ses détails
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

// =====================================================
// Groups Tab
// =====================================================

interface GroupsTabProps {
    groups: CustomGroup[];
    selectedGroup: CustomGroup | null;
    onSelectGroup: (group: CustomGroup | null) => void;
    onAddGroup: () => void;
    onEditGroup: (group: CustomGroup) => void;
    onDeleteGroup: (groupId: string) => void;
    onAddMember: (groupId: string, contactId: string) => void;
    onRemoveMember: (memberId: string) => void;
    contacts: Contact[];
}

function GroupsTab({
    groups,
    selectedGroup,
    onSelectGroup,
    onAddGroup,
    onEditGroup,
    onDeleteGroup,
    onAddMember,
    onRemoveMember,
    contacts
}: GroupsTabProps) {
    const [groupMembers, setGroupMembers] = useState<CustomGroupMember[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        const fetchGroupMembers = async () => {
            if (!selectedGroup) {
                setGroupMembers([]);
                return;
            }

            setLoadingMembers(true);
            try {
                const { data, error } = await supabase
                    .from('custom_group_members')
                    .select(`
            *,
            contact:contacts(*)
          `)
                    .eq('group_id', selectedGroup.id);

                if (error) throw error;
                setGroupMembers((data || []) as CustomGroupMember[]);
            } catch (error) {
                console.error('Error fetching group members:', error);
            } finally {
                setLoadingMembers(false);
            }
        };

        fetchGroupMembers();
    }, [selectedGroup]);

    const existingMemberIds = groupMembers.map(m => m.contact_id);
    const availableContacts = contacts.filter(c => !existingMemberIds.includes(c.id));

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Liste des groupes */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Groupes personnalisés</h3>
                    <button
                        onClick={onAddGroup}
                        className="p-2 bg-[#0E3A5D] text-white rounded-lg hover:bg-[#0c2e4a] transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                {groups.length === 0 ? (
                    <div className="text-center py-8">
                        <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm mb-4">Aucun groupe créé</p>
                        <button onClick={onAddGroup} className="btn-primary text-sm">
                            Créer un groupe
                        </button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {groups.map((group) => (
                            <button
                                key={group.id}
                                onClick={() => onSelectGroup(group)}
                                className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${selectedGroup?.id === group.id
                                        ? 'bg-[#0E3A5D] text-white'
                                        : 'bg-gray-50 hover:bg-gray-100'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                                        style={{
                                            backgroundColor: selectedGroup?.id === group.id
                                                ? 'rgba(255,255,255,0.2)'
                                                : `${group.color}20`
                                        }}
                                    >
                                        <Layers
                                            className="w-5 h-5"
                                            style={{ color: selectedGroup?.id === group.id ? 'white' : group.color }}
                                        />
                                    </div>
                                    <div className="text-left">
                                        <p className={`font-medium text-sm ${selectedGroup?.id === group.id ? 'text-white' : 'text-gray-900'
                                            }`}>
                                            {group.name}
                                        </p>
                                        <p className={`text-xs ${selectedGroup?.id === group.id ? 'text-white/70' : 'text-gray-500'
                                            }`}>
                                            {group.members_count || 0} membres
                                        </p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Détails du groupe */}
            <div className="lg:col-span-2">
                {selectedGroup ? (
                    <div className="bg-white rounded-2xl border border-gray-200 p-6">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div
                                    className="w-14 h-14 rounded-xl flex items-center justify-center"
                                    style={{ backgroundColor: `${selectedGroup.color}20` }}
                                >
                                    <Layers className="w-7 h-7" style={{ color: selectedGroup.color }} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{selectedGroup.name}</h3>
                                    {selectedGroup.description && (
                                        <p className="text-sm text-gray-500">{selectedGroup.description}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => onEditGroup(selectedGroup)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <Edit className="w-5 h-5 text-gray-500" />
                                </button>
                                <button
                                    onClick={() => onDeleteGroup(selectedGroup.id)}
                                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-5 h-5 text-red-500" />
                                </button>
                            </div>
                        </div>

                        {/* Ajouter membre */}
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold text-gray-900">Membres ({groupMembers.length})</h4>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="btn-primary text-sm flex items-center gap-2"
                            >
                                <UserPlus className="w-4 h-4" />
                                Ajouter
                            </button>
                        </div>

                        {/* Liste des membres */}
                        {loadingMembers ? (
                            <div className="animate-pulse space-y-3">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="h-16 bg-gray-100 rounded-xl" />
                                ))}
                            </div>
                        ) : groupMembers.length === 0 ? (
                            <p className="text-gray-500 text-sm text-center py-8">
                                Aucun membre dans ce groupe
                            </p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {groupMembers.map((member) => (
                                    <div
                                        key={member.id}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                                    >
                                        <div className="flex items-center gap-3">
                                            {member.contact?.avatar_url ? (
                                                <img
                                                    src={member.contact.avatar_url}
                                                    alt={member.contact.full_name}
                                                    className="w-10 h-10 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0E3A5D] to-[#1e5a8e] flex items-center justify-center">
                                                    <span className="text-white text-sm font-semibold">
                                                        {member.contact?.full_name?.charAt(0) || '?'}
                                                    </span>
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-medium text-gray-900 text-sm">
                                                    {member.contact?.full_name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {member.contact?.company || member.contact?.job_title}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => onRemoveMember(member.id)}
                                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Modal ajouter membre */}
                        {showAddModal && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                                <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
                                    <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                                        <h3 className="text-lg font-bold text-gray-900">Ajouter un membre</h3>
                                        <button
                                            onClick={() => setShowAddModal(false)}
                                            className="p-2 hover:bg-gray-100 rounded-lg"
                                        >
                                            <X className="w-5 h-5 text-gray-500" />
                                        </button>
                                    </div>
                                    <div className="p-6 overflow-y-auto max-h-[60vh]">
                                        {availableContacts.length === 0 ? (
                                            <p className="text-gray-500 text-center py-4">
                                                Tous les contacts sont déjà membres
                                            </p>
                                        ) : (
                                            <div className="space-y-2">
                                                {availableContacts.map((contact) => (
                                                    <button
                                                        key={contact.id}
                                                        onClick={() => {
                                                            onAddMember(selectedGroup.id, contact.id);
                                                            setShowAddModal(false);
                                                        }}
                                                        className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                                                    >
                                                        {contact.avatar_url ? (
                                                            <img
                                                                src={contact.avatar_url}
                                                                alt={contact.full_name}
                                                                className="w-10 h-10 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0E3A5D] to-[#1e5a8e] flex items-center justify-center">
                                                                <span className="text-white text-sm font-semibold">
                                                                    {contact.full_name?.charAt(0)}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div className="text-left">
                                                            <p className="font-medium text-gray-900">{contact.full_name}</p>
                                                            <p className="text-xs text-gray-500">{contact.company}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                        <Layers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Sélectionnez un groupe
                        </h3>
                        <p className="text-gray-500">
                            Cliquez sur un groupe pour voir ses membres
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

// =====================================================
// Objectives Tab
// =====================================================

interface ObjectivesTabProps {
    objectives: EnterpriseObjective[];
    onAddObjective: () => void;
    onEditObjective: (obj: EnterpriseObjective) => void;
    onDeleteObjective: (id: string) => void;
    getProgressPercentage: (current: number, target: number | null) => number;
    getStatusConfig: (status: string) => { label: string; color: string; icon: React.ElementType };
    getPriorityConfig: (priority: string) => { label: string; color: string; icon: React.ElementType };
}

// =====================================================
// Member Objective Modal
// =====================================================

interface MemberObjectiveModalProps {
    member: Contact;
    enterpriseId: string;
    objective: MemberObjective | null;
    onClose: () => void;
    onSuccess: () => void;
}

function MemberObjectiveModal({ member, enterpriseId, objective, onClose, onSuccess }: MemberObjectiveModalProps) {
    const [formData, setFormData] = useState({
        title: objective?.title || '',
        description: objective?.description || '',
        target_value: objective?.target_value?.toString() || '',
        current_value: objective?.current_value?.toString() || '0',
        unit: objective?.unit || 'number',
        currency: objective?.currency || 'EUR',
        start_date: objective?.start_date || '',
        end_date: objective?.end_date || '',
        status: objective?.status || 'not_started',
        priority: objective?.priority || 'medium'
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Non authentifié');

            const payload = {
                member_id: member.id,
                enterprise_id: enterpriseId,
                title: formData.title,
                description: formData.description || null,
                target_value: formData.target_value ? parseFloat(formData.target_value) : null,
                current_value: parseFloat(formData.current_value) || 0,
                unit: formData.unit,
                currency: formData.currency,
                start_date: formData.start_date || null,
                end_date: formData.end_date || null,
                status: formData.status,
                priority: formData.priority,
                created_by: user.id
            };

            if (objective) {
                const { error } = await supabase
                    .from('member_objectives')
                    .update(payload as never)
                    .eq('id', objective.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('member_objectives')
                    .insert(payload as never);
                if (error) throw error;
            }

            onSuccess();
        } catch (error) {
            console.error('Error saving member objective:', error);
            toast.error('Erreur lors de l\'enregistrement');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
                    <h2 className="text-xl font-bold text-gray-900">
                        {objective ? 'Modifier l\'objectif' : `Créer un objectif pour ${member.full_name}`}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Titre
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D]"
                            placeholder="Ex: Atteindre 10 nouveaux clients"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D]"
                            placeholder="Description de l'objectif..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Valeur cible
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.target_value}
                                onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Valeur actuelle
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.current_value}
                                onChange={(e) => setFormData({ ...formData, current_value: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D]"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Unité
                            </label>
                            <select
                                value={formData.unit}
                                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D]"
                            >
                                <option value="number">Nombre</option>
                                <option value="percentage">Pourcentage</option>
                                <option value="currency">Montant</option>
                            </select>
                        </div>
                        {formData.unit === 'currency' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Devise
                                </label>
                                <select
                                    value={formData.currency}
                                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D]"
                                >
                                    <option value="EUR">EUR</option>
                                    <option value="USD">USD</option>
                                    <option value="GBP">GBP</option>
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Date de début
                            </label>
                            <input
                                type="date"
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Date de fin
                            </label>
                            <input
                                type="date"
                                value={formData.end_date}
                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D]"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Statut
                            </label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D]"
                            >
                                <option value="not_started">Non démarré</option>
                                <option value="in_progress">En cours</option>
                                <option value="completed">Terminé</option>
                                <option value="cancelled">Annulé</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Priorité
                            </label>
                            <select
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D]"
                            >
                                <option value="low">Basse</option>
                                <option value="medium">Moyenne</option>
                                <option value="high">Haute</option>
                                <option value="critical">Critique</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 btn-primary disabled:opacity-50"
                        >
                            {loading ? 'Enregistrement...' : objective ? 'Modifier' : 'Créer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// =====================================================
// Member Objectives List Modal
// =====================================================

interface MemberObjectivesListModalProps {
    member: Contact;
    objectives: MemberObjective[];
    enterpriseId: string;
    onClose: () => void;
    onRefresh: () => void;
}

function MemberObjectivesListModal({ member, objectives, enterpriseId, onClose, onRefresh }: MemberObjectivesListModalProps) {
    const [editingObjective, setEditingObjective] = useState<MemberObjective | null>(null);

    const handleDelete = async (objectiveId: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet objectif ?')) return;

        try {
            const { error } = await supabase
                .from('member_objectives')
                .delete()
                .eq('id', objectiveId);

            if (error) throw error;

            onRefresh();
        } catch (error) {
            console.error('Error deleting objective:', error);
            toast.error('Erreur lors de la suppression');
        }
    };

    const formatValue = (value: number | null, unit: string | null, currency: string) => {
        if (value === null) return '-';
        if (unit === 'currency') {
            return new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: currency,
                minimumFractionDigits: 0
            }).format(value);
        }
        if (unit === 'percentage') return `${value}%`;
        return value.toString();
    };

    if (editingObjective) {
        return (
            <MemberObjectiveModal
                member={member}
                enterpriseId={enterpriseId}
                objective={editingObjective}
                onClose={() => setEditingObjective(null)}
                onSuccess={() => {
                    setEditingObjective(null);
                    onRefresh();
                }}
            />
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            Objectifs de {member.full_name}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">{objectives.length} objectif(s)</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {objectives.length === 0 ? (
                        <div className="text-center py-12">
                            <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">Aucun objectif pour ce membre</p>
                        </div>
                    ) : (
                        objectives.map((obj) => (
                            <div key={obj.id} className="bg-gray-50 rounded-xl p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900 mb-1">{obj.title}</h3>
                                        {obj.description && (
                                            <p className="text-sm text-gray-600">{obj.description}</p>
                                        )}
                                    </div>
                                    <div className="flex gap-1 ml-3">
                                        <button
                                            onClick={() => setEditingObjective(obj)}
                                            className="p-2 hover:bg-white rounded-lg text-gray-500 hover:text-[#0E3A5D] transition-colors"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(obj.id)}
                                            className="p-2 hover:bg-white rounded-lg text-gray-500 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-3">
                                    <div>
                                        <span className="text-xs text-gray-500">Progression</span>
                                        <p className="text-sm font-medium text-gray-900">
                                            {formatValue(obj.current_value, obj.unit, obj.currency)} / {formatValue(obj.target_value, obj.unit, obj.currency)}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500">Période</span>
                                        <p className="text-sm font-medium text-gray-900">
                                            {obj.start_date && obj.end_date
                                                ? `${new Date(obj.start_date).toLocaleDateString('fr-FR')} - ${new Date(obj.end_date).toLocaleDateString('fr-FR')}`
                                                : 'Non défini'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                        obj.status === 'completed' ? 'bg-green-100 text-green-700' :
                                        obj.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                        obj.status === 'cancelled' ? 'bg-gray-100 text-gray-700' :
                                        'bg-yellow-100 text-yellow-700'
                                    }`}>
                                        {obj.status === 'completed' ? 'Terminé' :
                                         obj.status === 'in_progress' ? 'En cours' :
                                         obj.status === 'cancelled' ? 'Annulé' :
                                         'Non démarré'}
                                    </span>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                        obj.priority === 'critical' ? 'bg-red-100 text-red-700' :
                                        obj.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                        obj.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                                        'bg-gray-100 text-gray-700'
                                    }`}>
                                        {obj.priority === 'critical' ? 'Critique' :
                                         obj.priority === 'high' ? 'Haute' :
                                         obj.priority === 'medium' ? 'Moyenne' :
                                         'Basse'}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

// =====================================================
// Members Tab Component
// =====================================================

interface MembersTabProps {
    members: Contact[];
    allContacts: Contact[];
    onToggleMember: (contactId: string, isMember: boolean) => void;
    onRefresh: () => void;
    enterpriseId: string;
}

function MembersTab({ members, allContacts, onToggleMember, onRefresh, enterpriseId }: MembersTabProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showContactFormModal, setShowContactFormModal] = useState(false);
    const [addSearchTerm, setAddSearchTerm] = useState('');
    const [assigningObjectiveTo, setAssigningObjectiveTo] = useState<Contact | null>(null);
    const [creatingObjectiveFor, setCreatingObjectiveFor] = useState<Contact | null>(null);
    const [viewingObjectivesFor, setViewingObjectivesFor] = useState<Contact | null>(null);
    const [enterpriseObjectives, setEnterpriseObjectives] = useState<EnterpriseObjective[]>([]);
    const [teamObjectives, setTeamObjectives] = useState<TeamObjective[]>([]);
    const [memberObjectives, setMemberObjectives] = useState<MemberObjective[]>([]);

    useEffect(() => {
        const fetchObjectives = async () => {
            try {
                const [entObjRes, teamObjRes, memberObjRes] = await Promise.all([
                    supabase.from('enterprise_objectives').select('*').eq('enterprise_id', enterpriseId),
                    supabase.from('team_objectives').select('*, teams!inner(enterprise_id)').eq('teams.enterprise_id', enterpriseId),
                    supabase.from('member_objectives').select('*').eq('enterprise_id', enterpriseId)
                ]);

                if (entObjRes.data) setEnterpriseObjectives(entObjRes.data);
                if (teamObjRes.data) setTeamObjectives(teamObjRes.data);
                if (memberObjRes.data) setMemberObjectives(memberObjRes.data);
            } catch (error) {
                console.error('Error fetching objectives:', error);
            }
        };

        fetchObjectives();
    }, [enterpriseId]);

    const handleAssignObjective = async (objectiveType: 'enterprise' | 'team', objectiveId: string, contactId: string) => {
        try {
            const table = objectiveType === 'enterprise' ? 'enterprise_objectives' : 'team_objectives';
            const { error } = await supabase
                .from(table)
                .update({ assigned_to: contactId })
                .eq('id', objectiveId);

            if (error) throw error;

            setAssigningObjectiveTo(null);
            toast.success('Objectif assigné avec succès');

            // Refresh objectives
            const [entObjRes, teamObjRes] = await Promise.all([
                supabase.from('enterprise_objectives').select('*').eq('enterprise_id', enterpriseId),
                supabase.from('team_objectives').select('*, teams!inner(enterprise_id)').eq('teams.enterprise_id', enterpriseId)
            ]);

            if (entObjRes.data) setEnterpriseObjectives(entObjRes.data);
            if (teamObjRes.data) setTeamObjectives(teamObjRes.data);
        } catch (error) {
            console.error('Error assigning objective:', error);
            toast.error('Erreur lors de l\'assignation de l\'objectif');
        }
    };

    const filteredMembers = members.filter((m) =>
        m.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.job_title?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const nonMembers = allContacts.filter(
        (c) => !c.is_member && (
            c.full_name.toLowerCase().includes(addSearchTerm.toLowerCase()) ||
            c.email?.toLowerCase().includes(addSearchTerm.toLowerCase())
        )
    );

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Rechercher un membre..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]"
                    />
                </div>
                <button
                    onClick={() => setShowContactFormModal(true)}
                    className="btn-primary flex items-center gap-2 ml-4"
                >
                    <UserPlus className="w-5 h-5" />
                    Créer un membre
                </button>
            </div>

            {/* Members Grid */}
            {filteredMembers.length === 0 ? (
                <div className="card-premium p-12 text-center">
                    <Users2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Aucun membre
                    </h3>
                    <p className="text-gray-500 mb-6">
                        Créez des contacts en tant que membres de votre entreprise
                    </p>
                    <button onClick={() => setShowContactFormModal(true)} className="btn-primary">
                        Créer un membre
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredMembers.map((member) => (
                        <div
                            key={member.id}
                            className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-lg transition-shadow"
                        >
                            <div className="flex items-start gap-4">
                                {member.avatar_url ? (
                                    <img
                                        src={member.avatar_url}
                                        alt={member.full_name}
                                        className="w-14 h-14 rounded-xl object-cover"
                                    />
                                ) : (
                                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#0E3A5D] to-[#1e5a8e] flex items-center justify-center text-white font-bold text-lg">
                                        {member.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-gray-900 truncate">{member.full_name}</h4>
                                    {member.job_title && (
                                        <p className="text-sm text-gray-500 truncate">{member.job_title}</p>
                                    )}
                                    {member.email && (
                                        <p className="text-xs text-gray-400 truncate mt-1">{member.email}</p>
                                    )}
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => setAssigningObjectiveTo(member)}
                                        className="p-2 hover:bg-amber-50 rounded-lg text-gray-400 hover:text-amber-600 transition-colors"
                                        title="Assigner un objectif existant"
                                    >
                                        <Target className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => onToggleMember(member.id, false)}
                                        className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                                        title="Retirer des membres"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Member Objectives Summary */}
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700">
                                        Objectifs personnels ({memberObjectives.filter(obj => obj.member_id === member.id).length})
                                    </span>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => setCreatingObjectiveFor(member)}
                                            className="px-3 py-1 text-xs bg-[#0E3A5D] text-white rounded-lg hover:bg-[#1e5a8e] transition-colors flex items-center gap-1"
                                        >
                                            <Plus className="w-3 h-3" />
                                            Créer
                                        </button>
                                        {memberObjectives.filter(obj => obj.member_id === member.id).length > 0 && (
                                            <button
                                                onClick={() => setViewingObjectivesFor(member)}
                                                className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                            >
                                                Voir
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {memberObjectives.filter(obj => obj.member_id === member.id).length > 0 && (
                                    <div className="flex gap-1 flex-wrap">
                                        {memberObjectives
                                            .filter(obj => obj.member_id === member.id)
                                            .slice(0, 2)
                                            .map(obj => (
                                                <span key={obj.id} className={`px-2 py-1 rounded text-xs ${
                                                    obj.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                    obj.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                    {obj.title}
                                                </span>
                                            ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Member Modal */}
            {showAddModal && (
                <>
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999]" onClick={() => setShowAddModal(false)} />
                    <div className="fixed inset-0 flex items-center justify-center z-[10000] p-4">
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
                            <div className="flex items-center justify-between p-6 border-b border-gray-100">
                                <h2 className="text-xl font-bold text-gray-900">Ajouter un membre</h2>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                            <div className="p-4 border-b border-gray-100">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="Rechercher un contact..."
                                        value={addSearchTerm}
                                        onChange={(e) => setAddSearchTerm(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]"
                                    />
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                {nonMembers.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        Aucun contact disponible
                                    </div>
                                ) : (
                                    nonMembers.slice(0, 20).map((contact) => (
                                        <div
                                            key={contact.id}
                                            className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors"
                                            onClick={() => {
                                                onToggleMember(contact.id, true);
                                                setAddSearchTerm('');
                                            }}
                                        >
                                            {contact.avatar_url ? (
                                                <img
                                                    src={contact.avatar_url}
                                                    alt={contact.full_name}
                                                    className="w-10 h-10 rounded-lg object-cover"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white font-medium text-sm">
                                                    {contact.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 truncate">{contact.full_name}</p>
                                                {contact.email && (
                                                    <p className="text-sm text-gray-500 truncate">{contact.email}</p>
                                                )}
                                            </div>
                                            <UserPlus className="w-5 h-5 text-gray-400" />
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Contact Form Modal */}
            {showContactFormModal && (
                <AddContactModal
                    onClose={() => setShowContactFormModal(false)}
                    onContactAdded={() => {
                        setShowContactFormModal(false);
                        onRefresh();
                    }}
                    defaultIsMember={true}
                />
            )}

            {/* Assign Objective Modal */}
            {assigningObjectiveTo && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setAssigningObjectiveTo(null)}>
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900">
                                Assigner un objectif à {assigningObjectiveTo.full_name}
                            </h3>
                            <button
                                onClick={() => setAssigningObjectiveTo(null)}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(80vh-100px)]">
                            {/* Objectifs d'entreprise */}
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-[#0E3A5D]" />
                                    Objectifs d'entreprise ({enterpriseObjectives.length})
                                </h4>
                                {enterpriseObjectives.length === 0 ? (
                                    <p className="text-gray-500 text-sm py-4 text-center bg-gray-50 rounded-xl">
                                        Aucun objectif d'entreprise disponible
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {enterpriseObjectives.map((obj) => (
                                            <button
                                                key={obj.id}
                                                onClick={() => handleAssignObjective('enterprise', obj.id, assigningObjectiveTo.id)}
                                                className="w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-xl text-left transition-colors"
                                            >
                                                <p className="font-medium text-gray-900">{obj.title}</p>
                                                {obj.description && (
                                                    <p className="text-sm text-gray-500 mt-1">{obj.description}</p>
                                                )}
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                        obj.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                        obj.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-gray-100 text-gray-700'
                                                    }`}>
                                                        {obj.status === 'completed' ? 'Terminé' :
                                                         obj.status === 'in_progress' ? 'En cours' :
                                                         'Non commencé'}
                                                    </span>
                                                    {obj.assigned_to && (
                                                        <span className="text-xs text-gray-500">
                                                            Déjà assigné
                                                        </span>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Objectifs d'équipe */}
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-violet-600" />
                                    Objectifs d'équipe ({teamObjectives.length})
                                </h4>
                                {teamObjectives.length === 0 ? (
                                    <p className="text-gray-500 text-sm py-4 text-center bg-gray-50 rounded-xl">
                                        Aucun objectif d'équipe disponible
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {teamObjectives.map((obj) => (
                                            <button
                                                key={obj.id}
                                                onClick={() => handleAssignObjective('team', obj.id, assigningObjectiveTo.id)}
                                                className="w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-xl text-left transition-colors"
                                            >
                                                <p className="font-medium text-gray-900">{obj.title}</p>
                                                {obj.description && (
                                                    <p className="text-sm text-gray-500 mt-1">{obj.description}</p>
                                                )}
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                        obj.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                        obj.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-gray-100 text-gray-700'
                                                    }`}>
                                                        {obj.status === 'completed' ? 'Terminé' :
                                                         obj.status === 'in_progress' ? 'En cours' :
                                                         'Non commencé'}
                                                    </span>
                                                    {obj.assigned_to && (
                                                        <span className="text-xs text-gray-500">
                                                            Déjà assigné
                                                        </span>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Member Objective Modal */}
            {creatingObjectiveFor && (
                <MemberObjectiveModal
                    member={creatingObjectiveFor}
                    enterpriseId={enterpriseId}
                    objective={null}
                    onClose={() => setCreatingObjectiveFor(null)}
                    onSuccess={async () => {
                        setCreatingObjectiveFor(null);
                        const { data } = await supabase.from('member_objectives').select('*').eq('enterprise_id', enterpriseId);
                        if (data) setMemberObjectives(data);
                    }}
                />
            )}

            {/* View Member Objectives Modal */}
            {viewingObjectivesFor && (
                <MemberObjectivesListModal
                    member={viewingObjectivesFor}
                    objectives={memberObjectives.filter(obj => obj.member_id === viewingObjectivesFor.id)}
                    enterpriseId={enterpriseId}
                    onClose={() => setViewingObjectivesFor(null)}
                    onRefresh={async () => {
                        const { data } = await supabase.from('member_objectives').select('*').eq('enterprise_id', enterpriseId);
                        if (data) setMemberObjectives(data);
                    }}
                />
            )}
        </div>
    );
}

// =====================================================
// Objectives Tab Component
// =====================================================

function ObjectivesTab({
    objectives,
    onAddObjective,
    onEditObjective,
    onDeleteObjective,
    getProgressPercentage,
    getStatusConfig,
    getPriorityConfig
}: ObjectivesTabProps) {
    const [filterStatus, setFilterStatus] = useState<string>('all');

    const filteredObjectives = filterStatus === 'all'
        ? objectives
        : objectives.filter(o => o.status === filterStatus);

    const formatValue = (value: number | null, unit: string | null, currency: string) => {
        if (value === null) return '-';
        if (unit === 'currency') {
            return new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: currency,
                minimumFractionDigits: 0
            }).format(value);
        }
        if (unit === 'percentage') return `${value}%`;
        return value.toString();
    };

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex gap-2">
                    {['all', 'in_progress', 'completed', 'not_started'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === status
                                    ? 'bg-[#0E3A5D] text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {status === 'all' && 'Tous'}
                            {status === 'in_progress' && 'En cours'}
                            {status === 'completed' && 'Terminés'}
                            {status === 'not_started' && 'Non démarrés'}
                        </button>
                    ))}
                </div>
                <button
                    onClick={onAddObjective}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Nouvel objectif
                </button>
            </div>

            {/* Liste des objectifs */}
            {filteredObjectives.length === 0 ? (
                <div className="card-premium p-12 text-center">
                    <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Aucun objectif
                    </h3>
                    <p className="text-gray-500 mb-6">
                        Définissez des objectifs pour votre entreprise
                    </p>
                    <button onClick={onAddObjective} className="btn-primary">
                        Créer un objectif
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredObjectives.map((obj) => {
                        const progress = getProgressPercentage(obj.current_value, obj.target_value);
                        const statusConfig = getStatusConfig(obj.status);
                        const priorityConfig = getPriorityConfig(obj.priority);
                        const StatusIcon = statusConfig.icon;
                        const PriorityIcon = priorityConfig.icon;

                        return (
                            <div
                                key={obj.id}
                                className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900 mb-1">{obj.title}</h4>
                                        {obj.description && (
                                            <p className="text-sm text-gray-500 line-clamp-2">{obj.description}</p>
                                        )}
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => onEditObjective(obj)}
                                            className="p-2 hover:bg-gray-100 rounded-lg"
                                        >
                                            <Edit className="w-4 h-4 text-gray-500" />
                                        </button>
                                        <button
                                            onClick={() => onDeleteObjective(obj.id)}
                                            className="p-2 hover:bg-red-50 rounded-lg"
                                        >
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </button>
                                    </div>
                                </div>

                                {/* Progress */}
                                <div className="mb-4">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-600">
                                            {formatValue(obj.current_value, obj.unit, obj.currency)}
                                        </span>
                                        <span className="text-gray-400">
                                            / {formatValue(obj.target_value, obj.unit, obj.currency)}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-3">
                                        <div
                                            className={`h-3 rounded-full transition-all ${progress >= 100 ? 'bg-emerald-500' : 'bg-[#0E3A5D]'
                                                }`}
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <p className="text-right text-xs text-gray-500 mt-1">{progress}%</p>
                                </div>

                                {/* Meta */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${statusConfig.color}`}>
                                        <StatusIcon className="w-3 h-3" />
                                        {statusConfig.label}
                                    </span>
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${priorityConfig.color}`}>
                                        <PriorityIcon className="w-3 h-3" />
                                        {priorityConfig.label}
                                    </span>
                                    {obj.end_date && (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(obj.end_date).toLocaleDateString('fr-FR')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// =====================================================
// Modals
// =====================================================

// Enterprise Modal
interface EnterpriseModalProps {
    enterprise: Enterprise | null;
    onClose: () => void;
    onSave: (data: Partial<Enterprise>) => void;
}

function EnterpriseModal({ enterprise, onClose, onSave }: EnterpriseModalProps) {
    const [formData, setFormData] = useState({
        name: enterprise?.name || '',
        description: enterprise?.description || '',
        industry: enterprise?.industry || '',
        size: enterprise?.size || 'pme'
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await onSave(formData);
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">
                        {enterprise ? 'Modifier l\'entreprise' : 'Créer mon entreprise'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nom de l'entreprise *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D]"
                            placeholder="Acme Corp"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D] resize-none"
                            placeholder="Description de l'entreprise..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Secteur d'activité
                        </label>
                        <input
                            type="text"
                            value={formData.industry}
                            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D]"
                            placeholder="Technologie, Finance, etc."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Taille de l'entreprise
                        </label>
                        <select
                            value={formData.size}
                            onChange={(e) => setFormData({ ...formData, size: e.target.value as Enterprise['size'] })}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D]"
                        >
                            <option value="startup">Startup (1-10)</option>
                            <option value="pme">PME (11-250)</option>
                            <option value="eti">ETI (251-5000)</option>
                            <option value="grande_entreprise">Grande entreprise (5000+)</option>
                        </select>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !formData.name}
                            className="flex-1 btn-primary disabled:opacity-50"
                        >
                            {loading ? 'Enregistrement...' : enterprise ? 'Modifier' : 'Créer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Team Modal
interface TeamModalProps {
    team: Team | null;
    parentTeam: Team | null;
    allTeams: Team[];
    onClose: () => void;
    onSave: (data: Partial<Team>) => void;
}

function TeamModal({ team, parentTeam, allTeams, onClose, onSave }: TeamModalProps) {
    const [formData, setFormData] = useState({
        name: team?.name || '',
        description: team?.description || '',
        color: team?.color || '#0E3A5D',
        parent_team_id: team?.parent_team_id || parentTeam?.id || ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await onSave({
            ...formData,
            parent_team_id: formData.parent_team_id || null
        });
        setLoading(false);
    };

    const colors = [
        '#0E3A5D', '#1e5a8e', '#6366F1', '#8B5CF6',
        '#EC4899', '#EF4444', '#F59E0B', '#10B981'
    ];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">
                        {team ? 'Modifier l\'équipe' : parentTeam ? `Nouvelle sous-équipe de ${parentTeam.name}` : 'Nouvelle équipe'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nom de l'équipe *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D]"
                            placeholder="Équipe commerciale"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D] resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Équipe parente
                        </label>
                        <select
                            value={formData.parent_team_id}
                            onChange={(e) => setFormData({ ...formData, parent_team_id: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D]"
                        >
                            <option value="">Aucune (équipe principale)</option>
                            {allTeams.filter(t => t.id !== team?.id).map((t) => (
                                <option key={t.id} value={t.id}>
                                    {'—'.repeat(t.level - 1)} {t.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Couleur
                        </label>
                        <div className="flex gap-2 flex-wrap">
                            {colors.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, color })}
                                    className={`w-10 h-10 rounded-lg transition-transform ${formData.color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                                        }`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !formData.name}
                            className="flex-1 btn-primary disabled:opacity-50"
                        >
                            {loading ? 'Enregistrement...' : team ? 'Modifier' : 'Créer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Group Modal
interface GroupModalProps {
    group: CustomGroup | null;
    onClose: () => void;
    onSave: (data: Partial<CustomGroup>) => void;
}

function GroupModal({ group, onClose, onSave }: GroupModalProps) {
    const [formData, setFormData] = useState({
        name: group?.name || '',
        description: group?.description || '',
        color: group?.color || '#6366F1'
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await onSave(formData);
        setLoading(false);
    };

    const colors = [
        '#6366F1', '#8B5CF6', '#EC4899', '#EF4444',
        '#F59E0B', '#10B981', '#0E3A5D', '#1e5a8e'
    ];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">
                        {group ? 'Modifier le groupe' : 'Nouveau groupe'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nom du groupe *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D]"
                            placeholder="VIP Clients"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D] resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Couleur
                        </label>
                        <div className="flex gap-2 flex-wrap">
                            {colors.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, color })}
                                    className={`w-10 h-10 rounded-lg transition-transform ${formData.color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                                        }`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !formData.name}
                            className="flex-1 btn-primary disabled:opacity-50"
                        >
                            {loading ? 'Enregistrement...' : group ? 'Modifier' : 'Créer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Objective Modal
interface ObjectiveModalProps {
    objective: EnterpriseObjective | null;
    onClose: () => void;
    onSave: (data: Partial<EnterpriseObjective>) => void;
}

function ObjectiveModal({ objective, onClose, onSave }: ObjectiveModalProps) {
    const [formData, setFormData] = useState({
        title: objective?.title || '',
        description: objective?.description || '',
        target_value: objective?.target_value?.toString() || '',
        current_value: objective?.current_value?.toString() || '0',
        unit: objective?.unit || 'number',
        currency: objective?.currency || 'EUR',
        start_date: objective?.start_date || '',
        end_date: objective?.end_date || '',
        status: objective?.status || 'not_started',
        priority: objective?.priority || 'medium'
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await onSave({
            ...formData,
            target_value: formData.target_value ? parseFloat(formData.target_value) : null,
            current_value: parseFloat(formData.current_value) || 0,
            start_date: formData.start_date || null,
            end_date: formData.end_date || null
        } as Partial<EnterpriseObjective>);
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
                    <h2 className="text-xl font-bold text-gray-900">
                        {objective ? 'Modifier l\'objectif' : 'Nouvel objectif'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Titre de l'objectif *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D]"
                            placeholder="Augmenter le CA de 20%"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={2}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D] resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Valeur cible
                            </label>
                            <input
                                type="number"
                                value={formData.target_value}
                                onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D]"
                                placeholder="100"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Valeur actuelle
                            </label>
                            <input
                                type="number"
                                value={formData.current_value}
                                onChange={(e) => setFormData({ ...formData, current_value: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D]"
                                placeholder="0"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Unité
                            </label>
                            <select
                                value={formData.unit}
                                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D]"
                            >
                                <option value="number">Nombre</option>
                                <option value="currency">Devise</option>
                                <option value="percentage">Pourcentage</option>
                                <option value="events">Événements</option>
                                <option value="contacts">Contacts</option>
                            </select>
                        </div>
                        {formData.unit === 'currency' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Devise
                                </label>
                                <select
                                    value={formData.currency}
                                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D]"
                                >
                                    <option value="EUR">EUR</option>
                                    <option value="USD">USD</option>
                                    <option value="XOF">XOF</option>
                                    <option value="XAF">XAF</option>
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Date de début
                            </label>
                            <input
                                type="date"
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Date de fin
                            </label>
                            <input
                                type="date"
                                value={formData.end_date}
                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D]"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Statut
                            </label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D]"
                            >
                                <option value="not_started">Non démarré</option>
                                <option value="in_progress">En cours</option>
                                <option value="completed">Terminé</option>
                                <option value="cancelled">Annulé</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Priorité
                            </label>
                            <select
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D]"
                            >
                                <option value="low">Basse</option>
                                <option value="medium">Moyenne</option>
                                <option value="high">Haute</option>
                                <option value="critical">Critique</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !formData.title}
                            className="flex-1 btn-primary disabled:opacity-50"
                        >
                            {loading ? 'Enregistrement...' : objective ? 'Modifier' : 'Créer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Add Member Modal
interface AddMemberModalProps {
    teamId: string;
    contacts: Contact[];
    existingMemberIds: string[];
    onClose: () => void;
    onSave: (teamId: string, contactId: string, role: string) => void;
}

function AddMemberModal({ teamId, contacts, existingMemberIds, onClose, onSave }: AddMemberModalProps) {
    const [selectedContact, setSelectedContact] = useState('');
    const [role, setRole] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddContactModal, setShowAddContactModal] = useState(false);
    const [newContactId, setNewContactId] = useState<string | null>(null);
    const [newContactRole, setNewContactRole] = useState('');

    const availableContacts = contacts.filter(c =>
        !existingMemberIds.includes(c.id) &&
        (c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.company?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedContact) {
            onSave(teamId, selectedContact, role);
        }
    };

    const handleContactCreated = async (contactId?: string) => {
        setShowAddContactModal(false);
        if (contactId) {
            setNewContactId(contactId);
        }
    };

    const handleAddNewContactWithRole = () => {
        if (newContactId) {
            onSave(teamId, newContactId, newContactRole);
            setNewContactId(null);
            setNewContactRole('');
        }
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900">
                            {newContactId ? 'Définir le rôle' : 'Ajouter un membre'}
                        </h3>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {newContactId ? (
                        <div className="p-6 space-y-4">
                            <p className="text-gray-600">Contact créé avec succès. Définissez maintenant son rôle dans l'équipe.</p>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Rôle dans l'équipe (optionnel)
                                </label>
                                <input
                                    type="text"
                                    value={newContactRole}
                                    onChange={(e) => setNewContactRole(e.target.value)}
                                    placeholder="Ex: Chef de projet, Développeur..."
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D]"
                                    autoFocus
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setNewContactId(null);
                                        setNewContactRole('');
                                    }}
                                    className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Retour
                                </button>
                                <button
                                    type="button"
                                    onClick={handleAddNewContactWithRole}
                                    className="flex-1 btn-primary"
                                >
                                    Ajouter à l'équipe
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Rechercher un contact..."
                            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D]"
                        />
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-2">
                        {availableContacts.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">Aucun contact disponible</p>
                        ) : (
                            availableContacts.map((contact) => (
                                <button
                                    key={contact.id}
                                    type="button"
                                    onClick={() => setSelectedContact(contact.id)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${selectedContact === contact.id
                                            ? 'bg-[#0E3A5D] text-white'
                                            : 'bg-gray-50 hover:bg-gray-100'
                                        }`}
                                >
                                    {contact.avatar_url ? (
                                        <img
                                            src={contact.avatar_url}
                                            alt={contact.full_name}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedContact === contact.id
                                                ? 'bg-white/20'
                                                : 'bg-gradient-to-br from-[#0E3A5D] to-[#1e5a8e]'
                                            }`}>
                                            <span className={`text-sm font-semibold ${selectedContact === contact.id ? 'text-white' : 'text-white'
                                                }`}>
                                                {contact.full_name?.charAt(0)}
                                            </span>
                                        </div>
                                    )}
                                    <div className="text-left">
                                        <p className={`font-medium ${selectedContact === contact.id ? 'text-white' : 'text-gray-900'
                                            }`}>
                                            {contact.full_name}
                                        </p>
                                        <p className={`text-xs ${selectedContact === contact.id ? 'text-white/70' : 'text-gray-500'
                                            }`}>
                                            {contact.company || contact.job_title}
                                        </p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>

                    {selectedContact && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Rôle dans l'équipe (optionnel)
                            </label>
                            <input
                                type="text"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                placeholder="Ex: Chef de projet, Développeur..."
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D]"
                            />
                        </div>
                    )}

                        <div className="border-t border-gray-200 pt-4 mt-4">
                            <button
                                type="button"
                                onClick={() => setShowAddContactModal(true)}
                                className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <Users className="w-5 h-5" />
                                Créer un nouveau contact
                            </button>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={!selectedContact}
                                className="flex-1 btn-primary disabled:opacity-50"
                            >
                                Ajouter
                            </button>
                        </div>
                    </form>
                    )}
                </div>
            </div>

            {showAddContactModal && (
                <AddContactModal
                    onClose={() => setShowAddContactModal(false)}
                    onContactAdded={handleContactCreated}
                    defaultIsMember={true}
                />
            )}
        </>
    );
}

// Team Objective Modal
interface TeamObjectiveModalProps {
    teamId: string;
    objective: TeamObjective | null;
    enterpriseObjectives: EnterpriseObjective[];
    contacts: Contact[];
    onClose: () => void;
}

function TeamObjectiveModal({
    teamId,
    objective,
    enterpriseObjectives,
    contacts,
    onClose
}: TeamObjectiveModalProps) {
    const [formData, setFormData] = useState({
        title: objective?.title || '',
        description: objective?.description || '',
        target_value: objective?.target_value?.toString() || '',
        current_value: objective?.current_value?.toString() || '0',
        unit: objective?.unit || 'number',
        currency: objective?.currency || 'EUR',
        start_date: objective?.start_date || '',
        end_date: objective?.end_date || '',
        status: objective?.status || 'not_started',
        priority: objective?.priority || 'medium',
        enterprise_objective_id: objective?.enterprise_objective_id || '',
        assigned_to: objective?.assigned_to || ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Non authentifié');

            const payload = {
                team_id: teamId,
                title: formData.title,
                description: formData.description || null,
                target_value: formData.target_value ? parseFloat(formData.target_value) : null,
                current_value: parseFloat(formData.current_value) || 0,
                unit: formData.unit,
                currency: formData.currency,
                start_date: formData.start_date || null,
                end_date: formData.end_date || null,
                status: formData.status,
                priority: formData.priority,
                enterprise_objective_id: formData.enterprise_objective_id || null,
                assigned_to: formData.assigned_to || null,
                created_by: user.id
            };

            if (objective) {
                const { error } = await supabase
                    .from('team_objectives')
                    .update(payload as never)
                    .eq('id', objective.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('team_objectives')
                    .insert(payload as never);
                if (error) throw error;
            }

            onClose();
        } catch (error) {
            console.error('Error saving team objective:', error);
            toast.error('Erreur lors de l\'enregistrement');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
                    <h2 className="text-xl font-bold text-gray-900">
                        {objective ? 'Modifier l\'objectif' : 'Nouvel objectif d\'équipe'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Lier à un objectif d'entreprise */}
                    {enterpriseObjectives.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Lié à un objectif global
                            </label>
                            <select
                                value={formData.enterprise_objective_id}
                                onChange={(e) => setFormData({ ...formData, enterprise_objective_id: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D]"
                            >
                                <option value="">Aucun</option>
                                {enterpriseObjectives.map((obj) => (
                                    <option key={obj.id} value={obj.id}>{obj.title}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Titre *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D]"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Cible
                            </label>
                            <input
                                type="number"
                                value={formData.target_value}
                                onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Actuel
                            </label>
                            <input
                                type="number"
                                value={formData.current_value}
                                onChange={(e) => setFormData({ ...formData, current_value: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D]"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Responsable (Membres de l'entreprise)
                        </label>
                        <select
                            value={formData.assigned_to}
                            onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D]"
                        >
                            <option value="">Non assigné</option>
                            {contacts.filter(c => c.is_member).map((contact) => (
                                <option key={contact.id} value={contact.id}>{contact.full_name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Statut
                            </label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D]"
                            >
                                <option value="not_started">Non démarré</option>
                                <option value="in_progress">En cours</option>
                                <option value="completed">Terminé</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Priorité
                            </label>
                            <select
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D]"
                            >
                                <option value="low">Basse</option>
                                <option value="medium">Moyenne</option>
                                <option value="high">Haute</option>
                                <option value="critical">Critique</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !formData.title}
                            className="flex-1 btn-primary disabled:opacity-50"
                        >
                            {loading ? 'Enregistrement...' : objective ? 'Modifier' : 'Créer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
