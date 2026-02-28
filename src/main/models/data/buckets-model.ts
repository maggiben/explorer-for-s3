import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';
import { connect } from '../../common/database';
import { mergeDeep } from '../../../shared/lib/utils';

const sequelize = connect();

class Buckets extends Model<InferAttributes<Buckets>, InferCreationAttributes<Buckets>> {
  declare id: CreationOptional<number>;
  declare type: CreationOptional<string>;
  declare color: CreationOptional<string>;
  declare icon: CreationOptional<string>;
  declare name: CreationOptional<string>;
  declare connectionIds: CreationOptional<number[]>;

  override toJSON() {
    const result = mergeDeep(this.get({ plain: true }));

    return result as InferAttributes<Buckets>;
  }
}

Buckets.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      primaryKey: true,
      autoIncrement: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'BUCKET',
    },
    color: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '#fafafa',
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    connectionIds: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
  },
  {
    sequelize,
    modelName: 'buckets',
    indexes: [
      {
        unique: true,
        fields: ['name'],
      }
    ],
  },
);

export default Buckets;
