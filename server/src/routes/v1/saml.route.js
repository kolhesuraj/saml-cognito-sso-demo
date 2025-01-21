import express from "express";
import { Validator } from "express-json-validator-middleware";
import {
  configureSAMLConnection,
  deleteSAMLConnectionConfiguration,
  getSAMLConfiguration,
  updateSAMLConnectionConfiguration,
} from "../../controllers/saml.controller.js";
import { configureSchema } from "../../validations/saml-request.schema.js";

const { validate } = new Validator();

const router = express.Router();

router
  .route("/configure")
  .get(getSAMLConfiguration)
  .post(validate({ body: configureSchema }), configureSAMLConnection)
  .patch(updateSAMLConnectionConfiguration)
  .delete(deleteSAMLConnectionConfiguration);

export default router;
