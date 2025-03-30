import os
import time
import click
import subprocess
import webbrowser

@click.command()
@click.option("--server-host", default="127.0.0.1", help="Host address for the FastAPI server")
@click.option("--server-port", default="8000", help="Port for the FastAPI server")
@click.option("--frontend-port", default="3000", help="Port for the Next.js frontend")
@click.option("--server-reload", is_flag=True, default=False, help="Enable auto-reload for the server")
@click.option("--dev", is_flag=True, default=False, help="Run the Next.js frontend in development mode (npm run dev)")
def main(server_host, server_port, frontend_port, server_reload, dev):
    """
    Launches the FastAPI backend and starts the Next.js frontend using a single 'ingradient' command.
    Opens the default web browser to the Next.js frontend URL with a fancy welcome message.
    """
    # --- Start FastAPI backend ---
    from server.main import app

    # If a built frontend exists in web/build, mount it into the FastAPI app (optional)
    web_build_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "web", "build")
    if os.path.exists(web_build_dir):
        from fastapi.staticfiles import StaticFiles
        app.mount("/", StaticFiles(directory=web_build_dir, html=True), name="web")

    # Prepare uvicorn command for the backend
    uvicorn_cmd = [
        "uvicorn",
        "server.main:app",
        "--host", server_host,
        "--port", str(server_port)
    ]
    if server_reload:
        uvicorn_cmd.append("--reload")

    click.echo("🚀 Starting FastAPI backend...")
    backend_process = subprocess.Popen(uvicorn_cmd)

    # --- Start Next.js frontend ---
    web_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "web")
    if dev:
        frontend_cmd = ["npm", "run", "dev"]
    else:
        frontend_cmd = ["npm", "run", "start"]

    click.echo("🌐 Starting Next.js frontend...")
    frontend_process = subprocess.Popen(frontend_cmd, cwd=web_dir)

    # Wait a few seconds to let the frontend start up
    time.sleep(5)

    # Open the default web browser to the Next.js frontend URL
    web_url = f"http://127.0.0.1:{frontend_port}"
    webbrowser.open(web_url)

    fancy_message = f"""
    ============================================================
     Welcome to Inggradient!
     
     Your Next.js frontend is now running at:
       {web_url}
     
     FastAPI backend is running on:
       http://{server_host}:{server_port}
     
     Enjoy your experience!
    ============================================================
    """
    click.echo(fancy_message)

    # Wait for both processes to finish (or until interrupted)
    try:
        backend_process.wait()
        frontend_process.wait()
    except KeyboardInterrupt:
        click.echo("Shutting down processes...")
        backend_process.terminate()
        frontend_process.terminate()

if __name__ == "__main__":
    main()
