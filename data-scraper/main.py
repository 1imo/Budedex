#!/usr/bin/env python3
"""
Leafly Strains Data Scraper
Scrapes strain information from leafly.com including names, URLs, and AKAs
"""

import requests
from bs4 import BeautifulSoup
import json
import time
import re
from urllib.parse import urljoin
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class LeaflyStrainScraper:
    def __init__(self):
        self.base_url = "https://www.leafly.com"
        self.strains_url = "https://www.leafly.com/strains"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        })
        self.strains_data = []

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

    def parse_strain_card(self, card):
        """Parse individual strain card to extract data"""
        strain_data = {}
        
        try:
            # If card is a link, get the URL directly
            if card.name == 'a' and card.get('href'):
                strain_data['url'] = urljoin(self.base_url, card['href'])
                # Extract strain name from URL as fallback
                url_parts = card['href'].split('/')
                if len(url_parts) >= 3 and url_parts[1] == 'strains':
                    strain_data['name'] = url_parts[2].replace('-', ' ').title()
            
            # Try to find the parent container that has all strain info
            strain_container = card
            if card.name == 'a':
                # Look for parent containers that might have the strain info
                parent = card.find_parent('div', class_=lambda x: x and 'shadow-low' in x)
                if parent:
                    strain_container = parent
                else:
                    strain_container = card
            
            # Get strain name (try multiple selectors)
            name_element = strain_container.find('div', class_='font-bold text-sm mb-xs')
            if not name_element:
                # Alternative selector
                name_element = strain_container.find(class_=lambda x: x and 'font-bold' in x and 'text-sm' in x)
            if name_element:
                strain_data['name'] = name_element.get_text(strip=True)
            
            # Get strain URL if not already found
            if 'url' not in strain_data:
                link_element = strain_container.find('a', {'data-testid': 'strain-card'})
                if not link_element:
                    link_element = strain_container.find('a', href=lambda x: x and '/strains/' in x)
                if link_element and link_element.get('href'):
                    strain_data['url'] = urljoin(self.base_url, link_element['href'])
            
            # Get AKAs (alternative names)
            aka_element = strain_container.find('div', class_='text-xs truncate-lines text-grey md:min-h-[20px]')
            if not aka_element:
                # Try alternative selector
                aka_element = strain_container.find(class_=lambda x: x and 'text-grey' in x and 'text-xs' in x)
            
            if aka_element:
                aka_text = aka_element.get_text(strip=True)
                if aka_text and aka_text.startswith('aka '):
                    # Remove 'aka ' prefix and split by commas
                    akas = [aka.strip() for aka in aka_text[4:].split(',')]
                    strain_data['akas'] = akas
                else:
                    strain_data['akas'] = []
            else:
                strain_data['akas'] = []
            
            # Get strain type (Sativa, Indica, Hybrid)
            type_element = strain_container.find('div', class_='inline-block font-bold text-xs bg-leafly-white py-xs px-sm rounded mr-xs')
            if not type_element:
                # Try alternative selector
                type_element = strain_container.find(class_=lambda x: x and 'bg-leafly-white' in x)
            if type_element:
                strain_data['type'] = type_element.get_text(strip=True)
            
            # Get THC percentage
            thc_elements = strain_container.find_all('span', class_='mr-md text-xs')
            if not thc_elements:
                thc_elements = strain_container.find_all(class_=lambda x: x and 'text-xs' in x)
            
            for element in thc_elements:
                text = element.get_text(strip=True)
                if text.startswith('THC'):
                    strain_data['thc'] = text
                    break
            
            return strain_data
            
        except Exception as e:
            logger.error(f"Error parsing strain card: {e}")
            return None

    def extract_json_data(self, html_content):
        """Extract strain data from the JSON embedded in the HTML"""
        try:
            # Find the JSON data in the script tag
            start_marker = '"strains":['
            start_index = html_content.find(start_marker)
            if start_index == -1:
                logger.error("Could not find strains JSON data in HTML")
                return []
            
            # Find the end of the strains array
            bracket_count = 0
            current_index = start_index + len(start_marker) - 1  # Start at the opening bracket
            
            for i, char in enumerate(html_content[current_index:], current_index):
                if char == '[':
                    bracket_count += 1
                elif char == ']':
                    bracket_count -= 1
                    if bracket_count == 0:
                        end_index = i + 1
                        break
            else:
                logger.error("Could not find end of strains JSON array")
                return []
            
            # Extract and parse the JSON
            json_str = html_content[start_index + len(start_marker) - 1:end_index]
            strains_data = json.loads(json_str)
            
            logger.info(f"Extracted {len(strains_data)} strains from JSON data")
            return strains_data
            
        except Exception as e:
            logger.error(f"Error extracting JSON data: {e}")
            return []

    def parse_json_strain(self, strain_json):
        """Parse strain data from JSON format"""
        try:
            strain_data = {
                'name': strain_json.get('name', ''),
                'url': urljoin(self.base_url, f"/strains/{strain_json.get('slug', '')}"),
                'type': strain_json.get('phenotype', ''),
                'thc': f"THC {strain_json.get('thc', 0)}%" if strain_json.get('thc') else 'THC —',
                'akas': []
            }
            
            # Extract AKAs from subtitle
            subtitle = strain_json.get('subtitle', '')
            if subtitle and subtitle.startswith('aka '):
                akas = [aka.strip() for aka in subtitle[4:].split(',')]
                strain_data['akas'] = akas
            
            # Add additional info
            strain_data['rating'] = strain_json.get('averageRating', 0)
            strain_data['review_count'] = strain_json.get('reviewCount', 0)
            strain_data['top_effect'] = strain_json.get('topEffect', '')
            strain_data['category'] = strain_json.get('category', '')
            
            return strain_data
            
        except Exception as e:
            logger.error(f"Error parsing JSON strain data: {e}")
            return None

    def scrape_page(self, page_num=1):
        """Scrape strains from a specific page"""
        if page_num == 1:
            url = self.strains_url
        else:
            url = f"{self.strains_url}?page={page_num}"
        
        html_content = self.get_page(url)
        if not html_content:
            logger.error(f"Failed to fetch page {page_num}")
            return []
        
        # Extract strain data from embedded JSON
        strains_json = self.extract_json_data(html_content)
        
        page_strains = []
        for strain_json in strains_json:
            strain_data = self.parse_json_strain(strain_json)
            if strain_data and strain_data.get('name'):
                page_strains.append(strain_data)
                logger.info(f"Scraped: {strain_data['name']}")
        
        return page_strains

    def scrape_all_pages(self):
        """Scrape all available pages with delays"""
        logger.info("Starting scrape of all available pages...")
        
        page_num = 1
        while True:
            logger.info(f"Scraping page {page_num}")
            
            page_strains = self.scrape_page(page_num)
            
            # If no strains found, we've reached the end
            if not page_strains:
                logger.info(f"No strains found on page {page_num}. Scraping complete!")
                break
            
            self.strains_data.extend(page_strains)
            logger.info(f"Page {page_num} complete. Found {len(page_strains)} strains. Total so far: {len(self.strains_data)}")
            
            # Add delay between pages
            logger.info("Waiting 10 seconds before next page...")
            time.sleep(10)
            
            page_num += 1
        
        logger.info(f"Scraping complete! Total strains collected: {len(self.strains_data)}")

    def save_to_json(self, filename="data.json"):
        """Save scraped data to JSON file"""
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump({
                    'total_strains': len(self.strains_data),
                    'scrape_timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
                    'strains': self.strains_data
                }, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Data saved to {filename}")
            return True
        except Exception as e:
            logger.error(f"Error saving to JSON: {e}")
            return False

    def print_summary(self):
        """Print a summary of scraped data"""
        if not self.strains_data:
            logger.info("No strains data to summarize")
            return
        
        print(f"\n{'='*50}")
        print(f"SCRAPING SUMMARY")
        print(f"{'='*50}")
        print(f"Total strains scraped: {len(self.strains_data)}")
        print(f"\nSample strains:")
        
        for i, strain in enumerate(self.strains_data[:5]):
            print(f"\n{i+1}. {strain.get('name', 'N/A')}")
            print(f"   URL: {strain.get('url', 'N/A')}")
            print(f"   Type: {strain.get('type', 'N/A')}")
            print(f"   AKAs: {', '.join(strain.get('akas', []))}")
            print(f"   THC: {strain.get('thc', 'N/A')}")
        
        if len(self.strains_data) > 5:
            print(f"\n... and {len(self.strains_data) - 5} more strains")

def main():
    """Main function to run the scraper"""
    scraper = LeaflyStrainScraper()
    
    try:
        # Scrape all available pages
        scraper.scrape_all_pages()
        
        # Save to JSON
        scraper.save_to_json("data.json")
        
        # Print summary
        scraper.print_summary()
        
    except KeyboardInterrupt:
        logger.info("Scraping interrupted by user")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise

if __name__ == "__main__":
    main()
