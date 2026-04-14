import { useEffect, useState } from 'react';

interface Contact {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

interface RecentContactsCarouselProps {
  contacts: Contact[];
  onContactClick?: (contact: Contact) => void;
}

export function RecentContactsCarousel({ contacts, onContactClick }: RecentContactsCarouselProps) {
  const [recentContacts, setRecentContacts] = useState<Contact[]>([]);

  useEffect(() => {
    const recent = contacts.slice(0, 10);
    setRecentContacts(recent);
  }, [contacts]);

  if (recentContacts.length === 0) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const gradients = [
    'from-blue-400 via-blue-500 to-blue-600',
    'from-violet-400 via-violet-500 to-violet-600',
    'from-emerald-400 via-emerald-500 to-emerald-600',
    'from-orange-400 via-orange-500 to-orange-600',
    'from-pink-400 via-pink-500 to-pink-600',
    'from-teal-400 via-teal-500 to-teal-600',
    'from-cyan-400 via-cyan-500 to-cyan-600',
    'from-rose-400 via-rose-500 to-rose-600',
  ];

  return (
    <div className="mb-6 overflow-hidden glass-card lg:bg-transparent lg:backdrop-blur-none lg:shadow-none lg:border-0 p-4 lg:p-0">
      <div className="flex items-center gap-3 lg:gap-4 overflow-x-auto pb-0 scrollbar-hide -mx-2 px-2">
        {recentContacts.map((contact, index) => (
          <button
            key={contact.id}
            onClick={() => onContactClick?.(contact)}
            className="flex-shrink-0 group relative cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 rounded-full"
            style={{
              animation: `fadeInSlide 0.5s ease-out ${index * 0.05}s both`
            }}
            title={contact.full_name}
          >
            <div className="relative">
              <div className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full overflow-hidden bg-gradient-to-br ${gradients[index % gradients.length]} flex items-center justify-center ring-2 ring-white/70 shadow-md group-hover:scale-110 group-hover:ring-4 group-hover:ring-white transition-all duration-300 group-hover:shadow-xl`}>
                {contact.avatar_url ? (
                  <img
                    src={contact.avatar_url}
                    alt={contact.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-xs sm:text-sm lg:text-base font-bold">
                    {getInitials(contact.full_name)}
                  </span>
                )}
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
            </div>
          </button>
        ))}

        {recentContacts.length > 0 && (
          <div className="flex-shrink-0 ml-2 text-xs lg:text-sm font-semibold text-gray-600 px-3 lg:px-5 py-1.5 lg:py-2.5 bg-white/40 backdrop-blur-sm rounded-full border border-white/60">
            +{contacts.length - recentContacts.length > 0 ? contacts.length - recentContacts.length : 0}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeInSlide {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
