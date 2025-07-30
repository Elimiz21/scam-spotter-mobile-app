import { Link } from "react-router-dom";

const PolicyFooter = () => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center text-sm text-muted-foreground">
      <Link 
        to="/privacy-policy" 
        className="hover:text-primary transition-colors underline"
      >
        Privacy Policy
      </Link>
      <span className="hidden sm:inline">•</span>
      <Link 
        to="/data-deletion-policy" 
        className="hover:text-primary transition-colors underline"
      >
        Data Deletion Policy
      </Link>
      <span className="hidden sm:inline">•</span>
      <Link 
        to="/terms-of-service" 
        className="hover:text-primary transition-colors underline"
      >
        Terms of Service
      </Link>
    </div>
  );
};

export default PolicyFooter;