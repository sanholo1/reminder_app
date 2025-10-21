import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('user_sessions')
export class UserSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  sessionId!: string;

  @Column({ type: 'int', default: 0 })
  attempts!: number;

  @Column({ type: 'int', default: 3 })
  maxAttempts!: number;

  @Column({ type: 'boolean', default: false })
  isBlocked!: boolean;

  @Column({ type: 'datetime', nullable: true })
  blockedUntil!: Date | null;

  @Column({ type: 'datetime', nullable: true })
  lastAttempt!: Date | null;

  // New fields for daily usage limit
  @Column({ type: 'int', default: 0 })
  dailyUsageCount!: number;

  @Column({ type: 'date', nullable: true })
  lastUsageDate!: Date | null;

  @Column({ type: 'int', default: 20 })
  maxDailyUsage!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
