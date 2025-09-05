from aws_cdk import Stack, Tags, aws_glue as glue, aws_s3 as s3, aws_iam as iam
from constructs import Construct

class GlueCrawlers(Stack):
    def __init__(self, scope: Construct, id: str, env, role_arn: str, crawlers: list[dict], s3_bucket: s3.Bucket = None, iam_role: iam.Role = None):
        super().__init__(scope, id, env=env)
        
        self.crawlers = {}
        
        if s3_bucket and iam_role:
            s3_bucket.grant_read_write(iam_role)
        
        for spec in crawlers:
            key = spec["key"]
            name = spec["name"]
            db = spec["database_name"]
            path = spec["s3_path"]
            cid = "".join(ch for ch in key.title() if ch.isalnum()) + "Crawler"
            self.crawlers[key] = glue.CfnCrawler(self, cid, name=name, role=role_arn, database_name=db, targets={"s3Targets":[{"path":path}]})
