import { Send } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Contact = Database['public']['Tables']['contacts']['Row'];

interface ModernContactCardProps {
  contact: Contact;
  onClick: (contact: Contact) => void;
}

export function ModernContactCard({ contact, onClick }: ModernContactCardProps) {
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'lead':
        return 'bg-orange-100 text-orange-700';
      case 'prospect':
        return 'bg-blue-100 text-blue-700';
      case 'client':
        return 'bg-emerald-100 text-emerald-700';
      case 'partner':
        return 'bg-violet-100 text-violet-700';
      case 'collaborateur':
        return 'bg-cyan-100 text-cyan-700';
      case 'ami':
        return 'bg-pink-100 text-pink-700';
      case 'fournisseur':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string | null) => {
    if (!status) return null;
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div
      className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-100"
      onClick={() => onClick(contact)}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-[#0E3A5D] flex items-center justify-center">
            {contact.avatar_url ? (
              <img
                src={contact.avatar_url}
                alt={contact.full_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white text-lg font-semibold">
                {getInitials(contact.full_name)}
              </span>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate mb-1">
            {contact.full_name}
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            {contact.status && (
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${getStatusColor(contact.status)}`}>
                {getStatusLabel(contact.status)}
              </span>
            )}
            {contact.tags && contact.tags.length > 0 && contact.tags.slice(0, 2).map((tag, index) => (
              <span
                key={index}
                className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-700"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick(contact);
          }}
          className="flex-shrink-0 w-10 h-10 rounded-full bg-[#0E3A5D] flex items-center justify-center hover:bg-blue-800 transition-colors"
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}
