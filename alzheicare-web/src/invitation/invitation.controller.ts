import { Body, Controller, Get, Post, Patch, UseGuards, Query, Param, Req, ParseIntPipe, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InvitationService } from './invitation.service.js';
import { JwtAuthGuard } from '../auth/Guards/jwt.guard.js';
import { CreateInvitationDto } from './dto/create-invitation.dto.js';
import { RespondInvitationDto, RespondStatus } from './dto/respond-invitation.dto.js';
import { RespondViaTokenDto } from './dto/respond-via-token.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('invitations')
export class InvitationController {
  constructor(
    private readonly invitationService: InvitationService,
    private readonly prisma: PrismaService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  sendInvitation(@Req() req: any, @Body() dto: CreateInvitationDto) {
    if (req.user.role !== 'Patient') {
      throw new ForbiddenException('Only patients can send invitations');
    }
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
async respond(
  @Req() req: any,
  @Param('id', ParseIntPipe) id: number,
  @Body() dto: RespondInvitationDto,
) {
  if (req.user.role !== 'Doctor') {
    throw new ForbiddenException(
      'Only doctors can respond to invitations',
    );
  }

  return this.invitationService.respondToInvitationByUserId(
    req.user.sub,
    id,
    dto,
  );
}

  @UseGuards(JwtAuthGuard)
  @Post('respond-via-token')
  respondViaToken(@Req() req: any, @Body() dto: RespondViaTokenDto) {
    if (req.user.role !== 'Doctor') {
      throw new ForbiddenException('Only doctors can respond via token');
    }
    return this.invitationService.respondViaToken(dto.token, req.user.sub, dto.action);
  }

  // Public endpoint to respond to an invitation via token for simple actions
  // (e.g., decline from email link). This intentionally does NOT require auth
  // because onboarding recipients may not have an account yet.
  @Get('respond-via-token/public')
  async respondViaTokenPublic(@Query('token') token: string, @Query('action') action: RespondStatus) {
    return this.invitationService.respondViaTokenPublic(token, action);
  }
}
