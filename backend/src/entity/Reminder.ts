import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Reminder {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    description: string;

    @Column()
    date: Date;

    @Column()
    userId: number; // <-- Nowe pole userId

    // ...inne istniejące pola i metody...
}