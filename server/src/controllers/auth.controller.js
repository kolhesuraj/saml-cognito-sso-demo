/* eslint-disable operator-linebreak */
import { fileURLToPath } from "url";
import {
  SignUpCommand,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  AuthFlowType,
  RespondToAuthChallengeCommand,
  ListUsersCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import httpStatus from "http-status";
import { v4 as uuidv4 } from "uuid";
import * as responseHandler from "../middlewares/response-handler.js";
import config from "../config/config.js";
import {
  create,
  findByEmail,
  findById,
  getUserWithCompany,
  updateUserStatus,
} from "../services/user.service.js";
import {
  createCompany,
  createUserCompany,
  checkUserCompaniesActive,
} from "../services/company.service.js";
import { generateSecretHash } from "../utils/hash.js";
import { createRefreshToken } from "../services/token.service.js";
import { AUTH_ERROR_MESSAGES } from "../utils/constant.js";
import * as errors from "../utils/api-error.js";
import {
  getUserEmailFromCognitoGroup,
  resendConfirmationCodeByEmail,
} from "../services/auth.service.js";
import { UserRoles } from "../models/user-company.model.js";

import { Logger } from "../config/logger.js";
import cognitoClient from "../config/cognito.js";
import { getSAMLConfigurationForCompany } from "../services/saml.service.js";
import { verifyToken } from "../middlewares/auth.js";

const logger = Logger(fileURLToPath(import.meta.url));

const { APIError } = errors.default;

/**
 * @constant {function} responseHandler - function to form generic success response
 */
const formatSuccessResponse = responseHandler.default;

/**
 * Handles the sign up process for a new user.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.body - The request body containing the user's email and password.
 * @param {string} req.body.email - The user's email address.
 * @param {string} req.body.password - The user's password.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<Object>} - The response containing the user's unique identifier.
 */
export const signUp = async (req, res, next) => {
  const { firstName, lastName, email } = req.body;
  const { password, companyName, companyAddress } = req.body;

  const companyId = uuidv4(); // Generate a unique UUID for the company

  const signUpCommandInput = {
    ClientId: config.aws.cognitoClientId,
    Username: email,
    Password: password,
    UserAttributes: [
      {
        Name: "given_name", // Standard attribute for first name
        Value: firstName,
      },
      {
        Name: "family_name", // Standard attribute for last name
        Value: lastName,
      },
      {
        Name: "custom:company",
        Value: companyName,
      },
      {
        Name: "custom:companyId",
        Value: companyId,
      },
    ],
  };

  let secretHash;
  // eslint-disable-next-line no-useless-catch
  try {
    secretHash = generateSecretHash(email);
    signUpCommandInput.SecretHash = secretHash;
    const signUpCommand = new SignUpCommand(signUpCommandInput);
    const signUpResponse = await cognitoClient.send(signUpCommand);

    // Create a new company
    const newCompany = await createCompany({
      id: companyId,
      name: companyName,
      contactPerson: `${firstName} ${lastName}`,
      contactEmail: email,
      address: companyAddress,
    });

    // Create a new user in the database
    const newUser = await create({
      id: signUpResponse.UserSub,
      firstName,
      lastName,
      primaryCompanyId: companyId,
      email,
    });

    // Associate the user with the company
    await createUserCompany({
      userId: newUser.id,
      companyId: newCompany.id,
      role: UserRoles.Administrator, // Set the user's role as "Administrator" for the new company
    });

    res.status(httpStatus.CREATED).send(formatSuccessResponse(signUpResponse));
  } catch (error) {
    console.log(error);

    if (error.name === "UsernameExistsException") {
      const filter = email ? `email = "${email}"` : "";
      const listUsersCommand = new ListUsersCommand({
        UserPoolId: config.aws.cognitoUserPoolId,
        AttributesToGet: ["email", "sub"],
        Filter: filter,
      });
      // eslint-disable-next-line operator-linebreak
      const { Users } = await cognitoClient.send(listUsersCommand);
      console.log(Users);
      if (Users[0]?.UserStatus === "CONFIRMED") {
        next(
          new APIError(
            httpStatus.BAD_REQUEST,
            "User account is already confirmed. Please login."
          )
        );
      }

      if (Users[0]?.UserStatus === "UNCONFIRMED") {
        // If the username (email) already exists, resend the confirmation code
        try {
          const resendResponse = await resendConfirmationCodeByEmail(email);
          res.status(httpStatus.OK).send(
            formatSuccessResponse({
              ...resendResponse,
              confirmationCodeSent:
                resendResponse?.$metadata?.httpStatusCode === httpStatus.OK,
            })
          );
        } catch (resendError) {
          next(
            new APIError(
              httpStatus.BAD_REQUEST,
              AUTH_ERROR_MESSAGES[resendError.name] ||
                resendError.message ||
                "Could not resend confirmation code."
            )
          );
        }
      }
    }
    next(
      new APIError(
        httpStatus.BAD_REQUEST,
        AUTH_ERROR_MESSAGES[error.name] ||
          error.message ||
          "Could not sign up. Please try again."
      )
    );
  }
};

/**
 * Confirms a user's sign-up by verifying the provided confirmation code.
 *
 * @param {Object} req - The HTTP request object.
 * @param {string} req.body.email - The email of the user signing up.
 * @param {string} req.body.code - The confirmation code provided by the user.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<Object>} - The response from the Cognito client after confirming the sign-up.
 */
export const confirmSignUp = async (req, res, next) => {
  const { email, code } = req.body;

  // eslint-disable-next-line no-useless-catch
  try {
    const confirmSignUpCommandInput = {
      ClientId: config.aws.cognitoClientId,
      Username: email,
      ConfirmationCode: code,
    };

    const secretHash = generateSecretHash(email);

    confirmSignUpCommandInput.SecretHash = secretHash;

    const confirmCommand = new ConfirmSignUpCommand(confirmSignUpCommandInput);

    const confirmResponse = await cognitoClient.send(confirmCommand);

    // update user to enabled
    await updateUserStatus({ email }, true);

    res.status(httpStatus.OK).send(formatSuccessResponse(confirmResponse));
  } catch (error) {
    logger.error(`Error while confirming the signup: ${error.message}`);
    next(
      new APIError(
        httpStatus.BAD_REQUEST,
        AUTH_ERROR_MESSAGES[error.name] ||
          error.message ||
          "Failed to confirm sign-up."
      )
    );
  }
};

/**
 * Handles the sign-in process for an existing user.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.body - The request body containing the user's email and password.
 * @param {string} req.body.email - The user's email address.
 * @param {string} req.body.password - The user's password.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<Object>} - The response containing the user's authentication result.
 */
export const signIn = async (req, res, next) => {
  const { email, password } = req.body;

  let secretHash;
  // eslint-disable-next-line no-useless-catch
  try {
    // validate users companies
    const user = await findByEmail(email);

    await checkUserCompaniesActive(user.id);

    secretHash = generateSecretHash(email);

    const initiateAuthCommandInput = {
      ClientId: config.aws.cognitoClientId,
      AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
        SECRET_HASH: secretHash,
      },
    };

    const initiateAuthCommand = new InitiateAuthCommand(
      initiateAuthCommandInput
    );
    const authResponse = await cognitoClient.send(initiateAuthCommand);

    // eslint-disable-next-line operator-linebreak
    const { AccessToken, RefreshToken } =
      authResponse.AuthenticationResult || {};

    if (AccessToken) {
      // Set a default expiration time for the refresh token (e.g., 30 days)
      const refreshTokenExpiry = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

      // Save the refresh token for the user in the database
      await createRefreshToken(user.id, RefreshToken, refreshTokenExpiry);
    }

    res.status(httpStatus.OK).send(
      formatSuccessResponse({
        accessToken: AccessToken,
        challengeName: authResponse.ChallengeName,
        challengeParameters: authResponse.ChallengeParameters,
        session: authResponse.Session,
      })
    );
  } catch (error) {
    let errorMessage = error.message;
    if (error.name === "NotAuthorizedException") {
      // Handle NotAuthorizedException: Password attempts exceeded
      errorMessage = AUTH_ERROR_MESSAGES[error.message] || errorMessage;
      next(
        new APIError(
          httpStatus.UNAUTHORIZED,
          errorMessage || "Unable to sign in"
        )
      );
    }

    if (error.name === "UserNotConfirmedException") {
      try {
        const resendResponse = await resendConfirmationCodeByEmail(email);
        res.status(httpStatus.OK).send(
          formatSuccessResponse({
            ...resendResponse,
            confirmationCodeSent:
              resendResponse?.$metadata?.httpStatusCode === httpStatus.OK,
          })
        );
      } catch (resendError) {
        next(
          new APIError(
            httpStatus.BAD_REQUEST,
            AUTH_ERROR_MESSAGES[resendError.name] ||
              resendError.message ||
              "Failed to resend confirmation code"
          )
        );
      }
    }

    next(
      new APIError(httpStatus.BAD_REQUEST, error.message || "Unable to sign in")
    );
  }
};

/**
 * Resends the confirmation code to the user's email address.
 *
 * @param {Object} req - The HTTP request object.
 * @param {string} req.body.email - The user's email address.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<Object>} - Response from Cognito client after resending the confirmation code.
 */
export const resendConfirmationCode = async (req, res, next) => {
  const { email } = req.body;

  try {
    const resendResponse = await resendConfirmationCodeByEmail(email);

    res.status(httpStatus.OK).send(formatSuccessResponse(resendResponse));
  } catch (error) {
    next(
      new APIError(
        httpStatus.BAD_REQUEST,
        AUTH_ERROR_MESSAGES[error.name] ||
          error.message ||
          "Failed to resend confirmation code"
      )
    );
  }
};

/**
 * Function to respond to an MFA challenge during the authentication process
 *
 * @param {Object} req - Express HTTP request object
 * @param {string} req.body.code - The MFA code entered by the user
 * @param {string} req.body.session - The session identifier for the authentication challenge
 * @param {Object} res - Express HTTP response object
 */
export const respondToAuthChallenge = async (req, res, next) => {
  try {
    const { session, challengeName, challengeResponses } = req.body;
    const secretHash = generateSecretHash(challengeResponses.USERNAME);

    const respondToAuthChallengeCommandInput = {
      ChallengeName: challengeName, // Challenge name for MFA
      Session: session,
      ClientId: config.aws.cognitoClientId,
      ChallengeResponses: { ...challengeResponses, SECRET_HASH: secretHash },
      UserPoolId: config.aws.cognitoUserPoolId,
    };

    const respondToAuthChallengeCommand = new RespondToAuthChallengeCommand(
      respondToAuthChallengeCommandInput
    );
    const authChallengeResponse = await cognitoClient.send(
      respondToAuthChallengeCommand
    );

    // eslint-disable-next-line operator-linebreak
    const { AccessToken, RefreshToken } =
      authChallengeResponse.AuthenticationResult || {};

    if (AccessToken) {
      // Set a default expiration time for the refresh token (e.g., 30 days)
      const refreshTokenExpiry = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

      // Save the refresh token for the user in the database
      const user = await findById(challengeResponses.USERNAME);
      if (user) {
        await createRefreshToken(user.id, RefreshToken, refreshTokenExpiry);
      }
    }

    res.status(httpStatus.OK).send(
      formatSuccessResponse({
        accessToken: AccessToken,
        challengeName: authChallengeResponse.ChallengeName,
        challengeParameters: authChallengeResponse.ChallengeParameters,
        session: authChallengeResponse.Session,
      })
    );
  } catch (error) {
    next(
      new APIError(
        httpStatus.BAD_REQUEST,
        AUTH_ERROR_MESSAGES[error.name] ||
          error.message ||
          "Failed to respond to MFA challenge"
      )
    );
  }
};

export const checkSignInOptions = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await findByEmail(email);

    const samlConfig = await getSAMLConfigurationForCompany({
      companyId: user.primaryCompanyId,
    });

    res
      .status(httpStatus.OK)
      .send(formatSuccessResponse({ isSaml: !!samlConfig }));
  } catch (error) {
    next(error);
  }
};

export const signInWithSAML = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await findByEmail(email);
    if (!user) {
      return res
        .status(404)
        .send({ success: false, message: "User Not Found!" });
    }

    const samlConfig = await getSAMLConfigurationForCompany({
      companyId: user.primaryCompanyId,
    });

    if (!samlConfig || !samlConfig.dataValues.isEnabled) {
      return res
        .status(404)
        .json({ error: "No active SAML configuration found!" });
    }

    // Generate Cognito hosted UI URL
    const loginUrl =
      `https://${process.env.AWS_COGNITO_DOMAIN}.auth.${process.env.AWS_COGNITO_DOMAIN_REGION}.amazoncognito.com/oauth2/authorize?` +
      `client_id=${process.env.AWS_COGNITO_CLIENT_ID}&` +
      `response_type=code&` +
      `scope=email+openid+profile&` +
      `redirect_uri=${encodeURIComponent(process.env.SAML_CALLBACK_URL)}&` +
      `identity_provider=${samlConfig.providerName}`;

    res.send(formatSuccessResponse({ redirectUrl: loginUrl }));
  } catch (error) {
    next(error);
  }
};

export const handleSAMLCallback = async (req, res, next) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).send("Authorization code is missing!");
    }
    // Send request to Cognito to exchange the code for tokens
    const tokenResponse = await fetch(
      `https://${process.env.AWS_COGNITO_DOMAIN}.auth.${process.env.AWS_COGNITO_DOMAIN_REGION}.amazoncognito.com/oauth2/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: process.env.AWS_COGNITO_CLIENT_ID,
          client_secret: process.env.AWS_COGNITO_CLIENT_SECRET,
          code: code,
          redirect_uri: process.env.SAML_CALLBACK_URL,
        }),
      }
    );

    if (!tokenResponse.ok) {
      return res
        .status(500)
        .json({ error: "Failed to exchange code for tokens" });
    }

    const tokenData = await tokenResponse.json();

    const { access_token: AccessToken, refresh_token } = tokenData;

    const decodedToken = await verifyToken(AccessToken);

    const userEmail = await getUserEmailFromCognitoGroup(decodedToken.sub);

    const currentUser = await getUserWithCompany({ email: userEmail });

    if (!currentUser) {
      return res.redirect(
        `${process.env.APP_HOME}/auth/callback?access-token=${AccessToken}`
      );
    }

    if (AccessToken) {
      // Save the refresh token for the user, if needed (e.g., store in DB)
      const refreshTokenExpiry = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
      await createRefreshToken(
        currentUser.id,
        refresh_token,
        refreshTokenExpiry
      );
    }

    // Redirect to frontend
    res.redirect(
      `${process.env.APP_HOME}/auth/callback?access-token=${AccessToken}`
    );
  } catch (error) {
    res.redirect(
      `${process.env.APP_HOME}/auth/callback?error=${error.message}`
    );
  }
};
