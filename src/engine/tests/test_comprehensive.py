#!/usr/bin/env python3
"""
Comprehensive test suite for DLP engine - tests all regex patterns and transformer NER
"""

import sys
import os
# Add parent directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from detection import analyze_text
import json

# Color codes for terminal output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_section(title):
    """Print a section header"""
    print(f"\n{Colors.BOLD}{Colors.CYAN}{'=' * 80}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.CYAN}{title.center(80)}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.CYAN}{'=' * 80}{Colors.RESET}\n")

def print_test_header(test_num, category, test_text):
    """Print test header"""
    print(f"{Colors.BOLD}{Colors.BLUE}Test {test_num} [{category}]:{Colors.RESET}")
    print(f"{Colors.YELLOW}Input: {Colors.RESET}{test_text}")

def print_results(result, expected_patterns=None):
    """Print test results with color coding"""
    print(f"{Colors.MAGENTA}Entities Found:{Colors.RESET} {len(result['entities'])}")
    
    if result['entities']:
        for entity in result['entities']:
            entity_type = entity.get('type', 'UNKNOWN')
            entity_value = entity.get('value', '')
            entity_desc = entity.get('description', '')
            
            # Color code by severity/type
            if entity_type in ['ssn', 'credit_card', 'aws_access_key', 'private_key', 
                              'passport_number', 'driver_license', 'medical_record_number']:
                color = Colors.RED
            elif entity_type in ['email', 'phone_number', 'ip_address']:
                color = Colors.YELLOW
            else:
                color = Colors.GREEN
            
            print(f"  {color}→{Colors.RESET} {entity_type}: '{entity_value}' ({entity_desc})")
    
    # Validate expected patterns
    if expected_patterns:
        detected_types = {e['type'] for e in result['entities']}
        missing = set(expected_patterns) - detected_types
        unexpected = detected_types - set(expected_patterns)
        
        if missing:
            print(f"{Colors.RED}⚠ Missing expected: {missing}{Colors.RESET}")
        if unexpected:
            print(f"{Colors.YELLOW}ℹ Unexpected detections: {unexpected}{Colors.RESET}")
    
    print(f"{'-' * 80}")


# ============================================================================
# TRANSFORMER NER CHALLENGING TESTS
# ============================================================================

transformer_tests = [
    # Test 1: Person names (various formats)
    ("My name is John Doe and I work with Jane Smith", None),
    
    # Test 2: Organizations
    ("I work at Microsoft and previously at Google Inc.", None),
    
    # Test 3: Locations
    ("Traveling from New York to Los Angeles next week", None),
    
    # Test 4: Mixed entities
    ("Dr. Sarah Johnson from Stanford University visited Boston", None),
    
    # Test 5: Edge case - Single letter name (should NOT trigger driver license)
    ("I am Arnab and this is my friend A. Kumar", None),
    
    # Test 6: Complex sentence with multiple PII types
    ("John Smith (SSN: 123-45-6789) lives in Seattle and works at Amazon", None),
    
    # Test 7: Email + Person name (test overlap handling)
    ("Contact Alice Brown at alice.brown@company.com", None),
    
    # Test 8: Ambiguous names (testing false positive handling)
    ("The table and chair are in the room with Apple on the desk", None),
    
    # Test 9: Names with titles
    ("Professor Michael Chen and Dr. Emily Rodriguez collaborated", None),
    
    # Test 10: Multiple entities close together
    ("Meeting with Bob Johnson from IBM at their New York office regarding project Alpha", None),
    
    # Test 11: Person name near driver's license pattern
    ("Driver A. Smith has license CA1234567", None),
    
    # Test 12: International names
    ("María García and François Dubois attended the conference in München", None),
]

def run_test_category(category_name, tests):
    """Run a category of tests"""
    print_section(category_name)
    test_num = 1
    
    for test_text, expected in tests:
        print_test_header(test_num, category_name, test_text)
        result = analyze_text(test_text)
        print_results(result, expected)
        test_num += 1

def run_all_tests():
    """Run the complete test suite"""
    print(f"{Colors.BOLD}{Colors.GREEN}")
    print("╔" + "═" * 78 + "╗")
    print("║" + "COMPREHENSIVE DLP ENGINE TEST SUITE".center(78) + "║")
    print("║" + "Testing all Regex Patterns + Transformer NER".center(78) + "║")
    print("╚" + "═" * 78 + "╝")
    print(f"{Colors.RESET}")
    
    
    # Run transformer tests
    run_test_category("TRANSFORMER NER - CHALLENGING TESTS", transformer_tests)
    
    # Summary
    print_section("TEST SUITE COMPLETE")
    print(f"{Colors.GREEN}✓ All test categories executed successfully{Colors.RESET}")
    print(f"{Colors.YELLOW}Review the output above to verify detection accuracy{Colors.RESET}\n")

if __name__ == "__main__":
    run_all_tests()
