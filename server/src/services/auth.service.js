import { ListUsersCommand, ResendConfirmationCodeCommand } from "@aws-sdk/client-cognito-identity-provider";
import config from "../config/config.js";
import { generateSecretHash } from "../utils/hash.js";
import cognitoClient from "../config/cognito.js";

/**
 * Resends the confirmation code to the user's email address.
 *
 * @param {string} email - The user's email address.
 * @returns {Promise<Object>} - Response from Cognito client after resending the confirmation code.
 */
export const resendConfirmationCodeByEmail = async (email) => {
  const secretHash = generateSecretHash(email);

  const resendConfirmationCodeCommandInput = {
    ClientId: config.aws.cognitoClientId,
    Username: email,
    SecretHash: secretHash,
  };

  const resendConfirmationCodeCommand = new ResendConfirmationCodeCommand(
    resendConfirmationCodeCommandInput
  );
  const resendResponse = await cognitoClient.send(
    resendConfirmationCodeCommand
  );

  return resendResponse;
};

export const getUserEmailFromCognitoGroup = async (sub) => {
  const command = new ListUsersCommand({
    UserPoolId: config.aws.cognitoUserPoolId,
    Filter: `sub = "${sub}"`,
  });

  const res = await cognitoClient.send(command);

  const userEmail = res.Users[0].Attributes.find(
    (attribute) => attribute.Name === "email"
  ).Value;
  return userEmail;
};
