const signUpSchema = {
  type: "object",
  properties: {
    firstName: {
      type: "string",
      minLength: 1,
    },
    lastName: {
      type: "string",
      minLength: 1,
    },
    email: {
      type: "string",
      pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}$",
    },
    password: {
      type: "string",
      minLength: 8, // You can add additional password validation rules here
    },
    companyName: {
      type: "string",
      minLength: 3, // Adjust the minimum length as per your requirements
    },
  },
  required: ["firstName", "lastName", "email", "password", "companyName"],
  additionalProperties: false,
};

const signInSchema = {
  type: "object",
  properties: {
    email: {
      type: "string",
      pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}$",
    },
    password: {
      type: "string",
      minLength: 8,
    },
  },
  required: ["email", "password"],
  additionalProperties: false,
};

const confirmSignUpSchema = {
  type: "object",
  properties: {
    email: {
      type: "string",
      pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}$",
    },
    code: {
      type: "string",
      minLength: 6,
      maxLength: 6,
    },
  },
  required: ["email", "code"],
  additionalProperties: false,
};

const resendConfirmationCodeSchema = {
  type: "object",
  properties: {
    email: {
      type: "string",
      pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}$",
    },
  },
  required: ["email"],
  additionalProperties: false,
};

const respondToAuthChallengeSchema = {
  type: "object",
  properties: {
    session: {
      type: "string",
    },
    challengeName: {
      type: "string",
    },
    challengeResponses: {
      type: "object",
      properties: {
        USERNAME: {
          type: "string",
        },
        NEW_PASSWORD: {
          type: "string",
          minLength: 8,
        },
        SOFTWARE_TOKEN_MFA_CODE: {
          type: "string",
        },
        // Add other challenge response properties as needed
      },
      required: ["USERNAME"],
      additionalProperties: true, // Allow additional properties for challenge responses
    },
  },
  required: ["session", "challengeName", "challengeResponses"],
  additionalProperties: false,
};

export {
  signUpSchema,
  signInSchema,
  confirmSignUpSchema,
  resendConfirmationCodeSchema,
  respondToAuthChallengeSchema,
};
