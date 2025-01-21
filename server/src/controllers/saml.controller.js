import {
  createNewSAMLConfiguration,
  deleteSAMLConfiguration,
  getSAMLConfigurationForCompany,
  updateSAMLConfiguration,
} from "../services/saml.service.js";

export const getSAMLConfiguration = async (req, res, next) => {
  try {
    const { id: companyId } = req.user.company;

    const config = await getSAMLConfigurationForCompany({ companyId });

    if (!config) {
      return res.status(404).json({ error: "No SAML configuration found" });
    }

    res.json({ success: true, body: { config } });
  } catch (error) {
    next(error);
  }
};

export const configureSAMLConnection = async (req, res, next) => {
  try {
    const { providerName, metadataUrl, metadataX509File } = req.body;
    const {
      id: userId,
      company: { id: companyId },
    } = req.user;

    const samlConfig = await createNewSAMLConfiguration({
      providerName,
      metadataUrl,
      metadataX509File,
      userId,
      companyId,
    });
    res.json({ success: true, config: samlConfig });
  } catch (error) {
    next(error);
  }
};

export const updateSAMLConnectionConfiguration = async (req, res, next) => {
  try {
    const { providerName, metadataUrl, metadataX509File } = req.body;
    const { id: companyId } = req.user.company;

    const samlConfig = await updateSAMLConfiguration({
      providerName,
      metadataUrl,
      metadataX509File,
      companyId,
    });
    res.json({ success: true, config: samlConfig });
  } catch (error) {
    next(error);
  }
};

export const deleteSAMLConnectionConfiguration = async (req, res, next) => {
  try {
    const { id: companyId } = req.user.company;

    await deleteSAMLConfiguration({ companyId });
    res.json({
      success: true,
      message: "SAML configuration deleted successfully !",
    });
  } catch (error) {
    next(error);
  }
};
