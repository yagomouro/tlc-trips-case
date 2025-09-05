from openai import OpenAI

class OpenAIClient:
    def __init__(self, api_key: str, base_url: str):
        self.client = OpenAI(api_key=api_key, base_url=base_url)

    def chat(self, model: str, system_msg: str, user_msg: str, response_format=None, temperature: float = 0.0):
        try:
            kwargs = {}
            if response_format:
                kwargs["response_format"] = response_format
            resp = self.client.chat.completions.create(
                model=model,
                temperature=temperature,
                messages=[
                    {"role": "system", "content": system_msg},
                    {"role": "user", "content": user_msg},
                ],
                **kwargs
            )
            content = resp.choices[0].message.content
            return {"ok": True, "content": content}
        except Exception as e:
            return {"ok": False, "error": f"Erro ao chamar OpenAI: {str(e)}"}
