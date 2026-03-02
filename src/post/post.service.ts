import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { MinioService } from '../minio/minio.service';
import { MissionService } from '../mission/mission.service';
import { CreatePostDto } from './dto/create-post.dto';
import { ContentType } from '../generated/prisma/client';

@Injectable()
export class PostService {
  private readonly logger = new Logger(PostService.name);

  constructor(
    private prisma: PrismaService,
    private minioService: MinioService,
    @Inject(forwardRef(() => MissionService))
    private missionService: MissionService,
  ) {}

  // Cron Job run par 1min
  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpiredPosts() {
    const now = new Date();
    console.log('Run cron Job:', new Date().toLocaleString());
    try {
      const result = await this.prisma.post.updateMany({
        where: {
          expiresAt: { lt: now }, // currect > expired time
          isDeleted: false, // currect < expired time
        },
        data: {
          isDeleted: true, // update status
        },
      });

      if (result.count > 0) {
        this.logger.log(`Auto-expired ${result.count} posts.`);
      }
    } catch (error) {
      this.logger.error('Error while updating expired posts', error);
    }
  }

  // ======Create Post========
  async create(userId: string, dto: CreatePostDto, file?: Express.Multer.File) {
    // ১. ইউজার এবং সাবস্ক্রিপশন ডাটা ফেচ করা
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user) throw new NotFoundException('User not found');

    // 2. If user buy subsciption allow for unlimited post other ways post limit will be 3
    if (!user.subscription) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0); // day staet from night 12pm

      const postCountToday = await this.prisma.post.count({
        where: {
          userId: user.id,
          createdAt: { gte: startOfDay }, // today posts
          isDeleted: false,
        },
      });

      if (postCountToday >= 3) {
        throw new ForbiddenException(
          'Normal users can only create a maximum of 3 posts per day. Please subscribe for unlimited access.',
        );
      }
    }

    // 3. Boolean convertion
    const rawHiddenVal: unknown = dto.isResponseDefaultHidden;
    const requestHiddenPref =
      String(rawHiddenVal).toLowerCase() === 'true' || rawHiddenVal === true;

    // 4. primiun access check (isResponseDefaultHidden)
    const canHide = !!user.subscription;
    const finalHideStatus = canHide ? requestHiddenPref : false;

    // 5.contentType and file handaling
    let finalVoiceUrl: string | undefined = dto.voiceUrl;
    let detectedContentType: ContentType = dto.contentType;

    if (file) {
      finalVoiceUrl = await this.minioService.uploadVoice(file);
      detectedContentType = ContentType.VOICE;
    }

    // ৬. Expiryhours condition check
    const expiryHours = user.subscription?.postExpiryHours ?? 24;
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + expiryHours);

    // ৭. Data save into the database
    const createdPost = await this.prisma.post.create({
      data: {
        userId: user.id,
        categoryId: dto.categoryId,
        contentType: detectedContentType,
        textContent: dto.textContent ?? null,
        voiceUrl: finalVoiceUrl ?? null,
        isResponseDefaultHidden: finalHideStatus,
        PostType: dto.postType,
        expiresAt: expirationDate,
      },
    });

    // 🎯 Workflow 2: Activity (Content Creation) - Track for mission (3 posts = +30 XP)
    try {
      await this.missionService.trackProgress(userId, 'create_3_posts');
    } catch (error) {
      console.error('Error tracking post creation mission:', error);
    }

    return createdPost;
  }

  async getPublicFeed() {
    console.log('Hit for get all post');
    return this.prisma.post.findMany({
      where: { expiresAt: { gt: new Date() }, isDeleted: false },
      include: {
        category: true,
        _count: { select: { favorites: true, responses: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByCategory(categoryId: string) {
    return this.prisma.post.findMany({
      where: {
        categoryId,
        isDeleted: false,
        expiresAt: { gt: new Date() },
      },
      include: {
        category: true,
        _count: { select: { favorites: true, responses: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMyHistory(userId: string) {
    return this.prisma.post.findMany({
      where: { userId },
      include: { category: true, _count: { select: { responses: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, currentUserId?: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        category: true,
        user: {
          select: {
            id: true,
            anonymousId: true,
          },
        },
        responses: {
          where: {
            OR: [
              { isHidden: false },
              { post: { userId: currentUserId } },
              { userId: currentUserId },
            ],
          },
          include: {
            user: { select: { id: true, anonymousId: true } },
          },
        },
        _count: {
          select: { favorites: true, responses: true },
        },
      },
    });

    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async remove(id: string, userId: string) {
    const post = await this.prisma.post.findFirst({ where: { id, userId } });
    if (!post) throw new ForbiddenException('You cannot delete this post');

    return this.prisma.post.update({
      where: { id },
      data: { isDeleted: true },
    });
  }
}
