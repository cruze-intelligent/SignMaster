#!/usr/bin/env python3
"""
SignMaster Manifest Cleanup Script
Removes non-sign entries (tables, text, forms, grammar, reviews, admin data)
and fixes miscategorized entries.
"""

import json
import os
import sys

MANIFEST_PATH = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'signs-manifest.json')
DIST_IMAGES = os.path.join(os.path.dirname(__file__), '..', 'dist', 'assets', 'all_extracted_signs')

with open(MANIFEST_PATH, 'r') as f:
    data = json.load(f)

stats_before = {}
for k, v in data['categories'].items():
    stats_before[k] = len(v['signs'])

# ============================================================
# STEP 1: Identify non-sign images by checking actual files
# These are images that contain tables/text/forms instead of
# sign language illustrations.
# ============================================================

# Known non-sign filenames (verified by visual inspection)
NON_SIGN_FILES = {
    # Food category - grammar/meta tables
    'p34_0006.png',   # Time vocabulary table, labeled "Breakfast"
    'p34_0007.png',   # Time Sequence table
    'p38_0008.png',   # Grammar: Past Tense table
    'p38_0009.png',   # Negation reference
    'p39_0010.png',   # Action Practice page  
    'p39_0011.png',   # Grammar: Sentence Examples
    'p40_0012.png',   # Sentence translation example ("Nowhere")
    
    # Actions category - non-sign content
    'p64_0023.png',   # Nursery Rhyme text (Baa Baa Black Sheep)
    'p88_0024.png',   # Teaching Methodology Checklist table
    
    # School category - admin forms/evaluations
    'p54_0022.png',   # Training Materials Checklist
    
    # Places category - methodology content
    'p51_0019.png',   # Training Methodology: Q&A
}

# ============================================================
# STEP 2: Define patterns for entries to remove
# ============================================================

def should_remove(sign, category):
    """Determine if a sign entry should be removed."""
    label = sign['label']
    filename = sign['filename']
    page = sign.get('page', 0)
    
    # Remove known non-sign files
    if filename in NON_SIGN_FILES:
        return True, "non-sign image (table/text/form)"
    
    # Remove "Review" group entries from Alphabet (bulk textbook review pages)
    if category == 'alphabet' and 'Review' in label:
        return True, "alphabet review group (not individual sign)"
    
    # Remove "Final Summary" duplicates from Alphabet
    if category == 'alphabet' and 'Final Summary' in label:
        return True, "summary page, not a sign"
    
    # Remove review/lesson markers from all categories
    review_keywords = [
        'Review End', 'Lesson Review', 'Final Review', 'Lesson End',
        'Review:', 'Feelings Review', 'People Review', 'Family Review',
        'School Review', 'School End', 'Greeting Review', 'Social Review',
        'Time Concepts Review', 'Social Values Review', 'Work Review',
        'Health Review', 'Color Review End', 'Color Final Review',
        'Animal Review:', 'Animal Trait Review', 'Animal Final Review',
        'Animal Lesson End', 'Geography Review', 'Place Lesson End',
        'Action Review End', 'Food Review End', 'Math Lesson Review',
        'Math Review', 'Counting Review', 'Multi-Sign Review',
        'Set Review', 'Financial Lesson End', 'Numbers Final Review',
        'Math Lesson End', 'Counting Practice', 'Numbers Review',
        'Greeting: Action Review',
    ]
    for kw in review_keywords:
        if kw in label:
            return True, f"review/meta marker: '{kw}'"
    
    # Remove Social category entries that are admin data (not signs)
    if category == 'social':
        admin_labels = [
            'Statistics:', 'Activity Report', 'Participant Attendance',
            'Training Metrics', 'Youth Club Enrollment'
        ]
        for kw in admin_labels:
            if kw in label:
                return True, f"administrative data: '{label}'"
    
    # Remove School entries from admin/evaluation pages
    if category == 'school' and page >= 54:
        admin_labels = [
            'Training Materials', 'Evaluation:', 'Form Header',
            'Form Content', 'Form:', 'Section:', 'Lesson Plan',
            'Participant Feedback', 'Session Ratings'
        ]
        for kw in admin_labels:
            if kw in label:
                return True, f"admin/evaluation form: '{label}'"
    
    # Remove instructional meta entries from School
    if category == 'school':
        meta_labels = [
            'Dialogue: How are you?', 'Time Vocabulary List',
            'Instruction: Palm', 'Sequence Practice'
        ]
        for kw in meta_labels:
            if kw in label:
                return True, f"instructional meta: '{label}'"
    
    # Remove non-food items from Food category
    if category == 'food':
        non_food = ['Smoking/Cigarette', 'Tobacco', 'Drug', 'Poison']
        if label in non_food:
            return True, f"not food: '{label}'"
    
    # Remove non-sign entries from Animals
    if category == 'animals':
        if 'Animal Comparison Table' in label:
            return True, f"comparison table, not a sign"
    
    # Remove from Colors
    if category == 'colors':
        if 'Grammar: Location Questions' in label:
            return True, "grammar reference, not a color sign"
    
    return False, ""


# ============================================================
# STEP 3: Process - remove, recategorize, and clean
# ============================================================

removed = []
kept = {}

for cat_key, cat_data in data['categories'].items():
    kept[cat_key] = {
        'name': cat_data['name'],
        'signs': []
    }
    
    for sign in cat_data['signs']:
        remove, reason = should_remove(sign, cat_key)
        if remove:
            removed.append({
                'category': cat_key,
                'label': sign['label'],
                'filename': sign['filename'],
                'reason': reason
            })
        else:
            kept[cat_key]['signs'].append(sign)

# ============================================================
# STEP 4: Recategorize overloaded Greetings
# Move time concepts and abstract concepts to proper categories
# ============================================================

greetings_signs = kept.get('greetings', {}).get('signs', [])
new_greetings = []

# Create new Time category
time_signs = []
# Create expanded concepts list to potentially move
abstract_signs = []

time_labels = {
    'Week', 'Month', 'Year', 'Decade', 'Century',
    'Past', 'Present', 'Future', 'Early', 'Late', 'On time',
    'Duration', 'Forever', 'Sometimes', 'Never', 'Always',
    'Frequently', 'Rarely', 'Calendar', 'Schedule', 'Appointment',
    'Morning (Practice)', 'Afternoon (Practice)', 
    'Evening (Practice)', 'Night (Practice)',
}

abstract_labels = {
    'Action', 'Movement', 'Practice', 'Skill', 'Ability',
    'Effort', 'Goal', 'Achievement', 'Challenge', 'Opportunity',
    'Result', 'Experience', 'Knowledge', 'Wisdom', 'Understanding',
    'Learning', 'Self-Improvement', 'Results',
}

social_value_labels = {
    'Help', 'Support', 'Cooperation', 'Community', 'Society',
    'Culture', 'Tradition', 'History', 'Rights', 'Duty',
    'Freedom', 'Justice', 'Peace', 'Respect', 'Love', 'Unity',
    'Progress', 'Change',
}

for sign in greetings_signs:
    label = sign['label']
    
    if label in time_labels:
        # Recategorize: update the ID prefix
        sign['id'] = sign['id'].replace('greetings_', 'time_')
        time_signs.append(sign)
    elif label in abstract_labels:
        # Keep these in Greetings for now, but could be moved
        # We'll keep them as they are legitimate USL signs 
        # taught alongside greetings in the textbook
        new_greetings.append(sign)
    elif label in social_value_labels:
        # Same - keep in greetings as the textbook groups them together
        new_greetings.append(sign)
    else:
        new_greetings.append(sign)

kept['greetings']['signs'] = new_greetings

if time_signs:
    kept['time'] = {
        'name': 'Time',
        'signs': time_signs
    }

# ============================================================
# STEP 5: Fix Food - move substance items that ARE actual signs
# to a better label context (keep as food category but fix labels)
# ============================================================

# Fix "Nowhere" was already removed as non-sign image
# Smoking/Tobacco/Drug/Poison already removed as non-food

# ============================================================  
# STEP 6: Sort categories and regenerate IDs cleanly
# ============================================================

# Desired category order
category_order = [
    'alphabet', 'numbers', 'greetings', 'family', 'emotions',
    'school', 'food', 'colors', 'animals', 'places', 'actions',
    'time', 'social'
]

ordered_categories = {}
for key in category_order:
    if key in kept and kept[key]['signs']:
        ordered_categories[key] = kept[key]

# Add any remaining categories not in the order
for key in kept:
    if key not in ordered_categories and kept[key]['signs']:
        ordered_categories[key] = kept[key]

# ============================================================
# STEP 7: Write cleaned manifest
# ============================================================

clean_manifest = {
    'version': '2.1.0',
    'generatedAt': data.get('generatedAt', ''),
    'cleanedAt': '2026-02-19T14:48:00.000Z',
    'categories': ordered_categories
}

with open(MANIFEST_PATH, 'w') as f:
    json.dump(clean_manifest, f, indent=2)

# ============================================================
# STEP 8: Print report
# ============================================================

print("=" * 60)
print("SIGNMASTER MANIFEST CLEANUP REPORT")
print("=" * 60)

total_before = sum(stats_before.values())
total_after = sum(len(c['signs']) for c in ordered_categories.values())

print(f"\nTotal signs BEFORE: {total_before}")
print(f"Total signs AFTER:  {total_after}")
print(f"Entries REMOVED:    {len(removed)}")
print(f"Time signs MOVED:   {len(time_signs)} (from Greetings → Time)")

print(f"\n{'Category':<15} {'Before':>8} {'After':>8} {'Removed':>8}")
print("-" * 45)

all_cats = set(list(stats_before.keys()) + list(ordered_categories.keys()))
for cat in category_order:
    if cat in all_cats:
        before = stats_before.get(cat, 0)
        after = len(ordered_categories.get(cat, {}).get('signs', []))
        diff = before - after
        marker = " ← NEW" if cat not in stats_before else ""
        print(f"  {cat:<13} {before:>8} {after:>8} {diff:>8}{marker}")

print(f"\n{'TOTAL':<15} {total_before:>8} {total_after:>8} {total_before - total_after:>8}")

print(f"\n--- REMOVED ENTRIES ({len(removed)}) ---")
for r in removed:
    print(f"  [{r['category']}] {r['label']}: {r['reason']}")

print(f"\n✅ Clean manifest written to: {MANIFEST_PATH}")
print(f"   Version bumped to 2.1.0")
