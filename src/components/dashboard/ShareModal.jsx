import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Copy, Share2, Download, QrCode } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import QRCode from 'qrcode';

const ShareModal = ({ isOpen, onClose, wishlist }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  const username = user?.user_metadata?.username;
  const wishlistUrl = wishlist && username ? `${window.location.origin}/${username}/${wishlist.slug}` : '';
  const shareText = `Check out my wishlist: ${wishlist?.title}! ${wishlistUrl}`;

  // Generate QR code when modal opens
  React.useEffect(() => {
    if (isOpen && wishlistUrl) {
      QRCode.toDataURL(wishlistUrl)
        .then(url => setQrCodeUrl(url))
        .catch(err => console.error('Error generating QR code:', err));
    }
  }, [isOpen, wishlistUrl]);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied to clipboard!',
        description: 'Link copied successfully.'
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Failed to copy',
        description: 'Could not copy to clipboard.'
      });
    }
  };

  const shareToWhatsApp = () => {
    const encodedText = encodeURIComponent(shareText);
    const whatsappUrl = `https://wa.me/?text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
  };

  const downloadQRCode = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a');
      link.download = `wishlist-${wishlist?.slug}-qr.png`;
      link.href = qrCodeUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (!wishlist) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" fullscreenOnMobile={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share Wishlist
          </DialogTitle>
          <DialogDescription>
            Share your wishlist with friends and family. Use the options below to copy the link or generate a QR code.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Wishlist Info */}
          <div className="text-center">
            <h3 className="font-semibold text-lg">{wishlist.title}</h3>
            {wishlist.occasion && (
              <p className="text-sm text-gray-600 mt-1">{wishlist.occasion}</p>
            )}
          </div>

          {/* Share Link */}
          <div className="space-y-2">
            <Label htmlFor="share-link">Share Link</Label>
            <div className="flex gap-2">
              <Input
                id="share-link"
                value={wishlistUrl}
                readOnly
                className="flex-1"
              />
              <Button
                variant="modal"
                size="sm"
                onClick={() => copyToClipboard(wishlistUrl)}
                className="bg-white"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* QR Code */}
          {qrCodeUrl && (
            <div className="space-y-2">
              <Label>QR Code</Label>
              <div className="flex flex-col items-center space-y-3">
                <img 
                  src={qrCodeUrl} 
                  alt="QR Code" 
                  className="w-32 h-32 border"
                />
                <Button
                  variant="modal"
                  size="sm"
                  onClick={downloadQRCode}
                  className="flex items-center gap-2 bg-white"
                >
                  <Download className="w-4 h-4" />
                  Download QR
                </Button>
              </div>
            </div>
          )}

          {/* Share Actions */}
          <div className="space-y-2">
            <Label>Share to Social</Label>
            <div className="flex gap-2">
              <Button
                variant="modal"
                onClick={shareToWhatsApp}
                className="flex-1 bg-brand-green text-black"
              >
                WhatsApp
              </Button>
              <Button
                variant="modal"
                onClick={() => copyToClipboard(shareText)}
                className="flex-1 bg-white"
              >
                Copy Text
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareModal;
