import { Body, Controller, Get, Post, Patch, UseGuards, Query, Param, Req, ParseIntPipe } from '@nestjs/common';
import { InvitationService } from './invitation.service.js';
import { JwtAuthGuard } from '../auth/Guards/jwt.guard.js';
import { CreateInvitationDto } from './dto/create-invitation.dto.js';
import { RespondInvitationDto, RespondStatus } from './dto/respond-invitation.dto.js';

@Controller('invitations')
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  sendInvitation(@Req() req: any, @Body() dto: CreateInvitationDto) {
    if (req.user.role !== 'Patient') throw new Error('Forbidden');
    return this.invitationService.sendInvitation(req.user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('search-doctors')
  searchDoctors(@Query('q') q: string) {
    return this.invitationService.searchDoctors(q || '');
  }

  @UseGuards(JwtAuthGuard)
  @Get('mine')
  getMine(@Req() req: any) {
    return this.invitationService.getMyInvitations(req.user.sub, req.user.role);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/respond')
  respond(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() dto: RespondInvitationDto) {
    if (req.user.role !== 'Doctor') throw new Error('Forbidden');
    return this.invitationService.respondToInvitation(req.user.sub, id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('respond-via-token')
  respondViaToken(@Req() req: any, @Body('token') token: string, @Body('action') action: RespondStatus) {
    if (req.user.role !== 'Doctor') throw new Error('Forbidden');
    return this.invitationService.respondViaToken(token, req.user.sub, action);
  }
}
