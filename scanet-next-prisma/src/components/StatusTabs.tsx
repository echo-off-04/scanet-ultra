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
        { id: 'lead', label: 'Leads', count: counts.lead },
        { id: 'prospect', label: 'Prospects', count: counts.prospect },
        { id: 'client', label: 'Clients', count: counts.client },
        { id: 'partner', label: 'Partenaires', count: counts.partner },
        { id: 'collaborateur', label: 'Collaborateurs', count: counts.collaborateur || 0 },
        { id: 'ami', label: 'Ami(e)s', count: counts.ami || 0 },
        { id: 'fournisseur', label: 'Fournisseurs', count: counts.fournisseur || 0 },
    ];

    const getTabClasses = (tabId: string) => {
        const isActive = currentStatus === tabId;
        return `whitespace-nowrap rounded-full px-3 py-2 text-xs font-medium transition-colors sm:px-4 sm:text-sm lg:px-5 lg:py-2.5 ${isActive ? 'border border-[rgba(0,87,184,0.2)] bg-[#eef5fe] text-[#0057b8]' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'}`;
    };

    return (
        <div className="-mx-4 mb-6 overflow-x-auto px-4 scrollbar-hide sm:mx-0 sm:px-0">
            <div className="flex min-w-max items-center gap-2 pb-1">
                <button
                    onClick={() => onStatusChange('all')}
                    className={`whitespace-nowrap rounded-full px-3 py-2 text-xs font-medium transition-colors sm:px-4 sm:text-sm lg:px-5 lg:py-2.5 ${currentStatus === 'all'
                        ? 'border border-[rgba(0,87,184,0.2)] bg-[#eef5fe] text-[#0057b8]'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                        }`}
                >
                    Tous
                    <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] sm:ml-2 sm:px-2 sm:text-xs ${currentStatus === 'all' ? 'bg-[#0057b8] text-white' : 'bg-white text-slate-600'}`}>{counts.all}</span>
                </button>
                {tabs.map((tab) => (
                    <button key={tab.id} onClick={() => onStatusChange(tab.id)} className={getTabClasses(tab.id)}>
                        <span className="hidden sm:inline">{tab.label}</span>
                        <span className="inline sm:hidden">{tab.label.length > 6 ? tab.label.substring(0, 5) + '.' : tab.label}</span>
                        <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] sm:ml-2 sm:px-2 sm:text-xs ${currentStatus === tab.id ? 'bg-[#0057b8] text-white' : 'bg-white text-slate-600'}`}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
