import asyncio
import logging
from datetime import datetime

from database import get_db
from services.execution_engine import process_operation

POLL_INTERVAL_SECONDS = 5

logger = logging.getLogger("scheduler")


async def process_pending_operations():
    db = get_db()
    now = datetime.utcnow().isoformat() + "Z"

    cursor = db.operations.find({
        "status": "pending",
        "scheduled_at": {"$lte": now},
    }).sort("scheduled_at", 1).limit(10)

    ops = await cursor.to_list(length=10)
    for op in ops:
        try:
            logger.info(f"Processing operation {op['operation_id']} [{op['operation_type']}] for event {op['event_id']}")
            result = await process_operation(op)
            logger.info(f"Operation {op['operation_id']} completed: {result.get('status')}")
        except Exception as e:
            logger.error(f"Failed to process operation {op['operation_id']}: {e}")
            await db.operations.update_one(
                {"operation_id": op["operation_id"]},
                {"$set": {"status": "failed", "result": {"error": str(e)}}}
            )

    return len(ops)


async def worker_loop():
    logger.info("Background worker started, polling every %ds", POLL_INTERVAL_SECONDS)
    while True:
        try:
            count = await process_pending_operations()
            if count:
                logger.info("Processed %d pending operations", count)
        except Exception as e:
            logger.error("Worker loop error: %s", e)
        await asyncio.sleep(POLL_INTERVAL_SECONDS)
