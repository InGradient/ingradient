import setuptools

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setuptools.setup(
    name="ingradient_sdk",
    version="0.1.0",
    author="JUNE LEE",
    author_email="june@ingradient.ai",
    description="Ingradient - A labeling and dataset management tool",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/junhoning/ingradient",
    packages=setuptools.find_packages(),
    include_package_data=True,  # MANIFEST.in에 정의된 파일 포함
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    python_requires=">=3.7",
    install_requires=[
        "fastapi",
        "uvicorn",
        "requests",
        "pydantic",
        "click"
    ],
    entry_points={
        "console_scripts": [
            "ingradient = ingradient.cli:main",
        ],
    },
)
