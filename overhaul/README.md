# 🎸 Chief's Music - Professional Guitar Teacher Website

## 🚀 Overview

A modern, responsive website for guitar teachers featuring blog management, student portals, music showcases, and contact systems.

## ✅ Features

- **Professional Homepage**: Clean design with earthy color palette
- **Music Integration**: YouTube video player with playlists
- **Blog System**: Full-featured blog with admin panel
- **Student Portal**: Private access to materials and assignments
- **Contact Forms**: Validated forms with email notifications
- **Admin Dashboard**: Complete content management system
- **Mobile Responsive**: Works on all devices

## 🔧 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Email**: Nodemailer with Gmail
- **Deployment**: GitHub Pages ready

## 🌐 Deployment to GitHub Pages

### Step 1: Repository Setup
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### Step 2: Configure GitHub Secrets
Go to your repository settings → Secrets and Variables → Actions, and add:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key  
- `NEXT_PUBLIC_BLOG_ADMIN_EMAIL`: Your admin email
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `EMAIL_USER`: Your Gmail address
- `EMAIL_PASS`: Your Gmail app password

### Step 3: Enable GitHub Pages
1. Go to repository Settings → Pages
2. Source: GitHub Actions
3. The workflow will automatically deploy on pushes

### Step 4: Access Your Site
Your site will be available at: `https://yourusername.github.io/My-Guitar-Website/`

## 🚀 Local Development

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev
```

## 📁 Project Structure

```
src/
├── app/                 # Next.js pages
│   ├── admin/          # Admin dashboard
│   ├── blog/           # Blog system
│   ├── contact/        # Contact forms
│   ├── music/          # Music showcase
│   ├── portal/         # Student portal
│   └── api/            # API routes
├── components/         # React components
└── lib/               # Utilities
```

## 🎨 Color Palette

- **Forest Green**: `#87AA6A` (Main backgrounds)
- **Orange**: `#BC6A1B` (Navigation, buttons)
- **Dark Brown**: `#602718` (Footer, accents)
- **Dark Green**: `#535925` (Secondary elements)

## 🔐 Admin Features

Access the admin panel at `/admin`:
- Blog post management with rich text editor
- Student management and assignments
- Contact message tracking
- File uploads and organization

## 📧 Contact System

- Validated forms requiring email OR phone
- Email notifications to admin
- Message storage and tracking
- Unread message counter

## � Student Portal

- Secure login for students
- Access to lesson materials
- Assignment tracking
- Video lessons and resources

## 🔧 Configuration

### Database Setup
Run the SQL files in the project root in your Supabase dashboard:
- `create_contact_messages_table.sql`
- `create_materials_table.sql`
- `student_management_setup.sql`
- `create_music_videos_table.sql`

### Email Configuration
1. Enable 2-factor authentication on Gmail
2. Generate an App Password
3. Add credentials to environment variables

## 🐛 Troubleshooting

### Build Issues
- Verify all environment variables are set
- Check Supabase connection
- Ensure database tables exist

### Deployment Issues
- Confirm GitHub secrets are configured
- Check GitHub Actions logs for errors
- Verify static export settings

## 📞 Support

For questions or support: grantmatai@gmail.com

---

**Ready for GitHub Pages deployment!** 🚀
