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

class Settings extends Model<InferAttributes<Settings>, InferCreationAttributes<Settings>> {
  declare id: CreationOptional<number>;
  declare accessKeyId: CreationOptional<string>;
  declare secretAccessKey: CreationOptional<string>;
  declare region: CreationOptional<string>;
  declare bucket: CreationOptional<string>;

  override toJSON() {
    const result = mergeDeep(this.get({ plain: false })) as Record<string, unknown>;

    delete result.secretAccessKey;

    return result as InferAttributes<Settings>;
  }
}

Settings.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    accessKeyId: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    secretAccessKey: {
      type: DataTypes.STRING,
      allowNull: true,

      get(this: Settings): string | null {
        const value = this.getDataValue('secretAccessKey');
        if (!value) {
          return null;
        }
        return decrypt(Buffer.from(value, 'base64')).toString();
      },

      set(this: Settings, value: string | null): void {
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
      allowNull: true,
    },

    bucket: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'settings',
    indexes: [],
  },
);

export default Settings;
