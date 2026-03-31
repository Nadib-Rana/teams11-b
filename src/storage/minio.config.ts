import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as Minio from "minio";

@Injectable()
export class MinioConfigService {
  private minioClient: Minio.Client;

  constructor(private configService: ConfigService) {
    const useSSLStr = this.configService.get<string>("MINIO_USE_SSL", "false");
    const useSSL = useSSLStr.toLowerCase() === "true";

    this.minioClient = new Minio.Client({
      endPoint: this.configService.get<string>("MINIO_ENDPOINT", "localhost"),
      port: this.configService.get<number>("MINIO_PORT", 9000),
      useSSL: useSSL,
      accessKey: this.configService.get<string>(
        "MINIO_ACCESS_KEY",
        "minioadmin",
      ),
      secretKey: this.configService.get<string>(
        "MINIO_SECRET_KEY",
        "minioadmin",
      ),
    });
  }

  getClient(): Minio.Client {
    return this.minioClient;
  }

  getBucketName(bucketType: string): string {
    const baseBucket = this.configService.get<string>(
      "MINIO_BUCKET_NAME",
      "devscout",
    );
    return `${baseBucket}-${bucketType}`.toLowerCase();
  }

  getMinioUrl(): string {
    const protocol = this.configService.get<boolean>("MINIO_USE_SSL", false)
      ? "https"
      : "http";
    const endpoint = this.configService.get<string>(
      "MINIO_ENDPOINT",
      "localhost",
    );
    const port = this.configService.get<number>("MINIO_PORT", 9000);
    return `${protocol}://${endpoint}:${port}`;
  }
}
