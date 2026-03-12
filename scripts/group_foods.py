"""
Food Grouping Script - Only process names with exactly 1 word
- If name = 1 word + has >1 product => Create Master Food
- If name = 1 word + only 1 product => Keep as is
- If name = 2+ words or has comma => SKIP COMPLETELY
"""

import os
import csv
from collections import defaultdict

# Get script directory
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# Input/Output paths
INPUT_CSV = os.path.join(SCRIPT_DIR, "data", "fitly_data.csv")
OUTPUT_PROCESSED_CSV = os.path.join(SCRIPT_DIR, "data", "fitly_data.csv")


def is_single_word(name):
    """Check if name is exactly 1 word (no space, no comma, no parentheses)"""
    name = name.strip('"')
    # If has space, comma, or parentheses => not 1 word
    if ' ' in name or ',' in name or '(' in name or ')' in name:
        return False
    return True


def normalize_name(name):
    """Capitalize each first letter"""
    return " ".join(word.capitalize() for word in name.split())


def load_csv(filepath):
    """Load CSV file"""
    rows = []
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    return rows


def calculate_avg_macros(indices, rows):
    """Calculate average macros from a group of products"""
    numeric_fields = ['calories_kcal', 'protein_g', 'carb_g', 'fat_g', 'fiber_g', 'serving_size']
    averages = {}
    
    for field in numeric_fields:
        values = []
        for idx in indices:
            val = rows[idx].get(field, '-1')
            if val and val not in ['-1', '-1.0', 'N/A', '']:
                try:
                    values.append(float(val))
                except:
                    pass
        
        if values:
            avg = sum(values) / len(values)
            # Keep original fraction (no rounding)
            if avg == int(avg):
                averages[field] = str(int(avg))
            else:
                averages[field] = str(avg)
        else:
            averages[field] = '-1'
    
    return averages


def process_foods(rows):
    """
    Process:
    1. Filter names with 1 word
    2. Group identical names
    3. Create Master Food if >1 product
    """
    
    # Group by name
    name_groups = defaultdict(list)
    single_word_groups = {}  # only store 1-word names
    ignored_rows = []  # non-1-word names
    
    for idx, row in enumerate(rows):
        name = row['name'].strip('"')
        
        if is_single_word(name):
            name_groups[name].append(idx)
            single_word_groups[name] = True
        else:
            ignored_rows.append(idx)
    
    # Categorize 1-word names
    unique_single = []  # 1 word + only 1 product
    duplicate_single = []  # 1 word + >1 product
    
    for name, indices in name_groups.items():
        if len(indices) == 1:
            unique_single.append((name, indices))
        else:
            duplicate_single.append((name, indices))

    # Create processed rows
    processed_rows = [row.copy() for row in rows]
    master_foods_list = []
    grouping_info = {}
    
    # Process duplicate groups (create Master Food)
    for original_name, indices in duplicate_single:
        master_name = normalize_name(original_name)
        
        # Calculate average macros
        averages = calculate_avg_macros(indices, rows)
        
        # Create Master Food (use first row as template)
        master_food = rows[indices[0]].copy()
        master_food['name'] = master_name
        master_food['brand'] = 'Generic'
        master_food['is_generic'] = 'True'
        
        # Update macros
        for field, value in averages.items():
            master_food[field] = value
        
        master_foods_list.append(master_food)
        
        # Update and rename branded product names
        for idx in indices:
            brand = processed_rows[idx]['brand']
            new_name = f"{master_name} {brand}"
            processed_rows[idx]['name'] = new_name
        
        # Save info
        grouping_info[original_name] = {
            'type': 'duplicate_group',
            'master_name': master_name,
            'count': len(indices),
            'branded_names': [
                f"{master_name} {processed_rows[idx]['brand']}"
                for idx in indices
            ]
        }
    
    return processed_rows, master_foods_list, grouping_info, unique_single, duplicate_single, len(ignored_rows)


def save_results(processed_rows, master_foods_list, unique_single, duplicate_single, ignored_count):
    """Save results"""
    # Create data subdirectory if not exists
    data_dir = os.path.join(SCRIPT_DIR, "data")
    os.makedirs(data_dir, exist_ok=True)
    
    # Combine: Master Foods + Processed rows
    all_rows = master_foods_list + processed_rows
    
    # Save CSV
    fieldnames = list(all_rows[0].keys())
    with open(OUTPUT_PROCESSED_CSV, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(all_rows)
    print(f"[OK] CSV: {OUTPUT_PROCESSED_CSV}")


def main():
    
    if not os.path.exists(INPUT_CSV):
        print(f"[ERROR] File not found: {INPUT_CSV}")
        return
    
    rows = load_csv(INPUT_CSV)
    
    # Process
    processed_rows, master_foods, grouping_info, unique_single, duplicate_single, ignored_count = process_foods(rows)
    
    # Save
    save_results(processed_rows, master_foods, unique_single, duplicate_single, ignored_count)

if __name__ == "__main__":
    main()
