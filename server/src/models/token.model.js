/**
 * Model class for "refresh_tokens"
 *
 * @param {Sequelize} sequelize - sequelize object
 * @param {Sequelize.DataTypes} DataTypes - sequelize datatypes
 *
 * @returns {Sequelize.Model} RefreshToken - sequelize model for refresh_token entity
 */
export default (sequelize, DataTypes) => {
  const RefreshToken = sequelize.define(
    'RefreshToken',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      token: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      expiresAt: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
    },
    {
      underscored: true,
      tableName: 'tokens',
      timestamps: true,
    },
  );

  RefreshToken.associate = models => {
    RefreshToken.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
  };

  return RefreshToken;
};
