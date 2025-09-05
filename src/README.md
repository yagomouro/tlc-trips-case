# ETL (Landing → Trusted → Refined → DW)

- [Visão geral](#visão-geral)
- [Pré-requisitos](#pré-requisitos)
- [Parâmetros e variáveis](#parâmetros-e-variáveis)
- [Estrutura de diretórios no S3](#estrutura-de-diretórios-no-s3)
- [Como executar (ordem recomendada)](#como-executar-ordem-recomendada)
  - [1) Landing](#1-landing)
  - [2) Trusted](#2-trusted)
  - [3) Refined](#3-refined)
  - [4) Refined\_to\_dw](#4-refined_to_dw)
- [Decisões técnicas](#decisões-técnicas)
- [Qualidade de dados (regras aplicadas)](#qualidade-de-dados-regras-aplicadas)
- [Erros comuns e troubleshooting](#erros-comuns-e-troubleshooting)

<br>

## Visão geral
Este diretório contém os **notebooks/scripts de ETL** que constroem o pipeline do case TLC Trips:
- **Landing**: baixa os arquivos originais (Yellow Taxi Parquet por mês e `taxi_zone_lookup.csv`) da fonte pública e grava **exatamente como vieram** no Data Lake, **particionados por data de ingestão** (`year=YYYY/month=MM/day=DD`).
- **Trusted**: lê **apenas o dia atual** da Landing, normaliza tipos, aplica mapeamentos descritivos (empresa, tarifa, pagamento, store-and-forward) e grava conjuntos limpos em `trusted-zone`.
- **Refined**: monta o **modelo estrela** (dimensões + fato), gera `dim_calendario` e aplica um filtro temporal (jan–mai/2023) e de sanidade; grava em `refined-zone`.
- **Refined_to_dw**: carrega as tabelas da Refined e escreve via **JDBC** para **PostgreSQL (Supabase)**, que é consumido pelo **Power BI** e pelo **Agente de IA**.

<br>

## Pré-requisitos
- Python 3.10+ e **Spark** (Databricks CE ou Spark local).
- Acesso à **AWS** (S3) com permissões de leitura/escrita no bucket do Data Lake.
- (Para _Refined_to_dw_) Driver JDBC do PostgreSQL disponível no ambiente/cluster.
- Variáveis de ambiente configuradas (ver abaixo).

<br>

## Parâmetros e variáveis
Principais variáveis usadas pelos notebooks/scripts:

- **AWS/S3**
  - `AWS_ACCESS_KEY`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` (apenas Landing local).
  - `BUCKET_NAME` (via Secrets no Glue/Jobs) – bucket do Data Lake.
- **Ingestão (Landing)**
  - `months = ["01","02","03","04","05"]`, `year = "2023"` – recorte solicitado no case.
  - Particionamento por **data de ingestão** calculada em runtime (`year/month/day`).
- **PostgreSQL (Refined_to_dw)**
  - `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_SCHEMA`.

<br>

## Estrutura de diretórios no S3
A Landing salva **por data de ingestão** para preservar histórico operacional:
s3://<BUCKET>/landing-zone/
yellow_tripdata/
year=YYYY/month=MM/day=DD/
yellow_tripdata_2023-01.parquet
...
taxi_zone/
year=YYYY/month=MM/day=DD/
taxi_zone_lookup.csv
As camadas seguintes seguem pastas por entidade:
s3://<BUCKET>/trusted-zone/
yellow_tripdata/
taxi_zone/

s3://<BUCKET>/refined-zone/
dim_empresa/
dim_tarifa/
dim_pagamento/
dim_transmissao/
dim_zona/
dim_calendario/
ft_corrida_taxi/

<br>

## Como executar (ordem recomendada)

### 1) Landing
**O que faz:**  
Baixa os arquivos **originais** da TLC (Parquet mensais e lookup de zonas CSV) e grava na **Landing**, particionando por **data de ingestão** (`year/month/day`).  
**Por quê:**  
A Landing guarda a “foto bruta” da coleta, permitindo reprocessamento histórico e auditoria.

**Pontos-chave do notebook:**
- Fonte dos dados: `https://d37ci6vzurychx.cloudfront.net/trip-data/yellow_tripdata_<YYYY>-<MM>.parquet`
- Lookup de zonas: `https://d37ci6vzurychx.cloudfront.net/misc/taxi_zone_lookup.csv`
- Escrita em:  
  - `landing-zone/yellow_tripdata/year=INGEST_Y/month=INGEST_M/day=INGEST_D/`
  - `landing-zone/taxi_zone/year=INGEST_Y/month=INGEST_M/day=INGEST_D/`

**Executar:**
- Preencha as credenciais AWS no ambiente (`AWS_ACCESS_KEY`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`).
- Rode o notebook/script `Landing`.

<br>

### 2) Trusted
**O que faz:**  
Lê **o dia atual** da Landing, faz **casts** de tipo, cria descrições legíveis (empresa, tarifa, pagamento, flag de transmissão) e grava tabelas limpas em `trusted-zone`.

**Pontos-chave do notebook:**
- Leitura **por partição do dia atual**:
s3a://datalake-prd-tlc-trips/landing-zone/yellow_tripdata/year=Y/month=M/day=D/

- Seleção/cast de colunas mínimas e suplementares (ex.: `VendorID`, `passenger_count`, `total_amount`, datetimes, `trip_distance`, `RatecodeID`, `payment_type`…).
- Mapeamentos de códigos → descrições (`VendorDesc`, `RatecodeDesc`, `payment_desc`, `store_and_fwd_desc`).
- Escrita:
- `trusted-zone/yellow_tripdata/`
- `trusted-zone/taxi_zone/` (a partir do CSV de lookup)

**Executar:**
- No mesmo dia da ingestão (ou ajuste `Y/M/D`), rode `Trusted`.
- Em Glue/Jobs, use a cadeia padrão de credenciais (`InstanceProfile`/`DefaultAWSCredentialsProviderChain`).

<br>

### 3) Refined
**O que faz:**  
Constrói o **modelo lógico de consumo**:
- Fato `ft_corrida_taxi` com chaves e métricas.
- Dimensões (`dim_empresa`, `dim_tarifa`, `dim_pagamento`, `dim_transmissao`, `dim_zona`).
- `dim_calendario` gerada a partir do intervalo de datas encontrado.
- Aplica regras de sanidade e **recorte temporal** (jan–mai/2023).

**Colunas centrais garantidas no fato (exigidas pelo case):**
- `VendorID` → `cd_empresa`
- `passenger_count` → `qt_passageiros`
- `total_amount` → `vl_total`
- `tpep_pickup_datetime` → `ts_inicio_corrida`
- `tpep_dropoff_datetime` → `ts_fim_corrida`

**Executar:**
- Rode `Refined` após `Trusted`.
- Saída: Parquet Snappy em `refined-zone/<tabela>/`.

<br>

### 4) Refined_to_dw
**O que faz:**  
Lê as tabelas da **Refined** e carrega no **PostgreSQL (Supabase)** via JDBC, sobrescrevendo (`mode="overwrite"`) para manter o DW sincronizado.

**Por quê:**  
Permite consumo direto por **Power BI** e pelo **Agente de IA** (queries SQL), sem depender de Spark para leitura.

**Executar:**
- Configure as variáveis de Postgres no ambiente.
- Rode `Refined_to_dw`.
- Alvos: `<schema>.dim_*` e `<schema>.ft_corrida_taxi`.

<br>

## Decisões técnicas
- **Particionamento por data de ingestão (Landing):** dá rastreabilidade e facilita reprocessamentos, além de permitir uma análise histórica.  
- **Casts e mapeamentos na Trusted:** padroniza tipos e expõe descrições de negócio já nesta camada.  
- **Modelo estrela na Refined:** separa atributos estáveis (dimensões) da granularidade transacional (fato), simplificando consumo.  
- **Carga JDBC para DW:** desacopla o consumo (BI/agente) do motor de processamento, melhorando latência de consulta.

<br>

## Qualidade de dados (regras aplicadas)
- **Sanidade temporal:** `ts_inicio_corrida` ≤ `ts_fim_corrida`.
- **Valores não negativos:** `vl_total ≥ 0`, `vl_distancia_mi ≥ 0`.
- **Passageiros:** regra conservadora nas análises (>= 0 no Refined; filtros mais rígidos podem ser aplicados nos notebooks de análise).
- **Recorte temporal:** jan–mai/2023 conforme o enunciado do case.

<br>

## Erros comuns e troubleshooting
- **AccessDenied (S3):** verifique credenciais/role e o nome correto do bucket.  
- **Driver JDBC ausente (Refined_to_dw):** garanta `org.postgresql.Driver` no cluster/notebook (Databricks: Library → `postgresql-42.x.jar`).  
- **Caminho S3 errado na Trusted:** confira `year=Y/month=M/day=D` da **data de ingestão** do dia.  
- **Tipos inesperados:** se a TLC alterar o esquema, revise casts na Trusted.