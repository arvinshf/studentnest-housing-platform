# Django Backend Setup Guide

## Quick Start

1. **Open PowerShell in the backend folder:**
   ```powershell
   cd "c:\Users\arvin\Desktop\french-heavy-gaur-html-fixed-buttons-v2 (1)\backend"
   ```

2. **Create virtual environment:**
   ```powershell
   python -m venv venv
   ```

3. **Activate virtual environment:**
   ```powershell
   .\venv\Scripts\Activate.ps1
   ```
   
   If you get an error about execution policy, run:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

4. **Install dependencies:**
   ```powershell
   pip install -r requirements.txt
   ```

5. **Create database:**
   ```powershell
   python manage.py makemigrations
   python manage.py migrate
   ```

6. **Create admin user (optional):**
   ```powershell
   python manage.py createsuperuser
   ```

7. **Run the server:**
   ```powershell
   python manage.py runserver
   ```

The server will run at `http://127.0.0.1:8000/`

## Using the Backend

### Option 1: Update existing files
Replace the script tag in your HTML files from:
```html
<script src="./auth.js"></script>
```
to:
```html
<script src="./auth-backend.js"></script>
```

### Option 2: Keep both versions
You can keep `auth.js` (localStorage version) and `auth-backend.js` (Django version) and switch between them.

## What's Stored Where

**With Django Backend:**
- User data is stored in `backend/db.sqlite3` database
- Sessions are managed by Django
- Data persists even if you close the browser
- Can be accessed from any device

**Admin Panel:**
- Visit `http://127.0.0.1:8000/admin/`
- Login with your superuser credentials
- View and manage all registered students

## API Endpoints

- `POST http://127.0.0.1:8000/api/signup/` - Register new student
- `POST http://127.0.0.1:8000/api/login/` - Login
- `POST http://127.0.0.1:8000/api/logout/` - Logout  
- `GET http://127.0.0.1:8000/api/check-session/` - Check if logged in
