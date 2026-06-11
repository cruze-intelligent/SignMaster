#!/usr/bin/env python3
"""Fix content-review.json: paka labels, category updates, new alphabet records"""
import json, os

REVIEW_PATH = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'content-review.json')
MANIFEST_PATH = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'signs-manifest.json')

with open(REVIEW_PATH, 'r') as f:
    review = json.load(f)
with open(MANIFEST_PATH, 'r') as f:
    manifest = json.load(f)

records = review['records']  # This is a LIST of dicts with 'id' key

# 1. FIX PAKA LABELS
paka_wrong = {'numbers_8_148', 'numbers_13_244', 'greetings_17_341', 'school_32_242', 'places_50_18'}
paka_fixed = 0
for rec in records:
    if rec['id'] in paka_wrong and rec.get('acholiLabel') == 'paka':
        rec['acholiLabel'] = ''
        paka_fixed += 1
        print(f"✅ Fixed paka on {rec['id']} ({rec.get('originalLabel', rec.get('approvedLabel', '?'))})")

print(f"Fixed {paka_fixed} incorrect paka labels")

# 2. BUILD CATEGORY MAP FROM MANIFEST
sign_to_category = {}
for cat_key, cat_data in manifest['categories'].items():
    for sign in cat_data['signs']:
        sign_to_category[sign['id']] = cat_key

# 3. UPDATE CATEGORIES
updated = 0
for rec in records:
    rec_id = rec['id']
    if rec_id in sign_to_category:
        new_cat = sign_to_category[rec_id]
        old_cat = rec.get('category', '')
        if old_cat != new_cat:
            rec['category'] = new_cat
            updated += 1

print(f"✅ Updated category for {updated} review records")

# 4. ADD RECORDS FOR NEW ALPHABET ENTRIES
existing_ids = {r['id'] for r in records}
new_entries = [
    {
        "id": "alphabet_2_4", "category": "alphabet", "originalLabel": "Alphabet: D",
        "status": "approved", "approvedLabel": "Alphabet: D", "acholiLabel": "",
        "reviewNotes": "Added to complete alphabet - image p2_0004.png confirmed present",
        "sourceRefs": [], "licenseStatus": "existing-repo-asset",
        "instruction": {"handshape": "", "location": "", "orientation": "", "movement": "", "usageTip": ""},
        "assetOverride": None, "seededAt": "2026-06-09T06:30:00.000Z"
    },
    {
        "id": "alphabet_2_6", "category": "alphabet", "originalLabel": "Alphabet: F",
        "status": "approved", "approvedLabel": "Alphabet: F", "acholiLabel": "",
        "reviewNotes": "Added to complete alphabet - image p2_0006.png confirmed present",
        "sourceRefs": [], "licenseStatus": "existing-repo-asset",
        "instruction": {"handshape": "", "location": "", "orientation": "", "movement": "", "usageTip": ""},
        "assetOverride": None, "seededAt": "2026-06-09T06:30:00.000Z"
    }
]

for entry in new_entries:
    if entry['id'] not in existing_ids:
        records.append(entry)
        print(f"✅ Added review record for {entry['id']}")
    else:
        print(f"ℹ️  {entry['id']} already exists")

# 5. UPDATE SUMMARY
approved = sum(1 for r in records if isinstance(r, dict) and r.get('status') == 'approved')
hold = sum(1 for r in records if isinstance(r, dict) and r.get('status') == 'hold')
review['summary'] = {'total': len(records), 'approved': approved, 'hold': hold, 'rejected': 0, 'lastUpdated': '2026-06-09T06:30:00.000Z'}
print(f"\n📊 Summary: {approved} approved, {hold} hold (total: {len(records)})")

# 6. SAVE
with open(REVIEW_PATH, 'w') as f:
    json.dump(review, f, indent=2, ensure_ascii=False)
print("✅ Content review saved")
