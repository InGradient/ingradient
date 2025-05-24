import time
import requests
import threading
import itertools
import sys

def wait_for_server(host: str, port: str, timeout: float = 30.0):
    """
    Polls the /ping endpoint until the server responds, showing a spinner in the terminal.
    Only the spinner character is displayed in cyan.
    """
    url = f"http://{host}:{port}/ping"
    spinner_chars = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]
    start_time = time.time()
    idx = 0

    # Print initial message
    sys.stdout.write("⏳ Server is starting... ")
    sys.stdout.flush()

    while (time.time() - start_time) < timeout:
        spinner = spinner_chars[idx % len(spinner_chars)]
        # \033[36m : set text color to cyan, \033[0m : reset
        sys.stdout.write(f"\r\033[36m{spinner}\033[0m Server is starting... ")
        sys.stdout.flush()
        idx += 1

        try:
            r = requests.get(url, timeout=0.2)
            if r.status_code == 200:
                sys.stdout.write("\r✅ Server is ready!           \n")
                sys.stdout.flush()
                return True
        except requests.exceptions.RequestException:
            pass

        time.sleep(0.1)

    sys.stdout.write("\r❌ Server did not respond in time.\n")
    sys.stdout.flush()
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
