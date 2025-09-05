import json
import aws_cdk as cdk
from aws_cdk import Stack, Environment, CfnOutput, aws_secretsmanager as secretsmanager, aws_iam as iam
from constructs import Construct

class SecretsStack(Stack):
    def __init__(self, scope: Construct, id: str, env: Environment, project: str, payload: dict[str, str]) -> None:
        super().__init__(scope, id, env=env)

        secret_name = f"{project}/app_env"

        self.app_env_secret = secretsmanager.Secret(
            self,
            "AppEnvSecret",
            secret_name=secret_name,
            description=f"Config (.env) for {project} jobs",
            secret_string_value=cdk.SecretValue.unsafe_plain_text(json.dumps(payload)),
        )

        CfnOutput(self, "AppEnvSecretName", value=self.app_env_secret.secret_name)

    def grant_read_to(self, principal: iam.IGrantable) -> None:
        self.app_env_secret.grant_read(principal)
