import { useRoutes, Outlet } from "react-router-dom";
import AuthLayout from "@/components/layouts/AuthLayout";
import MainLayout from "@/components/layouts/MainLayout";
import {
  CompanySAMLettingsPage,
  CompanySettingsPage,
  DashboardsPage,
  LoginPage,
  ProfileSettingsPage,
  SamlCallbackPage,
} from "@/pages";
import SessionProvider from "@/providers/session-provider";
import { NotFound } from "@/pages/NotFound";

export default function AppRouter() {
  const routes = useRoutes([
    {
      path: "auth",
      element: (
        <AuthLayout>
          <Outlet />
        </AuthLayout>
      ),
      children: [
        {
          path: "login",
          element: <LoginPage />,
          index: true,
        },
        {
          path: "callback",
          element: <SamlCallbackPage />,
          index: true,
        },
      ],
    },
    {
      path: "/",
      element: (
        <SessionProvider>
          <MainLayout>
            <Outlet />
          </MainLayout>
        </SessionProvider>
      ),
      children: [
        {
          element: <Outlet />,
          children: [
            {
              index: true,
              element: <DashboardsPage />,
            },
          ],
        },
        {
          path: "settings",
          element: <Outlet />,
          children: [
            { path: "profile-settings", element: <ProfileSettingsPage /> },
            { path: "company-settings", element: <CompanySettingsPage /> },
            { path: "company-saml", element: <CompanySAMLettingsPage /> },
          ],
        },
      ],
    },
    {
      path: "*",
      element: <NotFound />,
    },
  ]);

  return routes;
}
