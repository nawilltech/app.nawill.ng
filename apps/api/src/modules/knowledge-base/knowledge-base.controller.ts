import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { KnowledgeBaseService } from './knowledge-base.service';
import { ok } from '../../common/dto/service-result';

@ApiTags('knowledge-base')
@ApiBearerAuth('bearer')
@Controller('knowledge-base')
export class KnowledgeBaseController {
  constructor(private readonly knowledgeBaseService: KnowledgeBaseService) {}

  @Get('categories')
  async listCategories() {
    const result = await this.knowledgeBaseService.listCategories();
    return ok(result, 'Knowledge base categories retrieved successfully');
  }

  @Get('categories/:slug')
  async getCategory(@Param('slug') slug: string) {
    const result = await this.knowledgeBaseService.getCategoryWithArticles(slug);
    return ok(result, 'Knowledge base category retrieved successfully');
  }

  @Get('articles/:slug')
  async getArticle(@Param('slug') slug: string) {
    const result = await this.knowledgeBaseService.getArticle(slug);
    return ok(result, 'Knowledge base article retrieved successfully');
  }
}
