import boto3
from django.conf import settings
import uuid
from botocore.exceptions import ClientError

def upload_to_r2(file, folder="products"):
    """Upload file to Cloudflare R2 and return public URL"""
    try:
        s3 = boto3.client(
            's3',
            endpoint_url=settings.AWS_S3_ENDPOINT_URL,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_S3_REGION_NAME,
        )
        
        # Generate unique filename
        # file_extension = file.name.split('.')[-1]
        # file_name = f"{folder}/{uuid.uuid4()}.{file_extension}"

        if hasattr(file, 'name'):
            # Django file object
            file_extension = file.name.split('.')[-1]
            content_type = getattr(file, 'content_type', 'image/jpeg')
        else:
            # Raw file handle - use defaults
            file_extension = 'jpg'
            content_type = 'image/jpeg'
        
        file_name = f"{folder}/{uuid.uuid4()}.{file_extension}"
        
        # Make sure we're at the beginning
        file.seek(0)
        
        # Upload file
        s3.upload_fileobj(
            file,
            settings.AWS_STORAGE_BUCKET_NAME,
            file_name,
            ExtraArgs={
                'ContentType': content_type,
                'ACL': 'public-read'  # Make file publicly accessible
            }
        )
        
        # Return public URL
        return f"https://pub-{settings.AWS_ACCESS_KEY_ID}.r2.dev/{file_name}"
        
    except ClientError as e:
        print(f"Error uploading to R2: {e}")
        return None