# Pentagram: Instagram, but with AI Images

A full-stack social media platform for sharing AI-generated images, built with Next.js, Supabase, and Modal.

## Features

- 🔐 **Authentication** - User signup and login with Supabase Auth
- 🎨 **AI Image Generation** - Generate images using Stable Diffusion XL Turbo via Modal
- 📱 **Social Feed** - Browse and interact with AI-generated images from the community
- 🔍 **Explore** - Discover trending images filtered by time period (today, week, month, all)
- 👤 **User Profiles** - View user profiles with their generated images, follower/following counts
- ❤️ **Likes & Comments** - Like images and engage with threaded comments
- 💬 **Comment Replies** - Nested comment threads for discussions
- 📸 **Post Details** - View individual posts with full comment sections
- 🗂️ **Image Management** - Upload generated images to Vercel Blob storage

## Tech Stack

### Frontend
- **Next.js 15.1.11** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Radix UI** - Accessible component primitives
- **React Hook Form + Zod** - Form handling and validation
- **Supabase** - Authentication and database
- **Vercel Blob** - Image storage

### Backend
- **Modal** - Serverless AI inference platform
- **Stable Diffusion XL Turbo** - Image generation model
- **FastAPI** - API framework (via Modal)
- **PyTorch** - Deep learning framework

### Database
- **Supabase PostgreSQL** - Database with Row Level Security (RLS)
- **SQL Migrations** - Schema management

## Project Structure

```
pentagram/
├── frontend/              # Next.js application
│   ├── src/
│   │   ├── app/          # App Router pages and routes
│   │   │   ├── api/      # API routes
│   │   │   ├── auth/     # Authentication actions
│   │   │   ├── explore/  # Explore page
│   │   │   ├── feed/     # Feed page
│   │   │   ├── generate/ # Image generation page
│   │   │   ├── login/    # Login page
│   │   │   ├── post/     # Post detail pages
│   │   │   └── profile/  # Profile pages
│   │   ├── components/   # React components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utility functions
│   │   └── utils/        # Supabase utilities
│   └── package.json
├── backend/              # Modal AI service
│   ├── main.py          # Modal app with image generation
│   └── requirements.txt
├── sql/                  # Database migrations
│   ├── 001_initial_schema.sql
│   ├── 002_create_profile_trigger.sql
│   └── 003_add_comment_replies.sql
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- Python 3.8+ (for backend)
- Supabase account and project
- Modal account (for AI image generation)
- Vercel account (for blob storage)

### Frontend Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/team-headstart/pentagram.git
   cd pentagram
   ```

2. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Set up environment variables:**
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local` with your credentials:
   ```env
   API_KEY=your-modal-api-key
   BLOB_READ_WRITE_TOKEN=your-vercel-blob-token
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

5. **Run the development server:**
   ```bash
   npm run dev
   ```

6. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Backend Setup (Modal)

1. **Install Modal:**
   ```bash
   pip install modal
   ```

2. **Set up Modal authentication:**
   ```bash
   modal token new
   ```

3. **Configure API key secret in Modal dashboard:**
   - Create a secret named `API_KEY` in Modal dashboard
   - Add your API key value

4. **Deploy the Modal app:**
   ```bash
   cd backend
   modal deploy main.py
   ```

### Database Setup

1. **Apply migrations:**
   - Use Supabase MCP tools in Cursor, or
   - Use Supabase CLI: `supabase db push`, or
   - Manually run SQL files from `sql/` directory in Supabase SQL Editor

2. **Migration order:**
   - `001_initial_schema.sql` - Complete database schema
   - `002_create_profile_trigger.sql` - Auto-create profiles on signup
   - `003_add_comment_replies.sql` - Comment threading support

## Available Scripts

### Frontend
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format:fix` - Format code with Prettier

## Key Pages & Features

### Landing Page (`/`)
- Welcome page with login/signup options
- Redirects authenticated users to `/feed`

### Feed (`/feed`)
- Main social feed showing all public AI-generated images
- Like and comment functionality
- Real-time engagement metrics

### Generate (`/generate`)
- AI image generation interface
- Customizable prompts, negative prompts, aspect ratios
- Advanced settings (steps, guidance scale)

### Explore (`/explore`)
- Trending images discovery
- Filter by time period (today, week, month, all)
- Grid layout for browsing

### Profile (`/profile/[username]`)
- User profile pages
- Display user's generated images
- Follower/following counts
- Follow/unfollow functionality

### Post Detail (`/post/[id]`)
- Individual post view
- Full comment section with replies
- Threaded comment discussions

## API Routes

### `/api/generate-image`
- **Method:** POST
- **Body:** `{ prompt, negative_prompt?, aspect_ratio?, steps?, guidance_scale? }`
- **Response:** `{ success: boolean, imageUrl?: string, error?: string }`
- Generates AI image via Modal and uploads to Vercel Blob

## Learn More

- [Next.js Documentation](https://nextjs.org/docs) - Learn about Next.js features and API
- [Supabase Documentation](https://supabase.com/docs) - Database and authentication
- [Modal Documentation](https://modal.com/docs) - Serverless AI platform
- [Vercel Blob Documentation](https://vercel.com/docs/storage/vercel-blob) - File storage

## License

This project is part of the Headstarter program.
