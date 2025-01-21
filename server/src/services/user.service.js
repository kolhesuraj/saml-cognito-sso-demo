/**
 * User service which serves DB operation
 * required by user controller
 */
import db from "../models/index.js";

/**
 * @constant {Sequelize.models} - User model extracted from db import
 */
const { User, Company, UserCompany } = db;

/**
 * Finds a user by their unique identifier.
 *
 * @param {string} userId - The ID of the user to find.
 * @returns {Promise<Object>} The found user object.
 * @throws {Error} If the user is not found.
 */
const findById = async (userId) => {
  const user = await User.findOne({
    where: { id: userId, deleted: false },
  });
  if (!user) {
    throw new Error("User not found");
  }
  return user.get({ plain: true });
};

const findByEmail = async (email) => {
  const user = await User.findOne({
    where: { email, deleted: false },
  });
  if (!user) {
    throw new Error("User not found");
  }
  return user.get({ plain: true });
};

/**
 * Create a new user with optional transaction support.
 *
 * @param {Object} data - User data.
 * @param {Object} [transaction] - Optional Sequelize transaction object.
 * @returns {Promise<User>} - Created user object.
 */
const create = async (data, transaction = null) => {
  const user = await User.create({ ...data }, { transaction });
  return user;
};

/**
 * updateUser function to update the enabled field for a user
 *
 * @param {object} query - The query object to find the user
 * @param {boolean} enabled - The new value for the enabled field
 * @returns {Promise<User>} - The updated user object
 */
const updateUserStatus = async (query, enabled) => {
  const user = await User.findOne({ where: { ...query, deleted: false } });

  if (!user) {
    throw new Error("User not found");
  }

  const updatedUser = await user.update({ enabled });
  return updatedUser;
};

/**
 * Updates the `last_active` timestamp for a specific user in the `user_companies` table.
 *
 * This function updates the `last_active` field for a given user ID within the `user_companies`
 * table, but only for records where the user is currently enabled.
 * The update is performed with the current date and time if no specific timestamp is provided.
 * The function also logs the number of rows updated and throws an error if no records are found
 * or if the update fails.
 *
 * @param {string} userId - The unique identifier of the user whose `last_active` timestamp
 * is being updated.
 * @param {Date} [lastActive=new Date()] - The new `last_active` timestamp to be set.
 * Defaults to the current date and time if not provided.
 *
 * @returns {Promise<number>} - A promise that resolves to the number of rows updated in
 * the `user_companies` table.
 * @throws {Error} - Throws an error if no records are updated or if an exception occurs
 * during the update process.
 */
const updateLastActive = async (userId, companyId, lastActive = new Date()) => {
  try {
    const [updatedRowsCount] = await UserCompany.update(
      { lastActive },
      {
        where: { userId, enabled: true, companyId },
        limit: 1,
        returning: true,
      }
    );

    if (updatedRowsCount === 0) {
      throw new Error("UserCompany record not found or update failed");
    }

    return updatedRowsCount;
  } catch (error) {
    console.error("Error updating last active time:", error);
    throw error;
  }
};

/**
 * Retrieves a user by email along with their associated company details.
 *
 * @param {string} email - The email of the user to retrieve.
 * @returns {Promise<Object>} - The user object with company details.
 * @throws {Error} - If the user is not found or an error occurs during retrieval.
 */
const findUserWithCompanyByEmail = async (email) => {
  try {
    const user = await User.findOne({
      where: { email, deleted: false },
      include: [
        {
          model: Company,
          as: "primaryCompany",
          attributes: ["name"], // Select necessary company fields
        },
      ],
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Transform the Sequelize instance to a plain object
    const userWithCompany = user.get({ plain: true });

    return userWithCompany;
  } catch (error) {
    console.error("Error in findUserWithCompanyByEmail:", error);
    throw new Error(
      `Error while finding User with company by email: ${error.message}`
    );
  }
};

/**
 * Function to retrieve a user by ID and populate the associated company details
 *
 * @param {string} userId - The ID of the user to retrieve
 * @returns {Promise<User>} - The user object with the associated company details
 */
const getUserWithCompany = async ({ userId, email }) => {
  const whereClause = {
    deleted: false,
  };

  if (userId) {
    whereClause.id = userId;
  }
  if(email){
    whereClause.email = email
  }
  const userData = await User.findOne({
    where: whereClause,
    include: [
      {
        // populate primary company
        model: Company,
        as: "primaryCompany",
        include: [
          {
            model: UserCompany,
            as: "userCompany",
            attributes: ["role", "enabled"],
            where: { enabled: true },
          },
        ],
      },
      {
        // populate secondary companies
        model: Company,
        as: "companies",
        where: { enabled: true },
        include: {
          model: UserCompany,
          as: "userCompany",
          attributes: ["role", "enabled"],
          where: { enabled: true },
        },
      },
    ],
  });
  if (userData) {
    const userCompany = userData.primaryCompany?.userCompany?.map(
      (c) => c.dataValues
    )[0];
    const primaryCompany = {
      ...userData.primaryCompany?.dataValues,
      userCompany,
    };
    delete primaryCompany?.cspAccounts;
    delete primaryCompany?.createdAt;
    delete primaryCompany?.updatedAt;

    const otherCompanies = userData.companies
      ?.filter((c) => c.enabled && c.id !== primaryCompany.id && !c.deleted)
      .map((c) => {
        const company = { ...c.dataValues };
        return {
          ...company,
          createdAt: new Date(company.createdAt),
        };
      })
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((c) => {
        // eslint-disable-next-line no-unused-vars
        const {
          createdAt,
          updatedAt,
          UserCompany: uCompany,
          ...cleanedCompany
        } = c;
        return cleanedCompany;
      });

    const companies = [primaryCompany, ...otherCompanies];

    return {
      ...userData.dataValues,
      companies,
      primaryCompany,
    };
  }

  return null;
};

/**
 * Retrieves the record for a given user ID and company ID.
 *
 * @param {string} userId - The UUID of the user to check.
 * @param {string} companyId - The UUID of the company to check.
 * @returns {Promise<Object|null>} - A promise that resolves to the user record if found,
 * or null if not found.
 */
const findRecordForUserInCompany = async (userId, companyId) => {
  const userRecord = await UserCompany.findOne({
    where: {
      userId,
      companyId,
    },
  });
  return userRecord;
};

export {
  create,
  findByEmail,
  findById,
  findUserWithCompanyByEmail,
  updateUserStatus,
  getUserWithCompany,
  updateLastActive,
  findRecordForUserInCompany,
};
