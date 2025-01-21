/**
 * Model class for "refresh_tokens"
 *
 * @param {Sequelize} sequelize - sequelize object
 * @param {Sequelize.DataTypes} DataTypes - sequelize datatypes
 *
 * @returns {Sequelize.Model} SAMLConfig - sequelize model for saml_config entity
 */
export default (sequelize, DataTypes) => {
  const SAMLConfiguration = sequelize.define(
    "SAMLConfiguration",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      providerName: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      companyId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      isEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        default: true,
      },
    },
    {
      underscored: true,
      tableName: "saml_configuration",
      timestamps: true,
    }
  );

  SAMLConfiguration.associate = (models) => {
    SAMLConfiguration.belongsTo(models.User, {
      foreignKey: "userId",
      as: "addedBy",
    });
    SAMLConfiguration.belongsTo(models.Company, {
      foreignKey: "companyId",
      as: "company",
    });
  };

  return SAMLConfiguration;
};
