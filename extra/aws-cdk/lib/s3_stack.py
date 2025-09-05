from aws_cdk import Stack, Tags, RemovalPolicy, Environment
from aws_cdk.aws_s3 import Bucket
from aws_cdk.aws_iam import Role
from aws_cdk.aws_s3_deployment import BucketDeployment, Source
from constructs import Construct
import os
import boto3


class S3Stack(Stack):
    def __init__(self, scope: Construct, id: str, env: Environment, bucket_name: str, glue_role: Role = None, files_to_upload_path: str = None, destination_key_prefix: str = None) -> None:
        super().__init__(scope, id, env=env)

        s3c = boto3.client("s3")
        exists = True

        try:
            s3c.head_bucket(Bucket=bucket_name)
        except s3c.exceptions.ClientError:
            exists = False

        if exists:
            self.s3_bucket = Bucket.from_bucket_name(
                scope=self, id=id, bucket_name=bucket_name)
        else:
            self.s3_bucket = Bucket(self, id, bucket_name=bucket_name,
                                    versioned=True, removal_policy=RemovalPolicy.RETAIN)

            if glue_role:
                self.s3_bucket.grant_read_write(glue_role)

        if files_to_upload_path:
            BucketDeployment(self, "DeployFilesToS3", sources=[Source.asset(os.path.join(os.path.dirname(os.path.dirname(
                __file__)), files_to_upload_path))], destination_bucket=self.s3_bucket, destination_key_prefix=destination_key_prefix)
