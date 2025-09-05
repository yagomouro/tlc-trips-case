import json, psycopg2, sqlparse, re

SYSTEM_SQL = (
    "Você gera uma consulta SELECT segura em Postgres usando o schema tlc_trips. "
    "Somente SELECT; LIMIT obrigatório; use apenas tabelas/colunas permitidas; "
    "use placeholders %(p1)s, %(p2)s; "
    "responda um JSON com sql, params, rationale."
)

ALLOWED = {
    "tlc_trips.dim_empresa": ["sk_empresa","cd_empresa","ds_empresa"],
    
    "tlc_trips.dim_tarifa": ["sk_tarifa","cd_tarifa","ds_tarifa"],
    "tlc_trips.dim_pagamento": ["sk_pagamento","cd_pagamento","ds_pagamento"],
    "tlc_trips.dim_transmissao": ["sk_transmissao","fl_transmissao","ds_transmissao"],
    "tlc_trips.dim_zona": ["sk_zona","cd_zona","ds_zona","ds_distrito","ds_zona_servico"],
    "tlc_trips.dim_calendario": ["dt_calendario","ano","mes","dia","trimestre","ano_mes"],
    
    "tlc_trips.ft_corrida_taxi": ["cd_empresa","qt_passageiros","vl_total","ts_inicio_corrida","ts_fim_corrida","vl_distancia_mi","cd_tarifa","fl_transmissao","cd_zona_embarque","cd_zona_desembarque","cd_pagamento","vl_tarifa_base","vl_extra","vl_mta_tax","vl_gorjeta","vl_pedagio","vl_sobretaxa_melhoria","vl_sobretaxa_congestionamento","vl_taxa_aeroporto"]
}

def _schema_text():
    return "\n".join([f"{t}({', '.join(cols)})" for t, cols in ALLOWED.items()])

class DBQAService:
    def __init__(self, openai_client, model_name: str, host: str, port: int, db: str, user: str, password: str, max_rows: int):
        self.openai = openai_client
        self.model = model_name
        self.pg_conn_info = dict(host=host, port=port, dbname=db, user=user, password=password)
        self.max_rows = max_rows

    def answer(self, question: str, metadata: dict):
        try:
            prompt_text = f"Pergunta: {question}\nTabelas permitidas:\n{_schema_text()}\nGere JSON com sql, params, rationale."
            generation = self.openai.chat(self.model, SYSTEM_SQL, prompt_text, response_format={"type": "json_object"}, temperature=0)
            
            if not generation.get("ok"):
                return {"ok": False, "intent": "db", "error": generation.get("error", "Falha ao gerar SQL")}
            
            parsed_json = json.loads(generation["content"])
            sql_text = parsed_json.get("sql", "")
            params_dict = parsed_json.get("params", {}) or {}
            is_valid, error_message = self._validate_sql(sql_text)
            
            if not is_valid:
                return {"ok": False, "intent": "db", "error": f"SQL inválida: {error_message}"}
            rows, columns, exec_error = self._execute(sql_text, params_dict)
            
            if exec_error:
                return {"ok": False, "intent": "db", "error": exec_error}
            return {"ok": True, "intent": "db", "sql": sql_text, "params": params_dict, "columns": columns, "rows": rows[: self.max_rows]}
        except Exception as e:
            return {"ok": False, "intent": "db", "error": f"Falha no módulo DB: {str(e)}"}

    def _validate_sql(self, sql_text: str):
        if not sql_text:
            return False, "SQL vazia"
        try:
            parsed = sqlparse.parse(sql_text)
            
            if not parsed or parsed[0].get_type() != "SELECT":
                return False, "Apenas SELECT permitido"
            lowered = sql_text.lower()
            forbidden = ["insert","update","delete","drop","alter","create","grant","revoke","truncate","call","copy"]
            
            if any(k in lowered for k in forbidden):
                return False, "Contém operação proibida"
            
            # if " limit " not in lowered:
            #     return False, "LIMIT obrigatório"
            
            tokens = re.findall(r"([a-zA-Z_][\w\.]+)", sql_text)
            referenced = {tok for tok in tokens if tok.count(".") == 1}
            allowed_set = set()
            
            for table_name, columns in ALLOWED.items():
                allowed_set.add(table_name)
                short_name = table_name.split(".")[1]
                
                for col in columns:
                    allowed_set.add(f"{table_name}.{col}")
                    allowed_set.add(f"{short_name}.{col}")
                    
            # for item in referenced:
            #     if item not in allowed_set:
            #         return False, "Tabela ou coluna não permitida"
            return True, None
        except Exception as e:
            return False, f"Erro ao validar SQL: {str(e)}"

    def _execute(self, sql_text: str, params_dict: dict):
        try:
            with psycopg2.connect(**self.pg_conn_info) as conn:
                with conn.cursor() as cur:
                    cur.execute(sql_text, params_dict)
                    columns = [d[0] for d in cur.description]
                    rows = cur.fetchall()
            return rows, columns, None
        except Exception as e:
            return [], [], f"Erro ao executar SQL: {str(e)}"
