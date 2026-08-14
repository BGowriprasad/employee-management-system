import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Department } from '../../departments/entities/department.entity';

@Entity()
export class Employee {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    length: 100,
  })
  name!: string;

  @Column({
    unique: true,
  })
  email!: string;

  @Column('decimal', {
    precision: 10,
    scale: 2,
  })
  salary!: number;

  @ManyToOne(() => Department, (department) => department.employees)
  department!: Department;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
