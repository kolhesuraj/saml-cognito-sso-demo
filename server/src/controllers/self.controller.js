import { GetUserCommand } from "@aws-sdk/client-cognito-identity-provider";
import httpStatus from "http-status";
import * as responseHandler from "../middlewares/response-handler.js";
import cognitoClient from "../config/cognito.js";

/**
 * @constant {function} responseHandler - function to form generic success response
 */
const formatSuccessResponse = responseHandler.default;

/**
 * Function to get the current user's details
 *
 * @param {Object} req - Express HTTP request object
 * @param {Object} req.user - The authenticated user object
 * @param {Object} res - Express HTTP response object
 */
export const getCurrentUser = async (req, res, next) => {
  try {
    let response = {
      ...req.user,
      mfaEnabled: false,
    };
    if (!req.user.isSAML) {
      try {
        const input = {
          AccessToken: req.headers.authorization.split(" ")[1],
        };
        const command = new GetUserCommand(input);
        const { PreferredMfaSetting } = await cognitoClient.send(command);

        response = {
          ...response,
          mfaEnabled: ["SMS_MFA", "SOFTWARE_TOKEN_MFA"]?.includes(
            PreferredMfaSetting
          ),
        };
      } catch (e) {
        console.log(e);
      }
    }

    res.status(httpStatus.OK).send(formatSuccessResponse(response));
  } catch (error) {
    next(error);
  }
};
