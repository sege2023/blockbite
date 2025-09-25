import boto3
import os
from botocore.exceptions import ClientError
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_r2_connection():
    print("🔧 Testing R2 Connection...")
    
    # Get credentials from environment
    access_key = os.getenv('R2_ACCESS_KEY_ID')
    secret_key = os.getenv('R2_SECRET_ACCESS_KEY')
    account_id = os.getenv('R2_ACCOUNT_ID')
    bucket_name = os.getenv('R2_BUCKET_NAME')
    
    print(f"📋 Configuration check:")
    print(f"   Access Key: {'✅ Set' if access_key else '❌ Missing'}")
    print(f"   Secret Key: {'✅ Set' if secret_key else '❌ Missing'}")
    print(f"   Account ID: {'✅ Set' if account_id else '❌ Missing'}")
    print(f"   Bucket Name: {'✅ Set' if bucket_name else '❌ Missing'}")
    
    if not all([access_key, secret_key, account_id, bucket_name]):
        print("❌ Missing required environment variables")
        return False
    
    try:
        # Create S3 client for R2
        s3_client = boto3.client(
            's3',
            endpoint_url=f'https://{account_id}.r2.cloudflarestorage.com',
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name='auto'  # R2 uses 'auto' as region
        )
        
        print("🔍 Testing connection methods...")
        
        # Test 1: Try to access the specific bucket instead of listing all buckets
        try:
            print(f"   Testing access to bucket '{bucket_name}'...")
            response = s3_client.head_bucket(Bucket=bucket_name)
            print("   ✅ Bucket access successful")
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == '404':
                print(f"   ❌ Bucket '{bucket_name}' not found")
            elif error_code == '403':
                print(f"   ❌ Access denied to bucket '{bucket_name}'")
            else:
                print(f"   ❌ Bucket access error: {error_code}")
            return False
        
        # Test 2: Try to list objects in the bucket
        try:
            print("   Testing object listing...")
            response = s3_client.list_objects_v2(Bucket=bucket_name, MaxKeys=1)
            object_count = response.get('KeyCount', 0)
            print(f"   ✅ Can list objects (found {object_count} objects)")
        except ClientError as e:
            print(f"   ❌ Cannot list objects: {e.response['Error']['Code']}")
            return False
        
        # Test 3: Try to upload a small test file
        try:
            print("   Testing file upload...")
            test_content = "R2 connection test"
            test_key = "test-connection.txt"
            
            s3_client.put_object(
                Bucket=bucket_name,
                Key=test_key,
                Body=test_content.encode('utf-8'),
                ContentType='text/plain'
            )
            print("   ✅ File upload successful")
            
            # Clean up test file
            s3_client.delete_object(Bucket=bucket_name, Key=test_key)
            print("   ✅ Test cleanup successful")
            
        except ClientError as e:
            print(f"   ❌ Upload test failed: {e.response['Error']['Code']}")
            return False
        
        print("🎉 All R2 tests passed! Connection is working properly.")
        return True
        
    except ClientError as e:
        error_code = e.response['Error']['Code']
        error_message = e.response['Error']['Message']
        print(f"❌ R2 connection failed: {error_code} - {error_message}")
        
        # Provide specific troubleshooting advice
        if error_code == 'AccessDenied':
            print("\n🔧 Troubleshooting AccessDenied:")
            print("   1. Check that your R2 API token has the correct permissions")
            print("   2. Verify your Account ID is correct")
            print("   3. Ensure the bucket name exists and you have access to it")
            print("   4. Check if your token has expired")
        
        return False
        
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        return False

if __name__ == "__main__":
    test_r2_connection()