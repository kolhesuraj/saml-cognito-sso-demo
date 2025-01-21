import Sidebar from "@/shared/sidebar";
import Header from "@/shared/header";
import { ReactNode, useContext, useEffect, useRef, useState } from "react";
import { SelfContext } from "@/providers/session-provider";
import { useNavigate } from "react-router-dom";
import { LoaderCircleIcon } from "lucide-react";
import { UserRole } from "@/constants/common-data";

import ScrollToTop from "@/shared/scroll-to-top";

interface MainLayoutProps {
  children?: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(
    localStorage.getItem("__sidebarOpen") === "false" ? false : true
  );
  const { self } = useContext(SelfContext);
  const mainRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();

  // Redirect users with restricted roles
  useEffect(() => {
    if (self?.company?.userCompany?.role === UserRole?.DASHBOARDS_ONLY) {
      navigate("/", { replace: true });
    }
  }, [navigate, self]);

  return (
    <div
      className="grid h-screen grid-rows-layout grid-cols-layout bg-secondary"
      style={{
        gridTemplateColumns: sidebarOpen ? "16rem 1fr" : "5rem 1fr",
        gridTemplateRows: "3.7rem 1fr",
      }}
    >
      {/* Sidebar */}
      <aside className="col-start-1 row-span-full">
        <Sidebar isOpen={sidebarOpen} />
      </aside>

      {/* Header */}
      <header className="col-start-2 row-start-1 bg-white shadow z-10">
        <Header
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          self={self}
        />
      </header>

      {/* Scroll to top */}
      <ScrollToTop elementRef={mainRef} />

      {/* Main Content */}
      <main
        id="main-layout-element"
        ref={mainRef}
        className="col-start-2 row-start-2 overflow-y-auto scroll-smooth bg-[#f2f7f8] p-4 pt-6 focus:outline-none lg:p-6"
      >
        {(self && children) || (
          <div className="loaderWrapper flex h-[50vh] items-center justify-center">
            <LoaderCircleIcon className="h-10 w-10 animate-spin" />
          </div>
        )}
      </main>
    </div>
  );
}
