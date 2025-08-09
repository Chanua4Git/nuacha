
import React from 'react';
import { Receipt, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface UploadAreaProps {
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  isDragging: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onCameraClick: () => void;
  onUploadClick: () => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const UploadArea: React.FC<UploadAreaProps> = ({
  onDragOver,
  onDragLeave,
  onDrop,
  isDragging,
  fileInputRef,
  onCameraClick,
  onUploadClick,
  handleFileSelect,
}) => {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors",
        isDragging ? "border-primary bg-primary/5" : "border-gray-200",
      )}
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        id="receipt-upload"
        ref={fileInputRef}
      />
      
      <div className="flex flex-col items-center gap-3">
        <Receipt className="h-8 w-8 text-gray-400" />
        <div className="text-sm text-gray-600">
          <span className="font-medium text-primary">Add a receipt</span> or gently drop it here
        </div>
        <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
        <p className="text-xs text-muted-foreground">We'll help fill in the details from your receipt</p>
        
        <div className="flex flex-col sm:flex-row gap-2 mt-2 w-full">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full flex justify-center items-center gap-2" 
            onClick={onCameraClick}
          >
            <Camera className="h-4 w-4" />
            Take Photo
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full flex justify-center items-center gap-2"
            onClick={onUploadClick}
          >
            <Receipt className="h-4 w-4" />
            Upload
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UploadArea;
