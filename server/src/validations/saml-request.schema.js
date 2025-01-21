const callbackSchema = {
  type: "object",
  required: ["SAMLResponse", "RelayState"],
  properties: {
    SAMLResponse: {
      type: "string",
      minLength: 1,
    },
    RelayState: {
      type: "string",
      minLength: 1,
    },
  },
  additionalProperties: false,
};
const configureSchema = {
  type: "object",
  required: ["providerName", "metadataUrl"],
  properties: {
    providerName: {
      type: "string",
      minLength: 1,
    },
    metadataUrl: {
      type: "string",
    },
  },
  additionalProperties: false,
};

export { configureSchema, callbackSchema };
