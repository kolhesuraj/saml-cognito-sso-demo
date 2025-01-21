/* eslint-disable max-len */
export const AUTH_ERROR_MESSAGES = {
  'Password attempts exceeded': `We noticed multiple failed sign-in attempts. For your security, further attempts have been temporarily locked.
    Please try again later. If you need assistance, contact our support team.`,
  'User is disabled.': 'Your account has been disabled. Please contact our support team.',
  NotAuthorizedException:
    'You are not authorized to perform this operation. Please check your permissions and try again.',
  ResourceNotFoundException:
    'The requested resource could not be found. Please check your input and try again.',
  InternalErrorException:
    'An internal error occurred while processing your request. Please try again later.',
  InvalidUserPoolConfigurationException:
    'The user pool configuration is invalid. Please contact our support team for assistance.',
  MFAMethodNotFoundException:
    'The specified multi-factor authentication (MFA) method could not be found. Please check your input and try again.',
  SoftwareTokenMFANotFoundException:
    'The software token MFA method could not be found. Please check your input and try again.',
  SMSMFANotFoundException:
    'The SMS MFA method could not be found. Please check your input and try again.',
  InvalidSMSRoleAccessPolicyException:
    'The SMS role access policy is invalid. Please contact our support team for assistance.',
  InvalidSMSRoleTrustRelationshipException:
    'The SMS role trust relationship is invalid. Please contact our support team for assistance.',
  PasswordResetRequiredException:
    'Your password has expired or been reset. Please follow the password reset process to set a new password.',
  UserNotFoundInClaimException:
    'The user specified in the claim could not be found. Please check your input and try again.',
  LimitExceededException:
    'Request limit exceeded: You have made too many requests in a short period. Please try again later.',
  TooManyFailedAttemptsException:
    'You have exceeded the maximum number of failed attempts for this operation. Your account has been temporarily locked. Please try again later.',
  ConcurrentModificationException:
    'Another operation is currently modifying the same resource. Please try again later.',
  AliasExistsException:
    'The alias (email or phone number) you provided already exists. Please choose a different alias or sign in with your existing account.',
  InvalidSmsRoleAccessPolicyException:
    'The SMS role access policy is invalid. Please contact our support team for assistance.',
  InvalidSmsRoleTrustRelationshipException:
    'The SMS role trust relationship is invalid. Please contact our support team for assistance.',
  PreconditionNotMetException:
    'One or more preconditions for this operation were not met. Please check your input and try again.',
  ScopeDoesNotExistException:
    'The specified scope does not exist. Please check your input and try again.',
  InvalidOAuthFlowException:
    'The specified OAuth flow is invalid. Please check your input and try again.',
  ThrottlingException:
    'Your request was throttled due to excessive traffic. Please try again later.',
  ExpiredCodeException:
    'The confirmation code you provided has expired. Please request a new code and try again.',
};
