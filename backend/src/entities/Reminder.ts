import { Entity, PrimaryColumn, Column, CreateDateColumn } from "typeorm";

@Entity("reminders")
export class Reminder {
  @PrimaryColumn("varchar", { length: 255 })
  id!: string;

  @Column("varchar", { length: 500 })
  activity!: string;

  @Column("datetime")
  datetime!: Date;

  @CreateDateColumn()
  created_at!: Date;

  constructor(id: string, activity: string, datetime: Date) {
    this.id = id;
    this.activity = activity;
    this.datetime = datetime;
  }
} 