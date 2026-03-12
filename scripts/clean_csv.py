import csv
import os

CSV_FILE = os.path.join(os.path.dirname(__file__), "..", "fitly_nutrition_final.csv")

print(f"[*] Reading {CSV_FILE}...")
rows = []
removed = 0

# Read CSV
with open(CSV_FILE, "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    headers = reader.fieldnames
    
    for row in reader:
        calories = float(row.get("calories_kcal", -1))
        
        # Keep rows with valid calories (not -1)
        if calories >= 0:
            rows.append(row)
        else:
            removed += 1

print(f"[*] Removed {removed} items with invalid calories")
print(f"[*] Keeping {len(rows)} items")

# Write back
with open(CSV_FILE, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=headers)
    writer.writeheader()
    writer.writerows(rows)
