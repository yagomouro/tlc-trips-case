import aws_cdk as cdk
from aws_cdk import (
    Stack, Duration, CfnOutput, Environment,
    aws_lambda as _lambda, aws_apigateway as apigw, aws_iam as iam
)
from aws_cdk.aws_ecr_assets import Platform
from constructs import Construct


class LambdaApiStack(Stack):
    def __init__(
        self,
        scope: Construct,
        id: str,
        env: Environment,
        function_name: str,
        code_path: str,
        memory_size: int = 512,
        timeout_seconds: int = 30,
        environment: dict | None = None,
        api_name: str | None = None,
        stage_name: str = "prod",
        managed_policy_arns: list[str] | None = None,
        cors_allow_origins: list[str] | None = None,
        cors_allow_methods: list[str] | None = None,
    ) -> None:
        super().__init__(scope, id, env=env)

        fn = _lambda.DockerImageFunction(
            self,
            "Fn",
            function_name=function_name,
            code=_lambda.DockerImageCode.from_image_asset(
                directory=code_path,
                file="Dockerfile",
                platform=Platform.LINUX_AMD64,            ),
            memory_size=memory_size,
            timeout=Duration.seconds(timeout_seconds),
            environment=environment or {},
        )

        if managed_policy_arns:
            for arn in sorted(set(managed_policy_arns)):
                fn.role.add_managed_policy(
                    iam.ManagedPolicy.from_managed_policy_arn(
                        self, f"mp-{arn.split('/')[-1]}", arn)
                )

        api = apigw.RestApi(
            self, "Api",
            rest_api_name=api_name or f"{function_name}-api",
            deploy_options=apigw.StageOptions(stage_name=stage_name),
            default_cors_preflight_options=apigw.CorsOptions(
                allow_origins=cors_allow_origins or ["*"],
                allow_methods=cors_allow_methods or apigw.Cors.ALL_METHODS,
            ),
        )
        integ = apigw.LambdaIntegration(fn, proxy=True)
        api.root.add_method("ANY", integ)
        api.root.add_resource("{proxy+}").add_method("ANY", integ)

        CfnOutput(self, "ApiUrl", value=api.url)
        CfnOutput(self, "FunctionName", value=fn.function_name)
