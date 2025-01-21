export interface UserDetails {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    createdAt: string;
    updatedAt: string;
    company: Company;
    primaryCompanyId: string;
    primaryCompany: Company;
    companies: Company[];
    mfaEnabled: boolean;
    enabled: boolean;
    deleted: boolean;
    cspConfig?: {
      aws: boolean;
      gcp: boolean;
      azure: boolean;
    };
    moneta?: {
      role: string;
    };
    reseller?: {
      role: string;
    };
    supportCompanyId?: string;
    resellerCompanyName?: string;
    resellerCompanyId?: string;
  }
  
  interface UserCompany {
    role: string;
  }
  
  export interface Company {
    id: string;
    name: string;
    address: string | null;
    contactPerson: string | null;
    contactEmail: string | null;
    createdAt: string;
    updatedAt: string;
    userCompany: UserCompany;
    cspAccountCount: number;
    parentId: string | null;
    enabled: boolean;
    companyLogo?: string;
    accountType: string;
  }
  