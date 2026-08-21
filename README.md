# My-School Cloud Security

**My-School Cloud Security** adalah aplikasi administrasi sekolah
berbasis web yang menggabungkan pengelolaan data akademik dengan
penerapan keamanan aplikasi, containerization, network segmentation,
HTTPS/TLS, serta verifikasi dokumen menggunakan blockchain.

> Repository ini menyimpan source code aplikasi. File yang mengandung
> credential, private key, sertifikat lokal, backup database, cookie,
> dan data lokal tidak disimpan di GitHub.

------------------------------------------------------------------------

## Fitur Utama

-   Autentikasi pengguna
-   Role-Based Access Control (RBAC)
-   Pengelolaan data siswa
-   Pengelolaan data guru
-   Pengelolaan mata pelajaran
-   Pengelolaan nilai
-   Transkrip nilai
-   Kelulusan
-   Ijazah
-   Sertifikat
-   Verifikasi keaslian dokumen
-   Audit log
-   SHA-256 document hashing
-   Integrasi blockchain
-   Rate limiting
-   Security headers
-   HTTPS/TLS
-   Docker network segmentation
-   Backup dan recovery PostgreSQL

## Role Pengguna

Sistem menyediakan beberapa role dengan hak akses berbeda:

-   `ADMIN`
-   `STAF_TU`
-   `GURU`
-   `SISWA`
-   `KEPALA_SEKOLAH`
-   `MITRA_INDUSTRI`

Hak akses setiap role dikendalikan melalui mekanisme **RBAC** pada
backend.

------------------------------------------------------------------------

## Teknologi

### Frontend

-   React
-   TypeScript
-   Vite
-   React Router
-   Axios
-   Lucide React
-   Nginx

### Backend

-   Node.js
-   Express
-   TypeScript
-   Prisma ORM
-   JWT
-   Argon2
-   Ethers.js

### Database

-   PostgreSQL 17

### Blockchain

-   Solidity
-   Hardhat
-   Ganache
-   Ethers.js

### Infrastructure & Security

-   Docker
-   Docker Compose
-   Nginx Reverse Proxy
-   HTTPS/TLS
-   Public & Private Docker Network
-   Rate Limiting
-   Security Headers
-   Request Filtering
-   Database Backup & Recovery

------------------------------------------------------------------------

## Arsitektur Sistem

``` text
                    USER / BROWSER
                          |
                      HTTPS :8443
                          |
                          v
                 +------------------+
                 | FRONTEND / NGINX |
                 |  Security Layer  |
                 +--------+---------+
                          |
                     public_net
                          |
                          v
                 +------------------+
                 |     BACKEND      |
                 | Express + RBAC   |
                 +--------+---------+
                          |
                     private_net
                          |
                          v
                 +------------------+
                 |    PostgreSQL    |
                 | Private Database |
                 +------------------+

Backend
   |
   +----> Blockchain / Ganache
           |
           +----> Document Hash Verification
```

Frontend tidak terhubung langsung ke PostgreSQL. Backend menjadi
penghubung antara application layer dan data layer.

------------------------------------------------------------------------

## Struktur Project

``` text
My-School/
├── backend/
│   ├── blockchain/
│   ├── prisma/
│   ├── src/
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
├── .env.example
├── .gitignore
└── README.md
```

------------------------------------------------------------------------

## Menjalankan Project

### 1. Persyaratan

Pastikan komputer memiliki:

-   Git
-   Docker Desktop
-   WSL 2 pada Windows
-   Node.js jika ingin menjalankan service tanpa Docker
-   Ganache jika menggunakan blockchain lokal

### 2. Clone Repository

``` bash
git clone https://github.com/aliyah0231/My-School-Cloud-Security.git
cd My-School-Cloud-Security
```

### 3. Siapkan Environment Variables

File environment asli sengaja tidak disimpan di repository.

Gunakan `.env.example` sebagai referensi dan buat konfigurasi lokal yang
dibutuhkan, misalnya `.env.docker`.

Contoh variabel:

``` env
NODE_ENV=development
PORT=4000

DATABASE_URL=

FRONTEND_URL=

JWT_SECRET=
JWT_EXPIRES_IN=8h
COOKIE_SECRET=

MAX_FILE_SIZE_MB=10

BLOCKCHAIN_RPC_URL=
BLOCKCHAIN_CONTRACT_ADDRESS=
BLOCKCHAIN_PRIVATE_KEY=
```

**Jangan commit nilai asli** untuk password database, JWT secret, cookie
secret, private key blockchain, atau credential lainnya.

------------------------------------------------------------------------

## Menjalankan dengan Docker

Pastikan Docker Desktop aktif, kemudian:

``` bash
docker compose up -d
```

Periksa container:

``` bash
docker compose ps
```

Service utama:

``` text
smk_frontend
smk_backend
smk_postgres
```

PostgreSQL seharusnya berstatus `healthy`.

Untuk melihat semua container termasuk yang berhenti:

``` bash
docker compose ps -a
```

------------------------------------------------------------------------

## Mengakses Aplikasi

Akses utama melalui HTTPS:

``` text
https://localhost:8443
```

HTTP lokal:

``` text
http://localhost:8080
```

Konfigurasi Nginx mengarahkan HTTP ke HTTPS.

> Pada development lokal, browser dapat menampilkan peringatan karena
> sertifikat HTTPS bersifat lokal/self-signed. Ini berbeda dengan
> sertifikat publik dari Certificate Authority.

------------------------------------------------------------------------

## Network Segmentation

Project menggunakan dua Docker network.

### `public_net`

Digunakan oleh:

-   Frontend / Nginx
-   Backend

### `private_net`

Digunakan oleh:

-   Backend
-   PostgreSQL

Database tidak diekspos langsung melalui frontend.

Untuk memeriksa network:

``` bash
docker network inspect my-school_public_net
docker network inspect my-school_private_net
```

------------------------------------------------------------------------

## Keamanan yang Diterapkan

### HTTPS/TLS

Nginx menyediakan endpoint HTTPS pada container dan host memetakan:

``` text
8443 -> 443
```

### Security Headers

Konfigurasi Nginx menggunakan header keamanan seperti:

-   `X-Frame-Options`
-   `X-Content-Type-Options`
-   `Referrer-Policy`
-   `Permissions-Policy`
-   `Content-Security-Policy`

### Rate Limiting

Request berlebihan dibatasi untuk membantu mengurangi abuse terhadap
API.

Pengujian dapat menghasilkan:

``` text
429 Too Many Requests
```

sesuai konfigurasi limit yang aktif.

### Request Filtering

Nginx dikonfigurasi untuk menolak pola request tertentu yang
mencurigakan, termasuk pola yang menyerupai:

-   SQL Injection
-   Cross-Site Scripting (XSS)
-   Path Traversal

Filtering di reverse proxy merupakan lapisan tambahan dan tidak
menggantikan validasi input serta keamanan pada backend.

### RBAC

Endpoint backend dilindungi berdasarkan role dan permission pengguna.

### Password & Authentication

Backend menggunakan JWT untuk autentikasi dan Argon2 untuk hashing
password.

------------------------------------------------------------------------

## Blockchain Document Verification

Sistem menggunakan SHA-256 dan blockchain untuk membantu memverifikasi
integritas dokumen.

Alur sederhananya:

``` text
Dokumen
   |
   v
SHA-256 Hash
   |
   +----> Database
   |
   +----> Blockchain
```

Saat dokumen diverifikasi, hash dapat dihitung kembali dan dibandingkan
dengan data referensi.

``` text
Hash sama    -> dokumen sesuai / valid
Hash berbeda -> dokumen berubah / tidak valid
```

Smart contract utama berada pada:

``` text
backend/blockchain/contracts/DocumentRegistry.sol
```

Untuk development lokal, blockchain dapat dijalankan menggunakan
Ganache.

------------------------------------------------------------------------

## Database PostgreSQL

Database berjalan sebagai container PostgreSQL pada private network.

Cek status:

``` bash
docker compose ps
```

Lihat log database:

``` bash
docker compose logs postgres
```

------------------------------------------------------------------------

## Backup Database

Backup database sebaiknya disimpan di luar GitHub.

Contoh konsep backup PostgreSQL:

``` bash
pg_dump -U postgres -F c -d smk_administrasi -f smk_administrasi.backup
```

Jika PostgreSQL hanya tersedia di dalam container, perintah dapat
disesuaikan dengan `docker exec`.

Project ini telah melakukan pengujian restore backup ke database uji dan
struktur database berhasil dipulihkan.

------------------------------------------------------------------------

## Restore Database

Contoh:

``` bash
pg_restore -U postgres -d smk_administrasi --no-owner --no-privileges smk_administrasi.backup
```

Sebelum melakukan restore ke database utama, disarankan menguji backup
pada database terpisah terlebih dahulu.

------------------------------------------------------------------------

## Monitoring & Logs

Status container:

``` bash
docker compose ps
```

Penggunaan CPU dan memory:

``` bash
docker stats
```

Backend:

``` bash
docker compose logs backend
```

Frontend / Nginx:

``` bash
docker compose logs frontend
```

PostgreSQL:

``` bash
docker compose logs postgres
```

Untuk log terbaru:

``` bash
docker compose logs backend --tail=100
docker compose logs frontend --tail=100
docker compose logs postgres --tail=100
```

------------------------------------------------------------------------

## Menghentikan Aplikasi

``` bash
docker compose down
```

Untuk menjalankan kembali:

``` bash
docker compose up -d
```

> Hindari `docker compose down -v` jika Anda tidak bermaksud menghapus
> Docker volume database.

------------------------------------------------------------------------

## Menjalankan Kembali di Komputer yang Sama

Jika source code, environment variables, certificate lokal, blockchain
lokal, dan Docker volume masih tersedia:

``` powershell
cd D:\My-School
docker compose up -d
docker compose ps
```

Kemudian buka:

``` text
https://localhost:8443
```

------------------------------------------------------------------------

## Menjalankan di Komputer Baru

Setelah clone dari GitHub, beberapa komponen lokal perlu disiapkan
kembali karena sengaja tidak disimpan di repository:

1.  Environment variables (`.env` / `.env.docker`)
2.  Password dan secret aplikasi
3.  Blockchain private key
4.  Blockchain RPC URL
5.  Contract address
6.  Ganache atau blockchain network yang digunakan
7.  Database atau file backup
8.  File upload lokal
9.  Sertifikat HTTPS lokal bila diperlukan

Setelah konfigurasi tersedia, jalankan:

``` bash
docker compose up -d
```

------------------------------------------------------------------------

## Troubleshooting

### Docker tidak berjalan

``` bash
docker info
```

Pastikan Docker Desktop sudah aktif.

### Container berhenti

``` bash
docker compose ps -a
```

Kemudian periksa service terkait:

``` bash
docker compose logs frontend --tail=100
docker compose logs backend --tail=100
docker compose logs postgres --tail=100
```

### Tes konfigurasi Nginx

``` bash
docker exec smk_frontend nginx -t
```

### Tes HTTPS

Pada development lokal:

``` bash
curl -k -I https://localhost:8443
```

### Restart seluruh service

``` bash
docker compose down
docker compose up -d
```

------------------------------------------------------------------------

## File yang Tidak Disimpan di GitHub

Untuk keamanan, repository mengabaikan file/data lokal seperti:

``` text
.env
.env.docker
*.key
frontend/certs/
backup/
postgres-data/
backend/uploads/
*cookies*.txt
node_modules/
dist/
```

Jangan menghapus aturan tersebut dari `.gitignore` tanpa memahami
risikonya.

------------------------------------------------------------------------

## Status Implementasi

Project mencakup:

-   [x] Frontend React
-   [x] Backend Express
-   [x] PostgreSQL
-   [x] Prisma ORM
-   [x] Authentication
-   [x] RBAC
-   [x] SHA-256 hashing
-   [x] Blockchain document verification
-   [x] Docker containerization
-   [x] Docker network segmentation
-   [x] Nginx reverse proxy
-   [x] HTTPS/TLS lokal
-   [x] Security headers
-   [x] Rate limiting
-   [x] Request filtering
-   [x] Audit logging
-   [x] Database backup
-   [x] Database restore testing
-   [x] Container monitoring

------------------------------------------------------------------------

## Repository

**My-School Cloud Security**

Repository GitHub: `aliyah0231/My-School-Cloud-Security`

------------------------------------------------------------------------

## Catatan

Repository ini ditujukan untuk pengembangan dan demonstrasi project
My-School Cloud Security. Konfigurasi production seperti domain publik,
trusted TLS certificate, secret management, firewall/cloud security
group, persistent production storage, serta deployment server perlu
disiapkan secara terpisah apabila aplikasi akan dipublikasikan.
