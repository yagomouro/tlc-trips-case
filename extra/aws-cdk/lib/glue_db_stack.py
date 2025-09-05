from aws_cdk import Stack
from aws_cdk.aws_glue import CfnDatabase

class GlueDb(Stack):
    def __init__(self, scope, id: str, env, databases: list[str]):
        super().__init__(scope, id, env=env)
        self.databases = {}
        for name in databases:
            cid = "".join(ch for ch in name.title() if ch.isalnum()) + "Db"
            self.databases[name] = CfnDatabase(self, cid, catalog_id=self.account, database_input=CfnDatabase.DatabaseInputProperty(name=name))
