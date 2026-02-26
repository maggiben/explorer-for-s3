import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';
import { connect } from '../../common/database';
import { encrypt, decrypt } from '../../common/crypto';
import { mergeDeep } from '../../../shared/lib/utils';

const sequelize = connect();

class Connections extends Model<
  InferAttributes<Connections>,
  InferCreationAttributes<Connections>
> {
  declare id: CreationOptional<number>;
  declare accessKeyId: CreationOptional<string>;
  declare secretAccessKey: CreationOptional<string>;
  declare region: CreationOptional<string>;
  declare endpoint: CreationOptional<string>;
  declare bucket: CreationOptional<string>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare remember: CreationOptional<boolean>;

  override toJSON() {
    const result = mergeDeep(this.get({ plain: true })) as Record<string, unknown>;
    delete result.secretAccessKey;
    return result as InferAttributes<Connections>;
  }
}

Connections.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      primaryKey: true,
      autoIncrement: true,
    },

    accessKeyId: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    secretAccessKey: {
      type: DataTypes.STRING,
      allowNull: true,

      get(this: Connections): string | null {
        const value = this.getDataValue('secretAccessKey');
        if (!value) {
          return null;
        }
        return decrypt(Buffer.from(value, 'base64')).toString();
      },

      set(this: Connections, value: string | null): void {
        if (!value) {
          this.setDataValue('secretAccessKey', '');
          return;
        }

        this.setDataValue(
          'secretAccessKey',
          encrypt(Buffer.from(value, 'utf8')).toString('base64'),
        );
      },
    },

    region: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    endpoint: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    bucket: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    remember: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'connections',
    indexes: [],
  },
);

export default Connections;
