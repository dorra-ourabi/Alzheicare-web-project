import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface MriPrediction {
  predicted_stage: string;
  confidence: number;
  probabilities: Record<string, number>;
  clinical_note: string;
  disclaimer: string;
  gradcam_heatmap_base64: string | null;
}

interface UploadedFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}

@Injectable()
export class MlClassifierService {
  constructor(private readonly configService: ConfigService) {}

  private baseUrl(): string {
    return (
      this.configService.get<string>('MRI_SERVICE_URL') ||
      'http://localhost:8001'
    );
  }

  async getHealth() {
    const url = `${this.baseUrl()}/health`;
    let response: Response;
    try {
      response = await fetch(url);
    } catch {
      throw new ServiceUnavailableException(
        'MRI classifier service is unavailable',
      );
    }
    if (!response.ok) {
      throw new BadGatewayException(
        `MRI classifier returned ${response.status}`,
      );
    }
    return response.json();
  }

  async predictMri(file: UploadedFile): Promise<MriPrediction> {
    const url = `${this.baseUrl()}/predict/mri`;

    const formData = new FormData();
    formData.append(
      'file',
      new Blob([new Uint8Array(file.buffer)], { type: file.mimetype }),
      file.originalname || 'mri.jpg',
    );

    let response: Response;
    try {
      response = await fetch(url, { method: 'POST', body: formData });
    } catch {
      throw new ServiceUnavailableException(
        'MRI classifier service is unavailable',
      );
    }

    if (!response.ok) {
      let detail: unknown = `MRI classifier returned ${response.status}`;
      try {
        detail = await response.json();
      } catch {
        detail = await response.text();
      }
      throw new BadGatewayException(detail);
    }

    return response.json() as Promise<MriPrediction>;
  }
}
