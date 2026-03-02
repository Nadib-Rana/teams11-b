import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { MissionService } from './mission.service';
import { CreateMissionDto } from './dto/create-mission.dto';

@Controller('mission')
export class MissionController {
  constructor(private readonly missionService: MissionService) {}

  @Post()
  async create(@Body() createMissionDto: CreateMissionDto) {
    return this.missionService.create(createMissionDto);
  }

  @Get('my-status/:userId')
  async getMyStatus(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.missionService.getMyMissions(userId);
  }
}
