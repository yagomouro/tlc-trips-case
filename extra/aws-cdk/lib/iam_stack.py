from aws_cdk import Stack, Environment, aws_iam as iam
from constructs import Construct

class DataLakeIam(Stack):
    def __init__(self, scope: Construct, id: str, env: Environment,  project: str, iam_user_name: str) -> None:
        super().__init__(scope, id, env=env)
        
        glue_policy = iam.ManagedPolicy.from_managed_policy_arn(self, "GluePolicy", "arn:aws:iam::aws:policy/AWSGlueConsoleFullAccess")
        s3_policy = iam.ManagedPolicy.from_managed_policy_arn(self, "S3Policy", "arn:aws:iam::aws:policy/AmazonS3FullAccess")
        logs_policy = iam.ManagedPolicy.from_managed_policy_arn(self, "LogsPolicy", "arn:aws:iam::aws:policy/CloudWatchLogsFullAccess")
       
        managed_policies = [glue_policy, s3_policy, logs_policy]
        group = iam.Group(self, "IamGroup", managed_policies=managed_policies)
        
        group.add_user(iam.User(self, "IamUser", user_name=iam_user_name))
        
        self.role = iam.Role(self, "IamRole", assumed_by=iam.ServicePrincipal("glue.amazonaws.com"), managed_policies=managed_policies, role_name=f"{project}-iam-role")