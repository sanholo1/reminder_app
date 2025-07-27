import { DataSource } from "typeorm";
import { Reminder } from "../entities/Reminder";

export const AppDataSource = new DataSource({
  type: "mysql",
  host: "localhost",
  port: 3306,
  username: "app_user",
  password: "password",
  database: "reminder_app",
  synchronize: false, // Wyłączone dla bezpieczeństwa w produkcji
  logging: true,
  entities: [Reminder],
  subscribers: [],
  migrations: [],
}); 