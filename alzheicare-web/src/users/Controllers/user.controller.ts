import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CreateUserDto } from '../DTOs/createUserDto.js';
import { CreatePatientDto } from '../DTOs/createPatientDto.js';
import { CreateDoctorDto } from '../DTOs/createDoctorDto.js';
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
  @Get('doctors')
  getDoctors() {
    return this.userService.findDoctors();
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() req: any) {
    return this.userService.findMe(req.user.sub);
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

  @Post('patients')
  createPatient(@Body() createPatientDto: CreatePatientDto) {
    return this.userService.createPatient(createPatientDto);
  }

  @Post('doctors')
  createDoctor(@Body() createDoctorDto: CreateDoctorDto) {
    return this.userService.createDoctor(createDoctorDto);
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