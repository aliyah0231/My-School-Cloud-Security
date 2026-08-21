\# My-School Cloud Security



My-School adalah aplikasi administrasi sekolah berbasis web yang dikembangkan menggunakan React, Node.js/Express, PostgreSQL, Prisma, Docker, Nginx, dan Blockchain.



Project ini menerapkan keamanan pada sisi aplikasi dan infrastruktur, seperti Role-Based Access Control (RBAC), SHA-256, verifikasi dokumen berbasis blockchain, network segmentation, HTTPS/TLS, rate limiting, security headers, monitoring, serta backup dan recovery database.



\---



\## Fitur Utama



\- Autentikasi pengguna

\- Role-Based Access Control (RBAC)

\- Data siswa

\- Data guru

\- Mata pelajaran

\- Nilai siswa

\- Transkrip nilai

\- Kelulusan

\- Ijazah

\- Sertifikat PKL/Magang

\- Persetujuan dan penolakan dokumen

\- Verifikasi keaslian dokumen

\- Audit log

\- Integrasi Blockchain

\- SHA-256 Document Hashing



\---



\## Role Pengguna



Sistem memiliki beberapa role, antara lain:



\- SISWA

\- GURU

\- STAF\_TU

\- KEPALA\_SEKOLAH

\- MITRA\_INDUSTRI

\- ADMIN



Setiap role memiliki hak akses yang berbeda melalui mekanisme RBAC.



\---



\## Teknologi



\### Frontend



\- React

\- TypeScript

\- Vite

\- React Router

\- Axios

\- Lucide React



\### Backend



\- Node.js

\- Express

\- TypeScript

\- Prisma ORM

\- PostgreSQL

\- JWT

\- Argon2

\- Ethers.js



\### Blockchain



\- Solidity

\- Hardhat

\- Ganache

\- Ethers.js



\### Cloud Security / Infrastructure



\- Docker

\- Docker Compose

\- Nginx Reverse Proxy

\- Public \& Private Docker Network

\- HTTPS/TLS

\- Rate Limiting

\- Security Headers

\- PostgreSQL Private Container

\- Backup \& Recovery



\---



\## Arsitektur Sistem



```text

&#x20;                   USER / BROWSER

&#x20;                         |

&#x20;                         |

&#x20;                   HTTPS :8443

&#x20;                         |

&#x20;                         v

&#x20;                +------------------+

&#x20;                | FRONTEND / NGINX |

&#x20;                |  Security Layer  |

&#x20;                +--------+---------+

&#x20;                         |

&#x20;                    public\_net

&#x20;                         |

&#x20;                         v

&#x20;                +------------------+

&#x20;                |     BACKEND      |

&#x20;                | Express + RBAC   |

&#x20;                +--------+---------+

&#x20;                         |

&#x20;                    private\_net

&#x20;                         |

&#x20;                         v

&#x20;                +------------------+

&#x20;                |    PostgreSQL    |

&#x20;                | Private Database |

&#x20;                +------------------+

