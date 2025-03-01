import os
import sys
import subprocess
import argparse
from ingradient.server import start_fastapi_server

def start_nextjs(host):
    """Next.js 서버 실행 (host 설정 가능)"""
    web_dir = os.path.join(os.path.dirname(__file__), "web")
    env = os.environ.copy()
    env["HOST"] = host
    subprocess.Popen(["npm", "run", "start"], cwd=web_dir, env=env)

def main():
    """CLI 명령어 실행"""
    parser = argparse.ArgumentParser(description="Start Ingradient Labeling Tool")
    parser.add_argument("--host", type=str, default="127.0.0.1",
                        help="Specify host address (default: 127.0.0.1). Use 0.0.0.0 for remote access.")
    args = parser.parse_args()

    print(f"Starting Ingradient on {args.host}...")

    # FastAPI 서버 실행 (비동기 실행)
    subprocess.Popen([sys.executable, "-m", "ingradient.server", "--host", args.host])

    # Next.js 서버 실행
    start_nextjs(args.host)

if __name__ == "__main__":
    main()
