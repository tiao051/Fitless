import csv
import re
import os
from fractions import Fraction

# Get script directory
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(SCRIPT_DIR)

# CSV file path (latest grouped foods)
CSV_FILE = os.path.join(SCRIPT_DIR, "data", "fitly_data_processed.csv")

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
    """Convert decimal number to simple fraction"""
    try:
        num = float(num_str)
        
        if num == int(num):
            return str(int(num))
        
        # Get fractional part
        frac_part = num - int(num)
        
        if frac_part == 0:
            return str(int(num))
        
        # Find closest common fraction for the fractional part
        closest_frac = None
        min_diff = float('inf')
        
        for frac in COMMON_FRACTIONS:
            diff = abs(float(frac) - frac_part)
            if diff < min_diff:
                min_diff = diff
                closest_frac = frac
        
        # If we found a good match in fractions
        if closest_frac and min_diff < 0.05:  # Within 5% tolerance
            whole = int(num)
            if whole > 0:
                return f"{whole}-{closest_frac}".replace(" ", "")
            else:
                return str(closest_frac).replace(" ", "")
        
        # Fallback: use Fraction with limit_denominator but with smaller limit
        frac = Fraction(num).limit_denominator(12)
        return str(frac).replace(" ", "")
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
    
    # Remove parentheses content like "(50g)"
    text_cleaned = re.sub(r'\([^)]*\)', '', text).strip()
    
    # Try to match "number unit" pattern
    match = re.match(r'([0-9./]+)\s*([a-zA-Z\s]+)?', text_cleaned)
    
    if match:
        number_str = match.group(1).strip()
        unit_str = (match.group(2) or "").strip().lower()
        
        # Convert number to fraction
        try:
            if '/' in number_str:
                # Already a fraction, keep it
                return f"{number_str} {unit_str}".strip() if unit_str else number_str
            else:
                # Convert decimal to fraction
                frac_str = decimal_to_fraction(number_str)
                normalized_unit = unit_map.get(unit_str, unit_str)
                
                if unit_str and normalized_unit:
                    return f"{frac_str} {normalized_unit}".strip()
                elif frac_str:
                    return frac_str
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

