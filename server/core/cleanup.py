# cleanup.py
import os
import shutil
import time
from datetime import datetime, timedelta

CLEANUP_INTERVAL = 3600
EXPIRE_TIME = 1800

def cleanup_tmp_folder(tmp_folder):
    while True:
        now = datetime.now()
        if os.path.exists(tmp_folder):
            for entry in os.listdir(tmp_folder):
                entry_path = os.path.join(tmp_folder, entry)
                try:
                    mtime = datetime.fromtimestamp(os.path.getmtime(entry_path))
                    if now - mtime > timedelta(seconds=EXPIRE_TIME):
                        if os.path.isfile(entry_path):
                            os.remove(entry_path)
                            print(f"Deleted expired file: {entry_path}")
                        elif os.path.isdir(entry_path):
                            shutil.rmtree(entry_path)
                            print(f"Deleted expired folder: {entry_path}")
                except Exception as e:
                    print(f"Error cleaning {entry_path}: {e}")
        time.sleep(CLEANUP_INTERVAL)

def start_cleanup_worker(tmp_folder):
    import threading
    thread = threading.Thread(target=cleanup_tmp_folder, args=(tmp_folder,), daemon=True)
    thread.start()
