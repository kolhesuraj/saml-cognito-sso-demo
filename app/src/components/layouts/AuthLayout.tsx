import { Navigate, useLocation } from "react-router-dom";
// import tracesBottomLeft from "@/assets/backgrounds/traces-bl.svg";
import tracesTopRight from "@/assets/backgrounds/background.png";
import logo from "@/assets/logo.png";
import { ReactNode } from "react";

interface AuthLayoutProps {
  children?: ReactNode;
}
export default function AuthLayout({ children }: AuthLayoutProps) {
  const location = useLocation();

  if (location.pathname === "/auth" || location.pathname === "/auth/") {
    return <Navigate to="/auth/login" replace />;
  }

  return (
    <main className="relative bottom-0 top-0 min-h-screen bg-secondary text-secondary-foreground text-white">
      <div className="relative z-10">
        <div className="flex h-screen max-w-none items-center justify-center px-0">
          <div className="mx-auto flex flex-col items-center gap-y-6">
            <div className="flex w-full flex-col justify-center space-y-6 rounded-sm bg-slate-300 px-8 py-8 text-secondary shadow-sm sm:w-96 lg:w-[28rem] lg:px-12 lg:py-10">
              <div className="flex flex-col items-center justify-center">
                <img
                  src={logo}
                  alt="Angular minds Logo"
                  className="mx-auto block w-full max-w-40"
                />
                <div className="mx-auto my-4 block h-1.5 w-[80%] bg-[#f17272]"></div>
              </div>
              {children}
            </div>
          </div>
        </div>
      </div>
      <img
        src={tracesTopRight}
        className="absolute  top-0 h-full w-full object-cover"
      />
      {/* <img
        src={tracesBottomLeft}
        className="absolute bottom-0 left-0 right-auto h-5/6 w-auto object-cover"
      /> */}
    </main>
  );
}
