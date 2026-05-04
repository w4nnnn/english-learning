# 🚀 Questly

*[Baca dalam Bahasa Indonesia](#bahasa-indonesia)*

An interactive gamified platform for creating and delivering learning modules, quizzes, and assessments — similar to Google Forms but with built-in gamification, rich media support, and progress tracking. Originally built for English learning, now designed for any subject or purpose.

## ✨ Features

### 🎮 Gamification System
- **Hearts System**: Limited attempts per session that regenerate over time
- **XP & Levels**: Earn experience points and level up as you progress
- **Progress Tracking**: Track completion and performance across modules
- **Retry Mechanism**: Learn from mistakes with the ability to retry questions

### 📚 Learning Content
- **Modular Structure**: Organized learning paths with headers, materials, and assessments
- **Rich Media Support**: 
  - Material with markdown formatting
  - Images (with URL or file upload support)
  - Videos (YouTube, Vimeo, or direct video files)
- **Multiple Question Types**:
  - Multiple Choice
  - Word Arrangement (drag-and-drop)
  - Image Selection
  - Multiple Choice with Images
  - Questions with Image/Video context

### 👨‍💼 Admin Panel
- **Module Management**: Create, edit, delete, and reorder learning modules
- **Drag-and-Drop Reordering**: Intuitive content organization
- **Rich Text Editor**: Markdown-based content creation with WYSIWYG preview
- **Media Uploader**: Support for file uploads and direct URL inputs (including CDN links)
- **Real-time Preview**: See changes as you build content

### 🎨 User Experience
- **Elegant Minimalist Design**: Clean, modern interface with smooth animations
- **Responsive Layout**: Works seamlessly on desktop and mobile devices
- **Dark Mode Support**: Theme switching capability (infrastructure ready)
- **Toast Notifications**: Clear feedback for user actions
- **Markdown Rendering**: Consistent formatting across editor and player

## 🚀 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Database**: SQLite with [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Rich Text**: [@toast-ui/editor](https://ui.toast.com/tui-editor)
- **Drag & Drop**: [@dnd-kit](https://dndkit.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Notifications**: [Sonner](https://sonner.emilkowal.ski/)
- **Markdown**: [react-markdown](https://github.com/remarkjs/react-markdown) + [remark-gfm](https://github.com/remarkjs/remark-gfm)

## 📋 Prerequisites

- Node.js 18.x or higher
- npm, yarn, pnpm, or bun

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/w4nnnn/questly.git
   cd questly
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Database
   DATABASE_URL=./local.db
   
   # NextAuth
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key-here

   # OpenRouter Chatbot
   OPENROUTER_API_KEY=your-openrouter-api-key
   OPENROUTER_MODEL=openai/gpt-oss-120b
   OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
   OPENROUTER_APP_NAME=Questly English Learning
   OPENROUTER_APP_URL=http://localhost:3000
   
   # Optional: PocketBase (if using external media storage)
   POCKETBASE_URL=your-pocketbase-url
   POCKETBASE_ADMIN_EMAIL=admin@example.com
   POCKETBASE_ADMIN_PASSWORD=your-password
   POCKETBASE_MEDIA_COLLECTION=demo_english_learn
   POCKETBASE_FILE_FIELD=file
   ```

4. **Initialize the database**
   ```bash
   npm run db:push
   npm run db:seed
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📝 Usage

### Default Credentials

After seeding the database, you can log in with:
- **Username**: `admin`
- **Password**: `admin123`

### User Flow
1. Browse available modules on the home page
2. Select a module to start
3. Complete materials and answer questions
4. Track your progress with XP and hearts
5. Retry questions if you get them wrong

### Admin Flow
1. Log in with admin credentials
2. Navigate to `/admin` to access the admin panel
3. Create new modules or edit existing ones
4. Add various content types (headers, materials, questions)
5. Drag and drop to reorder items
6. Publish modules for users

## 🗂️ Project Structure

```
questly/
├── app/                      # Next.js app directory
│   ├── admin/                # Admin panel pages
│   ├── api/                  # API routes
│   ├── login/                # Authentication pages
│   ├── modules/              # User module pages
│   └── globals.css           # Global styles
├── components/               # React components
│   ├── admin/                # Admin-specific components
│   ├── modules/              # Module player components
│   ├── question-types/       # Question type components
│   └── ui/                   # Reusable UI components
├── lib/                      # Utilities and configurations
│   ├── actions/              # Server actions
│   ├── db/                   # Database schema & seed
│   └── auth.ts               # Authentication configuration
└── public/                   # Static assets
```

## 🎯 Key Features Explained

### Media URL Support
The platform supports multiple media input methods:
- **File Upload**: Direct file uploads via the media uploader
- **URL Input**: Paste direct URLs to images or videos
- **CDN Support**: Works with URLs containing query strings or additional paths
- **YouTube/Vimeo Embeds**: Automatically converts share links to embeds

### Question Types

1. **Multiple Choice**: Traditional multiple-choice questions with text options
2. **Arrange Words**: Drag-and-drop word arrangement to form sentences
3. **Select Image**: Choose the correct image from visual options
4. **MC Image**: Multiple choice with image-based options
5. **Question Image**: Show an image, then ask a multiple-choice question
6. **Question Video**: Show a video, then ask a multiple-choice question

### Progress Tracking
- Module completion percentage
- Individual item completion status
- XP accumulation and level progression
- Hearts regeneration system

## 🔒 Authentication

The application uses NextAuth.js with credentials provider. Users are stored in SQLite with bcrypt-hashed passwords.

## 🗄️ Database Schema

Key tables:
- `users`: User accounts and authentication
- `modules`: Learning modules
- `module_items`: Individual content items within modules
- `user_module_progress`: Track user progress per module
- `user_item_responses`: Store user answers and responses

## 🎨 Customization

### Theming
The application uses CSS custom properties for theming. Modify `app/globals.css` to customize:
- Color palette (primary, secondary, accent)
- Border radius
- Shadow styles
- Animation timing

### Content
Seed data is located in `lib/db/seed.ts`. Customize the initial modules and content to fit your needs.

## 🚀 Deployment

### Build for Production
```bash
npm run build
npm run start
```

### Deploy to Vercel
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/w4nnnn/questly)

The easiest way to deploy is using [Vercel Platform](https://vercel.com/new).

### Environment Variables for Production
Make sure to set all required environment variables in your deployment platform.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is private and not licensed for public use.

## 👨‍💻 Author

[w4nnnn](https://github.com/w4nnnn)

---

# Bahasa Indonesia

Platform interaktif dengan gamifikasi untuk membuat dan menyajikan modul pembelajaran, kuis, dan asesmen — mirip Google Forms namun dengan gamifikasi bawaan, dukungan media kaya, dan pelacakan progres. Awalnya dibangun untuk pembelajaran Bahasa Inggris, kini dirancang untuk subjek atau kebutuhan apapun.

## ✨ Fitur

### 🎮 Sistem Gamifikasi
- **Sistem Hati**: Percobaan terbatas per sesi yang regenerasi seiring waktu
- **XP & Level**: Dapatkan poin pengalaman dan naik level seiring progres
- **Pelacakan Progres**: Lacak penyelesaian dan performa di seluruh modul
- **Mekanisme Retry**: Belajar dari kesalahan dengan kemampuan mengulang pertanyaan

### 📚 Konten Pembelajaran
- **Struktur Modular**: Jalur pembelajaran terorganisir dengan header, materi, dan penilaian
- **Dukungan Media Kaya**:
  - Materi dengan format markdown
  - Gambar (dengan URL atau upload file)
  - Video (YouTube, Vimeo, atau file video langsung)
- **Berbagai Jenis Pertanyaan**:
  - Pilihan Ganda
  - Susunan Kata (drag-and-drop)
  - Pilih Gambar
  - Pilihan Ganda dengan Gambar
  - Pertanyaan dengan konteks Gambar/Video

### 👨‍💼 Panel Admin
- **Manajemen Modul**: Buat, edit, hapus, dan susun ulang modul pembelajaran
- **Drag-and-Drop Reordering**: Organisasi konten yang intuitif
- **Rich Text Editor**: Pembuatan konten berbasis markdown dengan preview WYSIWYG
- **Media Uploader**: Dukungan untuk upload file dan input URL langsung (termasuk link CDN)
- **Preview Real-time**: Lihat perubahan saat membangun konten

### 🎨 Pengalaman Pengguna
- **Desain Minimalis Elegan**: Antarmuka bersih dan modern dengan animasi halus
- **Layout Responsif**: Bekerja sempurna di desktop dan perangkat mobile
- **Dukungan Dark Mode**: Kemampuan switching tema (infrastruktur siap)
- **Notifikasi Toast**: Feedback jelas untuk aksi pengguna
- **Rendering Markdown**: Format konsisten di editor dan player

## 🚀 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **Bahasa**: TypeScript
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Database**: SQLite dengan [Drizzle ORM](https://orm.drizzle.team/)
- **Autentikasi**: [NextAuth.js](https://next-auth.js.org/)
- **Komponen UI**: [Radix UI](https://www.radix-ui.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Rich Text**: [@toast-ui/editor](https://ui.toast.com/tui-editor)
- **Drag & Drop**: [@dnd-kit](https://dndkit.com/)
- **Animasi**: [Framer Motion](https://www.framer.com/motion/)
- **Notifikasi**: [Sonner](https://sonner.emilkowal.ski/)
- **Markdown**: [react-markdown](https://github.com/remarkjs/react-markdown) + [remark-gfm](https://github.com/remarkjs/remark-gfm)

## 📋 Prasyarat

- Node.js 18.x atau lebih tinggi
- npm, yarn, pnpm, atau bun

## 🛠️ Instalasi

1. **Clone repository**
   ```bash
   git clone https://github.com/w4nnnn/questly.git
   cd questly
   ```

2. **Install dependencies**
   ```bash
   npm install
   # atau
   yarn install
   # atau
   pnpm install
   ```

3. **Setup environment variables**
   
   Buat file `.env` di root directory:
   ```env
   # Database
   DATABASE_URL=./local.db
   
   # NextAuth
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=kunci-rahasia-anda-disini

   # OpenRouter Chatbot
   OPENROUTER_API_KEY=api-key-openrouter-anda
   OPENROUTER_MODEL=openai/gpt-oss-120b
   OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
   OPENROUTER_APP_NAME=Questly English Learning
   OPENROUTER_APP_URL=http://localhost:3000
   
   # Opsional: PocketBase (jika menggunakan external media storage)
   POCKETBASE_URL=url-pocketbase-anda
   POCKETBASE_ADMIN_EMAIL=admin@example.com
   POCKETBASE_ADMIN_PASSWORD=password-anda
   POCKETBASE_MEDIA_COLLECTION=demo_english_learn
   POCKETBASE_FILE_FIELD=file
   ```

4. **Inisialisasi database**
   ```bash
   npm run db:push
   npm run db:seed
   ```

5. **Jalankan development server**
   ```bash
   npm run dev
   ```

6. **Buka browser**
   
   Navigasi ke [http://localhost:3000](http://localhost:3000)

## 📝 Penggunaan

### Kredensial Default

Setelah seeding database, Anda bisa login dengan:
- **Username**: `admin`
- **Password**: `admin123`

### Alur Pengguna
1. Browse modul yang tersedia di halaman utama
2. Pilih modul untuk memulai
3. Selesaikan materi dan jawab pertanyaan
4. Lacak progres Anda dengan XP dan hati
5. Ulangi pertanyaan jika jawaban salah

### Alur Admin
1. Login dengan kredensial admin
2. Navigasi ke `/admin` untuk mengakses panel admin
3. Buat modul baru atau edit yang sudah ada
4. Tambahkan berbagai jenis konten (header, materi, pertanyaan)
5. Drag and drop untuk menyusun ulang item
6. Publikasikan modul untuk pengguna

## 🗂️ Struktur Project

```
questly/
├── app/                      # Direktori app Next.js
│   ├── admin/                # Halaman panel admin
│   ├── api/                  # Route API
│   ├── login/                # Halaman autentikasi
│   ├── modules/              # Halaman modul pengguna
│   └── globals.css           # Style global
├── components/               # Komponen React
│   ├── admin/                # Komponen khusus admin
│   ├── modules/              # Komponen player modul
│   ├── question-types/       # Komponen jenis pertanyaan
│   └── ui/                   # Komponen UI reusable
├── lib/                      # Utilitas dan konfigurasi
│   ├── actions/              # Server actions
│   ├── db/                   # Schema & seed database
│   └── auth.ts               # Konfigurasi autentikasi
└── public/                   # Asset statis
```

## 🎯 Penjelasan Fitur Utama

### Dukungan URL Media
Platform mendukung berbagai metode input media:
- **Upload File**: Upload file langsung via media uploader
- **Input URL**: Paste URL langsung ke gambar atau video
- **Dukungan CDN**: Bekerja dengan URL yang mengandung query string atau path tambahan
- **Embed YouTube/Vimeo**: Otomatis convert link share menjadi embed

### Jenis Pertanyaan

1. **Multiple Choice**: Pertanyaan pilihan ganda tradisional dengan opsi teks
2. **Arrange Words**: Drag-and-drop susunan kata untuk membentuk kalimat
3. **Select Image**: Pilih gambar yang benar dari opsi visual
4. **MC Image**: Pilihan ganda dengan opsi berbasis gambar
5. **Question Image**: Tampilkan gambar, lalu ajukan pertanyaan pilihan ganda
6. **Question Video**: Tampilkan video, lalu ajukan pertanyaan pilihan ganda

### Pelacakan Progres
- Persentase penyelesaian modul
- Status penyelesaian item individual
- Akumulasi XP dan progresi level
- Sistem regenerasi hati

## 🔒 Autentikasi

Aplikasi menggunakan NextAuth.js dengan credentials provider. User disimpan di SQLite dengan password ter-hash bcrypt.

## 🗄️ Schema Database

Tabel utama:
- `users`: Akun user dan autentikasi
- `modules`: Modul pembelajaran
- `module_items`: Item konten individual dalam modul
- `user_module_progress`: Lacak progres user per modul
- `user_item_responses`: Simpan jawaban dan respons user

## 🎨 Kustomisasi

### Theming
Aplikasi menggunakan CSS custom properties untuk theming. Modifikasi `app/globals.css` untuk kustomisasi:
- Palet warna (primary, secondary, accent)
- Border radius
- Style shadow
- Timing animasi

### Konten
Seed data terletak di `lib/db/seed.ts`. Kustomisasi modul awal dan konten sesuai kebutuhan Anda.

## 🚀 Deployment

### Build untuk Production
```bash
npm run build
npm run start
```

### Deploy ke Vercel
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/w4nnnn/questly)

Cara termudah untuk deploy adalah menggunakan [Vercel Platform](https://vercel.com/new).

### Environment Variables untuk Production
Pastikan untuk set semua environment variables yang diperlukan di platform deployment Anda.

## 🤝 Kontribusi

Kontribusi sangat diterima! Silakan submit Pull Request.

## 📄 Lisensi

Project ini bersifat private dan tidak dilisensikan untuk penggunaan publik.

## 👨‍💻 Penulis

[w4nnnn](https://github.com/w4nnnn)
