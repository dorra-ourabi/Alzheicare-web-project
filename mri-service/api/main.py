import os
import sys
from contextlib import asynccontextmanager

try:
    cuda_path = 'C:\\Program Files\\NVIDIA GPU Computing Toolkit\\CUDA\\v11.2\\bin'
    if os.path.exists(cuda_path):
        os.add_dll_directory(cuda_path)
except (OSError, AttributeError):
    pass

sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import tensorflow as tf
import numpy as np
from PIL import Image
import io

MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'efficientnetb0_savedmodel')

CLASSES = ['Mild Impairment', 'Moderate Impairment', 'No Impairment', 'Very Mild Impairment']

CLINICAL_NOTES = {
    'Mild Impairment':      'Declin cognitif leger detecte. Consultation neurologique conseillee.',
    'Moderate Impairment':  'Atrophie cerebrale significative detectee. Suivi urgent recommande.',
    'No Impairment':        'Aucun signe d atrophie cerebrale detecte. Resultat normal.',
    'Very Mild Impairment': 'Legeres modifications structurelles detectees. Surveillance recommandee.'
}

infer = None
output_key = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global infer, output_key

    model_path = os.path.abspath(MODEL_PATH)
    print(f"Loading model from: {model_path}")

    loaded = tf.saved_model.load(model_path)
    infer = loaded.signatures['serving_default']

    output_key = list(infer.structured_outputs.keys())[0]
    print(f"Model loaded. Output key: {output_key}")

    yield

app = FastAPI(title='AlzheivCare MRI Service — EfficientNetB0', lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*']
)

@app.post('/predict/mri')
async def predict_mri(file: UploadFile = File(...)):
    if infer is None:
        raise HTTPException(status_code=503, detail='Model not loaded yet')

    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail='Le fichier doit etre une image JPG ou PNG')

    contents = await file.read()

    img = Image.open(io.BytesIO(contents)).convert('RGB')
    img_resized = img.resize((128, 128))
    img_array = np.array(img_resized, dtype=np.float32)
    img_array = np.expand_dims(img_array, axis=0)

    input_tensor = tf.constant(img_array)
    result = infer(input_tensor)
    predictions = result[output_key].numpy()[0]

    print(f"Raw probabilities: {predictions}")
    print(f"Predicted: {CLASSES[int(np.argmax(predictions))]}")

    pred_index = int(np.argmax(predictions))
    predicted_stage = CLASSES[pred_index]
    confidence = float(predictions[pred_index])

    return {
        'predicted_stage': predicted_stage,
        'confidence': round(confidence, 4),
        'probabilities': {
            CLASSES[i]: round(float(predictions[i]), 4)
            for i in range(4)
        },
        'gradcam_heatmap_base64': None,
        'clinical_note': CLINICAL_NOTES[predicted_stage],
        'disclaimer': 'Ce resultat est une aide a la decision. Il ne remplace pas le diagnostic clinique d un neurologue.'
    }

@app.get('/health')
def health():
    return {'status': 'ok', 'model_loaded': infer is not None}