import { Model, DataTypes, Sequelize } from "sequelize";

export default (sequelize: Sequelize) => {
  class SuporteTicket extends Model {
    public id!: number;
    public company_id!: number;
    public user_id!: number;
    public title!: string;
    public description?: string;
    public status!: 'open' | 'in_progress' | 'closed';
    public priority!: 'low' | 'normal' | 'high';
    public created_at!: Date;
    public updated_at!: Date;

    static associate(models: any) {
      SuporteTicket.belongsTo(models.Company, {
        foreignKey: 'company_id',
        as: 'company'
      });
      
      SuporteTicket.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });

      SuporteTicket.hasMany(models.SuporteTicketAttachment, {
        foreignKey: 'ticket_id',
        as: 'attachments'
      });

      SuporteTicket.hasMany(models.SuporteTicketHistory, {
        foreignKey: 'ticket_id',
        as: 'history'
      });
    }
  }

  SuporteTicket.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    company_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Companies',
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
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('open', 'in_progress', 'closed'),
      allowNull: false,
      defaultValue: 'open'
    },
    priority: {
      type: DataTypes.ENUM('low', 'normal', 'high'),
      allowNull: false,
      defaultValue: 'normal'
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
    modelName: 'SuporteTicket',
    tableName: 'tickets',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return SuporteTicket;
};
