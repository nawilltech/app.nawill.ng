import { IsOptional, IsString, Length } from 'class-validator';

export class CreateCountryDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  officialName?: string;

  @IsString()
  @Length(2, 2)
  iso2: string;

  @IsString()
  @Length(3, 3)
  iso3: string;

  @IsOptional()
  @IsString()
  numericCode?: string;

  @IsString()
  dialCode: string;

  @IsOptional()
  @IsString()
  capital?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  subregion?: string;

  @IsString()
  @Length(3, 3)
  currencyCode: string;

  @IsOptional()
  @IsString()
  currencyName?: string;

  @IsOptional()
  @IsString()
  currencySymbol?: string;
}
