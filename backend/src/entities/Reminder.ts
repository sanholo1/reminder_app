import { Entity, PrimaryColumn, Column, CreateDateColumn, Index } from "typeorm";

@Entity("reminders")
export class Reminder {
  @PrimaryColumn("varchar", { length: 64 })
  id!: string;

  @Column("varchar", { length: 200 })
  activity!: string;

  @Column("varchar", { length: 50, nullable: true })
  category!: string | null;

  @Column("varchar", { length: 64 })
  sessionId!: string;

  @Column("timestamp")
  datetime!: Date;

  @Index()
  @Column("varchar", { length: 64 })
  userId!: string;
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