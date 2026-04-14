'use client';

import { useState, useEffect } from 'react';
import { X, Star, Upload, XIcon, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { PhoneInput } from './PhoneInput';
import { detectUserCountry, getCountryName, COUNTRIES, getRegionsByCountryCode } from '@/lib/countries';

interface AddContactModalProps {
    onClose: () => void;
    onContactAdded: (contactId?: string) => void;
    defaultIsMember?: boolean;
    onNavigateToEnterprise?: () => void;
}

const INDUSTRIES = [
    'Technologie', 'Finance', 'Santé', 'Éducation', 'Commerce', 'Industrie',
    'Consulting', 'Marketing & Communication', 'Immobilier', 'Transport & Logistique',
    'Énergie', 'Agriculture', 'Tourisme & Hôtellerie', 'Arts & Culture', 'Services', 'Autre',
];

interface Contact {
    id: string;
    full_name: string;
    company: string;
    job_title: string;
}

export function AddContactModal({ onClose, onContactAdded, defaultIsMember = false, onNavigateToEnterprise }: AddContactModalProps) {
    const { user } = useAuth();
    const { showToast } = useNotifications();
    const [loading, setLoading] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState<string>('');
    const [tagInput, setTagInput] = useState('');
    const [detectedCountryCode, setDetectedCountryCode] = useState<string>('FR');
    const [availableRegions, setAvailableRegions] = useState<string[]>([]);
    const [enterpriseExists, setEnterpriseExists] = useState<boolean>(false);
    const [showEnterpriseWarning, setShowEnterpriseWarning] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [existingContacts, setExistingContacts] = useState<Contact[]>([]);
    const [selectedRelations, setSelectedRelations] = useState<string[]>([]);
    const [relationshipType, setRelationshipType] = useState<string>('contact');
    const [contactSearchQuery, setContactSearchQuery] = useState('');
    const [formData, setFormData] = useState({
        first_name: '', last_name: '', email: '', phone: '', company: '', job_title: '',
        linkedin_url: '', rating: 0, status: 'lead' as const, source: 'event' as const,
        notes: '', tags: [] as string[], city: '', region: '', country: '',
        relationship: '' as 'colleague' | 'client' | 'vendor' | 'partner' | 'friend' | 'other' | '',
        opportunity_amount: '', avatar_url: '', industry: '',
        company_size: '' as '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1000+' | 'freelance' | 'self-employed' | '',
        is_member: defaultIsMember,
    });

    useEffect(() => {
        const initializeCountry = async () => {
            const countryCode = await detectUserCountry();
            setDetectedCountryCode(countryCode);
            const countryName = getCountryName(countryCode);
            const regions = getRegionsByCountryCode(countryCode);
            setAvailableRegions(regions);
            setFormData((prev) => ({ ...prev, country: countryName }));
        };
        initializeCountry();
    }, []);

    useEffect(() => {
        const checkEnterprise = async () => {
            if (!user) return;
            try {
                const res = await fetch('/api/enterprise');
                if (res.ok) {
                    const data = await res.json();
                    setEnterpriseExists(!!data.enterprise);
                }
            } catch (error) {
                console.error('Error checking enterprise:', error);
            }
        };
        checkEnterprise();
    }, [user]);

    useEffect(() => {
        const loadContacts = async () => {
            if (!user) return;
            try {
                const res = await fetch('/api/contacts?fields=id,full_name,company,job_title');
                if (res.ok) {
                    const data = await res.json();
                    setExistingContacts(data.contacts || []);
                }
            } catch (error) {
                console.error('Error loading contacts:', error);
            }
        };
        loadContacts();
    }, [user]);

    const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const countryName = e.target.value;
        const country = COUNTRIES.find(c => c.name === countryName);
        if (country) {
            const regions = getRegionsByCountryCode(country.code);
            setAvailableRegions(regions);
            setFormData((prev) => ({ ...prev, country: countryName, region: '' }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        const validationErrors: Record<string, string> = {};
        if (!formData.first_name.trim()) validationErrors.first_name = 'Le prénom est obligatoire';
        if (!formData.last_name.trim()) validationErrors.last_name = 'Le nom est obligatoire';
        if (!formData.email.trim()) validationErrors.email = "L'email est obligatoire";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) validationErrors.email = "L'email n'est pas valide";
        if (!formData.company.trim()) validationErrors.company = "L'entreprise est obligatoire";
        if (!formData.job_title.trim()) validationErrors.job_title = 'La profession est obligatoire';
        if (!formData.phone.trim()) validationErrors.phone = 'Le numéro de téléphone est obligatoire';

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setErrors({});
        setLoading(true);
        try {
            const fullName = `${formData.first_name.trim()} ${formData.last_name.trim()}`;
            const res = await fetch('/api/contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_name: fullName,
                    email: formData.email.trim(),
                    phone: formData.phone.trim(),
                    company: formData.company.trim(),
                    job_title: formData.job_title.trim(),
                    linkedin_url: formData.linkedin_url || null,
                    rating: formData.rating || null,
                    status: formData.status,
                    source: formData.source,
                    notes: formData.notes || null,
                    tags: formData.tags,
                    city: formData.city || null,
                    region: formData.region || null,
                    country: formData.country || null,
                    relationship: formData.relationship || null,
                    opportunity_amount: formData.opportunity_amount ? parseFloat(formData.opportunity_amount) : null,
                    avatar_url: formData.avatar_url || null,
                    industry: formData.industry || null,
                    company_size: formData.company_size || null,
                    is_member: formData.is_member,
                    selectedRelations,
                    relationshipType,
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                showToast('Erreur', `Erreur lors de l'ajout du contact: ${errData.error || 'Erreur inconnue'}`, 'error');
                throw new Error(errData.error || 'Failed');
            }

            const contactData = await res.json();
            onContactAdded(contactData.contact?.id);
        } catch (error) {
            console.error('Error adding contact:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setAvatarPreview(result);
                setFormData((prev) => ({ ...prev, avatar_url: result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const trimmedTag = tagInput.trim();
            if (trimmedTag && !formData.tags.includes(trimmedTag)) {
                setFormData((prev) => ({ ...prev, tags: [...prev.tags, trimmedTag] }));
                setTagInput('');
            }
        }
    };

    const removeTag = (tagToRemove: string) => {
        setFormData((prev) => ({ ...prev, tags: prev.tags.filter((tag) => tag !== tagToRemove) }));
    };

    return (
        <>
            <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; margin: 20px 0; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #3b82f6 0%, #60a5fa 100%); border-radius: 10px; border: 2px solid transparent; background-clip: padding-box; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg, #2563eb 0%, #3b82f6 100%); border-radius: 10px; border: 2px solid transparent; background-clip: padding-box; }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: #3b82f6 transparent; scroll-behavior: smooth; }
        .scroll-fade-container { position: relative; }
        .scroll-fade-container::before, .scroll-fade-container::after { content: ''; position: absolute; left: 0; right: 20px; height: 40px; pointer-events: none; z-index: 10; }
        .scroll-fade-container::before { top: 0; background: linear-gradient(to bottom, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%); }
        .scroll-fade-container::after { bottom: 0; background: linear-gradient(to top, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%); }
      `}</style>

            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
                <div className="bg-white rounded-2xl sm:rounded-[32px] shadow-2xl w-full max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden relative scroll-fade-container">
                    <div className="absolute top-4 right-4 sm:top-8 sm:right-8 z-20">
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"><X className="w-5 h-5 sm:w-6 sm:h-6" /></button>
                    </div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-pink-100/50 to-transparent rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-100/50 to-transparent rounded-full blur-3xl pointer-events-none"></div>

                    <div className="overflow-y-auto custom-scrollbar max-h-[95vh] sm:max-h-[90vh] pr-2">
                        <form onSubmit={handleSubmit} className="relative p-4 sm:p-8 lg:p-12 space-y-6 sm:space-y-8">
                            <div className="text-center mb-6 sm:mb-8">
                                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">Ajouter un contact</h2>
                                <p className="text-sm sm:text-base text-gray-500 max-w-2xl mx-auto px-2">Remplissez les informations ci-dessous pour ajouter un nouveau contact à votre réseau professionnel</p>
                            </div>

                            <div className="flex justify-center mb-8">
                                <div className="relative">
                                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-100 to-pink-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-xl">
                                        {avatarPreview ? <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" /> : <Upload className="w-12 h-12 text-gray-400" />}
                                    </div>
                                    <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                    <div className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full shadow-lg"><Upload className="w-4 h-4" /></div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 lg:gap-x-12 gap-y-4 sm:gap-y-6">
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Prénom <span className="text-red-500">*</span></label>
                                        <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} className={`w-full px-5 py-4 bg-gray-200 border-0 rounded-2xl focus:outline-none focus:ring-2 ${errors.first_name ? 'ring-2 ring-red-500' : 'focus:ring-blue-400'} placeholder-gray-500 text-gray-900 transition-all`} placeholder="Jean" />
                                        {errors.first_name && <p className="mt-1 text-sm text-red-500">{errors.first_name}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Nom <span className="text-red-500">*</span></label>
                                        <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} className={`w-full px-5 py-4 bg-gray-200 border-0 rounded-2xl focus:outline-none focus:ring-2 ${errors.last_name ? 'ring-2 ring-red-500' : 'focus:ring-blue-400'} placeholder-gray-500 text-gray-900 transition-all`} placeholder="Dupont" />
                                        {errors.last_name && <p className="mt-1 text-sm text-red-500">{errors.last_name}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email <span className="text-red-500">*</span></label>
                                        <input type="email" name="email" value={formData.email} onChange={handleChange} className={`w-full px-5 py-4 bg-gray-200 border-0 rounded-2xl focus:outline-none focus:ring-2 ${errors.email ? 'ring-2 ring-red-500' : 'focus:ring-blue-400'} placeholder-gray-500 text-gray-900 transition-all`} placeholder="jean.dupont@email.com" />
                                        {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Téléphone <span className="text-red-500">*</span></label>
                                        <PhoneInput value={formData.phone} onChange={(value) => setFormData((prev) => ({ ...prev, phone: value }))} defaultCountryCode={detectedCountryCode} />
                                        {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">LinkedIn</label>
                                        <input type="url" name="linkedin_url" value={formData.linkedin_url} onChange={handleChange} className="w-full px-5 py-4 bg-gray-200 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-500 text-gray-900 transition-all" placeholder="linkedin.com/in/jeandupont" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Tags (Appuyez sur Entrée ou virgule)</label>
                                        <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleTagInputKeyDown} className="w-full px-5 py-4 bg-gray-200 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-500 text-gray-900 transition-all" placeholder="Ajouter un tag..." />
                                        {formData.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {formData.tags.map((tag) => (
                                                    <span key={tag} className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                                        {tag}
                                                        <button type="button" onClick={() => removeTag(tag)} className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"><XIcon className="w-3 h-3" /></button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                                        <textarea name="notes" value={formData.notes} onChange={handleChange} rows={4} className="w-full px-5 py-4 bg-gray-200 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-500 text-gray-900 resize-none transition-all" placeholder="Ajoutez des notes sur ce contact..." />
                                    </div>
                                    {existingContacts.length > 0 && (
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Contacts associés</label>
                                            <div className="space-y-3">
                                                <select value={relationshipType} onChange={(e) => setRelationshipType(e.target.value)} className="w-full px-5 py-3 bg-gray-200 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900 transition-all cursor-pointer text-sm">
                                                    <option value="contact">Contact</option><option value="colleague">Collègue</option><option value="friend">Ami</option><option value="family">Famille</option><option value="partner">Partenaire</option><option value="client">Client</option><option value="supplier">Fournisseur</option>
                                                </select>
                                                <div className="relative">
                                                    <input type="text" value={contactSearchQuery} onChange={(e) => setContactSearchQuery(e.target.value)} placeholder="Rechercher un contact..." className="w-full px-5 py-3 bg-gray-200 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-500 text-gray-900 transition-all text-sm" />
                                                    {contactSearchQuery && <button type="button" onClick={() => setContactSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>}
                                                </div>
                                                <div className="max-h-48 overflow-y-auto bg-gray-50 rounded-2xl p-3 space-y-2">
                                                    {existingContacts.filter(contact => {
                                                        if (!contactSearchQuery) return true;
                                                        const query = contactSearchQuery.toLowerCase();
                                                        return contact.full_name.toLowerCase().includes(query) || contact.company?.toLowerCase().includes(query) || contact.job_title?.toLowerCase().includes(query);
                                                    }).map((contact) => (
                                                        <label key={contact.id} className="flex items-start gap-3 p-3 hover:bg-white rounded-xl cursor-pointer transition-colors">
                                                            <input type="checkbox" checked={selectedRelations.includes(contact.id)} onChange={(e) => { if (e.target.checked) setSelectedRelations([...selectedRelations, contact.id]); else setSelectedRelations(selectedRelations.filter(id => id !== contact.id)); }} className="mt-0.5 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-400" />
                                                            <div className="flex-1 min-w-0"><div className="font-medium text-gray-900 text-sm truncate">{contact.full_name}</div><div className="text-xs text-gray-500 truncate">{contact.job_title} • {contact.company}</div></div>
                                                        </label>
                                                    ))}
                                                    {existingContacts.filter(contact => { if (!contactSearchQuery) return true; const query = contactSearchQuery.toLowerCase(); return contact.full_name.toLowerCase().includes(query) || contact.company?.toLowerCase().includes(query) || contact.job_title?.toLowerCase().includes(query); }).length === 0 && <p className="text-sm text-gray-500 text-center py-4">Aucun contact trouvé</p>}
                                                </div>
                                                {selectedRelations.length > 0 && <p className="text-xs text-gray-600 px-2">{selectedRelations.length} contact{selectedRelations.length > 1 ? 's' : ''} sélectionné{selectedRelations.length > 1 ? 's' : ''}</p>}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Entreprise <span className="text-red-500">*</span></label>
                                        <input type="text" name="company" value={formData.company} onChange={handleChange} className={`w-full px-5 py-4 bg-gray-200 border-0 rounded-2xl focus:outline-none focus:ring-2 ${errors.company ? 'ring-2 ring-red-500' : 'focus:ring-blue-400'} placeholder-gray-500 text-gray-900 transition-all`} placeholder="Acme Inc." />
                                        {errors.company && <p className="mt-1 text-sm text-red-500">{errors.company}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Profession <span className="text-red-500">*</span></label>
                                        <input type="text" name="job_title" value={formData.job_title} onChange={handleChange} className={`w-full px-5 py-4 bg-gray-200 border-0 rounded-2xl focus:outline-none focus:ring-2 ${errors.job_title ? 'ring-2 ring-red-500' : 'focus:ring-blue-400'} placeholder-gray-500 text-gray-900 transition-all`} placeholder="Directeur Commercial" />
                                        {errors.job_title && <p className="mt-1 text-sm text-red-500">{errors.job_title}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Secteur d&apos;activité</label>
                                        <select name="industry" value={formData.industry} onChange={handleChange} className="w-full px-5 py-4 bg-gray-200 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900 transition-all cursor-pointer">
                                            <option value="">Sélectionner...</option>
                                            {INDUSTRIES.map((industry) => <option key={industry} value={industry}>{industry}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Taille de l&apos;entreprise</label>
                                        <select name="company_size" value={formData.company_size} onChange={handleChange} className="w-full px-5 py-4 bg-gray-200 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900 transition-all cursor-pointer">
                                            <option value="">Sélectionner...</option>
                                            <option value="self-employed">Auto-entrepreneur</option><option value="freelance">Freelance</option>
                                            <option value="1-10">1-10 employés</option><option value="11-50">11-50 employés</option>
                                            <option value="51-200">51-200 employés</option><option value="201-500">201-500 employés</option>
                                            <option value="501-1000">501-1000 employés</option><option value="1000+">1000+ employés</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Ville</label>
                                        <input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full px-5 py-4 bg-gray-200 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-500 text-gray-900 transition-all" placeholder="Paris" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Pays</label>
                                        <select name="country" value={formData.country} onChange={handleCountryChange} className="w-full px-5 py-4 bg-gray-200 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900 transition-all cursor-pointer">
                                            <option value="">Sélectionner...</option>
                                            {COUNTRIES.map((country) => <option key={country.code} value={country.name}>{country.flag} {country.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Région</label>
                                        {availableRegions.length > 0 ? (
                                            <select name="region" value={formData.region} onChange={handleChange} className="w-full px-5 py-4 bg-gray-200 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900 transition-all cursor-pointer">
                                                <option value="">Sélectionner...</option>
                                                {availableRegions.map((region) => <option key={region} value={region}>{region}</option>)}
                                            </select>
                                        ) : (
                                            <input type="text" name="region" value={formData.region} onChange={handleChange} className="w-full px-5 py-4 bg-gray-200 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-500 text-gray-900 transition-all" placeholder="Région" />
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Statut</label>
                                            <select name="status" value={formData.status} onChange={handleChange} className="w-full px-5 py-4 bg-gray-200 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900 transition-all cursor-pointer">
                                                <option value="lead">Lead</option><option value="prospect">Prospect</option><option value="client">Client</option><option value="partner">Partenaire</option><option value="collaborateur">Collaborateur</option><option value="ami">Ami(e)</option><option value="fournisseur">Fournisseur</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Source</label>
                                            <select name="source" value={formData.source} onChange={handleChange} className="w-full px-5 py-4 bg-gray-200 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900 transition-all cursor-pointer">
                                                <option value="event">Événement</option><option value="referral">Recommandation</option><option value="cold_outreach">Prospection</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Type de relation</label>
                                        <select name="relationship" value={formData.relationship} onChange={handleChange} className="w-full px-5 py-4 bg-gray-200 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900 transition-all cursor-pointer">
                                            <option value="">Sélectionner...</option><option value="colleague">Collègue</option><option value="client">Client</option><option value="vendor">Fournisseur</option><option value="partner">Partenaire</option><option value="friend">Ami</option><option value="other">Autre</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Montant d&apos;opportunité (€)</label>
                                        <input type="number" name="opportunity_amount" value={formData.opportunity_amount} onChange={handleChange} className="w-full px-5 py-4 bg-gray-200 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-500 text-gray-900 transition-all" placeholder="0" min="0" step="0.01" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Évaluation</label>
                                        <div className="flex gap-2 py-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button key={star} type="button" onClick={() => setFormData((prev) => ({ ...prev, rating: star }))} className="transition-transform hover:scale-110">
                                                    <Star className={`w-8 h-8 ${star <= formData.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <div className="relative">
                                                <input type="checkbox" checked={formData.is_member} onChange={(e) => { if (e.target.checked && !enterpriseExists) setShowEnterpriseWarning(true); else setFormData((prev) => ({ ...prev, is_member: e.target.checked })); }} className="sr-only peer" />
                                                <div className="w-6 h-6 bg-gray-200 rounded-lg peer-checked:bg-blue-500 transition-colors flex items-center justify-center">
                                                    {formData.is_member && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Users className="w-5 h-5 text-gray-500 group-hover:text-blue-500 transition-colors" />
                                                <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">Définir comme membre de mon entreprise</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 pt-4 sm:pt-6 pb-4">
                                <button type="button" onClick={onClose} className="px-6 sm:px-8 py-3 sm:py-4 text-gray-700 font-semibold rounded-2xl hover:bg-gray-100 transition-all">Annuler</button>
                                <button type="submit" disabled={loading} className="px-8 sm:px-10 py-3 sm:py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed">{loading ? 'Enregistrement...' : 'Enregistrer'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {showEnterpriseWarning && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4"><Users className="w-8 h-8 text-blue-600" /></div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Entreprise non configurée</h3>
                            <p className="text-gray-600 mb-6">Pour ajouter des membres à votre entreprise, vous devez d&apos;abord la créer dans la section Entreprise.</p>
                            <div className="flex gap-3 w-full">
                                <button onClick={() => setShowEnterpriseWarning(false)} className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors">Plus tard</button>
                                <button onClick={() => { setShowEnterpriseWarning(false); onClose(); onNavigateToEnterprise?.(); }} className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/30">Créer mon entreprise</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
