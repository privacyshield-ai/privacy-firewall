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
        // Load the model
        isModelLoading = true;
        nerPipeline = await pipeline('token-classification', MODEL_NAME, {
            progress_callback: progressCallback
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
    
    // Filter results based on threshold, exclude MISC
    const filtered = results
        .filter(entity => {
            const cleanEntity = entity.entity.replace(/^[BI]-/, '').toUpperCase();
            return entity.score >= threshold && cleanEntity !== 'MISC';
        })
        .map(entity => ({
            type: mapEntityType(entity.entity),
            value: entity.word,
            score: entity.score,
            description: getDescription(entity.entity),
        }));
    
    console.log('[PrivacyWall AI] Filtered entities:', filtered);
    
    return filtered;
}


