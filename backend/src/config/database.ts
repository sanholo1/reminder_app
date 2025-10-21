import { DataSource } from 'typeorm';
import { Reminder } from '../entities/Reminder';
import { UserSession } from '../entities/UserSession';
import { TrashItem } from '../entities/TrashItem';
import { User } from '../entities/User';
import { config } from './environment';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.database,
  synchronize: config.app.nodeEnv === 'development',
  logging: config.app.nodeEnv === 'development',
  entities: [Reminder, UserSession, TrashItem, User],
  subscribers: [],
  migrations: ['dist/migrations/*.js'],
});
