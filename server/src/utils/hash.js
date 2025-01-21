import { createHmac } from 'crypto';
import config from '../config/config.js';

export const generateSecretHash = username => {
  try {
    const hashGenerator = createHmac('sha256', config.aws.cognitoClientSecret);
    hashGenerator.update(`${username}${config.aws.cognitoClientId}`);
    return hashGenerator.digest('base64');
  } catch (error) {
    throw new Error('Failed to generate secret hash');
  }
};
