from aws_cdk import Stack
from aws_cdk.aws_glue import CfnWorkflow, CfnTrigger
from constructs import Construct


class WorkflowStack(Stack):
    def __init__(
        self,
        scope: Construct,
        id: str,
        *,
        env,
        landing_job,
        landing_crawler,
        trusted_job,
        trusted_crawler,
        refined_job,
        refined_crawler,
        refined_to_dw_job,
    ) -> None:
        super().__init__(scope, id, env=env)

        workflow = CfnWorkflow(self, "DatalakeWorkflow",
                               name="DatalakeWorkflow")

        CfnTrigger(
            self,
            "LandingJobTrigger",
            name=f"run-{landing_job.job.name}",
            type="SCHEDULED",
            schedule="cron(0 6 * * ? *)",
            actions=[{"jobName": landing_job.job.name}],
            workflow_name=workflow.name,
            start_on_creation=True,
        )

        CfnTrigger(
            self,
            f"{landing_crawler.node.id}Trigger",
            name=f"run-{landing_crawler.name}",
            type="CONDITIONAL",
            start_on_creation=True,
            actions=[{"crawlerName": landing_crawler.name}],
            predicate={
                "conditions": [{
                    "logicalOperator": "EQUALS",
                    "jobName": landing_job.job.name,
                    "state": "SUCCEEDED",
                }],
                "logical": "ANY",
            },
            workflow_name=workflow.name,
        )

        CfnTrigger(
            self,
            f"{trusted_job.node.id}Trigger",
            name=f"run-{trusted_job.job.name}",
            type="CONDITIONAL",
            start_on_creation=True,
            actions=[{"jobName": trusted_job.job.name}],
            predicate={
                "conditions": [{
                    "logicalOperator": "EQUALS",
                    "crawlerName": landing_crawler.name,
                    "crawlState": "SUCCEEDED",
                    "state": "SUCCEEDED",
                }],
                "logical": "ANY",
            },
            workflow_name=workflow.name,
        )

        CfnTrigger(
            self,
            f"{trusted_crawler.node.id}Trigger",
            name=f"run-{trusted_crawler.name}",
            type="CONDITIONAL",
            start_on_creation=True,
            actions=[{"crawlerName": trusted_crawler.name}],
            predicate={
                "conditions": [{
                    "logicalOperator": "EQUALS",
                    "jobName": trusted_job.job.name,
                    "state": "SUCCEEDED",
                }],
                "logical": "ANY",
            },
            workflow_name=workflow.name,
        )

        CfnTrigger(
            self,
            f"{refined_job.node.id}Trigger",
            name=f"run-{refined_job.job.name}",
            type="CONDITIONAL",
            start_on_creation=True,
            actions=[{"jobName": refined_job.job.name}],
            predicate={
                "conditions": [{
                    "logicalOperator": "EQUALS",
                    "crawlerName": trusted_crawler.name,
                    "crawlState": "SUCCEEDED",
                    "state": "SUCCEEDED",
                }],
                "logical": "ANY",
            },
            workflow_name=workflow.name,
        )

        CfnTrigger(
            self,
            f"{refined_crawler.node.id}Trigger",
            name=f"run-{refined_crawler.name}",
            type="CONDITIONAL",
            start_on_creation=True,
            actions=[{"crawlerName": refined_crawler.name}],
            predicate={
                "conditions": [{
                    "logicalOperator": "EQUALS",
                    "jobName": refined_job.job.name,
                    "state": "SUCCEEDED",
                }],
                "logical": "ANY",
            },
            workflow_name=workflow.name,
        )

        CfnTrigger(
            self,
            f"{refined_to_dw_job.node.id}Trigger",
            name=f"run-{refined_to_dw_job.job.name}",
            type="CONDITIONAL",
            start_on_creation=True,
            actions=[{"jobName": refined_to_dw_job.job.name}],
            predicate={
                "conditions": [{
                    "logicalOperator": "EQUALS",
                    "crawlerName": refined_crawler.name,
                    "crawlState": "SUCCEEDED",
                    "state": "SUCCEEDED",
                }],
                "logical": "ANY",
            },
            workflow_name=workflow.name,
        )
