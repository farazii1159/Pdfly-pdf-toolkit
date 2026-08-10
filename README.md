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

**GitHub Repository:** https://github.com/farazii1159/Pdfly-pdf-toolkit

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
- Email confirmation
- Protected dashboard and tool pages
- Protected file history
- User-specific data through Supabase Row Level Security (RLS)

### 📄 Working PDF Tools

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
- OCR PDF
- Sign PDF
- Watermark PDF
- Protect PDF
- Unlock PDF
- Page Numbers
- Organize PDF
- Repair PDF

**Important:** PDFly uses both JavaScript/Node.js packages and server-sidecommand-line programs. Installing only npm packages is not enough forevery tool. See the Dependencies section below.

---

# 🧰 Tool → Dependency Map

This is the most important setup reference for developers and server
administrators.

| Tool | npm / Package Dependency | Server / System Dependency |
|---|---|---|
| **Word to PDF** | Node.js + project code | **LibreOffice** (`soffice`) |
| **PowerPoint to PDF** | Node.js + project code | **LibreOffice** (`soffice`) |
| **Excel to PDF** | Node.js + project code | **LibreOffice** (`soffice`) |
| **HTML to PDF** | **Puppeteer** | Puppeteer's browser; Linux may require browser libraries |
| **PDF to Markdown** | **pdf-parse** | **Poppler** (`pdftoppm`) + **Tesseract OCR** for scanned PDFs |
| **Merge PDF** | **pdf-lib** | None |
| **Split PDF** | **pdf-lib** | None |
| **Compress PDF** | Node.js + project code | **Ghostscript** (`gs`) |
| **JPG to PDF** | **pdf-lib** | None |
| **PDF to JPG** | Node.js + project code | **Poppler** (`pdftoppm`) |
| **Scan to PDF** | **pdf-lib** / tool-specific code | Depends on the scan implementation |
| **Rotate PDF** | **pdf-lib** | None |
| **PDF to PDF/A** | Node.js + project code | **Ghostscript** (`gs`) + Ghostscript PDF/A resources |
| **Edit PDF** | **pdf-lib** | None |
| **OCR PDF** | Node.js + project code | **OCRmyPDF** + **Tesseract OCR** + **Ghostscript** + **qpdf** + **Poppler** |
| **Sign PDF** | **pdf-lib**, **react-signature-canvas** | None |
| **Watermark PDF** | **pdf-lib** | None |
| **Protect PDF** | Node.js + project code | **qpdf** |
| **Unlock PDF** | Node.js + project code | **qpdf** |
| **Page Numbers** | **pdf-lib** | None |
| **Organize PDF** | **pdf-lib** | None |
| **Repair PDF** | Node.js + project code | **qpdf**, with **Ghostscript** fallback |

## Quick Summary

For **full PDFly functionality**, install these server-side programs:

1. **LibreOffice**
2. **Ghostscript**
3. **qpdf**
4. **Poppler / `pdftoppm`**
5. **Tesseract OCR**
6. **OCRmyPDF**

The project already installs the required JavaScript packages through:

```bash
npm install
```

---

# 📦 JavaScript / npm Dependencies

The main project dependencies are:

| Package | Purpose |
|---|---|
| `@supabase/ssr` | Supabase authentication/session handling in Next.js |
| `@supabase/supabase-js` | Supabase database, authentication, and storage access |
| `jszip` | ZIP/archive-related file processing |
| `lucide-react` | UI icons |
| `next` | Next.js application framework |
| `pdf-lib` | PDF creation and manipulation |
| `pdf-parse` | Extracting text from normal/selectable-text PDFs |
| `puppeteer` | HTML/browser rendering and HTML → PDF |
| `react` | React UI |
| `react-dom` | React DOM rendering |
| `react-signature-canvas` | Signature drawing/input UI |
| `tesseract.js` | Installed package; see OCR note below |

## OCR Note

The current server-side OCR implementations shown in this project use the
**Tesseract command-line program** and **OCRmyPDF**, not the `tesseract.js`
package.

Therefore, installing `tesseract.js` through npm does **not** replace the
server requirement for:

- Tesseract OCR
- OCRmyPDF
- Poppler
- Ghostscript
- qpdf

If `tesseract.js` is not imported anywhere else in the project, it can be
removed from `package.json` to avoid an unnecessary dependency.

---

# 🖥️ System Dependencies

PDFly calls several external programs from Node.js using `execFile`.

These programs are **not installed by** `npm install`.

## 1. LibreOffice

Used for:

- Word → PDF
- PowerPoint → PDF
- Excel → PDF

The application searches for:

```text
Windows: soffice.exe
Linux:   soffice
```

Check installation:

```bash
soffice --version
```

---

## 2. Ghostscript

Used for:

- Compress PDF
- PDF → PDF/A
- Repair PDF fallback
- OCR PDF processing through OCRmyPDF

Linux command:

```bash
gs --version
```

Windows command used by the project:

```bash
gswin64c --version
```

---

## 3. qpdf

Used for:

- Protect PDF
- Unlock PDF
- Repair PDF
- OCRmyPDF dependency

Check installation:

```bash
qpdf --version
```

---

## 4. Poppler / pdftoppm

Used for:

- PDF → JPG
- PDF → Markdown OCR fallback
- OCR-related PDF page rendering

Check installation:

```bash
pdftoppm -v
```

On Ubuntu, the executable is provided by:

```text
poppler-utils
```

---

## 5. Tesseract OCR

Used for:

- OCR PDF
- OCR fallback when PDF → Markdown receives a scanned PDF

Check installation:

```bash
tesseract --version
```

The current OCR code calls the system `tesseract` executable directly.

---

## 6. OCRmyPDF

Used for the dedicated **OCR PDF** tool.

Check installation:

```bash
ocrmypdf --version
```

OCRmyPDF requires a working OCR/PDF processing environment, including
Tesseract and other PDF utilities.

---

# 🐧 Ubuntu / AWS EC2 — Install All System Dependencies

For a complete PDFly installation on Ubuntu:

```bash
sudo apt update

sudo apt install -y \
  libreoffice \
  ghostscript \
  qpdf \
  poppler-utils \
  tesseract-ocr \
  ocrmypdf
```

Then verify:

```bash
soffice --version
gs --version
qpdf --version
pdftoppm -v
tesseract --version
ocrmypdf --version
```

If all commands return version information, the main external PDF processing
dependencies are available.

---

# 🪟 Windows — System Dependencies

For Windows development, install the following programs and make sure their
executables are available to the application.

| Program | Executable expected by PDFly |
|---|---|
| LibreOffice | `soffice.exe` |
| Ghostscript | `gswin64c.exe` |
| qpdf | `qpdf.exe` |
| Poppler | `pdftoppm.exe` |
| Tesseract OCR | `tesseract.exe` |
| OCRmyPDF | `ocrmypdf.exe` |

After installation, open a new terminal and verify:

```bash
soffice --version
gswin64c --version
qpdf --version
pdftoppm -v
tesseract --version
ocrmypdf --version
```

## Windows PATH

If a command is not recognized, its installation folder must be added to the
Windows **PATH** environment variable. Then restart the terminal or
application.

> **PDF/A note:** The current PDF/A implementation looks for Ghostscript's
> PDF/A definition and ICC profile resources. The configured paths must match
> the Ghostscript version installed on the machine. If Ghostscript is
> installed in a different location/version, update the paths in the PDF/A
> utility accordingly.

---

# 🧠 How OCR Works in PDFly

PDFly has two OCR-related flows.

## OCR PDF

The dedicated OCR tool uses:

```text
Input PDF
   ↓
OCRmyPDF
   ↓
Tesseract OCR
   ↓
Searchable PDF
```

This is useful for scanned/image-only documents because OCR adds a searchable
text layer.

## PDF → Markdown

PDFly first tries normal text extraction:

```text
PDF
 ↓
pdf-parse
 ↓
Text found?
 ├── Yes → Markdown
 └── No
      ↓
   pdftoppm
      ↓
   Page images
      ↓
   Tesseract OCR
      ↓
   Markdown
```

A normal text PDF does not need OCR for the first extraction path, while
scanned PDFs require Poppler and Tesseract.

---

# 📁 My Files

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

# 🛠️ Working Tools

PDFly currently provides the following working tools:

| Tool | Description |
|---|---|
| **Word to PDF** | Converts Word documents to PDF |
| **PowerPoint to PDF** | Converts PowerPoint presentations to PDF |
| **Excel to PDF** | Converts Excel spreadsheets to PDF |
| **HTML to PDF** | Converts HTML content/files to PDF |
| **PDF to Markdown** | Converts PDF content into Markdown |
| **Merge PDF** | Combines multiple PDF files into one |
| **Split PDF** | Extracts selected pages or page ranges |
| **Compress PDF** | Reduces PDF file size |
| **JPG to PDF** | Converts JPG/PNG images into PDF |
| **PDF to JPG** | Converts PDF pages into JPG images |
| **Scan to PDF** | Creates PDF documents from scanned content |
| **Rotate PDF** | Rotates PDF pages by 90°, 180°, or 270° |
| **PDF to PDF/A** | Converts PDF documents to PDF/A format |
| **Edit PDF** | Performs supported PDF editing operations |
| **OCR PDF** | Adds searchable text to scanned PDF documents |
| **Sign PDF** | Adds signatures to PDF documents |
| **Watermark PDF** | Adds text watermarks to PDF pages |
| **Protect PDF** | Protects PDF files with a password |
| **Unlock PDF** | Unlocks password-protected PDFs when the correct password is provided |
| **Page Numbers** | Adds page numbers to PDF pages |
| **Organize PDF** | Reorders or removes PDF pages |
| **Repair PDF** | Repair the damaged PDF |


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

# 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15 |
| **Language** | TypeScript |
| **Routing** | Next.js App Router |
| **Styling** | Tailwind CSS |
| **Icons** | Lucide React |
| **Authentication** | Supabase Auth |
| **Database** | Supabase PostgreSQL |
| **Database Security** | Supabase Row Level Security |
| **File Storage** | Supabase Storage |
| **PDF Creation / Manipulation** | pdf-lib |
| **PDF Text Parsing** | pdf-parse |
| **HTML → PDF** | Puppeteer |
| **OCR PDF** | OCRmyPDF + Tesseract |
| **OCR Fallback** | Tesseract + Poppler |
| **Digital Signature Input** | react-signature-canvas |
| **ZIP / File Utility** | JSZip |
| **Office → PDF** | LibreOffice |
| **PDF Compression** | Ghostscript |
| **PDF Encryption / Repair** | qpdf |
| **PDF Rendering** | Poppler |
| **Process Manager** | PM2 |
| **Reverse Proxy** | Nginx |
| **SSL** | Let's Encrypt + Certbot |
| **Hosting** | AWS EC2 |

---

# 🏗️ Project Architecture

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
 │      ├── pdf-parse
 │      ├── Puppeteer
 │      ├── LibreOffice
 │      ├── Ghostscript
 │      ├── qpdf
 │      ├── Poppler
 │      ├── Tesseract OCR
 │      └── OCRmyPDF
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

```text
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

Sensitive configuration is stored in `.env.local`.

`.env.local` must never be committed to GitHub.

---

# ⚙️ Requirements

For local development you should have:

- Node.js 18.18 or newer
- npm
- Git
- Supabase project

For full PDF processing:

- LibreOffice
- Ghostscript
- qpdf
- Poppler / poppler-utils
- Tesseract OCR
- OCRmyPDF

For HTML → PDF:

- Puppeteer
- Its browser runtime and required Linux libraries if needed by the host

---

# 🚀 Local Installation

```bash
git clone https://github.com/farazii1159/Pdfly-pdf-toolkit.git

cd Pdfly-pdf-toolkit

npm install
```
## Install system dependencies (Ubuntu/Debian)

```bash
sudo apt update

sudo apt install -y \
  libreoffice \
  ghostscript \
  qpdf \
  poppler-utils \
  tesseract-ocr \
  ocrmypdf
 ```

## Verify

```bash
soffice --version
gs --version
qpdf --version
pdftoppm -v
tesseract --version
ocrmypdf --version
```
```bash
cp .env.example .env.local
# fill in .env.local with your Supabase values (see section 8)
```

---

# 🔑 Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
MAX_FILE_SIZE_MB=10
```
Get these from Supabase → **Project Settings** → **API**.
Never commit `.env.local` — it's already excluded in `.gitignore`.

---

# 🗄️ Supabase Setup

1. Create a project at [supabase.com](https://supabase.com).

2. Open **SQL Editor** → **New query**, paste the contents of
   [`supabase/schema.sql`](./supabase/schema.sql), and click **Run**.

3. Run [`supabase/migration_v2.sql`](./supabase/migration_v2.sql) the same
   way — this adds the `file_operations` table, Row Level Security policies,
   and the `images` storage bucket used by the new tools.

4. If any bucket wasn't created by the SQL, create it manually under
   **Storage** → **New bucket**: `word-files`, `pdf-files`, `images` — all
   **private** (Public bucket off).

5. Under **Authentication** → **URL Configuration**, set the **Site URL** to
   your deployed URL (or `http://localhost:3000` for local dev) so
   confirmation/reset emails link back correctly.

---

# 🚀 Running Locally

```bash
npm run dev
```

Visit `http://localhost:3000`. Sign up for an account, confirm your email
(check the Supabase Auth email logs if you haven't configured SMTP), log in,
and try a tool from the dashboard.

---

# 🏗️ Building for Production

```bash
npm run build
npm start
```

---

# 🔄 PM2 Deployment

Install PM2:

```bash
sudo npm install -g pm2
```

Start:

```bash
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

---

# 🌐 Nginx Configuration

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

Enable it:

```bash
sudo ln -s /etc/nginx/sites-available/pdfly /etc/nginx/sites-enabled/pdfly
sudo nginx -t
sudo systemctl reload nginx
```

Port 3000 stays internal — do not open it in your EC2 security group.

---

# 🔒 SSL with Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx

sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Test Renewal:

```bash
sudo certbot renew --dry-run
```

Your site is now available at `https://your-domain.com`.

---

# ☁️ AWS EC2 Deployment

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
   sudo apt install -y \
    libreoffice \
    ghostscript \
    qpdf \
    poppler-utils \
    tesseract-ocr \
    ocrmypdf
```
Verify:

```bash
  soffice --version
gs --version
qpdf --version
pdftoppm -v
tesseract --version
ocrmypdf --version
   ```

7. **Install PM2**
   ```bash
   sudo npm install -g pm2
   ```

8. **Clone your GitHub repository**
   ```bash
   git clone https://github.com/farazii1159/Pdfly-pdf-toolkit.git
   cd Pdfly-pdf-toolkit
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

14. **Configure Nginx** — see Nginx section.

15. **Confirm EC2 security group** allows ports 22, 80, 443 only.

16. **Point your domain's DNS to the EC2 public IP** — see section 16.

17. **Install Certbot and enable HTTPS** — see SSL with Certbot section.

18. **Verify** — visit `https://your-domain.com`, sign up, and run a tool.

---

# 🌐 DNS / Custom Domain

| Type | Name  | Value               |
| ---- | ----- | -------------------- |
| A    | `@`   | `<EC2_PUBLIC_IP>`     |
| A    | `www` | `<EC2_PUBLIC_IP>`     |

For a subdomain instead (e.g. `app.yourdomain.com`), add an `A` record for
`app` pointing to the same IP. Exact steps depend on your DNS provider.

---

# 🩺 Health Check

PDFly includes the following health check endpoint:

```text
/api/health
```

Use this endpoint to confirm that the application is running and to checkavailable server-side dependencies when supported by the current healthimplementation.

You can also manually check all required binaries:

```bash
soffice --version
gs --version
qpdf --version
pdftoppm -v
tesseract --version
ocrmypdf --version
```
---

# 🛠️ Troubleshooting

| Problem | What to Check |
| --- | --- |
| `soffice` not found | Install LibreOffice and verify `soffice --version` |
| `gs` / Ghostscript not found | Install Ghostscript and verify `gs --version` |
| `qpdf` not found | Install qpdf and verify `qpdf --version` |
| `pdftoppm` not found | Install `poppler-utils` |
| `tesseract` not found | Install `tesseract-ocr` |
| `ocrmypdf` not found | Install OCRmyPDF |
| OCR fails | Check OCRmyPDF, Tesseract, language data, Poppler, and Ghostscript |
| PDF → Markdown works on normal PDFs but not scans | Install and check `pdftoppm` and Tesseract |
| PDF/A fails | Check Ghostscript version and configured PDF/A definition/ICC paths |
| HTML → PDF fails on Linux | Check Puppeteer browser installation and required Linux browser libraries |
| Redirected to `/login` | Check Supabase URL/key and root `middleware.ts` |
| Signup works but email does not arrive | Check Supabase Authentication logs and URL/SMTP settings |
| File history is empty | Check the `file_operations` table and `migration_v2.sql` |
| Download/delete permissions fail | Check Supabase Storage policies and user-scoped paths |
| 502 Bad Gateway | Check `pm2 status` and `pm2 logs pdfly` |
| HTTPS fails | Check DNS propagation and Certbot configuration |
| Changes do not appear after `git pull` | Run `npm install`, `npm run build`, then `pm2 restart pdfly` |

---

# 📌 Important Deployment Notes

## 1. npm Packages vs System Programs

This distinction is important:

```text
npm install
│
├── Installs JavaScript packages
│
└── DOES NOT install:
    ├── LibreOffice
    ├── Ghostscript
    ├── qpdf
    ├── Poppler
    ├── Tesseract
    └── OCRmyPDF
   ``` 
---

## 2. Local Machine and Production Server

If you develop on Windows and deploy on Ubuntu, install the required dependencies in both environments.

The application detects the Windows/Linux executable names for most of these tools, but the external programs still need to be installed.

## 3. File Size and Server Resources

PDF conversion, OCR, LibreOffice, Puppeteer, and Ghostscript can use significant CPU/RAM for large files or multiple simultaneous users.

Keep upload limits configured and avoid exposing the application to unlimited large uploads.

## 4. Security

Never commit:

```bash
.env.local
```
Never expose:

```bash
SUPABASE_SERVICE_ROLE_KEY
```
Keep Supabase Storage buckets private and use authenticated access or signed URLs.

 --- 

# 🚀 GitHub Deployment

```bash
git add .
git commit -m "Upgrade Word2PDF into PDFly: auth, dashboard, and full PDF toolkit"
git push
```

(If this is a brand-new repo instead of pushing to the existing Word2PDF
one, use `git init`, `git remote add origin ...`, `git push -u origin main`.)

`.env.local`, `node_modules`, and build artifacts are already excluded via
`.gitignore`.

---  

# License

This project was built as a student portfolio / internship assignment.
