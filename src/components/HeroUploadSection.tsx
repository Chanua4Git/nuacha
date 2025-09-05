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
  return;
};
export default HeroUploadSection;