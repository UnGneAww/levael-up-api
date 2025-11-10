import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUserDto {
  @IsNotEmpty()
  name: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  age: number;

  @IsOptional()
  note?: string;

  @IsEmail()
  email: string;
}
