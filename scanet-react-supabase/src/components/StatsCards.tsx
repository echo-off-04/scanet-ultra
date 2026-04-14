import { Users, Target, TrendingUp, Briefcase } from 'lucide-react';

interface StatsCardsProps {
  totalContacts: number;
  leads: number;
  clients: number;
  partners: number;
}

export function StatsCards({ totalContacts, leads, clients, partners }: StatsCardsProps) {
  const cards = [
    {
      title: 'Contacts',
      value: totalContacts,
      icon: Users,
      color: '#64748b',
      gradient: 'from-slate-500/10 to-slate-600/5',
      isDark: true,
      countInChart: false, // Ne pas compter dans le graphique
    },
    {
      title: 'Leads',
      value: leads,
      icon: Target,
      color: '#f59e0b',
      gradient: 'from-orange-500/10 to-orange-600/5',
      isDark: false,
      countInChart: true,
    },
    {
      title: 'Clients',
      value: clients,
      icon: TrendingUp,
      color: '#10b981',
      gradient: 'from-emerald-500/10 to-emerald-600/5',
      isDark: false,
      countInChart: true,
    },
    {
      title: 'Partenaires',
      value: partners,
      icon: Briefcase,
      color: '#8b5cf6',
      gradient: 'from-violet-500/10 to-violet-600/5',
      isDark: false,
      countInChart: true,
    },
  ];

  // On filtre pour ne compter que les cards qui doivent être dans le graphique
  const chartCards = cards.filter(card => card.countInChart);
  const total = chartCards.reduce((sum, card) => sum + card.value, 0);
  
  // Calculer les pourcentages seulement pour les cards du graphique
  const getPercentage = (card: typeof cards[0]) => {
    if (!card.countInChart || total === 0) return '0.0';
    return ((card.value / total) * 100).toFixed(1);
  };

  const renderWaves = (color: string, isDark: boolean) => {
    const baseOpacity = isDark ? 0.15 : 0.08;
    
    return (
      <div className="absolute inset-0 opacity-30 overflow-hidden">
        <svg className="w-full h-full" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <path
            d="M0,100 Q25,80 50,100 T100,100 Q125,120 150,100 T200,100 L200,200 L0,200 Z"
            fill={isDark ? 'white' : color}
            opacity={baseOpacity * 2.5}
          />
          <path
            d="M0,120 Q25,100 50,120 T100,120 Q125,140 150,120 T200,120 L200,200 L0,200 Z"
            fill={isDark ? 'white' : color}
            opacity={baseOpacity * 2}
          />
        </svg>
      </div>
    );
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl lg:rounded-3xl p-4 lg:p-6 border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] mb-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-4 lg:gap-6">

        {/* Left side - Mini stats grid (2x2) */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:gap-4">
          {cards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={index}
                className="group relative overflow-hidden"
              >
                <div
                  className={`relative rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-5 border transition-all duration-300 hover:-translate-y-0.5 overflow-hidden ${
                    card.isDark
                      ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700/50 shadow-[0_4px_16px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)]'
                      : 'bg-white border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)]'
                  }`}
                >
                  {/* Background waves */}
                  {renderWaves(card.color, card.isDark)}

                  {card.isDark ? (
                    <>
                      {/* Dark card glossy effects */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/5 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500 rounded-xl lg:rounded-2xl" />
                      
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-xl lg:rounded-2xl" />
                      
                      <div className="absolute inset-[1px] rounded-xl lg:rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] pointer-events-none" />
                    </>
                  ) : (
                    <>
                      {/* Light card effects */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl lg:rounded-2xl`} />
                      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl lg:rounded-2xl" />
                      
                      {/* Colored glow on hover */}
                      <div 
                        className="absolute -inset-1 rounded-xl lg:rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-xl"
                        style={{ backgroundColor: card.color }}
                      />
                    </>
                  )}
                  
                  {/* Content */}
                  <div className="relative z-10">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 lg:mb-3">
                      <div
                        className={`p-1 sm:p-1.5 rounded-lg transition-transform duration-300 group-hover:scale-110 ${
                          card.isDark ? 'bg-white/10' : ''
                        }`}
                        style={!card.isDark ? { backgroundColor: `${card.color}15` } : {}}
                      >
                        <Icon
                          className={`w-3 h-3 sm:w-3.5 sm:h-3.5 transition-colors duration-300 ${
                            card.isDark
                              ? 'text-white/90'
                              : ''
                          }`}
                          strokeWidth={2}
                          style={!card.isDark ? { color: card.color } : {}}
                        />
                      </div>
                      <p className={`text-[9px] sm:text-[10px] lg:text-xs font-medium uppercase tracking-wider ${
                        card.isDark ? 'text-white/70' : 'text-gray-500'
                      }`}>
                        {card.title}
                      </p>
                    </div>

                    <div className="flex items-baseline gap-1.5 sm:gap-2">
                      <h3 className={`text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight ${
                        card.isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        {card.value}
                      </h3>
                      {card.countInChart && (
                        <span
                          className="text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded-full backdrop-blur-sm border"
                          style={{
                            backgroundColor: `${card.color}20`,
                            color: card.color,
                            borderColor: `${card.color}30`
                          }}
                        >
                          {getPercentage(card)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right side - Distribution Chart */}
        <div className="relative bg-gradient-to-br from-gray-50 to-white rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.08)] overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-emerald-500/5 to-orange-500/5 rounded-full blur-2xl" />

          <div className="relative z-10">
            <div className="mb-3 lg:mb-4">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-0.5 sm:mb-1">Répartition des contacts</h3>
              <p className="text-[10px] sm:text-xs text-gray-500">Distribution actuelle</p>
            </div>

            {/* Donut chart */}
            <div className="flex items-center justify-center h-[160px] sm:h-[180px] lg:h-[200px] relative">
              <svg viewBox="0 0 200 200" className="w-full h-full max-w-[180px]">
                <defs>
                  {chartCards.map((card, index) => (
                    <linearGradient key={index} id={`gradient-chart-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: card.color, stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: card.color, stopOpacity: 0.7 }} />
                    </linearGradient>
                  ))}
                  <filter id="shadow-chart">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2"/>
                  </filter>
                </defs>
                
                {/* Background circle */}
                <circle cx="100" cy="100" r="70" fill="none" stroke="#f1f5f9" strokeWidth="24" />
                
                {/* Animated segments - only for chart cards */}
                {chartCards.map((card, index) => {
                  const prevPercentages = chartCards.slice(0, index).reduce((sum, c) => {
                    return sum + parseFloat(getPercentage(c));
                  }, 0);
                  const percentage = parseFloat(getPercentage(card));
                  const circumference = 2 * Math.PI * 70;
                  const offset = (prevPercentages / 100) * circumference;
                  const dashArray = `${(percentage / 100) * circumference} ${circumference}`;
                  
                  return (
                    <circle
                      key={index}
                      cx="100"
                      cy="100"
                      r="70"
                      fill="none"
                      stroke={`url(#gradient-chart-${index})`}
                      strokeWidth="24"
                      strokeDasharray={dashArray}
                      strokeDashoffset={-offset}
                      strokeLinecap="round"
                      transform="rotate(-90 100 100)"
                      className="transition-all duration-1000 ease-out"
                      filter="url(#shadow-chart)"
                    />
                  );
                })}
                
                {/* Center total with background */}
                <circle cx="100" cy="100" r="45" fill="white" opacity="0.9" />
                <text x="100" y="95" textAnchor="middle" className="text-xs fill-gray-500 font-medium">Total</text>
                <text x="100" y="115" textAnchor="middle" className="text-2xl fill-gray-900 font-bold">{total}</text>
              </svg>
            </div>

            {/* Legend - only for chart cards */}
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mt-3 lg:mt-4">
              {chartCards.map((card, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-lg hover:bg-gray-50/50 transition-colors duration-200 group/legend cursor-pointer"
                >
                  <div
                    className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full flex-shrink-0 ring-2 ring-white shadow-sm group-hover/legend:scale-125 transition-transform duration-200"
                    style={{ backgroundColor: card.color }}
                  />
                  <span className="text-[10px] sm:text-xs text-gray-600 truncate flex-1">{card.title}</span>
                  <span
                    className="text-[10px] sm:text-xs font-bold px-1 sm:px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: `${card.color}15`,
                      color: card.color
                    }}
                  >
                    {card.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}