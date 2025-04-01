import os
import sys
import time
import click
import platform
import subprocess
import webbrowser
import logging
import requests

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

@click.command()
@click.option("--host", default="127.0.0.1", help="Host address for the FastAPI server")
@click.option("--port", default="8000", help="Port for the FastAPI server")
@click.option("--frontend-port", default="3000", help="Port for Next.js frontend dev mode")
@click.option("--server-reload", is_flag=True, default=False, help="Enable auto-reload for the server")
@click.option("--dev", is_flag=True, default=False, help="Run the Next.js frontend in development mode")
def main(host, port, frontend_port, server_reload, dev):
    """
    Launches the FastAPI backend and optionally the Next.js frontend using a single 'ingradient' command.
    """

    logging.getLogger("sqlalchemy.engine").setLevel(logging.ERROR)
    uvicorn_cmd = [
        "uvicorn",
        "server.main:app",
        "--host", host,
        "--port", str(port),
        "--log-level", "error",
    ]
    if server_reload:
        uvicorn_cmd.append("--reload")

    click.echo("🚀 Starting FastAPI backend...")
    backend_process = subprocess.Popen(uvicorn_cmd)

    # 서버 준비될 때까지 /ping 폴링
    if not wait_for_server(host, port, timeout=120.0):
        click.echo("❌ Failed to start server properly. Terminating...")
        backend_process.terminate()
        return

    # Next.js dev 모드
    frontend_process = None
    if dev:
        web_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "web")
        npm_command = "npm.cmd" if platform.system() == "Windows" else "npm"
        frontend_cmd = [npm_command, "run", "dev"]
        click.echo("🌐 Starting Next.js frontend in dev mode...")
        frontend_process = subprocess.Popen(frontend_cmd, cwd=web_dir)
        time.sleep(3)
        web_url = f"http://127.0.0.1:{frontend_port}"
    else:
        # 프로덕션 (정적 빌드가 server/main.py에 있음)
        web_url = f"http://{host}:{port}"

    click.echo("🌐 Opening browser...")
    webbrowser.open(web_url)

    welcome_message = f"""
    =============================================================================
    ██╗███╗   ██╗ ██████╗ ██████╗  █████╗ ███████╗ ██╗███████╗███╗   ██╗████████╗
    ██║████╗  ██║██╔════╝ ██╔══██╗██╔══██╗██╔═══██╗██║██╔════╝████╗  ██║╚══██╔══╝
    ██║██╔██╗ ██║██║  ███╗██████╔╝███████║██║   ██║██║█████╗  ██╔██╗ ██║   ██║
    ██║██║╚██╗██║██║   ██║██╔══██╗██╔══██║██║   ██║██║██╔══╝  ██║╚██╗██║   ██║
    ██║██║ ╚████║╚██████╔╝██║  ██║██║  ██║███████╔╝██║███████╗██║ ╚████║   ██║
    ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝ ╚═╝╚══════╝╚═╝  ╚═══╝   ╚═╝

    Welcome to Ingradient!

    Your frontend is now running at:
    {web_url}

    Backend is running on:
    http://{host}:{port}

    Enjoy your experience!
    =============================================================================
    """
    click.echo(welcome_message)

    # 프로세스 종료까지 대기
    try:
        backend_process.wait()
        if frontend_process:
            frontend_process.wait()
    except KeyboardInterrupt:
        click.echo("Shutting down processes...")
        backend_process.terminate()
        if frontend_process:
            frontend_process.terminate()

if __name__ == "__main__":
    main()
