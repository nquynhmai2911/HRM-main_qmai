import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { HttpStatus } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: any;

  const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
  };

  beforeEach(async () => {
    authService = {
      loginUser: jest.fn(),
      refreshWithToken: jest.fn(),
      refreshToken: jest.fn(),
      logout: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should login a user', async () => {
      const loginDto = {
        email: 'admin@dts.com.vn',
        password: 'Password@123',
      };
      const expectedResult = {
        user: { id: '1', email: loginDto.email, role: 'ADMIN' },
        accessToken: 'mock-token',
      };

      const res = mockResponse();
      authService.loginUser.mockResolvedValue(expectedResult);

      await controller.login(res, loginDto);

      expect(authService.loginUser).toHaveBeenCalledWith(loginDto);
      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.send).toHaveBeenCalledWith(expectedResult);
    });
  });

  describe('refreshToken', () => {
    it('should refresh token', async () => {
      const token = 'valid-refresh-token';
      const expected = { accessToken: 'new-acc', refreshToken: 'new-ref' };
      authService.refreshWithToken.mockResolvedValue(expected);

      const res = await controller.refreshToken(token);
      expect(res).toEqual(expected);
      expect(authService.refreshWithToken).toHaveBeenCalledWith(token);
    });
  });

  describe('getMe', () => {
    it('should return user from req', async () => {
      const mockUser = { id: '1', email: 'test@dts.com.vn' };
      const res = await controller.getMe(mockUser);
      expect(res).toEqual(mockUser);
    });
  });

  describe('logout', () => {
    it('should call authService.logout', async () => {
      authService.logout.mockResolvedValue({ success: true });
      const res = await controller.logout({ id: '1' });
      expect(res).toEqual({ success: true });
      expect(authService.logout).toHaveBeenCalledWith('1');
    });
  });
});
