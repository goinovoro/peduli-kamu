import { Injectable } from '@nestjs/common';
import { IsIn, IsInt, IsNotEmpty, Min } from 'class-validator';
import { PrismaService } from '../../prisma.service';

export class CreatePatientDto {
  @IsNotEmpty() name!: string;
  @IsInt() @Min(0) age!: number;
  @IsIn(['companion', 'skilled']) tier!: 'companion' | 'skilled';
}

@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) {}
  byOwner(ownerId: string) {
    return this.prisma.patient.findMany({ where: { ownerId }, orderBy: { createdAt: 'desc' } });
  }
  create(ownerId: string, dto: CreatePatientDto) {
    return this.prisma.patient.create({ data: { ...dto, ownerId } });
  }
}
