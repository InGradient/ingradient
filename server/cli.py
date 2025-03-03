import os
import sys
import subprocess
import argparse
import time
import webbrowser

print("🔥 CLI script started!")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
WEB_DIR = os.path.join(BASE_DIR, "..", "web")
NEXT_BUILD_DIR = os.path.join(WEB_DIR, ".next")

def start_nextjs():
    """Start the Next.js server (checks if the .next build directory exists)"""
    if not os.path.exists(NEXT_BUILD_DIR):
        print("⚠️ '.next' directory not found. Please run 'npm run build' first.")
        sys.exit(1)
    env = os.environ.copy()
    env["NODE_ENV"] = "production"
    subprocess.Popen(["npm", "run", "start"], cwd=WEB_DIR, env=env)
    print("Next.js server has started.")

def main():
    """Parse command line arguments and start the FastAPI and Next.js servers"""
    parser = argparse.ArgumentParser(description="Start the Ingradient Labeling Tool")
    parser.add_argument("--host", type=str, default="127.0.0.1",
                        help="Specify the host address (default: 127.0.0.1). Use 0.0.0.0 for remote access.")
    args = parser.parse_args()

    print(f"Starting Ingradient on {args.host}...")

    # Start the FastAPI server using uvicorn (calls server_launcher.py)
    server_launcher_path = os.path.join(BASE_DIR, "server_launcher.py")
    subprocess.Popen(
        [sys.executable, server_launcher_path, "--host", args.host, "--port", "8000"],
        stdout=sys.stdout, stderr=sys.stderr
    )
    print("FastAPI server (uvicorn) is running...")

    # Wait a short time to allow the server to start (adjust as needed)
    time.sleep(3)

    # Start the Next.js server
    start_nextjs()

    # Open the default web browser to the Next.js UI (default port 3000)
    ui_url = f"http://{args.host}:3000"
    print(f"Opening the web app UI at {ui_url}")
    webbrowser.open(ui_url)

    # Prevent the process from exiting by waiting indefinitely (use Ctrl+C to exit)
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("Shutting down...")

if __name__ == "__main__":
    main()
