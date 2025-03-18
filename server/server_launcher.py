import uvicorn
import argparse

def main():
    parser = argparse.ArgumentParser(description="Launch Ingradient FastAPI Server")
    parser.add_argument("--host", type=str, default="0.0.0.0", help="Server host address")
    parser.add_argument("--port", type=int, default=8000, help="Server port")
    parser.add_argument("--reload", action="store_true", help="Enable auto-reload (development mode)")
    args = parser.parse_args()
    
    uvicorn.run("server.main:app", host=args.host, port=args.port, reload=args.reload)

if __name__ == "__main__":
    main()
