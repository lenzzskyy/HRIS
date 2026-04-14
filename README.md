# HRIS Production-Ready (Fullstack)

Upgrade dari aplikasi frontend-only menjadi HRIS fullstack dengan arsitektur modular, security hardening, persistence PostgreSQL, Redis cache/session, dan audit trail lengkap.

## 1) Struktur Folder

```txt
.
├── backend
│   ├── prisma/schema.prisma
│   ├── src
│   │   ├── config/{env,prisma,redis}.js
│   │   ├── middleware/{auth,activityLog,validate,errorHandler}.js
│   │   ├── modules
│   │   │   ├── auth/routes.js
│   │   │   ├── employees/routes.js
│   │   │   ├── attendance/routes.js
│   │   │   ├── payroll/routes.js
│   │   │   ├── leave/routes.js
│   │   │   ├── activity/routes.js
│   │   │   └── settings/routes.js
│   │   ├── utils/{logger,tokens}.js
│   │   └── server.js
│   ├── Dockerfile
│   └── .env.example
├── frontend
│   ├── src
│   │   ├── api/client.js
│   │   ├── store/authStore.js
│   │   └── pages/*.jsx
│   └── Dockerfile
└── docker-compose.yml
```

## 2) Database Schema (Prisma)

Tabel inti yang tersedia:
- users
- employees
- attendance
- payroll
- leave_requests
- departments
- roles
- permissions
- activity_logs
- sessions
- company_settings

`activity_logs` menyimpan:
- action, module, description
- metadata JSON (before/after)
- ip_address, user_agent
- created_at

## 3) Backend API

Endpoint utama:
- `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`
- `GET/POST/PUT/DELETE /employees`
- `GET /attendance`, `POST /attendance/checkin`
- `GET /payroll`, `POST /payroll/process`
- `GET/POST /leave-requests`, `POST /leave-requests/:id/approve|reject`
- `GET /activity-logs`
- `GET/PUT /settings/company-profile`

## 4) Integrasi Frontend

Frontend React + Vite menggunakan:
- Zustand untuk auth state
- Axios client dengan Bearer token interceptor
- Halaman login, dashboard, employee management, dan audit log
- Debounce search pada halaman employees

## 5) Security yang Diimplementasikan

- Helmet + CORS policy ketat
- JWT access + refresh token
- Session persistence di DB
- Bcrypt password hash
- Rate limiting endpoint login
- Account lockout setelah 5 kali gagal login
- RBAC permission middleware
- Input validation via Zod
- ORM Prisma untuk SQL injection defense
- Structured logging via Pino

## 6) Activity Log Middleware

`activityLogger` middleware otomatis mencatat event penting (AUTH/HR/SYSTEM) ke tabel `activity_logs` dengan metadata JSON. Mendukung snapshot `before/after` untuk aksi update/delete/approve/reject.

## 7) Deployment (Docker)

### Local
1. Copy env:
   - `cp backend/.env.example backend/.env`
2. Jalankan:
   - `docker compose up --build`
3. Aplikasi tersedia:
   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:4000`

### Production Notes (VPS/AWS/GCP)
- Gunakan managed PostgreSQL + Redis (RDS/Cloud SQL + ElastiCache/Memorystore).
- Terminate HTTPS di reverse proxy (Nginx/Traefik/ALB).
- Simpan secrets di Vault/SSM/Secret Manager.
- Jalankan Prisma migration di CI/CD sebelum rolling update.
- Aktifkan observability (OpenTelemetry, centralized logs, metrics, alerting).

## 8) Security Audit Simulation (Pentest Mindset)

Risiko dan mitigasi:
- Credential stuffing → rate limit + lockout + MFA (next step).
- Token theft → short access token + rotation refresh token + secure cookie mode.
- Privilege escalation → centralized permission checks + audit logs perubahan role.
- Injection/XSS → input validation + output escaping + CSP header tambahan.
- Data exfiltration → row-level access policy + encryption at rest & in transit.

## 9) Bottleneck Performance Analysis

Potensi bottleneck:
- Query dashboard aggregasi payroll/attendance besar.
- List activity logs tanpa index/filter bisa lambat.
- Endpoint employee search full scan.

Rekomendasi CTO:
- Tambah index query-hot (`employeeCode`, `module+createdAt`, `status+date`).
- Redis caching untuk dashboard summary.
- Background job queue (BullMQ) untuk payroll batch processing.
- Read replica untuk report query berat.

