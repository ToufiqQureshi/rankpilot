from backend.core.celery_app import celery_app
import time

@celery_app.task(name="test_task")
def test_task(word: str):
    time.sleep(5)
    return f"Hello {word}, from background task!"

# Ideally, we will import actual generation tasks here later
# from backend.core.tools.generator import generate_content_task
