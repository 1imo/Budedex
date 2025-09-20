#!/usr/bin/env python3
"""
Cannabis Strain Image Downloader & S3 Uploader
Downloads strain images from Leafly and uploads to S3 bucket
"""

import os
import sys
import json
import requests
import boto3
from urllib.parse import urlparse, parse_qs
from typing import List, Dict, Any
import time
from botocore.exceptions import ClientError, NoCredentialsError
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# S3 Configuration
S3_CONFIG = {
    'ACCESS_KEY': os.getenv('AWS_ACCESS_KEY_ID'),
    'SECRET_KEY': os.getenv('AWS_SECRET_ACCESS_KEY'),
    'BUCKET': os.getenv('AWS_BUCKET'),
    'REGION': os.getenv('AWS_REGION')
}

def load_strain_data() -> List[Dict[str, Any]]:
    """Load strain data from enhanced-data.json"""
    try:
        with open('enhanced-data.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        if 'enhanced_strains' in data:
            strains = data['enhanced_strains']
        else:
            strains = data
            
        print(f"📊 Loaded {len(strains)} strains from enhanced-data.json")
        return strains
        
    except FileNotFoundError:
        print("❌ Error: enhanced-data.json not found")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"❌ Error parsing JSON: {e}")
        sys.exit(1)

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
        sys.exit(1)
    except ClientError as e:
        print(f"❌ Error connecting to S3: {e}")
        sys.exit(1)

def clean_image_url(url: str) -> str:
    """Clean image URL and set size to 512px"""
    if not url:
        return None
        
    # Parse URL
    parsed = urlparse(url)
    
    # Remove all query parameters, only keep width at 512px
    clean_url = f"{parsed.scheme}://{parsed.netloc}{parsed.path}?w=512"
    
    return clean_url

def download_image(url: str, timeout: int = 30) -> bytes:
    """Download image from URL"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=timeout)
        response.raise_for_status()
        
        return response.content
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Failed to download image from {url}: {e}")
        return None

def upload_to_s3(s3_client, image_data: bytes, s3_key: str) -> bool:
    """Upload image data to S3"""
    try:
        s3_client.put_object(
            Bucket=S3_CONFIG['BUCKET'],
            Key=s3_key,
            Body=image_data,
            ContentType='image/png',
            CacheControl='max-age=31536000'  # 1 year cache
        )
        return True
        
    except ClientError as e:
        print(f"❌ Failed to upload to S3: {e}")
        return False

def generate_s3_key(strain_name: str) -> str:
    """Generate S3 key from strain name"""
    # Convert strain name to URL-friendly format
    clean_name = strain_name.lower().replace(' ', '-').replace('/', '-').replace('\\', '-')
    # Remove special characters except hyphens and alphanumeric
    clean_name = ''.join(c for c in clean_name if c.isalnum() or c == '-')
    # Remove multiple consecutive hyphens
    while '--' in clean_name:
        clean_name = clean_name.replace('--', '-')
    
    return f"strains/{clean_name}.png"

def process_strain_images(strains: List[Dict[str, Any]], s3_client):
    """Process all strain images"""
    total_strains = len(strains)
    processed = 0
    uploaded = 0
    skipped = 0
    errors = 0
    
    print(f"🖼️  Processing {total_strains} strain images...")
    print("=" * 50)
    
    for i, strain in enumerate(strains, 1):
        strain_name = strain.get('name', 'Unknown')
        image_url = strain.get('image_url')
        
        # Progress indicator
        if i % 50 == 0 or i == total_strains:
            print(f"📈 Progress: {i}/{total_strains} ({(i/total_strains)*100:.1f}%)")
        
        if not image_url:
            print(f"⚠️  {strain_name}: No image URL")
            skipped += 1
            continue
            
        # Process all images including defaults
            
        try:
            # Clean the image URL
            clean_url = clean_image_url(image_url)
            if not clean_url:
                print(f"⚠️  {strain_name}: Invalid image URL")
                skipped += 1
                continue
            
            # Generate S3 key
            s3_key = generate_s3_key(strain_name)
            
            # Check if image already exists in S3
            try:
                s3_client.head_object(Bucket=S3_CONFIG['BUCKET'], Key=s3_key)
                print(f"✅ {strain_name}: Already exists in S3")
                skipped += 1
                continue
            except ClientError:
                pass  # Image doesn't exist, proceed with upload
            
            # Download image
            print(f"⬇️  {strain_name}: Downloading from {clean_url}")
            image_data = download_image(clean_url)
            
            if not image_data:
                print(f"❌ {strain_name}: Failed to download")
                errors += 1
                continue
                
            # Upload to S3
            print(f"⬆️  {strain_name}: Uploading to S3 as {s3_key}")
            if upload_to_s3(s3_client, image_data, s3_key):
                print(f"✅ {strain_name}: Successfully uploaded")
                uploaded += 1
            else:
                print(f"❌ {strain_name}: Failed to upload to S3")
                errors += 1
                
            # Small delay to be respectful to the source server
            time.sleep(0.5)
            
        except Exception as e:
            print(f"❌ {strain_name}: Unexpected error - {e}")
            errors += 1
            
        processed += 1
    
    print("\n" + "=" * 50)
    print("🎉 Image processing complete!")
    print(f"📊 Summary:")
    print(f"   • Total strains: {total_strains}")
    print(f"   • Processed: {processed}")
    print(f"   • Uploaded: {uploaded}")
    print(f"   • Skipped: {skipped}")
    print(f"   • Errors: {errors}")
    print(f"🔗 S3 URL format: https://{S3_CONFIG['BUCKET']}.s3.{S3_CONFIG['REGION']}.amazonaws.com/strains/[strain-name].png")

def main():
    """Main function"""
    print("🌿 Cannabis Strain Image Uploader")
    print("=" * 40)
    
    # Load strain data
    strains = load_strain_data()
    
    # Initialize S3 client
    s3_client = init_s3_client()
    
    # Process images
    process_strain_images(strains, s3_client)

if __name__ == "__main__":
    main()
