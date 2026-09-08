import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KnowledgeBaseService {
  constructor(private readonly prisma: PrismaService) {}

  async listCategories() {
    const categories = await this.prisma.knowledgeBaseCategory.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
      include: { _count: { select: { articles: { where: { deletedAt: null } } } } },
    });

    return categories.map(({ _count, ...category }) => ({ ...category, articleCount: _count.articles }));
  }

  async getCategoryWithArticles(slug: string) {
    const category = await this.prisma.knowledgeBaseCategory.findFirst({
      where: { slug, deletedAt: null },
      include: { articles: { where: { deletedAt: null }, orderBy: { title: 'asc' } } },
    });
    if (!category) throw new NotFoundException('Knowledge base category not found');
    return category;
  }

  async getArticle(slug: string) {
    const article = await this.prisma.knowledgeBaseArticle.findFirst({
      where: { slug, deletedAt: null },
      include: { category: { select: { name: true, slug: true } } },
    });
    if (!article) throw new NotFoundException('Knowledge base article not found');
    return article;
  }
}
