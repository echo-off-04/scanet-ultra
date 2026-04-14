import { useEffect, useState } from 'react';

interface Contact {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

interface FavoriteContactsBarProps {
  contacts: Contact[];
  onContactClick: (contact: Contact) => void;
}

export function FavoriteContactsBar({ contacts, onContactClick }: FavoriteContactsBarProps) {
  const [recentContacts, setRecentContacts] = useState<Contact[]>([]);
  const [remainingCount, setRemainingCount] = useState(0);

  useEffect(() => {
    const recent = contacts.slice(0, 4);
    setRecentContacts(recent);

    const totalContacts = contacts.length;
    setRemainingCount(Math.max(0, totalContacts - 4));
  }, [contacts]);

  if (recentContacts.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {recentContacts.map((contact) => (
          <button
            key={contact.id}
            onClick={() => onContactClick(contact)}
            className="flex flex-col items-center flex-shrink-0 group"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center ring-4 ring-white/50 shadow-lg group-hover:scale-110 group-hover:ring-blue-200 transition-all">
                {contact.avatar_url ? (
                  <img
                    src={contact.avatar_url}
                    alt={contact.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-xl font-bold">
                    {contact.full_name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="absolute top-0 right-0 w-4 h-4 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
            </div>
            <span className="text-sm font-semibold text-gray-800 mt-2 truncate max-w-[64px]">
              {contact.full_name.split(' ')[0]}
            </span>
          </button>
        ))}

        {remainingCount > 0 && (
          <div className="flex flex-col items-center flex-shrink-0">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg relative overflow-hidden ring-4 ring-white/50">
              <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-white/30 backdrop-blur-sm border-2 border-white"></div>
              <div className="absolute top-4 left-4 w-6 h-6 rounded-full bg-white/40 backdrop-blur-sm border-2 border-white"></div>
              <span className="text-white text-lg font-bold relative z-10">
                +{remainingCount}
              </span>
            </div>
            <span className="text-sm font-semibold text-gray-800 mt-2">Plus</span>
          </div>
        )}
      </div>
    </div>
  );
}
