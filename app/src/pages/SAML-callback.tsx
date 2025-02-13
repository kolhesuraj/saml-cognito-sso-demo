import { Button } from "@/components/ui/Button";
import { CircleXIcon, LoaderCircleIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const SamlCallback: React.FC = () => {
  const navigate = useNavigate();
  const [isToken, setIsToken] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    // Extract the token from the URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("access-token");
    const errorMessage = urlParams.get("error");

    if (token) {
      setIsToken(true);
      localStorage.setItem("__sidebarOpen", "true");

      // Save the token to localStorage
      localStorage.setItem("__token", token);

      // Redirect the user to the homepage
      setTimeout(() => {
        navigate("/");
      }, 300);
    } else if (errorMessage) {
      setError(errorMessage);
    } else {
      // Handle the case where no token is present in the URL
      console.error("Token not found in URL");
      navigate("/auth/login");
    }
  }, []);

  return (
    <div className="">
      {/* Loader State */}
      {isToken && (
        <div className="flex flex-col items-center text-center">
          <LoaderCircleIcon className="h-8 w-8 animate-spin text-primary" />
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">
            Processing Your Login...
          </h1>
          <p className="text-gray-600">
            Please wait a moment while we securely log you in.
          </p>
        </div>
      )}

      {/* Error State */}
      {!!isToken && error && (
        <div className="flex flex-col items-center text-center rounded-lg p-8 ">
          <CircleXIcon className="font-bold h-12 w-12 text-red-600 mb-3" />
          <h1 className="text-2xl font-bold text-red-600 mb-3">Login Error!</h1>
          <h3 className="text-gray-700 mb-6">{error}</h3>
          <Button
            variant="default"
            size="lg"
            onClick={() => {
              navigate("/auth/login");
            }}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition"
          >
            Go to Login
          </Button>
        </div>
      )}
    </div>
  );
};

export default SamlCallback;
