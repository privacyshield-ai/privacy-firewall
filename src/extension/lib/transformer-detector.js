import {pipeline, env} from '@huggingface/transformers'

// Configure for Chrome extension environment
env.allowRemoteModels = true;
env.useBrowserCache = true;
env.allowLocalModels = false;

// Disable multi-threading and use single-threaded WASM
// This avoids dynamic worker imports that Chrome extensions block
env.backends.onnx.wasm.numThreads = 1;
env.backends.onnx.wasm.proxy = false;

// Try to use local WASM files if available
try {
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
    const wasmPath = chrome.runtime.getURL('wasm/');
    env.backends.onnx.wasm.wasmPaths = wasmPath;
    console.log('[PrivacyWall] WASM path set to:', wasmPath);
  }
} catch (e) {
  console.warn('[PrivacyWall] Could not set WASM paths:', e);
}

const MODEL_NAME = 'Xenova/bert-base-NER-uncased';

let nerPipeline = null;
let isModelLoading = false;

const MAX_WAIT_TIME = 30000; // 30 seconds
const CHECK_INTERVAL = 100; // 0.1 second

// Main functions
export async function initializeModel(progressCallback){
    // If Pipeline exists, return it.
    if (nerPipeline) return nerPipeline;
    // If model is loading, wait until it's loaded.
     if (isModelLoading){
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            const checkStatus = () => {
                if (nerPipeline){
                    resolve(nerPipeline);
                } else if (!isModelLoading) {
                    // Loading finished but no pipeline = error occurred
                    reject(new Error('Model loading failed'));
                } else if (Date.now() - startTime > MAX_WAIT_TIME) {
                    reject(new Error('Model loading timeout'));
                } else {
                    // Continue checking
                    setTimeout(checkStatus, CHECK_INTERVAL);
                }
            };
            
            checkStatus();
        });
    }
    
    try{
        // Load the model with explicit dtype to suppress warning
        isModelLoading = true;
        nerPipeline = await pipeline('token-classification', MODEL_NAME, {
            progress_callback: progressCallback,
            dtype: 'q8',  // Explicitly set quantization type
        });
        return nerPipeline;
    }catch(error) {
        nerPipeline = null; 
        throw error;
    } finally{
        isModelLoading = false;
    }

}

function mapEntityType(entity) {
  // Handle BIO tagging format (B-PER, I-PER, etc.)
  const cleanEntity = entity.replace(/^[BI]-/, '').toUpperCase();
  
  const map = {
    'PER': 'PERSON',
    'PERSON': 'PERSON',
    'ORG': 'ORGANIZATION',
    'ORGANIZATION': 'ORGANIZATION',
    'LOC': 'LOCATION',
    'LOCATION': 'LOCATION',
    'MISC': 'MISC'
  };
  return map[cleanEntity] || cleanEntity;
}

function getDescription(entity) {
  // Handle BIO tagging format (B-PER, I-PER, etc.)
  const cleanEntity = entity.replace(/^[BI]-/, '').toUpperCase();
  
  const desc = {
    'PER': 'Person Name',
    'PERSON': 'Person Name',
    'ORG': 'Organization Name',
    'ORGANIZATION': 'Organization Name',
    'LOC': 'Location',
    'LOCATION': 'Location'
  };
  return desc[cleanEntity] || 'Entity';
}

export async function detectEntities(text, threshold=0.5){
    console.log('[PrivacyWall AI] Scanning text:', text.substring(0, 100));
    
    const ner = await initializeModel();
    const results = await ner(text);
    
    console.log('[PrivacyWall AI] Raw NER results:', results);
    
    // Filter by threshold and exclude MISC, O (outside) tags
    const filtered = results.filter(entity => {
        const cleanEntity = entity.entity.replace(/^[BI]-/, '').toUpperCase();
        return entity.score >= threshold && cleanEntity !== 'MISC' && cleanEntity !== 'O';
    });
    
    // Aggregate consecutive tokens of the same entity type using BIO tagging
    // B- = Beginning of entity, I- = Inside/continuation of entity
    const aggregated = [];
    let currentEntity = null;
    
    for (const token of filtered) {
        const entityTag = token.entity;
        const isBeginning = entityTag.startsWith('B-');
        const isContinuation = entityTag.startsWith('I-');
        const entityType = mapEntityType(entityTag);
        
        // Clean up the word - BERT tokenizer may add ## for subword tokens
        let word = token.word.replace(/^##/, '');
        
        if (isBeginning) {
            // Start a new entity
            if (currentEntity) {
                aggregated.push(currentEntity);
            }
            currentEntity = {
                type: entityType,
                value: word,
                score: token.score,
                description: getDescription(entityTag),
                start: token.start,
                end: token.end
            };
        } else if (isContinuation && currentEntity && currentEntity.type === entityType) {
            // Continue the current entity
            // Check if this token is adjacent or close to the previous one
            const gap = token.start - currentEntity.end;
            if (gap <= 1) {
                // Adjacent or overlapping - concatenate directly
                currentEntity.value += word;
            } else {
                // There's a space between tokens
                currentEntity.value += ' ' + word;
            }
            currentEntity.end = token.end;
            currentEntity.score = Math.min(currentEntity.score, token.score);
        } else {
            // New entity without B- tag (shouldn't happen often, but handle it)
            if (currentEntity) {
                aggregated.push(currentEntity);
            }
            currentEntity = {
                type: entityType,
                value: word,
                score: token.score,
                description: getDescription(entityTag),
                start: token.start,
                end: token.end
            };
        }
    }
    
    // Don't forget the last entity
    if (currentEntity) {
        aggregated.push(currentEntity);
    }
    
    // Clean up values - trim whitespace and fix spacing issues
    const cleaned = aggregated.map(entity => ({
        ...entity,
        value: entity.value.trim().replace(/\s+/g, ' ')
    }));
    
    console.log('[PrivacyWall AI] Aggregated entities:', cleaned);
    
    // Deduplicate by type - only show one finding per entity type
    // Keep the one with highest score or longest value
    const byType = new Map();
    for (const entity of cleaned) {
        const existing = byType.get(entity.type);
        if (!existing || entity.value.length > existing.value.length) {
            byType.set(entity.type, entity);
        }
    }
    
    const deduplicated = Array.from(byType.values());
    
    console.log('[PrivacyWall AI] Final entities:', deduplicated);
    
    return deduplicated;
}


