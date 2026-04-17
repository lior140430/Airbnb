import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  name: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class SignUpDto extends CreateUserDto {}

export class UpdateProfileDto {
  @IsString()
  name?: string;

  @IsString()
  bio?: string;

  avatar?: Express.Multer.File;
}
