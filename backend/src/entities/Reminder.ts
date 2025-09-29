import { Entity, PrimaryColumn, Column, CreateDateColumn } from "typeorm";

@Entity("reminders")
export class Reminder {
  @PrimaryColumn("varchar", { length: 255 })
  id!: string;

  @Column("varchar", { length: 500 })
  activity!: string;

  @Column("varchar", { length: 100, nullable: true })
  category!: string | null;

  @Column("varchar", { length: 255 })
  sessionId!: string;

  @Column("varchar", { length: 255 })
  userId!: string;

  @Column("datetime")
  datetime!: Date;

  @CreateDateColumn()
  created_at!: Date;

  constructor(id: string, activity: string, datetime: Date, category?: string | null, sessionId?: string, userId?: string) {
    this.id = id;
    this.activity = activity;
    this.datetime = datetime;
    this.category = category || null;
    this.sessionId = sessionId || '';
    this.userId = userId || '';
  }
} 