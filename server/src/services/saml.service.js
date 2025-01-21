import {
  CreateIdentityProviderCommand,
  DeleteIdentityProviderCommand,
  DescribeUserPoolClientCommand,
  UpdateIdentityProviderCommand,
  UpdateUserPoolClientCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import cognitoClient from "../config/cognito.js";
import crypto from "crypto";
import { DOMParser } from "xmldom";

import db from "../models/index.js";
import sequelize from "../config/sequelize.js";

/**
 * @constant {Sequelize.models} - Company model extracted from db import
 */
const { SAMLConfiguration } = db;

function isXMLString(str) {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(str, "application/xml");

    // Check for parsing errors
    const parseError = xmlDoc.getElementsByTagName("parsererror");
    return parseError.length === 0;
  } catch (error) {
    return false;
  }
}

const isValidUrl = async (url) => {
  try {
    new URL(url);
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    if (response.status !== 200) {
      throw new Error(response.statusText);
    }
    return true;
  } catch (error) {
    return false;
  }
};

export const getSAMLConfigurationForCompany = ({ companyId }) =>
  SAMLConfiguration.findOne({
    where: {
      companyId,
    },
    logging: console.log,
  });

export const updateAppClientSettings = async (samlProviderName) => {
  try {
    // First get current app client settings
    const clientResponse = await cognitoClient.send(
      new DescribeUserPoolClientCommand({
        UserPoolId: process.env.AWS_COGNITO_USER_POOL_ID,
        ClientId: process.env.AWS_COGNITO_CLIENT_ID,
      })
    );

    // Get current settings
    const currentClient = clientResponse.UserPoolClient;

    // Add new SAML provider to existing providers if not already present
    const currentProviders = currentClient.SupportedIdentityProviders || [
      "COGNITO",
    ];
    if (!currentProviders.includes(samlProviderName)) {
      currentProviders.push(samlProviderName);
    }

    const appClientParams = {
      UserPoolId: process.env.AWS_COGNITO_USER_POOL_ID,
      ClientId: process.env.AWS_COGNITO_CLIENT_ID,
      SupportedIdentityProviders: currentProviders,

      // Maintain existing settings
      CallbackURLs: currentClient.CallbackURLs,
      LogoutURLs: currentClient.LogoutURLs,
      AllowedOAuthFlows: currentClient.AllowedOAuthFlows,
      AllowedOAuthScopes: currentClient.AllowedOAuthScopes,
      AllowedOAuthFlowsUserPoolClient:
        currentClient.AllowedOAuthFlowsUserPoolClient,

      // Preserve any other existing settings
      ExplicitAuthFlows: currentClient.ExplicitAuthFlows,
      PreventUserExistenceErrors: currentClient.PreventUserExistenceErrors,
      EnableTokenRevocation: currentClient.EnableTokenRevocation,
    };

    const response = await cognitoClient.send(
      new UpdateUserPoolClientCommand(appClientParams)
    );
    return response;
  } catch (error) {
    console.error("Failed to update app client settings:", error);
    throw new Error("Error updating app client settings: " + error.message);
  }
};

export const createNewSAMLConfiguration = async ({
  providerName,
  metadataUrl,
  metadataX509File,
  userId,
  companyId,
}) => {
  if (providerName.length >= 32) {
    throw new Error("Provider name length must be less than 32 characters.");
  }

  if (!metadataUrl && !metadataX509File) {
    throw new Error("Either metadataUrl or metadataX509File must be provided.");
  }

  // Generate unique provider name
  const providerNameLength = 32 - providerName.length;
  const uniquePart = crypto.randomBytes(providerNameLength / 4).toString("hex");
  const uniqueProviderName = `${providerName}-${uniquePart}`;

  // Base Cognito params
  const cognitoParams = {
    UserPoolId: process.env.AWS_COGNITO_USER_POOL_ID,
    ProviderName: uniqueProviderName,
    ProviderType: "SAML",
    AttributeMapping: {
      email: "email",
    },
  };

  // Set provider details based on whether we're using metadata URL or X509 file
  if (metadataUrl) {
    if (!(await isValidUrl(metadataUrl))) {
      throw new Error("Invalid metadata URL provided.");
    }
    cognitoParams.ProviderDetails = {
      MetadataURL: metadataUrl,
      IDPSignout: "true",
      RequestSigningAlgorithm: "rsa-sha256",
    };
  } else {
    // Read and validate X509 file content
    // Basic validation of X509 content
    if (!isXMLString(metadataX509File)) {
      throw new Error("Invalid X509 certificate format");
    }

    cognitoParams.ProviderDetails = {
      MetadataFile: metadataX509File,
      IDPSignout: "true",
      RequestSigningAlgorithm: "rsa-sha256",
    };
  }

  const transaction = await sequelize.transaction();
  try {
    await cognitoClient.send(new CreateIdentityProviderCommand(cognitoParams));

    await updateAppClientSettings(uniqueProviderName);

    const samlConfig = await SAMLConfiguration.create(
      {
        companyId,
        userId,
        providerName: uniqueProviderName,
        isEnabled: true,
      },
      { transaction }
    );

    await transaction.commit();
    return samlConfig;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const updateSAMLConfiguration = async ({
  metadataUrl,
  metadataX509File,
  companyId,
}) => {
  // Input validation
  if (!metadataUrl && !metadataX509File) {
    throw new Error("Either metadataUrl or metadataX509File must be provided.");
  }

  // Find existing configuration
  const config = await SAMLConfiguration.findOne({
    where: {
      companyId,
      isEnabled: true,
    },
  });

  if (!config) {
    throw new Error("No SAML configuration found");
  }

  // Base Cognito params
  const cognitoParams = {
    UserPoolId: process.env.AWS_COGNITO_USER_POOL_ID,
    ProviderName: config.dataValues.providerName,
    ProviderDetails: {
      IDPSignout: "true",
    },
  };

  // Set provider details based on update type
  if (metadataUrl) {
    // Validate URL
    if (!(await isValidUrl(metadataUrl))) {
      throw new Error("Invalid metadata URL provided.");
    }
    cognitoParams.ProviderDetails.MetadataURL = metadataUrl;
  } else if (metadataX509File) {
    // Validate and process X509 file
    try {
      // Basic validation of X509 content
      if (!isXMLString(metadataX509File)) {
        throw new Error("Invalid X509 certificate format");
      }

      cognitoParams.ProviderDetails.MetadataFile = metadataX509File;
    } catch (error) {
      throw new Error(`Invalid X509 file: ${error.message}`);
    }
  }

  const transaction = await sequelize.transaction();

  try {
    // Update Cognito provider
    const response = await cognitoClient.send(
      new UpdateIdentityProviderCommand(cognitoParams)
    );

    // Update database record
    await config.update(
      {
        updatedAt: new Date(),
      },
      { transaction }
    );

    await transaction.commit();
    return response;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const deleteSAMLConfiguration = async ({ companyId }) => {
  const config = await SAMLConfiguration.findOne({ companyId });

  if (!config) {
    return res.status(404).json({ error: "No SAML configuration found" });
  }

  // Delete from Cognito
  const deleteIdentityProviderCommand = new DeleteIdentityProviderCommand({
    UserPoolId: process.env.AWS_COGNITO_USER_POOL_ID,
    ProviderName: config.dataValues.providerName,
  });
  await cognitoClient.send(deleteIdentityProviderCommand);

  // delete from database
  await config.destroy();
};
