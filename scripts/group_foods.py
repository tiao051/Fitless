"""
Food Grouping Script - Brand Filtering & Food Consolidation
- Remove domestic US brands (Wegmans, Meijer, Food Lion, etc.)
- Keep global brands (KFC, McDonald's, Goya, Starbucks, etc.)
- Group similar foods into master names
- Use generic version if available, else average nutritional values
"""

import os
import csv
from collections import defaultdict
import re

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT_CSV = os.path.join(SCRIPT_DIR, "data", "fitly_data.csv")
OUTPUT_CSV = INPUT_CSV

# Domestic US brands to REMOVE
DOMESTIC_US_BRANDS = {
    'WEGMANS', 'MEIJER', 'FOOD LION', 'SHOPRITE', 'RALEY\'S', 'HY-VEE', 'WEIS',
    'GIANT EAGLE', 'HANNAFORD', 'AHOLD', 'SCHNUCKS', 'HARRIS TEETER', 'PUBLIX',
    'KINGS', 'SMART & FINAL', 'FRESH & EASY', 'WHOLE FOODS MARKET', 'KROGER',
    'ALBERTSONS', 'SAFEWAY', 'VONS', 'PAVILIONS', 'SMITH\'S', 'RALPHS',
    'FRED MEYER', 'QFC', 'HAGGEN', 'SPROUTS', 'NATURAL GROCERS', 'WINCO',
    'BROOKSHIRE\'S', 'WEGMANS ORGANIC', 'O ORGANICS', 'GOOD & GATHER',
    'ESSENTIAL EVERYDAY', 'GREAT VALUE', 'MARKET PANTRY', 'SIGNATURE SELECT',
    'NATURE\'S PROMISE', '365 EVERYDAY VALUE', '365 WHOLE FOODS MARKET',
    'WELLSLEY FARMS', 'KIRKLAND', 'SIMPLE TRUTH', 'PRIVATE SELECTION',
    'PREFERRED SELECTS', 'SMART CHOICE', 'STORE BRAND', 'SUPERMARKET BRAND',
    'HOUSE BRAND', 'GREAT', 'BASIC', 'KROGER BRAND', 'WALMART BRAND',
    'TARGET BRAND', 'COSTCO BRAND', 'SAM\'S CLUB', 'DAVE\'S',
    'KIRKLAND SIGNATURE', 'SE GROCERIES', 'TRADER JOE\'S', 'WHOLE FOODS',
    'WHOLEFOODS', 'H-E-B', 'TOPS', 'STATER BROS', 'STATER BROS.', 'WINN-DIXIE',
    'ARCHER FARMS', 'DAILY CHEF', 'AVENUE', 'NUTTY & FRUITY', 'NATURE MADE',
    'NOW FOODS', 'NATROL', 'TWINLAB', 'SCHIFF', 'SOURCE NATURALS',
    'COUNTRY LIFE', 'SWANSON', 'PURITAN\'S PRIDE', 'VITACOST',
    'LIFE EXTENSION', 'NATURESWAY', 'NATURE\'S HERBS', 'HERBAL PRODUCTS',
    'HERBAL REMEDIES', 'CRYSTAL FARMS', 'OUR FAMILY', 'FAMILY', 'JENNIE-O',
    'BOB\'S RED MILL', 'RUDI\'S', 'GREEN GIANT', 'LIGHTLIFE', 'PRIMAL KITCHEN',
    'NUTRICOST', 'ARMOUR STAR', 'OSCAR MAYER', 'HAMILTON BEACH', 'SUNBEAM',
    'OSTER', 'BELLA', 'NINJA', 'WELLNESS', 'MERRICK', 'TASTE OF THE WILD',
    'PURINA', 'IAMS', 'SHEBA', 'FANCY FEAST', 'PRO PLAN', 'HILL\'S',
    'ROYAL CANIN', 'OPEN NATURE', 'SIMPLY BALANCED', 'FAREWAY', 'FIRST STREET',
    'LOWES FOODS', 'SUNNY SELECT', 'PEREG', 'MELISSA\'S', 'GAEA', 'LORIVA'
}

# Global brands to KEEP
GLOBAL_BRANDS = {
    'GOYA', 'KFC', 'MCDONALD\'S', 'COCA-COLA', 'STARBUCKS', 'PEPSI', 'HEINZ',
    'KRAFT', 'NESTLÉ', 'NESTLE', 'GENERAL MILLS', 'KELLOGG\'S', 'CAMPBELL\'S',
    'CAMPBELL', 'LIPTON', 'WHEY GOLD STANDARD', 'OPTIMUM NUTRITION', 'QUEST',
    'ISOPURE', 'JAR JARRITA', 'LA CROIX', 'PERRIER', 'EVIAN', 'TASTER\'S CHOICE',
    'MAXWELL HOUSE', 'FRITO-LAY', 'CHEETOS', 'DORITOS', 'LAY\'S', 'QUAKER OATS',
    'HERSHEY', 'MARS', 'FERRERO', 'LINDOR', 'GODIVA', 'LINDT', 'GHIRARDELLI',
    'CADBURY', 'MONT BLANC', 'ISEY SKYR', 'ISEY', 'SKYR', 'DOLE', 'CHIQUITA',
    'SUNKIST', 'MINUTE MAID', 'TROPICANA', 'FANTA', 'SPRITE', 'DASANI',
    'AQUAFINA', 'SMARTWATER', 'VITAMINWATER'
}

def should_keep_brand(brand):
    """Keep global brands, remove domestic US brands"""
    brand_upper = brand.upper().strip()
    
    if brand_upper in GLOBAL_BRANDS or any(g in brand_upper for g in GLOBAL_BRANDS):
        return True
    
    return brand_upper not in DOMESTIC_US_BRANDS

def extract_base_food_name(name):
    """Extract base food name, removing descriptors and brand names"""
    name = re.sub(r'\s*\([^)]*\)\s*', ' ', name)
    base = name.split(',')[0].strip()
    
    word_list = base.split()
    main_words = []
    skip_words = {'organic', 'natural', 'premium', 'special', 'select', 'pure'}
    
    for i, word in enumerate(word_list):
        if i > 1:
            break
        if word.lower() not in skip_words or i == 0:
            main_words.append(word)
    
    base = ' '.join(main_words) if main_words else base
    
    descriptors = [' raw', ' cooked', ' frozen', ' canned', ' fresh', ' dried',
                   ' powder', ' oil', ' juice', ' nectar', ' syrup', ' extract',
                   ' flavor', ' sweetened', ' unsweetened', ' plain', ' vanilla',
                   ' chocolate', ' whipped', ' shredded', ' slice', ' sliced',
                   ' chopped', ' minced', ' ground', ' whole', ' pieces', ' chunks',
                   ' bar', ' blend', ' mix', ' mixture']
    
    for desc in descriptors:
        if base.lower().endswith(desc):
            base = base[:-len(desc)].strip()
            break
    
    return base.strip()

def normalize_food_name(base_name):
    """Normalize food name to standard master name"""
    name_lower = base_name.lower().strip()
    
    consolidation = {
        r'milk': 'Milk', r'yogurt': 'Yogurt', r'cheese': 'Cheese',
        r'bread': 'Bread', r'bagel': 'Bagel', r'muffin': 'Muffin', r'toast': 'Toast',
        r'fish': 'Fish', r'salmon': 'Salmon', r'tuna': 'Tuna', r'cod': 'Cod',
        r'chicken': 'Chicken', r'beef': 'Beef', r'pork': 'Pork', r'turkey': 'Turkey',
        r'bacon': 'Bacon', r'egg': 'Egg',
        r'broccoli': 'Broccoli', r'spinach': 'Spinach', r'carrot': 'Carrot',
        r'tomato': 'Tomato', r'lettuce': 'Lettuce', r'cabbage': 'Cabbage',
        r'cucumber': 'Cucumber',
        r'apple': 'Apple', r'banana': 'Banana', r'orange': 'Orange', r'grape': 'Grape',
        r'strawberry': 'Strawberry', r'blueberry': 'Blueberry', r'raspberry': 'Raspberry',
        r'rice': 'Rice', r'wheat': 'Wheat', r'oat': 'Oat', r'barley': 'Barley', r'quinoa': 'Quinoa',
    }
    
    for pattern, master in consolidation.items():
        if re.search(pattern, name_lower):
            return master
    
    return ' '.join(word.capitalize() for word in base_name.split())

def calculate_avg_macros(indices, rows):
    """Calculate average macros from a group of products"""
    fields = ['calories_kcal', 'protein_g', 'carb_g', 'fat_g', 'fiber_g', 'serving_size']
    averages = {}
    
    for field in fields:
        values = []
        for idx in indices:
            try:
                val = float(rows[idx].get(field, '-1'))
                if val > -1:
                    values.append(val)
            except:
                pass
        
        if values:
            avg = sum(values) / len(values)
            averages[field] = str(int(avg) if avg == int(avg) else avg)
        else:
            averages[field] = '-1'
    
    return averages

def process_foods(rows):
    """Filter brands, group foods, and create master foods"""
    # Filter rows by brand
    filtered_rows = []
    for row in rows:
        if should_keep_brand(row['brand'].strip()):
            filtered_rows.append(row)
    
    # Group by normalized food name
    food_groups = defaultdict(list)
    for fidx, row in enumerate(filtered_rows):
        original_name = row['name'].strip('"')
        base_name = extract_base_food_name(original_name)
        master_name = normalize_food_name(base_name)
        food_groups[master_name].append(fidx)
    
    # Create master foods and update rows
    processed_rows = [row.copy() for row in filtered_rows]
    master_foods_list = []
    
    for master_name, indices in food_groups.items():
        # Check for generic version
        generic_idx = next((i for i in indices if filtered_rows[i]['is_generic'] == 'True'), None)
        
        if generic_idx is not None:
            master_food = filtered_rows[generic_idx].copy()
        else:
            averages = calculate_avg_macros(indices, filtered_rows)
            master_food = filtered_rows[indices[0]].copy()
            for field, value in averages.items():
                master_food[field] = value
        
        master_food['name'] = master_name
        master_food['brand'] = 'Generic'
        master_food['is_generic'] = 'True'
        master_foods_list.append(master_food)
        
        # Update branded versions
        for idx in indices:
            brand = processed_rows[idx]['brand'].strip()
            if brand.upper() in GLOBAL_BRANDS or any(g in brand.upper() for g in GLOBAL_BRANDS):
                processed_rows[idx]['name'] = f"{master_name} {brand}"
            else:
                processed_rows[idx]['name'] = master_name
            processed_rows[idx]['is_generic'] = 'False'
    
    return processed_rows, master_foods_list


def main():
    if not os.path.exists(INPUT_CSV):
        print(f"[ERROR] File not found: {INPUT_CSV}")
        return
    
    with open(INPUT_CSV, 'r', encoding='utf-8') as f:
        rows = list(csv.DictReader(f))
    
    print(f"[INFO] Processing {len(rows)} foods...")
    processed_rows, master_foods = process_foods(rows)
    
    # Write to temporary file then replace original
    temp_csv = INPUT_CSV + '.tmp'
    all_rows = master_foods + processed_rows
    
    with open(temp_csv, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=list(all_rows[0].keys()))
        writer.writeheader()
        writer.writerows(all_rows)
    
    os.replace(temp_csv, OUTPUT_CSV)
    print(f"[OK] {len(master_foods)} master + {len(processed_rows)} branded = {len(all_rows)} total")


if __name__ == "__main__":
    main()
