# Run Quick

## Enviroment

use uv:

```bash
uv venv --python 3.12
source .venv/Scripts/activate
uv init
```

```bash
uv add -r requirments.txt
```

## Bash

```bash
python -m uvicorn src.rag_server.main:app --host 127.0.0.1 --port 8000 --reload
```
