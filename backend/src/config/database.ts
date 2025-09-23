import { DataSource } from "typeorm";
import { Reminder } from "../entities/Reminder";
import { UserSession } from "../entities/UserSession";
import { TrashItem } from "../entities/TrashItem";
import * as dotenv from "dotenv";
import { InternalServerError } from "../exceptions/exception_handler";

dotenv.config();

const requiredEnvVars = ['DB_HOST', 'DB_USERNAME', 'DB_PASSWORD', 'DB_DATABASE'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  throw new InternalServerError(`Brak wymaganych zmiennych środowiskowych: ${missingVars.join(', ')}`);
}

export const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST as string,
  port: parseInt(process.env.DB_PORT || "3306"),
  username: process.env.DB_USERNAME as string,
  password: process.env.DB_PASSWORD as string,
  database: process.env.DB_DATABASE as string,
  synchronize: process.env.NODE_ENV === "development",
  logging: process.env.NODE_ENV === "development",
  entities: [Reminder, UserSession, TrashItem],
  subscribers: [],
  migrations: ["src/migrations/*.ts"],
}); 