
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Receipt, ImageOff } from 'lucide-react';
import { getSignedReceiptUrl } from '@/utils/receipt/signedUrls';

interface ReceiptImageProps {
  imageUrl: string;
}

const isLocalUrl = (url: string) => url.startsWith('blob:') || url.startsWith('data:');

const ReceiptImage: React.FC<ReceiptImageProps> = ({ imageUrl }) => {
  const [src, setSrc] = useState<string | null>(isLocalUrl(imageUrl) ? imageUrl : null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    if (!imageUrl) { setFailed(true); return; }
    if (isLocalUrl(imageUrl)) { setSrc(imageUrl); return; }
    // Receipts are stored privately, so we need a short-lived link to show them
    getSignedReceiptUrl(imageUrl).then((url) => {
      if (cancelled) return;
      if (url) setSrc(url); else setFailed(true);
    }).catch(() => !cancelled && setFailed(true));
    return () => { cancelled = true; };
  }, [imageUrl]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <Receipt className="w-4 h-4 mr-2" />
          Receipt Image
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-md">
          {failed ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <ImageOff className="w-6 h-6" />
              <span>We couldn't show the picture here, but your receipt details are safe.</span>
            </div>
          ) : src ? (
            <img
              src={src}
              alt="Receipt"
              className="w-full object-contain max-h-[500px]"
              onError={() => setFailed(true)}
            />
          ) : (
            <div className="py-10 text-center text-sm text-muted-foreground">Loading picture…</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReceiptImage;
