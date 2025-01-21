/* eslint-disable @typescript-eslint/no-explicit-any */
import { accountTypeMap } from "@/constants/common-data";
import { get, getToken, logout } from "@/lib/api";
import { UserDetails } from "@/types/user-details.interface";
import {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface SelfContextInterface {
  self: UserDetails | null;
  fetchData: () => void;
  setSelf: (value: any) => void;
  rateOpportunitiesLowerEnd: number;
  setRateOpportunitiesLowerEnd: (value: number) => void;
  potentialUsageSavingsLowerEnd: number;
  setPotentialUsageSavingsLowerEnd: (value: number) => void;
}

const SelfContext = createContext<SelfContextInterface>({
  self: null,
  fetchData: () => {},
  setSelf: () => {},
  rateOpportunitiesLowerEnd: 0,
  setRateOpportunitiesLowerEnd: () => {},
  potentialUsageSavingsLowerEnd: 0,
  setPotentialUsageSavingsLowerEnd: () => {},
});

interface SessionProviderProps {
  children: ReactNode;
}

export default function SessionProvider({ children }: SessionProviderProps) {
  const [self, setSelf] = useState<UserDetails | null>(null);
  const token = getToken();
  const navigate = useNavigate();
  const location = useLocation();

  const [rateOpportunitiesLowerEnd, setRateOpportunitiesLowerEnd] =
    useState<number>(0);
  const [potentialUsageSavingsLowerEnd, setPotentialUsageSavingsLowerEnd] =
    useState<number>(0);

  const fetchData = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      (async () => {
        try {
          const res = await get("self");
          setSelf(res.body);
          if (res?.body?.company?.id === res?.body?.primaryCompany?.id) {
            localStorage.setItem("__activeCompany", res?.body?.company?.id);
            if (
              res?.body?.company?.accountType === accountTypeMap.ResellerAccount
            ) {
              localStorage.setItem("__resellerCompany", res?.body?.company?.id);
            }
          }
          resolve();
        } catch (e: any) {
          if (e?.message === "Unauthorized") {
            logout();
            navigate("/auth/login", { replace: true });
          }
          console.error(e);
          reject(e);
        }
      })();
    });
  }, [navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (token === null) {
      navigate("/auth/login", { replace: true });
    } else if (
      !location.pathname.includes("integration") &&
      self?.company?.cspAccountCount === 0
    ) {
      // navigate('/integration/start', { replace: true });
    }
  }, [token, navigate, location.pathname, self]);

  return (
    <SelfContext.Provider
      value={{
        self,
        fetchData,
        setSelf,
        rateOpportunitiesLowerEnd,
        setRateOpportunitiesLowerEnd,
        potentialUsageSavingsLowerEnd,
        setPotentialUsageSavingsLowerEnd,
      }}
    >
      {children}
    </SelfContext.Provider>
  );
}

export { SelfContext };
