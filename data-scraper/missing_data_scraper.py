#!/usr/bin/env python3
"""
Missing Data Scraper for Leafly Strains
Checks enhanced-data.json for strains with missing flavors/helps_with data
and re-scrapes only those specific strains to fill in the gaps.
"""

import json
import requests
from bs4 import BeautifulSoup
import time
import logging
import re
import os
from urllib.parse import urljoin, urlparse
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('missing_data_scraper.log'),
        logging.StreamHandler()
    ]
)

class MissingDataScraper:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        self.base_url = "https://www.leafly.com"
        self.enhanced_data = None
        self.missing_strains = []
        self.updated_strains = []
        
    def load_enhanced_data(self):
        """Load the existing enhanced data and identify strains with missing data"""
        try:
            with open('enhanced-data.json', 'r', encoding='utf-8') as f:
                data = json.load(f)
                self.enhanced_data = data
                
            if 'enhanced_strains' not in data:
                logging.error("No enhanced_strains found in enhanced-data.json")
                return False
                
            strains = data['enhanced_strains']
            logging.info(f"Loaded {len(strains)} strains from enhanced-data.json")
            
            # Find strains with missing data
            for strain in strains:
                has_missing_data = False
                missing_fields = []
                
                # Check for missing flavors
                if not strain.get('flavors') or len(strain.get('flavors', [])) == 0:
                    has_missing_data = True
                    missing_fields.append('flavors')
                
                # Check for missing helps_with
                if not strain.get('helps_with') or len(strain.get('helps_with', [])) == 0:
                    has_missing_data = True
                    missing_fields.append('helps_with')
                
                if has_missing_data:
                    # Generate URL from strain name
                    strain_url = self.generate_strain_url(strain.get('name', ''))
                    self.missing_strains.append({
                        'name': strain.get('name', ''),
                        'url': strain_url,
                        'missing_fields': missing_fields,
                        'original_data': strain
                    })
            
            logging.info(f"Found {len(self.missing_strains)} strains with missing data")
            for strain in self.missing_strains[:5]:  # Show first 5 as example
                logging.info(f"  - {strain['name']}: missing {', '.join(strain['missing_fields'])}")
            
            return True
            
        except FileNotFoundError:
            logging.error("enhanced-data.json not found")
            return False
        except json.JSONDecodeError as e:
            logging.error(f"Error parsing enhanced-data.json: {e}")
            return False
            
    def generate_strain_url(self, strain_name):
        """Generate strain URL from name by hyphenating spaces"""
        if not strain_name:
            return None
            
        # Convert to lowercase and replace spaces with hyphens
        url_slug = strain_name.lower().replace(' ', '-')
        # Remove special characters except hyphens
        url_slug = re.sub(r'[^a-z0-9\-]', '', url_slug)
        # Remove multiple consecutive hyphens
        url_slug = re.sub(r'-+', '-', url_slug)
        # Remove leading/trailing hyphens
        url_slug = url_slug.strip('-')
        
        return f"https://www.leafly.com/strains/{url_slug}"
        
    def extract_strain_data(self, url, strain_name):
        """Extract detailed strain data from individual strain page"""
        try:
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Look for JSON data in script tags
            script_tags = soup.find_all('script', type='application/json')
            strain_data = {}
            
            for script in script_tags:
                try:
                    json_data = json.loads(script.string)
                    if self.extract_from_json(json_data, strain_data):
                        break
                except:
                    continue
            
            # If no JSON data found, try HTML parsing
            if not strain_data.get('flavors') and not strain_data.get('helps_with'):
                self.extract_from_html(soup, strain_data)
            
            return strain_data
            
        except Exception as e:
            logging.error(f"Error extracting data from {url}: {e}")
            return {}
    
    def extract_from_json(self, json_data, strain_data):
        """Extract strain data from JSON structure"""
        found_data = False
        
        def search_json(obj, path=""):
            nonlocal found_data
            
            if isinstance(obj, dict):
                # Look for flavors
                if 'flavors' in obj and isinstance(obj['flavors'], list):
                    flavors = [f.get('name', f) if isinstance(f, dict) else str(f) for f in obj['flavors']]
                    if flavors:
                        strain_data['flavors'] = flavors
                        found_data = True
                        logging.debug(f"Found flavors in JSON: {flavors}")
                
                # Look for helps_with / medical conditions
                helps_with_keys = ['helps_with', 'medical', 'conditions', 'benefits', 'treats']
                for key in helps_with_keys:
                    if key in obj and isinstance(obj[key], list):
                        helps_with = []
                        for item in obj[key]:
                            if isinstance(item, dict):
                                condition = item.get('condition', item.get('name', ''))
                                percentage = item.get('percentage', item.get('percent', 0))
                                if condition:
                                    helps_with.append({
                                        'condition': condition,
                                        'percentage': float(percentage) if percentage else 0
                                    })
                            elif isinstance(item, str):
                                helps_with.append({
                                    'condition': item,
                                    'percentage': 0
                                })
                        
                        if helps_with:
                            strain_data['helps_with'] = helps_with
                            found_data = True
                            logging.debug(f"Found helps_with in JSON: {[h['condition'] for h in helps_with]}")
                        break
                
                # Recursively search nested objects
                for key, value in obj.items():
                    search_json(value, f"{path}.{key}" if path else key)
                    
            elif isinstance(obj, list):
                for i, item in enumerate(obj):
                    search_json(item, f"{path}[{i}]" if path else f"[{i}]")
        
        search_json(json_data)
        return found_data
    
    def extract_from_html(self, soup, strain_data):
        """Extract strain data from HTML as fallback"""
        try:
            # Try to find flavors in HTML
            flavor_elements = soup.find_all(text=re.compile(r'flavor|taste', re.I))
            flavors = []
            for element in flavor_elements:
                parent = element.parent
                if parent:
                    # Look for nearby text that might be flavors
                    siblings = parent.find_next_siblings()
                    for sibling in siblings[:3]:  # Check next 3 siblings
                        text = sibling.get_text().strip()
                        if text and len(text) < 20:  # Likely a flavor name
                            flavors.append(text)
            
            if flavors:
                strain_data['flavors'] = list(set(flavors))  # Remove duplicates
                logging.debug(f"Found flavors in HTML: {flavors}")
            
            # Try to find medical conditions in HTML
            medical_elements = soup.find_all(text=re.compile(r'helps with|medical|condition', re.I))
            helps_with = []
            for element in medical_elements:
                parent = element.parent
                if parent:
                    # Look for nearby text that might be conditions
                    siblings = parent.find_next_siblings()
                    for sibling in siblings[:3]:
                        text = sibling.get_text().strip()
                        if text and len(text) < 30:  # Likely a condition
                            helps_with.append({
                                'condition': text,
                                'percentage': 0
                            })
            
            if helps_with:
                strain_data['helps_with'] = helps_with[:5]  # Limit to 5
                logging.debug(f"Found helps_with in HTML: {[h['condition'] for h in helps_with]}")
                
        except Exception as e:
            logging.error(f"Error extracting from HTML: {e}")
    
    def update_strain_data(self, original_strain, new_data):
        """Update original strain data with newly scraped data"""
        updated_strain = original_strain.copy()
        
        # Update flavors if found
        if new_data.get('flavors'):
            updated_strain['flavors'] = new_data['flavors']
            logging.info(f"Updated flavors for {original_strain.get('name', 'Unknown')}")
        
        # Update helps_with if found
        if new_data.get('helps_with'):
            updated_strain['helps_with'] = new_data['helps_with']
            logging.info(f"Updated helps_with for {original_strain.get('name', 'Unknown')}")
        
        return updated_strain
    
    def scrape_missing_data(self):
        """Scrape missing data for identified strains"""
        if not self.missing_strains:
            logging.info("No strains with missing data found")
            return
        
        logging.info(f"Starting to scrape missing data for {len(self.missing_strains)} strains...")
        
        for i, strain_info in enumerate(self.missing_strains, 1):
            try:
                logging.info(f"Processing strain {i}/{len(self.missing_strains)}: {strain_info['name']}")
                logging.info(f"Missing fields: {', '.join(strain_info['missing_fields'])}")
                logging.info(f"Fetching: {strain_info['url']}")
                
                # Extract new data
                new_data = self.extract_strain_data(strain_info['url'], strain_info['name'])
                
                if new_data:
                    # Update the original strain data
                    updated_strain = self.update_strain_data(strain_info['original_data'], new_data)
                    self.updated_strains.append(updated_strain)
                    logging.info(f"Successfully updated data for: {strain_info['name']}")
                else:
                    # Keep original data if no new data found
                    self.updated_strains.append(strain_info['original_data'])
                    logging.warning(f"No additional data found for: {strain_info['name']}")
                
                # Rate limiting
                if i < len(self.missing_strains):
                    logging.info("Waiting 10 seconds before next request...")
                    time.sleep(10)
                    
            except Exception as e:
                logging.error(f"Error processing {strain_info['name']}: {e}")
                # Keep original data on error
                self.updated_strains.append(strain_info['original_data'])
    
    def save_updated_data(self):
        """Save the updated enhanced data"""
        if not self.enhanced_data:
            logging.error("No enhanced data to save")
            return
        
        # Update the enhanced_strains with our updated data
        strain_lookup = {strain['name']: strain for strain in self.updated_strains}
        
        updated_enhanced_strains = []
        for original_strain in self.enhanced_data['enhanced_strains']:
            strain_name = original_strain.get('name', '')
            if strain_name in strain_lookup:
                updated_enhanced_strains.append(strain_lookup[strain_name])
            else:
                updated_enhanced_strains.append(original_strain)
        
        # Create updated data structure
        updated_data = {
            'total_strains': len(updated_enhanced_strains),
            'scrape_timestamp': datetime.now().isoformat(),
            'missing_data_update_timestamp': datetime.now().isoformat(),
            'updated_strains_count': len(self.updated_strains),
            'enhanced_strains': updated_enhanced_strains
        }
        
        # Save to new file
        output_file = 'enhanced-data-updated.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(updated_data, f, indent=2, ensure_ascii=False)
        
        logging.info(f"Updated data saved to {output_file}")
        
        # Print summary
        print("\n" + "="*60)
        print("MISSING DATA SCRAPING SUMMARY")
        print("="*60)
        print(f"Total strains checked: {len(self.enhanced_data['enhanced_strains'])}")
        print(f"Strains with missing data: {len(self.missing_strains)}")
        print(f"Strains successfully updated: {len([s for s in self.updated_strains if s.get('flavors') or s.get('helps_with')])}")
        print("="*60)
        
        # Show examples of updated strains
        updated_count = 0
        for strain in self.updated_strains[:5]:  # Show first 5 updated
            if strain.get('flavors') or strain.get('helps_with'):
                updated_count += 1
                print(f"{updated_count}. {strain.get('name', 'Unknown')}")
                if strain.get('flavors'):
                    print(f"   Flavors: {', '.join(strain['flavors'])}")
                if strain.get('helps_with'):
                    conditions = [f"{h['condition']} ({h['percentage']}%)" if h['percentage'] > 0 else h['condition'] 
                                for h in strain['helps_with'][:3]]
                    print(f"   Helps With: {', '.join(conditions)}")
                print("-" * 40)

def main():
    scraper = MissingDataScraper()
    
    # Load existing data and identify missing data
    if not scraper.load_enhanced_data():
        logging.error("Failed to load enhanced data. Exiting.")
        return
    
    if not scraper.missing_strains:
        logging.info("No strains with missing data found. All strains have complete data!")
        return
    
    # Ask user for confirmation
    print(f"\nFound {len(scraper.missing_strains)} strains with missing flavors or helps_with data.")
    response = input("Do you want to scrape missing data for these strains? (y/n): ").lower().strip()
    
    if response != 'y':
        print("Scraping cancelled.")
        return
    
    # Scrape missing data
    scraper.scrape_missing_data()
    
    # Save updated data
    scraper.save_updated_data()
    
    print(f"\nMissing data scraping complete!")
    print(f"Updated data saved to: enhanced-data-updated.json")

if __name__ == "__main__":
    main()

