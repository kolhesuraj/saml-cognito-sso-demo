/* eslint-disable consistent-return */
/* eslint-disable prefer-const */
/* eslint-disable no-useless-catch */
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import httpStatus from "http-status";
import { fileURLToPath } from "url";
import config from "../config/config.js";
import {
  getUserWithCompany,
  updateLastActive,
  findRecordForUserInCompany,
} from "../services/user.service.js";
import { UserRoles } from "../models/user-company.model.js";
import {
  getCompanyById,
  getCompanyByIdWithCspCount,
  getCompanyWithUserRole,
  getManagedCompanies,
  getSubAccounts,
} from "../services/company.service.js";
import { accountTypes } from "../models/company.model.js";
import { Logger } from "../config/logger.js";
import { getUserEmailFromCognitoGroup } from "../services/auth.service.js";

const logger = Logger(fileURLToPath(import.meta.url));

// Verify the JWT token signature
export const verifyToken = async (token) => {
  const client = jwksClient({
    jwksUri: `https://cognito-idp.${config.aws.region}.amazonaws.com/${config.aws.cognitoUserPoolId}/.well-known/jwks.json`,
  });

  const getKey = (header, callback) => {
    client.getSigningKey(header.kid, (err, key) => {
      try {
        const signingKey = key.getPublicKey() || key.rsaPublicKey;
        callback(null, signingKey);
      } catch (e) {
        callback(new Error("Failed to validate session. Please try again."));
      }
    });
  };

  return new Promise((resolve, reject) => {
    jwt.verify(token, getKey, (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded);
      }
    });
  });
};

const isAdminOfManagerCompany = async (currentUser, companyId) => {
  try {
    const company = await getCompanyById(companyId);
    const userId = currentUser?.id;
    if (!company?.managerId) {
      return false;
    }

    const managerCompanyId = company?.managerId;

    const userCompanyRecord = await findRecordForUserInCompany(
      userId,
      managerCompanyId
    );

    if (
      !userCompanyRecord ||
      userCompanyRecord?.role !== UserRoles.Administrator
    ) {
      return false;
    }
    return true;
  } catch (e) {
    logger.error(
      `Error while validating manager company and user association: ${e?.message}`
    );
    return false;
  }
};

// Middleware function for token authentication
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res
      .status(httpStatus.UNAUTHORIZED)
      .json({ error: "Authorization header is missing" });
  }

  if (authHeader.startsWith("ApiKey ")) {
    // API Key authentication
    const apiKey = authHeader.substring("ApiKey ".length);

    if (apiKey === config.serviceApiKey) {
      // If API key matches, set a special user context
      req.user = {
        id: "service-account",
        role: "ServiceAccount",
        company: { id: req.headers.companyid },
      };
      return next();
      // eslint-disable-next-line no-else-return
    } else
      return res
        .status(httpStatus.UNAUTHORIZED)
        .json({ error: "Invalid API key" });
  }

  let [authType, accessToken, companyId, resellerCompanyId] =
    authHeader.split(" ");

  if (authType !== "Bearer") {
    return res
      .status(httpStatus.UNAUTHORIZED)
      .json({ error: "Invalid authorization type" });
  }

  if (!accessToken) {
    return res
      .status(httpStatus.UNAUTHORIZED)
      .json({ error: "Access token is missing" });
  }

  let currentUser = {};

  // Verify the token
  try {
    const decodedToken = await verifyToken(accessToken);

    if (!decodedToken || !decodedToken?.sub) {
      throw new Error("Invalid token, Please try login again");
    }

    if (!!decodedToken["cognito:groups"]) {
      const userEmail = await getUserEmailFromCognitoGroup(decodedToken.sub);
      currentUser = await getUserWithCompany({ email: userEmail });
      currentUser.isSAML = true;
    } else {
      currentUser = await getUserWithCompany({ userId: decodedToken.sub });
    }

    if (!currentUser) {
      throw new Error("User not found");
    }

    // Check if support user logged in to customer account
    const { companies } = currentUser;

    let company = companyId
      ? await getCompanyWithUserRole(companyId, currentUser.id)
      : currentUser.primaryCompany;

    let supportUser;

    if (!company || !company.id) {
      // check session is switching to a customer account from reseller account
      const resellerCompany = companies?.find(
        (c) => c.id === resellerCompanyId
      );

      if (resellerCompany?.accountType === accountTypes.ResellerAccount) {
        // check if current user is an admin of a customer's manager company
        const isAdmin = await isAdminOfManagerCompany(currentUser, companyId);

        if (!isAdmin) {
          return res.status(httpStatus.FORBIDDEN).json({
            success: false,
            msg: "You do not have permission to perform this action",
          });
        }
        company = {
          ...(await getCompanyByIdWithCspCount(companyId))?.dataValues,
          userCompany: {
            enabled: true,
            role: UserRoles.ReadOnlyUser, // Read only access to support user
          },
        };

        currentUser = {
          ...currentUser,
          companies: [...companies],
          resellerCompanyId: resellerCompany?.id,
          resellerCompanyName: resellerCompany?.name,
        };
      } else {
        supportUser = companies.find((c) => c.id === config.adminCompanyId);
        if (!supportUser) {
          throw new Error(
            "Not authorized or access denied. Please switch sub account."
          );
        } else {
          company = {
            ...(await getCompanyByIdWithCspCount(companyId)).dataValues,
            userCompany: {
              enabled: true,
              role: UserRoles.ReadOnlyUser, // Read only access to support user
            },
          };

          let managerCompany = {};

          if (company?.managerId) {
            const userManagerCompanyRecord = await getCompanyWithUserRole(
              company?.managerId,
              currentUser?.id
            );

            if (!userManagerCompanyRecord?.id) {
              managerCompany = {
                ...(await getCompanyByIdWithCspCount(company?.managerId))
                  .dataValues,
                userCompany: {
                  enabled: true,
                  role: UserRoles.ReadOnlyUser, // Read only access to support user
                },
              };
            }
          }

          const subAccounts = (
            await getSubAccounts(company.parentId || companyId, true, true)
          ).map((c) => ({
            ...c.dataValues,
            userCompany: {
              enabled: true,
              role: UserRoles.ReadOnlyUser, // Read only access to support user
            },
          }));

          // Keep parent company at 0th position
          subAccounts.sort((a, b) => {
            if (a.parentId === null) return -1;
            if (b.parentId === null) return 1;
            return 0;
          });

          const otherCompanies = managerCompany?.id ? [managerCompany] : [];
          currentUser = {
            ...currentUser,
            companies: [...otherCompanies, ...subAccounts],
            supportCompanyId: supportUser.id,
          };
        }
      }
    }

    // if company is not enabled
    if (!company.enabled) {
      if (currentUser.companies.length === 0) {
        throw new Error("Forbidden. Your account is not active.");
      }

      // Create a list of promises to check parent companies
      const companyPromises = currentUser.companies.map(async (c) => {
        if (!c.parentId) {
          return c;
        }
        const parentCompany = await getCompanyById(c.parentId);
        return parentCompany.enabled ? c : null;
      });

      // Wait for all promises to resolve
      const resolvedCompanies = await Promise.all(companyPromises);

      // Filter out null values
      const filteredCompanies = resolvedCompanies.filter((c) => c !== null);

      if (filteredCompanies.length === 0) {
        throw new Error("Forbidden. Your account is not active.");
      }

      const [firstCompany] = filteredCompanies;
      currentUser.company = firstCompany;
      currentUser.companies = filteredCompanies;
    } else {
      // check is companies parent company is enabled or not
      if (company.parentId) {
        const parentCompany = await getCompanyById(company.parentId);
        if (!parentCompany.enabled) {
          throw new Error("Session not valid. Please login again.");
        }
      }

      // check userCompany is enabled or not
      if (!company.userCompany.enabled) {
        throw new Error("Session not valid. Please login again.");
      }
    }

    const { id } = currentUser;
    // Adding the user along with session company to the request object
    req.user = { id, company, ...currentUser };

    // Update last active time only if not support user or user is part of company
    try {
      if (!supportUser) {
        // eslint-disable-next-line operator-linebreak
        const isUserPartOfCompany =
          // eslint-disable-next-line operator-linebreak
          currentUser?.companies?.length > 1 &&
          currentUser?.companies.some((c) => c.id === company?.id);

        if (isUserPartOfCompany) {
          updateLastActive(id, req?.user?.company?.id).catch((err) => {
            console.error(`Error updating last active time: ${err.message}`);
            console.error(err); // Log full error for debugging
          });
        }
      }
    } catch (e) {
      console.error(`Unexpected error occurred: ${e.message}`);
    }

    // Check if the user's primary company ID matches the admin company ID
    // If it does, assign the role 'Super Admin' to the request object for authorization purposes
    if (company.id === config.adminCompanyId) {
      try {
        req.monetaRole = company.userCompany.role;
      } catch (e) {
        req.monetaRole = "Read Only User";
      }
    }

    // check if company is Reseller
    // If it is Reseller then set reseller object in request object for authorization purpose
    if (company.accountType === accountTypes.ResellerAccount) {
      req.reseller = "Read Only User";
      try {
        if (!currentUser.supportCompanyId) {
          req.reseller = company.userCompany.role;
        }
      } catch (e) {
        console.log("Error when getting userCompany.role", e);
      }
    }

    if (
      // eslint-disable-next-line operator-linebreak
      (resellerCompanyId ||
        company?.accountType === accountTypes.ResellerAccount) &&
      companyId !== config.adminCompanyId
    ) {
      const managerId = resellerCompanyId || company?.id;
      // include managed customer's in self.companies object
      const managedCustomers = await getManagedCompanies(managerId);

      let mappedManageCustomers = managedCustomers?.map((customer) => ({
        ...customer,
        userCompany: {
          enabled: true,
          role: UserRoles.ReadOnlyUser, // Read only access to support user
        },
      }));

      const allCompanies = [...currentUser.companies, ...mappedManageCustomers];
      const uniqueCompanies = [
        ...new Map(allCompanies.map((c) => [c.id, c])).values(),
      ];

      currentUser = {
        ...currentUser,
        companies: uniqueCompanies,
      };
    }

    // check if company is deleted if yes then throw error
    if (req?.user?.company?.deleted) {
      throw new Error("Session not valid. Please login again.");
    }

    // Final construction of user object
    req.user = { id, company, ...currentUser };

    next();
  } catch (err) {
    console.log(err);
    return res
      .status(httpStatus.UNAUTHORIZED)
      .json({ error: err?.message || "Invalid token" });
  }
};

export default authenticateToken;
