# PDFly

**PDFly** is a simple, all-in-one online PDF toolkit for converting, managing,
editing, and processing PDF files from one place.

Users can create an account, choose a PDF tool, upload files, process them,
download the result, and manage their processed files from the **My Files**
section.

The project was originally started as a **Word2PDF** converter and was later
expanded into a complete PDF toolkit.

---

## 🌐 Live Demo

**Live Website:** Add your deployed website URL here

**GitHub Repository:** Add your GitHub repository URL here

---

## ✨ Features

PDFly provides a clean and simple interface for common PDF operations.

### 🔐 Authentication

- User Sign Up
- User Login
- User Logout
- Password Reset
- Password Update
- Supabase Authentication
- Protected dashboard and tool pages
- Protected file history
- User-specific data through Supabase Row Level Security (RLS)

### 📄 PDF Tools

PDFly currently includes multiple working PDF tools:

- Word to PDF
- PowerPoint to PDF
- Excel to PDF
- HTML to PDF
- PDF to Markdown
- Merge PDF
- Split PDF
- Compress PDF
- JPG to PDF
- PDF to JPG
- Scan to PDF
- Rotate PDF
- PDF to PDF/A
- Edit PDF
- Sign PDF
- Watermark PDF
- Protect PDF
- Unlock PDF
- Page Numbers
- Organize PDF

### 📁 My Files

The **My Files** section allows users to manage their previous file operations.

Users can:

- View previously processed files
- Download completed files
- Delete individual files
- Delete all files at once using **Clear All**
- See the tool used for each file
- See file processing status
- See the date and time of each operation

Each user's file history is protected so users can only access their own
records.

### 🔎 Dashboard

The dashboard provides:

- PDF tool categories
- Searchable tools
- Working tool cards
- Coming Soon tool cards
- Simple navigation
- Responsive layout

### 📱 Responsive UI

PDFly is designed to work across:

- Desktop
- Laptop
- Tablet
- Mobile

The interface uses Tailwind CSS and Lucide icons for a clean and modern
experience.

---

# 🛠️ Working Tools

The following tools are currently implemented and functional.

| Tool | Description |
|---|---|
| **Word to PDF** | Converts `.docx` files into PDF using LibreOffice |
| **Merge PDF** | Combines multiple PDF files into a single PDF |
| **Split PDF** | Extracts selected pages/ranges from a PDF |
| **Compress PDF** | Reduces PDF file size using Ghostscript |
| **JPG to PDF** | Converts JPG/PNG images into a PDF |
| **PDF to JPG** | Converts PDF pages into JPG images and provides them as a ZIP file |
| **Rotate PDF** | Rotates PDF pages by 90°, 180°, or 270° |
| **Watermark PDF** | Adds a text watermark to PDF pages |
| **Protect PDF** | Password-protects a PDF using qpdf |
| **Unlock PDF** | Removes password protection when the current password is provided |
| **Page Numbers** | Adds page numbers to PDF pages |
| **Organize PDF** | Reorders or removes pages using a page-order list |

---

# 🚧 Coming Soon Tools

The dashboard also contains clearly labelled **Coming Soon** tools.

These are intentionally not presented as working features.

Planned tools include:

- PDF to PowerPoint
- PDF to Excel
- Crop PDF
- PDF Forms
- Redact PDF
- OCR PDF
- Repair PDF
- Compare PDF
- AI Summarizer
- Translate PDF
- Create a Workflow

---

# 🧑‍💻 How to Use PDFly

Using PDFly is simple.

## Step 1 — Create an Account

Open the PDFly website and click:

**Sign Up**

Enter:

- Email
- Password

Complete the email confirmation if enabled.

---

## Step 2 — Login

After creating your account, log in using your email and password.

You will be redirected to the dashboard.

---

## Step 3 — Choose a Tool

From the dashboard, select the PDF tool you want to use.

For example:

- Word to PDF
- Merge PDF
- Split PDF
- Compress PDF
- JPG to PDF
- PDF to JPG
- Rotate PDF
- Watermark PDF
- Protect PDF
- Unlock PDF
- Page Numbers
- Organize PDF

You can also use the dashboard search to find a tool quickly.

---

## Step 4 — Upload Your File

Open the required tool and upload the file or files needed for that operation.

The tool validates the uploaded files before processing them.

---

## Step 5 — Process the File

Click the appropriate action button to start processing.

PDFly processes the file on the server using the required PDF libraries or
system utilities.

---

## Step 6 — Download the Result

After successful processing, download the generated file.

The operation is also saved in your **My Files** section.

---

# 📁 Managing Files

Open:

**Dashboard → My Files**

The My Files section shows your recent file operations.

For each file, you can see:

- Original filename
- Tool used
- Processing status
- Date and time

### Download

Click the download button to generate a secure temporary download link for
the processed file.

### Delete One File

Click the trash/delete button next to a file.

You will be asked for confirmation before the file is deleted.

### Clear All

Use the **Clear All** button to remove all currently displayed file history
records and their associated output files.

This action requires confirmation before deletion.

> **Warning:** Clear All permanently removes the selected user's file
> records and associated stored output files. It cannot be undone.

---

# 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 |
| Language | TypeScript |
| Routing | Next.js App Router |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Authentication | Supabase Auth |
| Database | Supabase PostgreSQL |
| Database Security | Supabase Row Level Security |
| File Storage | Supabase Storage |
| PDF Processing | pdf-lib |
| Word → PDF | LibreOffice |
| PDF Compression | Ghostscript |
| PDF Security | qpdf |
| PDF → JPG | poppler-utils |
| ZIP Creation | JSZip |
| Process Manager | PM2 |
| Reverse Proxy | Nginx |
| SSL | Let's Encrypt + Certbot |
| Hosting | AWS EC2 |

---

# 🏗️ Project Architecture

PDFly uses a Next.js App Router architecture.

```text
User
 │
 ▼
Next.js Frontend
 │
 ├── Authentication ──────► Supabase Auth
 │
 ├── Dashboard
 │
 ├── PDF Tools
 │      │
 │      ├── pdf-lib
 │      ├── LibreOffice
 │      ├── Ghostscript
 │      ├── qpdf
 │      └── poppler-utils
 │
 ├── My Files
 │      │
 │      ├── Supabase PostgreSQL
 │      └── Supabase Storage
 │
 └── API Route Handlers
        │
        ▼
     Server-side Processing

 ``` 

---

# 📂 Project Structure
```
pdfly/
├── app/
│   ├── api/
│   │   ├── convert/
│   │   │   └── route.ts
│   │   ├── tools/
│   │   │   └── route.ts
│   │   └── health/
│   │       └── route.ts
│   │
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts
│   │
│   ├── dashboard/
│   │   └── page.tsx
│   │
│   ├── files/
│   │   └── page.tsx
│   │
│   ├── profile/
│   │   └── page.tsx
│   │
│   ├── tools/
│   │   └── [tool]/
│   │       └── page.tsx
│   │
│   ├── login/
│   ├── signup/
│   ├── reset-password/
│   ├── update-password/
│   │
│   └── page.tsx
│
├── components/
│   ├── auth/
│   ├── dashboard/
│   ├── files/
│   ├── landing/
│   ├── tools/
│   └── ui/
│
├── lib/
│   ├── convert.ts
│   ├── pdf-tools.ts
│   ├── system-tools.ts
│   ├── tools-config.ts
│   ├── utils.ts
│   │
│   └── supabase/
│       ├── client.ts
│       ├── server.ts
│       └── middleware.ts
│
├── supabase/
│   ├── schema.sql
│   └── migration_v2.sql
│
├── ecosystem.config.js
├── middleware.ts
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

# 🔐 Authentication

Authentication is implemented using **Supabase Auth**.

PDFly provides the following authentication features:

- Sign Up
- Login
- Logout
- Password Reset
- Password Update
- Email Confirmation
- Protected Routes

The following areas require authentication:

```text
/dashboard
/tools/*
/files
/profile
```

Unauthenticated users are automatically redirected to the login page.

Authenticated users are redirected to the dashboard when they try to access
authentication pages unnecessarily.

---

# 🗃️ Database & File Storage

PDFly uses Supabase for both database functionality and file storage.

## Database

The application stores file operation history in:

```
file_operations
```

The table stores information such as:

- File ID
- Original filename
- Output file path
- Tool name
- Processing status
- Created date
- User ownership

---

# Storage Buckets

PDFly uses private Supabase Storage buckets.

Typical buckets include:

```
word-files
pdf-files
images
```

The application generates signed URLs when users download files instead of
making the stored files publicly accessible.

---

# 🛡️ Security

PDFly uses several security measures.

## Supabase Row Level Security

Database records are protected using Supabase RLS.

Users can only access their own file operation records.

## Private Storage

Files are stored in private Supabase Storage buckets.

## Signed Downloads

Download links are generated temporarily using signed URLs.

## Service Role Key

The Supabase service role key is used only on the server.

It must never be exposed in client-side code.

## Environment Variables

Sensitive configuration is stored in `.env.local.`

`.env.local` must never be committed to GitHub.

---

# ⚙️ Requirements

For local development you should have:

- Node.js 18.18 or newer
- npm
- Git
- Supabase project

For all PDF tools to work, install:

- LibreOffice
- Ghostscript
- qpdf
- poppler-utils

---

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
