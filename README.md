# StudentNest - Student Housing Platform

A comprehensive student housing platform built with Django backend and vanilla JavaScript frontend, allowing students to find rooms and landlords to list properties.

## 🔗 Important Links

### Application URLs
- **Frontend (Homepage)**: http://127.0.0.1:3000/home.html
- **Login Page**: http://127.0.0.1:3000/index.html
- **Signup Page**: 
- **Dashboard**: http://127.0.0.1:3000/portal.html
- **Post Room**: http://127.0.0.1:3000/post-room.html
- **Room Details**: http://127.0.0.1:3000/room-details.html?id={room_id}

### Backend URLs
- **Django Admin Panel**: http://127.0.0.1:8000/admin/
- **API Base**: http://127.0.0.1:8000/api/
- **API Rooms Endpoint**: http://127.0.0.1:8000/api/rooms/
- **API Session Check**: http://127.0.0.1:8000/api/check-session/

---

## 🔐 Test Credentials

### Test User Account
- **Email**: w1921326@westminster.ac.uk
- **Password**: (Use the password you set during signup)
- **Name**: arvin shaf
- **Student ID**: (Your 8-digit ID)

### Django Admin Panel (Superuser)
To create a superuser account for Django admin:
```bash
cd backend
.\venv\Scripts\python.exe manage.py runserver
```
Then follow the prompts to set username, email, and password.

---

## 📋 Prerequisites

Before running the project, ensure you have:
- **Python 3.8+** installed
- **pip** (Python package manager)
- **Git** (optional, for version control)

---

## 🚀 Project Setup & Installation

### Step 1: Navigate to Project Directory
```bash
cd "c:\Users\arvin\Desktop\french-heavy-gaur-html-fixed-buttons-v2 (1)"
```

### Step 2: Set Up Python Virtual Environment
```bash
cd backend
python -m venv venv
```

### Step 3: Activate Virtual Environment
```bash
# On Windows (PowerShell)
.\venv\Scripts\Activate.ps1

# On Windows (Command Prompt)
.\venv\Scripts\activate.bat
```

### Step 4: Install Python Dependencies
```bash
.\venv\Scripts\pip.exe install -r requirements.txt
```

**Key Dependencies:**
- Django 4.0+
- djangorestframework
- django-cors-headers
- Pillow (for image handling)

### Step 5: Run Database Migrations
```bash
.\venv\Scripts\python.exe manage.py migrate
```

This will create the SQLite database (`db.sqlite3`) with all necessary tables.

### Step 6: Create Superuser (Optional but Recommended)
```bash
.\venv\Scripts\python.exe manage.py createsuperuser
```

---

## 🏃 Running the Project

You need to run **TWO servers** simultaneously:

### Terminal 1: Django Backend Server
```bash
# Navigate to backend folder
cd "c:\Users\arvin\Desktop\french-heavy-gaur-html-fixed-buttons-v2 (1)\backend"

# Start Django server
.\venv\Scripts\python.exe manage.py runserver
```

**Expected Output:**
```
Django version X.X.X, using settings 'studentnest.settings'
Starting development server at http://127.0.0.1:8000/
Quit the server with CTRL-BREAK.
```

### Terminal 2: Frontend HTTP Server
```bash
# Navigate to project root
cd "c:\Users\arvin\Desktop\french-heavy-gaur-html-fixed-buttons-v2 (1)"

# Start HTTP server on port 3000
python -m http.server 3000 --bind 127.0.0.1
```

**Expected Output:**
```
Serving HTTP on 127.0.0.1 port 3000 (http://127.0.0.1:3000/) ...
```

---

## 📱 Using the Application

### For Students (Room Seekers)

1. **Sign Up**
   - Go to: http://127.0.0.1:3000/signup.html
   - Enter full name, Westminster email (@westminster.ac.uk), student ID (8 digits)
   - Create password (minimum 12 characters)

2. **Login**
   - Go to: http://127.0.0.1:3000/index.html
   - Enter your email and password

3. **Browse Rooms**
   - Go to: http://127.0.0.1:3000/home.html
   - View available rooms
   - Click "See More" to view room details

4. **View Dashboard**
   - Go to: http://127.0.0.1:3000/portal.html
   - See your saved rooms
   - View your activity

### For Landlords (Room Posters)

1. **Post a Room**
   - Login first
   - Go to: http://127.0.0.1:3000/post-room.html
   - Fill in room details (title, location, price, availability, etc.)
   - Upload up to 5 room images (JPG, PNG, max 5MB each)
   - Submit

2. **Manage Your Rooms**
   - Go to: http://127.0.0.1:3000/portal.html
   - Scroll to "My Posted Rooms" section
   - View all your listings
   - Click "View" to see details
   - Click "Delete" to remove a listing (with confirmation)

3. **View and Reply to Messages**
   - Go to: http://127.0.0.1:3000/portal.html
   - Scroll to "My Messages" section or click "Messages" in navbar
   - View all messages from potential tenants
   - Click on a message to read it
   - Type and send replies directly
   - Unread messages are highlighted

---

## 🗂️ Project Structure

```
project-root/
├── backend/                    # Django backend
│   ├── accounts/              # Main Django app
│   │   ├── models.py         # Database models (Student, Room)
│   │   ├── views.py          # API endpoints
│   │   ├── serializers.py    # Data serialization
│   │   ├── urls.py           # URL routing
│   │   └── migrations/       # Database migrations
│   ├── media/                # Uploaded images
│   │   └── room_images/      # Room photos
│   ├── studentnest/          # Django project settings
│   │   ├── settings.py       # Configuration
│   │   └── urls.py           # Main URL routing
│   ├── db.sqlite3            # SQLite database
│   ├── manage.py             # Django management script
│   ├── requirements.txt      # Python dependencies
│   └── venv/                 # Virtual environment
│
├── components/               # Reusable HTML components
│   ├── footer.html
│   ├── navigation.html
│   └── login-form.html
│
├── locales/                  # Internationalization
│   └── en.json
│
├── *.html                    # Frontend pages
├── *.css                     # Stylesheets
├── *.js                      # JavaScript files
├── auth-backend.js           # Authentication logic
├── home.js                   # Homepage logic
├── post-room.js              # Room posting logic
├── room-details.js           # Room details logic
└── package.json              # Node packages (if any)
```

---

## 🔧 API Endpoints

### Authentication
- `POST /api/signup/` - Create new student account
- `POST /api/login/` - Login
- `POST /api/logout/` - Logout
- `GET /api/check-session/` - Check if user is logged in

### Rooms
- `GET /api/rooms/` - List all active rooms
- `POST /api/rooms/` - Create new room (authenticated)
- `GET /api/rooms/{id}/` - Get specific room details
- `PUT /api/rooms/{id}/` - Update room (owner only)
- `DELETE /api/rooms/{id}/` - Delete room (owner only)
- `GET /api/my-rooms/` - Get current user's rooms

### Students
- `GET /api/students/` - List all students (admin)
- `GET /api/students/{id}/` - Get specific student

### Messages
- `GET /api/messages/` - Get received messages (authenticated)
- `POST /api/messages/send/` - Send a message (authenticated)
- `GET /api/messages/sent/` - Get sent messages (authenticated)
- `POST /api/messages/{id}/read/` - Mark message as read (authenticated)

---

## 🗄️ Database Models

### Student Model
- `student_id` - Unique 8-digit ID (Primary Key)
- `name` - Full name
- `email` - University email (unique)
- `password` - Hashed password
- `course` - Course of study
- `is_online` - Online status
- `last_activity` - Last activity timestamp

### Room Model
- `id` - Auto-generated ID (Primary Key)
- `title` - Room title/name
- `location` - Room location
- `price` - Monthly rent
- `availability` - Available from date
- `description` - Room description
- `bedrooms` - Number of bedrooms
- `bathrooms` - Number of bathrooms
- `property_type` - Type of property
- `furnished` - Furnished status
- `bills_included` - Bills included status
- `image_1` to `image_5` - Room images (ImageField)
- `owner` - Foreign key to Student
- `is_active` - Active status
- `created_at` - Creation timestamp

### Message Model
- `id` - Auto-generated ID (Primary Key)
- `sender` - Foreign key to Student (who sent the message)
- `recipient` - Foreign key to Student (who receives the message)
- `room` - Foreign key to Room (optional, message context)
- `subject` - Message subject
- `content` - Message content
- `is_read` - Read status (boolean)
- `read_at` - Timestamp when marked as read
- `created_at` - Creation timestamp

---

## 🎨 Key Features

### ✅ Implemented Features
- [x] User registration and authentication
- [x] Session management with cookies
- [x] Room listing with images
- [x] Image upload (up to 5 images per room)
- [x] Room search and browsing
- [x] Detailed room view with image gallery
- [x] User dashboard
- [x] "My Rooms" section for landlords
- [x] Delete room functionality (owner only)
- [x] Responsive design
- [x] Room filtering by owner
- [x] Image preview before upload
- [x] Save room functionality
- [x] Contact landlord messaging modal
- [x] Full messaging system with database storage
- [x] Messages inbox in dashboard
- [x] Reply to messages functionality
- [x] Unread message notifications

### 🚧 Future Enhancements
- [ ] Edit room functionality
- [ ] Advanced search filters
- [ ] Email notifications for new messages
- [ ] Room favorites/bookmarks
- [ ] Map integration for locations
- [ ] Reviews and ratings
- [ ] Payment integration

---

## 🐛 Troubleshooting

### Issue: Django server won't start
**Solution:**
```bash
# Check if port 8000 is in use
netstat -ano | findstr :8000

# Kill the process if needed
taskkill /PID <process_id> /F

# Restart Django
.\venv\Scripts\python.exe manage.py runserver
```

### Issue: Frontend server won't start
**Solution:**
```bash
# Check if port 3000 is in use
netstat -ano | findstr :3000

# Use a different port
python -m http.server 3001 --bind 127.0.0.1
```

### Issue: Images not loading
**Solution:**
- Ensure Django server is running
- Check that `MEDIA_URL` and `MEDIA_ROOT` are configured in `settings.py`
- Verify images are in `backend/media/room_images/`

### Issue: CORS errors
**Solution:**
- Ensure `django-cors-headers` is installed
- Check `CORS_ALLOWED_ORIGINS` in `settings.py`
- Verify both servers are running

### Issue: Database errors
**Solution:**
```bash
# Reset database (WARNING: Deletes all data)
cd backend
del db.sqlite3
.\venv\Scripts\python.exe manage.py migrate

# Or run migrations
.\venv\Scripts\python.exe manage.py makemigrations
.\venv\Scripts\python.exe manage.py migrate
```

---

## 📝 Important Notes

1. **Virtual Environment**: Always activate the virtual environment before running Django commands
2. **Two Servers**: Both Django (port 8000) and HTTP server (port 3000) must be running
3. **Image Size**: Maximum image size is 5MB per file
4. **Email Domain**: Only @westminster.ac.uk emails are accepted for registration
5. **Session Management**: Sessions are stored in Django backend using cookies
6. **Database**: SQLite is used for development; consider PostgreSQL for production

---

## 🔒 Security Considerations

- Passwords are hashed using Django's built-in authentication
- CSRF protection enabled
- Session-based authentication
- Image upload validation (file type and size)
- Owner-only access for room deletion and updates

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Django logs in the terminal
3. Check browser console for frontend errors (F12 → Console)
4. Verify both servers are running

---

## 📄 License

This project is for educational purposes.

---

## 🙏 Acknowledgments

- Django framework for backend
- Django REST Framework for API
- Pillow for image processing
- Bootstrap/Custom CSS for styling

---

## 📅 Last Updated

January 28, 2026

---

**Happy Coding! 🚀**
