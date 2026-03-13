import csv
import re
import os
import math
from fractions import Fraction

# Get script directory
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(SCRIPT_DIR)

# CSV file path (latest grouped foods)
CSV_FILE = os.path.join(SCRIPT_DIR, "data", "fitly_data_v2.csv")

# Common fractions for readable serving sizes
COMMON_FRACTIONS = [
    # Fractions (higher priority due to smaller denominator)
    Fraction(1, 2),
    Fraction(1, 3), Fraction(2, 3),
    Fraction(1, 4), Fraction(3, 4),
    Fraction(1, 5), Fraction(2, 5), Fraction(3, 5), Fraction(4, 5),
    Fraction(1, 8), Fraction(3, 8), Fraction(5, 8), Fraction(7, 8),
    Fraction(1, 6), Fraction(5, 6),
    Fraction(1, 10), Fraction(3, 10), Fraction(7, 10), Fraction(9, 10),
]

def decimal_to_fraction(num_str):
    """Convert decimal number by rounding up to nearest whole number"""
    try:
        num = float(num_str)
        
        # Round up to nearest integer for simplicity (3.5 → 4, 1.5 → 2)
        rounded = math.ceil(num)
        return str(int(rounded))
    except:
        return num_str

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
    """Normalize serving text with fractions instead of decimals"""
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
        "onz": "oz", 
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
    
    # Store prefix like "about" or "approximately"
    prefix = ""
    text_to_process = text
    if text.lower().startswith(('about ', 'approximately ')):
        parts = text.split(' ', 1)
        prefix = parts[0] + " "
        text_to_process = parts[1] if len(parts) > 1 else text
    
    # Remove parentheses content like "(50g)"
    text_cleaned = re.sub(r'\([^)]*\)', '', text_to_process).strip()
    
    # Try to match "number unit" pattern
    match = re.match(r'([0-9./\-]+)\s*([a-zA-Z\s]+)?', text_cleaned)
    
    if match:
        number_str = match.group(1).strip()
        unit_str = (match.group(2) or "").strip().lower()
        
        # Convert number to fraction/decimal
        try:
            if '-' in number_str:
                # Mixed fraction like "3-1/2" - convert to decimal
                parts = number_str.split('-')
                if len(parts) == 2 and '/' in parts[1]:
                    try:
                        whole = int(parts[0])
                        frac = Fraction(parts[1])
                        num = whole + float(frac)
                        frac_str = decimal_to_fraction(str(num))
                    except:
                        frac_str = decimal_to_fraction(number_str)
                else:
                    frac_str = decimal_to_fraction(number_str)
            elif '/' in number_str:
                # Already a fraction, keep it
                frac_str = number_str
            else:
                # Convert decimal to fraction
                frac_str = decimal_to_fraction(number_str)
            
            normalized_unit = unit_map.get(unit_str, unit_str)
            
            if unit_str and normalized_unit:
                result = f"{frac_str} {normalized_unit}".strip()
            elif frac_str:
                result = frac_str
            else:
                result = text
                
            return prefix + result
        except:
            pass
    
    # If parsing fails, just normalize known units in original text
    text_lower = text.lower()
    for old_unit, new_unit in unit_map.items():
        if old_unit in text_lower:
            text = re.sub(rf'\b{old_unit}\b', new_unit, text, flags=re.IGNORECASE)
            break
    
    return text

def normalize_serving_size(size_str):
    """Normalize serving size - keep as decimal rounded to 2 places for precision"""
    if not size_str or size_str == "N/A" or size_str == "-1":
        return size_str
    
    try:
        size = float(size_str)
        # If it's a whole number, return as integer
        if size == int(size):
            return str(int(size))
        # Otherwise round to 2 decimal places
        return f"{size:.2f}".rstrip('0').rstrip('.')
    except:
        return size_str


rows = []

# Read and clean
with open(CSV_FILE, "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    headers = reader.fieldnames
    
    for row in reader:
        # Normalize serving_unit
        if "serving_unit" in row:
            row["serving_unit"] = normalize_serving_unit(row["serving_unit"])
        
        # Normalize serving_text to fractions
        if "serving_text" in row:
            row["serving_text"] = normalize_serving_text(row["serving_text"])
        
        # Normalize serving_size to fractions
        if "serving_size" in row:
            row["serving_size"] = normalize_serving_size(row["serving_size"])
        
        rows.append(row)

# Write to new file
# Create data subdirectory if not exists
data_dir = os.path.join(SCRIPT_DIR, "data")
os.makedirs(data_dir, exist_ok=True)

output_file = os.path.join(data_dir, "fitly_data.csv")
temp_file = output_file + ".tmp"

with open(temp_file, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=headers)
    writer.writeheader()
    writer.writerows(rows)

# Replace original file
try:
    os.replace(temp_file, output_file)
    print(f"[OK] Normalized data saved to: {output_file}")
except:
    # If replace fails, just save with a different name
    alt_file = os.path.join(data_dir, "fitly_data_normalized_temp.csv")
    os.rename(temp_file, alt_file)
    print(f"[OK] Normalized data saved to: {alt_file}")
    print(f"[NOTE] Please manually replace fitly_data.csv with {alt_file}")

