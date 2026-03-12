import csv
import re
import os

# Get script directory
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(SCRIPT_DIR)

# CSV file path (latest grouped foods)
CSV_FILE = os.path.join(SCRIPT_DIR, "data", "fitly_data.csv")

def normalize_serving_unit(unit):
    """Normalize serving unit to standard values"""
    if not unit or unit == "N/A":
        return "N/A"
    
    unit = str(unit).strip().upper()
    
    # Normalize grams
    if unit in ["G", "GRM", "GRAM", "GRAMS"]:
        return "g"
    
    # Normalize milliliters
    if unit in ["ML", "MLT", "MILLILITER", "MILLILITERS", "FL OZ"]:
        return "ml"
    
    # Keep ounces
    if unit in ["OZ", "OUNCE", "OUNCES"]:
        return "oz"
    
    return unit

def normalize_serving_text(text):
    """Normalize serving text to consistent format"""
    if not text or text == "N/A":
        return "N/A"
    
    text = str(text).strip()
    
    # Common unit mappings
    unit_map = {
        "oza" : "oz",
        "o" : "oz",
        "ounce": "oz",
        "ounces": "oz",
        "ona": "oz",
        "ozt": "oz",
        "onz": "oz",  # Add this
        "cups": "cup",
        "mlt": "ml",
        "g": "g",
        "gram": "g",
        "grams": "g",
        "fl_oz": "fl oz",
        "unid": "unit",
        "grm" :"g",
        "cup g" : "cup"
    }
    
    # Try to extract number and unit
    # Patterns: "1/3 cup", "0.333 cup", "1.7oz (50g)", "8 fl oz", "4 ONZ", etc.
    
    # Remove parentheses content like "(50g)"
    text_cleaned = re.sub(r'\([^)]*\)', '', text).strip()
    
    # Try to match "number unit" pattern
    match = re.match(r'([0-9./]+)\s*([a-zA-Z\s]+)?', text_cleaned)
    
    if match:
        number_str = match.group(1).strip()
        unit_str = (match.group(2) or "").strip().lower()
        
        # Try to evaluate fraction/decimal
        try:
            if '/' in number_str:
                parts = number_str.split('/')
                number = float(parts[0]) / float(parts[1])
            else:
                number = float(number_str)
            
            # Keep original fraction (no rounding)
            # Normalize unit
            normalized_unit = unit_map.get(unit_str, unit_str)
            
            if unit_str and normalized_unit:
                return f"{number} {normalized_unit}".strip()
            elif number:
                return str(number)
        except:
            pass
    
    # If parsing fails, just normalize known units in original text
    text_lower = text.lower()
    for old_unit, new_unit in unit_map.items():
        if old_unit in text_lower:
            text = re.sub(rf'\b{old_unit}\b', new_unit, text, flags=re.IGNORECASE)
            break
    
    return text

print(f"[*] Cleaning {CSV_FILE}...")
rows = []

# Read and clean
with open(CSV_FILE, "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    headers = reader.fieldnames
    
    for row in reader:
        # Normalize serving_unit
        if "serving_unit" in row:
            row["serving_unit"] = normalize_serving_unit(row["serving_unit"])
        
        # Normalize serving_text
        if "serving_text" in row:
            row["serving_text"] = normalize_serving_text(row["serving_text"])
        
        rows.append(row)

print(f"[*] Processed {len(rows)} items")

# Write to new file
# Create data subdirectory if not exists
data_dir = os.path.join(SCRIPT_DIR, "data")
os.makedirs(data_dir, exist_ok=True)

output_file = os.path.join(data_dir, "fitly_data.csv")
with open(output_file, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=headers)
    writer.writeheader()
    writer.writerows(rows)

print(f"[OK] Cleaned CSV saved to {output_file}!")

