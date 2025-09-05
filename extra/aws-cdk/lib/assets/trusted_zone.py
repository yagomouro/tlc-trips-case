import os
import sys
import json
from datetime import datetime
import boto3
from awsglue.utils import getResolvedOptions
from pyspark.sql import SparkSession, functions as f

args = getResolvedOptions(sys.argv, ["base_path", "app_env_secret_name"])
base_path = args["base_path"].rstrip("/")
secret_name = args["app_env_secret_name"]

sm = boto3.client("secretsmanager", region_name=os.environ.get("AWS_REGION", "us-east-1"))
cfg = json.loads(sm.get_secret_value(SecretId=secret_name)["SecretString"])
bucket_name = cfg["BUCKET_NAME"]

spark = SparkSession.builder.appName("TlcTripsTrusted").getOrCreate()
spark._jsc.hadoopConfiguration().set(
    "fs.s3a.aws.credentials.provider",
    "com.amazonaws.auth.InstanceProfileCredentialsProvider,com.amazonaws.auth.DefaultAWSCredentialsProviderChain",
)

ingest_dt = datetime.utcnow()
y = f"{ingest_dt.year:04d}"
m = f"{ingest_dt.month:02d}"
d = f"{ingest_dt.day:02d}"

df_raw = spark.read.parquet(
    f"s3a://{bucket_name}/{base_path}/landing-zone/yellow_tripdata/year={y}/month={m}/day={d}/"
)

df = df_raw.select(
    f.col("VendorID").cast("integer").alias("VendorID"),
    f.col("passenger_count").cast("integer").alias("passenger_count"),
    f.col("total_amount").cast("float").alias("total_amount"),
    f.col("tpep_pickup_datetime").cast("timestamp").alias("tpep_pickup_datetime"),
    f.col("tpep_dropoff_datetime").cast("timestamp").alias("tpep_dropoff_datetime"),
    f.col("trip_distance").cast("float").alias("trip_distance"),
    f.col("store_and_fwd_flag").cast("string").alias("store_and_fwd_flag"),
    f.col("RatecodeID").cast("integer").alias("RatecodeID"),
    f.col("PULocationID").cast("integer").alias("PULocationID"),
    f.col("DOLocationID").cast("integer").alias("DOLocationID"),
    f.col("payment_type").cast("integer").alias("payment_type"),
    f.col("fare_amount").cast("float").alias("fare_amount"),
    f.col("extra").cast("float").alias("extra"),
    f.col("mta_tax").cast("float").alias("mta_tax"),
    f.col("tip_amount").cast("float").alias("tip_amount"),
    f.col("tolls_amount").cast("float").alias("tolls_amount"),
    f.col("improvement_surcharge").cast("float").alias("improvement_surcharge"),
    f.col("congestion_surcharge").cast("float").alias("congestion_surcharge"),
    f.col("airport_fee").cast("float").alias("airport_fee"),
)

df = df.select(
    "*",
    f.expr("""
        CASE
            WHEN VendorID = 1 THEN 'Creative Mobile Technologies, LLC'
            WHEN VendorID = 2 THEN 'Curb Mobility, LLC'
            WHEN VendorID = 6 THEN 'Myle Technologies Inc'
            WHEN VendorID = 7 THEN 'Helix'
            ELSE 'Blank'
        END
    """).alias("VendorDesc"),
    f.expr("""
        CASE
            WHEN RatecodeID = 1 THEN 'Standard rate'
            WHEN RatecodeID = 2 THEN 'JFK'
            WHEN RatecodeID = 3 THEN 'Newark'
            WHEN RatecodeID = 4 THEN 'Nassau or Westchester'
            WHEN RatecodeID = 5 THEN 'Negotiated fare'
            WHEN RatecodeID = 6 THEN 'Group ride'
            WHEN RatecodeID = 99 THEN 'Null/unknown'
            ELSE 'Blank'
        END
    """).alias("RatecodeDesc"),
    f.when(f.col("store_and_fwd_flag") == "Y", "Store and forward trip")
     .when(f.col("store_and_fwd_flag") == "N", "Not a store and forward trip")
     .otherwise("Blank")
     .alias("store_and_fwd_desc"),
    f.expr("""
        CASE
            WHEN payment_type = 0 THEN 'Flex Fare trip'
            WHEN payment_type = 1 THEN 'Credit card'
            WHEN payment_type = 2 THEN 'Cash'
            WHEN payment_type = 3 THEN 'No charge'
            WHEN payment_type = 4 THEN 'Dispute'
            WHEN payment_type = 5 THEN 'Unknown'
            WHEN payment_type = 6 THEN 'Voided trip'
            ELSE 'Blank'
        END
    """).alias("payment_desc"),
)

df.write.mode("overwrite").option("compression", "snappy").parquet(f"s3a://{bucket_name}/trusted-zone/yellow_tripdata/")

df_taxi_zone_raw = spark.read.csv(f"s3a://{bucket_name}/landing-zone/taxi_zone/", header=True, inferSchema=False)
df_taxi_zone = df_taxi_zone_raw.select(
    f.col("LocationID").cast("integer").alias("LocationID"),
    f.col("Borough").cast("string").alias("Borough"),
    f.col("Zone").cast("string").alias("Zone"),
    f.col("service_zone").cast("string").alias("service_zone"),
)
df_taxi_zone.write.mode("overwrite").option("compression", "snappy").parquet(f"s3a://{bucket_name}/trusted-zone/taxi_zone/")
