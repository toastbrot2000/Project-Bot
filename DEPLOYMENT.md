# Deployment Guide

This guide covers deploying Project Bot to production environments.

## 📋 Prerequisites

- Node.js v20+
- pnpm v9+
- Docker (optional, for containerized deployment)
- Static hosting service (Vercel, Netlify, AWS S3, etc.) OR
- VPS/Server with Nginx

## 🏗️ Building for Production

### Build All Apps

```bash
# From repository root
pnpm build
```

This builds all apps in `apps/*/dist/` directories:

- `apps/website-host/dist/` - Host application
- `apps/admin-app/dist/` - Admin dashboard remote
- `apps/user-app/dist/` - User assessment remote
- `apps/backend/dist/` - Strapi build output (if applicable)

### Build Individual Apps

```bash
# Build only specific app
pnpm --filter website-host build
pnpm --filter admin-app build
pnpm --filter user-app build
```

## ⚙️ Environment Configuration

### Environment Variables

Create `.env.production` files in each app directory:

#### website-host

```env
# .env.production
VITE_USER_APP_URL=https://user-app.yourdomain.com
VITE_ADMIN_APP_URL=https://admin-app.yourdomain.com
VITE_API_URL=https://api.yourdomain.com
```

Update `vite.config.ts` to use environment variables:

```typescript
federation({
  name: "website_host",
  remotes: {
    userApp:
      process.env.VITE_USER_APP_URL || "http://localhost:5001/mf-manifest.json",
    adminApp:
      process.env.VITE_ADMIN_APP_URL ||
      "http://localhost:5002/mf-manifest.json",
  },
});
```

#### backend (Strapi)

```env
# apps/backend/.env.production
HOST=0.0.0.0
PORT=1337
APP_KEYS=generateSecureRandomString1,generateSecureRandomString2
API_TOKEN_SALT=generateSecureRandomSalt
ADMIN_JWT_SECRET=generateSecureRandomSecret
TRANSFER_TOKEN_SALT=generateSecureRandomSalt2
JWT_SECRET=generateSecureJwtSecret

# Database (example: PostgreSQL)
DATABASE_CLIENT=postgres
DATABASE_HOST=your-db-host.com
DATABASE_PORT=5432
DATABASE_NAME=project_bot_prod
DATABASE_USERNAME=db_user
DATABASE_PASSWORD=securePassword
DATABASE_SSL=true
```

**Generate secure secrets**:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 🚀 Deployment Strategies

### Strategy 1: Monolithic Static Deployment

Deploy all apps to a single static host with path-based routing.

**Pros**: Simple, single deployment
**Cons**: All apps updated together, no independent scaling

#### File Structure

```
dist/
├── index.html              # Host app
├── assets/                 # Host assets
├── user-app/
│   ├── index.html          # User app (not used)
│   ├── remoteEntry.js      # Module federation entry
│   └── assets/
└── admin-app/
    ├── index.html          # Admin app (not used)
    ├── remoteEntry.js      # Module federation entry
    └── assets/
```

#### Build Script

```bash
#!/bin/bash
# build-monolithic.sh

# Build all apps
pnpm build

# Create unified dist folder
mkdir -p dist-production
cp -r apps/website-host/dist/* dist-production/
mkdir -p dist-production/user-app
mkdir -p dist-production/admin-app
cp -r apps/user-app/dist/* dist-production/user-app/
cp -r apps/admin-app/dist/* dist-production/admin-app/

echo "Monolithic build ready in dist-production/"
```

#### Nginx Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/project-bot;

    # Host app - serve from root
    location / {
        try_files $uri $uri/ /index.html;
    }

    # User app remote entry
    location /user-app/ {
        try_files $uri $uri/ =404;
    }

    # Admin app remote entry
    location /admin-app/ {
        try_files $uri $uri/ =404;
    }

    # Strapi API
    location /api/ {
        proxy_pass http://localhost:1337/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Enable gzip
    gzip on;
    gzip_types text/css application/javascript application/json;
}
```

### Strategy 2: Independent Micro-Frontend Deployment

Deploy each app to separate URLs for true micro-frontend independence.

**Pros**: Independent scaling, gradual rollouts, team autonomy
**Cons**: More complex, need CDN/CORS handling

#### Deployment Structure

- Host: `https://app.yourdomain.com`
- User App: `https://user.yourdomain.com`
- Admin App: `https://admin.yourdomain.com`
- Backend: `https://api.yourdomain.com`

#### CORS Configuration

Each remote app needs CORS headers:

```nginx
# Admin app server
server {
    listen 80;
    server_name admin.yourdomain.com;
    root /var/www/admin-app;

    location / {
        # CORS headers
        add_header 'Access-Control-Allow-Origin' 'https://app.yourdomain.com' always;
        add_header 'Access-Control-Allow-Methods' 'GET, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type' always;

        try_files $uri $uri/ =404;
    }
}
```

#### Module Federation URLs

Update host's `vite.config.ts`:

```typescript
federation({
  name: "website_host",
  remotes: {
    userApp: "https://user.yourdomain.com/mf-manifest.json",
    adminApp: "https://admin.yourdomain.com/mf-manifest.json",
  },
});
```

### Strategy 3: Docker Compose Deployment

Use Docker containers for all services with orchestration.

**Pros**: Environment isolation, easy scaling, portable
**Cons**: Requires Docker knowledge, resource overhead

#### docker-compose.yml

The project includes a `docker-compose.yml`. Extend it for production:

```yaml
version: "3.8"

services:
  website-host:
    build:
      context: .
      dockerfile: apps/website-host/Dockerfile
    ports:
      - "80:80"
    environment:
      - VITE_USER_APP_URL=http://user-app:5001
      - VITE_ADMIN_APP_URL=http://admin-app:5002
      - VITE_API_URL=http://backend:1337
    depends_on:
      - user-app
      - admin-app
      - backend

  user-app:
    build:
      context: .
      dockerfile: apps/user-app/Dockerfile
    expose:
      - "5001"

  admin-app:
    build:
      context: .
      dockerfile: apps/admin-app/Dockerfile
    expose:
      - "5002"

  backend:
    build:
      context: .
      dockerfile: apps/backend/Dockerfile
    ports:
      - "1337:1337"
    environment:
      - DATABASE_CLIENT=postgres
      - DATABASE_HOST=postgres
      - DATABASE_PORT=5432
      - DATABASE_NAME=project_bot
      - DATABASE_USERNAME=strapi
      - DATABASE_PASSWORD=${DB_PASSWORD}
      - APP_KEYS=${APP_KEYS}
      - JWT_SECRET=${JWT_SECRET}
      - ADMIN_JWT_SECRET=${ADMIN_JWT_SECRET}
    depends_on:
      - postgres

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=project_bot
      - POSTGRES_USER=strapi
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

#### Dockerfile Example (website-host)

```dockerfile
# apps/website-host/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm --filter website-host build

FROM nginx:alpine
COPY --from=builder /app/apps/website-host/dist /usr/share/nginx/html
COPY apps/website-host/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Deploy with Docker Compose

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## 🌐 Platform-Specific Deployments

### Vercel

**Best for**: Host + Remotes as separate projects

1. **Create Vercel projects** for each app:

   - `project-bot-host`
   - `project-bot-user-app`
   - `project-bot-admin-app`

2. **Configure build settings**:

   ```json
   {
     "buildCommand": "pnpm --filter website-host build",
     "outputDirectory": "apps/website-host/dist",
     "framework": "vite"
   }
   ```

3. **Set environment variables** in Vercel dashboard

4. **Deploy**:
   ```bash
   vercel --prod
   ```

### Netlify

Similar to Vercel, deploy each app separately.

**netlify.toml** (website-host):

```toml
[build]
  command = "pnpm --filter website-host build"
  publish = "apps/website-host/dist"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
```

### AWS S3 + CloudFront

1. **Build apps**: `pnpm build`
2. **Upload to S3**:
   ```bash
   aws s3 sync apps/website-host/dist s3://my-bucket/
   ```
3. **Create CloudFront distribution** pointing to S3
4. **Configure CloudFront** for single-page apps:
   - Error pages: 404 → `/index.html` (200)

## 🔒 Security Considerations

### 1. Environment Secrets

- **Never commit** `.env.production` files
- Use **secret management** services (AWS Secrets Manager, HashiCorp Vault)
- Rotate secrets regularly

### 2. HTTPS/TLS

- **Always use HTTPS** in production
- Use Let's Encrypt for free SSL certificates:
  ```bash
  certbot --nginx -d yourdomain.com
  ```

### 3. Content Security Policy

Add CSP headers in Nginx:

```nginx
add_header Content-Security-Policy "
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://user.yourdomain.com https://admin.yourdomain.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    connect-src 'self' https://api.yourdomain.com;
" always;
```

### 4. Rate Limiting

Protect Strapi API:

```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

location /api/ {
    limit_req zone=api burst=20 nodelay;
    proxy_pass http://localhost:1337/api/;
}
```

## 📊 Monitoring and Logging

### Application Monitoring

- **Sentry**: For error tracking
  ```bash
  pnpm add @sentry/react @sentry/vite-plugin
  ```

### Server Monitoring

- **Nginx logs**:

  ```bash
  tail -f /var/log/nginx/access.log
  tail -f /var/log/nginx/error.log
  ```

- **PM2** (for Node.js processes):
  ```bash
  pm2 start apps/backend/server.js --name strapi
  pm2 logs strapi
  ```

## 🔄 Continuous Deployment

### GitHub Actions (Automated)

The project includes `.github/workflows/ci.yml` for CI. Extend for CD:

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: "pnpm"

      - run: pnpm install --frozen-lockfile
      - run: pnpm build

      # Deploy to your hosting (example: Vercel)
      - name: Deploy to Vercel
        run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

## 🧪 Pre-Deployment Checklist

- [ ] All tests pass (`pnpm test`, `pnpm test:e2e`)
- [ ] Build succeeds (`pnpm build`)
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Secrets rotated and secured
- [ ] HTTPS/SSL certificates valid
- [ ] Monitoring and logging configured
- [ ] Backup strategy in place
- [ ] Rollback plan documented

## 🆘 Troubleshooting

### Module Federation 404 Errors

**Symptom**: Host can't load remotes

**Solution**: Ensure remote URLs are correct and accessible:

```bash
curl https://admin.yourdomain.com/mf-manifest.json
```

### CORS Errors

**Symptom**: Browser blocks remote requests

**Solution**: Add CORS headers to remote servers (see Strategy 2)

### Strapi Build Errors

**Symptom**: Strapi fails to build or start

**Solution**: Check ESM configuration and environment variables. See [apps/backend/README.md](file:///c:/xampp/htdocs/Project%20Bot/apps/backend/README.md)

---

**For AI Agents**: Key deployment files: `docker-compose.yml` (container orchestration), app-specific Dockerfiles, `.env.production` files (secrets - never commit), nginx configs (routing). Build with `pnpm build`, verify with `pnpm test:e2e`. For module federation, ensure remote URLs are set correctly in host's vite.config.ts.
