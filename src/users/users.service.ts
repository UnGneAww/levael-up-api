import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import * as fs from 'fs'; // สำหรับลบไฟล์รูปเก่า

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
    // คำนวณปีเกิด
    const yearOfBirth = currentYear - createUserDto.age;

    // ดึงชนิดไฟล์จาก mimetype หรือนามสกุล
    const avatarType = file.mimetype.split('/')[1]; // เช่น image/jpeg -> jpeg

    const newUser = this.usersRepository.create({
      ...createUserDto,
      year_of_birth: yearOfBirth,
      avatar_name: file.filename,
      avatar_type: avatarType,
      // ถ้า note เป็น string ว่าง ให้เป็น null (ตามความเหมาะสมของ DB) หรือปล่อยไว้ตามโจทย์
    });

    return this.usersRepository.save(newUser);
  }

  async findAll(limit: number, page: number) {
    const skip = (page - 1) * limit;
    const [data, count] = await this.usersRepository.findAndCount({
      order: { created_at: 'DESC' }, // เรียงจากใหม่ไปเก่า
      take: limit,
      skip: skip,
    });

    return { count, data };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException('User not found'); // ส่ง error ไปให้ Controller จัดการต่อ
    }
    return user;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    file?: Express.Multer.File,
  ): Promise<User> {
    const user = await this.findOne(id); // เช็คก่อนว่ามี user ไหม

    // อัปเดตข้อมูลทั่วไป
    if (updateUserDto.name) user.name = updateUserDto.name;
    if (updateUserDto.age) {
      user.age = updateUserDto.age;
      user.year_of_birth = new Date().getFullYear() - updateUserDto.age;
    }

    // จัดการเงื่อนไขพิเศษของ note
    if (updateUserDto.note === 'clean') {
      user.note = null;
    } else if (updateUserDto.note !== undefined) {
      // ถ้าส่งมาแต่ไม่ใช่ clean ก็อัปเดตตามปกติ
      user.note = updateUserDto.note;
    }

    // จัดการรูปภาพ (ถ้ามีการอัปโหลดใหม่)
    if (file) {
      // ลบไฟล์เก่าทิ้งก่อนเพื่อประหยัดพื้นที่ (Optional แต่นิยมทำกัน)
      try {
        fs.unlinkSync(`./uploads/${user.avatar_name}`);
      } catch (err) {
        // ไฟล์อาจจะไม่มีอยู่จริง หรือลบไม่ได้ ช่างมัน
      }

      user.avatar_name = file.filename;
      user.avatar_type = file.mimetype.split('/')[1];
    }

    return this.usersRepository.save(user); // save จะทำการ update ถ้ามี id อยู่แล้ว
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    // ลบไฟล์รูปด้วย
    try {
      fs.unlinkSync(`./uploads/${user.avatar_name}`);
    } catch (err) {}

    await this.usersRepository.remove(user);
  }
}
