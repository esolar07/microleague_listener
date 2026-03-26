# Database Setup Guide

## Current Status
The application has been successfully migrated from MongoDB to PostgreSQL with Prisma, but the database connection needs to be configured.

## Database Connection Issue
The current `DATABASE_URL` in `.env` appears to be a Prisma Accelerate URL that is not accessible:
```
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=..."
```

## Setup Options

### Option 1: Use Prisma Accelerate (Recommended for Production)
1. Go to [Prisma Data Platform](https://cloud.prisma.io/)
2. Create a new project or use existing one
3. Set up a PostgreSQL database
4. Enable Accelerate and get the connection URL
5. Update the `DATABASE_URL` in `.env`

### Option 2: Use Direct PostgreSQL Connection
1. Set up a PostgreSQL database (local or cloud)
2. Update `.env` with direct connection:
```env
DATABASE_URL="postgresql://username:password@host:port/database"
```

### Option 3: Use Local PostgreSQL
1. Install PostgreSQL locally
2. Create a database:
```sql
CREATE DATABASE microleague_listener;
```
3. Update `.env`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/microleague_listener"
```

## Database Schema Deployment

Once you have a working `DATABASE_URL`:

1. **Deploy the schema:**
```bash
npx prisma db push
```

2. **Generate Prisma client:**
```bash
npx prisma generate
```

3. **Test the connection:**
```bash
node scripts/test-db.js
```

## Database Schema

The application includes these tables:
- `users` - Presale participants with wallet addresses and purchase data
- `presale_txs` - All presale transactions (buy/claim events)
- `listener_state` - Blockchain event processing state
- `failed_events` - Failed event processing for retry

## Application Startup

The application is configured to start even without a database connection, but database-dependent features will not work until the connection is established.

## Health Checks

Once running, you can check database status at:
- `GET /health` - General application health
- `GET /health/database` - Database connection status