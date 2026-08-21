import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByUsername(dto.username);

    if (!user) {
      throw new UnauthorizedException('Username หรือ Password ไม่ถูกต้อง');
    }

    const passwordCorrect = await bcrypt.compare(
      dto.password,
      user.password,
    );

    if (!passwordCorrect) {
      throw new UnauthorizedException('Username หรือ Password ไม่ถูกต้อง');
    }

    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        phone: user.phone,
        role: user.role,
      },
    };
  }
}