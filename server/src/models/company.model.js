export const accountTypes = Object.freeze({
  StandardAccount: "Standard Account",
  LinkedAccount: "Linked Account",
  ResellerAccount: "Reseller Account",
  ManagedAccount: "Managed Account",
});

/**
 * Model class for "companies"
 *
 * @param {Sequelize} sequelize - sequelize object
 * @param {Sequelize.DataTypes} DataTypes - sequelize datatypes
 *
 * @returns {Sequelize.Model} Company - sequelize model for company entity
 */
export default (sequelize, DataTypes) => {
  const Company = sequelize.define(
    "Company",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      originalName: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      address: {
        type: DataTypes.TEXT,
      },
      companyLogo: {
        type: DataTypes.TEXT,
      },
      enabled: {
        type: DataTypes.BOOLEAN,
        default: true,
        allowNull: false,
      },
      deleted: {
        type: DataTypes.BOOLEAN,
        default: false,
        allowNull: true,
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      parentId: {
        type: DataTypes.UUID,
        defaultValue: null,
        references: {
          model: "company", // Reference the same 'Company' model
          key: "id",
        },
      },
      accountType: {
        type: DataTypes.ENUM,
        values: [
          accountTypes.StandardAccount,
          accountTypes.LinkedAccount,
          accountTypes.ResellerAccount,
          accountTypes.ManagedAccount,
        ],
        defaultValue: accountTypes.StandardAccount,
        allowNull: true,
      },
      managerId: {
        type: DataTypes.UUID,
        defaultValue: null,
        references: {
          model: "company", // Reference the same 'Company' model
          key: "id",
        },
      },
      contactPerson: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      contactEmail: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true,
      },
      isDemoCustomer: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        default: false,
      },
    },
    {
      underscored: true,
      tableName: "companies",
      timestamps: true,
      paranoid: true,
      deletedAt: "deletedAt",
    }
  );

  Company.associate = (models) => {
    Company.belongsToMany(models.User, {
      through: "UserCompany",
      foreignKey: "companyId",
      otherKey: "userId",
      as: "users",
    });

    Company.hasMany(models.User, {
      foreignKey: "primaryCompanyId",
      as: "primaryUsers",
    });
    Company.hasMany(models.UserCompany, {
      foreignKey: "companyId",
      as: "userCompany",
    });
    Company.belongsTo(models.Company, {
      foreignKey: "parentId",
      as: "parent", // set one to one relation for sub account
    });
    Company.hasMany(models.Company, {
      foreignKey: "parentId",
      as: "children", // set one to many relation for parent account
    });
  };

  return Company;
};
