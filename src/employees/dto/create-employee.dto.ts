import { IsEmail, IsNotEmpty, IsString, IsNumber, Min } from 'class-validator';
export class CreateEmployeeDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsNumber()
  @Min(0)
  salary!: number;

  @IsNumber()
  departmentId!: number;
}
