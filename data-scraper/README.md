# Cannabis Strain Data Importer

This script imports the enhanced strain data from `enhanced-data.json` into your PostgreSQL database.

## Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Ensure your database is ready:**
   - Run the `models.sql` script to create tables first
   - Make sure PostgreSQL is accessible at the configured host

## Usage

```bash
python import_to_db.py
```

## Configuration

The script is configured with these database credentials:
- **Host:** 147.182.235.71
- **User:** papstorea
- **Port:** 5432
- **Database:** defaultdb (you may need to change this)

## What it imports

The script imports all strain data into the following tables:
- `strains` - Main strain information
- `strain_akas` - Alternative names
- `strain_effects` - Positive and negative effects
- `strain_flavors` - Flavor profiles
- `strain_terpenes` - Terpene information
- `strain_medical_benefits` - Medical conditions and percentages
- `strain_genetics` - Parent/child relationships

## Features

- ✅ **Conflict handling:** Uses `ON CONFLICT DO NOTHING` to avoid duplicates
- ✅ **Data validation:** Cleans and validates data before insertion
- ✅ **Batch processing:** Uses efficient batch inserts for performance
- ✅ **Error handling:** Comprehensive error handling with rollbacks
- ✅ **Progress tracking:** Shows detailed progress during import

## Expected Output

```
🌿 Cannabis Strain Database Importer
========================================
📊 Loading strain data...
Loaded 2304 strains from enhanced-data.json
🔌 Connecting to database...
📝 Importing data...
Inserted 2304 strains
Inserted 156 strain aliases
Inserted 8912 strain effects
Inserted 3456 strain flavors
Inserted 1234 strain terpenes
Inserted 2890 medical benefits
Inserted 4567 genetic relationships

✅ Import completed successfully!
📈 Total strains processed: 2304
🔐 Database connection closed
```

## Troubleshooting

- **Connection errors:** Check database credentials and network access
- **Permission errors:** Ensure database user has INSERT permissions
- **Data errors:** Check that `enhanced-data.json` exists and is valid JSON
- **Schema errors:** Ensure `models.sql` has been run to create tables