import { X, Camera, QrCode, Plus } from 'lucide-react';

interface AddContactOptionsModalProps {
  onClose: () => void;
  onScanCard: () => void;
  onShowEventQR: () => void;
  onManualAdd: () => void;
  hasActiveEvent?: boolean;
}

export function AddContactOptionsModal({
  onClose,
  onScanCard,
  onShowEventQR,
  onManualAdd,
  hasActiveEvent = false,
}: AddContactOptionsModalProps) {
  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 shadow-2xl max-h-[80vh] overflow-y-auto lg:max-w-md lg:mx-auto lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2 lg:rounded-3xl">
        <div className="sticky top-0 bg-white rounded-t-3xl z-10 border-b border-gray-200">
          <div className="flex items-center justify-between p-5">
            <h3 className="text-lg font-bold text-gray-900">Ajouter un contact</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-3">
          <button
            onClick={() => {
              onScanCard();
              onClose();
            }}
            className="w-full flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 hover:from-blue-100 hover:to-blue-200/50 transition-all duration-200 group border border-blue-200/50"
          >
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
              <Camera className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-bold text-gray-900 text-base mb-1">Scanner une carte de visite</div>
              <div className="text-sm text-gray-600">Utilisez la caméra pour numériser</div>
            </div>
          </button>

          <button
            onClick={() => {
              if (hasActiveEvent) {
                onShowEventQR();
              }
              onClose();
            }}
            disabled={!hasActiveEvent}
            className={`w-full flex items-center gap-4 p-5 rounded-2xl transition-all duration-200 group border ${
              hasActiveEvent
                ? 'bg-gradient-to-br from-purple-50 to-purple-100/50 hover:from-purple-100 hover:to-purple-200/50 border-purple-200/50 cursor-pointer'
                : 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-60'
            }`}
          >
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ${
              hasActiveEvent
                ? 'bg-gradient-to-br from-purple-500 to-purple-600 group-hover:scale-110 transition-transform'
                : 'bg-gray-400'
            }`}>
              <QrCode className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-bold text-gray-900 text-base mb-1">
                QR Code événement
                {!hasActiveEvent && <span className="ml-2 text-xs font-normal text-gray-500">(Aucun événement)</span>}
              </div>
              <div className="text-sm text-gray-600">
                {hasActiveEvent ? 'Partagez le lien de votre événement' : 'Créez un événement pour activer cette option'}
              </div>
            </div>
          </button>

          <button
            onClick={() => {
              onManualAdd();
              onClose();
            }}
            className="w-full flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 hover:from-emerald-100 hover:to-emerald-200/50 transition-all duration-200 group border border-emerald-200/50"
          >
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
              <Plus className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-bold text-gray-900 text-base mb-1">Créer manuellement</div>
              <div className="text-sm text-gray-600">Remplir le formulaire de contact</div>
            </div>
          </button>
        </div>

        <div className="h-6" />
      </div>
    </>
  );
}
