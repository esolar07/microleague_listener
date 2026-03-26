import { Model } from 'mongoose';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export async function paginate<T>(
  model: Model<T>,
  query: any = {},
  paginationDto: PaginationDto,
  populateFields: any[] = [],
): Promise<{
  data: T[];
  totalCount: number;
  totalPages: number;
  page: number;
  limit: number;
}> {
  const { page = 1, limit = 10, sort = { createdAt: -1 } } = paginationDto;
  const skip = (page - 1) * limit;

  const [data, totalCount] = await Promise.all([
    model
      .find(query)
      .populate(populateFields)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean() // ✅ ADD THIS
      .exec() as Promise<T[]>,
    model.countDocuments(query).exec(),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return {
    data,
    totalCount,
    totalPages,
    page,
    limit,
  };
}
