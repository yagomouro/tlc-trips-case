import os, io, boto3
from pypdf import PdfReader
from docx import Document

SYSTEM_BASE = (
    "Você responde somente com base no CONTEXTO a seguir (trechos de arquivos da empresa). "
    "Se a resposta não estiver clara no contexto, diga que não há evidências suficientes. "
    "Seja objetivo."
)

def _read_pdf_bytes(pdf_bytes: bytes) -> str:
    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        pages_text = [page.extract_text() or "" for page in reader.pages]
        
        return "\n".join(pages_text)
    except Exception:
        return ""

def _read_docx_bytes(docx_bytes: bytes) -> str:
    try:
        document = Document(io.BytesIO(docx_bytes))
        paragraphs_text = [p.text for p in document.paragraphs]
        
        return "\n".join(paragraphs_text)
    except Exception:
        return ""

def _read_text_bytes(text_bytes: bytes) -> str:
    try:
        
        return text_bytes.decode("utf-8", errors="ignore")
    except Exception:
        return ""

def _list_s3_objects(s3, bucket: str, prefix: str):
    object_keys = []
    continuation = None
    while True:
        try:
            if continuation:
                response = s3.list_objects_v2(Bucket=bucket, Prefix=prefix, ContinuationToken=continuation)
            else:
                response = s3.list_objects_v2(Bucket=bucket, Prefix=prefix)
            for item in response.get("Contents", []):
                key = item.get("Key", "")
                if key and not key.endswith("/"):
                    object_keys.append(key)
            if response.get("IsTruncated"):
                continuation = response.get("NextContinuationToken")
            else:
                break
        except Exception:
            break
    
    return object_keys

def _load_context_from_s3(s3, bucket: str, prefix: str, max_chars: int = 16000):
    if not bucket or not prefix:
        
        return "", [], ""
    try:
        object_keys = _list_s3_objects(s3, bucket, prefix)
        context_key = ""
        
        for key in object_keys:
            if key.lower().endswith("contextualizacao.txt"):
                context_key = key
                break
        context_instructions = ""
        
        if context_key:
            try:
                obj = s3.get_object(Bucket=bucket, Key=context_key)
                context_instructions = _read_text_bytes(obj["Body"].read())
            except Exception:
                context_instructions = ""
        collected_chunks = []
        used_files = []
        
        for key in object_keys:
            if key == context_key:
                continue
            lower_key = key.lower()
            
            if not lower_key.endswith((".pdf", ".docx", ".doc", ".txt", ".md")):
                continue
            try:
                obj = s3.get_object(Bucket=bucket, Key=key)
                raw_bytes = obj["Body"].read()
                content_text = ""
                
                if lower_key.endswith(".pdf"):
                    content_text = _read_pdf_bytes(raw_bytes)
                elif lower_key.endswith((".docx", ".doc")):
                    content_text = _read_docx_bytes(raw_bytes)
                else:
                    content_text = _read_text_bytes(raw_bytes)
                
                if content_text:
                    used_files.append(key)
                    collected_chunks.append(f"\n[ARQUIVO: {key}]\n{content_text}\n")
                joined = "\n".join(collected_chunks)
                
                if len(joined) >= max_chars:
                    return context_instructions, used_files, joined[:max_chars]
            except Exception:
                continue
        
        return context_instructions, used_files, "\n".join(collected_chunks)[:max_chars]
    except Exception:
        return "", [], ""

class CompanyDocsS3QAService:
    def __init__(self, openai_client, model_name: str, s3_bucket: str, prefix: str):
        self.openai = openai_client
        self.model = model_name
        self.s3_bucket = s3_bucket
        self.prefix = prefix
        self.s3 = boto3.client("s3")

    def answer(self, question: str, metadata: dict):
        try:
            if not self.s3_bucket:
                return {"ok": False, "intent": "docs", "error": "S3_BUCKET não configurado"}
            context_instructions, used_files, context_body = _load_context_from_s3(self.s3, self.s3_bucket, self.prefix)
            
            if not context_body:
                return {"ok": False, "intent": "docs", "error": "Nenhum arquivo válido encontrado no S3 ou leitura indisponível"}
            
            system_message = (context_instructions.strip() + "\n\n" + SYSTEM_BASE) if context_instructions else SYSTEM_BASE
            user_message = f"CONTEXTO:\n{context_body}\n\nPERGUNTA:\n{question}\n\nResponda somente com base no CONTEXTO."
            result = self.openai.chat(self.model, system_message, user_message, temperature=0)
            
            if not result.get("ok"):
                return {"ok": False, "intent": "docs", "error": result.get("error", "Falha no OpenAI")}
            return {"ok": True, "intent": "docs", "files": used_files, "answer": result["content"]}
        except Exception as e:
            return {"ok": False, "intent": "docs", "error": f"Falha no módulo Docs S3: {str(e)}"}
