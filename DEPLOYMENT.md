# 🚀 Production Deployment Guide

**Online FIR Portal - Government-Grade Deployment**

This guide covers deploying the FIR portal to production with security best practices, monitoring, and disaster recovery.

---

## 📋 Prerequisites

### System Requirements
- **OS:** Ubuntu 22.04 LTS or RHEL 8+
- **CPU:** 4+ cores
- **RAM:** 8GB minimum, 16GB recommended
- **Storage:** 100GB+ SSD
- **Network:** Static IP, SSL certificate

### Software Requirements
- **Node.js:** 20.x LTS
- **PostgreSQL:** 15.x
- **Nginx:** 1.24+
- **Docker:** 24.x (optional)
- **PM2:** Latest (for process management)

---

## 🔧 Pre-Deployment Checklist

- [ ] Domain name configured (e.g., fir.gov.in)
- [ ] SSL/TLS certificates obtained (Let's Encrypt or CA)
- [ ] PostgreSQL database server setup
- [ ] Firewall rules configured
- [ ] Backup strategy planned
- [ ] Monitoring tools ready
- [ ] Environment variables prepared
- [ ] DNS records updated

---

## 📦 Installation

### 1. Clone Repository
```bash
cd /opt
git clone <repository-url> online-fir-portal
cd online-fir-portal
```

### 2. Install Dependencies

#### Backend
```bash
cd OnlineFirPortal.backend
npm install --production
```

#### Frontend
```bash
cd OnlineFirPortal.frontend
npm install --production
```

---

## ⚙️ Configuration

### 1. Backend Environment (.env)

```bash
cd OnlineFirPortal.backend
cp .env.example .env
nano .env
```

**Required Variables:**
```env
# Database
DATABASE_URL="postgresql://fir_user:STRONG_PASSWORD@localhost:5432/fir_portal_prod"

# JWT Secrets (Generate with: openssl rand -hex 32)
JWT_SECRET="your-64-char-hex-secret-here"
JWT_REFRESH_SECRET="your-64-char-hex-refresh-secret-here"

# Encryption (Generate with: openssl rand -hex 32)
ENCRYPTION_KEY="your-64-char-hex-encryption-key-here"

# Environment
NODE_ENV="production"
PORT=5000

# Security
BCRYPT_ROUNDS=12
ALLOWED_ORIGINS="https://fir.gov.in"

# Optional: Email/SMS (for production)
# SMTP_HOST="smtp.gov.in"
# SMTP_PORT=587
# SMTP_USER="noreply@fir.gov.in"
# SMTP_PASS="your-smtp-password"
# SMS_API_KEY="your-sms-gateway-key"
```

### 2. Frontend Environment (.env.local)

```bash
cd OnlineFirPortal.frontend
cp .env.local.example .env.local
nano .env.local
```

```env
NEXT_PUBLIC_API_URL="https://api.fir.gov.in"
```

### 3. Generate Secure Keys

```bash
# Generate JWT secret
openssl rand -hex 32

# Generate refresh secret
openssl rand -hex 32

# Generate encryption key
openssl rand -hex 32
```

---

## 🗄️ Database Setup

### 1. Create PostgreSQL Database

```bash
sudo -u postgres psql

CREATE DATABASE fir_portal_prod;
CREATE USER fir_user WITH ENCRYPTED PASSWORD 'STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE fir_portal_prod TO fir_user;
\q
```

### 2. Run Migrations

```bash
cd OnlineFirPortal.backend
npx prisma migrate deploy
```

### 3. Create Super Admin

```bash
npx ts-node src/scripts/create-super-admin.ts
# Follow prompts to create first admin account
```

---

## 🏗️ Build for Production

### Backend
```bash
cd OnlineFirPortal.backend
npm run build
```

### Frontend
```bash
cd OnlineFirPortal.frontend
npm run build
```

---

## 🚀 Deployment Options

### Option 1: PM2 (Recommended)

#### Install PM2
```bash
npm install -g pm2
```

#### Start Backend
```bash
cd OnlineFirPortal.backend
pm2 start dist/server.js --name fir-backend
```

#### Start Frontend
```bash
cd OnlineFirPortal.frontend
pm2 start npm --name fir-frontend -- start
```

#### Save PM2 Configuration
```bash
pm2 save
pm2 startup
```

### Option 2: Docker Compose

```bash
# Ensure docker-compose.yml is configured
docker-compose up -d --build

# View logs
docker-compose logs -f
```

---

## 🔒 Nginx Configuration

### 1. Install Nginx
```bash
sudo apt install nginx
```

### 2. Configure SSL

```bash
sudo nano /etc/nginx/sites-available/fir-portal
```

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name fir.gov.in;
    return 301 https://$server_name$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    server_name fir.gov.in;

    # SSL Certificates
    ssl_certificate /etc/letsencrypt/live/fir.gov.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/fir.gov.in/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Rate limiting
        limit_req zone=api burst=20 nodelay;
    }

    # File upload size
    client_max_body_size 50M;
}

# Rate limiting zone
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
```

### 3. Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/fir-portal /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 📊 Monitoring

### 1. Setup Monitoring Script

```bash
chmod +x monitor.sh
```

### 2. Add to Cron (Every 5 minutes)

```bash
crontab -e
```

Add:
```
*/5 * * * * /opt/online-fir-portal/monitor.sh >> /var/log/fir-monitor.log 2>&1
```

### 3. PM2 Monitoring

```bash
pm2 monit
pm2 logs
```

---

## 💾 Backup Strategy

### 1. Setup Backup Script

```bash
chmod +x backup.sh
```

### 2. Schedule Daily Backups

```bash
crontab -e
```

Add:
```
0 2 * * * /opt/online-fir-portal/backup.sh >> /var/log/fir-backup.log 2>&1
```

### 3. Test Backup Restoration

```bash
# Extract backup
gunzip /var/backups/onlinefir/db_backup_YYYY-MM-DD_HH-MM-SS.sql.gz

# Restore to test database
psql -U fir_user -d fir_portal_test < db_backup_YYYY-MM-DD_HH-MM-SS.sql
```

---

## 🔥 Firewall Configuration

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow PostgreSQL (only from localhost)
sudo ufw allow from 127.0.0.1 to any port 5432

# Enable firewall
sudo ufw enable
```

---

## ✅ Post-Deployment Verification

### 1. Health Checks

```bash
# Frontend
curl https://fir.gov.in

# Backend API
curl https://fir.gov.in/api/health

# Database
psql -U fir_user -d fir_portal_prod -c "SELECT COUNT(*) FROM \"User\";"
```

### 2. Test User Flows

- [ ] Citizen registration with MFA
- [ ] Login with TOTP
- [ ] File FIR with digital signature
- [ ] Officer login and FIR assignment
- [ ] Admin panel access
- [ ] Notification delivery

### 3. Security Audit

```bash
# Check SSL rating
curl https://www.ssllabs.com/ssltest/analyze.html?d=fir.gov.in

# Check security headers
curl -I https://fir.gov.in
```

---

## 🚨 Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# View logs
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

### Application Errors
```bash
# PM2 logs
pm2 logs fir-backend
pm2 logs fir-frontend

# Restart services
pm2 restart all
```

### Nginx Issues
```bash
# Test configuration
sudo nginx -t

# View error logs
sudo tail -f /var/log/nginx/error.log
```

---

## 📈 Performance Optimization

### 1. Enable Caching

```nginx
# Add to nginx config
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 2. Database Optimization

```sql
-- Create indexes
CREATE INDEX idx_fir_status ON "FIR"(status);
CREATE INDEX idx_fir_created ON "FIR"("createdAt");
CREATE INDEX idx_audit_user ON "AuditLog"("userId");
```

### 3. PM2 Cluster Mode

```bash
pm2 start dist/server.js -i max --name fir-backend
```

---

## 🔄 Updates & Maintenance

### Updating Application

```bash
# Pull latest code
git pull origin main

# Backend
cd OnlineFirPortal.backend
npm install --production
npm run build
pm2 restart fir-backend

# Frontend
cd OnlineFirPortal.frontend
npm install --production
npm run build
pm2 restart fir-frontend
```

### Database Migrations

```bash
cd OnlineFirPortal.backend
npx prisma migrate deploy
```

---

## 📞 Support

For production issues:
- **Email:** devops@fir.gov.in
- **Phone:** 1800-XXX-XXXX
- **Escalation:** sysadmin@fir.gov.in

---

## ✅ Deployment Checklist

- [ ] Environment variables configured
- [ ] Database created and migrated
- [ ] SSL certificates installed
- [ ] Nginx configured and tested
- [ ] PM2 processes running
- [ ] Firewall rules applied
- [ ] Backup script scheduled
- [ ] Monitoring script scheduled
- [ ] Health checks passing
- [ ] User flows tested
- [ ] Security audit completed
- [ ] Documentation updated
- [ ] Team trained

**🎉 Ready for Production!**
