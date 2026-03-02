import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateResponseDto } from './dto/create-response.dto';
import { NotificationService } from '../notification/notification.service';
import { MissionService } from '../mission/mission.service';
import { Response } from '../generated/prisma/client';

@Injectable()
export class ResponseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    @Inject(forwardRef(() => MissionService))
    private readonly missionService: MissionService,
  ) {}

  async create(userId: string, dto: CreateResponseDto): Promise<Response> {
    // 1. Fetch Post to check privacy settings and owner
    const post = await this.prisma.post.findUnique({
      where: { id: dto.postId },
    });

    if (!post) throw new NotFoundException('Post not found');

    // 2. Determine visibility based on Post settings
    const finalIsHidden: boolean = post.isResponseDefaultHidden === true;

    // 3. Create the Response
    const response = await this.prisma.response.create({
      data: {
        postId: dto.postId,
        userId: userId,
        contentType: dto.contentType,
        textContent: dto.textContent,
        voiceUrl: dto.voiceUrl,
        parentResponseId: dto.parentResponseId,
        isHidden: finalIsHidden,
      },
    });

    // 4. Handle Notifications
    if (dto.parentResponseId) {
      // Logic for REPLY_TO_MY_RESPONSE
      const parent = await this.prisma.response.findUnique({
        where: { id: dto.parentResponseId },
      });
      if (parent) {
        await this.notificationService.create({
          userId: parent.userId,
          triggerUserId: userId,
          type: 'REPLY_TO_MY_RESPONSE',
          postId: dto.postId,
          responseId: response.id,
          parentResponseId: parent.id,
        });
      }
    } else {
      // Logic for RESPONSE_TO_POST
      await this.notificationService.create({
        userId: post.userId,
        triggerUserId: userId,
        type: 'RESPONSE_TO_POST',
        postId: post.id,
        responseId: response.id,
      });
    }

    //  Workflow 3: Activity (Community Support) - Track for mission (3 responses = +15 XP)
    try {
      await this.missionService.trackProgress(userId, 'add_3_responses');
    } catch (error) {
      console.error('Error tracking response mission:', error);
    }

    return response;
  }

  async findAllByPost(postId: string): Promise<Response[]> {
    return this.prisma.response.findMany({
      where: { postId, isHidden: false },
      include: {
        user: { select: { anonymousId: true } },
        replies: {
          include: { user: { select: { anonymousId: true } } },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async remove(id: string, userId: string): Promise<Response> {
    const response = await this.prisma.response.findFirst({
      where: { id, userId },
    });

    if (!response)
      throw new ForbiddenException('Not allowed to delete this response');

    return this.prisma.response.delete({ where: { id } });
  }
}
