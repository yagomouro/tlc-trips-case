import os
import awsgi
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from services.openai_client import OpenAIClient
from services.classifier import IntentClassifier
from services.generic_qa import GenericQAService
from services.db_qa import DBQAService
from services.company_docs_s3_qa import CompanyDocsS3QAService
from flask_cors import CORS, cross_origin

load_dotenv()

POSTGRES_HOST = os.environ["POSTGRES_HOST"]
POSTGRES_PORT = int(os.environ["POSTGRES_PORT"])
POSTGRES_DB = os.environ["POSTGRES_DB"]
POSTGRES_USER = os.environ["POSTGRES_USER"]
POSTGRES_PASSWORD = os.environ["POSTGRES_PASSWORD"]
POSTGRES_SCHEMA = os.environ["POSTGRES_SCHEMA"]
BUCKET_NAME = os.environ["BUCKET_NAME"]
OPENAI_API_KEY = os.environ["OPENAI_API_KEY"]
OPENAI_BASE_URL = os.environ["OPENAI_BASE_URL"]
MODEL_CLASSIFIER = os.environ["MODEL_CLASSIFIER"]
MODEL_GENERIC = os.environ["MODEL_GENERIC"]
MODEL_DB = os.environ["MODEL_DB"]
MODEL_DOCS = os.environ["MODEL_DOCS"]
MAX_RESULT_ROWS = int(os.environ["MAX_RESULT_ROWS"])
COMPANY_FILES_PREFIX = os.environ["COMPANY_FILES_PREFIX"]

app = Flask(__name__)
CORS(app, support_credentials=True)

openai_client = OpenAIClient(OPENAI_API_KEY, OPENAI_BASE_URL)
classifier = IntentClassifier(openai_client, MODEL_CLASSIFIER)
generic_service = GenericQAService(openai_client, MODEL_GENERIC)
db_service = DBQAService(openai_client, MODEL_DB, POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD, MAX_RESULT_ROWS)
docs_service = CompanyDocsS3QAService(openai_client, MODEL_DOCS, BUCKET_NAME, COMPANY_FILES_PREFIX)

@app.get("/health")
@app.get("/")
@cross_origin(supports_credentials=True)
def health():
    return jsonify({'message': 'api is running'})

@app.post("/ask")
@cross_origin(supports_credentials=True)
def ask():
    try:
        payload = request.get_json(force=True, silent=True) or {}
        question = (payload.get("question") or "").strip()
        metadata = payload.get("metadata") or {}
        if not question:
            return jsonify({"ok": False, "error": "Campo 'question' é obrigatório."}), 400
        intent = classifier.classify(question)
        if intent == "db":
            return jsonify(db_service.answer(question, metadata))
        elif intent == "docs":
            return jsonify(docs_service.answer(question, metadata))
        else:
            return jsonify(generic_service.answer(question, metadata))
    except Exception as e:
        return jsonify({"ok": False, "error": f"Falha inesperada: {str(e)}"}), 500

def handler(event, context):
    return awsgi.response(app, event, context)

if __name__ == "__main__":
    app.run(debug=True)
