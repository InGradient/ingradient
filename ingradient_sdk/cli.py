import os
import time
import click
import platform
import subprocess
import webbrowser
import logging
from fastapi.staticfiles import StaticFiles

@click.command()
@click.option("--server-host", default="127.0.0.1", help="Host address for the FastAPI server")
@click.option("--server-port", default="8000", help="Port for the FastAPI server")
@click.option("--frontend-port", default="3000", help="Port for the Next.js frontend (only for dev mode)")
@click.option("--server-reload", is_flag=True, default=False, help="Enable auto-reload for the server")
@click.option("--dev", is_flag=True, default=False, help="Run the Next.js frontend in development mode (npm run dev)")
def main(server_host, server_port, frontend_port, server_reload, dev):
    """
    Launches the FastAPI backend and optionally the Next.js frontend using a single 'ingradient' command.
    """
    logging.getLogger("sqlalchemy.engine").setLevel(logging.ERROR)

    from server.main import app

    # --- Mount static frontend if it exists ---
    static_dir = os.path.join(os.path.dirname(__file__), "static")
    web_build_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "web", "build")
    use_static = False

    if os.path.exists(static_dir):
        app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
        use_static = True
    elif os.path.exists(web_build_dir):
        app.mount("/", StaticFiles(directory=web_build_dir, html=True), name="web")
        use_static = True

    # --- Prepare and start the FastAPI backend ---
    uvicorn_cmd = [
        "uvicorn",
        "server.main:app",
        "--host", server_host,
        "--port", str(server_port),
        "--log-level", "error",
    ]
    if server_reload:
        uvicorn_cmd.append("--reload")

    click.echo("🚀 Starting FastAPI backend...")
    backend_process = subprocess.Popen(uvicorn_cmd)

    time.sleep(2)

    # --- Handle frontend process based on mode ---
    frontend_process = None
    if dev:
        web_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "web")
        npm_command = "npm.cmd" if platform.system() == "Windows" else "npm"
        frontend_cmd = [npm_command, "run", "dev"]
        click.echo("🌐 Starting Next.js frontend in dev mode...")
        frontend_process = subprocess.Popen(frontend_cmd, cwd=web_dir)
        time.sleep(3)
        web_url = f"http://127.0.0.1:{frontend_port}"
    elif use_static:
        web_url = f"http://{server_host}:{server_port}"
    else:
        click.echo("❌ No static frontend build found. Run `next build && next export` to generate one.")
        backend_process.terminate()
        return

    webbrowser.open(web_url)

    welcome_message = f"""
    ============================================================
    ██╗███╗   ██╗ ██████╗ ██████╗  █████╗ ███████╗ ██╗███████╗███╗   ██╗████████╗
    ██║████╗  ██║██╔════╝ ██╔══██╗██╔══██╗██╔═══██╗██║██╔════╝████╗  ██║╚══██╔══╝
    ██║██╔██╗ ██║██║  ███╗██████╔╝███████║██║   ██║██║█████╗  ██╔██╗ ██║   ██║   
    ██║██║╚██╗██║██║   ██║██╔══██║██╔══██║██║   ██║██║██╔══╝  ██║╚██╗██║   ██║   
    ██║██║ ╚████║╚██████╔╝██║  ██║██║  ██║███████╔╝██║███████╗██║ ╚████║   ██║   
    ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝ ╚═╝╚══════╝╚═╝  ╚═══╝   ╚═╝   

    Welcome to Ingradient!

    Your frontend is now running at:
    {web_url}

    Backend is running on:
    http://{server_host}:{server_port}

    Enjoy your experience!
    ============================================================
    """

    click.echo(welcome_message)

    # --- Wait for processes to finish ---
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
