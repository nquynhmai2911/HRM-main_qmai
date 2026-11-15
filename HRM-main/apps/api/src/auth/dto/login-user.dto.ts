import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginUserDto {
  @ApiProperty({
    description: 'Email, Username or Employee Code',
    nullable: false,
    required: true,
    type: 'string',
    example: 'youremail@example.com',
  })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'User Password',
    nullable: false,
    required: true,
    type: 'string',
    example: 'Password123',
  })
  @IsString()
  password: string;
}
