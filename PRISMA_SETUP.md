# Prisma Setup - Microleague Listener

## Overview

This project uses Prisma as the ORM for PostgreSQL database operations. The setup includes comprehensive models for presale management, blockchain event tracking, and user management.

## Database Models

### Core Models

- **PresaleUser** - User wallet addresses and token balances
- **PresaleTx** - Transaction records from blockchain events
- **VestingSchedule** - Token vesting schedules for users
- **RecentActivity** - Activity tracking for dashboard
- **BankTransfer** - Bank transfer management

### System Models

- **ListenerState** - Blockchain event listener state tracking
- **FailedEvent** - Failed event handling and retry logic
- **Admin** - Admin user management

## Available Scripts

```bash
# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Deploy migrations to production
npm run prisma:migrate:deploy

# Reset database (development only)
npm run prisma:migrate:reset

# Open Prisma Studio (database GUI)
npm run prisma:studio

# Seed database with sample data
npm run prisma:seed

# Push schema changes without migrations
npm run db:push

# Pull schema from existing database
npm run db:pull
```

## Usage in NestJS

### 1. Import PrismaModule

```typescript
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  // ...
})
export class AppModule {}
```

### 2. Inject PrismaService

```typescript
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class YourService {
  constructor(private prisma: PrismaService) {}

  async getUsers() {
    return this.prisma.presaleUser.findMany();
  }
}
```

## Environment Variables

Make sure your `.env` file contains:

```env
DATABASE_URL="your-database-connection-string"
```

## Development Workflow

1. **Make schema changes** in `prisma/schema.prisma`
2. **Create migration**: `npm run prisma:migrate`
3. **Generate client**: `npm run prisma:generate`
4. **Update your code** to use new schema changes

## Production Deployment

1. **Deploy migrations**: `npm run prisma:migrate:deploy`
2. **Generate client**: `npm run prisma:generate`
3. **Start application**

## Useful Commands

```bash
# Check database connection
npx prisma db pull

# View generated SQL for migrations
npx prisma migrate diff

# Format schema file
npx prisma format

# Validate schema
npx prisma validate
```

## Database Connection

The project uses Prisma Accelerate for connection pooling and caching. The connection string format:

```
prisma+postgres://accelerate.prisma-data.net/?api_key=your-api-key
```

## Troubleshooting

### Common Issues

1. **Client not generated**: Run `npm run prisma:generate`
2. **Migration errors**: Check database connection and permissions
3. **Type errors**: Ensure client is generated after schema changes

### Reset Development Database

```bash
npm run prisma:migrate:reset
npm run prisma:seed
```

This will reset your database and populate it with seed data.
