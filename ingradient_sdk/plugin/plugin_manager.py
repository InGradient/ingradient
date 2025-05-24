# ingradient_sdk/plugin_manager.py
import os
import importlib.util
from typing import List
from ingradient_sdk.plugin.base_plugin import BasePlugin

def load_plugins(plugins_folder: str) -> List[BasePlugin]:
    """plugins 폴더를 뒤져서 __init__.py를 가진 모든 플러그인을 로딩"""
    plugins = []

    if not os.path.isdir(plugins_folder):
        print(f"[WARN] '{plugins_folder}' is not a valid directory.")
        return plugins

    for item in os.listdir(plugins_folder):
        plugin_dir = os.path.join(plugins_folder, item)
        init_file = os.path.join(plugin_dir, "__init__.py")
        if os.path.isdir(plugin_dir) and os.path.isfile(init_file):
            # 플러그인 모듈 로딩
            spec = importlib.util.spec_from_file_location(item, init_file)
            module = importlib.util.module_from_spec(spec)
            if spec.loader:
                spec.loader.exec_module(module)

                # 플러그인 모듈에 register_plugin() 함수가 있다고 가정
                if hasattr(module, "register_plugin"):
                    plugin_instance = module.register_plugin()
                    if isinstance(plugin_instance, BasePlugin):
                        plugins.append(plugin_instance)
                    else:
                        print(f"[WARN] {item} is not a valid plugin instance.")
                else:
                    print(f"[WARN] {item} has no register_plugin() function.")

    return plugins

def get_plugin_map(plugins_folder: str) -> dict:
    """
    { "PluginName": plugin_instance } 형태의 딕셔너리를 반환.
    """
    loaded = load_plugins(plugins_folder)
    return { p.name: p for p in loaded }
