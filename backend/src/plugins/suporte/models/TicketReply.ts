import { Model, DataTypes, Sequelize } from "sequelize";

export default (sequelize: Sequelize) => {
  class SuporteTicketReply extends Model {
    public id!: number;
    public ticket_id!: number;
    public user_id!: number;
    public message!: string;
    public is_internal!: boolean;
    public created_at!: Date;
    public updated_at!: Date;

    static associate(models: any) {
      SuporteTicketReply.belongsTo(models.SuporteTicket, {
        foreignKey: 'ticket_id',
        as: 'ticket'
      });
      
      SuporteTicketReply.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });

      SuporteTicketReply.hasMany(models.SuporteTicketReplyAttachment, {
        foreignKey: 'reply_id',
        as: 'attachments'
      });
    }
  }

  SuporteTicketReply.init({
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
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    is_internal: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'SuporteTicketReply',
    tableName: 'ticket_replies',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return SuporteTicketReply;
};
