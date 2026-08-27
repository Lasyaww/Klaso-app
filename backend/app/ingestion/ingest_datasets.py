import os
import sys
import pandas as pd
import json
import chromadb
from chromadb.utils import embedding_functions

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

VECTOR_DB_PATH = os.path.join(os.path.dirname(__file__), '../../../vector_db')
os.makedirs(VECTOR_DB_PATH, exist_ok=True)
chroma_client = chromadb.PersistentClient(path=VECTOR_DB_PATH)

sentence_transformer_ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
collection = chroma_client.get_or_create_collection(name="ai_study_buddy_knowledge", embedding_function=sentence_transformer_ef)

RAW_DATA_PATH = os.path.join(os.path.dirname(__file__), '../../data/raw')

def ingest_archive3():
    print("Processing archive3 (CSV)...")
    try:
        csv_path = os.path.join(RAW_DATA_PATH, 'archive3', 'full_dataset.csv')
        df = pd.read_csv(csv_path).dropna().head(1000)
        docs, metas, ids = [], [], []
        for idx, row in df.iterrows():
            # Assume col 0 is question, col 1 is answer
            q = str(row.iloc[0]).strip()
            a = str(row.iloc[1]).strip()
            docs.append(f"Subject: General Knowledge\nTopic: Academic Q&A\nQuestion: {q}\nAnswer: {a}")
            metas.append({"source": "archive3", "subject": "General Knowledge", "type": "qa"})
            ids.append(f"a3_{idx}")
        if docs: collection.add(documents=docs, metadatas=metas, ids=ids)
        print(f"Added {len(docs)} from archive3.")
    except Exception as e:
        print(f"Failed archive3: {e}")

def ingest_archive4():
    print("Processing archive4 (JSON intents)...")
    try:
        json_path = os.path.join(RAW_DATA_PATH, 'archive4', 'intents.json')
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        docs, metas, ids = [], [], []
        idx = 0
        for intent in data.get('intents', []):
            patterns = intent.get('patterns', [])
            responses = intent.get('responses', [])
            tag = intent.get('tag', 'General')
            if patterns and responses:
                q = patterns[0].strip()
                a = responses[0].strip()
                docs.append(f"Subject: General Intents\nTopic: {tag}\nQuestion: {q}\nAnswer: {a}")
                metas.append({"source": "archive4", "subject": tag, "type": "qa"})
                ids.append(f"a4_{idx}")
                idx += 1
        if docs: collection.add(documents=docs, metadatas=metas, ids=ids)
        print(f"Added {len(docs)} from archive4.")
    except Exception as e:
        print(f"Failed archive4: {e}")

def ingest_archive5():
    print("Processing archive5 (JSONL)...")
    try:
        jsonl_path = os.path.join(RAW_DATA_PATH, 'archive5', 'data', 'train.jsonl')
        docs, metas, ids = [], [], []
        with open(jsonl_path, 'r', encoding='utf-8') as f:
            for idx, line in enumerate(f):
                if idx >= 1000: break
                item = json.loads(line)
                q = item.get('question', '')
                a = item.get('answer', '') or item.get('target', '')
                if not q: q = item.get('input', '')
                if not a: a = item.get('output', '')
                
                docs.append(f"Subject: Science and Technology\nTopic: General Q&A\nQuestion: {q}\nAnswer: {a}")
                metas.append({"source": "archive5", "subject": "Science/Tech", "type": "qa"})
                ids.append(f"a5_{idx}")
        if docs: collection.add(documents=docs, metadatas=metas, ids=ids)
        print(f"Added {len(docs)} from archive5.")
    except Exception as e:
        print(f"Failed archive5: {e}")

def ingest_archive6():
    print("Processing archive6 (CoQA)...")
    try:
        json_path = os.path.join(RAW_DATA_PATH, 'archive6', 'coqa-train-v1.0.json')
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        docs, metas, ids = [], [], []
        count = 0
        for item in data.get('data', [])[:100]: # limit to 100 stories (about 1500 qa pairs)
            story = item.get('story', '')
            questions = item.get('questions', [])
            answers = item.get('answers', [])
            for q, a in zip(questions, answers):
                docs.append(f"Subject: Conversational Reading\nTopic: Story Comprehension\nContext: {story}\nQuestion: {q['input_text']}\nAnswer: {a['input_text']}")
                metas.append({"source": "CoQA", "subject": "Conversational", "type": "qa"})
                ids.append(f"a6_{count}")
                count += 1
        if docs: collection.add(documents=docs, metadatas=metas, ids=ids)
        print(f"Added {len(docs)} from archive6.")
    except Exception as e:
        print(f"Failed archive6: {e}")

if __name__ == "__main__":
    print("Starting Dataset Ingestion into ChromaDB...")
    ingest_archive3()
    ingest_archive4()
    ingest_archive5()
    ingest_archive6()
    print("Ingestion Complete.")
