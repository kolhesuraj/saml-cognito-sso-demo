import express from "express";
import { Validator } from "express-json-validator-middleware";
import {
  confirmSignUp,
  resendConfirmationCode,
  respondToAuthChallenge,
  signIn,
  signInWithSAML,
  signUp,
  handleSAMLCallback,
  checkSignInOptions,
} from "../../controllers/auth.controller.js";
import {
  confirmSignUpSchema,
  resendConfirmationCodeSchema,
  respondToAuthChallengeSchema,
  signInSchema,
  signUpSchema,
} from "../../validations/auth-request.schema.js";

const { validate } = new Validator();

const router = express.Router();

router.post("/sign-up", validate({ body: signUpSchema }), signUp);
router.post(
  "/confirm-sign-up",
  validate({ body: confirmSignUpSchema }),
  confirmSignUp
);
router.post("/sign-in", validate({ body: signInSchema }), signIn);
router.post(
  "/resend-confirm-code",
  validate({ body: resendConfirmationCodeSchema }),
  resendConfirmationCode
);
router.post(
  "/respond-to-challenge",
  validate({ body: respondToAuthChallengeSchema }),
  respondToAuthChallenge
);

router.post("/check-sign-in-options", checkSignInOptions);
router.post("/saml/sign-in", signInWithSAML);
router.get("/saml/callback", handleSAMLCallback);

export default router;
