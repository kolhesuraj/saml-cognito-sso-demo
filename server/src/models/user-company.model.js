export const UserRoles = Object.freeze({
  Administrator: 'Administrator',
  PowerUser: 'Power User',
  ReadOnlyUser: 'Read Only User',
  DashboardsOnly: 'Dashboards Only',
});

/**
 * Model class for "user_companies"
 *
 * @param {Sequelize} sequelize - sequelize object
 * @param {Sequelize.DataTypes} DataTypes - sequelize datatypes
 *
 * @returns {Sequelize.Model} UserCompany - sequelize model for user_company entity
 */
export default (sequelize, DataTypes) => {
  const UserCompany = sequelize.define(
    'UserCompany',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      role: {
        type: DataTypes.ENUM(
          UserRoles.Administrator,
          UserRoles.PowerUser,
          UserRoles.ReadOnly,
          UserRoles.DashboardsOnly,
        ),
        allowNull: false,
        defaultValue: 'Administrator',
      },
      enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      lastActive: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      underscored: true,
      tableName: 'user_companies',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['userId', 'companyId'],
          name: 'moneta_user_and_company_uk',
        },
      ],
    },
  );

  UserCompany.associate = models => {
    UserCompany.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });

    UserCompany.belongsTo(models.Company, {
      foreignKey: 'companyId',
      as: 'company',
    });
  };

  return UserCompany;
};
