import whisper
import os

from sklearn.metrics.pairwise import cosine_similarity
# from torch.nn.functional import cosine_similarity
# from torch import cosine_similarity
from werkzeug.utils import secure_filename  # If using Flask
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sentence_transformers import SentenceTransformer
import uvicorn
import openai
from ultralytics import YOLO
import mediapipe as mp
import cv2


# Load a YOLO model (you can use a custom model or the official one if it has 'cell phone' class)
# E.g., "yolov8n.pt" might already detect 'cell phone' or 'mobile phone' depending on the dataset
model = YOLO("yolov8n.pt")

app = FastAPI()

# Optional: enable CORS if you're calling from a frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change this to your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Make sure the uploads folder exists
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def transcribe_audio(file_path):
    model = whisper.load_model("tiny")  # Options: tiny, base, small, medium, large
    result = model.transcribe(file_path, fp16=False)

    return result.get("text", "")

@app.get("/")
async def read_root():
    return JSONResponse(content={"transcription": "Hi"})


@app.post("/transcribe")
async def upload_and_transcribe(file: UploadFile = File(...)):
    try:
        # Sanitize filename and save file
        safe_filename = secure_filename(file.filename)
        file_path = os.path.join(UPLOAD_DIR, safe_filename)

        with open(file_path, "wb") as f:
            f.write(await file.read())

        # Transcribe the uploaded file
        transcription = transcribe_audio(file_path)
        print(transcription)
        return JSONResponse(content={"transcription": transcription})

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

interview_config = {
    "topics": [
        {"name": "React", "weight": 20, "current_level": "Basic"},
        {"name": "Tailwind", "weight": 20, "current_level": "Basic"},
        {"name": "HLD", "weight": 60, "current_level": "Basic"}
    ],
    "rules": {
        "max_questions_per_topic": 2,
        "difficulty_progression": ["Basic", "Medium", "Advanced"]
    }
}

def detect_phone(frame):
    """
    Runs YOLO detection on the frame to see if a phone is present.
    Returns True if phone is detected, otherwise False.
    """
    results = model.predict(source=frame, conf=0.3)  # adjust confidence threshold
    # results is a list of 'ultralytics.yolo.engine.results.Results' for each image
    
    # If any detection is labeled as 'cell phone' or 'mobile phone', return True
    # You need to check the class name or the class index for the phone label
    for r in results:
        for box in r.boxes:
            class_id = int(box.cls[0])
            label = model.names[class_id]
            if label.lower() in ["cell phone", "mobile phone", "phone"]:  # adapt to your model
                return True
    return False



mp_face_detection = mp.solutions.face_detection
mp_drawing = mp.solutions.drawing_utils

def detect_face(frame):
    """
    Returns True if at least one face is detected in the frame, otherwise False.
    """
    # Convert to RGB for MediaPipe
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    with mp_face_detection.FaceDetection(model_selection=0, min_detection_confidence=0.5) as face_detect:
        results = face_detect.process(rgb_frame)
        if results.detections:
            return True
        else:
            return False
        

# newly added - @akshay, purushottam

@socketio.on('video_frame')
def handle_video_frame(data):
    # data is base64 encoded image: "data:image/jpeg;base64,/9j/4AAQ..."
    try:
        # Split out the header if data URL
        header, encoded = data.split(',', 1)
        img_bytes = base64.b64decode(encoded)
        np_arr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        
        # -- Face detection
        face_detected = detect_face(frame)

        # -- Phone detection
        phone_detected = detect_phone(frame)

        # Emit results to client
        socketio.emit('analysis', {
            'face_detected': face_detected,
            'phone_detected': phone_detected
        })
    except Exception as e:
        print("Error in frame handling:", e)
        socketio.emit('analysis', {
            'face_detected': False,
            'phone_detected': False
        })




if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=5049)
