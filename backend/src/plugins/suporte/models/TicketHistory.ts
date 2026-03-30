import { Model, DataTypes, Sequelize } from "sequelize";

export default (sequelize: Sequelize) => {
  class SuporteTicketHistory extends Model {
    public id!: number;
    public ticket_id!: number;
    public user_id!: number;
    public action!: 'created' | 'updated' | 'responded' | 'closed';
    public message?: string;
    public created_at!: Date;

    static associate(models: any) {
      SuporteTicketHistory.belongsTo(models.SuporteTicket, {
        foreignKey: 'ticket_id',
        as: 'ticket'
      });
      
      SuporteTicketHistory.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }
  }

  SuporteTicketHistory.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    ticket_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tickets',
        key: 'id'
      }
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    action: {
      type: DataTypes.ENUM('created', 'updated', 'responded', 'closed'),
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'SuporteTicketHistory',
    tableName: 'ticket_history',
    timestamps: false
  });

  return SuporteTicketHistory;
};
