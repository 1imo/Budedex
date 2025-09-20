#!/usr/bin/env python3
"""
Enhanced Leafly Strains Data Scraper
Reads data.json and scrapes detailed information from each strain's individual page
"""

import requests
from bs4 import BeautifulSoup
import json
import time
import re
from urllib.parse import urljoin
import logging
import os
from pathlib import Path

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class EnhancedLeaflyStrainScraper:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        })
        self.enhanced_data = []
        self.images_dir = Path("images")
        self.images_dir.mkdir(exist_ok=True)

    def load_basic_data(self, filename="data.json"):
        """Load the basic strain data from JSON file"""
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data.get('strains', [])
        except Exception as e:
            logger.error(f"Error loading basic data: {e}")
            return []

    def get_page(self, url):
        """Fetch a page with error handling"""
        try:
            logger.info(f"Fetching: {url}")
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            return response.text
        except requests.RequestException as e:
            logger.error(f"Error fetching {url}: {e}")
            return None

    def download_image(self, image_url, strain_name):
        """Download strain image and save with strain name"""
        try:
            if not image_url:
                return None
            
            # Clean strain name for filename
            safe_name = re.sub(r'[^\w\s-]', '', strain_name).strip()
            safe_name = re.sub(r'[-\s]+', '_', safe_name).lower()
            
            # Get image extension from URL
            if '?' in image_url:
                image_url_clean = image_url.split('?')[0]
            else:
                image_url_clean = image_url
            
            # Determine file extension
            if image_url_clean.endswith(('.jpg', '.jpeg')):
                ext = '.jpg'
            elif image_url_clean.endswith('.png'):
                ext = '.png'
            elif image_url_clean.endswith('.webp'):
                ext = '.webp'
            else:
                ext = '.jpg'  # default
            
            filename = f"{safe_name}{ext}"
            filepath = self.images_dir / filename
            
            # Skip if file already exists
            if filepath.exists():
                logger.info(f"Image already exists: {filename}")
                return str(filepath)
            
            # Download image
            logger.info(f"Downloading image: {image_url}")
            response = self.session.get(image_url, timeout=30)
            response.raise_for_status()
            
            # Save image
            with open(filepath, 'wb') as f:
                f.write(response.content)
            
            logger.info(f"Saved image: {filename}")
            return str(filepath)
            
        except Exception as e:
            logger.error(f"Error downloading image for {strain_name}: {e}")
            return None

    def extract_detailed_info(self, html_content, basic_strain_data):
        """Extract detailed information from strain page HTML"""
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Start with basic data
        enhanced_strain = basic_strain_data.copy()
        
        try:
            # Extract main strain image
            image_url = None
            main_image = soup.find('img', {'data-testid': 'image-picture-image'})
            if main_image and main_image.get('srcset'):
                # Get the highest quality image from srcset
                srcset = main_image['srcset']
                # Parse srcset to get the highest resolution image
                srcset_parts = srcset.split(',')
                if srcset_parts:
                    # Take the first URL (usually highest quality)
                    image_url = srcset_parts[0].strip().split(' ')[0]
            elif main_image and main_image.get('src'):
                image_url = main_image['src']
            
            # Download image if found
            image_path = None
            if image_url:
                image_path = self.download_image(image_url, basic_strain_data.get('name', 'unknown'))
                enhanced_strain['image_path'] = image_path
                enhanced_strain['image_url'] = image_url
            
            # Extract description
            description_container = soup.find('div', {'data-testid': 'strain-description-container'})
            if description_container:
                description_text = description_container.get_text(strip=True)
                enhanced_strain['description'] = description_text
            
            # Extract detailed effects (positive and negative)
            effects_section = soup.find('section', id=lambda x: x and 'strain-sensations' in x)
            if not effects_section:
                effects_section = soup.find('div', id='strain-sensations-section')
            
            if effects_section:
                # Positive effects
                positive_effects = []
                positive_section = effects_section.find('h3', string=lambda x: x and 'Positive Effects' in x)
                if positive_section:
                    effects_container = positive_section.find_next('div', class_='row')
                    if effects_container:
                        effect_links = effects_container.find_all('a', {'data-testid': 'icon-tile-link'})
                        for link in effect_links:
                            effect_name = link.find('p', {'data-testid': 'item-name'})
                            if effect_name:
                                positive_effects.append(effect_name.get_text(strip=True).title())
                
                # Negative effects
                negative_effects = []
                negative_section = effects_section.find('h3', string=lambda x: x and 'Negative Effects' in x)
                if negative_section:
                    effects_container = negative_section.find_next('div', class_='row')
                    if effects_container:
                        effect_links = effects_container.find_all('a', {'data-testid': 'icon-tile-link'})
                        for link in effect_links:
                            effect_name = link.find('p', {'data-testid': 'item-name'})
                            if effect_name:
                                negative_effects.append(effect_name.get_text(strip=True).title())
                
                enhanced_strain['positive_effects'] = positive_effects
                enhanced_strain['negative_effects'] = negative_effects
            
            # Extract flavors
            flavors = []
            
            # Look for flavors section by finding the h2 with "strain flavors"
            flavors_section = soup.find('h2', string=lambda x: x and 'strain flavors' in x)
            if flavors_section:
                flavors_container = flavors_section.find_next('div', class_='row')
                if flavors_container:
                    flavor_links = flavors_container.find_all('a', {'data-testid': 'icon-tile-link'})
                    for link in flavor_links:
                        flavor_name = link.find('p', {'data-testid': 'item-name'})
                        if flavor_name:
                            flavor_text = flavor_name.get_text(strip=True).title()
                            if not flavor_text.startswith('Loading'):
                                flavors.append(flavor_text)
            
            # Alternative: Extract flavors from description text
            if not flavors and enhanced_strain.get('description'):
                description = enhanced_strain['description']
                # Look for flavor keywords in description
                flavor_keywords = ['vanilla', 'pepper', 'butter', 'lemon', 'citrus', 'berry', 'sweet', 'sour', 'earthy', 'pine', 'diesel', 'cheese', 'mint', 'chocolate', 'coffee', 'grape', 'apple', 'cherry', 'orange', 'tropical', 'floral', 'spicy', 'herbal']
                
                for keyword in flavor_keywords:
                    if keyword.lower() in description.lower():
                        flavors.append(keyword.title())
                
                # Remove duplicates while preserving order
                flavors = list(dict.fromkeys(flavors))
            
            enhanced_strain['flavors'] = flavors
            
            # Extract terpenes with more detail
            terpenes = []
            
            # Look for terpenes in the science section
            terpenes_section = soup.find('h3', string=lambda x: x and 'terpenes' in x)
            if terpenes_section:
                # Find the parent container and look for terpene info
                terpene_container = terpenes_section.find_next('div')
                if terpene_container:
                    # Look for individual terpene entries
                    terpene_entries = terpene_container.find_all('div', class_='flex relative mb-sm')
                    for entry in terpene_entries:
                        terpene_info = {}
                        name_element = entry.find('span', class_='font-bold')
                        if name_element:
                            terpene_info['name'] = name_element.get_text(strip=True)
                            
                            # Get terpene type/flavor (in parentheses)
                            type_element = entry.find('span', class_='text-grey')
                            if type_element:
                                type_text = type_element.get_text(strip=True)
                                if type_text.startswith('(') and type_text.endswith(')'):
                                    terpene_info['type'] = type_text[1:-1]
                            
                            # Get description if available
                            desc_element = entry.find('div', class_='text-xs')
                            if desc_element:
                                desc_text = desc_element.get_text(strip=True)
                                if desc_text and not desc_text.startswith('('):
                                    terpene_info['description'] = desc_text
                            
                            terpenes.append(terpene_info)
            
            # Alternative: look for terpenes in the top section
            if not terpenes:
                terpene_elements = soup.find_all('div', class_='inline-flex relative mb-sm mr-[24px]')
                for elem in terpene_elements:
                    terpene_name = elem.get_text(strip=True)
                    if terpene_name:
                        terpenes.append({'name': terpene_name, 'type': '', 'description': ''})
            
            enhanced_strain['detailed_terpenes'] = terpenes
            
            # Extract "helps with" conditions
            helps_with = []
            helps_section = soup.find('div', id='helps-with-section')
            if helps_section:
                condition_items = helps_section.find_all('li', class_='mb-xl')
                for item in condition_items:
                    condition_link = item.find('a', class_='font-bold underline')
                    percentage_text = item.find('span', class_='font-bold')
                    if condition_link and percentage_text:
                        condition_name = condition_link.get_text(strip=True)
                        percentage_str = percentage_text.get_text(strip=True)
                        # Convert percentage to number (remove % sign)
                        try:
                            percentage_num = int(percentage_str.replace('%', '').strip())
                        except ValueError:
                            percentage_num = 0
                        
                        helps_with.append({
                            'condition': condition_name,
                            'percentage': percentage_num
                        })
            
            enhanced_strain['helps_with'] = helps_with
            
            # Extract genetics/lineage
            genetics = {}
            lineage_section = soup.find('section', id='strain-lineage-section')
            if lineage_section:
                parents = []
                children = []
                
                # Look for strain links in lineage section
                strain_links = lineage_section.find_all('a', href=lambda x: x and '/strains/' in x)
                for link in strain_links:
                    # Get strain name from the href
                    href = link.get('href', '')
                    if '/strains/' in href:
                        strain_slug = href.split('/strains/')[-1]
                        strain_name = strain_slug.replace('-', ' ').title()
                        
                        # Check if it's a parent or child
                        type_elem = link.find('div', class_='text-green text-xs')
                        if type_elem:
                            type_text = type_elem.get_text(strip=True)
                            if type_text == 'parent':
                                parents.append(strain_name)
                            elif type_text == 'child':
                                children.append(strain_name)
                
                genetics['parents'] = parents
                genetics['children'] = children
            
            enhanced_strain['genetics'] = genetics
            
            # Extract grow information
            grow_info = {}
            grow_section = soup.find('section', id='strain-grow-info-section')
            if grow_section:
                grow_notes = grow_section.find('div', {'data-testid': 'grow-notes'})
                if grow_notes:
                    grow_info['notes'] = grow_notes.get_text(strip=True)
            
            enhanced_strain['grow_info'] = grow_info
            
            # Extract rating details
            rating_element = soup.find('span', string=lambda x: x and 'ratings' in x)
            if rating_element:
                rating_text = rating_element.get_text(strip=True)
                # Extract number from text like "(2,631 ratings)"
                rating_match = re.search(r'\(([0-9,]+)\s+ratings?\)', rating_text)
                if rating_match:
                    enhanced_strain['detailed_review_count'] = rating_match.group(1)
            
            return enhanced_strain
            
        except Exception as e:
            logger.error(f"Error extracting detailed info: {e}")
            return enhanced_strain

    def scrape_strain_details(self, strain_data):
        """Scrape detailed information for a single strain"""
        url = strain_data.get('url')
        if not url:
            logger.error(f"No URL found for strain: {strain_data.get('name', 'Unknown')}")
            return strain_data
        
        html_content = self.get_page(url)
        if not html_content:
            logger.error(f"Failed to fetch details for: {strain_data.get('name', 'Unknown')}")
            return strain_data
        
        enhanced_strain = self.extract_detailed_info(html_content, strain_data)
        logger.info(f"Enhanced data for: {enhanced_strain.get('name', 'Unknown')}")
        
        return enhanced_strain

    def scrape_enhanced_data(self, strain_list, limit=None):
        """Scrape enhanced data for a list of strains"""
        if limit:
            strain_list = strain_list[:limit]
            logger.info(f"Processing first {limit} strains for testing")
        
        for i, strain in enumerate(strain_list, 1):
            logger.info(f"Processing strain {i}/{len(strain_list)}: {strain.get('name', 'Unknown')}")
            
            enhanced_strain = self.scrape_strain_details(strain)
            self.enhanced_data.append(enhanced_strain)
            
            # Add delay between requests
            if i < len(strain_list):
                logger.info("Waiting 10 seconds before next request...")
                time.sleep(10)
        
        logger.info(f"Enhanced scraping complete! Processed {len(self.enhanced_data)} strains")

    def save_enhanced_data(self, filename="enhanced-data.json"):
        """Save enhanced data to JSON file"""
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump({
                    'total_strains': len(self.enhanced_data),
                    'scrape_timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
                    'enhanced_strains': self.enhanced_data
                }, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Enhanced data saved to {filename}")
            return True
        except Exception as e:
            logger.error(f"Error saving enhanced data: {e}")
            return False

    def print_enhanced_summary(self):
        """Print a summary of enhanced data"""
        if not self.enhanced_data:
            logger.info("No enhanced data to summarize")
            return
        
        print(f"\n{'='*60}")
        print(f"ENHANCED SCRAPING SUMMARY")
        print(f"{'='*60}")
        print(f"Total strains enhanced: {len(self.enhanced_data)}")
        
        for i, strain in enumerate(self.enhanced_data[:3]):
            print(f"\n{'-'*40}")
            print(f"{i+1}. {strain.get('name', 'N/A')}")
            print(f"   URL: {strain.get('url', 'N/A')}")
            print(f"   Type: {strain.get('type', 'N/A')}")
            print(f"   AKAs: {', '.join(strain.get('akas', []))}")
            print(f"   THC: {strain.get('thc', 'N/A')}")
            print(f"   Rating: {strain.get('rating', 'N/A')}")
            print(f"   Positive Effects: {', '.join(strain.get('positive_effects', []))}")
            print(f"   Negative Effects: {', '.join(strain.get('negative_effects', []))}")
            print(f"   Flavors: {', '.join(strain.get('flavors', []))}")
            helps_with_list = [f"{h['condition']} ({h['percentage']}%)" for h in strain.get('helps_with', [])]
            print(f"   Helps With: {helps_with_list}")
            print(f"   Parents: {', '.join(strain.get('genetics', {}).get('parents', []))}")
            print(f"   Children: {', '.join(strain.get('genetics', {}).get('children', []))}")
            print(f"   Image Path: {strain.get('image_path', 'N/A')}")
            print(f"   Image URL: {strain.get('image_url', 'N/A')}")
            
            if strain.get('description'):
                desc = strain['description'][:200] + "..." if len(strain['description']) > 200 else strain['description']
                print(f"   Description: {desc}")

def main():
    """Main function to run the enhanced scraper"""
    scraper = EnhancedLeaflyStrainScraper()
    
    try:
        # Load basic strain data
        logger.info("Loading basic strain data from data.json...")
        basic_strains = scraper.load_basic_data("data.json")
        
        if not basic_strains:
            logger.error("No strain data found in data.json")
            return
        
        logger.info(f"Loaded {len(basic_strains)} strains from data.json")
        
        # Process all strains (including image downloads)
        logger.info("Processing all strains (including image downloads)...")
        scraper.scrape_enhanced_data(basic_strains)
        
        # Save enhanced data
        scraper.save_enhanced_data("enhanced-data.json")
        
        # Print summary
        scraper.print_enhanced_summary()
        
    except KeyboardInterrupt:
        logger.info("Enhanced scraping interrupted by user")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise

if __name__ == "__main__":
    main()
