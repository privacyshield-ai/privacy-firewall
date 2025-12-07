import re
from typing import Dict, Any, List, Optional
from models.transformer_local import TransformerNER

MODEL_NAME = "dslim/bert-base-NER"

# Global cache for the transformer model (lazy loading)
_transformer_ner: Optional[TransformerNER] = None

def get_transformer_ner() -> TransformerNER:
    """Get or create the cached TransformerNER instance."""
    global _transformer_ner
    if _transformer_ner is None:
        print(f"Loading transformer model: {MODEL_NAME}")
        _transformer_ner = TransformerNER(MODEL_NAME)
    return _transformer_ner

def analyze_text(text: str) -> Dict[str, Any]:
    entities: List[Dict[str, str]] = []
    pii_detected = False
    
    # Track regex match positions to avoid transformer overlaps
    regex_match_positions = []
    
    # Second pass: transformer entities (filter overlaps with regex matches)
    transformer_ner = get_transformer_ner()
    transformer_entities = transformer_ner.analyze(text)
    
    if transformer_entities:
        for entity in transformer_entities:
            # Find position of this entity in the text
            entity_value = entity.get("value", "")
            entity_start = text.find(entity_value)
            
            if entity_start == -1:
                continue  # Entity not found in text
            
            entity_end = entity_start + len(entity_value)
            pii_detected = True
            entities.append(entity)
    
    return {
        "pii_detected": pii_detected,
        "entities": entities,
    }
