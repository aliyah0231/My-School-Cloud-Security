# My-School Cloud Security

## Perancangan Arsitektur Cloud Security Berbasis Zero Trust dan Integrasi Blockchain untuk Keabsahan Ijazah serta Transkrip Nilai pada Sistem Informasi Administrasi SMK

**My-School Cloud Security** adalah aplikasi administrasi sekolah berbasis web yang menggabungkan pengelolaan data akademik dengan penerapan keamanan berlapis pada sisi identitas, aplikasi, jaringan, data, secret management, dan blockchain.

Repository ini merupakan **prototype lokal** yang dikembangkan menggunakan Docker, PostgreSQL, HashiCorp Vault, ModSecurity + OWASP Core Rule Set, dan Ganache. Arsitektur AWS/GCP yang dibahas pada laporan merupakan **target architecture**, bukan deployment cloud production yang sudah dilakukan.

> **Security Notice**  
> Repository hanya menyimpan source code dan file konfigurasi yang aman untuk dibagikan. Credential, private key, Vault token, OTP, certificate lokal, backup database, cookie, dan file secret lainnya **tidak boleh disimpan di GitHub**.

---

## Tujuan Project

Project ini dikembangkan untuk menerapkan beberapa konsep utama Cloud Security Architecture, yaitu:

- Zero Trust Architecture
- Identity and Access Management
- Role-Based Access Control
- Multi-Factor Authentication
- Web Application Firewall
- HTTPS / TLS
- Network Segmentation
- Encryption at Rest
- Secret Management
- Rate Limiting
- Security Headers
- Blockchain Document Verification
- Blockchain Audit Trail
- Digital Signature DUDI
- Security Testing
- Backup dan Disaster Recovery

---

## Fitur Utama

### Administrasi Akademik

- Autentikasi pengguna
- Pengelolaan data siswa
- Pengelolaan data guru
- Pengelolaan mata pelajaran
- Pengelolaan nilai
- Transkrip nilai
- Kelulusan
- Ijazah
- Sertifikat PKL
- Audit log

### Security

- Role-Based Access Control (RBAC)
- Multi-Factor Authentication (MFA)
- Google Authenticator / TOTP
- HTTP-only authentication cookie
- AES-256-GCM encryption untuk MFA secret
- HashiCorp Vault secret management
- ModSecurity Web Application Firewall
- OWASP Core Rule Set 3.3.10
- HTTPS / TLS
- Security Headers
- Rate Limiting
- Docker Network Segmentation
- Git Secret Hygiene
- PostgreSQL Backup & Recovery

### Blockchain

- SHA-256 document hashing
- Registrasi hash dokumen ke blockchain
- Verifikasi integritas dokumen
- Blockchain transcript verification
- Grade blockchain audit
- Digital Signature DUDI
- Smart Contract `DocumentRegistry`
- Hardhat security testing
- Slither static analysis

---

## Role Pengguna

Sistem menyediakan role berikut:

| Role | Hak Akses Utama |
|---|---|
| `ADMIN` | Role teknis/administratif pada aplikasi |
| `STAF_TU` | Mengelola administrasi akademik dan fungsi tertentu yang membutuhkan kewenangan administratif |
| `GURU` | Mengelola nilai sesuai kewenangan |
| `SISWA` | Melihat data akademik milik sendiri |
| `KEPALA_SEKOLAH` | Verifikasi dan fungsi administrasi tertentu sesuai kewenangan |
| `MITRA_INDUSTRI` / `DUDI` | Fungsi terkait sertifikat PKL dan verifikasi mitra |

Hak akses diterapkan pada **backend**, bukan hanya dengan menyembunyikan menu pada frontend.

Contoh hasil pengujian RBAC:

```text
SISWA
PUT /api/grades/:gradeId
-> 403 Forbidden

STAF_TU setelah MFA
PUT /api/grades/:gradeId
-> 200 OK
```

---

## Teknologi

### Frontend

- React
- TypeScript
- Vite
- React Router
- Axios
- Lucide React
- Nginx

### Backend

- Node.js
- Express
- TypeScript
- Prisma ORM
- JWT
- Argon2
- Ethers.js
- AES-256-GCM

### Database

- PostgreSQL 17

### Blockchain

- Solidity 0.8.28
- Hardhat
- Ganache
- Ethers.js
- SHA-256

### Infrastructure & Security

- Docker
- Docker Compose
- HashiCorp Vault
- ModSecurity
- OWASP Core Rule Set
- Nginx
- HTTPS / TLS
- Docker Public & Private Network
- Rate Limiting
- Security Headers
- Request Filtering
- OWASP ZAP
- Slither
- Database Backup & Recovery

---

# Arsitektur Sistem

## Prototype Lokal

```text
                        USER / BROWSER
                              |
                         HTTPS :8443
                              |
                              v
                    +--------------------+
                    | WAF / MODSECURITY  |
                    | OWASP CORE RULE SET|
                    +----------+---------+
                               |
                           public_net
                               |
                 +-------------+-------------+
                 |                           |
                 v                           v
        +------------------+        +------------------+
        | FRONTEND / NGINX |        | BACKEND / API    |
        | Internal HTTP    |        | Express :4000    |
        +------------------+        +--------+---------+
                                            |
                                        private_net
                              +-------------+-------------+
                              |                           |
                              v                           v
                    +------------------+        +------------------+
                    | PostgreSQL       |        | HashiCorp Vault  |
                    | Private Database |        | Secret Storage   |
                    +------------------+        +------------------+

Backend
   |
   | JSON-RPC
   v
Ganache
   |
   v
DocumentRegistry Smart Contract
```

### Segmentasi Jaringan

`public_net`:

- `smk_waf`
- `smk_frontend`
- `smk_backend`

`private_net`:

- `smk_backend`
- `smk_postgres`
- `smk_vault`

Backend berada pada kedua network karena menjadi penghubung antara application layer dan data layer.

PostgreSQL dan Vault tidak dipublikasikan langsung ke host.

---

## Target Cloud Architecture

Pada production, desain ini dapat dipetakan ke AWS atau Google Cloud Platform.

| Fungsi | AWS | Google Cloud |
|---|---|---|
| WAF / Edge Security | AWS WAF + AWS Shield | Google Cloud Armor |
| IAM | AWS IAM + IAM Identity Center | Google Cloud IAM |
| Compute | EKS / Fargate | GKE / Cloud Run |
| Database | Aurora PostgreSQL | Cloud SQL PostgreSQL |
| Object Storage | S3 Object Lock | Cloud Storage Retention Policy |
| Key Management | AWS KMS / CloudHSM | Google Cloud KMS |
| Audit & Monitoring | CloudTrail + GuardDuty | Cloud Audit Logs + Security Command Center |

> Komponen pada tabel di atas merupakan **rancangan target** dan belum diklaim sebagai implementasi cloud production pada repository ini.

---

# Struktur Project

```text
My-School/
├── backend/
│   ├── blockchain/
│   │   ├── contracts/
│   │   │   └── DocumentRegistry.sol
│   │   ├── test/
│   │   │   └── SecurityTests.ts
│   │   └── slither-report.json
│   │
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   │
│   ├── scripts/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── validators/
│   │   └── bootstrap.ts
│   │
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── docker-compose.yml
├── docker-compose.before-waf.yml
├── .env.example
├── .gitignore
└── README.md
```

---

# Zero Trust Model

Project menerapkan konsep Zero Trust berdasarkan prinsip:

- **Verify Explicitly**
- **Least Privilege**
- **Assume Breach**

Keberhasilan login tidak langsung memberikan akses ke seluruh fungsi.

Alur akses:

```text
User
 |
 v
Username + Password
 |
 v
Authentication
 |
 +---- jika MFA aktif ----> OTP Verification
 |                              |
 |                              v
 +------------------------> Session / Cookie
                                |
                                v
                          Role Verification
                                |
                    +-----------+-----------+
                    |                       |
                  Allowed                Denied
                    |                       |
                  200 OK              403 Forbidden
```

---

# Multi-Factor Authentication

Akun administratif mendukung MFA berbasis Google Authenticator / TOTP.

Ketika MFA aktif:

1. Username dan password diverifikasi.
2. Sistem belum membuat session autentikasi penuh.
3. Backend meminta OTP.
4. Setelah OTP valid, session autentikasi dibuat.
5. User kemudian dapat mengakses endpoint sesuai role.

MFA secret disimpan secara terenkripsi menggunakan:

```text
AES-256-GCM
```

Format ciphertext internal:

```text
enc:v1:<iv>:<tag>:<ciphertext>
```

> Jangan pernah menampilkan OTP atau MFA secret asli pada dokumentasi publik.

---

# Secret Management

HashiCorp Vault digunakan pada prototype lokal untuk mengelola beberapa secret aplikasi.

Backend memuat:

- JWT secret
- Cookie secret
- Blockchain private key
- DUDI signer private key
- Data encryption key

Vault pada project ini masih menggunakan **development mode**.

Untuk production direkomendasikan menggunakan:

- HashiCorp Vault production mode
- AWS KMS / CloudHSM
- Google Cloud KMS
- External signing service

---

# Git Secret Hygiene

File sensitif tidak boleh ikut masuk repository.

Contoh:

```text
.env
.env.docker
secrets/vault_token.txt
secrets/jwt_secret.txt
secrets/cookie_secret.txt
secrets/blockchain_private_key.txt
secrets/dudi_signer_private_key.txt
secrets/data_encryption_key.txt
*.key
backup/
postgres-data/
backend/uploads/
*cookies*.txt
```

Periksa file yang di-ignore:

```powershell
git check-ignore `
  .env.docker `
  secrets/vault_token.txt `
  secrets/jwt_secret.txt `
  secrets/cookie_secret.txt `
  secrets/blockchain_private_key.txt `
  secrets/dudi_signer_private_key.txt `
  secrets/data_encryption_key.txt
```

Periksa apakah secret ter-track oleh Git:

```powershell
git ls-files |
Select-String `
  "vault_token|jwt_secret|cookie_secret|blockchain_private_key|dudi_signer_private_key|data_encryption_key|\.env"
```

Yang boleh berada di repository adalah template seperti:

```text
.env.example
```

tanpa nilai credential sebenarnya.

---

# HTTPS / TLS

Akses utama prototype:

```text
https://localhost:8443
```

WAF menjadi TLS termination point pada prototype lokal.

Konfigurasi mendukung TLS 1.2 dan TLS 1.3.

Certificate yang digunakan pada development bersifat self-signed, sehingga browser dapat memberikan peringatan certificate.

---

# Security Headers

Response aplikasi menggunakan beberapa header keamanan:

- `Content-Security-Policy`
- `Strict-Transport-Security`
- `X-Frame-Options`
- `X-Content-Type-Options`
- `Referrer-Policy`
- `Permissions-Policy`
- `Cross-Origin-Opener-Policy`
- `Cross-Origin-Embedder-Policy`
- `Cross-Origin-Resource-Policy`

Security headers digunakan sebagai defense-in-depth pada browser.

---

# Web Application Firewall

Prototype menggunakan:

```text
owasp/modsecurity-crs:nginx
```

dengan:

```text
ModSecurity
OWASP Core Rule Set 3.3.10
```

WAF menjadi jalur masuk utama ke aplikasi.

Port host:

```text
HTTP  :8080
HTTPS :8443
```

Hasil pengujian:

| Security Test | Hasil |
|---|---|
| SQL Injection | 403 Forbidden |
| XSS | 403 Forbidden |
| Path Traversal | 403 Forbidden |
| Excessive Request | 429 Too Many Requests |

---

# Rate Limiting

Request berlebihan dibatasi oleh sistem.

Contoh hasil pengujian:

```text
200
200
200
...
429 Too Many Requests
```

Rate limiting membantu mengurangi abuse pada API.

Pada environment cloud production, kontrol ini dapat dilengkapi dengan managed DDoS protection seperti AWS Shield atau Google Cloud Armor.

---

# Blockchain Architecture

Prototype menggunakan Ganache sebagai private Ethereum development network.

```text
Chain ID: 1337
```

Alur komunikasi:

```text
Backend
   |
   | JSON-RPC
   v
Ganache
   |
   v
DocumentRegistry
```

Ganache digunakan untuk membuktikan konsep registrasi hash, verifikasi dokumen, transcript verification, grade audit, dan digital signature.

Prototype saat ini belum merupakan consortium blockchain multi-node.

---

# Smart Contract DocumentRegistry

Smart contract:

```text
backend/blockchain/contracts/DocumentRegistry.sol
```

Fungsi utama:

```solidity
registerDocument(...)
verifyDocument(...)
getDocument(...)
```

Kontrol yang diterapkan:

- `onlyOwner`
- Duplicate verification code protection
- Duplicate document hash protection
- Timestamp metadata
- Hash-based integrity checking

Contract tidak menyimpan file PDF secara langsung.

Data yang dicatat berupa hash dan metadata yang diperlukan untuk verifikasi.

---

# Document Verification

Alur registrasi:

```text
Document
   |
   v
SHA-256
   |
   v
Backend
   |
   v
DocumentRegistry
   |
   v
Blockchain Transaction
```

Alur verifikasi:

```text
Document
   |
   v
Calculate SHA-256
   |
   v
Compare with Blockchain Hash
   |
   +---- Same ------> VALID
   |
   +---- Different -> INVALID / FALSIFIED
```

Perubahan sekecil apa pun pada isi dokumen menghasilkan hash yang berbeda.

---

# Blockchain Transcript

Data transkrip yang telah disetujui dibentuk menjadi canonical data kemudian dihitung hash-nya.

Sistem dapat:

- Mendaftarkan hash transcript ke blockchain
- Menyimpan verification code
- Menyimpan transaction hash
- Melakukan verifikasi transcript
- Menampilkan status VALID atau tidak sesuai berdasarkan perbandingan hash

---

# Grade Blockchain Audit

Perubahan nilai oleh role yang berwenang menghasilkan audit blockchain.

Contoh endpoint:

```text
PUT /api/grades/:gradeId
```

Audit dapat mencatat:

- Verification code
- SHA-256 audit hash
- Transaction hash
- Grade ID
- Nilai sebelum perubahan
- Nilai setelah perubahan
- Audit log

Contoh pengujian:

```text
SISWA
-> 403 Forbidden

STAF_TU + MFA
-> 200 OK
-> Grade updated
-> Blockchain audit recorded
```

---

# DUDI Digital Signature

Sertifikat PKL mendukung:

- Upload certificate
- SHA-256 certificate hash
- Digital signature
- Signer / wallet ID
- File integrity verification
- Blockchain verification

Pada prototype:

```text
Digital Signature : VALID
File Integrity    : VALID
Blockchain        : VALID
```

Signer DUDI saat ini masih merupakan **server-side signer prototype**.

Pada production, direkomendasikan menggunakan external DUDI wallet atau signing service berbasis KMS/HSM.

---

# Hardhat Security Tests

Test smart contract:

```powershell
cd backend\blockchain
npx hardhat test
```

Hasil implementasi saat ini:

```text
7 passing
```

Test mencakup:

1. Registrasi dokumen
2. Verifikasi dokumen valid
3. Penolakan hash berbeda
4. Penolakan unauthorized wallet
5. Penolakan duplicate verification code
6. Penolakan duplicate document hash
7. Pemeriksaan bahwa contract tidak memiliki alur Ether/payable yang menambah attack surface reentrancy berbasis Ether

---

# Slither Static Analysis

Static analysis dilakukan menggunakan Slither.

Report:

```text
backend/blockchain/slither-report.json
```

Report berhasil dibuat dengan:

```text
success: true
error: null
```

Beberapa catatan desain yang dianalisis meliputi:

- Hash equality
- Timestamp metadata
- Rekomendasi terkait owner
- Attack surface smart contract

Tidak ada klaim bahwa smart contract bebas dari seluruh kemungkinan vulnerability.

---

# OWASP ZAP

OWASP ZAP digunakan untuk melakukan pengujian aplikasi web.

Pengujian dilakukan sebelum dan setelah hardening.

Hasil after-hardening yang dibahas pada project masih memiliki:

```text
1 Medium
3 Informational
```

Temuan yang tersisa antara lain berkaitan dengan:

- CSP `style-src unsafe-inline`
- Suspicious Comments
- Modern Web Application
- Non-Storable Content

Temuan tersebut tetap dicatat sebagai rekomendasi perbaikan.

---

# Backup dan Disaster Recovery

PostgreSQL backup dibuat menggunakan `pg_dump`.

Contoh:

```powershell
docker exec smk_postgres pg_dump `
  -U postgres `
  -d smk_administrasi `
  -Fc `
  -f /tmp/smk_backup.dump
```

Copy backup ke host:

```powershell
docker cp smk_postgres:/tmp/smk_backup.dump .\smk_backup.dump
```

Backup dapat direstore ke database terpisah:

```powershell
docker exec smk_postgres createdb `
  -U postgres `
  smk_restore_test
```

Kemudian jalankan `pg_restore` terhadap database uji tersebut.

Restore sebaiknya diuji pada database terpisah terlebih dahulu agar database utama tidak terganggu.

---

# Menjalankan Project

## 1. Persyaratan

Pastikan komputer memiliki:

- Git
- Docker Desktop
- WSL 2 pada Windows
- Node.js jika ingin menjalankan service di luar Docker
- Ganache

---

## 2. Clone Repository

```bash
git clone https://github.com/aliyah0231/My-School-Cloud-Security.git
cd My-School-Cloud-Security
```

---

## 3. Environment Variables

Gunakan:

```text
.env.example
```

sebagai referensi.

Buat environment lokal sendiri sesuai kebutuhan.

Jangan commit nilai asli seperti:

- Database password
- JWT secret
- Cookie secret
- Blockchain private key
- DUDI signing key
- Vault token
- Encryption key

---

## 4. Jalankan Ganache

Gunakan Ganache lokal sesuai konfigurasi environment project.

Prototype menggunakan Chain ID:

```text
1337
```

---

## 5. Jalankan Docker

```bash
docker compose up -d
```

Periksa container:

```bash
docker compose ps
```

Service utama:

```text
smk_waf
smk_frontend
smk_backend
smk_postgres
smk_vault
```

---

## 6. Mengakses Aplikasi

```text
https://localhost:8443
```

Karena development menggunakan self-signed certificate, browser dapat menampilkan certificate warning.

---

# Monitoring & Logs

Status container:

```bash
docker compose ps
```

Semua container:

```bash
docker compose ps -a
```

Resource usage:

```bash
docker stats
```

Backend:

```bash
docker logs smk_backend --tail 100
```

WAF:

```bash
docker logs smk_waf --tail 100
```

Frontend:

```bash
docker logs smk_frontend --tail 100
```

PostgreSQL:

```bash
docker logs smk_postgres --tail 100
```

Vault:

```bash
docker logs smk_vault --tail 100
```

---

# Network Inspection

```bash
docker network inspect my-school_public_net
docker network inspect my-school_private_net
```

Hal yang perlu diperiksa:

- PostgreSQL hanya berada pada private network
- Vault hanya berada pada private network
- Backend dapat berkomunikasi dengan private services
- Frontend tidak mengakses database secara langsung

---

# Troubleshooting

## Docker tidak berjalan

```bash
docker info
```

Pastikan Docker Desktop sudah aktif.

## Container berhenti

```bash
docker compose ps -a
```

Kemudian periksa log service terkait.

## Tes HTTPS

```bash
curl -k -I https://localhost:8443
```

## Tes konfigurasi Nginx

```bash
docker exec smk_frontend nginx -t
```

## Restart Project

```bash
docker compose down
docker compose up -d
```

> Hindari `docker compose down -v` jika tidak bermaksud menghapus volume database.

---

# Status Implementasi

## Application

- [x] React frontend
- [x] Express backend
- [x] PostgreSQL
- [x] Prisma ORM
- [x] Authentication
- [x] Argon2 password hashing
- [x] RBAC
- [x] Audit logging

## Zero Trust & Identity

- [x] Backend role authorization
- [x] Least privilege
- [x] MFA Google Authenticator / TOTP
- [x] HTTP-only authentication cookie
- [x] SISWA restricted endpoint -> 403
- [x] Authorized STAF_TU endpoint -> 200

## Data & Secrets

- [x] AES-256-GCM encryption untuk MFA secret
- [x] HashiCorp Vault prototype
- [x] Git secret hygiene
- [ ] Full PostgreSQL/storage encryption at rest
- [ ] Production Cloud KMS / HSM

## Network & Web Security

- [x] Docker containerization
- [x] Public/private network segmentation
- [x] PostgreSQL tidak dipublikasikan langsung
- [x] Vault pada private network
- [x] WAF ModSecurity
- [x] OWASP CRS 3.3.10
- [x] HTTPS/TLS lokal
- [x] Security headers
- [x] Rate limiting
- [x] SQL Injection blocking
- [x] XSS blocking
- [x] Path Traversal blocking

## Blockchain

- [x] Ganache private development network
- [x] Solidity DocumentRegistry
- [x] SHA-256 document hashing
- [x] Document blockchain verification
- [x] Transcript blockchain verification
- [x] Grade blockchain audit
- [x] DUDI digital signature prototype
- [x] Unauthorized wallet protection
- [x] Duplicate verification code protection
- [x] Duplicate document hash protection

## Security Testing

- [x] Hardhat security test
- [x] 7 passing
- [x] Slither static analysis
- [x] OWASP ZAP
- [x] Document hash tampering test
- [ ] Prowler / Scout Suite cloud audit
- [ ] Dedicated front-running test

## Backup & Recovery

- [x] PostgreSQL backup
- [x] Backup file verification
- [x] Restore test
- [ ] Automated off-site production backup

---

# Batasan Prototype

Project ini merupakan prototype lokal dan belum merupakan production cloud deployment.

Belum diterapkan secara langsung:

- AWS/GCP production deployment
- AWS IAM / Google Cloud IAM
- AWS Shield / Google Cloud Armor production
- Cloud KMS / CloudHSM
- Full-volume database encryption
- Production HashiCorp Vault
- CloudTrail / GuardDuty
- Google Security Command Center
- Prowler
- Scout Suite
- Consortium blockchain multi-node
- External production DUDI wallet
- Dedicated smart contract front-running test

---

# Rekomendasi Pengembangan

Beberapa pengembangan berikutnya:

1. Deployment pada AWS atau GCP.
2. Membuat VPC dan subnet nyata.
3. Menggunakan managed WAF dan DDoS protection.
4. Menggunakan Cloud KMS / CloudHSM.
5. Menerapkan encryption at rest pada seluruh database/storage.
6. Menggunakan Vault production mode.
7. Mengganti self-signed TLS certificate dengan certificate dari trusted CA.
8. Menambahkan centralized logging dan security monitoring.
9. Menjalankan Prowler atau Scout Suite setelah cloud deployment tersedia.
10. Menggunakan external wallet DUDI.
11. Menambahkan pengujian front-running, replay, dan nonce.
12. Menjadwalkan backup otomatis dan restore drill secara berkala.
13. Menindaklanjuti alert OWASP ZAP yang masih tersisa.

---

# Ringkasan Hasil Pengujian

| Pengujian | Hasil |
|---|---|
| RBAC SISWA update nilai | 403 Forbidden |
| STAF_TU + MFA update nilai | 200 OK |
| HTTPS / TLS | Aktif |
| Security Headers | Aktif |
| SQL Injection | 403 Forbidden |
| XSS | 403 Forbidden |
| Path Traversal | 403 Forbidden |
| Rate Limiting | 429 Too Many Requests |
| Network Segmentation | Berhasil |
| Git Secret Hygiene | Berhasil |
| MFA Secret Encryption | AES-256-GCM |
| Vault Secret Loading | Berhasil |
| Hardhat | 7 Passing |
| Slither | Report berhasil |
| Document Hash Tampering | Perubahan terdeteksi |
| Blockchain Transcript | VALID ketika hash sesuai |
| Grade Blockchain Audit | Berhasil |
| DUDI Digital Signature | Berhasil pada prototype |
| PostgreSQL Backup | Berhasil |
| PostgreSQL Restore | Berhasil |

---

# Repository

**My-School Cloud Security**

GitHub:

```text
https://github.com/aliyah0231/My-School-Cloud-Security
```

---

# Catatan Akhir

My-School Cloud Security menunjukkan bahwa perlindungan sistem administrasi sekolah tidak cukup hanya menggunakan autentikasi username dan password.

Keamanan diterapkan secara berlapis melalui:

```text
Identity
   +
RBAC / MFA
   +
WAF / TLS
   +
Network Segmentation
   +
Encryption
   +
Secret Management
   +
Blockchain Integrity
   +
Security Testing
   +
Backup & Recovery
```

Dengan pendekatan tersebut, prototype dapat digunakan sebagai demonstrasi implementasi **Zero Trust dan Blockchain Security** pada sistem informasi administrasi sekolah.

---

## Disclaimer

Project ini dibuat untuk kepentingan akademik, pembelajaran, demonstrasi, dan pengujian pada environment yang memiliki izin. Jangan menggunakan source code atau konfigurasi pengujian keamanan pada sistem yang tidak memiliki izin.
