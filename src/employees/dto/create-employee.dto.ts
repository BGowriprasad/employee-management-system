import { IsEmail, IsNotEmpty, IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEmployeeDto {
  @ApiProperty({
    example: 'Luffy',
    description: 'Name of the employee',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    example: 'lufyy@gmail.com',
    description: 'Email address of the employee',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: '70000',
    description: 'Employee salary',
  })
  @IsNumber()
  @Min(0)
  salary!: number;

  @ApiProperty({
    example: '1',
    description: 'ID of the department assigned to the employee',
  })
  @IsNumber()
  departmentId!: number;
}
