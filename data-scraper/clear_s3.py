#!/usr/bin/env python3
"""
Clear S3 bucket of strain images
"""

import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# S3 Configuration
S3_CONFIG = {
    'ACCESS_KEY': os.getenv('AWS_ACCESS_KEY_ID'),
    'SECRET_KEY': os.getenv('AWS_SECRET_ACCESS_KEY'),
    'BUCKET': os.getenv('AWS_BUCKET'),
    'REGION': os.getenv('AWS_REGION')
}

def init_s3_client():
    """Initialize S3 client with credentials"""
    try:
        s3_client = boto3.client(
            's3',
            aws_access_key_id=S3_CONFIG['ACCESS_KEY'],
            aws_secret_access_key=S3_CONFIG['SECRET_KEY'],
            region_name=S3_CONFIG['REGION']
        )
        
        # Test connection
        s3_client.head_bucket(Bucket=S3_CONFIG['BUCKET'])
        print(f"🔌 Connected to S3 bucket: {S3_CONFIG['BUCKET']}")
        return s3_client
        
    except NoCredentialsError:
        print("❌ Error: AWS credentials not found")
        return None
    except ClientError as e:
        print(f"❌ Error connecting to S3: {e}")
        return None

def clear_strain_images(s3_client):
    """Delete all strain images from S3 bucket"""
    try:
        # List all objects with 'strains/' prefix
        response = s3_client.list_objects_v2(
            Bucket=S3_CONFIG['BUCKET'],
            Prefix='strains/'
        )
        
        if 'Contents' not in response:
            print("✅ No strain images found in S3 bucket")
            return
            
        objects_to_delete = []
        for obj in response['Contents']:
            objects_to_delete.append({'Key': obj['Key']})
        
        if objects_to_delete:
            print(f"🗑️  Deleting {len(objects_to_delete)} strain images...")
            
            # Delete objects in batches (max 1000 per batch)
            for i in range(0, len(objects_to_delete), 1000):
                batch = objects_to_delete[i:i+1000]
                
                delete_response = s3_client.delete_objects(
                    Bucket=S3_CONFIG['BUCKET'],
                    Delete={'Objects': batch}
                )
                
                deleted_count = len(delete_response.get('Deleted', []))
                print(f"✅ Deleted {deleted_count} images")
                
                if 'Errors' in delete_response:
                    for error in delete_response['Errors']:
                        print(f"❌ Failed to delete {error['Key']}: {error['Message']}")
            
            print(f"🎉 Successfully cleared all strain images from S3!")
        else:
            print("✅ No strain images to delete")
            
    except ClientError as e:
        print(f"❌ Error clearing S3 bucket: {e}")

def main():
    """Main function"""
    print("🧹 S3 Strain Images Cleaner")
    print("=" * 30)
    
    # Initialize S3 client
    s3_client = init_s3_client()
    if not s3_client:
        return
    
    # Clear strain images
    clear_strain_images(s3_client)

if __name__ == "__main__":
    main()
