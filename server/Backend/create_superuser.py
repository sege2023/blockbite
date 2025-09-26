# Create this file: Backend/create_superuser.py (in the same directory as manage.py)

import os
import django
from django.conf import settings

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

def create_superuser():
    # Check if superuser already exists
    if User.objects.filter(is_superuser=True).exists():
        print("Superuser already exists")
        return
    
    # Get credentials from environment variables
    email = os.environ.get('SUPERUSER_EMAIL')
    password = os.environ.get('SUPERUSER_PASSWORD')
    
    if not email or not password:
        print("SUPERUSER_EMAIL and SUPERUSER_PASSWORD must be set")
        return
    
    try:
        user = User.objects.create_superuser(
            email=email,
            password=password
        )
        print(f"Superuser created successfully: {email}")
    except Exception as e:
        print(f"Error creating superuser: {e}")

if __name__ == "__main__":
    create_superuser()