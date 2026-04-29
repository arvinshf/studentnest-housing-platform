# StudentNest Backend

This folder contains the real backend code for StudentNest.
If you are reading this for supervision, assessment, or deployment, this is the part of the project that powers authentication, room management, messaging, favorites, reports, and password reset.

## What "live hosted code" means in this project

When I say "live hosted code", I mean the application source files that are deployed to the server and executed by Django.

In this project, that code is mainly inside:
- `accounts/` (models, serializers, API views, URLs)
- `studentnest/` (Django settings, project URLs, WSGI/ASGI)
- `templates/` (server-rendered pages)
- `static/` (frontend JS/CSS served by Django)
- `frontend/` (page routing/views for templates)

## 🔗 Application Pages

### Production URLs
- **Homepage**: https://arwin001.pythonanywhere.com/
- **Login**: https://arwin001.pythonanywhere.com/
- **Signup**: https://arwin001.pythonanywhere.com/signup
- **Browse Rooms**: https://arwin001.pythonanywhere.com/home
- **Dashboard**: https://arwin001.pythonanywhere.com/portal
- **Post Room**: https://arwin001.pythonanywhere.com/post-room
- **Django Admin**: https://arwin001.pythonanywhere.com/admin/

## 📋 Prerequisites

Before running the project, ensure you have:
- **Python 3.8+** installed
- **pip** (Python package manager)
- **Git** (for cloning and version control)

## Important clarification about local vs hosted environments

The folder `.venv/` from the root workspace is a local Python environment, not authored project logic.
It contains installed packages (for example Django internals) and may differ from the server environment.

So for project submission and review:
- Use this `backend/` folder as the core codebase.
- Do not use `.venv/` as evidence of your implementation.
- Do not edit `site-packages` files to implement project features.

## Key backend files to review first

- `accounts/models.py` - data models (Student, Room, Message, Favorite, Report, PasswordResetToken)
- `accounts/serializers.py` - API validation and object conversion
- `accounts/views.py` - API business logic and security checks
- `accounts/urls.py` - API endpoint routing
- `studentnest/settings.py` - environment/security settings and app config
- `studentnest/urls.py` - project-level URL mapping

## Security notes (implementation-level)

- Passwords are hashed before storage using Django hashers (`make_password` via model methods).
- Login uses server-side session authentication.
- Protected actions check `request.session` and ownership/authorization in backend views.
- CSRF token handling is included by frontend requests for state-changing operations.

## Running locally

From this `backend/` folder:

1. Create and activate a virtual environment.
2. Install dependencies from `requirements.txt`.
3. Run migrations.
4. Start the server with `python manage.py runserver`.

If everything is configured, the API is available under `/api/` and templates are served through Django routes.

## Suggested submission package for supervisor

Minimum recommended submission:
- This `backend/` folder
- Root project documentation files (for setup/deployment context)

Recommended exclusions:
- `.venv/`
- local cache files
- machine-specific temporary files

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

## Final note

If behavior differs between local and hosted versions, always treat repository source files (not environment internals) as the primary implementation record.
