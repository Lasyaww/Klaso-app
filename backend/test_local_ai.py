import os
import sys

import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app.services.ai_service import generate_ai_chat_response

def run_tests():
    print("--- STARTING TESTS ---")
    
    # Test 1: Academic Query
    print("\n[TEST 1] Testing an academic query: 'What is deadlock?'")
    try:
        response = generate_ai_chat_response("What is deadlock?", subject_context="Operating Systems")
        print(f"Response:\n{response}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    run_tests()
