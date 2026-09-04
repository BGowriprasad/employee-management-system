import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from 'src/departments/entities/department.entity';
import { Employee } from './entities/employee.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

import { EmployeeQueryDto } from './dto/employee-query.dto';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,

    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
  ) {}

  async findAll(queryDto: EmployeeQueryDto) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'id',
      order = 'ASC',
      minSalary,
      maxSalary,
      department,
    } = queryDto;

    const query = this.employeeRepository
      .createQueryBuilder('employee')
      .leftJoinAndSelect('employee.department', 'department');

    if (minSalary !== undefined) {
      query.andWhere('employee.salary >= :minSalary', {
        minSalary: Number(minSalary),
      });
    }

    if (maxSalary !== undefined) {
      query.andWhere('employee.salary <= :maxSalary', {
        maxSalary: Number(maxSalary),
      });
    }

    if (department) {
      query.andWhere('department.name = :department', {
        department,
      });
    }

    query.orderBy(`employee.${sortBy}`, order);

    const skip = (page - 1) * limit;

    query.skip(skip).take(limit);

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const employee = await this.employeeRepository.findOne({
      where: { id },
      relations: {
        department: true,
      },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }
    return employee;
  }

  async create(createEmployeeDto: CreateEmployeeDto) {
    const { departmentId, ...employeeData } = createEmployeeDto;

    const existingEmployee = await this.employeeRepository.findOne({
      where: { email: employeeData.email },
    });

    if (existingEmployee) {
      throw new ConflictException(
        `Employee with email '${employeeData.email}' already exists`,
      );
    }

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

    const employee = await this.employeeRepository.findOne({
      where: { id },
      relations: {
        department: true,
      },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    if (employeeData.email) {
      const existingEmployee = await this.employeeRepository.findOne({
        where: { email: employeeData.email },
      });

      if (existingEmployee && existingEmployee.id !== id) {
        throw new ConflictException(
          `Employee with email '${employeeData.email}' already exists`,
        );
      }
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

    Object.assign(employee, employeeData);

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
