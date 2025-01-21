import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import config from './config.js';

const cognitoClient = new CognitoIdentityProviderClient({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  },
});

export default cognitoClient;
