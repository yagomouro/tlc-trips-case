SYSTEM = "Você é um assistente útil, objetivo e seguro. Responda em português de forma clara."

class GenericQAService:
    def __init__(self, openai_client, model_name: str):
        self.openai = openai_client
        self.model = model_name

    def answer(self, question: str, metadata: dict):
        result = self.openai.chat(self.model, SYSTEM, question, temperature=0.2)
        if not result.get("ok"):
            return {"ok": False, "intent": "generic", "error": result.get("error", "Erro desconhecido")}
        return {"ok": True, "intent": "generic", "answer": result["content"]}
