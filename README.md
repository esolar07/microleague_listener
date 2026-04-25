# MicroLeague Listener Service

A NestJS blockchain event listener service for the MicroLeague presale. It monitors Ethereum smart contracts in real time, processes on-chain events (token purchases, claims, vesting), and persists them to a PostgreSQL database via Prisma.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   ListenerService                        │
│  (onModuleInit → registers contracts → startListening)  │
└────────────────────┬────────────────────────────────────┘
                     │
          ┌──────────▼──────────┐
          │  ContractManager    │
          │  - Historical scan  │
          │  - Polling (3s)     │
          └──────┬──────┬───────┘
                 │      │
     ┌───────────▼┐    ┌▼──────────────┐
     │ProviderPool│    │HandlerRegistry │
     │(RPC failov)│    │PresaleBuyHndlr │
     └────────────┘    │PresaleClaimHndl│
                       │VestingHndlr    │
                       └────────────────┘
```

**On startup:**
1. Provider pool initialises (primary → secondary → tertiary RPC failover).
2. Contracts from `listener.config.ts` are registered with their last-processed block from the DB.
3. Historical events are back-scanned from the checkpoint; the polling loop starts in parallel.
4. After historical sync finishes, the polling loop takes over at 3-second intervals.

---

## Modules

| Module | Purpose |
|---|---|
| `listener` | Core — contract registration, historical scan, polling, event dispatch |
| `auth` | Wallet-based authentication (nonce + ECDSA signature → JWT) |
| `user` | Presale buyer profiles |
| `transactions` | Presale transaction records |
| `bank-transfers` | Fiat bank transfer records with proof upload |
| `admin` | Admin-only management endpoints |
| `queue/email` | Bull queue for transactional emails via Mailgun |

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values.

| Variable | Description |
|---|---|
| `PORT` | HTTP port (default `8080`) |
| `DATABASE_URL` | PostgreSQL connection string (Prisma) |
| `PRESALE_CONTRACT` | Ethereum address of the presale contract |
| `RPC_URL_PRIMARY` | Primary RPC endpoint |
| `RPC_URL_SECONDARY` | Secondary RPC endpoint (failover) |
| `RPC_URL_TERTIARY` | Tertiary RPC endpoint (failover) |
| `REDIS_HOST` | Redis host for Bull queue |
| `REDIS_PORT` | Redis port |
| `REDIS_PASSWORD` | Redis password |
| `MAILGUN_API_KEY` | Mailgun API key |
| `MAILGUN_DOMAIN` | Mailgun sending domain |
| `MAILGUN_FROM` | From address for emails |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud (bank transfer proof storage) |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `CONFIRMATION_BLOCKS` | Blocks to wait before treating an event as final (default `3`) |
| `POLLING_INTERVAL` | Polling interval in ms (default `15000`) |
| `BATCH_SIZE` | Blocks per batch during historical scan |
| `EVENT_MAX_RETRIES` | Max retries for failed events |
| `SAFT_EMAIL_ENABLED` | Enable SAFT agreement emails (`true`/`false`) |

---

## Installation

```bash
npm install
```

Generate Prisma client after setting `DATABASE_URL`:

```bash
npx prisma generate
npx prisma migrate deploy
```

---

## Running

```bash
# development
npm run start

# watch mode
npm run start:dev

# production
npm run start:prod
```

---

## Testing

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# coverage
npm run test:cov
```

---

## API Reference

All endpoints are prefixed by the base URL. Swagger UI is available at `/api`.

### Auth — `/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/nonce` | — | Request a sign message for a wallet address |
| POST | `/auth/verify` | — | Verify wallet signature, returns JWT |

**Nonce request:**
```json
{ "walletAddress": "0xYourAddress" }
```
**Verify request:**
```json
{ "walletAddress": "0x...", "signature": "0x...", "message": "..." }
```

---

### Listener — `/listener`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/listener/health` | — | System health (listener status, RPC providers, queue) |
| GET | `/listener/metrics` | — | Prometheus metrics |
| GET | `/listener/status` | JWT | Detailed per-contract listener status |
| GET | `/listener/queue/stats` | JWT | Event queue statistics |
| GET | `/listener/failed-events` | JWT | List failed events |
| GET | `/listener/gaps/detect` | JWT | Detect block processing gaps |
| GET | `/listener/gaps/summary` | JWT | Gap summary |
| GET | `/listener/reorg/stats` | JWT | Blockchain reorg statistics |
| GET | `/listener/providers` | JWT | RPC provider pool stats |
| POST | `/listener/reprocess` | — | Reprocess events for a block range (background) |
| POST | `/listener/reprocess-from-start` | — | Reset and reprocess all events from start block |
| POST | `/listener/reset-event-state` | Admin | Delete processed-event state entries for re-handling |
| POST | `/listener/retry-failed` | JWT + Admin | Retry failed events |
| POST | `/listener/provider/:name/health` | JWT + Admin | Manually mark an RPC provider healthy/unhealthy |
| POST | `/listener/queue/cleanup` | JWT + Admin | Purge old queue jobs |
| GET | `/listener/data-integrity/:contractAddress` | JWT + Admin | Check for duplicate events |

**Reprocess body:**
```json
{
  "contractAddress": "0x...",
  "fromBlock": 10000000,
  "toBlock": 10100000,
  "eventNames": ["Bought"],
  "resetLastProcessedBlock": false,
  "batchSize": 100
}
```

---

### Transactions — `/transactions`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/transactions` | JWT | List all transactions (paginated, filterable) |
| GET | `/transactions/stats/summary` | Admin | Aggregate transaction stats |
| GET | `/transactions/:txHash` | — | Get transaction by tx hash |
| GET | `/transactions/address/:address` | — | Get transactions for a wallet address |
| GET | `/transactions/user/tokens` | — | Get total tokens for an identifier |
| DELETE | `/transactions/:txHash` | — | Delete a transaction record |

---

### Users — `/user`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/user/address/:address` | — | Get buyer by wallet address |
| GET | `/user/wallet/:walletAddress` | — | Get buyer by wallet address |
| POST | `/user/add-referral` | JWT | Add a referral for the authenticated user |

---

### Bank Transfers — `/bank-transfers`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/bank-transfers/upload-proof` | — | Upload payment proof to Cloudinary |
| POST | `/bank-transfers` | — | Create a bank transfer record |
| GET | `/bank-transfers` | — | List bank transfers |
| GET | `/bank-transfers/:id` | — | Get bank transfer by ID |
| PATCH | `/bank-transfers/:id` | — | Update bank transfer |
| PATCH | `/bank-transfers/:id/verify` | Admin | Verify/approve a bank transfer |
| DELETE | `/bank-transfers/:id` | Admin | Delete a bank transfer |
| GET | `/bank-transfers/stats/summary` | Admin | Bank transfer statistics |

---

### Admin — `/admin`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/admin/me` | Admin | Get current admin profile |
| GET | `/admin` | — | List all admins |
| GET | `/admin/contract-config` | Admin | Get presale contract configuration |
| PATCH | `/admin/contract-config` | Admin | Update presale contract configuration |
| GET | `/admin/support/health` | Admin | Full system health (listener + DB + errors) |
| POST | `/admin/support/retry-failed` | Admin | Queue all unresolved failed events for retry |

---

## Smart Contract Events

Configured in `src/modules/listener/config/listener.config.ts`.

| Event | Handler | Description |
|---|---|---|
| `Bought` | `PresaleBuyHandler` | Token purchase on the presale contract |
| `Claimed` | `PresaleClaimHandler` | Token claim by a buyer |
| `VestingScheduleCreated` | `VestingScheduleCreatedHandler` | Vesting schedule created for a buyer |

**Start block:** `9822755`  
**Network:** Ethereum  
**Batch size:** 100 blocks per RPC call

---

## Pruned RPC Nodes

If the RPC node is pruned (no archive history), the historical scanner automatically detects consecutive `pruned history unavailable` errors and jumps forward to `latestBlock - 50,000` instead of crawling unavailable blocks one batch at a time.

To immediately fix a stale checkpoint on a running server, update the `listener_state` DB record for the presale contract to a recent block number — the scanner will pick it up on the next restart.

---

## Health Check

```
GET /listener/health
```

Returns `status: healthy | degraded | critical` based on:
- Whether all RPC providers are reachable
- Whether each contract's `lastProcessedBlock` is within 100 blocks of chain head
- Event queue state
