import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  UseGuards,
  Query,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { InvitationService } from './invitation.service.js';
import { JwtAuthGuard } from '../auth/Guards/jwt.guard.js';
import { CreateInvitationDto } from './dto/create-invitation.dto.js';
import {
  RespondInvitationDto,
  RespondStatus,
} from './dto/respond-invitation.dto.js';
import { CurrentUser } from '../Decorators/currentUser.decorator.js';
import { RolesGuard } from '../auth/Guards/roles.guard.js';
import { Roles } from '../Decorators/roles.decorator.js';
import { UserRole } from '../../generated/prisma/client.js';
import { RespondViaTokenDto } from './dto/respond-via-token.dto.js';

@Controller('invitations')
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Patient)
  @Post()
  sendInvitation(@CurrentUser() user: any, @Body() dto: CreateInvitationDto) {
    return this.invitationService.sendInvitation(user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('search-doctors')
  searchDoctors(@Query('q') q: string) {
    return this.invitationService.searchDoctors(q || '');
  }

  @UseGuards(JwtAuthGuard)
  @Get('mine')
  getMine(@CurrentUser() user: any) {
    return this.invitationService.getMyInvitations(user.sub, user.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Doctor)
  @Patch(':id/respond')
  respond(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RespondInvitationDto,
  ) {
    return this.invitationService.respondToInvitation(user.sub, id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Doctor)
  @Post('respond-via-token')
  respondViaToken(@CurrentUser() user: any, @Body() dto: RespondViaTokenDto) {
    return this.invitationService.respondViaToken(
      dto.token,
      user.sub,
      dto.action,
    );
  }

  @Get('respond-via-token/public')
  async respondViaTokenPublic(
    @Query('token') token: string,
    @Query('action') action: RespondStatus,
  ) {
    return this.invitationService.respondViaTokenPublic(token, action);
  }
}
