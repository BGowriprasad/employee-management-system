import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  UpdateDateColumn,
  CreateDateColumn,
} from 'typeorm';
import { Employee } from '../../employees/entities/employee.entity';

@Entity()
export class Department {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    length: 100,
    unique: true,
  })
  name!: string;

  @Column({
    length: 100,
  })
  location!: string;

  @OneToMany(() => Employee, (employee) => employee.department)
  employees!: Employee[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
