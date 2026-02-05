# 🚀 StudentNest Deployment Guide - Render.com

## Prerequisites ✅
- [x] GitHub account
- [x] Git installed on your computer
- [x] All deployment files created (you're ready!)

---

## Step 1: Push Your Code to GitHub

### 1.1 Initialize Git Repository
```powershell
cd "c:\Users\arvin\Desktop\french-heavy-gaur-html-fixed-Bckupz\french-heavy-gaur-html-fixed-buttons-v2 (1)"
git init
```

### 1.2 Add All Files
```powershell
git add .
```

### 1.3 Commit Your Code
```powershell
git commit -m "Initial commit - StudentNest ready for deployment"
```

### 1.4 Create GitHub Repository
1. Go to https://github.com/new
2. Repository name: `studentnest-housing-platform`
3. Make it **Public** (or Private if you prefer)
4. **DON'T** initialize with README/gitignore (you already have them)
5. Click "Create repository"

### 1.5 Push to GitHub
```powershell
# Replace YOUR-USERNAME with your actual GitHub username
git remote add origin https://github.com/YOUR-USERNAME/studentnest-housing-platform.git
git branch -M main
git push -u origin main
```

**⚠️ If Git asks for credentials:**
- Use GitHub Personal Access Token instead of password
- Generate token: GitHub → Settings → Developer settings → Personal access tokens → Generate new token

---

## Step 2: Deploy on Render.com

### 2.1 Sign Up / Login
1. Go to https://render.com
2. Click "Get Started" or "Sign In"
3. Sign up with GitHub (easiest option)
4. Authorize Render to access your repositories

### 2.2 Create New Web Service
1. Click **"New +"** button (top right)
2. Select **"Web Service"**
3. Click **"Connect account"** if needed
4. Find your `studentnest-housing-platform` repository
5. Click **"Connect"**

### 2.3 Configure Service Settings

**Basic Settings:**
- **Name**: `studentnest` (or any name you like)
- **Region**: Oregon (US West) - or closest to you
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: `Python 3`

**Build & Deploy:**
- **Build Command**: `./build.sh`
- **Start Command**: `gunicorn studentnest.wsgi:application`

**Instance Type:**
- Select **"Free"** tier

### 2.4 Add Environment Variables
Click "Advanced" → Add Environment Variables:

| Key | Value |
|-----|-------|
| `PYTHON_VERSION` | `3.11.0` |
| `SECRET_KEY` | Click "Generate" button |
| `DEBUG` | `False` |
| `ALLOWED_HOSTS` | `studentnest.onrender.com` (or your actual domain) |

### 2.5 Create PostgreSQL Database
1. Scroll down to **"Create database"**
2. Click **"New Database"**
3. **Name**: `studentnest-db`
4. **Region**: Same as web service (Oregon)
5. **Instance Type**: Free
6. Click **"Create Database"**
7. Wait for database to be ready (2-3 minutes)
8. Copy the **"Internal Database URL"**

### 2.6 Link Database to Web Service
1. Go back to your web service settings
2. Add new environment variable:
   - **Key**: `DATABASE_URL`
   - **Value**: Paste the Internal Database URL from database

### 2.7 Deploy!
1. Click **"Create Web Service"**
2. Render will start building your app (5-10 minutes first time)
3. Watch the build logs in real-time

---

## Step 3: Post-Deployment Setup

### 3.1 Create Superuser
Once deployed successfully:

1. Go to your Render dashboard
2. Click on your `studentnest` web service
3. Click **"Shell"** tab
4. Run these commands:
```bash
python manage.py createsuperuser
```
Follow prompts to create admin account

### 3.2 Update Frontend URLs
In your HTML/JS files, update API base URL:
```javascript
// Change from:
const API_BASE_URL = "http://127.0.0.1:8000/api";

// To:
const API_BASE_URL = "https://studentnest.onrender.com/api";
```

Update in these files:
- `auth-backend.js`
- `home.js`
- `post-room.js`
- `room-details.js`

### 3.3 Update CORS Settings
After getting your Render URL, update `settings.py`:
```python
CORS_ALLOWED_ORIGINS = [
    "https://your-frontend-url.com",
    "https://studentnest.onrender.com",
]
```

Commit and push changes:
```powershell
git add .
git commit -m "Update API URLs for production"
git push
```

Render will auto-deploy the changes!

---

## Step 4: Access Your Live Website

### Your URLs:
- **Backend/API**: `https://studentnest.onrender.com`
- **Django Admin**: `https://studentnest.onrender.com/admin/`
- **API Endpoints**: `https://studentnest.onrender.com/api/`

### Frontend Options:

**Option A: Deploy Frontend Separately**
1. Create another repository for just frontend files
2. Deploy to **Netlify** or **Vercel** (free, super easy)
3. Update API_BASE_URL to point to your Render backend

**Option B: Serve from Django**
1. Move HTML/CSS/JS files to Django `static` folder
2. Access via `https://studentnest.onrender.com/static/home.html`

---

## Troubleshooting 🔧

### Build Failed?
- Check build logs on Render dashboard
- Common issues:
  - Missing dependencies in `requirements.txt`
  - Wrong root directory (should be `backend`)
  - Python version mismatch

### Database Errors?
- Ensure `DATABASE_URL` environment variable is set correctly
- Check database is created and running
- Try running migrations manually in Shell

### Static Files Not Loading?
- Run `python manage.py collectstatic --no-input` in Shell
- Check `STATIC_ROOT` and `STATIC_URL` in settings

### 502 Bad Gateway?
- Service might be starting up (wait 2-3 minutes)
- Check if `gunicorn` is in requirements.txt
- Verify start command: `gunicorn studentnest.wsgi:application`

---

## Important Notes 📝

⚠️ **Free Tier Limitations:**
- Services spin down after 15 minutes of inactivity
- First request after idle will be slow (cold start ~30 seconds)
- Database limited to 90 days
- 750 hours/month free

💡 **Tips:**
- Keep service awake with uptime monitoring (UptimeRobot, etc.)
- Upgrade to paid plan ($7/month) for always-on service
- Use Cloudflare for CDN and DDoS protection

🔒 **Security:**
- Never commit `.env` file
- Always use environment variables for secrets
- Keep `DEBUG=False` in production
- Enable HTTPS (Render provides free SSL)

---

## Need Help?

If something goes wrong:
1. Check Render build/deploy logs
2. Check browser console for frontend errors
3. Check Django logs in Render dashboard
4. Ask me - paste the error message!

---

**🎉 Congratulations! Your StudentNest is now live on the internet!**
