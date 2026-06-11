#!/usr/bin/env python3
"""
Fix SignMaster manifest data quality issues:
1. Add missing alphabet letters D and F
2. Move misplaced signs from Numbers to correct categories
3. Create new categories: money, math, quantities
4. Remove non-sign reference entries
"""

import json
import sys
import os

MANIFEST_PATH = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'signs-manifest.json')

# Load manifest
with open(MANIFEST_PATH, 'r') as f:
    data = json.load(f)

cats = data['categories']

# ============================================================
# 1. ADD MISSING ALPHABET LETTERS D AND F
# ============================================================
alpha_signs = cats['alphabet']['signs']

# Check if D and F already exist
existing_labels = {s['label'] for s in alpha_signs}
if 'Alphabet: D' not in existing_labels:
    d_entry = {
        "id": "alphabet_2_4",
        "label": "Alphabet: D",
        "filename": "p2_0004.png",
        "page": 2,
        "sequence": 4,
        "path": "/SignMaster/assets/all_extracted_signs/p2_0004.png",
        "verified": True,
        "description": "Learn to sign \"Alphabet: D\" in Uganda Sign Language",
        "difficulty": "beginner"
    }
    # Insert after C (sequence 3) — find the right position
    insert_idx = next((i for i, s in enumerate(alpha_signs) if s.get('sequence', 0) > 4), len(alpha_signs))
    # Find index of C and insert after it
    for i, s in enumerate(alpha_signs):
        if s['label'] == 'Alphabet: C':
            insert_idx = i + 1
            break
    alpha_signs.insert(insert_idx, d_entry)
    print(f"✅ Added Alphabet: D at index {insert_idx}")

if 'Alphabet: F' not in existing_labels:
    f_entry = {
        "id": "alphabet_2_6",
        "label": "Alphabet: F",
        "filename": "p2_0006.png",
        "page": 2,
        "sequence": 6,
        "path": "/SignMaster/assets/all_extracted_signs/p2_0006.png",
        "verified": True,
        "description": "Learn to sign \"Alphabet: F\" in Uganda Sign Language",
        "difficulty": "beginner"
    }
    # Insert after E (sequence 5)
    for i, s in enumerate(alpha_signs):
        if s['label'] == 'Alphabet: E':
            insert_idx = i + 1
            break
    alpha_signs.insert(insert_idx, f_entry)
    print(f"✅ Added Alphabet: F at index {insert_idx}")

# ============================================================
# 2. DEFINE SIGN GROUPS TO MOVE
# ============================================================

money_labels = {
    'Shillings (UGX)', 'Cost/Price', 'Expensive', 'Cheap', 'Balance/Change',
    'Pay', 'Buy', 'Sell', 'Receipt', 'Shop', 'Supermarket', 'Bank',
    'Wallet', 'Pocket', 'Lend', 'Borrow', 'Debt', 'Profit', 'Loss',
    'Poverty', 'Wealth', 'Rich', 'Poor', 'Coin', 'Note (Cash)'
}

actions_labels = {
    'Correct/Right', 'Wrong/Error', 'Try again', 'Well done'
}

math_labels = {
    'Addition', 'Subtraction', 'Multiplication', 'Division', 'Equals',
    'Greater than', 'Less than', 'Total', 'Fraction', 'Half (1/2)',
    'Quarter (1/4)', 'Percentage (%)', 'More than (>)', 'Decimal Point',
    'Infinity', 'Math Quiz', 'Answer', 'Result', 'Sum', 'Difference',
    'Quotient', 'Remainder', 'End Math'
}

quantities_labels = {
    'Many/A lot', 'Few/Some', 'Enough', 'Single', 'Double', 'Triple',
    'Series', 'Grouping', 'Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5'
}

remove_labels = {
    'Number Chart 1-10', 'Counting End', 'Sequence Start'
}

# ============================================================
# 3. MOVE SIGNS FROM NUMBERS
# ============================================================

money_signs = []
math_signs = []
quantities_signs = []
actions_to_add = []
remaining_numbers = []
removed = []

for sign in cats['numbers']['signs']:
    label = sign['label']
    if label in money_labels:
        money_signs.append(sign)
    elif label in math_labels:
        math_signs.append(sign)
    elif label in quantities_labels:
        quantities_signs.append(sign)
    elif label in actions_labels:
        actions_to_add.append(sign)
    elif label in remove_labels:
        removed.append(sign)
    else:
        remaining_numbers.append(sign)

print(f"\n📊 Numbers category reorganization:")
print(f"  Money signs moved: {len(money_signs)}")
print(f"  Math signs moved: {len(math_signs)}")
print(f"  Quantity signs moved: {len(quantities_signs)}")
print(f"  Action signs moved: {len(actions_to_add)}")
print(f"  Non-sign entries removed: {len(removed)}")
print(f"  Remaining in numbers: {len(remaining_numbers)}")

# Update numbers category
cats['numbers']['signs'] = remaining_numbers

# Add to actions
cats['actions']['signs'].extend(actions_to_add)

# Create new categories
cats['money'] = {
    "name": "Money & Commerce",
    "signs": money_signs
}

cats['math'] = {
    "name": "Mathematics",
    "signs": math_signs
}

cats['quantities'] = {
    "name": "Quantities",
    "signs": quantities_signs
}

# ============================================================
# 4. PRINT FINAL SUMMARY
# ============================================================
print(f"\n📋 Final category counts:")
total = 0
for k in sorted(cats.keys()):
    count = len(cats[k]['signs'])
    total += count
    print(f"  {cats[k]['name']} ({k}): {count} signs")
print(f"\n  TOTAL: {total} signs across {len(cats)} categories")

# Verify all expected labels were found
for label_set, name in [(money_labels, 'money'), (math_labels, 'math'), 
                         (quantities_labels, 'quantities'), (actions_labels, 'actions'),
                         (remove_labels, 'removed')]:
    found_labels = set()
    if name == 'money':
        found_labels = {s['label'] for s in money_signs}
    elif name == 'math':
        found_labels = {s['label'] for s in math_signs}
    elif name == 'quantities':
        found_labels = {s['label'] for s in quantities_signs}
    elif name == 'actions':
        found_labels = {s['label'] for s in actions_to_add}
    elif name == 'removed':
        found_labels = {s['label'] for s in removed}
    
    missing = label_set - found_labels
    if missing:
        print(f"  ⚠️  Not found in numbers for {name}: {missing}")

# ============================================================
# 5. SAVE
# ============================================================
data['cleanedAt'] = '2026-06-09T06:30:00.000Z'

with open(MANIFEST_PATH, 'w') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"\n✅ Manifest saved successfully to {MANIFEST_PATH}")
