import { PrismaClient, Organization, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export class OrganizationsService {
  /**
   * Create a new organization
   */
  async createOrganization(data: Prisma.OrganizationCreateInput): Promise<Organization> {
    return prisma.organization.create({
      data,
    });
  }

  /**
   * Get organization by ID
   */
  async getOrganizationById(id: string): Promise<Organization | null> {
    return prisma.organization.findUnique({
      where: { id },
    });
  }

  /**
   * Get all organizations (Admin only use case generally)
   * With pagination
   */
  async getAllOrganizations(
    page: number = 1,
    limit: number = 10,
  ): Promise<{ organizations: Organization[]; total: number }> {
    const skip = (page - 1) * limit;
    const [organizations, total] = await prisma.$transaction([
      prisma.organization.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.organization.count(),
    ]);

    return { organizations, total };
  }

  /**
   * Update organization details
   */
  async updateOrganization(
    id: string,
    data: Prisma.OrganizationUpdateInput,
  ): Promise<Organization> {
    return prisma.organization.update({
      where: { id },
      data,
    });
  }

  /**
   * Soft delete organization (set isActive to false)
   */
  async deleteOrganization(id: string): Promise<Organization> {
    return prisma.organization.update({
      where: { id },
      data: { isActive: false },
    });
  }
}

export default new OrganizationsService();
