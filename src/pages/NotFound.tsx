
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-app-bg p-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-app-blue mb-4">404</h1>
        <p className="text-xl text-app-text mb-6">
          Oops! We couldn't find the page you're looking for.
        </p>
        <p className="text-gray-500 mb-8">
          The page may have been moved, deleted, or may never have existed.
        </p>
        <Button 
          onClick={() => navigate('/')}
          className="bg-app-blue hover:bg-app-blue-light"
          size="lg"
        >
          Return to Home
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
