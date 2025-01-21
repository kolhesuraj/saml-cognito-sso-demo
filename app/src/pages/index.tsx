import { lazy } from "react";

import LoginPage from "./Login";
const DashboardsPage = lazy(() => import("@/pages/Dashboard"));
const CompanySettingsPage = lazy(() => import("@/pages/CompanySettings"));
const ProfileSettingsPage = lazy(() => import("@/pages/ProfileSettings"));
const CompanySAMLettingsPage = lazy(
  () => import("@/pages/CompanySAMLSettings")
);
const SamlCallbackPage = lazy(() => import("@/pages/SAML-callback"));

export {
  LoginPage,
  DashboardsPage,
  CompanySettingsPage,
  ProfileSettingsPage,
  CompanySAMLettingsPage,
  SamlCallbackPage,
};
