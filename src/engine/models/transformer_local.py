from typing import List, Dict, Any
import warnings
from transformers import AutoTokenizer, AutoModelForTokenClassification
from transformers import pipeline

class TransformerNER:
    """
    Named Entity Recognition using a transformer model.
    Automatically caches models in ~/.cache/huggingface/
    """

    def __init__(self, model_name: str):
        # Suppress the "Some weights were not used" warning
        # This is expected for token classification models
        with warnings.catch_warnings():
            warnings.filterwarnings("ignore", message="Some weights of the model checkpoint")
            
            self.tokenizer = AutoTokenizer.from_pretrained(
                model_name,
                cache_dir=None  # Use default cache: ~/.cache/huggingface/
            )
            self.model = AutoModelForTokenClassification.from_pretrained(
                model_name,
                cache_dir=None  # Use default cache: ~/.cache/huggingface/
            )
            self.ner_pipeline = pipeline(
                "token-classification", 
                model=self.model, 
                tokenizer=self.tokenizer, 
                aggregation_strategy="simple"
            )

    def analyze(self, text: str, confidence_threshold: float = 0.75) -> List[Dict[str, Any]]:
        """
        Analyze text and return detected entities.
        Merges subword tokens (starting with ##) into complete words.
        Filters out low-confidence detections to reduce false positives.
        
        Args:
            text: The text to analyze
            confidence_threshold: Minimum confidence score (0-1) for entity detection.
                                Default 0.75 to filter out uncertain matches.
        """
        results = self.ner_pipeline(text)
        entities = []
        
        for r in results:
            label = r.get("entity_group", "")
            word = r.get("word", "")
            score = r.get("score", 0.0)
            
            if not word:
                continue
            
            # Filter out MISC entities (too ambiguous, causes false positives)
            if label == "MISC":
                continue

            # Map model labels to your PII categories
            mapped_type = None
            description = ""
            if label in ("PER", "PERSON"):
                mapped_type = "PERSON"
                description = "Person Name"
            elif label in ("ORG", "ORGANIZATION"):
                mapped_type = "ORGANIZATION"
                description = "Organization Name"
            elif label in ("LOC", "LOCATION"):
                mapped_type = "LOCATION"
                description = "Location"
            else:
                mapped_type = label
                description = "Entity"

            # Check if this is a subword token (starts with ##)
            if word.startswith("##"):
                # Merge with the previous entity if it has the same type
                if entities and entities[-1]["type"] == mapped_type:
                    # Update merged value
                    entities[-1]["value"] += word[2:]  # Remove ## prefix and append
                    # Track scores for average calculation
                    if "scores" not in entities[-1]:
                        entities[-1]["scores"] = [entities[-1].pop("_score", 1.0)]
                    entities[-1]["scores"].append(score)
                    continue
            
            # Start new entity
            entity = {
                "type": mapped_type,
                "description": description,
                "value": word,
                "_score": score,  # Store score temporarily
            }
            entities.append(entity)
        
        # Post-process: filter by average confidence and clean up temporary fields
        filtered_entities = []
        for entity in entities:
            # Calculate average score if merged tokens
            if "scores" in entity:
                avg_score = sum(entity["scores"]) / len(entity["scores"])
                del entity["scores"]
            else:
                avg_score = entity.pop("_score", 1.0)
            
            # Filter by confidence threshold
            if avg_score >= confidence_threshold:
                filtered_entities.append(entity)
        
        return filtered_entities


