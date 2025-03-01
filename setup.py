from setuptools import setup, find_packages

setup(
    name="ingradient",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "fastapi",
        "uvicorn"
    ],
    entry_points={
        "console_scripts": [
            "ingradient = ingradient.cli:main",
        ],
    },
    include_package_data=True,  # 추가
    package_data={
        "ingradient": ["web/**/*"],  # 웹앱 폴더 포함
    },
)
