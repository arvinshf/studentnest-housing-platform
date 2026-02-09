# StudentNest - Student Housing Platform

A comprehensive student housing platform built with Django REST Framework backend and vanilla JavaScript frontend, allowing students to find rooms, save favorites, message landlords, and post properties.

## 🌐 Live Deployment

**Production URL**: https://arwin001.pythonanywhere.com

The application is fully deployed and operational on PythonAnywhere with PostgreSQL database.

## ✨ Features

- **User Authentication**: Secure signup/login with session-based authentication
- **Password Security**: 12+ character requirement with uppercase and special characters
- **Room Listings**: Browse available student accommodations with filters
- **Favorites**: Save and manage favorite properties
- **Messaging**: Contact landlords directly through the platform
- **Room Posting**: Landlords can list properties with images and details
- **Interactive Maps**: Google Maps integration for property locations
- **Reporting**: Report inappropriate listings
- **Responsive Design**: Mobile-friendly interface

## 🔗 Application Pages

### Production URLs
- **Homepage**: https://arwin001.pythonanywhere.com/
- **Login**: https://arwin001.pythonanywhere.com/
- **Signup**: https://arwin001.pythonanywhere.com/signup
- **Browse Rooms**: https://arwin001.pythonanywhere.com/home
- **Dashboard**: https://arwin001.pythonanywhere.com/portal
- **Post Room**: https://arwin001.pythonanywhere.com/post-room
- **Django Admin**: https://arwin001.pythonanywhere.com/admin/

### Local Development URLs
- **Frontend**: http://127.0.0.1:8000/
- **Django Admin Panel**: http://127.0.0.1:8000/admin/
- **API Base**: http://127.0.0.1:8000/api/

---

## 📋 Prerequisites

Before running the project, ensure you have:
- **Python 3.8+** installed
- **pip** (Python package manager)
- **Git** (for cloning and version control)

---

## 🚀 Local Development Setup

### Step 1: Clone Repository
```bash
git clone https://github.com/arvinshf/studentnest-housing-platform.git
cd studentnest-housing-platform/backend
```

### Step 2: Set Up Python Virtual Environment
```bash
python -m venv venv
```

### Step 3: Activate Virtual Environment
```bash
# On Windows (PowerShell)
.\venv\Scripts\Activate.ps1

# On macOS/Linux
source venv/bin/activate
```

### Step 4: Install Dependencies
```bash
pip install -r requirements.txt
```

**Key Dependencies:**
- Django 6.0.1
- djangorestframework
- django-cors-headers
- Pillow (image handling)
- psycopg2-binary (PostgreSQL support)
- gunicorn (production server)
- whitenoise (static files serving)

### Step 5: Run Database Migrations
```bash
python manage.py migrate
```

### Step 6: Create Superuser
```bash
python manage.py createsuperuser
```

### Step 7: Collect Static Files
```bash
python manage.py collectstatic
```

---

## 🏃 Running Locally

### Start Django Server
```bash
cd backend
python manage.py runserver
```

**Server runs at**: http://127.0.0.1:8000/

Django serves both frontend templates and API endpoints.

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
```
studentnest-housing-platform/
├── backend/                    # Django backend
│   ├── accounts/              # Main Django app
│   │   ├── models.py         # Database models (Student, Room, Message, Favorite, Report)
│   │   ├── views.py          # API endpoints
│   │   ├── serializers.py    # Data serialization
│   │   ├── urls.py           # URL routing
│   │   ├── admin.py          # Django admin configuration
│   │   └── migrations/       # Database migrations
│   ├── templates/            # HTML templates
│   │   ├── index.html       # Login page
│   │   ├── signup.html      # Registration
│   │   ├── home.html        # Room listings
│   │   ├── portal.html      # User dashboard
│   │   ├── post-room.html   # Post listing
│   │   └── room-details.html # Room details
│   ├── static/              # Static files
│   │   ├── *.css           # Stylesheets
│   │   ├── *.js            # JavaScript
│   │   └── images/         # Static images
│   ├── staticfiles/         # Collected static files (production)
│   ├── media/              # User uploads
│   │   └── room_images/   # Room photos
│   ├── studentnest/        # Django project settings
│   │   ├── settings.py    # Configuration
│   │   ├── urls.py        # Main URL routing
│   │   └── wsgi.py        # WSGI config
│   ├── manage.py           # Django management
│   └── requirements.txt    # Python dependencies
│
├── components/             # Reusable components
│   ├── footer.html
│   ├── navigation.html
│   └── login-form.html
│
├── locales/               # Internationalization
│   └── en.json
│
├── .gitignore            # Git ignore rules
└── README.md             # This file
```

---

## 🔧 API Endpoints

### Authentication
- `POST /api/signup/` - Create new student account
  - Required: name, surname, email, phone, city, password, student_id
  - Password validation: 12+ chars, 1 uppercase, 1 special character
- `POST /api/login/` - Login (session-based)
- `POST /api/logout/` - Logout and clear session
- `GET /api/check-session/` - Check authentication status

### Rooms
- `GET /api/rooms/` - List all active rooms with filters
  - Query params: location, min_price, max_price, room_type, availability
- `POST /api/rooms/` - Create new room (authenticated)
  - Supports up to 5 images
- `GET /api/rooms/{id}/` - Get room details
- `PUT /api/rooms/{id}/` - Update room (owner only)
- `DELETE /api/rooms/{id}/` - Delete room (owner only)

### Favorites
- `GET /api/favorites/` - List user's favorite rooms
- `POST /api/favorites/add/` - Add room to favorites
- `POST /api/favorites/remove/` - Remove from favorites
- `GET /api/favorites/check/` - Check if room is favorited

### Messages
- `GET /api/messages/` - List user's messages
- `POST /api/messages/send/` - Send message to landlord
- `POST /api/messages/mark-read/` - Mark message as read

### Reports
- `POST /api/reports/create/` - Report inappropriate listing
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
### Student Model
- `id` - Auto-generated ID (Primary Key)
- `email` - Student email (unique)
- `name` - First name
- `surname` - Last name
- `password` - Hashed password
- `phone` - Phone number
- `city` - City of residence
- `student_id` - 8-digit student ID
- `is_online` - Online status
- `last_activity` - Last activity timestamp

### Room Model
- `id` - Auto-generated ID
- `title` - Room title
- `location` - Location description
- `postcode` - Postal code for maps
- `distance_to_transport` - Distance description
- `price` - Monthly rent (decimal)
- `available` - Available from date
- `description` - Full description
- `room_type` - Type (Single/Double/Ensuite/Studio)
- `furnished` - Furnished status
- `bills_included` - Bills status
- `deposit` - Deposit amount
- `image_1` to `image_5` - Room photos
- `owner` - Foreign key to Student
- `owner_name` - Cached owner name
- `owner_email` - Cached owner email
- `is_active` - Active listing status
- `created_at` - Creation timestamp

### Message Model
- `sender` - Foreign key to Student
- `recipient` - Foreign key to Student
- `room` - Optional foreign key to Room
- `subject` - Message subject
- `content` - Message body
- `is_read` - Read status
- `read_at` - Read timestamp
- `created_at` - Sent timestamp

### Favorite Model
- `student` - Foreign key to Student
- `room` - Foreign key to Room
- `created_at` - Added timestamp
- Unique constraint on (student, room)

### Report Model
- `reporter` - Foreign key to Student
- `room` - Foreign key to Room
- `reason` - Report reason
- `description` - Detailed description
- `is_reviewed` - Review status
- `created_at` - Report timestamp

---

## 🎨 Key Features

### ✅ Implemented Features
- [x] **Authentication & Security**
  - Session-based authentication with cookies
  - Password strength validation (12+ chars, uppercase, special)
  - Email validation (@westminster.ac.uk)
  - Secure logout with session clearing
  
- [x] **Room Management**
  - List rooms with filters (location, price, type, availability)
  - Post new listings with up to 5 images
  - Image preview before upload
  - Edit/delete own listings
  - Owner-only permissions
  
- [x] **User Dashboard**
  - View posted rooms
  - Manage favorites
  - Inbox for messages
  - Profile display
  
- [x] **Favorites System**
  - Save/unsave rooms
  - Persistent favorites list
  - Quick access from dashboard
  
- [x] **Messaging**
  - Contact landlords directly
  - Message inbox with unread count
  - Mark messages as read
  - Room context in messages
  
- [x] **Interactive Maps**
  - Google Maps integration
  - Automatic geocoding from postcode
  - Property location markers
  
- [x] **Reporting**
  - Report inappropriate listings
  - Admin review system
  
- [x] **Responsive Design**
  - Mobile-friendly interface
  - Touch-optimized controls
  - Adaptive layouts

---

## 🛠️ Technology Stack

### Backend
- **Framework**: Django 6.0.1
- **API**: Django REST Framework
- **Database**: PostgreSQL (production), SQLite (development)
- **Server**: Gunicorn + WhiteNoise
- **Image Processing**: Pillow
- **Authentication**: Session-based with cookies

### Frontend
- **HTML5** with Django templates
- **CSS3** with custom styling
- **JavaScript** (Vanilla ES6+)
- **Google Maps API** for location features
- **Fetch API** for AJAX requests

### Deployment
- **Platform**: PythonAnywhere
- **Version Control**: Git + GitHub
- **Static Files**: WhiteNoise
- **Media Files**: PythonAnywhere media serving

---

## 🐛 Troubleshooting

### Common Issues

**Issue: Old cached JavaScript files loading**
```bash
# On server
cd ~/studentnest-housing-platform/backend
rm -rf staticfiles
python manage.py collectstatic --noinput

# In browser
# Open DevTools (F12) → Network tab → Check "Disable cache"
# Or use Incognito/Private window
```

**Issue: Django server won't start**
```bash
# Check port availability
netstat -ano | findstr :8000

# Activate virtualenv
source venv/bin/activate  # Linux/Mac
.\venv\Scripts\Activate.ps1  # Windows

# Run migrations
python manage.py migrate
```

**Issue: Static files not loading**
```bash
python manage.py collectstatic --noinput
```

**Issue: Images not uploading**
- Check `MEDIA_ROOT` and `MEDIA_URL` in settings.py
- Ensure media folder has write permissions
- Verify image size < 5MB

---

# 📝 Deployment Notes

### PythonAnywhere Setup
1. Git pull latest changes
2. Activate virtualenv: `source ~/.virtualenvs/studentnest/bin/activate`
3. Install dependencies: `pip install -r requirements.txt`
4. Run migrations: `python manage.py migrate`
5. Collect static files: `python manage.py collectstatic --noinput`
6. Reload web app from Web tab

### Environment Variables (Optional)
Create `.env` file in backend folder:
```
SECRET_KEY=your-secret-key
DEBUG=False
ALLOWED_HOSTS=arwin001.pythonanywhere.com
DATABASE_URL=your-database-url
```

---

## 👥 Contributing

This is a student project. For issues or suggestions:
1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request

---

## 📄 License

This project is for educational purposes.
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
