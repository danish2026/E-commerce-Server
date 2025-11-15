import { ApiProperty } from '@nestjs/swagger';
import { PageMetaDto } from './page-meta.dto';

export class CommonDataResponseDto {
  @ApiProperty()
  readonly statusCode: Number;

  @ApiProperty()
  readonly status: boolean;

  @ApiProperty()
  readonly message: string;

  @ApiProperty()
  readonly data: any;

  @ApiProperty({ type: () => PageMetaDto, required: false })
  readonly meta: PageMetaDto | null;

  constructor(data: any, status: boolean, message: string, meta: PageMetaDto | null = null) {
    this.statusCode = status ? 200 : 400;
    this.status = status;
    this.message = message;
    this.data = status ? data : null;
    this.meta = meta;
  }
}


