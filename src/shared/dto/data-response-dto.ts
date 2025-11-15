import { ApiProperty } from "@nestjs/swagger";

export class MetaDto {
  @ApiProperty()
  readonly totalItems: number;

  @ApiProperty()
  readonly itemCount: number;

  @ApiProperty()
  readonly itemsPerPage: number;

  @ApiProperty()
  readonly totalPages: number;

  @ApiProperty()
  readonly currentPage: number;

  constructor(
    totalItems: number,
    itemCount: number,
    itemsPerPage: number,
    currentPage: number
  ) {
    this.totalItems = totalItems;
    this.itemCount = itemCount;
    this.itemsPerPage = itemsPerPage;
    this.totalPages = Math.ceil(totalItems / itemsPerPage);
    this.currentPage = currentPage;
  }
}

export class PaginatedDataResponseDto {
  @ApiProperty()
  readonly statusCode: number;

  @ApiProperty()
  readonly status: boolean;

  @ApiProperty()
  readonly message: string;

  @ApiProperty()
  readonly data: any[];

  @ApiProperty({ type: MetaDto })
  readonly meta: MetaDto;

  @ApiProperty({ required: false })
  readonly token?: string;

  @ApiProperty({ required: false })
  readonly refreshToken?: string;

  @ApiProperty({ required: false })
  readonly bookingStatus?: any;

  constructor(
    data: any[],
    status: boolean,
    message: string,
    totalItems: number,
    itemCount: number,
    itemsPerPage: number,
    currentPage: number,
    token?: string,
    refreshToken?: string,
    bookingStatus?: any
  ) {
    this.statusCode = status ? 200 : 400;
    this.status = status;
    this.message = message;
    this.data = status ? data : null;
    this.meta = new MetaDto(totalItems, itemCount, itemsPerPage, currentPage);
    this.token = token;
    this.refreshToken = refreshToken;
    this.bookingStatus = bookingStatus;
  }
}

export class DataResponseDto {
  @ApiProperty()
  readonly statusCode: number;

  @ApiProperty()
  readonly status: boolean;

  @ApiProperty()
  readonly message: string;

  @ApiProperty()
  readonly data: any;

  @ApiProperty({ required: false })
  readonly token?: string;

  @ApiProperty({ required: false })
  readonly refreshToken?: string;

  constructor(
    data: any,
    status: boolean,
    message: string,
    token?: string,
    refreshToken?: string
  ) {
    this.statusCode = status ? 200 : 400;
    this.status = status;
    this.message = message;
    this.data = status ? data : null;
    this.token = token;
    this.refreshToken = refreshToken;
  }
}

