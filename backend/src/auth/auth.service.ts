import {Injectable,UnauthorizedException,} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findUserByEmail(loginDto.email);

    if (!user) 
      throw new UnauthorizedException('Email or password is incorrect');

    const passwordIsCorrect = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!passwordIsCorrect) 
      throw new UnauthorizedException('Email or password is incorrect');

    const payload = {sub: user.id, email: user.email, role: user.role,};
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {id: user.id, name: user.name, email: user.email, role: user.role,},
    };
  }
}
