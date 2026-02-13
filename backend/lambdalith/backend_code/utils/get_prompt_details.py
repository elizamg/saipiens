import json
import os

RAW_PROMPT_KEY = "raw_prompt"
JSON_SCHEMA_KEY = "json_schema"

# Load all prompt files from the prompts directory
prompts_dir = os.path.join(os.path.dirname(__file__), '..', 'prompts')

raw_prompts = {}
json_schemas = {}

# Load all _prompt.txt files into raw_prompts
for filename in os.listdir(prompts_dir):
    if filename.endswith('_prompt.txt'):
        prompt_name = filename.replace('_prompt.txt', '')
        with open(os.path.join(prompts_dir, filename), 'r') as f:
            raw_prompts[prompt_name] = f.read()

# Load all _schema.json files into json_schemas
for filename in os.listdir(prompts_dir):
    if filename.endswith('_schema.json'):
        schema_name = filename.replace('_schema.json', '')
        with open(os.path.join(prompts_dir, filename), 'r') as f:
            content = f.read().strip()
            # Only load if file is not empty or null
            if content and content != 'null':
                json_schemas[schema_name] = json.loads(content)

def get_prompt_details(prompt_name):
    details = {}

    if prompt_name in raw_prompts.keys():
        details[RAW_PROMPT_KEY] = raw_prompts[prompt_name]

    if prompt_name in json_schemas.keys():
        details[JSON_SCHEMA_KEY] = json_schemas[prompt_name]

    return details