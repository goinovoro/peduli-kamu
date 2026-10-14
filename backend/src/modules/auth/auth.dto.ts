import { IsBoolean, IsEmail, IsIn, IsNotEmpty, IsOptional, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Role lama (family/caregiver) dipertahankan untuk kompatibilitas frontend lama.
// Frontend baru memakai PASIEN/MITRA (lihat docs/ERD.md).
export const REGISTER_ROLES = ['family', 'caregiver', 'PASIEN', 'MITRA'] as const;

export class RegisterDto {
  @ApiProperty({ example: 'Budi Santoso' }) @IsNotEmpty() name!: string;
  @ApiProperty({ example: 'budi@contoh.id' }) @IsEmail() email!: string;
  @ApiProperty({ minLength: 8 }) @MinLength(8) password!: string;
  @ApiProperty({ enum: REGISTER_ROLES as unknown as string[], example: 'PASIEN' })
  @IsIn(REGISTER_ROLES as unknown as string[]) role!: (typeof REGISTER_ROLES)[number];
  @ApiPropertyOptional({ example: '081200000001' }) @IsOptional() phone?: string;
  // Persetujuan ketentuan platform (B-05/O-01). Wajib true saat registrasi.
  @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() agreeToTerms?: boolean;
}

export class LoginDto {
  @ApiProperty({ example: 'budi@contoh.id' }) @IsEmail() email!: string;
  @ApiProperty() @IsNotEmpty() password!: string;
}

export class RegisterCaregiverDto extends RegisterDto {
  @ApiProperty({ example: 'Poltekkes Kemenkes Jakarta I' }) @IsNotEmpty() university!: string;
  @ApiProperty({ example: 2023 }) graduationYear!: number;
  @ApiProperty({ example: 75000 }) ratePerHour!: number;
  @ApiProperty({ enum: ['companion', 'skilled'] }) @IsIn(['companion', 'skilled']) tier!: 'companion' | 'skilled';
  @ApiProperty({ example: 'Jakarta Selatan' }) @IsNotEmpty() location!: string;
  @ApiPropertyOptional({ enum: ['MENUNGGU_STR', 'STR_AKTIF'] })
  @IsOptional() @IsIn(['MENUNGGU_STR', 'STR_AKTIF']) strStatus?: 'MENUNGGU_STR' | 'STR_AKTIF';
}
