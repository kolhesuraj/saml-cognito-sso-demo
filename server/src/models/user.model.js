/**
 * Model class for "user"
 *
 * @param {Sequelize} sequelize - sequelize object
 * @param {Sequelize.DataTypes} DataTypes - sequelize datatypes
 *
 * @returns {Sequelize.Model} User - sequelize model for user entity
 */
export default (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      primaryCompanyId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "primary_company_id",
      },
      firstName: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      lastName: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      avatar: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      mfaEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "users",
      timestamps: true,
      underscored: true,
      paranoid: true,
      deletedAt: "deletedAt",
    }
  );

  User.associate = (models) => {
    // User belongs to many companies
    User.belongsToMany(models.Company, {
      through: "UserCompany",
      foreignKey: "userId",
      otherKey: "companyId",
      as: "companies",
    });

    // User belongs to a primary company
    User.belongsTo(models.Company, {
      foreignKey: "primaryCompanyId",
      as: "primaryCompany",
    });
  };

  // Hook to delete associated UserCompany records after a user is deleted
  User.addHook("afterDestroy", async (user) => {
    const { UserCompany } = sequelize.models;
    await UserCompany.destroy({
      where: { userId: user.id },
    });
  });

  return User;
};
