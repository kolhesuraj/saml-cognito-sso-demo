import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { HomeIcon, SettingsIcon, UserIcon } from "lucide-react";
import logo from "@/assets/logo-white.png";
import logoSmall from "@/assets/logo-fold.png";

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = true }) => {
  const location = useLocation(); // Get the current location
  const [activeItem, setActiveItem] = useState<string>("");

  // Set the active item based on the current route
  useEffect(() => {
    const path = location.pathname;

    if (path === "/") {
      setActiveItem("dashboard");
    } else if (path.startsWith("/settings/profile-settings")) {
      setActiveItem("profile");
    } else if (path.startsWith("/settings/company-settings")) {
      setActiveItem("settings");
    } else if (path.startsWith("/settings/company-saml")) {
      setActiveItem("saml");
    }
  }, [location.pathname]);
  return (
    <div
      className={`fixed inset-0 flex z-10 flex-col text-white p-4  transition-[width] duration-300 ease-in-out ${
        isOpen ? "w-64" : "w-20"
      } h-screen`}
    >
      {/* Sidebar Header */}
      <div
        className={`flex items-center transition-all duration-400 ease-in-out p-5 mb-5 ${
          isOpen ? "justify-start " : "justify-center"
        }`}
      >
        {/* Large Logo */}
        <img
          src={logo}
          alt="Logo"
          className={`absolute transition-all duration-700 ease-in-out ${
            isOpen ? "opacity-100 scale-200 w-40" : "opacity-0 scale-75 w-0"
          }`}
        />

        {/* Small Logo */}
        <img
          src={logoSmall}
          alt="Small Logo"
          className={`absolute transition-all duration-700 ease-in-out ${
            isOpen ? "opacity-0 scale-75 w-0" : "opacity-100 scale-100 w-10"
          }`}
        />
      </div>
      <hr className="mb-5" />

      {/* Sidebar Links */}
      <nav>
        <ul>
          <li
            className={`p-2 my-3 hover:bg-gray-700 rounded transition-all duration-200 ease-in-out ${
              activeItem === "dashboard" ? "bg-gray-600" : ""
            }`}
          >
            <Link
              to="/"
              className="flex items-center gap-2"
              onClick={() => setActiveItem("dashboard")}
            >
              <HomeIcon className="h-5 w-5" />
              {isOpen && (
                <span className="transition-opacity duration-300">
                  Dashboard
                </span>
              )}
            </Link>
          </li>

          <li
            className={`p-2 my-3 hover:bg-gray-700 rounded transition-all duration-200 ease-in-out ${
              activeItem === "profile" ? "bg-gray-600" : ""
            }`}
          >
            <Link
              to="/settings/profile-settings"
              className="flex items-center gap-2"
              onClick={() => setActiveItem("profile")}
            >
              <UserIcon className="h-5 w-5" />
              {isOpen && (
                <span className="transition-opacity duration-300">
                  Profile Settings
                </span>
              )}
            </Link>
          </li>

          <li
            className={`p-2 my-3 hover:bg-gray-700 rounded transition-all duration-200 ease-in-out ${
              activeItem === "settings" ? "bg-gray-600" : ""
            }`}
          >
            <Link
              to="/settings/company-settings"
              className="flex items-center gap-2"
              onClick={() => setActiveItem("settings")}
            >
              <SettingsIcon className="h-5 w-5" />
              {isOpen && (
                <span className="transition-opacity duration-300">
                  Company Settings
                </span>
              )}
            </Link>
          </li>

          <li
            className={`p-2 my-3 hover:bg-gray-700 rounded transition-all duration-200 ease-in-out ${
              activeItem === "saml" ? "bg-gray-600" : ""
            }`}
          >
            <Link
              to="/settings/company-saml"
              className="flex items-center gap-2"
              onClick={() => setActiveItem("saml")}
            >
              <SettingsIcon className="h-5 w-5" />
              {isOpen && (
                <span className="transition-opacity duration-300">
                  Company SAML Settings
                </span>
              )}
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
