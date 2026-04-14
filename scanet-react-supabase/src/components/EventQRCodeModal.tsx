import { X, Download, Copy, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';

interface EventQRCodeModalProps {
  eventName: string;
  qrCodeToken: string;
  onClose: () => void;
}

export function EventQRCodeModal({ eventName, qrCodeToken, onClose }: EventQRCodeModalProps) {
  const [copied, setCopied] = useState(false);

  const registrationUrl = `${window.location.origin}/join-event/${qrCodeToken}`;

  const handleDownloadQR = () => {
    const svg = document.getElementById('event-qr-code');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = 1000;
    canvas.height = 1200;

    img.onload = () => {
      if (!ctx) return;

      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#1F2937';
      ctx.font = 'bold 48px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(eventName, canvas.width / 2, 80);

      ctx.font = '32px system-ui';
      ctx.fillStyle = '#6B7280';
      ctx.fillText('Scannez pour vous enregistrer', canvas.width / 2, 130);

      const qrSize = 700;
      const qrX = (canvas.width - qrSize) / 2;
      const qrY = 180;
      ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

      ctx.font = '24px system-ui';
      ctx.fillStyle = '#9CA3AF';
      ctx.fillText('Ou visitez:', canvas.width / 2, qrY + qrSize + 60);

      ctx.font = '20px monospace';
      ctx.fillStyle = '#4B5563';
      const urlText = registrationUrl.length > 50
        ? registrationUrl.substring(0, 47) + '...'
        : registrationUrl;
      ctx.fillText(urlText, canvas.width / 2, qrY + qrSize + 100);

      const link = document.createElement('a');
      link.download = `qr-code-${eventName.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(registrationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };


  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
        <div className="flex items-start sm:items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <div className="flex-1 pr-2">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 line-clamp-2">Code QR de l'événement</h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">Partagez ce code pour permettre l'enregistrement des contacts</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
          </button>
        </div>

        <div className="p-4 sm:p-6 md:p-8 overflow-y-auto max-h-[calc(95vh-100px)] sm:max-h-[calc(90vh-140px)]">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6">
            <div className="flex justify-center mb-4">
              <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl shadow-lg">
                <QRCodeSVG
                  id="event-qr-code"
                  value={registrationUrl}
                  size={window.innerWidth < 400 ? 200 : window.innerWidth < 640 ? 250 : 300}
                  level="H"
                  includeMargin={true}
                />
              </div>
            </div>
            <h3 className="text-center text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-2 px-2 line-clamp-2">{eventName}</h3>
            <p className="text-center text-xs sm:text-sm text-gray-600">
              Scannez ce code QR pour vous enregistrer
            </p>
          </div>

          <div className="space-y-2 sm:space-y-3">
            <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
              <label className="block text-xs font-semibold text-gray-600 mb-2">Lien d'enregistrement</label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  value={registrationUrl}
                  readOnly
                  className="flex-1 px-3 sm:px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs sm:text-sm text-gray-700 font-mono overflow-hidden text-ellipsis"
                />
                <button
                  onClick={handleCopyUrl}
                  className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="text-xs sm:text-sm font-medium">Copié</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="text-xs sm:text-sm font-medium">Copier</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <button
              onClick={handleDownloadQR}
              className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-green-600 text-white rounded-lg sm:rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-semibold text-sm sm:text-base"
            >
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              Télécharger le code QR
            </button>
          </div>

          <div className="mt-4 sm:mt-6 bg-blue-50 border border-blue-200 rounded-lg sm:rounded-xl p-3 sm:p-4">
            <h4 className="text-xs sm:text-sm font-bold text-blue-900 mb-2">Comment l'utiliser ?</h4>
            <ul className="text-xs sm:text-sm text-blue-800 space-y-1">
              <li>• Imprimez le code QR et affichez-le lors de votre événement</li>
              <li>• Partagez le lien d'enregistrement par email ou réseaux sociaux</li>
              <li>• Les participants pourront s'enregistrer en scannant le code</li>
              <li>• Ils seront automatiquement ajoutés à vos contacts et associés à cet événement</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
