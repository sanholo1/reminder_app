import { DataSource } from "typeorm";
import { Reminder } from "./src/entities/Reminder";

export default new DataSource({
  type: "mysql",
  host: "localhost",
  port: 3306,
  username: "app_user",
  password: "password",
  database: "reminder_app",
  synchronize: false,
  logging: true,
  entities: [Reminder],
  migrations: ["src/migrations/*.ts"],
  subscribers: [],
}); 