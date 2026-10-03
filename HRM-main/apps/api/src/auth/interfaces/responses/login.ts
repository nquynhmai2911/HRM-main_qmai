import { ApiProperty } from '@nestjs/swagger';

export class LoginResponse {
  @ApiProperty({
    description: 'User Data',
    type: Object,
  })
  user: any;

  @ApiProperty({
    description: 'Access Token',
    type: 'string',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Refresh Token',
    type: 'string',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Require password change',
    type: 'boolean',
  })
  mustChangePassword?: boolean;
}
