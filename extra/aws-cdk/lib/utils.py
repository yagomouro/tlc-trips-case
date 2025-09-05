from aws_cdk import Tags

def tag_stack(stack, tags: dict):
    for key, value in tags.items():
        Tags.of(stack).add(key, value)
