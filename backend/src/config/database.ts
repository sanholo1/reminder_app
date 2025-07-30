import { DataSource } from "typeorm";
import { Reminder } from "../entities/Reminder";
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
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  username: process.env.DB_USERNAME || "app_user",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_DATABASE || "reminder_app",
  synchronize: process.env.NODE_ENV === "development",
  logging: process.env.NODE_ENV === "development",
  entities: [Reminder],
  subscribers: [],
  migrations: [],
}); 