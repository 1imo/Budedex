#!/usr/bin/env python3
"""
Import enhanced-data.json into PostgreSQL database
"""

import json
import psycopg2
from psycopg2.extras import execute_batch
import os
import sys
from typing import Dict, List, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST'),
    'user': os.getenv('DB_USER'),
    'password': os.getenv('DB_PASSWORD'),
    'port': int(os.getenv('DB_PORT', 5432)),
    'database': os.getenv('DB_NAME')
}

def connect_to_db():
    """Connect to PostgreSQL database"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        conn.autocommit = False
        return conn
    except psycopg2.Error as e:
        print(f"Error connecting to database: {e}")
        sys.exit(1)

def load_json_data(file_path: str) -> List[Dict[str, Any]]:
    """Load strain data from JSON file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Handle the nested structure - extract enhanced_strains array
        if isinstance(data, dict) and 'enhanced_strains' in data:
            strains = data['enhanced_strains']
            print(f"Loaded {len(strains)} strains from {file_path}")
            print(f"Total strains in dataset: {data.get('total_strains', 'unknown')}")
            return strains
        elif isinstance(data, list):
            # Direct array format
            print(f"Loaded {len(data)} strains from {file_path}")
            return data
        else:
            print("Error: Unexpected JSON structure")
            sys.exit(1)
            
    except FileNotFoundError:
        print(f"Error: File {file_path} not found")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")
        sys.exit(1)

def clean_string(value: Any, max_length: int = None) -> str:
    """Clean and optionally truncate string values"""
    if value is None:
        return None
    cleaned = str(value).strip()
    if max_length and len(cleaned) > max_length:
        return cleaned[:max_length]
    return cleaned

def insert_strains(conn, strains_data: List[Dict[str, Any]]):
    """Insert strain data into strains table"""
    cursor = conn.cursor()
    
    strain_sql = """
        INSERT INTO strains (name, url, type, thc, cbd, rating, review_count, 
                           top_effect, category, image_path, image_url, description)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (name) DO NOTHING
    """
    
    strain_records = []
    for strain in strains_data:
        # Map strain type to valid values
        strain_type = strain.get('type', 'Hybrid')
        if strain_type not in ['Indica', 'Sativa', 'Hybrid']:
            strain_type = 'Hybrid'
            
        record = (
            clean_string(strain.get('name')),
            clean_string(strain.get('url')),
            strain_type,
            clean_string(strain.get('thc')),
            clean_string(strain.get('cbd')),
            float(strain.get('rating', 0)) if strain.get('rating') else None,
            int(strain.get('review_count', 0)) if strain.get('review_count') else 0,
            clean_string(strain.get('top_effect')),
            clean_string(strain.get('category')),
            clean_string(strain.get('image_path')),
            clean_string(strain.get('image_url')),
            clean_string(strain.get('description'))  # No length limit for descriptions
        )
        strain_records.append(record)
    
    try:
        execute_batch(cursor, strain_sql, strain_records)
        conn.commit()
        print(f"Inserted {len(strain_records)} strains")
    except psycopg2.Error as e:
        conn.rollback()
        print(f"Error inserting strains: {e}")
        raise

def insert_strain_akas(conn, strains_data: List[Dict[str, Any]]):
    """Insert strain aliases"""
    cursor = conn.cursor()
    
    aka_sql = """
        INSERT INTO strain_akas (strain_name, aka)
        VALUES (%s, %s)
        ON CONFLICT DO NOTHING
    """
    
    aka_records = []
    for strain in strains_data:
        strain_name = strain.get('name')
        akas = strain.get('akas', [])
        
        if strain_name and akas:
            for aka in akas:
                if aka and aka.strip():
                    aka_records.append((strain_name, clean_string(aka)))
    
    if aka_records:
        try:
            execute_batch(cursor, aka_sql, aka_records)
            conn.commit()
            print(f"Inserted {len(aka_records)} strain aliases")
        except psycopg2.Error as e:
            conn.rollback()
            print(f"Error inserting aliases: {e}")
            raise

def insert_effects(conn, strains_data: List[Dict[str, Any]]):
    """Insert unique effects first"""
    cursor = conn.cursor()
    
    # Collect all unique effects with their types
    all_effects = {}
    for strain in strains_data:
        # Positive effects
        positive_effects = strain.get('positive_effects', [])
        for effect in positive_effects:
            if effect and effect.strip():
                effect_clean = clean_string(effect)
                all_effects[effect_clean] = 'positive'
        
        # Negative effects
        negative_effects = strain.get('negative_effects', [])
        for effect in negative_effects:
            if effect and effect.strip():
                effect_clean = clean_string(effect)
                all_effects[effect_clean] = 'negative'
    
    # Insert unique effects
    effect_sql = """
        INSERT INTO effects (effect, type)
        VALUES (%s, %s)
        ON CONFLICT DO NOTHING
    """
    
    effect_records = [(effect, effect_type) for effect, effect_type in all_effects.items()]
    
    if effect_records:
        try:
            execute_batch(cursor, effect_sql, effect_records)
            conn.commit()
            print(f"Inserted {len(effect_records)} unique effects")
        except psycopg2.Error as e:
            conn.rollback()
            print(f"Error inserting effects: {e}")
            raise

def insert_strain_effects(conn, strains_data: List[Dict[str, Any]]):
    """Insert strain-effect relationships"""
    cursor = conn.cursor()
    
    junction_sql = """
        INSERT INTO strain_effects (strain_name, effect)
        VALUES (%s, %s)
        ON CONFLICT DO NOTHING
    """
    
    junction_records = []
    for strain in strains_data:
        strain_name = strain.get('name')
        
        # Positive effects
        positive_effects = strain.get('positive_effects', [])
        for effect in positive_effects:
            if effect and effect.strip():
                junction_records.append((strain_name, clean_string(effect)))
        
        # Negative effects
        negative_effects = strain.get('negative_effects', [])
        for effect in negative_effects:
            if effect and effect.strip():
                junction_records.append((strain_name, clean_string(effect)))
    
    if junction_records:
        try:
            execute_batch(cursor, junction_sql, junction_records)
            conn.commit()
            print(f"Inserted {len(junction_records)} strain-effect relationships")
        except psycopg2.Error as e:
            conn.rollback()
            print(f"Error inserting strain-effect relationships: {e}")
            raise

def insert_flavors(conn, strains_data: List[Dict[str, Any]]):
    """Insert unique flavors first"""
    cursor = conn.cursor()
    
    # Collect all unique flavors
    all_flavors = set()
    for strain in strains_data:
        flavors = strain.get('flavors', [])
        for flavor in flavors:
            if flavor and flavor.strip():
                all_flavors.add(clean_string(flavor))
    
    # Insert unique flavors
    flavor_sql = """
        INSERT INTO flavors (flavor)
        VALUES (%s)
        ON CONFLICT DO NOTHING
    """
    
    flavor_records = [(flavor,) for flavor in all_flavors]
    
    if flavor_records:
        try:
            execute_batch(cursor, flavor_sql, flavor_records)
            conn.commit()
            print(f"Inserted {len(flavor_records)} unique flavors")
        except psycopg2.Error as e:
            conn.rollback()
            print(f"Error inserting flavors: {e}")
            raise

def insert_strain_flavors(conn, strains_data: List[Dict[str, Any]]):
    """Insert strain-flavor relationships"""
    cursor = conn.cursor()
    
    junction_sql = """
        INSERT INTO strain_flavors (strain_name, flavor)
        VALUES (%s, %s)
        ON CONFLICT DO NOTHING
    """
    
    junction_records = []
    for strain in strains_data:
        strain_name = strain.get('name')
        flavors = strain.get('flavors', [])
        
        for flavor in flavors:
            if flavor and flavor.strip():
                junction_records.append((strain_name, clean_string(flavor)))
    
    if junction_records:
        try:
            execute_batch(cursor, junction_sql, junction_records)
            conn.commit()
            print(f"Inserted {len(junction_records)} strain-flavor relationships")
        except psycopg2.Error as e:
            conn.rollback()
            print(f"Error inserting strain-flavor relationships: {e}")
            raise

def insert_terpenes(conn, strains_data: List[Dict[str, Any]]):
    """Insert unique terpenes first"""
    cursor = conn.cursor()
    
    # Collect all unique terpenes with their metadata
    all_terpenes = {}
    for strain in strains_data:
        terpenes = strain.get('detailed_terpenes', [])
        for terpene in terpenes:
            if isinstance(terpene, dict):
                terpene_name = terpene.get('name')
                if terpene_name and terpene_name.strip():
                    terpene_name_clean = clean_string(terpene_name)
                    # Keep the first occurrence of type/description for each terpene
                    if terpene_name_clean not in all_terpenes:
                        all_terpenes[terpene_name_clean] = {
                            'type': clean_string(terpene.get('type')),
                            'description': clean_string(terpene.get('description'))
                        }
    
    # Insert unique terpenes
    terpene_sql = """
        INSERT INTO terpenes (terpene_name, terpene_type, description)
        VALUES (%s, %s, %s)
        ON CONFLICT DO NOTHING
    """
    
    terpene_records = [
        (name, data['type'], data['description']) 
        for name, data in all_terpenes.items()
    ]
    
    if terpene_records:
        try:
            execute_batch(cursor, terpene_sql, terpene_records)
            conn.commit()
            print(f"Inserted {len(terpene_records)} unique terpenes")
        except psycopg2.Error as e:
            conn.rollback()
            print(f"Error inserting terpenes: {e}")
            raise

def insert_strain_terpenes(conn, strains_data: List[Dict[str, Any]]):
    """Insert strain-terpene relationships"""
    cursor = conn.cursor()
    
    junction_sql = """
        INSERT INTO strain_terpenes (strain_name, terpene_name)
        VALUES (%s, %s)
        ON CONFLICT DO NOTHING
    """
    
    junction_records = []
    for strain in strains_data:
        strain_name = strain.get('name')
        terpenes = strain.get('detailed_terpenes', [])
        
        for terpene in terpenes:
            if isinstance(terpene, dict):
                terpene_name = terpene.get('name')
                if terpene_name and terpene_name.strip():
                    junction_records.append((strain_name, clean_string(terpene_name)))
    
    if junction_records:
        try:
            execute_batch(cursor, junction_sql, junction_records)
            conn.commit()
            print(f"Inserted {len(junction_records)} strain-terpene relationships")
        except psycopg2.Error as e:
            conn.rollback()
            print(f"Error inserting strain-terpene relationships: {e}")
            raise

def insert_medical_conditions(conn, strains_data: List[Dict[str, Any]]):
    """Insert unique medical conditions first"""
    cursor = conn.cursor()
    
    # Collect all unique conditions
    all_conditions = set()
    for strain in strains_data:
        helps_with = strain.get('helps_with', [])
        for condition in helps_with:
            if isinstance(condition, dict):
                condition_name = condition.get('condition')
                if condition_name and condition_name.strip():
                    all_conditions.add(clean_string(condition_name))
    
    # Insert unique conditions
    condition_sql = """
        INSERT INTO medical_conditions (condition_name)
        VALUES (%s)
        ON CONFLICT DO NOTHING
    """
    
    condition_records = [(condition,) for condition in all_conditions]
    
    if condition_records:
        try:
            execute_batch(cursor, condition_sql, condition_records)
            conn.commit()
            print(f"Inserted {len(condition_records)} unique medical conditions")
        except psycopg2.Error as e:
            conn.rollback()
            print(f"Error inserting medical conditions: {e}")
            raise

def insert_medical_benefits(conn, strains_data: List[Dict[str, Any]]):
    """Insert strain-medical condition relationships"""
    cursor = conn.cursor()
    
    junction_sql = """
        INSERT INTO strain_medical_benefits (strain_name, condition_name, percentage)
        VALUES (%s, %s, %s)
        ON CONFLICT DO NOTHING
    """
    
    junction_records = []
    for strain in strains_data:
        strain_name = strain.get('name')
        helps_with = strain.get('helps_with', [])
        
        for condition in helps_with:
            if isinstance(condition, dict):
                condition_name = condition.get('condition')
                percentage = condition.get('percentage')
                
                if condition_name and condition_name.strip():
                    junction_records.append((
                        strain_name,
                        clean_string(condition_name),
                        int(percentage) if percentage else None
                    ))
    
    if junction_records:
        try:
            execute_batch(cursor, junction_sql, junction_records)
            conn.commit()
            print(f"Inserted {len(junction_records)} strain-medical condition relationships")
        except psycopg2.Error as e:
            conn.rollback()
            print(f"Error inserting medical benefits: {e}")
            raise

def insert_genetics(conn, strains_data: List[Dict[str, Any]]):
    """Insert strain genetics (parents and children)"""
    cursor = conn.cursor()
    
    genetics_sql = """
        INSERT INTO strain_genetics (strain_name, related_strain, relationship)
        VALUES (%s, %s, %s)
        ON CONFLICT DO NOTHING
    """
    
    genetics_records = []
    for strain in strains_data:
        strain_name = strain.get('name')
        genetics = strain.get('genetics', {})
        
        # Parents
        parents = genetics.get('parents', [])
        for parent in parents:
            if parent and parent.strip():
                genetics_records.append((strain_name, clean_string(parent), 'parent'))
        
        # Children
        children = genetics.get('children', [])
        for child in children:
            if child and child.strip():
                genetics_records.append((strain_name, clean_string(child), 'child'))
    
    if genetics_records:
        try:
            execute_batch(cursor, genetics_sql, genetics_records)
            conn.commit()
            print(f"Inserted {len(genetics_records)} genetic relationships")
        except psycopg2.Error as e:
            conn.rollback()
            print(f"Error inserting genetics: {e}")
            raise

def main():
    """Main import function"""
    # Get the current directory and construct the JSON file path
    current_dir = os.path.dirname(os.path.abspath(__file__))
    json_file_path = os.path.join(current_dir, 'enhanced-data.json')
    
    print("🌿 Cannabis Strain Database Importer")
    print("=" * 40)
    
    # Load JSON data
    print("📊 Loading strain data...")
    strains_data = load_json_data(json_file_path)
    
    # Connect to database
    print("🔌 Connecting to database...")
    conn = connect_to_db()
    
    try:
        print("📝 Importing data...")
        
        # Import in order of dependencies
        # 1. Main strain data
        insert_strains(conn, strains_data)
        insert_strain_akas(conn, strains_data)
        
        # 2. Normalized lookup tables first
        insert_effects(conn, strains_data)
        insert_flavors(conn, strains_data)
        insert_terpenes(conn, strains_data)
        insert_medical_conditions(conn, strains_data)
        
        # 3. Junction tables (relationships)
        insert_strain_effects(conn, strains_data)
        insert_strain_flavors(conn, strains_data)
        insert_strain_terpenes(conn, strains_data)
        insert_medical_benefits(conn, strains_data)
        insert_genetics(conn, strains_data)
        
        print("\n✅ Import completed successfully!")
        print(f"📈 Total strains processed: {len(strains_data)}")
        
    except Exception as e:
        print(f"❌ Import failed: {e}")
        conn.rollback()
        sys.exit(1)
    
    finally:
        conn.close()
        print("🔐 Database connection closed")

if __name__ == "__main__":
    main()
