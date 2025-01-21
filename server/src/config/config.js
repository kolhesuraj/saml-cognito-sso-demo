/**
 * Config details
 *
 */
import "dotenv/config";

export default {
  env: process.env.NODE_ENV,
  appHome: process.env.APP_HOME,
  adminCompanyId: process.env.ADMIN_COMPANY_ID,
  aws: {
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    cognitoClientId: process.env.AWS_COGNITO_CLIENT_ID,
    cognitoClientSecret: process.env.AWS_COGNITO_CLIENT_SECRET,
    cognitoUserPoolId: process.env.AWS_COGNITO_USER_POOL_ID,
    kmsKeyId: process.env.AWS_KMS_KEY_ID,
    s3BucketName: process.env.AWS_S3_BUCKET_NAME,
    sesFromEmail: process.env.AWS_SES_FROM_EMAIL,
    sesRegion: process.env.AWS_SES_REGION,
  },
};
