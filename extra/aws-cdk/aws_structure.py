import os
from dotenv import load_dotenv
from aws_cdk import App, Environment, StackProps
from lib.utils import tag_stack
from lib.iam_stack import DataLakeIam
from lib.s3_stack import S3Stack
from lib.secrets_stack import SecretsStack
from lib.glue_db_stack import GlueDb
from lib.glue_crawler_stack import GlueCrawlers
from lib.glue_job_stack import GlueJobStack
from lib.workflow_stack import WorkflowStack
from lib.lambda_stack import LambdaApiStack

load_dotenv()

secret_keys = [
    'PROJECT_NAME', 'PROJECT_OWNER', 'BUCKET_NAME', 'POSTGRES_HOST', 
    'POSTGRES_PORT', 'POSTGRES_DB', 'POSTGRES_USER', 'POSTGRES_PASSWORD', 'POSTGRES_SCHEMA', 'MODEL_CLASSIFIER', 'MODEL_DB', 'MODEL_DOCS', 
    'MODEL_GENERIC', 'COMPANY_FILES_PREFIX', 'MAX_RESULT_ROWS', 'OPENAI_API_KEY', 'OPENAI_BASE_URL', 
]

app_env_payload = {k: os.environ[k] for k in secret_keys if os.environ.get(k)}

app = App()
env = Environment(account=os.environ["AWS_ACCOUNT"], region=os.environ["AWS_REGION"])
project = os.environ["PROJECT_NAME"]
owner = os.environ["PROJECT_OWNER"]
bucket = os.environ["BUCKET_NAME"]
tags = {"project": project, "owner": owner}


iam_stack = DataLakeIam(app, id="IamStack", env=env, project=project, iam_user_name="awsUser")
s3_stack = S3Stack(app, id="S3Stack", env=env, bucket_name=bucket, glue_role=iam_stack.role, files_to_upload_path="./lib/assets", destination_key_prefix = "glue-scripts")


base = project.replace("-","_")

crawler_specs = [
    {"key":"landing","name":f"{project}-landing-crawler","database_name":f"{base}_landing_db","s3_path":f"s3://{bucket}/landing-zone/"},
    {"key":"trusted","name":f"{project}-trusted-crawler","database_name":f"{base}_trusted_db","s3_path":f"s3://{bucket}/trusted-zone/"},
    {"key":"refined","name":f"{project}-refined-crawler","database_name":f"{base}_refined_db","s3_path":f"s3://{bucket}/refined-zone/"}
]

glue_crawler_stack = GlueCrawlers(app, id="GlueCrawlerStack", env=env, role_arn=iam_stack.role.role_arn, crawlers=crawler_specs, s3_bucket=s3_stack.s3_bucket, iam_role=iam_stack.role)

landing_crawler = glue_crawler_stack.crawlers["landing"]
trusted_crawler = glue_crawler_stack.crawlers["trusted"]
refined_crawler = glue_crawler_stack.crawlers["refined"]


dbs = [f"{base}_landing_db", f"{base}_trusted_db", f"{base}_refined_db"]
glue_db_stack = GlueDb(app, id="GlueDbStack", env=env, databases=dbs)


secrets_stack = SecretsStack(app, id="SecretsStack", env=env, project=project, payload=app_env_payload)
secrets_stack.grant_read_to(iam_stack.role)  

landing_job = GlueJobStack(app, id="LandingJobStack", env=env, s3_bucket=s3_stack.s3_bucket, iam_role=iam_stack.role, job_name=f"{project}-landing-job", script_location=f"s3://{bucket}/glue-scripts/landing_zone.py", 
    new_args={
        "--base_path": f"s3://{bucket}",
        "--app_env_secret_name": secrets_stack.app_env_secret.secret_name,  
    }
)
trusted_job = GlueJobStack(app, id="TrustedJobStack", env=env, s3_bucket=s3_stack.s3_bucket, iam_role=iam_stack.role, job_name=f"{project}-trusted-job", script_location=f"s3://{bucket}/glue-scripts/trusted_zone.py", 
    new_args={
        "--base_path": f"s3://{bucket}",
        "--app_env_secret_name": secrets_stack.app_env_secret.secret_name,  
    }
)
refined_job = GlueJobStack(app, id="RefinedJobStack", env=env, s3_bucket=s3_stack.s3_bucket, iam_role=iam_stack.role, job_name=f"{project}-refined-job", script_location=f"s3://{bucket}/glue-scripts/refined_zone.py", 
    new_args={
        "--base_path": f"s3://{bucket}",
        "--app_env_secret_name": secrets_stack.app_env_secret.secret_name,  
    }
)
refined_to_dw_job = GlueJobStack(app, id="RefinedDwJobStack", env=env, s3_bucket=s3_stack.s3_bucket, iam_role=iam_stack.role, job_name=f"{project}-refined-dw-job", script_location=f"s3://{bucket}/glue-scripts/refined_to_dw.py", 
    new_args={
        "--base_path": f"s3://{bucket}",
        "--app_env_secret_name": secrets_stack.app_env_secret.secret_name,  
    }
)


workflow_stack = WorkflowStack(
    app,
    id="WorkflowStack",
    env=env,
    landing_job=landing_job,
    landing_crawler=landing_crawler,
    trusted_job=trusted_job,
    trusted_crawler=trusted_crawler,
    refined_job=refined_job,
    refined_crawler=refined_crawler,
    refined_to_dw_job=refined_to_dw_job,
)



lambda_stack = LambdaApiStack(
    app,
    id="LambdaApiStack",
    env=env,
    function_name=f"{project}-ai-agent-v2",
    code_path="../ai-agent-backend",  
    memory_size=1024,
    timeout_seconds=30,
    environment=app_env_payload,  
    api_name=f"{project}-api",
    stage_name="prod",
    cors_allow_origins=["*"],
)


for stack in [iam_stack, s3_stack, glue_db_stack, glue_crawler_stack, landing_job, trusted_job, refined_job, workflow_stack, lambda_stack, refined_to_dw_job]:
    tag_stack(stack, tags)

app.synth()