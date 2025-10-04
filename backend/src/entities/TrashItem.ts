import { Entity, PrimaryColumn, Column, CreateDateColumn, Index } from "typeorm";

@Entity("trash_items")
export class TrashItem {
  @PrimaryColumn("varchar", { length: 64 })
  id!: string;

  @Column("varchar", { length: 200 })
  activity!: string;

  @Column("varchar", { length: 50, nullable: true })
  category!: string | null;

  @Index()
  @Column("varchar", { length: 64 })
  userId!: string;

  @Column("datetime")
  datetime!: Date;

  @Column("datetime")
  deleted_at!: Date;

  @CreateDateColumn()
  created_at!: Date;

  constructor(id: string, activity: string, datetime: Date, category?: string | null, userId?: string) {
    this.id = id;
    this.activity = activity;
    this.datetime = datetime;
    this.category = category || null;
    this.userId = userId || '';
    this.deleted_at = new Date();
  }
}
