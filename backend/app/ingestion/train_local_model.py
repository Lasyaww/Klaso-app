import os
import sys
import pandas as pd
import json
import torch
from transformers import (
    AutoModelForSeq2SeqLM, 
    AutoTokenizer, 
    Seq2SeqTrainer, 
    Seq2SeqTrainingArguments,
    DataCollatorForSeq2Seq
)
from datasets import Dataset

# Make sure we're running from backend root
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

RAW_DATA_PATH = os.path.join(os.path.dirname(__file__), '../../data/raw')
MODEL_SAVE_PATH = os.path.join(os.path.dirname(__file__), '../../local_model')

def prepare_dataset():
    """
    Loads QA pairs from the local raw datasets and formats them into a HuggingFace Dataset.
    We'll combine archive3 (CSV) and archive5 (JSONL) for training.
    """
    print("Loading datasets...")
    qa_pairs = []
    
    # 1. Load from archive3 (CSV)
    try:
        csv_path = os.path.join(RAW_DATA_PATH, 'archive3', 'full_dataset.csv')
        df = pd.read_csv(csv_path).dropna().head(500) # limit for quicker training
        for _, row in df.iterrows():
            qa_pairs.append({
                "prompt": f"Question: {str(row.iloc[0])}\nAnswer: ",
                "completion": str(row.iloc[1])
            })
    except Exception as e:
        print(f"Skipping archive3: {e}")
        
    # 2. Load from archive5 (JSONL)
    try:
        jsonl_path = os.path.join(RAW_DATA_PATH, 'archive5', 'data', 'train.jsonl')
        with open(jsonl_path, 'r', encoding='utf-8') as f:
            for idx, line in enumerate(f):
                if idx >= 500: break
                item = json.loads(line)
                q = item.get('question', '') or item.get('input', '')
                a = item.get('answer', '') or item.get('output', '') or item.get('target', '')
                if q and a:
                    qa_pairs.append({
                        "prompt": f"Question: {q}\nAnswer: ",
                        "completion": a
                    })
    except Exception as e:
        print(f"Skipping archive5: {e}")
        
    print(f"Total QA pairs loaded for training: {len(qa_pairs)}")
    return Dataset.from_pandas(pd.DataFrame(qa_pairs))

def train_model():
    """
    Fine-tunes the local T5 model on the prepared dataset.
    WARNING: This requires significant RAM. A GPU is highly recommended.
    """
    model_name = "google/flan-t5-small"
    print(f"Loading base model: {model_name}")
    
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForSeq2SeqLM.from_pretrained(model_name)
    
    dataset = prepare_dataset()
    
    # Tokenize the dataset
    def preprocess_function(examples):
        inputs = examples["prompt"]
        targets = examples["completion"]
        model_inputs = tokenizer(inputs, max_length=128, truncation=True, padding="max_length")
        labels = tokenizer(targets, max_length=128, truncation=True, padding="max_length")
        
        # Replace padding token id's of the labels by -100 so it's ignored by the loss
        labels["input_ids"] = [
            [(l if l != tokenizer.pad_token_id else -100) for l in label] for label in labels["input_ids"]
        ]
        model_inputs["labels"] = labels["input_ids"]
        return model_inputs

    print("Tokenizing dataset...")
    tokenized_dataset = dataset.map(preprocess_function, batched=True, remove_columns=["prompt", "completion"])
    
    # Split into train/val
    split_dataset = tokenized_dataset.train_test_split(test_size=0.1)
    
    # Define training arguments
    training_args = Seq2SeqTrainingArguments(
        output_dir="./results",
        eval_strategy="epoch",
        learning_rate=2e-5,
        per_device_train_batch_size=8,
        per_device_eval_batch_size=8,
        weight_decay=0.01,
        save_total_limit=2,
        num_train_epochs=1, # Set to 1 for quick fine-tuning
        predict_with_generate=True,
        fp16=torch.cuda.is_available(), # Use mixed precision if GPU is available
        push_to_hub=False,
    )
    
    data_collator = DataCollatorForSeq2Seq(tokenizer=tokenizer, model=model)
    
    trainer = Seq2SeqTrainer(
        model=model,
        args=training_args,
        train_dataset=split_dataset["train"],
        eval_dataset=split_dataset["test"],
        processing_class=tokenizer,
        data_collator=data_collator,
    )
    
    print("Starting Fine-Tuning... (This will take a while, especially on CPU)")
    trainer.train()
    
    print(f"Saving fine-tuned model to {MODEL_SAVE_PATH}...")
    os.makedirs(MODEL_SAVE_PATH, exist_ok=True)
    model.save_pretrained(MODEL_SAVE_PATH)
    tokenizer.save_pretrained(MODEL_SAVE_PATH)
    print("Training Complete!")

if __name__ == "__main__":
    train_model()
