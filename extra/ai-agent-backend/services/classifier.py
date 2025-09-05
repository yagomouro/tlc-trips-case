import json

SYSTEM = (
    "Você é um classificador estrito. "
    "Responda um JSON no formato {\"intent\": \"generic|db|docs\"}. "
    "Use 'db' para perguntas sobre dados/tabelas/SQL; "
    "use 'docs' para perguntas que dependem de documentos da empresa; "
    "caso contrário 'generic'."
)

SCHEMA = {
    "type": "json_schema",
    "json_schema": {
        "name": "intent_schema",
        "schema": {
            "type": "object",
            "properties": {"intent": {"type": "string", "enum": ["generic", "db", "docs"]}},
            "required": ["intent"],
            "additionalProperties": False
        },
        "strict": True
    }
}

class IntentClassifier:
    def __init__(self, openai_client, model_name: str):
        self.openai = openai_client
        self.model = model_name

    def classify(self, question: str) -> str:
        result = self.openai.chat(self.model, SYSTEM, question, response_format=SCHEMA, temperature=0)
        if not result.get("ok"):
            return "generic"
        try:
            data = json.loads(result["content"])
            return data.get("intent", "generic")
        except Exception:
            return "generic"
