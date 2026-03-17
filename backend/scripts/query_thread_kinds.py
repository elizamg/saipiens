#!/usr/bin/env python3
"""
Query DynamoDB for Objectives and ChatThreads and report counts by `kind`.
Run from backend/ with AWS credentials configured (aws configure or env vars).

  export OBJECTIVES_TABLE=YourObjectivesTableName
  export CHAT_THREADS_TABLE=YourChatThreadsTableName
  python scripts/query_thread_kinds.py

Or pass table names as args:

  python scripts/query_thread_kinds.py [OBJECTIVES_TABLE] [CHAT_THREADS_TABLE]
"""

import os
import sys
from collections import Counter

try:
    import boto3
except ImportError:
    print("Install boto3: pip install boto3", file=sys.stderr)
    sys.exit(1)

REGION = os.environ.get("AWS_REGION", "us-west-1")


def get_table_names():
    if len(sys.argv) >= 3:
        return sys.argv[1], sys.argv[2]
    obj = os.environ.get("OBJECTIVES_TABLE")
    thr = os.environ.get("CHAT_THREADS_TABLE")
    if obj and thr:
        return obj, thr
    print(
        "Set OBJECTIVES_TABLE and CHAT_THREADS_TABLE, or pass as args: python query_thread_kinds.py OBJECTIVES_TABLE CHAT_THREADS_TABLE",
        file=sys.stderr,
    )
    sys.exit(1)


def scan_table(dynamodb, table_name, attr):
    """Scan table and return list of values for attr (e.g. 'kind')."""
    table = dynamodb.Table(table_name)
    items = []
    resp = table.scan(ProjectionExpression=attr)
    items.extend([r.get(attr) for r in resp.get("Items", [])])
    while resp.get("LastEvaluatedKey"):
        resp = table.scan(
            ProjectionExpression=attr,
            ExclusiveStartKey=resp["LastEvaluatedKey"],
        )
        items.extend([r.get(attr) for r in resp.get("Items", [])])
    return items


def main():
    obj_table, thr_table = get_table_names()
    dynamodb = boto3.resource("dynamodb", region_name=REGION)

    print("Region:", REGION)
    print("Objectives table:", obj_table)
    print("ChatThreads table:", thr_table)
    print()

    # Objectives
    try:
        kinds = scan_table(dynamodb, obj_table, "kind")
    except Exception as e:
        print("Objectives scan failed:", e)
        kinds = []
    obj_counts = Counter(kinds)
    if None in obj_counts:
        obj_counts["(missing)"] = obj_counts.pop(None)
    print("Objectives by kind:")
    for k, v in sorted(obj_counts.items(), key=lambda x: (-x[1], str(x[0]))):
        print(f"  {k!r}: {v}")
    print(f"  total: {len(kinds)}")
    print()

    # ChatThreads
    try:
        kinds = scan_table(dynamodb, thr_table, "kind")
    except Exception as e:
        print("ChatThreads scan failed:", e)
        kinds = []
    thr_counts = Counter(kinds)
    if None in thr_counts:
        thr_counts["(missing)"] = thr_counts.pop(None)
    print("ChatThreads by kind:")
    for k, v in sorted(thr_counts.items(), key=lambda x: (-x[1], str(x[0]))):
        print(f"  {k!r}: {v}")
    print(f"  total: {len(kinds)}")
    print()

    # Summary
    non_skill_knowledge_obj = sum(v for k, v in obj_counts.items() if k not in ("skill", "knowledge") and k is not None)
    non_skill_knowledge_thr = sum(v for k, v in thr_counts.items() if k not in ("skill", "knowledge") and k is not None)
    if non_skill_knowledge_obj or non_skill_knowledge_thr:
        print("Not skill/knowledge: Objectives has", non_skill_knowledge_obj, "| ChatThreads has", non_skill_knowledge_thr)
        print("→ Source of truth is Objectives; threads get kind from objective when created.")
    else:
        print("All objectives and threads are kind 'skill' or 'knowledge'.")


if __name__ == "__main__":
    main()
