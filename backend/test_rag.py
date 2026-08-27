import os
import sys

# Ensure backend is in path
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app.services.rag.rag_pipeline import retrieve_context

def run_tests():
    print("--- STARTING RAG RETRIEVAL TESTS ---")
    
    # Test 1: Question existing in dataset
    question1 = "What is deadlock?"
    print(f"\n[TEST 1] Asking: '{question1}'")
    context, sources = retrieve_context(question1, top_k=3)
    print(f"Retrieved {len(sources)} sources.")
    print("--- CHUNKS ---")
    print(context[:500] + "...\n(Truncated for readability)")
    
    # Test 2: Different wording for a known topic
    question2 = "What scheduling algorithm uses a time quantum?"
    print(f"\n[TEST 2] Asking: '{question2}'")
    context2, sources2 = retrieve_context(question2, top_k=3)
    print(f"Retrieved {len(sources2)} sources.")
    print("--- CHUNKS ---")
    print(context2[:500] + "...\n(Truncated for readability)")

if __name__ == "__main__":
    run_tests()
