/**
 * User service which serves DB operation
 * required by user controller
 */
import db from "../models/index.js";

/**
 * @constant {Sequelize.models} - User model extracted from db import
 */
const { RefreshToken } = db;

/**
 * Finds the refresh token associated with the given user ID.
 *
 * @param {string} userId - The ID of the user.
 * @returns {Promise<RefreshToken|null>} - The refresh token object or null if not found.
 */
export const findRefreshToken = async (userId) => {
  try {
    const refreshToken = await RefreshToken.findOne({ where: { userId } });
    return refreshToken.get({ plain: true });
  } catch (error) {
    throw new Error(
      `Failed to find refresh token for user ${userId}: ${error.message}`
    );
  }
};

export const createRefreshToken = async (userId, refreshToken, expiresAt) => {
  try {
    const newRefreshToken = await RefreshToken.create({
      userId,
      token: refreshToken,
      expiresAt,
    });
    return newRefreshToken;
  } catch (error) {
    throw new Error(`Failed to create refresh token: ${error.message}`);
  }
};
