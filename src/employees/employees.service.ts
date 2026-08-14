import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from 'src/departments/entities/department.entity';
import { Employee } from './entities/employee.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,

    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
  ) {}

  async findAll(minSalary?: string, maxSalary?: string, department?: string) {
    const query = this.employeeRepository
      .createQueryBuilder('employee')
      .leftJoinAndSelect('employee.department', 'department');

    if (minSalary) {
      query.andWhere('employee.salary >= :minSalary', {
        minSalary: Number(minSalary),
      });
    }

    if (maxSalary) {
      query.andWhere('employee.salary <= :maxSalary', {
        maxSalary: Number(maxSalary),
      });
    }

    if (department) {
      query.andWhere('department.name = :department', {
        department,
      });
    }

    return query.getMany();
  }

  async findOne(id: number) {
    const employee = await this.employeeRepository.findOne({ where: { id } });
    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }
    return employee;
  }

  async create(createEmployeeDto: CreateEmployeeDto) {
    const { departmentId, ...employeeData } = createEmployeeDto;

    const department = await this.departmentRepository.findOneBy({
      id: departmentId,
    });

    if (!department) {
      throw new NotFoundException(
        `Department with ID ${departmentId} not found`,
      );
    }

    const employee = this.employeeRepository.create({
      ...employeeData,
      department,
    });

    return await this.employeeRepository.save(employee);
  }

  async update(id: number, updateEmployeeDto: UpdateEmployeeDto) {
    const { departmentId, ...employeeData } = updateEmployeeDto;

    const employee = await this.employeeRepository.preload({
      id,
      ...employeeData,
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    if (departmentId !== undefined) {
      const department = await this.departmentRepository.findOneBy({
        id: departmentId,
      });

      if (!department) {
        throw new NotFoundException(
          `Department with ID ${departmentId} not found`,
        );
      }

      employee.department = department;
    }

    return this.employeeRepository.save(employee);
  }

  async remove(id: number) {
    const result = await this.employeeRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    return {
      message: `Employee with ID ${id} removed successfully`,
    };
  }
}
