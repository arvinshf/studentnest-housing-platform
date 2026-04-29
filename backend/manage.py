#!/usr/bin/env python
# tells the operating system to run this file using Python

"""Django's command-line utility for administrative tasks."""

import os
# os lets us interact with environment variables and the operating system

import sys
# sys gives us access to command-line arguments (like "runserver" or "migrate")


def main():
    """Run administrative tasks."""

    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'studentnest.settings')
    # points Django to our settings file so it knows how the project is configured

    try:
        from django.core.management import execute_from_command_line
        # import Django's command runner — this handles all manage.py commands
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
        # if Django isn't installed, show a helpful error message

    execute_from_command_line(sys.argv)
    # actually runs whatever command the user typed, e.g. "python manage.py runserver"
    # sys.argv contains the command-line arguments as a list


if __name__ == '__main__':
    main()
