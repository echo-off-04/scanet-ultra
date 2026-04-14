'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Building2, Users, Target, Plus, Search, ChevronRight, ChevronDown,
    Edit, Trash2, X, UserPlus, FolderPlus, Flag,
    TrendingUp, Calendar, CheckCircle, Clock, AlertCircle, Layers,
    Settings, BarChart3, Users2
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { AddContactModal } from './AddContactModal';

// =====================================================
// Types
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

interface Enterprise {
    id: string;
    name: string;
    description: string | null;
    industry: string | null;
    size: string;
    logo_url: string | null;
    owner_id: string;
    created_at: string;
}

interface Team {
    id: string;
    enterprise_id: string;
    name: string;
    description: string | null;
    color: string;
    level: number;
    parent_team_id: string | null;
    members_count?: number;
    sub_teams?: Team[];
}

interface TeamMember {
    id: string;
    team_id: string;
    contact_id: string;
    role: string | null;
    contact?: Contact;
}

interface CustomGroup {
    id: string;
    enterprise_id: string;
    name: string;
    description: string | null;
    color: string;
    members_count?: number;
}

interface CustomGroupMember {
    id: string;
    group_id: string;
    contact_id: string;
    contact?: Contact;
}

interface EnterpriseObjective {
    id: string;
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
    assigned_to: string | null;
}

interface TeamObjective {
    id: string;
    team_id: string;
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
    assigned_to: string | null;
    enterprise_objective_id: string | null;
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
}

type TabType = 'overview' | 'teams' | 'groups' | 'members' | 'objectives';

// =====================================================
// Main Component
// =====================================================

export function Enterprise() {
    const { user } = useAuth();
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

    const [showEnterpriseModal, setShowEnterpriseModal] = useState(false);
    const [showTeamModal, setShowTeamModal] = useState(false);
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [showObjectiveModal, setShowObjectiveModal] = useState(false);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [showTeamObjectiveModal, setShowTeamObjectiveModal] = useState(false);

    const [editingTeam, setEditingTeam] = useState<Team | null>(null);
    const [editingGroup, setEditingGroup] = useState<CustomGroup | null>(null);
    const [editingObjective, setEditingObjective] = useState<EnterpriseObjective | null>(null);
    const [editingTeamObjective, setEditingTeamObjective] = useState<TeamObjective | null>(null);
    const [parentTeamForNew, setParentTeamForNew] = useState<Team | null>(null);

    // Data Fetching
    const fetchEnterprise = useCallback(async () => {
        try {
            const res = await fetch('/api/enterprise');
            if (!res.ok) return;
            const data = await res.json();
            const list = data.enterprises || (Array.isArray(data) ? data : [data]);
            setEnterprises(list.filter(Boolean));
            if (list.length > 0 && !enterprise) setEnterprise(list[0]);
        } catch (error) { console.error('Error fetching enterprise:', error); }
    }, [enterprise]);

    const fetchTeams = useCallback(async () => {
        if (!enterprise) return;
        try {
            const res = await fetch(`/api/enterprise/teams?enterprise_id=${enterprise.id}`);
            if (!res.ok) return;
            const data = await res.json();
            setTeams(data.teams || data || []);
        } catch (error) { console.error('Error fetching teams:', error); }
    }, [enterprise]);

    const fetchCustomGroups = useCallback(async () => {
        if (!enterprise) return;
        try {
            const res = await fetch(`/api/enterprise/groups?enterprise_id=${enterprise.id}`);
            if (!res.ok) return;
            const data = await res.json();
            setCustomGroups(data.groups || data || []);
        } catch (error) { console.error('Error fetching groups:', error); }
    }, [enterprise]);

    const fetchEnterpriseObjectives = useCallback(async () => {
        if (!enterprise) return;
        try {
            const res = await fetch(`/api/enterprise/objectives?enterprise_id=${enterprise.id}`);
            if (!res.ok) return;
            const data = await res.json();
            setEnterpriseObjectives(data.objectives || data || []);
        } catch (error) { console.error('Error fetching objectives:', error); }
    }, [enterprise]);

    const fetchContacts = useCallback(async () => {
        try {
            const res = await fetch('/api/contacts');
            if (!res.ok) return;
            const data = await res.json();
            setContacts(data.contacts || data || []);
        } catch (error) { console.error('Error fetching contacts:', error); }
    }, []);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([fetchEnterprise(), fetchContacts()]);
            setLoading(false);
        };
        if (user) loadData();
    }, [user, fetchEnterprise, fetchContacts]);

    useEffect(() => {
        if (enterprise) {
            Promise.all([fetchTeams(), fetchCustomGroups(), fetchEnterpriseObjectives()]);
        }
    }, [enterprise, fetchTeams, fetchCustomGroups, fetchEnterpriseObjectives]);

    // CRUD - Enterprise
    const handleSaveEnterprise = async (data: Partial<Enterprise>) => {
        try {
            const method = enterprise ? 'PUT' : 'POST';
            const body = enterprise ? { ...data, id: enterprise.id } : data;
            const res = await fetch('/api/enterprise', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            if (!res.ok) throw new Error('Failed');
            await fetchEnterprise();
            setShowEnterpriseModal(false);
        } catch { toast.error("Erreur lors de l'enregistrement"); }
    };

    // CRUD - Teams
    const handleSaveTeam = async (data: Partial<Team>) => {
        try {
            if (!enterprise) return;
            if (editingTeam) {
                const res = await fetch(`/api/enterprise/teams/${editingTeam.id}`, {
                    method: 'PUT', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                if (!res.ok) throw new Error('Failed');
            } else {
                const res = await fetch('/api/enterprise/teams', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...data, enterprise_id: enterprise.id })
                });
                if (!res.ok) throw new Error('Failed');
            }
            await fetchTeams();
            setShowTeamModal(false);
            setEditingTeam(null);
            setParentTeamForNew(null);
        } catch { toast.error("Erreur lors de l'enregistrement"); }
    };

    const handleDeleteTeam = async (teamId: string) => {
        if (!confirm('Supprimer cette équipe et toutes ses sous-équipes ?')) return;
        try {
            const res = await fetch(`/api/enterprise/teams/${teamId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed');
            await fetchTeams();
            if (selectedTeam?.id === teamId) setSelectedTeam(null);
        } catch { toast.error('Erreur lors de la suppression'); }
    };

    // CRUD - Team Members
    const handleAddTeamMember = async (teamId: string, contactId: string, role: string) => {
        try {
            const res = await fetch(`/api/enterprise/teams/${teamId}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'addMember', contact_id: contactId, role: role || null })
            });
            if (!res.ok) throw new Error('Failed');
            await fetchTeams();
            setShowAddMemberModal(false);
        } catch { toast.error("Erreur lors de l'ajout du membre"); }
    };

    const handleRemoveTeamMember = async (memberId: string) => {
        if (!confirm("Retirer ce membre de l'équipe ?")) return;
        try {
            const res = await fetch(`/api/enterprise/teams/${selectedTeam?.id}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'removeMember', member_id: memberId })
            });
            if (!res.ok) throw new Error('Failed');
            await fetchTeams();
        } catch { console.error('Error removing member'); }
    };

    const handleUpdateTeamMemberRole = async (memberId: string, newRole: string) => {
        try {
            const res = await fetch(`/api/enterprise/teams/${selectedTeam?.id}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'updateMemberRole', member_id: memberId, role: newRole || null })
            });
            if (!res.ok) throw new Error('Failed');
            await fetchTeams();
        } catch { toast.error('Erreur lors de la mise à jour du rôle'); }
    };

    // CRUD - Custom Groups
    const handleSaveGroup = async (data: Partial<CustomGroup>) => {
        try {
            if (!enterprise) return;
            if (editingGroup) {
                const res = await fetch(`/api/enterprise/groups/${editingGroup.id}`, {
                    method: 'PUT', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                if (!res.ok) throw new Error('Failed');
            } else {
                const res = await fetch('/api/enterprise/groups', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...data, enterprise_id: enterprise.id })
                });
                if (!res.ok) throw new Error('Failed');
            }
            await fetchCustomGroups();
            setShowGroupModal(false);
            setEditingGroup(null);
        } catch { toast.error("Erreur lors de l'enregistrement"); }
    };

    const handleDeleteGroup = async (groupId: string) => {
        if (!confirm('Supprimer ce groupe ?')) return;
        try {
            const res = await fetch(`/api/enterprise/groups/${groupId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed');
            await fetchCustomGroups();
            if (selectedGroup?.id === groupId) setSelectedGroup(null);
        } catch { console.error('Error deleting group'); }
    };

    const handleAddGroupMember = async (groupId: string, contactId: string) => {
        try {
            const res = await fetch(`/api/enterprise/groups/${groupId}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'addMember', contact_id: contactId })
            });
            if (!res.ok) throw new Error('Failed');
            await fetchCustomGroups();
        } catch { console.error('Error adding group member'); }
    };

    const handleRemoveGroupMember = async (memberId: string) => {
        try {
            const res = await fetch(`/api/enterprise/groups/${selectedGroup?.id}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'removeMember', member_id: memberId })
            });
            if (!res.ok) throw new Error('Failed');
            await fetchCustomGroups();
        } catch { console.error('Error removing group member'); }
    };

    // CRUD - Objectives
    const handleSaveObjective = async (data: Partial<EnterpriseObjective>) => {
        try {
            if (!enterprise) return;
            if (editingObjective) {
                const res = await fetch(`/api/enterprise/objectives/${editingObjective.id}`, {
                    method: 'PUT', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                if (!res.ok) throw new Error('Failed');
            } else {
                const res = await fetch('/api/enterprise/objectives', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...data, enterprise_id: enterprise.id })
                });
                if (!res.ok) throw new Error('Failed');
            }
            await fetchEnterpriseObjectives();
            setShowObjectiveModal(false);
            setEditingObjective(null);
        } catch { toast.error("Erreur lors de l'enregistrement"); }
    };

    const handleDeleteObjective = async (objectiveId: string) => {
        if (!confirm('Supprimer cet objectif ?')) return;
        try {
            const res = await fetch(`/api/enterprise/objectives/${objectiveId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed');
            await fetchEnterpriseObjectives();
        } catch { console.error('Error deleting objective'); }
    };

    // Helpers
    const getTeamHierarchy = (teamsList: Team[]): Team[] => {
        const topLevel = teamsList.filter(t => !t.parent_team_id);
        const addSubs = (team: Team): Team => ({
            ...team,
            sub_teams: teamsList.filter(t => t.parent_team_id === team.id).map(addSubs)
        });
        return topLevel.map(addSubs);
    };

    const getProgressPercentage = (current: number, target: number | null): number => {
        if (!target || target === 0) return 0;
        return Math.min(100, Math.round((current / target) * 100));
    };

    const getPriorityConfig = (priority: string) => {
        switch (priority) {
            case 'critical': return { label: 'Critique', color: 'bg-red-100 text-red-700', icon: AlertCircle };
            case 'high': return { label: 'Haute', color: 'bg-orange-100 text-orange-700', icon: TrendingUp };
            case 'medium': return { label: 'Moyenne', color: 'bg-blue-100 text-blue-700', icon: Flag };
            default: return { label: 'Basse', color: 'bg-gray-100 text-gray-700', icon: Clock };
        }
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'completed': return { label: 'Terminé', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle };
            case 'in_progress': return { label: 'En cours', color: 'bg-blue-100 text-blue-700', icon: TrendingUp };
            case 'cancelled': return { label: 'Annulé', color: 'bg-red-100 text-red-700', icon: X };
            default: return { label: 'Non démarré', color: 'bg-gray-100 text-gray-700', icon: Clock };
        }
    };

    const kpis = {
        totalTeams: teams.length,
        totalMembers: teams.reduce((sum, t) => sum + (t.members_count || 0), 0),
        totalGroups: customGroups.length,
        objectivesCompleted: enterpriseObjectives.filter(o => o.status === 'completed').length,
        objectivesInProgress: enterpriseObjectives.filter(o => o.status === 'in_progress').length,
        objectivesTotal: enterpriseObjectives.length
    };

    // Render
    if (loading) {
        return (
            <div className="space-y-8 max-w-7xl mx-auto">
                <div className="animate-pulse space-y-6">
                    <div className="h-12 bg-gray-200 rounded-2xl w-1/3" />
                    <div className="grid grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-200 rounded-3xl" />)}
                    </div>
                </div>
            </div>
        );
    }

    if (!enterprise && enterprises.length === 0) {
        return (
            <div className="space-y-8 max-w-7xl mx-auto">
                <div className="bg-white rounded-3xl border border-gray-200 p-16 text-center max-w-2xl mx-auto">
                    <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <Building2 className="w-12 h-12 text-gray-400" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Configurez votre entreprise</h2>
                    <p className="text-gray-500 mb-8 text-lg">Commencez par créer votre entreprise pour gérer vos équipes, définir des groupes personnalisés et suivre vos objectifs.</p>
                    <button onClick={() => setShowEnterpriseModal(true)} className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-br from-[#0E3A5D] to-[#1e5a8e] text-white rounded-full hover:from-gray-800 hover:to-gray-700 transition-all font-semibold shadow-2xl">
                        <Plus className="w-5 h-5" />
                        Créer mon entreprise
                    </button>
                </div>
                {showEnterpriseModal && <EnterpriseModal enterprise={null} onClose={() => setShowEnterpriseModal(false)} onSave={handleSaveEnterprise} />}
            </div>
        );
    }

    if (!enterprise) return null;

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div className="flex items-center gap-4 relative">
                    {enterprise.logo_url ? (
                        <img src={enterprise.logo_url} alt={enterprise.name} className="w-20 h-20 rounded-3xl object-cover border-2 border-gray-200" />
                    ) : (
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center shadow-lg">
                            <Building2 className="w-10 h-10 text-white" />
                        </div>
                    )}
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900">{enterprise.name}</h1>
                            {enterprises.length > 1 && (
                                <button onClick={() => setShowEnterpriseSelector(!showEnterpriseSelector)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                                    <ChevronDown className="w-5 h-5 text-gray-500" />
                                </button>
                            )}
                        </div>
                        {enterprise.industry && <p className="text-lg text-gray-500 mt-1">{enterprise.industry}</p>}
                    </div>

                    {showEnterpriseSelector && enterprises.length > 1 && (
                        <div className="absolute top-24 left-0 bg-white rounded-3xl shadow-2xl border border-gray-200 p-6 z-50 w-96">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-gray-900">Vos entreprises</h3>
                                <button onClick={() => setShowEnterpriseSelector(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
                            </div>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {enterprises.map((ent) => (
                                    <button key={ent.id} onClick={() => { setEnterprise(ent); setShowEnterpriseSelector(false); }}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${ent.id === enterprise.id ? 'bg-blue-50 border-2 border-blue-500' : 'hover:bg-gray-50 border-2 border-transparent'}`}>
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#0E3A5D] to-[#1e5a8e] flex items-center justify-center">
                                            <Building2 className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <div className="font-medium text-gray-900">{ent.name}</div>
                                            {ent.industry && <div className="text-xs text-gray-500">{ent.industry}</div>}
                                        </div>
                                        {ent.id === enterprise.id && <CheckCircle className="w-5 h-5 text-blue-600" />}
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => { setShowEnterpriseModal(true); setShowEnterpriseSelector(false); }}
                                className="w-full mt-3 pt-3 border-t border-gray-200 text-left px-3 py-2 hover:bg-gray-50 rounded-lg flex items-center gap-2 text-blue-600 font-medium">
                                <Plus className="w-4 h-4" /> Créer une nouvelle entreprise
                            </button>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setShowEnterpriseModal(true)} className="p-2 hover:bg-gray-100 rounded-lg"><Settings className="w-5 h-5 text-gray-500" /></button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                <KpiCard icon={Users} label="Équipes" value={kpis.totalTeams} variant="dark" />
                <KpiCard icon={Users2} label="Membres" value={kpis.totalMembers} color="#10b981" />
                <KpiCard icon={Layers} label="Groupes" value={kpis.totalGroups} color="#6366f1" />
                <KpiCard icon={Target} label="Objectifs" value={`${kpis.objectivesCompleted}/${kpis.objectivesTotal}`} color="#f59e0b" />
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-3xl border border-gray-200 p-2 w-full overflow-x-auto scrollbar-hide">
                <div className="flex gap-2 min-w-max">
                    {([
                        { key: 'overview', label: "Vue d'ensemble", icon: BarChart3 },
                        { key: 'teams', label: 'Équipes', icon: Users },
                        { key: 'groups', label: 'Groupes', icon: Layers },
                        { key: 'members', label: 'Membres', icon: Users2 },
                        { key: 'objectives', label: 'Objectifs', icon: Target }
                    ] as const).map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold transition-all whitespace-nowrap ${activeTab === tab.key ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'}`}>
                                <Icon className="w-4 h-4" /> {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content */}
            {activeTab === 'overview' && <OverviewTab teams={teams} customGroups={customGroups} objectives={enterpriseObjectives}
                onTeamSelect={(t) => { setSelectedTeam(t); setActiveTab('teams'); }} onGroupSelect={(g) => { setSelectedGroup(g); setActiveTab('groups'); }}
                getProgressPercentage={getProgressPercentage} getStatusConfig={getStatusConfig} getPriorityConfig={getPriorityConfig} />}

            {activeTab === 'teams' && <TeamsTab teams={getTeamHierarchy(teams)} allTeams={teams} selectedTeam={selectedTeam} onSelectTeam={setSelectedTeam}
                onAddTeam={() => { setEditingTeam(null); setParentTeamForNew(null); setShowTeamModal(true); }}
                onAddSubTeam={(p) => { setEditingTeam(null); setParentTeamForNew(p); setShowTeamModal(true); }}
                onEditTeam={(t) => { setEditingTeam(t); setShowTeamModal(true); }} onDeleteTeam={handleDeleteTeam}
                onAddMember={() => setShowAddMemberModal(true)} onRemoveMember={handleRemoveTeamMember} onUpdateMemberRole={handleUpdateTeamMemberRole}
                onAddTeamObjective={() => { setEditingTeamObjective(null); setShowTeamObjectiveModal(true); }} contacts={contacts} enterpriseId={enterprise.id} />}

            {activeTab === 'groups' && <GroupsTab groups={customGroups} selectedGroup={selectedGroup} onSelectGroup={setSelectedGroup}
                onAddGroup={() => { setEditingGroup(null); setShowGroupModal(true); }} onEditGroup={(g) => { setEditingGroup(g); setShowGroupModal(true); }}
                onDeleteGroup={handleDeleteGroup} onAddMember={handleAddGroupMember} onRemoveMember={handleRemoveGroupMember} contacts={contacts} />}

            {activeTab === 'members' && <MembersTab members={contacts.filter(c => c.is_member)} allContacts={contacts}
                onToggleMember={async (cid, isMember) => {
                    try {
                        await fetch(`/api/contacts/${cid}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_member: isMember }) });
                        await fetchContacts();
                    } catch { toast.error('Erreur lors de la mise à jour'); }
                }} onRefresh={fetchContacts} enterpriseId={enterprise.id} />}

            {activeTab === 'objectives' && <ObjectivesTab objectives={enterpriseObjectives}
                onAddObjective={() => { setEditingObjective(null); setShowObjectiveModal(true); }}
                onEditObjective={(o) => { setEditingObjective(o); setShowObjectiveModal(true); }}
                onDeleteObjective={handleDeleteObjective} getProgressPercentage={getProgressPercentage} getStatusConfig={getStatusConfig} getPriorityConfig={getPriorityConfig} />}

            {/* Modals */}
            {showEnterpriseModal && <EnterpriseModal enterprise={enterprise} onClose={() => setShowEnterpriseModal(false)} onSave={handleSaveEnterprise} />}
            {showTeamModal && <TeamModal team={editingTeam} parentTeam={parentTeamForNew} allTeams={teams} onClose={() => { setShowTeamModal(false); setEditingTeam(null); setParentTeamForNew(null); }} onSave={handleSaveTeam} />}
            {showGroupModal && <GroupModal group={editingGroup} onClose={() => { setShowGroupModal(false); setEditingGroup(null); }} onSave={handleSaveGroup} />}
            {showObjectiveModal && <ObjectiveModal objective={editingObjective} onClose={() => { setShowObjectiveModal(false); setEditingObjective(null); }} onSave={handleSaveObjective} />}
            {showAddMemberModal && selectedTeam && <AddMemberModal teamId={selectedTeam.id} contacts={contacts} existingMemberIds={[]} onClose={() => setShowAddMemberModal(false)} onSave={handleAddTeamMember} />}
            {showTeamObjectiveModal && selectedTeam && <TeamObjectiveModal teamId={selectedTeam.id} objective={editingTeamObjective} enterpriseObjectives={enterpriseObjectives} contacts={contacts} onClose={() => { setShowTeamObjectiveModal(false); setEditingTeamObjective(null); }} />}
        </div>
    );
}

// KPI Card component
function KpiCard({ icon: Icon, label, value, color, variant }: { icon: React.ElementType; label: string; value: string | number; color?: string; variant?: 'dark' }) {
    const isDark = variant === 'dark';
    return (
        <div className="group relative overflow-hidden">
            <div className={`relative rounded-xl lg:rounded-2xl p-4 lg:p-5 border transition-all duration-300 hover:-translate-y-0.5 overflow-hidden ${isDark ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700/50 shadow-[0_4px_16px_rgba(0,0,0,0.3)]' : 'bg-white border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.08)]'}`}>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2 lg:mb-3">
                        <div className={`p-1.5 rounded-lg ${isDark ? 'bg-white/10' : ''}`} style={!isDark ? { backgroundColor: `${color}15` } : undefined}>
                            <Icon className="w-3.5 h-3.5" strokeWidth={2} style={{ color: isDark ? 'rgba(255,255,255,0.9)' : color }} />
                        </div>
                        <p className={`text-[10px] lg:text-xs font-medium uppercase tracking-wider ${isDark ? 'text-white/70' : 'text-gray-500'}`}>{label}</p>
                    </div>
                    <h3 className={`text-2xl lg:text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</h3>
                </div>
            </div>
        </div>
    );
}

// Overview Tab
function OverviewTab({ teams, customGroups, objectives, onTeamSelect, onGroupSelect, getProgressPercentage, getPriorityConfig }: {
    teams: Team[]; customGroups: CustomGroup[]; objectives: EnterpriseObjective[];
    onTeamSelect: (t: Team) => void; onGroupSelect: (g: CustomGroup) => void;
    getProgressPercentage: (c: number, t: number | null) => number;
    getStatusConfig: (s: string) => { label: string; color: string; icon: React.ElementType };
    getPriorityConfig: (p: string) => { label: string; color: string; icon: React.ElementType };
}) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-amber-600" />Objectifs en cours</h3>
                {objectives.length === 0 ? <p className="text-gray-500 text-sm">Aucun objectif défini</p> : (
                    <div className="space-y-4">
                        {objectives.slice(0, 5).map((obj) => {
                            const progress = getProgressPercentage(obj.current_value, obj.target_value);
                            const pc = getPriorityConfig(obj.priority);
                            const PI = pc.icon;
                            return (
                                <div key={obj.id} className="p-4 bg-gray-50 rounded-xl">
                                    <div className="flex items-start justify-between mb-2">
                                        <h4 className="font-medium text-gray-900 text-sm">{obj.title}</h4>
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${pc.color}`}><PI className="w-3 h-3" />{pc.label}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2"><div className="bg-[#0E3A5D] h-2 rounded-full transition-all" style={{ width: `${progress}%` }} /></div>
                                    <p className="text-xs text-gray-500">{progress}% complété</p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-blue-600" />Équipes</h3>
                {teams.length === 0 ? <p className="text-gray-500 text-sm">Aucune équipe créée</p> : (
                    <div className="space-y-3">
                        {teams.slice(0, 5).map((team) => (
                            <button key={team.id} onClick={() => onTeamSelect(team)} className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${team.color}20` }}>
                                        <Users className="w-5 h-5" style={{ color: team.color }} />
                                    </div>
                                    <div className="text-left"><p className="font-medium text-gray-900 text-sm">{team.name}</p><p className="text-xs text-gray-500">{team.members_count || 0} membres</p></div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Layers className="w-5 h-5 text-violet-600" />Groupes personnalisés</h3>
                {customGroups.length === 0 ? <p className="text-gray-500 text-sm">Aucun groupe créé</p> : (
                    <div className="space-y-3">
                        {customGroups.slice(0, 5).map((group) => (
                            <button key={group.id} onClick={() => onGroupSelect(group)} className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${group.color}20` }}>
                                        <Layers className="w-5 h-5" style={{ color: group.color }} />
                                    </div>
                                    <div className="text-left"><p className="font-medium text-gray-900 text-sm">{group.name}</p><p className="text-xs text-gray-500">{group.members_count || 0} membres</p></div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-emerald-600" />Statistiques</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-emerald-50 rounded-xl"><p className="text-2xl font-bold text-emerald-600">{objectives.filter(o => o.status === 'completed').length}</p><p className="text-xs text-gray-600">Objectifs atteints</p></div>
                    <div className="text-center p-4 bg-blue-50 rounded-xl"><p className="text-2xl font-bold text-blue-600">{objectives.filter(o => o.status === 'in_progress').length}</p><p className="text-xs text-gray-600">En progression</p></div>
                    <div className="text-center p-4 bg-amber-50 rounded-xl"><p className="text-2xl font-bold text-amber-600">{teams.filter(t => t.level === 1).length}</p><p className="text-xs text-gray-600">Équipes principales</p></div>
                    <div className="text-center p-4 bg-violet-50 rounded-xl"><p className="text-2xl font-bold text-violet-600">{teams.filter(t => t.level > 1).length}</p><p className="text-xs text-gray-600">Sous-équipes</p></div>
                </div>
            </div>
        </div>
    );
}

// Teams Tab
function TeamsTab({ teams, allTeams, selectedTeam, onSelectTeam, onAddTeam, onAddSubTeam, onEditTeam, onDeleteTeam, onAddMember, onRemoveMember, onUpdateMemberRole, onAddTeamObjective, contacts, enterpriseId }: {
    teams: Team[]; allTeams: Team[]; selectedTeam: Team | null; onSelectTeam: (t: Team | null) => void; onAddTeam: () => void; onAddSubTeam: (p: Team) => void; onEditTeam: (t: Team) => void; onDeleteTeam: (id: string) => void; onAddMember: () => void; onRemoveMember: (id: string) => void; onUpdateMemberRole: (id: string, role: string) => void; onAddTeamObjective: () => void; contacts: Contact[]; enterpriseId: string;
}) {
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [teamObjectives, setTeamObjectives] = useState<TeamObjective[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
    const [editingMemberRole, setEditingMemberRole] = useState('');
    const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());

    const toggleTeamExpand = (teamId: string) => {
        setExpandedTeams(prev => { const s = new Set(prev); s.has(teamId) ? s.delete(teamId) : s.add(teamId); return s; });
    };

    useEffect(() => {
        if (!selectedTeam) { setTeamMembers([]); setTeamObjectives([]); return; }
        setLoadingMembers(true);
        Promise.all([
            fetch(`/api/enterprise/teams/${selectedTeam.id}?include=members`).then(r => r.ok ? r.json() : { members: [] }),
            fetch(`/api/enterprise/team-objectives?team_id=${selectedTeam.id}`).then(r => r.ok ? r.json() : { objectives: [] })
        ]).then(([membersData, objData]) => {
            setTeamMembers(membersData.members || []);
            setTeamObjectives(objData.objectives || objData || []);
        }).finally(() => setLoadingMembers(false));
    }, [selectedTeam]);

    const renderTeamTree = (teamsToRender: Team[], depth = 0) => teamsToRender.map((team) => {
        const hasSubs = team.sub_teams && team.sub_teams.length > 0;
        const isExpanded = expandedTeams.has(team.id);
        return (
            <div key={team.id} style={{ marginLeft: depth * 24 }}>
                <div className="flex items-center gap-1">
                    {hasSubs ? (
                        <button onClick={(e) => { e.stopPropagation(); toggleTeamExpand(team.id); }} className="p-1 hover:bg-gray-200 rounded">
                            {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                        </button>
                    ) : <div className="w-6" />}
                    <button onClick={() => onSelectTeam(team)}
                        className={`flex-1 flex items-center justify-between p-3 rounded-xl transition-colors ${selectedTeam?.id === team.id ? 'bg-[#0E3A5D] text-white' : 'bg-gray-50 hover:bg-gray-100'}`}>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: selectedTeam?.id === team.id ? 'rgba(255,255,255,0.2)' : `${team.color}20` }}>
                                <Users className="w-4 h-4" style={{ color: selectedTeam?.id === team.id ? 'white' : team.color }} />
                            </div>
                            <div className="text-left">
                                <p className={`font-medium text-sm ${selectedTeam?.id === team.id ? 'text-white' : 'text-gray-900'}`}>{team.name}</p>
                                <p className={`text-xs ${selectedTeam?.id === team.id ? 'text-white/70' : 'text-gray-500'}`}>Niveau {team.level} &bull; {team.members_count || 0} membres</p>
                            </div>
                        </div>
                    </button>
                </div>
                {hasSubs && isExpanded && <div className="mt-1">{renderTeamTree(team.sub_teams!, depth + 1)}</div>}
            </div>
        );
    });

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Structure des équipes</h3>
                    <button onClick={onAddTeam} className="p-2 bg-[#0E3A5D] text-white rounded-lg hover:bg-[#0c2e4a]"><Plus className="w-4 h-4" /></button>
                </div>
                {teams.length === 0 ? (
                    <div className="text-center py-8"><Users className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500 text-sm mb-4">Aucune équipe créée</p><button onClick={onAddTeam} className="px-4 py-2 bg-[#0E3A5D] text-white rounded-xl text-sm">Créer une équipe</button></div>
                ) : <div className="space-y-1">{renderTeamTree(teams)}</div>}
            </div>
            <div className="lg:col-span-2">
                {selectedTeam ? (
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl border border-gray-200 p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${selectedTeam.color}20` }}>
                                        <Users className="w-7 h-7" style={{ color: selectedTeam.color }} />
                                    </div>
                                    <div><h3 className="text-xl font-bold text-gray-900">{selectedTeam.name}</h3><p className="text-sm text-gray-500">Niveau {selectedTeam.level}{selectedTeam.parent_team_id && ` • Sous-équipe de ${allTeams.find(t => t.id === selectedTeam.parent_team_id)?.name}`}</p></div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => onAddSubTeam(selectedTeam)} className="p-2 hover:bg-gray-100 rounded-lg"><FolderPlus className="w-5 h-5 text-gray-500" /></button>
                                    <button onClick={() => onEditTeam(selectedTeam)} className="p-2 hover:bg-gray-100 rounded-lg"><Edit className="w-5 h-5 text-gray-500" /></button>
                                    <button onClick={() => onDeleteTeam(selectedTeam.id)} className="p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-5 h-5 text-red-500" /></button>
                                </div>
                            </div>
                            {selectedTeam.description && <p className="text-gray-600">{selectedTeam.description}</p>}
                        </div>
                        <div className="bg-white rounded-2xl border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4"><h4 className="font-semibold text-gray-900">Membres ({teamMembers.length})</h4>
                                <button onClick={onAddMember} className="px-4 py-2 bg-[#0E3A5D] text-white rounded-xl text-sm flex items-center gap-2"><UserPlus className="w-4 h-4" />Ajouter</button></div>
                            {loadingMembers ? <div className="animate-pulse space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}</div>
                                : teamMembers.length === 0 ? <p className="text-gray-500 text-sm text-center py-8">Aucun membre dans cette équipe</p>
                                    : <div className="space-y-3">{teamMembers.map((member) => (
                                        <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0E3A5D] to-[#1e5a8e] flex items-center justify-center">
                                                    <span className="text-white text-sm font-semibold">{member.contact?.full_name?.charAt(0) || '?'}</span>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-900">{member.contact?.full_name}</p>
                                                    {editingMemberId === member.id ? (
                                                        <input type="text" value={editingMemberRole} onChange={(e) => setEditingMemberRole(e.target.value)} placeholder="Role..." className="mt-1 px-2 py-1 text-xs border rounded" autoFocus
                                                            onKeyDown={(e) => { if (e.key === 'Enter') { onUpdateMemberRole(member.id, editingMemberRole); setEditingMemberId(null); } else if (e.key === 'Escape') setEditingMemberId(null); }} />
                                                    ) : <p className="text-xs text-gray-500">{member.role || member.contact?.job_title || 'Membre'}</p>}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {editingMemberId === member.id ? (
                                                    <>
                                                        <button onClick={() => { onUpdateMemberRole(member.id, editingMemberRole); setEditingMemberId(null); }} className="p-2 hover:bg-green-50 rounded-lg"><CheckCircle className="w-4 h-4 text-green-600" /></button>
                                                        <button onClick={() => setEditingMemberId(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-500" /></button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button onClick={() => { setEditingMemberId(member.id); setEditingMemberRole(member.role || ''); }} className="p-2 hover:bg-blue-50 rounded-lg"><Edit className="w-4 h-4 text-blue-600" /></button>
                                                        <button onClick={() => onRemoveMember(member.id)} className="p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}</div>}
                        </div>
                        <div className="bg-white rounded-2xl border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4"><h4 className="font-semibold text-gray-900">Objectifs de l&apos;équipe</h4>
                                <button onClick={onAddTeamObjective} className="px-4 py-2 bg-[#0E3A5D] text-white rounded-xl text-sm flex items-center gap-2"><Flag className="w-4 h-4" />Définir un objectif</button></div>
                            {teamObjectives.length === 0 ? <p className="text-gray-500 text-sm text-center py-8">Aucun objectif défini pour cette équipe</p>
                                : <div className="space-y-3">{teamObjectives.map((obj) => {
                                    const progress = obj.target_value ? Math.min(100, Math.round((obj.current_value / obj.target_value) * 100)) : 0;
                                    return (
                                        <div key={obj.id} className="p-4 bg-gray-50 rounded-xl">
                                            <div className="flex items-start justify-between mb-2"><h5 className="font-medium text-gray-900">{obj.title}</h5><span className={`px-2 py-1 rounded-full text-xs ${obj.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>{obj.status === 'completed' ? 'Terminé' : 'En cours'}</span></div>
                                            <div className="w-full bg-gray-200 rounded-full h-2 mb-2"><div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} /></div>
                                            <div className="flex justify-between text-xs text-gray-500"><span>{obj.current_value} / {obj.target_value} {obj.unit}</span><span>{progress}%</span></div>
                                        </div>
                                    );
                                })}</div>}
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" /><h3 className="text-lg font-semibold text-gray-900 mb-2">Sélectionnez une équipe</h3>
                        <p className="text-gray-500">Cliquez sur une équipe dans la liste pour voir ses détails</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// Groups Tab
function GroupsTab({ groups, selectedGroup, onSelectGroup, onAddGroup, onEditGroup, onDeleteGroup, onAddMember, onRemoveMember, contacts }: {
    groups: CustomGroup[]; selectedGroup: CustomGroup | null; onSelectGroup: (g: CustomGroup | null) => void; onAddGroup: () => void; onEditGroup: (g: CustomGroup) => void; onDeleteGroup: (id: string) => void; onAddMember: (gid: string, cid: string) => void; onRemoveMember: (id: string) => void; contacts: Contact[];
}) {
    const [groupMembers, setGroupMembers] = useState<CustomGroupMember[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        if (!selectedGroup) { setGroupMembers([]); return; }
        setLoadingMembers(true);
        fetch(`/api/enterprise/groups/${selectedGroup.id}?include=members`).then(r => r.ok ? r.json() : { members: [] }).then(d => setGroupMembers(d.members || [])).finally(() => setLoadingMembers(false));
    }, [selectedGroup]);

    const existingMemberIds = groupMembers.map(m => m.contact_id);
    const availableContacts = contacts.filter(c => !existingMemberIds.includes(c.id));

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-gray-900">Groupes personnalisés</h3><button onClick={onAddGroup} className="p-2 bg-[#0E3A5D] text-white rounded-lg"><Plus className="w-4 h-4" /></button></div>
                {groups.length === 0 ? (
                    <div className="text-center py-8"><Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500 text-sm mb-4">Aucun groupe créé</p><button onClick={onAddGroup} className="px-4 py-2 bg-[#0E3A5D] text-white rounded-xl text-sm">Créer un groupe</button></div>
                ) : (
                    <div className="space-y-2">{groups.map((group) => (
                        <button key={group.id} onClick={() => onSelectGroup(group)} className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${selectedGroup?.id === group.id ? 'bg-[#0E3A5D] text-white' : 'bg-gray-50 hover:bg-gray-100'}`}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: selectedGroup?.id === group.id ? 'rgba(255,255,255,0.2)' : `${group.color}20` }}>
                                    <Layers className="w-5 h-5" style={{ color: selectedGroup?.id === group.id ? 'white' : group.color }} />
                                </div>
                                <div className="text-left"><p className={`font-medium text-sm ${selectedGroup?.id === group.id ? 'text-white' : 'text-gray-900'}`}>{group.name}</p><p className={`text-xs ${selectedGroup?.id === group.id ? 'text-white/70' : 'text-gray-500'}`}>{group.members_count || 0} membres</p></div>
                            </div>
                        </button>
                    ))}</div>
                )}
            </div>
            <div className="lg:col-span-2">
                {selectedGroup ? (
                    <div className="bg-white rounded-2xl border border-gray-200 p-6">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${selectedGroup.color}20` }}><Layers className="w-7 h-7" style={{ color: selectedGroup.color }} /></div>
                                <div><h3 className="text-xl font-bold text-gray-900">{selectedGroup.name}</h3>{selectedGroup.description && <p className="text-sm text-gray-500">{selectedGroup.description}</p>}</div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => onEditGroup(selectedGroup)} className="p-2 hover:bg-gray-100 rounded-lg"><Edit className="w-5 h-5 text-gray-500" /></button>
                                <button onClick={() => onDeleteGroup(selectedGroup.id)} className="p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-5 h-5 text-red-500" /></button>
                            </div>
                        </div>
                        <div className="flex items-center justify-between mb-4"><h4 className="font-semibold text-gray-900">Membres ({groupMembers.length})</h4>
                            <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-[#0E3A5D] text-white rounded-xl text-sm flex items-center gap-2"><UserPlus className="w-4 h-4" />Ajouter</button></div>
                        {loadingMembers ? <div className="animate-pulse space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}</div>
                            : groupMembers.length === 0 ? <p className="text-gray-500 text-sm text-center py-8">Aucun membre dans ce groupe</p>
                                : <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{groupMembers.map((member) => (
                                    <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0E3A5D] to-[#1e5a8e] flex items-center justify-center"><span className="text-white text-sm font-semibold">{member.contact?.full_name?.charAt(0) || '?'}</span></div>
                                            <div><p className="font-medium text-gray-900 text-sm">{member.contact?.full_name}</p><p className="text-xs text-gray-500">{member.contact?.company || member.contact?.job_title}</p></div>
                                        </div>
                                        <button onClick={() => onRemoveMember(member.id)} className="p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>
                                    </div>
                                ))}</div>}
                        {showAddModal && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                                <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
                                    <div className="p-6 border-b border-gray-200 flex items-center justify-between"><h3 className="text-lg font-bold text-gray-900">Ajouter un membre</h3><button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button></div>
                                    <div className="p-6 overflow-y-auto max-h-[60vh]">
                                        {availableContacts.length === 0 ? <p className="text-gray-500 text-center py-4">Tous les contacts sont déjà membres</p> : (
                                            <div className="space-y-2">{availableContacts.map((contact) => (
                                                <button key={contact.id} onClick={() => { onAddMember(selectedGroup.id, contact.id); setShowAddModal(false); }}
                                                    className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0E3A5D] to-[#1e5a8e] flex items-center justify-center"><span className="text-white text-sm font-semibold">{contact.full_name?.charAt(0)}</span></div>
                                                    <div className="text-left"><p className="font-medium text-gray-900">{contact.full_name}</p><p className="text-xs text-gray-500">{contact.company}</p></div>
                                                </button>
                                            ))}</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center"><Layers className="w-16 h-16 text-gray-300 mx-auto mb-4" /><h3 className="text-lg font-semibold text-gray-900 mb-2">Sélectionnez un groupe</h3><p className="text-gray-500">Cliquez sur un groupe pour voir ses membres</p></div>
                )}
            </div>
        </div>
    );
}

// Members Tab
function MembersTab({ members, allContacts, onToggleMember, onRefresh, enterpriseId }: {
    members: Contact[]; allContacts: Contact[]; onToggleMember: (cid: string, isMember: boolean) => void; onRefresh: () => void; enterpriseId: string;
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [showContactFormModal, setShowContactFormModal] = useState(false);
    const [creatingObjectiveFor, setCreatingObjectiveFor] = useState<Contact | null>(null);
    const [memberObjectives, setMemberObjectives] = useState<MemberObjective[]>([]);

    useEffect(() => {
        fetch(`/api/enterprise/member-objectives?enterprise_id=${enterpriseId}`).then(r => r.ok ? r.json() : { objectives: [] }).then(d => setMemberObjectives(d.objectives || d || []));
    }, [enterpriseId]);

    const filteredMembers = members.filter((m) => m.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || m.email?.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div className="relative flex-1 max-w-md"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" /><input type="text" placeholder="Rechercher un membre..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]" /></div>
                <button onClick={() => setShowContactFormModal(true)} className="px-4 py-2 bg-[#0E3A5D] text-white rounded-xl flex items-center gap-2 ml-4"><UserPlus className="w-5 h-5" />Créer un membre</button>
            </div>
            {filteredMembers.length === 0 ? (
                <div className="bg-white rounded-2xl border p-12 text-center"><Users2 className="w-16 h-16 text-gray-300 mx-auto mb-4" /><h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun membre</h3><p className="text-gray-500 mb-6">Créez des contacts en tant que membres de votre entreprise</p><button onClick={() => setShowContactFormModal(true)} className="px-4 py-2 bg-[#0E3A5D] text-white rounded-xl">Créer un membre</button></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{filteredMembers.map((member) => (
                    <div key={member.id} className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-lg transition-shadow">
                        <div className="flex items-start gap-4">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#0E3A5D] to-[#1e5a8e] flex items-center justify-center text-white font-bold text-lg">{member.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}</div>
                            <div className="flex-1 min-w-0"><h4 className="font-semibold text-gray-900 truncate">{member.full_name}</h4>{member.job_title && <p className="text-sm text-gray-500 truncate">{member.job_title}</p>}{member.email && <p className="text-xs text-gray-400 truncate mt-1">{member.email}</p>}</div>
                            <button onClick={() => onToggleMember(member.id, false)} className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="flex items-center justify-between mb-2"><span className="text-sm font-medium text-gray-700">Objectifs ({memberObjectives.filter(o => o.member_id === member.id).length})</span>
                                <button onClick={() => setCreatingObjectiveFor(member)} className="px-3 py-1 text-xs bg-[#0E3A5D] text-white rounded-lg flex items-center gap-1"><Plus className="w-3 h-3" />Créer</button></div>
                            {memberObjectives.filter(o => o.member_id === member.id).length > 0 && <div className="flex gap-1 flex-wrap">{memberObjectives.filter(o => o.member_id === member.id).slice(0, 2).map(obj => (
                                <span key={obj.id} className={`px-2 py-1 rounded text-xs ${obj.status === 'completed' ? 'bg-green-100 text-green-700' : obj.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{obj.title}</span>
                            ))}</div>}
                        </div>
                    </div>
                ))}</div>
            )}
            {showContactFormModal && <AddContactModal onClose={() => setShowContactFormModal(false)} onContactAdded={() => { setShowContactFormModal(false); onRefresh(); }} defaultIsMember={true} />}
            {creatingObjectiveFor && <MemberObjectiveModal member={creatingObjectiveFor} enterpriseId={enterpriseId} objective={null} onClose={() => setCreatingObjectiveFor(null)} onSuccess={async () => {
                setCreatingObjectiveFor(null);
                const res = await fetch(`/api/enterprise/member-objectives?enterprise_id=${enterpriseId}`);
                if (res.ok) { const d = await res.json(); setMemberObjectives(d.objectives || d || []); }
            }} />}
        </div>
    );
}

// Objectives Tab
function ObjectivesTab({ objectives, onAddObjective, onEditObjective, onDeleteObjective, getProgressPercentage, getStatusConfig, getPriorityConfig }: {
    objectives: EnterpriseObjective[]; onAddObjective: () => void; onEditObjective: (o: EnterpriseObjective) => void; onDeleteObjective: (id: string) => void;
    getProgressPercentage: (c: number, t: number | null) => number; getStatusConfig: (s: string) => { label: string; color: string; icon: React.ElementType }; getPriorityConfig: (p: string) => { label: string; color: string; icon: React.ElementType };
}) {
    const [filterStatus, setFilterStatus] = useState('all');
    const filtered = filterStatus === 'all' ? objectives : objectives.filter(o => o.status === filterStatus);
    const formatValue = (value: number | null, unit: string | null, currency: string) => {
        if (value === null) return '-';
        if (unit === 'currency') return new Intl.NumberFormat('fr-FR', { style: 'currency', currency, minimumFractionDigits: 0 }).format(value);
        if (unit === 'percentage') return `${value}%`;
        return value.toString();
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div className="flex gap-2">{['all', 'in_progress', 'completed', 'not_started'].map(s => (
                    <button key={s} onClick={() => setFilterStatus(s)} className={`px-4 py-2 rounded-lg text-sm font-medium ${filterStatus === s ? 'bg-[#0E3A5D] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                        {s === 'all' ? 'Tous' : s === 'in_progress' ? 'En cours' : s === 'completed' ? 'Terminés' : 'Non démarrés'}
                    </button>
                ))}</div>
                <button onClick={onAddObjective} className="px-4 py-2 bg-[#0E3A5D] text-white rounded-xl flex items-center gap-2"><Plus className="w-5 h-5" />Nouvel objectif</button>
            </div>
            {filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border p-12 text-center"><Target className="w-16 h-16 text-gray-300 mx-auto mb-4" /><h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun objectif</h3><button onClick={onAddObjective} className="px-4 py-2 bg-[#0E3A5D] text-white rounded-xl mt-4">Créer un objectif</button></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{filtered.map((obj) => {
                    const progress = getProgressPercentage(obj.current_value, obj.target_value);
                    const sc = getStatusConfig(obj.status); const pc = getPriorityConfig(obj.priority);
                    const SI = sc.icon; const PI = pc.icon;
                    return (
                        <div key={obj.id} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1"><h4 className="font-semibold text-gray-900 mb-1">{obj.title}</h4>{obj.description && <p className="text-sm text-gray-500 line-clamp-2">{obj.description}</p>}</div>
                                <div className="flex gap-1"><button onClick={() => onEditObjective(obj)} className="p-2 hover:bg-gray-100 rounded-lg"><Edit className="w-4 h-4 text-gray-500" /></button><button onClick={() => onDeleteObjective(obj.id)} className="p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button></div>
                            </div>
                            <div className="mb-4">
                                <div className="flex justify-between text-sm mb-2"><span className="text-gray-600">{formatValue(obj.current_value, obj.unit, obj.currency)}</span><span className="text-gray-400">/ {formatValue(obj.target_value, obj.unit, obj.currency)}</span></div>
                                <div className="w-full bg-gray-200 rounded-full h-3"><div className={`h-3 rounded-full transition-all ${progress >= 100 ? 'bg-emerald-500' : 'bg-[#0E3A5D]'}`} style={{ width: `${progress}%` }} /></div>
                                <p className="text-right text-xs text-gray-500 mt-1">{progress}%</p>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${sc.color}`}><SI className="w-3 h-3" />{sc.label}</span>
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${pc.color}`}><PI className="w-3 h-3" />{pc.label}</span>
                                {obj.end_date && <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600"><Calendar className="w-3 h-3" />{new Date(obj.end_date).toLocaleDateString('fr-FR')}</span>}
                            </div>
                        </div>
                    );
                })}</div>
            )}
        </div>
    );
}

// =====================================================
// Modals
// =====================================================

function EnterpriseModal({ enterprise, onClose, onSave }: { enterprise: Enterprise | null; onClose: () => void; onSave: (d: Partial<Enterprise>) => void }) {
    const [formData, setFormData] = useState({ name: enterprise?.name || '', description: enterprise?.description || '', industry: enterprise?.industry || '', size: enterprise?.size || 'pme' });
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); setLoading(true); await onSave(formData); setLoading(false); };
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between"><h2 className="text-xl font-bold text-gray-900">{enterprise ? "Modifier l'entreprise" : 'Créer mon entreprise'}</h2><button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label><input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 focus:border-[#0E3A5D]" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Description</label><textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 resize-none" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Secteur</label><input type="text" value={formData.industry} onChange={(e) => setFormData({ ...formData, industry: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Taille</label><select value={formData.size} onChange={(e) => setFormData({ ...formData, size: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20"><option value="startup">Startup (1-10)</option><option value="pme">PME (11-250)</option><option value="eti">ETI (251-5000)</option><option value="grande_entreprise">Grande entreprise (5000+)</option></select></div>
                <div className="flex gap-3 pt-4"><button type="button" onClick={onClose} className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50">Annuler</button><button type="submit" disabled={loading || !formData.name} className="flex-1 px-6 py-3 bg-[#0E3A5D] text-white rounded-xl font-medium disabled:opacity-50">{loading ? 'Enregistrement...' : enterprise ? 'Modifier' : 'Créer'}</button></div>
            </form>
        </div></div>
    );
}

function TeamModal({ team, parentTeam, allTeams, onClose, onSave }: { team: Team | null; parentTeam: Team | null; allTeams: Team[]; onClose: () => void; onSave: (d: Partial<Team>) => void }) {
    const [formData, setFormData] = useState({ name: team?.name || '', description: team?.description || '', color: team?.color || '#0E3A5D', parent_team_id: team?.parent_team_id || parentTeam?.id || '' });
    const [loading, setLoading] = useState(false);
    const colors = ['#0E3A5D', '#1e5a8e', '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', '#10B981'];
    const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); setLoading(true); await onSave({ ...formData, parent_team_id: formData.parent_team_id || null }); setLoading(false); };
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between"><h2 className="text-xl font-bold text-gray-900">{team ? "Modifier l'équipe" : parentTeam ? `Nouvelle sous-équipe de ${parentTeam.name}` : 'Nouvelle équipe'}</h2><button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label><input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Description</label><textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 resize-none" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Équipe parente</label><select value={formData.parent_team_id} onChange={(e) => setFormData({ ...formData, parent_team_id: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl"><option value="">Aucune (équipe principale)</option>{allTeams.filter(t => t.id !== team?.id).map(t => <option key={t.id} value={t.id}>{'—'.repeat(t.level - 1)} {t.name}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Couleur</label><div className="flex gap-2 flex-wrap">{colors.map(c => <button key={c} type="button" onClick={() => setFormData({ ...formData, color: c })} className={`w-10 h-10 rounded-lg ${formData.color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`} style={{ backgroundColor: c }} />)}</div></div>
                <div className="flex gap-3 pt-4"><button type="button" onClick={onClose} className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50">Annuler</button><button type="submit" disabled={loading || !formData.name} className="flex-1 px-6 py-3 bg-[#0E3A5D] text-white rounded-xl font-medium disabled:opacity-50">{loading ? 'Enregistrement...' : team ? 'Modifier' : 'Créer'}</button></div>
            </form>
        </div></div>
    );
}

function GroupModal({ group, onClose, onSave }: { group: CustomGroup | null; onClose: () => void; onSave: (d: Partial<CustomGroup>) => void }) {
    const [formData, setFormData] = useState({ name: group?.name || '', description: group?.description || '', color: group?.color || '#6366F1' });
    const [loading, setLoading] = useState(false);
    const colors = ['#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', '#10B981', '#0E3A5D', '#1e5a8e'];
    const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); setLoading(true); await onSave(formData); setLoading(false); };
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between"><h2 className="text-xl font-bold text-gray-900">{group ? 'Modifier le groupe' : 'Nouveau groupe'}</h2><button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label><input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Description</label><textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 resize-none" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Couleur</label><div className="flex gap-2 flex-wrap">{colors.map(c => <button key={c} type="button" onClick={() => setFormData({ ...formData, color: c })} className={`w-10 h-10 rounded-lg ${formData.color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`} style={{ backgroundColor: c }} />)}</div></div>
                <div className="flex gap-3 pt-4"><button type="button" onClick={onClose} className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50">Annuler</button><button type="submit" disabled={loading || !formData.name} className="flex-1 px-6 py-3 bg-[#0E3A5D] text-white rounded-xl font-medium disabled:opacity-50">{loading ? 'Enregistrement...' : group ? 'Modifier' : 'Créer'}</button></div>
            </form>
        </div></div>
    );
}

function ObjectiveModal({ objective, onClose, onSave }: { objective: EnterpriseObjective | null; onClose: () => void; onSave: (d: Partial<EnterpriseObjective>) => void }) {
    const [formData, setFormData] = useState({ title: objective?.title || '', description: objective?.description || '', target_value: objective?.target_value?.toString() || '', current_value: objective?.current_value?.toString() || '0', unit: objective?.unit || 'number', currency: objective?.currency || 'EUR', start_date: objective?.start_date || '', end_date: objective?.end_date || '', status: objective?.status || 'not_started', priority: objective?.priority || 'medium' });
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); setLoading(true); await onSave({ ...formData, target_value: formData.target_value ? parseFloat(formData.target_value) : null, current_value: parseFloat(formData.current_value) || 0, start_date: formData.start_date || null, end_date: formData.end_date || null } as unknown as Partial<EnterpriseObjective>); setLoading(false); };
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl"><h2 className="text-xl font-bold text-gray-900">{objective ? "Modifier l'objectif" : 'Nouvel objectif'}</h2><button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Titre *</label><input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Description</label><textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E3A5D]/20 resize-none" /></div>
                <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-2">Valeur cible</label><input type="number" value={formData.target_value} onChange={(e) => setFormData({ ...formData, target_value: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl" /></div><div><label className="block text-sm font-medium text-gray-700 mb-2">Valeur actuelle</label><input type="number" value={formData.current_value} onChange={(e) => setFormData({ ...formData, current_value: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl" /></div></div>
                <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-2">Unité</label><select value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl"><option value="number">Nombre</option><option value="currency">Devise</option><option value="percentage">Pourcentage</option></select></div>{formData.unit === 'currency' && <div><label className="block text-sm font-medium text-gray-700 mb-2">Devise</label><select value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl"><option value="EUR">EUR</option><option value="USD">USD</option><option value="XOF">XOF</option></select></div>}</div>
                <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-2">Date de début</label><input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl" /></div><div><label className="block text-sm font-medium text-gray-700 mb-2">Date de fin</label><input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl" /></div></div>
                <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-2">Statut</label><select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl"><option value="not_started">Non démarré</option><option value="in_progress">En cours</option><option value="completed">Terminé</option><option value="cancelled">Annulé</option></select></div><div><label className="block text-sm font-medium text-gray-700 mb-2">Priorité</label><select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl"><option value="low">Basse</option><option value="medium">Moyenne</option><option value="high">Haute</option><option value="critical">Critique</option></select></div></div>
                <div className="flex gap-3 pt-4"><button type="button" onClick={onClose} className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50">Annuler</button><button type="submit" disabled={loading || !formData.title} className="flex-1 px-6 py-3 bg-[#0E3A5D] text-white rounded-xl font-medium disabled:opacity-50">{loading ? 'Enregistrement...' : objective ? 'Modifier' : 'Créer'}</button></div>
            </form>
        </div></div>
    );
}

function AddMemberModal({ teamId, contacts, existingMemberIds, onClose, onSave }: { teamId: string; contacts: Contact[]; existingMemberIds: string[]; onClose: () => void; onSave: (tid: string, cid: string, role: string) => void }) {
    const [selectedContact, setSelectedContact] = useState('');
    const [role, setRole] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const available = contacts.filter(c => !existingMemberIds.includes(c.id) && (c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || c.company?.toLowerCase().includes(searchQuery.toLowerCase())));
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (selectedContact) onSave(teamId, selectedContact, role); };
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between"><h3 className="text-lg font-bold text-gray-900">Ajouter un membre</h3><button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Rechercher..." className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl" /></div>
                <div className="max-h-60 overflow-y-auto space-y-2">{available.length === 0 ? <p className="text-gray-500 text-center py-4">Aucun contact</p> : available.map(c => (
                    <button key={c.id} type="button" onClick={() => setSelectedContact(c.id)} className={`w-full flex items-center gap-3 p-3 rounded-xl ${selectedContact === c.id ? 'bg-[#0E3A5D] text-white' : 'bg-gray-50 hover:bg-gray-100'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedContact === c.id ? 'bg-white/20' : 'bg-gradient-to-br from-[#0E3A5D] to-[#1e5a8e]'}`}><span className="text-white text-sm font-semibold">{c.full_name?.charAt(0)}</span></div>
                        <div className="text-left"><p className={`font-medium ${selectedContact === c.id ? 'text-white' : 'text-gray-900'}`}>{c.full_name}</p><p className={`text-xs ${selectedContact === c.id ? 'text-white/70' : 'text-gray-500'}`}>{c.company || c.job_title}</p></div>
                    </button>
                ))}</div>
                {selectedContact && <div><label className="block text-sm font-medium text-gray-700 mb-2">Rôle (optionnel)</label><input type="text" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Ex: Chef de projet..." className="w-full px-4 py-3 border border-gray-200 rounded-xl" /></div>}
                <div className="flex gap-3 pt-4"><button type="button" onClick={onClose} className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50">Annuler</button><button type="submit" disabled={!selectedContact} className="flex-1 px-6 py-3 bg-[#0E3A5D] text-white rounded-xl font-medium disabled:opacity-50">Ajouter</button></div>
            </form>
        </div></div>
    );
}

function TeamObjectiveModal({ teamId, objective, enterpriseObjectives, contacts, onClose }: { teamId: string; objective: TeamObjective | null; enterpriseObjectives: EnterpriseObjective[]; contacts: Contact[]; onClose: () => void }) {
    const [formData, setFormData] = useState({ title: objective?.title || '', description: objective?.description || '', target_value: objective?.target_value?.toString() || '', current_value: objective?.current_value?.toString() || '0', unit: objective?.unit || 'number', currency: objective?.currency || 'EUR', status: objective?.status || 'not_started', priority: objective?.priority || 'medium', enterprise_objective_id: objective?.enterprise_objective_id || '', assigned_to: objective?.assigned_to || '' });
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setLoading(true);
        try {
            const payload = { team_id: teamId, ...formData, target_value: formData.target_value ? parseFloat(formData.target_value) : null, current_value: parseFloat(formData.current_value) || 0, enterprise_objective_id: formData.enterprise_objective_id || null, assigned_to: formData.assigned_to || null };
            const url = objective ? `/api/enterprise/team-objectives/${objective.id}` : '/api/enterprise/team-objectives';
            const res = await fetch(url, { method: objective ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!res.ok) throw new Error('Failed');
            onClose();
        } catch { toast.error("Erreur lors de l'enregistrement"); } finally { setLoading(false); }
    };
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl"><h2 className="text-xl font-bold text-gray-900">{objective ? "Modifier l'objectif" : "Nouvel objectif d'équipe"}</h2><button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {enterpriseObjectives.length > 0 && <div><label className="block text-sm font-medium text-gray-700 mb-2">Lié à un objectif global</label><select value={formData.enterprise_objective_id} onChange={(e) => setFormData({ ...formData, enterprise_objective_id: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl"><option value="">Aucun</option>{enterpriseObjectives.map(o => <option key={o.id} value={o.id}>{o.title}</option>)}</select></div>}
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Titre *</label><input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl" /></div>
                <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-2">Cible</label><input type="number" value={formData.target_value} onChange={(e) => setFormData({ ...formData, target_value: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl" /></div><div><label className="block text-sm font-medium text-gray-700 mb-2">Actuel</label><input type="number" value={formData.current_value} onChange={(e) => setFormData({ ...formData, current_value: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl" /></div></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Responsable</label><select value={formData.assigned_to} onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl"><option value="">Non assigné</option>{contacts.filter(c => c.is_member).map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}</select></div>
                <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-2">Statut</label><select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl"><option value="not_started">Non démarré</option><option value="in_progress">En cours</option><option value="completed">Terminé</option></select></div><div><label className="block text-sm font-medium text-gray-700 mb-2">Priorité</label><select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl"><option value="low">Basse</option><option value="medium">Moyenne</option><option value="high">Haute</option><option value="critical">Critique</option></select></div></div>
                <div className="flex gap-3 pt-4"><button type="button" onClick={onClose} className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50">Annuler</button><button type="submit" disabled={loading || !formData.title} className="flex-1 px-6 py-3 bg-[#0E3A5D] text-white rounded-xl font-medium disabled:opacity-50">{loading ? 'Enregistrement...' : objective ? 'Modifier' : 'Créer'}</button></div>
            </form>
        </div></div>
    );
}

function MemberObjectiveModal({ member, enterpriseId, objective, onClose, onSuccess }: { member: Contact; enterpriseId: string; objective: MemberObjective | null; onClose: () => void; onSuccess: () => void }) {
    const [formData, setFormData] = useState({ title: objective?.title || '', description: objective?.description || '', target_value: objective?.target_value?.toString() || '', current_value: objective?.current_value?.toString() || '0', unit: objective?.unit || 'number', currency: objective?.currency || 'EUR', start_date: objective?.start_date || '', end_date: objective?.end_date || '', status: objective?.status || 'not_started', priority: objective?.priority || 'medium' });
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setLoading(true);
        try {
            const payload = { member_id: member.id, enterprise_id: enterpriseId, ...formData, target_value: formData.target_value ? parseFloat(formData.target_value) : null, current_value: parseFloat(formData.current_value) || 0, start_date: formData.start_date || null, end_date: formData.end_date || null };
            const url = objective ? `/api/enterprise/member-objectives/${objective.id}` : '/api/enterprise/member-objectives';
            const res = await fetch(url, { method: objective ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!res.ok) throw new Error('Failed');
            onSuccess();
        } catch { toast.error("Erreur lors de l'enregistrement"); } finally { setLoading(false); }
    };
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}><div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl"><h2 className="text-xl font-bold text-gray-900">{objective ? "Modifier l'objectif" : `Objectif pour ${member.full_name}`}</h2><button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Titre</label><input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Description</label><textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none" /></div>
                <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-2">Valeur cible</label><input type="number" step="0.01" value={formData.target_value} onChange={(e) => setFormData({ ...formData, target_value: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl" /></div><div><label className="block text-sm font-medium text-gray-700 mb-2">Valeur actuelle</label><input type="number" step="0.01" value={formData.current_value} onChange={(e) => setFormData({ ...formData, current_value: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl" /></div></div>
                <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-2">Date de début</label><input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl" /></div><div><label className="block text-sm font-medium text-gray-700 mb-2">Date de fin</label><input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl" /></div></div>
                <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-2">Statut</label><select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl"><option value="not_started">Non démarré</option><option value="in_progress">En cours</option><option value="completed">Terminé</option><option value="cancelled">Annulé</option></select></div><div><label className="block text-sm font-medium text-gray-700 mb-2">Priorité</label><select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl"><option value="low">Basse</option><option value="medium">Moyenne</option><option value="high">Haute</option><option value="critical">Critique</option></select></div></div>
                <div className="flex gap-3 pt-4"><button type="button" onClick={onClose} className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50">Annuler</button><button type="submit" disabled={loading} className="flex-1 px-6 py-3 bg-[#0E3A5D] text-white rounded-xl font-medium disabled:opacity-50">{loading ? 'Enregistrement...' : objective ? 'Modifier' : 'Créer'}</button></div>
            </form>
        </div></div>
    );
}
