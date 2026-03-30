import { Model, DataTypes, Sequelize } from "sequelize";

export default (sequelize: Sequelize) => {
  class SuporteTicketAttachment extends Model {
    public id!: number;
    public ticket_id!: number;
    public file_path!: string;
    public file_name!: string;
    public file_size!: number;
    public mime_type!: string;
    public access_token!: string;
    public uploaded_at!: Date;

    static associate(models: any) {
      SuporteTicketAttachment.belongsTo(models.SuporteTicket, {
        foreignKey: 'ticket_id',
        as: 'ticket'
      });
    }
  }

  SuporteTicketAttachment.init({
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
    file_path: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    file_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    file_size: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    mime_type: {
      type: DataTypes.STRING,
      allowNull: true
    },
    access_token: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    uploaded_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'SuporteTicketAttachment',
    tableName: 'ticket_attachments',
    timestamps: false
  });

  return SuporteTicketAttachment;
};
