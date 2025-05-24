#!/usr/bin/env python3
import argparse
import json
import os
import importlib.util
import sys

def load_manifest(plugin_dir):
    manifest_path = os.path.join(plugin_dir, "manifest.json")
    try:
        with open(manifest_path, "r") as f:
            manifest = json.load(f)
    except Exception as e:
        print(json.dumps({"error": f"Failed to read manifest: {e}"}))
        sys.exit(1)
    return manifest

def load_plugin(plugin_dir, entry_point):
    plugin_path = os.path.join(plugin_dir, entry_point)
    spec = importlib.util.spec_from_file_location("plugin_module", plugin_path)
    module = importlib.util.module_from_spec(spec)
    try:
        spec.loader.exec_module(module)
    except Exception as e:
        print(json.dumps({"error": f"Failed to load plugin: {e}"}))
        sys.exit(1)
    return module

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--plugin", required=True, help="플러그인 이름 (예: plugin_hello)")
    parser.add_argument("--input", required=False, default="", help="입력 데이터")
    args = parser.parse_args()

    # go_server/cmd/main.go에서 호출 시,
    # 현재 plugin_executor.py의 위치는 go_server 폴더 안에 있다고 가정합니다.
    # 플러그인 폴더는 프로젝트 루트의 "plugins" 폴더에 있으므로,
    # 현재 파일 위치 (예: go_server/plugin_executor.py)에서 부모 디렉토리를 거쳐 plugins 폴더에 접근합니다.
    basePath = os.path.dirname(os.path.abspath(__file__))
    plugin_dir = os.path.join(basePath, "..", "plugins", args.plugin)
    if not os.path.isdir(plugin_dir):
        print(json.dumps({"error": f"Plugin directory not found: {args.plugin}"}))
        sys.exit(1)

    manifest = load_manifest(plugin_dir)
    # entry_point (기본값: plugin.py)와 function (예: predict) 값은 manifest.json에 정의되어 있어야 함.
    entry_point = manifest.get("entry_point", "plugin.py")
    functionName = manifest.get("function")
    if functionName is None or functionName == "":
        print(json.dumps({"error": "No function defined in manifest"}))
        sys.exit(1)
    module = load_plugin(plugin_dir, entry_point)
    if not hasattr(module, functionName):
        print(json.dumps({"error": f"Function '{functionName}' not found in plugin"}))
        sys.exit(1)
    
    func = getattr(module, functionName)
    try:
        result = func(args.input)
    except Exception as e:
        print(json.dumps({"error": f"Error executing plugin function: {e}"}))
        sys.exit(1)
    print(json.dumps({"result": result}))

if __name__ == "__main__":
    main()
