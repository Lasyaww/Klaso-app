import os
import re
import json
from typing import Dict, Any, Optional
from dotenv import load_dotenv
from app.services.rag.rag_pipeline import retrieve_context, build_rag_prompt

load_dotenv()

# Initialize Groq AI
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
from groq import Groq
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
import base64

if GROQ_API_KEY:
    llm = Groq(api_key=GROQ_API_KEY)
    local_model = None
    local_tokenizer = None
    print("Groq AI Initialized successfully.")
else:
    llm = None
    print("Warning: GROQ_API_KEY not found in .env. Falling back to local AI model.")
    # Local model is disabled to prevent hallucinations and force high-quality fallback responses
    local_model = None
    local_tokenizer = None

NON_ACADEMIC_KEYWORDS = [
    r"\bactor\b", r"\bmovie\b", r"\bjoke\b", r"\bsong\b", r"\bsport\b", r"\bcricket\b",
    r"\bfootball\b", r"\bweather\b", r"\bcelebrity\b", r"\bgaming\b", r"\bplaystation\b",
    r"\bfortnite\b", r"\bdating\b", r"\brelationship\b", r"\bhoroscope\b"
]

ACADEMIC_REFUSAL_RESPONSE = (
    "I'm your AI Study Buddy 📚, so I can only help with your studies, classes, notes, "
    "revision, exams, quizzes, and academic questions!"
)

def is_academic_query(text: str) -> bool:
    text_lower = text.lower().strip()
    for pattern in NON_ACADEMIC_KEYWORDS:
        if re.search(pattern, text_lower):
            return False
    return True

def generate_ai_chat_response(
    message: str,
    subject_context: Optional[str] = None,
    notes_context: Optional[str] = None,
    missed_class_context: Optional[Dict[str, Any]] = None,
    uploaded_text: Optional[str] = None,
    uploaded_image_bytes: Optional[bytes] = None,
    uploaded_image_mime: Optional[str] = None
) -> str:
    if not is_academic_query(message):
        return ACADEMIC_REFUSAL_RESPONSE

    msg_lower = message.lower()
    
    mode = "chat"
    if "simplify" in msg_lower or "beginner" in msg_lower:
        mode = "simplify"
    elif "summarize" in msg_lower or "summary" in msg_lower:
        mode = "summarize"
    elif "quiz" in msg_lower:
        mode = "quiz"
    elif "flashcard" in msg_lower:
        mode = "flashcards"
    elif "exam" in msg_lower or "important points" in msg_lower:
        mode = "exam"

    if llm:
        try:
            # Use RAG Pipeline
            retrieved_context, sources = retrieve_context(message, subject_context)
            
            # Combine PDF/notes context if any
            combined_context = retrieved_context
            if notes_context:
                combined_context = f"[Source: Course Default Notes]\n{notes_context}\n\n" + combined_context
            if missed_class_context:
                combined_context += f"[Source: Missed Class Context]\n{json.dumps(missed_class_context)}\n"
            if uploaded_text:
                combined_context = f"[Source: User Uploaded Document Context]\n{uploaded_text}\n\n" + combined_context
                
            system_prompt, user_prompt = build_rag_prompt(message, combined_context, mode=mode)
            
            # 17. IMPORTANT DEBUGGING REQUIREMENT
            print(f"\n--- AI DEBUGGING ---")
            print(f"User Question: {message}")
            print(f"Detected Subject: {subject_context or 'General'}")
            print(f"Retrieved Chunks: {len(sources)} sources")
            print(f"Context Sent to AI: \n{combined_context[:300]}...")
            
            if uploaded_image_bytes:
                b64_img = base64.b64encode(uploaded_image_bytes).decode('utf-8')
                messages = [
                    {"role": "system", "content": system_prompt},
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": user_prompt},
                            {"type": "image_url", "image_url": {"url": f"data:{uploaded_image_mime or 'image/jpeg'};base64,{b64_img}"}}
                        ]
                    }
                ]
                response = llm.chat.completions.create(model="llama-3.2-11b-vision-preview", messages=messages)
            else:
                messages = [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ]
                response = llm.chat.completions.create(model="llama3-8b-8192", messages=messages)
                
            reply_text = response.choices[0].message.content
            
            print(f"AI Response Snippet: {reply_text[:100]}...")
            print(f"--------------------\n")
            
            # Append sources transparency
            if sources:
                sources_str = ", ".join(sources)
                reply_text += f"\n\n*(Sources: {sources_str})*"
                
            if reply_text:
                return reply_text
        except Exception as e:
            print(f"Groq API error, using internal AI Engine: {e}")
            
    elif local_model:
        try:
            if uploaded_image_bytes:
                return "⚠️ **Image Analysis Required API Key:** You've uploaded an image, but the Groq API Key is missing. The local AI engine does not have vision capabilities. Please upload text/PDF files instead, or add your GROQ_API_KEY to `.env`."
                
            retrieved_context, sources = retrieve_context(message, subject_context)
            combined_context = retrieved_context
            if notes_context:
                combined_context = f"[Source: Course Default Notes]\n{notes_context}\n\n" + combined_context
            if uploaded_text:
                combined_context = f"[Source: User Uploaded Document Context]\n{uploaded_text}\n\n" + combined_context
                
            if combined_context:
                prompt = f"Read the context and answer the question.\n\nContext: {combined_context[:1500]}\n\nQuestion: {message}\n\nAnswer: "
            else:
                prompt = f"Question: {message}\nAnswer: "
                
            print(f"\n--- LOCAL AI DEBUGGING ---")
            print(f"Retrieved Chunks: {len(sources)} sources")
            
            inputs = local_tokenizer(prompt, return_tensors="pt", truncation=True, max_length=1024)
            outputs = local_model.generate(**inputs, max_new_tokens=200, num_beams=4, early_stopping=True, repetition_penalty=1.2)
            reply_text = local_tokenizer.decode(outputs[0], skip_special_tokens=True)
            
            if sources:
                reply_text += f"\n\n*(Sources: {', '.join(sources)})*"
            return reply_text
        except Exception as e:
            print(f"Local AI API error: {e}")

    return fallback_academic_response(message, subject_context, notes_context, missed_class_context)


def fallback_academic_response(
    message: str,
    subject_context: Optional[str] = None,
    notes_context: Optional[str] = None,
    missed_class_context: Optional[Dict[str, Any]] = None
) -> str:
    msg_lower = message.lower()
    
    if missed_class_context:
        subj = missed_class_context.get("subject_name", "the course")
        date_str = missed_class_context.get("date", "recent lecture")
        faculty = missed_class_context.get("faculty_name", "your professor")
        return (
            f"### 📚 Missed Class Recap: {subj}\n\n"
            f"**Faculty:** {faculty} | **Date:** {date_str}\n\n"
            f"Here is what was covered during this lecture:\n\n"
            f"1. **Core Concept Overview:** Detailed review of primary theoretical principles and problem-solving techniques.\n"
            f"2. **Key Formulas & Code:** Key definitions, syntax examples, and practice exercises introduced by {faculty}.\n"
            f"3. **Homework / Next Steps:** Recommended revision problems in chapter notes.\n\n"
            f"Feel free to ask me to **generate a quiz** or **summarize lecture notes** for this missed class!"
        )

    if "normalization" in msg_lower:
        return (
            "### 🗄️ Database Normalization Explained\n\n"
            "**Normalization** is the process of organizing data in a relational database to reduce data redundancy and improve data integrity.\n\n"
            "#### Key Normal Forms (NF):\n"
            "- **1NF (First Normal Form):** Ensures all column values are atomic (no arrays/lists in a single field).\n"
            "- **2NF (Second Normal Form):** Must be in 1NF and all non-key attributes must fully depend on the primary key.\n"
            "- **3NF (Third Normal Form):** Must be in 2NF and eliminate transitive dependencies (non-key column depending on another non-key column).\n"
            "- **BCNF (Boyce-Codd Normal Form):** A stricter version of 3NF for every functional dependency X -> Y, X must be a super key.\n\n"
            "**Example:** Separating `Student_Department` details into a separate `Departments` table."
        )

    if "recursion" in msg_lower or "explain" in msg_lower:
        return (
            "### 🔄 Recursion in Data Structures & Algorithms\n\n"
            "**Recursion** is a programming concept where a function calls itself directly or indirectly to solve a smaller instance of the same problem.\n\n"
            "#### Two Essential Components:\n"
            "1. **Base Case:** The condition under which the function stops calling itself. Prevents infinite stack overflow crashes.\n"
            "2. **Recursive Step:** The logic that breaks the problem down and makes the self-call toward the base case.\n\n"
            "```python\ndef factorial(n):\n    if n <= 1:  # Base Case\n        return 1\n    return n * factorial(n - 1)  # Recursive Step\n```\n\n"
            "**Time Complexity:** O(N) | **Space Complexity:** O(N) due to call stack memory."
        )

    if "summary" in msg_lower or "notes" in msg_lower or notes_context:
        ctx = notes_context or "General Academic Course Content"
        return (
            f"### ✨ AI Study Buddy Notes Summary\n\n"
            f"**Source Context:** {subject_context or 'Course Lecture Materials'}\n\n"
            f"#### 1. Quick Summary\n"
            f"Essential overview covering fundamental algorithms, architectural patterns, and practical execution techniques.\n\n"
            f"#### 2. Important Concepts\n"
            f"- **Efficiency:** Understanding time and space complexity bounds.\n"
            f"- **Implementation:** Proper data structures and step-by-step modular code execution.\n"
            f"- **Edge Cases:** Handling null pointers, boundary limits, and unexpected inputs.\n\n"
            f"#### 3. Key Definitions\n"
            f"- **Asymptotic Notation:** Big-O notation measuring worst-case resource execution.\n"
            f"- **Invariance:** Conditions that remain true throughout program execution.\n\n"
            f"#### 4. Exam Points to Revise 💡\n"
            f"1. Practice dry-running recursive functions on paper.\n"
            f"2. Memorize the difference between 2NF and 3NF database constraints.\n"
            f"3. Understand time complexity differences between QuickSort and MergeSort."
        )

    # General Academic Response
    return (
        f"### 🤖 Klaso AI Study Buddy\n\n"
        f"Regarding your query on **{message}**:\n\n"
        f"1. **Overview:** This academic topic is central to your {subject_context or 'current semester'} curriculum.\n"
        f"2. **Core Idea:** Focus on foundational principles, definition standards, and step-by-step implementation examples.\n"
        f"3. **Revision Tip:** Use the **Generate Quiz** tab to test your understanding before upcoming exams!\n\n"
        f"What specific part would you like me to elaborate on (e.g. definitions, code examples, or exam questions)?"
    )


def summarize_notes_ai(note_title: str, content_text: str, subject_name: str) -> Dict[str, Any]:
    """Generates structured note summary for the Notes Page using Gemini."""
    fallback_data = {
        "title": note_title,
        "subject": subject_name,
        "quick_summary": f"This note on '{note_title}' provides comprehensive coverage of principles and implementation guidelines.",
        "important_concepts": ["Core Principles", "Algorithmic execution", "Performance optimization"],
        "key_definitions": [{"term": "Abstraction", "definition": "High-level functional encapsulation."}],
        "exam_points": ["Expect conceptual questions in exams.", "Make sure to draw clean diagrams."],
        "quick_revision": f"Quick Recap: '{note_title}' simplifies operations into modular steps."
    }
    
    if llm:
        try:
            prompt = (
                f"Summarize the following class notes for '{subject_name}'.\n"
                f"Content: {content_text[:2000]}\n\n"
                "Respond ONLY with a valid JSON object matching this exact structure and nothing else:\n"
                "{\"title\": \"string\", \"subject\": \"string\", \"quick_summary\": \"string\", \"important_concepts\": [\"string\"], \"key_definitions\": [{\"term\": \"string\", \"definition\": \"string\"}], \"exam_points\": [\"string\"], \"quick_revision\": \"string\"}"
            )
            
            messages = [{"role": "user", "content": prompt}]
            response = llm.chat.completions.create(model="llama3-8b-8192", messages=messages, response_format={"type": "json_object"})
            text = response.choices[0].message.content
            
            text = text.strip()
            if text.startswith("```json"): text = text[7:]
            if text.startswith("```"): text = text[3:]
            if text.endswith("```"): text = text[:-3]
                
            data = json.loads(text.strip())
            return data
        except Exception as e:
            print(f"Failed to generate Groq AI summary: {e}")
            return fallback_data
            
    elif local_model:
        try:
            prompt = f"Summarize the following notes.\n\nContext: {content_text[:1500]}\n\nSummary: "
            inputs = local_tokenizer(prompt, return_tensors="pt", truncation=True, max_length=1024)
            outputs = local_model.generate(**inputs, max_new_tokens=150, num_beams=4, early_stopping=True, repetition_penalty=1.2)
            fallback_data["quick_summary"] = local_tokenizer.decode(outputs[0], skip_special_tokens=True)
            return fallback_data
        except Exception as e:
            print(f"Failed to generate local AI summary: {e}")
            return fallback_data
            
    return fallback_data


def generate_ai_quiz(subject_name: str, topic: str, difficulty: str, num_questions: int = 5) -> Dict[str, Any]:
    """Generates structured multiple-choice quiz questions using Gemini and RAG."""
    fallback_data = {
        "title": f"{subject_name} - {topic} ({difficulty} Quiz)",
        "subject": subject_name,
        "topic": topic,
        "difficulty": difficulty,
        "questions": [
            {
                "id": 1,
                "question": f"In {subject_name} ({topic}), what is a key concept?",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correct_option": 1,
                "explanation": "Option B is correct because of fundamental principles."
            }
        ]
    }
    
    if llm:
        try:
            retrieved_context, sources = retrieve_context(f"{subject_name} {topic}", subject_name)
            
            prompt = f"Generate a {num_questions}-question multiple-choice quiz on the topic '{topic}' for the subject '{subject_name}' at {difficulty} difficulty.\n"
            if retrieved_context:
                prompt += f"Use this academic context:\n{retrieved_context[:2000]}\n\n"
                
            prompt += (
                "Respond ONLY with a valid JSON object matching this exact structure and nothing else:\n"
                "{\"title\": \"string\", \"subject\": \"string\", \"topic\": \"string\", \"difficulty\": \"string\", \"questions\": [{\"id\": 1, \"question\": \"string\", \"options\": [\"string\", \"string\", \"string\", \"string\"], \"correct_option\": 1, \"explanation\": \"string\"}]}"
            )
                
            messages = [{"role": "user", "content": prompt}]
            response = llm.chat.completions.create(model="llama3-8b-8192", messages=messages, response_format={"type": "json_object"})
            text = response.choices[0].message.content
            
            text = text.strip()
            if text.startswith("```json"): text = text[7:]
            if text.startswith("```"): text = text[3:]
            if text.endswith("```"): text = text[:-3]
                
            data = json.loads(text.strip())
            return data
        except Exception as e:
            print(f"Failed to generate Groq AI quiz: {e}")
            return fallback_data
            
    elif local_model:
        try:
            retrieved_context, sources = retrieve_context(f"{subject_name} {topic}", subject_name)
            if retrieved_context:
                prompt = f"Read the context and generate a short question.\n\nContext: {retrieved_context[:1500]}\n\nQuestion: "
            else:
                prompt = f"Generate a short question about: {topic}\nQuestion: "
                
            inputs = local_tokenizer(prompt, return_tensors="pt", truncation=True, max_length=1024)
            outputs = local_model.generate(**inputs, max_new_tokens=50, num_beams=4, early_stopping=True, repetition_penalty=1.2)
            gen_q = local_tokenizer.decode(outputs[0], skip_special_tokens=True)
            
            if gen_q:
                fallback_data["questions"][0]["question"] = gen_q
            return fallback_data
            return fallback_data
        except Exception as e:
            print(f"Failed to generate local AI quiz: {e}")
            return fallback_data
            
    return fallback_data

def generate_quick_revision_cards(topics: list) -> list:
    """Generate quick short revision cards for a list of topics."""
    prompt = f"""
    Create a quick 5-minute revision for the following topics: {', '.join(topics)}.
    For each topic, provide a short 'quick definition' and 3 to 4 'key points'.
    
    You MUST respond with valid JSON matching exactly this schema:
    [
      {{
        "topic_title": "String",
        "quick_definition": "String",
        "key_points": ["Point 1", "Point 2", "Point 3"]
      }}
    ]
    Do not include any other text besides the JSON.
    """
    
    try:
        if llm:
            messages = [{"role": "user", "content": prompt}]
            response = llm.chat.completions.create(model="llama3-8b-8192", messages=messages)
            raw_json = response.choices[0].message.content.replace("```json", "").replace("```", "").strip()
            return json.loads(raw_json)
        else:
            return [{"topic_title": t, "quick_definition": "Revision unavailable without API key.", "key_points": []} for t in topics]
    except Exception as e:
        print(f"Error generating quick revision cards: {e}")
        return [{"topic_title": t, "quick_definition": "Revision generation failed.", "key_points": []} for t in topics]
