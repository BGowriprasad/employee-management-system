import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Department } from './entities/department.entity';
import { Repository } from 'typeorm';
import { Employee } from 'src/employees/entities/employee.entity';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,

    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {}

  async create(createDepartmentDto: CreateDepartmentDto) {
    const existingDepartment = await this.departmentRepository.findOne({
      where: {
        name: createDepartmentDto.name,
      },
    });

    if (existingDepartment) {
      throw new ConflictException(
        `Department with name '${createDepartmentDto.name}' already exists`,
      );
    }

    const department = this.departmentRepository.create(createDepartmentDto);

    return await this.departmentRepository.save(department);
  }

  async findAll() {
    return await this.departmentRepository.find();
  }

  async findOne(id: number) {
    const department = await this.departmentRepository.findOne({
      where: { id },
    });

    if (!department) {
      throw new NotFoundException(`Department with ${id} not found`);
    }
    return department;
  }

  async update(id: number, updateDepartmentDto: UpdateDepartmentDto) {
    const department = await this.departmentRepository.findOne({
      where: { id },
    });

    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    if (updateDepartmentDto.name) {
      const existingDepartment = await this.departmentRepository.findOne({
        where: {
          name: updateDepartmentDto.name,
        },
      });

      if (existingDepartment && existingDepartment.id !== id) {
        throw new ConflictException(
          `Department with name '${updateDepartmentDto.name}' already exists`,
        );
      }
    }

    const updatedDepartment = this.departmentRepository.merge(
      department,
      updateDepartmentDto,
    );

    return this.departmentRepository.save(updatedDepartment);
  }

  async remove(id: number) {
    const department = await this.departmentRepository.findOne({
      where: { id },
    });

    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }
    const employeeCount = await this.employeeRepository.count({
      where: {
        department: {
          id,
        },
      },
    });
    if (employeeCount > 0) {
      throw new BadRequestException(
        `Cannot delete department because employees are assigned to it`,
      );
    }
    await this.departmentRepository.delete(id);

    return {
      message: `Department with ID ${id} removed successfully`,
    };
  }
}
