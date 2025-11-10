import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Query,
  Put,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import type { Response as ExpressResponse } from 'express';

@Controller('')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // --- POST /user ---
  @Post('user')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
          return cb(new Error('Only jpg/png files are allowed!'), false);
        }
        cb(null, true);
      },
    }),
  )
  async create(
    @Body() createUserDto: CreateUserDto,
    @UploadedFile() file: Express.Multer.File,
    @Res() res: ExpressResponse,
  ) {
    if (!file) {
      throw new BadRequestException('Avatar file is required!');
    }
    try {
      const user = await this.usersService.create(createUserDto, file);
      return res.status(HttpStatus.CREATED).json(user);
    } catch (error) {
      if (error.message.includes('INVALID_AVATAR_TYPE')) {
        return res
          .status(HttpStatus.UNAUTHORIZED)
          .json({ message: error.message });
      }

      if (error.message.includes('AGE_OUT_OF_RANGE')) {
        return res
          .status(HttpStatus.UNAUTHORIZED)
          .json({ message: error.message });
      }

      if (error.message.includes('EMAIL_INVALID')) {
        return res
          .status(HttpStatus.UNAUTHORIZED)
          .json({ message: error.message });
      }

      if (error.message.includes('EMAIL_EXISTS')) {
        return res
          .status(HttpStatus.UNAUTHORIZED)
          .json({ message: error.message });
      }

      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  // --- GET /users ---
  @Get('users')
  async findAll(
    @Query('limit') limit: number = 10,
    @Query('page') page: number = 1,
  ) {
    return this.usersService.findAll(+limit, +page);
  }

  @Get('user/:id')
  async findOne(@Param('id') id: string, @Res() res: ExpressResponse) {
    try {
      const user = await this.usersService.findOne(id);
      return res.status(HttpStatus.OK).json(user);
    } catch (error) {
      if (error.message === 'User not found') {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json({ message: error.message });
      }
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  // --- PUT /user/:id ---
  @Put('user/:id')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
          return cb(
            new BadRequestException('Only jpg/png files are allowed!'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() file: Express.Multer.File,
    @Res() res: ExpressResponse,
  ) {
    try {
      const updatedUser = await this.usersService.update(
        id,
        updateUserDto,
        file,
      );
      return res.status(HttpStatus.OK).json(updatedUser);
    } catch (error) {
      if (error.message === 'User not found') {
        return res
          .status(HttpStatus.UNAUTHORIZED)
          .json({ message: error.message });
      }

      if (error.message.includes('INVALID_AVATAR_TYPE')) {
        return res
          .status(HttpStatus.UNAUTHORIZED)
          .json({ message: error.message });
      }

      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }

  // --- DELETE /user/:id ---
  @Delete('user/:id')
  async remove(@Param('id') id: string, @Res() res: ExpressResponse) {
    // <--- ใช้ ExpressResponse
    try {
      await this.usersService.remove(id);
      return res.status(HttpStatus.OK).json({ success: true });
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  }
}
