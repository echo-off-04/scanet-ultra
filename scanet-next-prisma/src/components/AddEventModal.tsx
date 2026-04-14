'use client';

import { useState } from 'react';
import { X, Upload, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = [
    { value: 'conference', label: 'Conférence' },
    { value: 'seminar', label: 'Séminaire' },
    { value: 'networking', label: 'Networking' },
    { value: 'salon', label: 'Salon' },
    { value: 'gala', label: 'Soirée gala' },
    { value: 'meetup', label: 'Meetup' },
];

const EVENT_TYPES = [
    { value: 'presentiel', label: 'Présentiel' },
    { value: 'online', label: 'En ligne' },
    { value: 'hybride', label: 'Hybride' },
];

const OBJECTIVES = [
    { value: 'leads', label: 'Génération leads' },
    { value: 'recruitment', label: 'Recrutement partenaires' },
    { value: 'sales', label: 'Ventes' },
    { value: 'brand', label: 'Visibilité marque' },
    { value: 'networking', label: 'Networking' },
    { value: 'training', label: 'Formation' },
];

const AUDIENCE_TYPES = [
    { value: 'decision_makers', label: 'Décideurs' },
    { value: 'freelancers', label: 'Freelancers' },
    { value: 'startups', label: 'Startups' },
    { value: 'investors', label: 'Investisseurs' },
    { value: 'developers', label: 'Développeurs' },
    { value: 'managers', label: 'Managers' },
];

interface AddEventModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export function AddEventModal({ onClose, onSuccess }: AddEventModalProps) {
    const [loading, setLoading] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: 'conference',
        event_type: 'presentiel',
        status: 'upcoming',
        start_date: '',
        end_date: '',
        location: '',
        target_participants: '' as number | '',
        primary_objective: 'leads',
        secondary_objectives: [] as string[],
        target_audience: [] as string[],
    });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleObjectiveToggle = (value: string) => {
        setFormData((prev) => ({
            ...prev,
            secondary_objectives: prev.secondary_objectives.includes(value)
                ? prev.secondary_objectives.filter((obj) => obj !== value)
                : [...prev.secondary_objectives, value],
        }));
    };

    const handleAudienceToggle = (value: string) => {
        setFormData((prev) => ({
            ...prev,
            target_audience: prev.target_audience.includes(value)
                ? prev.target_audience.filter((aud) => aud !== value)
                : [...prev.target_audience, value],
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setLoading(true);

            let imageUrl = null;
            if (imageFile) {
                const formDataUpload = new FormData();
                formDataUpload.append('file', imageFile);
                const uploadRes = await fetch('/api/upload', { method: 'POST', body: formDataUpload });
                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    imageUrl = uploadData.url;
                }
            }

            const res = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    description: formData.description,
                    category: formData.category,
                    event_type: formData.event_type,
                    status: formData.status,
                    start_date: formData.start_date || null,
                    end_date: formData.end_date || null,
                    location: formData.location,
                    image_url: imageUrl,
                    target_participants: typeof formData.target_participants === 'number' ? formData.target_participants : 0,
                    primary_objective: formData.primary_objective,
                    secondary_objectives: formData.secondary_objectives,
                    target_audience: formData.target_audience,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to create event');
            }

            toast.success('Événement créé avec succès !');
            onSuccess();
        } catch (error: any) {
            console.error('Error creating event:', error);
            toast.error(`Erreur: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-xl sm:rounded-2xl max-w-4xl w-full my-4 sm:my-8 shadow-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Créer un événement</h2>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">Remplissez les informations de votre événement</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" /></button>
                </div>

                <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
                    <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Informations générales</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nom de l&apos;événement *</label>
                                    <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all" placeholder="Salon Tech 2024" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                                    <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all resize-none" placeholder="Décrivez votre événement..." />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Catégorie</label>
                                        <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all">
                                            {CATEGORIES.map((cat) => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                                        <select value={formData.event_type} onChange={(e) => setFormData({ ...formData, event_type: e.target.value })} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all">
                                            {EVENT_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Date de début</label>
                                        <input type="datetime-local" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Date de fin</label>
                                        <input type="datetime-local" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Lieu / Lien</label>
                                    <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all" placeholder="Paris, France ou https://zoom.us/..." />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Image / Flyer</label>
                                    <div className="mt-2">
                                        {imagePreview && <div className="mb-4"><img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-xl" /></div>}
                                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <Upload className="w-10 h-10 text-gray-400 mb-2" />
                                                <p className="text-sm text-gray-600"><span className="font-semibold">Cliquez pour uploader</span> ou glissez-déposez</p>
                                                <p className="text-xs text-gray-500 mt-1">PNG, JPG jusqu&apos;à 10MB</p>
                                            </div>
                                            <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Objectifs et public</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre cible de participants</label>
                                    <input type="number" min="0" value={formData.target_participants} onChange={(e) => setFormData({ ...formData, target_participants: e.target.value === '' ? '' : parseInt(e.target.value) })} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all" placeholder="Ex: 50" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Objectif principal</label>
                                    <select value={formData.primary_objective} onChange={(e) => setFormData({ ...formData, primary_objective: e.target.value })} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all">
                                        {OBJECTIVES.map((obj) => <option key={obj.value} value={obj.value}>{obj.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">Objectifs secondaires</label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                        {OBJECTIVES.map((obj) => (
                                            <button key={obj.value} type="button" onClick={() => handleObjectiveToggle(obj.value)} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${formData.secondary_objectives.includes(obj.value) ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{obj.label}</button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">Type de public visé</label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                        {AUDIENCE_TYPES.map((aud) => (
                                            <button key={aud.value} type="button" onClick={() => handleAudienceToggle(aud.value)} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${formData.target_audience.includes(aud.value) ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{aud.label}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
                        <button type="button" onClick={onClose} disabled={loading} className="px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold disabled:opacity-50 order-2 sm:order-1">Annuler</button>
                        <button type="submit" disabled={loading} className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-md disabled:opacity-50 flex items-center justify-center gap-2 order-1 sm:order-2">
                            {loading ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>Création...</>) : (<><CalendarIcon className="w-5 h-5" />Créer l&apos;événement</>)}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
