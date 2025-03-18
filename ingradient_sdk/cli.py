import os
import time
import click
import subprocess
from fastapi.staticfiles import StaticFiles

@click.command()
@click.option("--server-host", default="127.0.0.1", help="FastAPI 서버 호스트")
@click.option("--server-port", default="8000", help="FastAPI 서버 포트")
@click.option("--server-reload", is_flag=True, default=False, help="서버 자동 리로드 사용")
def main(server_host, server_port, server_reload):
    """
    ingradient 명령어 하나로 FastAPI 서버와 Next.js 빌드된 정적 사이트를 실행합니다.
    """
    from ingradient.server.main import app

    # 1. web/build 폴더 경로 설정
    web_build_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "web", "build")
    if os.path.exists(web_build_dir):
        app.mount("/", StaticFiles(directory=web_build_dir, html=True), name="web")

    # 2. FastAPI 서버 실행
    uvicorn_cmd = [
        "uvicorn",
        "ingradient.server.main:app",
        "--host", server_host,
        "--port", str(server_port)
    ]
    if server_reload:
        uvicorn_cmd.append("--reload")

    click.echo(f"FastAPI 서버와 Next.js 정적 사이트를 실행합니다. (URL: http://{server_host}:{server_port})")
    subprocess.run(uvicorn_cmd)

if __name__ == "__main__":
    main()
