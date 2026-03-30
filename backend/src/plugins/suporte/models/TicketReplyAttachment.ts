import { Model, DataTypes, Sequelize } from "sequelize";

export default (sequelize: Sequelize) => {
  class SuporteTicketReplyAttachment extends Model {
    public id!: number;
    public reply_id!: number;
    public file_path!: string;
    public file_name!: string;
    public file_size!: number;
    public mime_type!: string;
    public access_token!: string;
    public download_url!: string;
    public preview_url!: string;
    public uploaded_at!: Date;

    static associate(models: any) {
      SuporteTicketReplyAttachment.belongsTo(models.SuporteTicketReply, {
        foreignKey: 'reply_id',
        as: 'reply'
      });
    }
  }

  SuporteTicketReplyAttachment.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    reply_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'ticket_replies',
        key: 'id'
      }
    },
    file_path: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    file_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    file_size: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    mime_type: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    access_token: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true
    },
    download_url: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    preview_url: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    uploaded_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'SuporteTicketReplyAttachment',
    tableName: 'ticket_reply_attachments',
    timestamps: false
  });

  return SuporteTicketReplyAttachment;
};
