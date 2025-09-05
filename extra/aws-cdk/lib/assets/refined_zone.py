import os
import sys
import json
import boto3
from awsglue.utils import getResolvedOptions
from pyspark.sql import SparkSession, functions as f, Window as w

args = getResolvedOptions(sys.argv, ["app_env_secret_name"])
secret_name = args["app_env_secret_name"]


sm = boto3.client("secretsmanager", region_name=os.environ.get("AWS_REGION", "us-east-1"))
cfg = json.loads(sm.get_secret_value(SecretId=secret_name)["SecretString"])

bucket = cfg["BUCKET_NAME"]
base_path = f"s3a://{bucket}/refined-zone"
base_path = base_path.rstrip("/")
if base_path.startswith("s3://"):
    base_path = "s3a://" + base_path[len("s3://"):]
if not base_path.endswith("/refined-zone"):
    base_path = f"{base_path}/refined-zone"

spark = SparkSession.builder.appName("TlcTripsRefined").getOrCreate()
spark._jsc.hadoopConfiguration().set(
    "fs.s3a.aws.credentials.provider",
    "com.amazonaws.auth.InstanceProfileCredentialsProvider,com.amazonaws.auth.DefaultAWSCredentialsProviderChain",
)

df = spark.read.parquet(f"s3a://{bucket}/trusted-zone/yellow_tripdata")
df_taxi_zone = spark.read.parquet(f"s3a://{bucket}/trusted-zone/taxi_zone")

ft_corrida_taxi = df.select(
    f.col("VendorID").alias("cd_empresa"),
    f.col("VendorDesc").alias("ds_empresa"),
    f.col("passenger_count").alias("qt_passageiros"),
    f.col("total_amount").alias("vl_total"),
    f.col("tpep_pickup_datetime").alias("ts_inicio_corrida"),
    f.col("tpep_dropoff_datetime").alias("ts_fim_corrida"),
    f.col("trip_distance").alias("vl_distancia_mi"),
    f.col("RatecodeID").alias("cd_tarifa"),
    f.col("RatecodeDesc").alias("ds_tarifa"),
    f.col("store_and_fwd_flag").alias("fl_transmissao"),
    f.col("store_and_fwd_desc").alias("ds_transmissao"),
    f.col("PULocationID").alias("cd_zona_embarque"),
    f.col("DOLocationID").alias("cd_zona_desembarque"),
    f.col("payment_type").alias("cd_pagamento"),
    f.col("payment_desc").alias("ds_pagamento"),
    f.col("fare_amount").alias("vl_tarifa_base"),
    f.col("extra").alias("vl_extra"),
    f.col("mta_tax").alias("vl_mta_tax"),
    f.col("tip_amount").alias("vl_gorjeta"),
    f.col("tolls_amount").alias("vl_pedagio"),
    f.col("improvement_surcharge").alias("vl_sobretaxa_melhoria"),
    f.col("congestion_surcharge").alias("vl_sobretaxa_congestionamento"),
    f.col("airport_fee").alias("vl_taxa_aeroporto"),
)

dim_empresa = (
    ft_corrida_taxi.select("cd_empresa", "ds_empresa").dropDuplicates()
    .orderBy("cd_empresa")
    .withColumn("sk_empresa", f.row_number().over(w.orderBy("cd_empresa")))
    .select("sk_empresa", "cd_empresa", "ds_empresa")
)

dim_tarifa = (
    ft_corrida_taxi.select("cd_tarifa", "ds_tarifa").dropDuplicates()
    .orderBy("cd_tarifa")
    .withColumn("sk_tarifa", f.row_number().over(w.orderBy("cd_tarifa")))
    .select("sk_tarifa", "cd_tarifa", "ds_tarifa")
)

dim_pagamento = (
    ft_corrida_taxi.select("cd_pagamento", "ds_pagamento").dropDuplicates()
    .orderBy("cd_pagamento")
    .withColumn("sk_pagamento", f.row_number().over(w.orderBy("cd_pagamento")))
    .select("sk_pagamento", "cd_pagamento", "ds_pagamento")
)

dim_transmissao = (
    ft_corrida_taxi.select("fl_transmissao", "ds_transmissao").dropDuplicates()
    .orderBy("fl_transmissao", "ds_transmissao")
    .withColumn("sk_transmissao", f.row_number().over(w.orderBy("fl_transmissao", "ds_transmissao")))
    .select("sk_transmissao", "fl_transmissao", "ds_transmissao")
)

dim_zona = (
    df_taxi_zone.select(
        f.col("LocationID").alias("cd_zona"),
        f.col("Zone").alias("ds_zona"),
        f.col("Borough").alias("ds_distrito"),
        f.col("service_zone").alias("ds_zona_servico"),
    )
    .dropDuplicates(["cd_zona"])
    .orderBy("cd_zona")
    .withColumn("sk_zona", f.row_number().over(w.orderBy("cd_zona")))
    .select("sk_zona", "cd_zona", "ds_zona", "ds_distrito", "ds_zona_servico")
)

anos = ft_corrida_taxi.agg(
    f.year(f.min("ts_inicio_corrida")).alias("ano_inicio"),
    f.year(f.max("ts_fim_corrida")).alias("ano_fim"),
)

limites = anos.select(
    f.to_date(f.concat_ws("-", f.col("ano_inicio"), f.lit("01"), f.lit("01"))).alias("dt_inicio"),
    f.to_date(f.concat_ws("-", f.col("ano_fim"), f.lit("12"), f.lit("31"))).alias("dt_fim"),
)

dim_calendario = (
    limites.select(f.explode(f.sequence("dt_inicio", "dt_fim", f.expr("interval 1 day"))).alias("dt_calendario"))
    .withColumn("ano", f.year("dt_calendario"))
    .withColumn("mes", f.month("dt_calendario"))
    .withColumn("dia", f.dayofmonth("dt_calendario"))
    .withColumn("trimestre", f.quarter("dt_calendario"))
    .withColumn("ano_mes", f.expr("(ano * 100) + mes"))
    .orderBy("dt_calendario")
    .select("dt_calendario", "ano", "mes", "dia", "trimestre", "ano_mes")
)

ft_corrida_taxi = ft_corrida_taxi.select(
    f.col("cd_empresa"),
    f.col("qt_passageiros"),
    f.col("vl_total"),
    f.col("ts_inicio_corrida"),
    f.col("ts_fim_corrida"),
    f.col("vl_distancia_mi"),
    f.col("cd_tarifa"),
    f.col("fl_transmissao"),
    f.col("cd_zona_embarque"),
    f.col("cd_zona_desembarque"),
    f.col("cd_pagamento"),
    f.col("vl_tarifa_base"),
    f.col("vl_extra"),
    f.col("vl_mta_tax"),
    f.col("vl_gorjeta"),
    f.col("vl_pedagio"),
    f.col("vl_sobretaxa_melhoria"),
    f.col("vl_sobretaxa_congestionamento"),
    f.col("vl_taxa_aeroporto"),
).where(
    (f.col("vl_total") >= 0) &
    (f.col("ts_inicio_corrida") >= '2023-01-01') &
    (f.col("ts_inicio_corrida") <= '2023-05-31') &
    (f.col("qt_passageiros") >= 0) &
    (f.col("vl_distancia_mi") >= 0)
)

datasets = {
    "dim_empresa": dim_empresa,
    "dim_tarifa": dim_tarifa,
    "dim_pagamento": dim_pagamento,
    "dim_transmissao": dim_transmissao,
    "dim_zona": dim_zona,
    "dim_calendario": dim_calendario,
    "ft_corrida_taxi": ft_corrida_taxi,
}

for nome, ddf in datasets.items():
    ddf.write.format("parquet").mode("overwrite").option("compression", "snappy").save(f"{base_path}/{nome}/")
    print(f"{nome} saved")
