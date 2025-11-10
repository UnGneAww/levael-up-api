import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import * as fs from 'fs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(
    createUserDto: CreateUserDto,
    file: Express.Multer.File,
  ): Promise<User> {
    const currentYear = new Date().getFullYear();
    const yearOfBirth = currentYear - createUserDto.age;

    const avatarType = file.mimetype.split('/')[1];

    const newUser = this.usersRepository.create({
      ...createUserDto,
      year_of_birth: yearOfBirth,
      avatar_name: file.filename,
      avatar_type: avatarType,
    });

    return this.usersRepository.save(newUser);
  }

  async findAll(limit: number, page: number) {
    const skip = (page - 1) * limit;
    const [data, count] = await this.usersRepository.findAndCount({
      order: { created_at: 'DESC' },
      take: limit,
      skip: skip,
    });

    return { count, data };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    file?: Express.Multer.File,
  ): Promise<User> {
    const user = await this.findOne(id);

    if (updateUserDto.name) user.name = updateUserDto.name;
    if (updateUserDto.age) {
      user.age = updateUserDto.age;
      user.year_of_birth = new Date().getFullYear() - updateUserDto.age;
    }

    if (updateUserDto.note === 'clean') {
      user.note = null;
    } else if (updateUserDto.note !== undefined) {
      user.note = updateUserDto.note;
    }

    if (file) {
      try {
        fs.unlinkSync(`./uploads/${user.avatar_name}`);
      } catch (err) {}

      user.avatar_name = file.filename;
      user.avatar_type = file.mimetype.split('/')[1];
    }

    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    try {
      fs.unlinkSync(`./uploads/${user.avatar_name}`);
    } catch (err) {}

    await this.usersRepository.remove(user);
  }
}
