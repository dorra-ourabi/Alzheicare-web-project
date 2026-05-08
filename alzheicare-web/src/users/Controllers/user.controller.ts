import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CreateUserDto } from '../DTOs/createUserDto.js';
import { LoginCredentialsDto } from '../DTOs/LoginCredentialsDto.js';
import { UserService } from '../Services/user.service.js';
import { JwtAuthGuard } from '../../auth/Guards/jwt.guard.js';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  getUsers() {
    return this.userService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  @Post('add')
  SubscribeUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Put('modif/:id')
  modifUser(
    @Body() createUserDto: CreateUserDto,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.userService.update(id, createUserDto);
  }

  @Delete('delete/:id')
  deleteUser(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.userService.remove(id);
  }
}