import {ConflictException,Injectable,} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findUserByEmail(email: string): Promise<User | null> {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();

    return user;
  }

  async create(dto: CreateUserDto): Promise<Omit<User, 'password'>> {
    const user = await this.usersRepository.findOneBy({ email: dto.email,});

    if (user) 
      throw new ConflictException('Email is already registered');
    
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const newUser = this.usersRepository.create({...dto, password: hashedPassword,});
    const savedUser = await this.usersRepository.save(newUser);
    const { password, ...userWithoutPassword } = savedUser;

    return userWithoutPassword;
  }
}