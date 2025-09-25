import { DataSource } from "typeorm";
import { Reminder } from "./src/entities/Reminder";
import { UserSession } from "./src/entities/UserSession";
import { User } from "./src/entities/User";
import * as dotenv from "dotenv";

dotenv.config();

export default new DataSource({
  type: "mysql",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  username: process.env.DB_USERNAME || "app_user",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_DATABASE || "reminder_app",
  synchronize: false,
  logging: process.env.NODE_ENV === "development",
  entities: [Reminder, UserSession, User],
  migrations: ["src/migrations/*.ts"],
  subscribers: [],
}); 