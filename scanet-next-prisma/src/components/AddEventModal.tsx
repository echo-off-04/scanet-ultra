'use client';

import { useState } from 'react';
import { X, Upload, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { MaterialButton } from './material/MaterialButton';
import { MaterialIconButton } from './material/MaterialIconButton';

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
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/30 p-2 sm:p-4">
            <div className="my-4 flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:my-8">
                <div className="flex items-center justify-between border-b border-slate-200 p-4 sm:p-6">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Créer un événement</h2>
                        <p className="mt-1 text-xs text-slate-600 sm:text-sm">Remplissez les informations de votre événement</p>
                    </div>
                    <MaterialIconButton ariaLabel="Fermer" onClick={onClose} icon={<X className="h-5 w-5 sm:h-6 sm:w-6" />} />
                </div>

                <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
                    <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
                        <div>
                            <h3 className="mb-4 text-lg font-semibold text-slate-900">Informations générales</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">Nom de l&apos;événement *</label>
                                    <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-modern py-2.5" placeholder="Salon Tech 2024" />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">Description</label>
                                    <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="input-modern resize-none py-2.5" placeholder="Décrivez votre événement..." />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">Catégorie</label>
                                        <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="input-modern py-2.5">
                                            {CATEGORIES.map((cat) => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">Type</label>
                                        <select value={formData.event_type} onChange={(e) => setFormData({ ...formData, event_type: e.target.value })} className="input-modern py-2.5">
                                            {EVENT_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">Date de début</label>
                                        <input type="datetime-local" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className="input-modern py-2.5" />
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">Date de fin</label>
                                        <input type="datetime-local" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} className="input-modern py-2.5" />
                                    </div>
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">Lieu / Lien</label>
                                    <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="input-modern py-2.5" placeholder="Paris, France ou https://zoom.us/..." />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">Image / Flyer</label>
                                    <div className="mt-2">
                                        {imagePreview && <div className="mb-4"><img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-xl" /></div>}
                                        <label className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 transition-colors hover:bg-slate-100">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <Upload className="mb-2 h-10 w-10 text-slate-400" />
                                                <p className="text-sm text-slate-600"><span className="font-semibold">Cliquez pour uploader</span> ou glissez-déposez</p>
                                                <p className="mt-1 text-xs text-slate-500">PNG, JPG jusqu&apos;à 10MB</p>
                                            </div>
                                            <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="mb-4 text-lg font-semibold text-slate-900">Objectifs et public</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">Nombre cible de participants</label>
                                    <input type="number" min="0" value={formData.target_participants} onChange={(e) => setFormData({ ...formData, target_participants: e.target.value === '' ? '' : parseInt(e.target.value) })} className="input-modern py-2.5" placeholder="Ex: 50" />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">Objectif principal</label>
                                    <select value={formData.primary_objective} onChange={(e) => setFormData({ ...formData, primary_objective: e.target.value })} className="input-modern py-2.5">
                                        {OBJECTIVES.map((obj) => <option key={obj.value} value={obj.value}>{obj.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-3 block text-sm font-semibold text-slate-700">Objectifs secondaires</label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                        {OBJECTIVES.map((obj) => (
                                            <MaterialButton
                                                key={obj.value}
                                                type="button"
                                                onClick={() => handleObjectiveToggle(obj.value)}
                                                variant={formData.secondary_objectives.includes(obj.value) ? 'filled' : 'text'}
                                                className="justify-center text-sm"
                                            >
                                                {obj.label}
                                            </MaterialButton>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="mb-3 block text-sm font-semibold text-slate-700">Type de public visé</label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                        {AUDIENCE_TYPES.map((aud) => (
                                            <MaterialButton
                                                key={aud.value}
                                                type="button"
                                                onClick={() => handleAudienceToggle(aud.value)}
                                                variant={formData.target_audience.includes(aud.value) ? 'filled' : 'text'}
                                                className="justify-center text-sm"
                                            >
                                                {aud.label}
                                            </MaterialButton>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="order-1 flex flex-col justify-end gap-2 border-t border-slate-200 bg-slate-50 p-4 sm:flex-row sm:gap-3 sm:p-6">
                        <MaterialButton type="button" onClick={onClose} disabled={loading} variant="outlined" className="order-2 justify-center sm:order-1">Annuler</MaterialButton>
                        <MaterialButton type="submit" disabled={loading} icon={loading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div> : <CalendarIcon className="h-5 w-5" />} className="order-1 justify-center sm:order-2">
                            {loading ? 'Création...' : 'Créer l’événement'}
                        </MaterialButton>
                    </div>
                </form>
            </div>
        </div>
    );
}
