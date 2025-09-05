import os
import sys
import json
from datetime import datetime
import requests as req
import pandas as pd
from io import BytesIO
import boto3
from awsglue.utils import getResolvedOptions

args = getResolvedOptions(sys.argv, ["base_path", "app_env_secret_name"])
base_path = args["base_path"].rstrip("/")
secret_name = args["app_env_secret_name"]

sm = boto3.client("secretsmanager", region_name=os.environ.get("AWS_REGION", "us-east-1"))
secret_value = sm.get_secret_value(SecretId=secret_name)
cfg = json.loads(secret_value["SecretString"])

bucket_name = cfg["BUCKET_NAME"]
year = cfg.get("YEAR", "2023")
months = cfg.get("MONTHS", ["01","02","03","04","05"])

ingest_dt = datetime.utcnow()
ingest_year = f"{ingest_dt.year:04d}"
ingest_month = f"{ingest_dt.month:02d}"
ingest_day = f"{ingest_dt.day:02d}"

s3 = boto3.client("s3")

for month in months:
    url = f"https://d37ci6vzurychx.cloudfront.net/trip-data/yellow_tripdata_{year}-{month}.parquet"
    resp = req.get(url, timeout=60)
    resp.raise_for_status()
    df = pd.read_parquet(BytesIO(resp.content)).astype(str)
    buf = BytesIO()
    df.to_parquet(buf, index=False)
    buf.seek(0)
    s3_key = f"{base_path}/landing-zone/yellow_tripdata/year={ingest_year}/month={ingest_month}/day={ingest_day}/yellow_tripdata_{year}-{month}.parquet"
    s3.put_object(Body=buf, Bucket=bucket_name, Key=s3_key)
    print(f"{year}-{month} -> s3://{bucket_name}/{s3_key}")

url_lookup = "https://d37ci6vzurychx.cloudfront.net/misc/taxi_zone_lookup.csv"
resp_lookup = req.get(url_lookup, timeout=60)
resp_lookup.raise_for_status()
df_lookup = pd.read_csv(BytesIO(resp_lookup.content)).astype(str)
buf = BytesIO()
df_lookup.to_csv(buf, index=False)
buf.seek(0)
s3_key_lookup = f"{base_path}/landing-zone/taxi_zone/year={ingest_year}/month={ingest_month}/day={ingest_day}/taxi_zone_lookup.csv"
s3.put_object(Body=buf, Bucket=bucket_name, Key=s3_key_lookup)
print(f"lookup -> s3://{bucket_name}/{s3_key_lookup}")
