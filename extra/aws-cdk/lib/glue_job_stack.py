from aws_cdk import Stack, aws_s3 as s3, Environment, aws_iam as iam, aws_glue as glue
from constructs import Construct


class GlueJobStack(Stack):
    def __init__(self, scope: Construct, id: str, env: Environment, s3_bucket: s3.Bucket, iam_role: iam.Role, job_name: str, script_location: str, new_args: dict, number_of_workers: int = 2, glue_version: str = "4.0", worker_type: str = "G.1X") -> None:
        super().__init__(scope, id, env=env)

        self.job_name = job_name
        self.script_location = script_location

        s3_bucket.grant_read_write(iam_role)

        default_arguments = {
            "--TempDir": f"s3://{s3_bucket.bucket_name}/temp/",
            "--job-language": "python",
            "--enable-continuous-cloudwatch-log": "true",
            "--additional-python-modules": "delta-spark boto3 openpyxl pandas psycopg2-binary pyarrow python-dotenv requests sqlalchemy xlrd"
        }

        if new_args:
            default_arguments.update(new_args)

        self.job = glue.CfnJob(self, id,
                               role=iam_role.role_arn,
                               name=job_name,
                               command={
                                   "name": "glueetl", "scriptLocation": script_location, "pythonVersion": "3"},
                               default_arguments=default_arguments,
                               max_retries=0,
                               timeout=120,
                               number_of_workers=number_of_workers,
                               glue_version=glue_version,
                               worker_type=worker_type
                               )
