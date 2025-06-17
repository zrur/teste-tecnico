// src/entities/Task.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { User } from './User';

@Entity('TASKS')
export class Task {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 500 })
  title!: string;

  @Column({ type: 'number', default: 0, comment: '0 = false, 1 = true' })
  completed!: number;

  @Column({ type: 'timestamp with time zone', nullable: true })
  dueDate?: Date;

  @ManyToOne(() => User, user => user.tasks, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'OWNER_ID' })
  owner!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}