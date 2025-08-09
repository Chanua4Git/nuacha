
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Receipt } from 'lucide-react';

interface ReceiptImageProps {
  imageUrl: string;
}

const ReceiptImage: React.FC<ReceiptImageProps> = ({ imageUrl }) => {
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
          <img 
            src={imageUrl} 
            alt="Receipt" 
            className="w-full object-contain max-h-[500px]" 
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ReceiptImage;
