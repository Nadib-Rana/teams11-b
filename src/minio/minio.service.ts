import {
  Injectable,
  Logger,
  OnModuleInit,
  InternalServerErrorException,
} from '@nestjs/common';
import * as Minio from 'minio';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MinioService implements OnModuleInit {
  private minioClient: Minio.Client;
  private readonly logger = new Logger(MinioService.name);
  private readonly bucketName: string;

  constructor(private configService: ConfigService) {
    this.minioClient = new Minio.Client({
      endPoint: this.configService.get<string>('MINIO_ENDPOINT', 'localhost'),
      port: parseInt(this.configService.get<string>('MINIO_PORT', '9000')),
      useSSL: this.configService.get<string>('MINIO_USE_SSL') === 'true',
      accessKey: this.configService.get<string>('MINIO_ACCESS_KEY', ''),
      secretKey: this.configService.get<string>('MINIO_SECRET_KEY', ''),
    });
    this.bucketName = this.configService.get<string>(
      'MINIO_BUCKET_NAME',
      'voice-posts',
    );
  }

  async onModuleInit() {
    try {
      // check or create bucket
      const exists = await this.minioClient.bucketExists(this.bucketName);
      if (!exists) {
        await this.minioClient.makeBucket(this.bucketName);
        this.logger.log(`Bucket "${this.bucketName}" created successfully.`);
      }

      // privecy setup
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Action: ['s3:GetObject'],
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Resource: [`arn:aws:s3:::${this.bucketName}/*`],
          },
        ],
      };

      await this.minioClient.setBucketPolicy(
        this.bucketName,
        JSON.stringify(policy),
      );
      this.logger.log(
        `Public access policy ensured for bucket: ${this.bucketName}`,
      );
    } catch (err: unknown) {
      const error = err as Error;
      this.logger.error(`MinIO Initialization Failed: ${error.message}`);
    }
  }

  async uploadVoice(file: Express.Multer.File): Promise<string> {
    try {
      // extation setup and condition
      const extension = file.mimetype.split('/')[1] || 'mp3';
      const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-voice.${extension}`;

      // Metadata- Content-Type
      await this.minioClient.putObject(
        this.bucketName,
        fileName,
        file.buffer,
        file.size,
        { 'Content-Type': file.mimetype },
      );

      const baseUrl = this.configService.get<string>(
        'MINIO_PUBLIC_URL',
        'http://localhost:9000',
      );

      return `${baseUrl}/${this.bucketName}/${fileName}`;
    } catch (err: unknown) {
      this.logger.error('File upload to MinIO failed', (err as Error).stack);
      throw new InternalServerErrorException('Failed to upload audio file');
    }
  }
}
