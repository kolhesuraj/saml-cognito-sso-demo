/* eslint-disable operator-linebreak */
/* eslint-disable function-paren-newline */
/* eslint-disable quotes */
/**
 * Company service which serves DB operations
 * required by company controller
 */

import { Op, Sequelize } from "sequelize";
import httpStatus from "http-status";
import db from "../models/index.js";
import * as error from "../utils/api-error.js";

import dbConfig from "../config/db.js";

/**
 * @constant {Sequelize.models} - Company model extracted from db import
 */
const { Company, UserCompany } = db;

const { APIError } = error.default;

/**
 * Create a company with optional transaction support.
 *
 * @param {Object} data - Company data.
 * @param {string} data.name - Company name.
 * @param {string} data.address - Company address.
 * @param {Object} [transaction] - Optional Sequelize transaction object.
 * @returns {Promise<Company>} - Created company object.
 */
const createCompany = async (data, transaction = null) => {
  const company = await Company.create(
    { ...data, enabled: true },
    { transaction }
  );
  return company;
};

/**
 * get company by id
 * @param {string} ID - company id
 * @returns {Promise<Company>}
 */
const getCompanyById = async (ID) => Company.findByPk(ID);

/**
 * get company by id
 * @param {string} ID - company id
 * @returns {Promise<Company>}
 */
const getCompanyByIdWithCspCount = async (id) =>
  Company.findOne({
    where: { id },
    attributes: [
      "id",
      "accountType",
      "name",
      "address",
      "enabled",
      "parentId",
      "managerId",
      [
        Sequelize.literal(
          `(SELECT CAST(COUNT(*) AS INTEGER) FROM ${dbConfig.schema}.csp_accounts csp WHERE csp.company_id = "Company"."id")`
        ),
        "cspAccountCount",
      ],
    ],
  });

/**
 * Create an association between a user and a company with optional transaction support.
 *
 * @param {Object} data - User-company data.
 * @param {string} data.userId - User ID.
 * @param {string} data.companyId - Company ID.
 * @param {string} data.role - User's role in the company.
 * @param {Object} [transaction] - Optional Sequelize transaction object.
 * @returns {Promise<UserCompany>} - Created user-company object.
 */
const createUserCompany = async (data, transaction = null) => {
  const userCompany = await UserCompany.create(
    { ...data, enabled: true },
    { transaction }
  );
  return userCompany;
};

const checkUserCompaniesActive = async (userId) => {
  const userCompanies = await UserCompany.findAll({
    where: { userId },
    include: [
      {
        model: Company,
        as: "company",
        where: { enabled: true },
      },
    ],
  });
  const companies = userCompanies.map(
    (userCompany) => userCompany.dataValues.company.dataValues
  );

  if (companies.length === 0) {
    throw new APIError(
      httpStatus.UNAUTHORIZED,
      "Your account doesn't seem to be active!"
    );
  }

  const companyPromises = companies.map(async (c) => {
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
    throw new APIError(
      httpStatus.UNAUTHORIZED,
      "Your account doesn't seem to be active!"
    );
  }
};

/**
 * Get Company Details function
 *
 * @param {object} id - company id
 * @returns {Promise<Company>} - Created company object
 */
const getCompanyWithUserRole = async (companyId, userId) => {
  const userCompany = await UserCompany.findOne({
    where: { companyId, userId },
    include: [
      {
        model: Company,
        as: "company",
      },
    ],
  });

  const companyWithRole = {
    ...userCompany?.dataValues?.company?.dataValues,
    userCompany: {
      role: userCompany?.dataValues?.role,
      enabled: userCompany?.dataValues?.enabled,
    },
  };
  delete companyWithRole.createdAt;
  delete companyWithRole.updatedAt;
  return companyWithRole;
};

const getManagedCompanies = async (managerId) => {
  if (!managerId) return [];

  const where = {
    id: {
      [Op.ne]: config.adminCompanyId, // Exclude the admin company ID
    },
    managerId,
    parentId: null, // Only include top-level companies
    enabled: true,
    accountType: accountTypes.ManagedAccount,
    deleted: {
      [Op.ne]: true, // Exclude companies that are deleted
    },
  };

  const managedCompanies = await Company.findAll({
    where,
    distinct: true,
    col: "id", // Count distinct IDs
  });

  return JSON.parse(JSON.stringify(managedCompanies));
};

const getSubAccounts = async (
  companyId,
  includeParent = false,
  cspCount = false
) => {
  let where = { parentId: companyId, enabled: true };
  let include;
  if (includeParent) {
    where = {
      [Op.or]: [where, { id: companyId }],
    };
  }
  if (cspCount) {
    include = [
      Sequelize.literal(
        `(SELECT CAST(COUNT(*) AS INTEGER) FROM ${dbConfig.schema}.csp_accounts csp WHERE csp.company_id = "Company"."id")`
      ),
      "cspAccountCount",
    ];
  }
  return Company.findAll({
    where,
    attributes: ["id", "name", "address", "enabled", "parentId", include || []],
  });
};

export {
  createCompany,
  createUserCompany,
  checkUserCompaniesActive,
  getCompanyById,
  getCompanyByIdWithCspCount,
  getCompanyWithUserRole,
  getManagedCompanies,
  getSubAccounts,
};
