import { PartialType } from '@nestjs/swagger';
import { CreateDashboardDto } from './create-dashbord.dto';

export class UpdateDashbordDto extends PartialType(CreateDashboardDto) {}
