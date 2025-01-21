import React, { useState, useEffect, useRef } from "react";
import { LogOutIcon, MenuIcon, SettingsIcon, XIcon } from "lucide-react"; // Example icon, you can customize this
import { Link, useNavigate } from "react-router-dom";
import { PersonIcon } from "@radix-ui/react-icons";
import { logout } from "@/lib/api";

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  self: any;
}

const Header: React.FC<HeaderProps> = ({
  sidebarOpen,
  setSidebarOpen,
  self,
}) => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/auth/login");
  };

  return (
    <header className="flex items-center justify-between w-full bg-gray-900 p-4 text-white shadow-md">
      {/* Mobile Sidebar Toggle */}
      <button
        className="text-white"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {/* Animated Icon Wrapper */}
        <div className="relative flex items-center justify-center w-full h-full ms-3">
          {/* Menu Icon */}
          <MenuIcon
            className={`absolute h-6 w-6 transition-transform transform ${
              sidebarOpen ? "rotate-90 opacity-0" : "rotate-0 opacity-100"
            } duration-400`}
          />
          {/* X Icon */}
          <XIcon
            className={`absolute h-6 w-6 transition-transform transform ${
              sidebarOpen ? "rotate-0 opacity-100" : "-rotate-90 opacity-0"
            } duration-400`}
          />
        </div>
      </button>

      {/* Logo or Brand Name */}
      <div className="flex items-center">
        <Link to="/" className="text-xl font-semibold whitespace-nowrap">
          AWS SAML
        </Link>
      </div>

      {/* User Profile or Settings */}
      <div className="relative flex items-center gap-4">
        <span className="block text-md text-gray-100">
          {self?.company?.name}
        </span>

        {/* Profile Picture or Initials */}
        <div
          className={`relative flex items-center justify-center w-10 h-10 rounded-full  text-gray-700 cursor-pointer ${
            self ? "bg-[#f27644]" : ""
          }`}
          onClick={() => setDropdownOpen((prev) => !prev)}
        >
          {self ? (
            self?.profilePic ? (
              <img
                src={self.profilePic}
                alt="Profile"
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-lg font-bold">
                {self?.firstName?.[0] + self?.lastName?.[0]}
              </span>
            )
          ) : (
            <></>
          )}
        </div>

        {/* Dropdown Menu */}
        <div className="relative mt-8" ref={dropdownRef}>
          {dropdownOpen && (
            <div
              className="absolute right-0 z-20 mt-2 px-1 bg-white rounded shadow-lg my-6 py-3"
              style={{ width: "14rem" }}
            >
              {self && (
                <>
                  {" "}
                  <div className="block w-full px-4 pb-2  text-xs text-gray-900">
                    <div className="font-bold text-sm pb-2">
                      {self?.firstName + " " + self?.lastName}
                    </div>
                    {self?.email}
                  </div>
                  <hr />
                </>
              )}
              <div className="mt-2">

              <button className="block w-full px-4 py-2 text-left text-sm text-gray-900 hover:bg-gray-200 rounded flex items-center gap-2">
                <PersonIcon className="h-5 w-5" />
                View Profile
              </button>
              <button className="block w-full px-4 py-2 text-left text-sm text-gray-900 hover:bg-gray-200 rounded flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                Settings
              </button>
              <button
                className="block w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-gray-200 rounded flex items-center gap-2"
                onClick={handleLogout}
                >
                <LogOutIcon className="h-5 w-5" />
                Logout
              </button>
                </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
