import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface ReceiptProcessingLoaderProps {
  className?: string;
}

const ReceiptProcessingLoader = ({ className = "" }: ReceiptProcessingLoaderProps) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [fadeClass, setFadeClass] = useState('animate-fade-in');

  const messages = [
    "Organised Finances",
    "All Your Receipts Scanned With Ease", 
    "Financial Peace Through Technology",
    "Your Receipts, Perfectly Organized"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeClass('animate-fade-out');
      
      setTimeout(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
        setFadeClass('animate-fade-in');
      }, 150); // Half of fade transition time
    }, 2500); // Change message every 2.5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center ${className}`}>
      <div className="bg-white p-6 rounded-lg flex flex-col items-center gap-4 max-w-xs mx-4">
        <Loader2 
          className="h-8 w-8 animate-spin" 
          style={{ color: '#5A7684' }}
        />
        <p className={`text-sm font-medium text-center transition-opacity duration-300 ${fadeClass}`}>
          {messages[currentMessageIndex]}
        </p>
      </div>
    </div>
  );
};

export default ReceiptProcessingLoader;