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


def generate_question(topic, conversation_history):
    system_prompt = f"""You are a technical interviewer specializing in {topic['name']}.
    Current difficulty level: {topic['current_level']}.
    Ask 1 concise question. Never reveal answers.
    Format: <question>||<expected_keywords>"""

    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": system_prompt},
            *conversation_history
        ]
    )

    # Split generated content into question and evaluation criteria
    question, keywords = response.choices[0].message.content.split("||")
    return question.strip(), [k.strip() for k in keywords.split(",")]


# Load once during initialization
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')


def conduct_interview():
    conversation_history = []

    for topic in interview_config["topics"]:
        questions_asked = 0

        while questions_asked < interview_config["rules"]["max_questions_per_topic"]:
            # 1. Generate Question
            question, expected_keywords = generate_question(topic, conversation_history)

            # 2. Get Candidate Response
            answer = transcribe_audio("audio.mp3")  # Voice/text input

            # 3. Evaluate Answer
            answer_embedding = embedding_model.encode([answer])
            keyword_embeddings = embedding_model.encode(expected_keywords)
            similarity = max(cosine_similarity(answer_embedding, keyword_embeddings)[0])
            is_correct = similarity > 0.65

            # 4. Update Difficulty
            if is_correct:
                current_level_idx = interview_config["rules"]["difficulty_progression"].index(topic["current_level"])
                if current_level_idx < len(interview_config["rules"]["difficulty_progression"]) - 1:
                    topic["current_level"] = interview_config["rules"]["difficulty_progression"][current_level_idx + 1]

            # 5. Store Context
            conversation_history.extend([
                {"role": "assistant", "content": question},
                {"role": "user", "content": answer}
            ])

            questions_asked += 1


def generate_follow_up(conversation_history):
    prompt = """Analyze this conversation and suggest 2-3 follow-up questions:
    {history}

    Format as:
    1. <question1>
    2. <question2>"""

    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}]
    )
    return parse_questions(response.choices[0].message.content)


def calculate_score(topic, is_correct):
    level_weights = {
        "Basic": 1,
        "Medium": 1.5,
        "Advanced": 2
    }
    return level_weights[topic["current_level"]] * (1 if is_correct else 0.5)


def analyze_fluency(answer):
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{
            "role": "system",
            "content": f"Rate English fluency 1-10: {answer}\\nReturn ONLY a number."
        }]
    )
    return int(response.choices[0].message.content)


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=5049)
