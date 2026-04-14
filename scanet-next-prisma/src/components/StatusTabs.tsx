'use client';

interface StatusTabsProps {
    currentStatus: string;
    counts: {
        all: number;
        lead: number;
        prospect: number;
        client: number;
        partner: number;
        collaborateur?: number;
        ami?: number;
        fournisseur?: number;
    };
    onStatusChange: (status: string) => void;
}

export function StatusTabs({ currentStatus, counts, onStatusChange }: StatusTabsProps) {
    const tabs = [
        { id: 'lead', label: 'Leads', count: counts.lead, color: 'orange' },
        { id: 'prospect', label: 'Prospects', count: counts.prospect, color: 'blue' },
        { id: 'client', label: 'Clients', count: counts.client, color: 'emerald' },
        { id: 'partner', label: 'Partenaires', count: counts.partner, color: 'violet' },
        { id: 'collaborateur', label: 'Collaborateurs', count: counts.collaborateur || 0, color: 'cyan' },
        { id: 'ami', label: 'Ami(e)s', count: counts.ami || 0, color: 'pink' },
        { id: 'fournisseur', label: 'Fournisseurs', count: counts.fournisseur || 0, color: 'amber' },
    ];

    const getTabClasses = (tabId: string, color: string) => {
        const isActive = currentStatus === tabId;
        const colorClasses: Record<string, string> = {
            orange: isActive ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-lg shadow-orange-200' : 'text-gray-600 hover:bg-orange-50/50 backdrop-blur-sm',
            blue: isActive ? 'bg-gradient-to-r from-blue-400 to-blue-500 text-white shadow-lg shadow-blue-200' : 'text-gray-600 hover:bg-blue-50/50 backdrop-blur-sm',
            emerald: isActive ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 text-white shadow-lg shadow-emerald-200' : 'text-gray-600 hover:bg-emerald-50/50 backdrop-blur-sm',
            violet: isActive ? 'bg-gradient-to-r from-violet-400 to-violet-500 text-white shadow-lg shadow-violet-200' : 'text-gray-600 hover:bg-violet-50/50 backdrop-blur-sm',
            cyan: isActive ? 'bg-gradient-to-r from-cyan-400 to-cyan-500 text-white shadow-lg shadow-cyan-200' : 'text-gray-600 hover:bg-cyan-50/50 backdrop-blur-sm',
            pink: isActive ? 'bg-gradient-to-r from-pink-400 to-pink-500 text-white shadow-lg shadow-pink-200' : 'text-gray-600 hover:bg-pink-50/50 backdrop-blur-sm',
            amber: isActive ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-lg shadow-amber-200' : 'text-gray-600 hover:bg-amber-50/50 backdrop-blur-sm',
        };
        return `px-3 sm:px-4 lg:px-5 py-2 lg:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${colorClasses[color] || ''}`;
    };

    return (
        <div className="mb-6 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex items-center gap-2 min-w-max pb-1">
                <button
                    onClick={() => onStatusChange('all')}
                    className={`px-3 sm:px-4 lg:px-5 py-2 lg:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${currentStatus === 'all'
                            ? 'bg-gradient-to-r from-slate-600 to-slate-700 text-white shadow-lg shadow-slate-200'
                            : 'text-gray-600 hover:bg-white/50 backdrop-blur-sm'
                        }`}
                >
                    Tous
                    <span className="ml-1.5 sm:ml-2 px-1.5 sm:px-2 py-0.5 bg-white/20 rounded-full text-[10px] sm:text-xs">{counts.all}</span>
                </button>
                {tabs.map((tab) => (
                    <button key={tab.id} onClick={() => onStatusChange(tab.id)} className={getTabClasses(tab.id, tab.color)}>
                        <span className="hidden sm:inline">{tab.label}</span>
                        <span className="inline sm:hidden">{tab.label.length > 6 ? tab.label.substring(0, 5) + '.' : tab.label}</span>
                        <span className={`ml-1.5 sm:ml-2 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs ${currentStatus === tab.id ? 'bg-white/20' : 'bg-gray-100'}`}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
