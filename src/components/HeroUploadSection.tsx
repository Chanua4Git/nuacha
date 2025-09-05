import { Button } from "@/components/ui/button";
import { Camera, Upload, Leaf } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface HeroUploadSectionProps {
  onCameraClick?: () => void;
  onUploadClick?: () => void;
  onFileSelect?: (file: File) => void;
  isDemo?: boolean;
}

const HeroUploadSection = ({ 
  onCameraClick, 
  onUploadClick, 
  onFileSelect, 
  isDemo = false 
}: HeroUploadSectionProps) => {
  const navigate = useNavigate();

  const handleCameraAction = () => {
    if (isDemo && onCameraClick) {
      onCameraClick();
    } else {
      navigate('/demo');
    }
  };

  const handleUploadAction = () => {
    if (isDemo && onUploadClick) {
      onUploadClick();
    } else {
      navigate('/demo');
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onFileSelect) {
      onFileSelect(file);
    }
  };

  return (
    <div className="relative py-16 px-4 md:px-6 lg:px-8">
      {/* Gentle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#C3DCD1]/30 via-[#F4E8D3]/20 to-[#F1CBC7]/20 rounded-3xl"></div>
      
      <div className="relative max-w-4xl mx-auto">
        <div className="text-center space-y-8">
          {/* Peaceful header */}
          <div className="space-y-4">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-[#C3DCD1]/40 animate-pulse">
                <Leaf className="h-8 w-8 text-[#5A7684]" />
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-playfair text-[#2F2F2F]">
              Begin Your Journey to Financial Peace
            </h2>
            <p className="text-lg text-[#5C5C5C] max-w-2xl mx-auto leading-relaxed">
              Take a gentle first step. Upload your receipt and watch as we transform it into organized, peaceful financial clarity.
            </p>
          </div>

          {/* Prominent action buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button
              size="lg"
              onClick={handleCameraAction}
              className="group relative overflow-hidden bg-[#5A7684] hover:bg-[#5A7684]/90 text-white rounded-2xl px-8 py-6 h-auto shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#5A7684]/80 to-[#5A7684] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative flex items-center space-x-3">
                <div className="p-2 rounded-full bg-white/20 group-hover:bg-white/30 transition-colors duration-300">
                  <Camera className="h-8 w-8" />
                </div>
                <div className="text-left">
                  <div className="text-lg font-medium">Capture with Care</div>
                  <div className="text-sm opacity-90">Take a photo of your receipt</div>
                </div>
              </div>
            </Button>

            <div className="text-[#5C5C5C] font-light">or</div>

            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                id="hero-file-upload"
              />
              <Button
                size="lg"
                onClick={handleUploadAction}
                variant="outline"
                className="group relative overflow-hidden border-2 border-[#5A7684] text-[#5A7684] hover:bg-[#5A7684] hover:text-white rounded-2xl px-8 py-6 h-auto shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-105"
              >
                <div className="relative flex items-center space-x-3">
                  <div className="p-2 rounded-full bg-[#5A7684]/10 group-hover:bg-white/20 transition-colors duration-300">
                    <Upload className="h-8 w-8" />
                  </div>
                  <div className="text-left">
                    <div className="text-lg font-medium">Share Mindfully</div>
                    <div className="text-sm opacity-80 group-hover:opacity-90">Upload from your device</div>
                  </div>
                </div>
              </Button>
            </div>
          </div>

          {/* Reassuring message */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-[#C3DCD1]/30">
            <p className="text-[#5C5C5C] text-sm leading-relaxed">
              ✨ <span className="font-medium">Your privacy matters to us.</span> We handle your receipts with the utmost care and gentleness. 
              Take your time, breathe, and let us guide you toward financial serenity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroUploadSection;