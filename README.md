# PDFly

An all-in-one, simple PDF toolkit. Sign up, upload a file, pick a tool —
merge, split, compress, convert, rotate, watermark, protect — and download
the result. Built with Next.js (App Router + TypeScript) and Supabase for
auth, storage, and history. Upgraded from the original Word2PDF project;
the original Word → PDF conversion still works unchanged.

**Live demo:** _add your URL after deployment_
**Repository:** _add your GitHub URL_

---

## 1. Features

- Email/password authentication (sign up, log in, log out, password reset) via Supabase Auth
- Protected dashboard, tool pages, file history, and profile — logged-out users are redirected to `/login`
- A searchable dashboard of PDF tools grouped by category
- 12 fully working tools (see below) plus clearly labeled "Coming Soon" tools — nothing fake
- Per-user file history ("My Files") with download and delete, protected by Supabase Row Level Security
- Original Word → PDF converter (`/api/convert`) preserved and still functional
- Clean, responsive, mobile-first SaaS UI (Tailwind CSS + Lucide icons)
- Production-ready for a single Ubuntu EC2 instance with PM2 + Nginx + HTTPS

## 2. Working Tools

| Tool | What it does |
| --- | --- |
| Word to PDF | Converts `.docx` to PDF (LibreOffice headless — original feature) |
| Merge PDF | Combines multiple PDFs into one |
| Split PDF | Extracts a page range (e.g. `1-3,5`) into a new PDF |
| Compress PDF | Reduces file size via Ghostscript (low/medium/high) |
| JPG to PDF | Combines JPG/PNG images into a PDF, one image per page |
| PDF to JPG | Rasterizes each page to JPG, delivered as a `.zip` |
| Rotate PDF | Rotates every page 90° / 180° / 270° |
| Watermark | Adds a diagonal text watermark to every page |
| Protect PDF | Password-encrypts a PDF (via `qpdf`) |
| Unlock PDF | Removes password protection given the current password (via `qpdf`) |
| Page Numbers | Adds "n / total" numbering to every page |
| Organize PDF | Reorders and/or drops pages via a page-order list (e.g. `3,1,2`) |

**Coming Soon** (shown in the dashboard, clearly labeled, no working upload form):
PDF to PowerPoint, PDF to Excel, PowerPoint to PDF, Excel to PDF, HTML to PDF,
PDF to Markdown, Crop PDF, Edit PDF, Sign PDF, PDF Forms, Redact PDF, OCR PDF,
Repair PDF, Compare PDF, PDF to PDF/A, AI Summarizer, Translate PDF, Scan to
PDF, Create a Workflow.

## 3. Tech Stack

| Layer           | Technology                                        |
| ---------------- | -------------------------------------------------- |
| Framework        | Next.js (App Router, TypeScript)                   |
| Styling          | Tailwind CSS                                       |
| Icons            | lucide-react                                       |
| Auth             | Supabase Auth (`@supabase/ssr`)                    |
| Database         | Supabase PostgreSQL (+ Row Level Security)         |
| File storage     | Supabase Storage                                   |
| PDF processing   | `pdf-lib` (merge/split/rotate/watermark/organize/page numbers/images) |
| System tools     | LibreOffice (Word→PDF), Ghostscript (compress), qpdf (protect/unlock), poppler-utils (PDF→JPG) |
| Zipping          | `jszip` (for multi-page JPG downloads)             |
| Process manager  | PM2                                                 |
| Reverse proxy    | Nginx                                               |
| SSL              | Let's Encrypt via Certbot                          |

## 4. Project Structure

```
pdfly/
├── middleware.ts               # Refreshes auth session + protects routes
├── app/
│   ├── api/
│   │   ├── convert/route.ts    # Legacy Word→PDF endpoint (unchanged, still works)
│   │   ├── tools/route.ts      # Unified endpoint for all working tools
│   │   └── health/route.ts     # Health check (LibreOffice + env vars)
│   ├── auth/callback/route.ts  # Supabase email confirmation / reset link handler
│   ├── login/, signup/, reset-password/, update-password/   # Auth pages
│   ├── dashboard/page.tsx      # Tool grid + search (protected)
│   ├── tools/[tool]/page.tsx   # Generic tool workspace or "Coming Soon" (protected)
│   ├── files/page.tsx          # "My Files" history (protected)
│   ├── profile/page.tsx        # Profile (protected)
│   └── page.tsx                # Public landing page
├── components/
│   ├── landing/                # Landing page sections
│   ├── auth/                    # Auth shell/layout
│   ├── dashboard/               # Header, tool cards, search
│   ├── files/                   # File history list
│   ├── tools/                   # ToolWorkspace (generic) + ComingSoon
│   └── ui/                      # Small shared UI (Alert)
├── lib/
│   ├── tools-config.ts         # Single source of truth for every tool
│   ├── pdf-tools.ts             # pdf-lib based operations
│   ├── system-tools.ts          # qpdf / ghostscript / pdftoppm wrappers
│   ├── convert.ts               # Original LibreOffice DOCX→PDF utility
│   ├── utils.ts                  # Filename sanitizing, size formatting, validation
│   └── supabase/
│       ├── client.ts             # Browser Supabase client
│       ├── server.ts             # Server client (RLS) + admin client (service role)
│       └── middleware.ts         # Session refresh + route protection helper
├── supabase/
│   ├── schema.sql               # Original schema (conversions table + buckets)
│   └── migration_v2.sql         # New: file_operations table, RLS, images bucket
├── ecosystem.config.js          # PM2 config
├── .env.example
└── README.md
```

## 5. Authentication

Implemented with Supabase Auth via `@supabase/ssr`:

- **Sign up** (`/signup`) — email + password, sends a confirmation email.
- **Log in** (`/login`) — email + password, friendly error messages.
- **Forgot password** (`/reset-password` → email link → `/update-password`).
- **Logout** — available from the dashboard header and profile page.
- **Route protection** — `middleware.ts` redirects unauthenticated users away
  from `/dashboard`, `/tools/*`, `/files`, and `/profile` to `/login`, and
  redirects logged-in users away from the auth pages to `/dashboard`.
- The `SUPABASE_SERVICE_ROLE_KEY` is only ever used inside Route Handlers
  (`lib/supabase/server.ts` → `getSupabaseAdmin()`), never in the browser.

## 6. Local Installation

Requirements: Node.js 18.18+ and, for full tool functionality, LibreOffice,
Ghostscript, qpdf, and poppler-utils installed locally (see section 9).

```bash
git clone <your-repo-url> pdfly
cd pdfly
npm install
cp .env.example .env.local
# fill in .env.local with your Supabase values (see section 8)
```

## 7. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com) (or reuse your
   existing Word2PDF project).
2. Open **SQL Editor** → **New query**, paste the contents of
   [`supabase/schema.sql`](./supabase/schema.sql), and click **Run**
   (skip if you already ran this for Word2PDF).
3. Run [`supabase/migration_v2.sql`](./supabase/migration_v2.sql) the same
   way — this adds the `file_operations` table, Row Level Security policies,
   and the `images` storage bucket used by the new tools.
4. If any bucket wasn't created by the SQL, create it manually under
   **Storage** → **New bucket**: `word-files`, `pdf-files`, `images` — all
   **private** (Public bucket off).
5. Under **Authentication** → **URL Configuration**, set the **Site URL** to
   your deployed URL (or `http://localhost:3000` for local dev) so
   confirmation/reset emails link back correctly.

## 8. Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
MAX_FILE_SIZE_MB=10
```

Get these from Supabase → **Project Settings** → **API**. Never commit
`.env.local` — it's already excluded in `.gitignore`.

## 9. System Dependencies (server-side tool binaries)

Several tools shell out to well-established command-line binaries instead of
reinventing PDF processing. Install these on your server (and locally if you
want to test them):

```bash
sudo apt update
sudo apt install -y libreoffice ghostscript qpdf poppler-utils
```

| Binary | Used by |
| --- | --- |
| `soffice` (LibreOffice) | Word to PDF |
| `gs` (Ghostscript) | Compress PDF |
| `qpdf` | Protect PDF, Unlock PDF |
| `pdftoppm` (poppler-utils) | PDF to JPG |

Check `/api/health` after starting the app — it reports whether LibreOffice
is available; you can extend it, but a quick manual check works too:

```bash
soffice --version && gs --version && qpdf --version && pdftoppm -v
```

Tools implemented purely in JavaScript (`pdf-lib`, `jszip`) — Merge, Split,
Rotate, Watermark, Page Numbers, Organize, JPG to PDF — need **no** extra
system binaries.

## 10. Running Locally

```bash
npm run dev
```

Visit `http://localhost:3000`. Sign up for an account, confirm your email
(check the Supabase Auth email logs if you haven't configured SMTP), log in,
and try a tool from the dashboard.

## 11. Building for Production

```bash
npm run build
npm start
```

## 12. PM2 Deployment

```bash
sudo npm install -g pm2
pm2 start ecosystem.config.js
pm2 status
pm2 logs pdfly
pm2 restart pdfly
pm2 stop pdfly
pm2 startup     # run the printed command once
pm2 save
```

**After every future `git pull` update:**
```bash
git pull
npm install
npm run build
pm2 restart pdfly
```

## 13. Nginx Configuration

Create `/etc/nginx/sites-available/pdfly`:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    client_max_body_size 15M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

```bash
sudo ln -s /etc/nginx/sites-available/pdfly /etc/nginx/sites-enabled/pdfly
sudo nginx -t
sudo systemctl reload nginx
```

Port 3000 stays internal — do not open it in your EC2 security group.

## 14. SSL with Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
sudo certbot renew --dry-run
```

Your site is now available at `https://your-domain.com`.

## 15. AWS EC2 Deployment (full walkthrough)

1. **Launch an EC2 instance** — Ubuntu Server 24.04 LTS, `t3.small` or
   larger recommended (LibreOffice/Ghostscript need a bit more headroom than
   a bare `t2.micro`). Security group: allow **22**, **80**, **443** only.

2. **SSH in**
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-public-ip
   ```

3. **Update packages**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

4. **Install Node.js (v20 LTS)**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs
   ```

5. **Install Git**
   ```bash
   sudo apt install -y git
   ```

6. **Install the PDF system tools** (see section 9)
   ```bash
   sudo apt install -y libreoffice ghostscript qpdf poppler-utils
   ```

7. **Install PM2**
   ```bash
   sudo npm install -g pm2
   ```

8. **Clone your GitHub repository**
   ```bash
   git clone https://github.com/your-username/pdfly.git
   cd pdfly
   ```

9. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   nano .env.local
   ```

10. **Install dependencies**
    ```bash
    npm install
    ```

11. **Build**
    ```bash
    npm run build
    ```

12. **Start with PM2**
    ```bash
    pm2 start ecosystem.config.js
    ```

13. **Configure PM2 startup**
    ```bash
    pm2 startup
    pm2 save
    ```

14. **Configure Nginx** — see section 13.

15. **Confirm EC2 security group** allows ports 22, 80, 443 only.

16. **Point your domain's DNS to the EC2 public IP** — see section 16.

17. **Install Certbot and enable HTTPS** — see section 14.

18. **Verify** — visit `https://your-domain.com`, sign up, and run a tool.

## 16. DNS / Custom Domain

| Type | Name  | Value               |
| ---- | ----- | -------------------- |
| A    | `@`   | `<EC2_PUBLIC_IP>`     |
| A    | `www` | `<EC2_PUBLIC_IP>`     |

For a subdomain instead (e.g. `app.yourdomain.com`), add an `A` record for
`app` pointing to the same IP. Exact steps depend on your DNS provider.

## 17. GitHub Deployment

```bash
git add .
git commit -m "Upgrade Word2PDF into PDFly: auth, dashboard, and full PDF toolkit"
git push
```

(If this is a brand-new repo instead of pushing to the existing Word2PDF
one, use `git init`, `git remote add origin ...`, `git push -u origin main`.)

`.env.local`, `node_modules`, and build artifacts are already excluded via
`.gitignore`.

## 18. Troubleshooting

| Problem | Fix |
| --- | --- |
| Redirected to `/login` even though I'm logged in | Confirm `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY` are correct and `middleware.ts` is present at the project root (not inside `app/`). |
| Signup succeeds but no confirmation email arrives | Check Supabase → Authentication → Logs, and confirm SMTP/Site URL settings under Authentication → URL Configuration. |
| A tool fails with "`X` is not installed on the server" | Install the missing binary from section 9 (`libreoffice`, `ghostscript`, `qpdf`, or `poppler-utils`). |
| "You must be logged in to use this tool." on `/api/tools` | The session cookie didn't reach the request — confirm you're not calling the API from a different origin, and that middleware is active. |
| File history is empty after a successful conversion | Check that `supabase/migration_v2.sql` ran successfully (creates `file_operations` + RLS policies). |
| Download/delete in "My Files" fails with a permissions error | Re-run `migration_v2.sql` — it creates the storage RLS policies that scope access to `<user_id>/...` paths. |
| 502 Bad Gateway from Nginx | The app isn't running — check `pm2 status` and `pm2 logs pdfly`. |
| HTTPS not working | Confirm DNS has propagated (`dig your-domain.com`) before running Certbot. |
| Changes not showing after `git pull` | Re-run `npm run build` and `pm2 restart pdfly`. |
| Legacy `/api/convert` behaves differently than the new Word to PDF tool | Both use the same `lib/convert.ts` LibreOffice utility; the legacy route just doesn't require login or write to `file_operations` — this is expected and intentional for backward compatibility. |

---

## License

This project was built as a student portfolio / internship assignment.
