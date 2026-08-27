import os
import chromadb
from chromadb.utils import embedding_functions
from dotenv import load_dotenv

load_dotenv()

VECTOR_DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../vector_db'))
chroma_client = None
collection = None

try:
    chroma_client = chromadb.PersistentClient(path=VECTOR_DB_PATH)
    sentence_transformer_ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
    collection = chroma_client.get_collection(name="ai_study_buddy_knowledge", embedding_function=sentence_transformer_ef)
except Exception as e:
    print(f"Warning: Could not initialize ChromaDB collection. Ensure data is ingested. Error: {e}")

def retrieve_context(query: str, subject_filter: str = None, top_k: int = 4):
    """
    Retrieves the most relevant documents for the given query from ChromaDB.
    """
    if not collection:
        return "", []
        
    where_clause = None
        
    try:
        results = collection.query(
            query_texts=[query],
            n_results=top_k,
            where=where_clause
        )
        
        docs = results.get("documents", [[]])[0]
        metas = results.get("metadatas", [[]])[0]
        
        context_str = ""
        sources = []
        for i in range(len(docs)):
            context_str += f"[Source: {metas[i].get('source', 'Unknown')}]\n{docs[i]}\n\n"
            if metas[i].get('source') not in sources:
                sources.append(metas[i].get('source', 'Unknown'))
                
        return context_str, sources
    except Exception as e:
        print(f"Retrieval error: {e}")
        return "", []

def ingest_document(text: str, source: str, subject: str = "General"):
    """
    Ingests a single document into ChromaDB. Used for faculty uploaded notes.
    """
    if not collection or not text:
        return False
        
    try:
        # Very simple chunking
        chunk_size = 1000
        chunks = [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]
        
        docs = []
        metas = []
        ids = []
        
        import uuid
        base_id = str(uuid.uuid4())[:8]
        
        for i, chunk in enumerate(chunks):
            docs.append(chunk)
            metas.append({
                "source": source,
                "source_type": "college_material",
                "subject": subject,
                "type": "note"
            })
            ids.append(f"fac_{base_id}_{i}")
            
        collection.add(documents=docs, metadatas=metas, ids=ids)
        return True
    except Exception as e:
        print(f"Error ingesting document: {e}")
        return False

def build_rag_prompt(query: str, retrieved_context: str, mode: str = "chat"):
    """
    Builds the final prompt combining the context and the user's query.
    """
    base_instructions = (
        "You are an AI Study Buddy designed to help college students understand academic subjects.\n"
        "Your primary purpose is education, explanation, revision, and exam preparation.\n\n"
        "RULES:\n"
        "1. Use the provided academic context whenever it is relevant.\n"
        "2. Do not pretend that information exists in the study material when it does not.\n"
        "3. Do not fabricate facts, definitions, formulas, examples, or references.\n"
        "4. Explain concepts in simple student-friendly language.\n"
        "5. Give step-by-step explanations for difficult topics.\n"
        "6. Use examples when they improve understanding.\n"
        "7. When appropriate, provide:\n"
        "   * Definition\n"
        "   * Explanation\n"
        "   * Example\n"
        "   * Key points\n"
        "   * Summary\n"
        "8. If the student asks for a comparison, use a clear comparison.\n"
        "9. If the student asks for code, provide correct and understandable code with an explanation.\n"
        "10. If the student asks for a quiz, generate questions based primarily on the available study material.\n"
        "11. If the requested information is not available in the academic context, say that it was not found in the provided study material instead of inventing an answer.\n"
        "12. Maintain conversation context during the current chat.\n"
        "13. Do not mix unrelated subjects.\n"
        "14. Keep answers appropriate for a college student.\n"
        "15. Adapt the explanation difficulty based on the student's question.\n"
    )
    
    if mode == "simplify":
        base_instructions += "\nCRITICAL: The user has asked for a simple explanation. Explain the concept like they are a beginner without changing its meaning."
    elif mode == "summarize":
        base_instructions += "\nCRITICAL: The user wants a summary. Return concise revision notes."
    elif mode == "quiz":
        base_instructions += "\nCRITICAL: Generate a quiz based strictly on the available academic material. Provide options, correct answer, and explanation."
    elif mode == "flashcards":
        base_instructions += "\nCRITICAL: Make flashcards (Question -> Answer) based on the study material."
    elif mode == "exam":
        base_instructions += "\nCRITICAL: The user is asking for exam preparation. Return important concepts from the relevant subject/topic."
        
    user_prompt = ""
    if retrieved_context:
        user_prompt += f"--- ACADEMIC CONTEXT START ---\n{retrieved_context}\n--- ACADEMIC CONTEXT END ---\n\n"
        
    user_prompt += f"Student Query: {query}\n"
    return base_instructions, user_prompt
