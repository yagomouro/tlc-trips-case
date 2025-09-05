import os
import sys
import json
import boto3
from awsglue.utils import getResolvedOptions
from pyspark.sql import SparkSession

args = getResolvedOptions(sys.argv, ["base_path", "app_env_secret_name"])
base_path = args["base_path"].rstrip("/")
secret_name = args["app_env_secret_name"]

if base_path.startswith("s3://"):
    base_path = "s3a://" + base_path[len("s3://"):]
if not base_path.endswith("/refined-zone"):
    base_path = f"{base_path}/refined-zone"

sm = boto3.client("secretsmanager", region_name=os.environ.get("AWS_REGION", "us-east-1"))
cfg = json.loads(sm.get_secret_value(SecretId=secret_name)["SecretString"])

host = cfg["POSTGRES_HOST"]
port = str(cfg.get("POSTGRES_PORT"))
db = cfg["POSTGRES_DB"]
user = cfg["POSTGRES_USER"]
pwd = cfg["POSTGRES_PASSWORD"]
schema = cfg.get("POSTGRES_SCHEMA")

spark = SparkSession.builder.appName("RefinedToDW").getOrCreate()
spark._jsc.hadoopConfiguration().set(
    "fs.s3a.aws.credentials.provider",
    "com.amazonaws.auth.InstanceProfileCredentialsProvider,com.amazonaws.auth.DefaultAWSCredentialsProviderChain",
)

jdbc_url = f"jdbc:postgresql://{host}:{port}/{db}"
props = {"user": user, "password": pwd, "driver": "org.postgresql.Driver"}

dimensoes = ["dim_empresa", "dim_tarifa", "dim_pagamento", "dim_transmissao", "dim_zona", "dim_calendario"]
fato = "ft_corrida_taxi"

for tabela in dimensoes:
    df_ = spark.read.parquet(f"{base_path}/{tabela}/")
    df_.write.mode("overwrite").option("truncate", "true").option("cascadeTruncate", "true").jdbc(jdbc_url, f"{schema}.{tabela}", properties=props)

df_fato = spark.read.parquet(f"{base_path}/{fato}/")
df_fato.write.mode("overwrite").option("truncate", "true").jdbc(jdbc_url, f"{schema}.{fato}", properties=props)
