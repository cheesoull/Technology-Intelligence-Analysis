import { ApiProperty } from '@nestjs/swagger';

export class SanitizedUserDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  username!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  createTime!: Date;

  @ApiProperty()
  updateTime!: Date;
}