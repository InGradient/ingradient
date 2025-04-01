import time
import requests
import threading
import itertools
import sys

def wait_for_server(url, timeout=30, interval=0.5):
    """
    주어진 url에 대해 서버가 제대로 응답(200)할 때까지 기다린다.
    준비가 안 되면 일정 간격(interval)으로 재시도하며,
    timeout이 지나면 False를 리턴한다.
    """
    start = time.time()
    while time.time() - start < timeout:
        try:
            r = requests.get(url)
            if r.status_code == 200:
                return True
        except requests.exceptions.RequestException:
            pass
        time.sleep(interval)
    return False

def start_spinner(spinner_message="Server is starting..."):
    """
    스피너(ASCII 애니메이션)를 돌리는 쓰레드를 시작한다.
    spinner_message는 스피너 앞에 함께 표시할 메시지.
    """
    stop_event = threading.Event()

    def spin():
        for cursor in itertools.cycle(['|', '/', '-', '\\']):
            if stop_event.is_set():
                break
            sys.stdout.write(f"\r{spinner_message} {cursor}")
            sys.stdout.flush()
            time.sleep(0.1)
        # 스피너 멈춘 후, 줄 바꿈 처리
        sys.stdout.write("\r")
        sys.stdout.flush()

    thread = threading.Thread(target=spin, daemon=True)
    thread.start()
    return stop_event, thread

def stop_spinner(stop_event, thread, end_message=None):
    """
    start_spinner로 시작한 스피너를 정지시키고,
    end_message가 있으면 그 메시지를 출력한다.
    """
    stop_event.set()
    thread.join()
    if end_message:
        print(end_message)
