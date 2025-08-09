
import { useLocation, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const BackToAuthDemo = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  if (params.get("from") !== "auth-demo") return null;

  return (
    <div className="w-full flex items-center mb-6 mt-2">
      <Link
        to="/authentication-demo"
        className="flex items-center gap-2 text-primary hover:underline text-sm transition-colors ml-2"
        aria-label="Back to Auth Demo"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Auth Demo
      </Link>
    </div>
  );
};

export default BackToAuthDemo;
