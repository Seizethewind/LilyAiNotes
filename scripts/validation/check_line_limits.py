"""Validate that every non-Markdown source and config file stays within 200 lines."""

from pathlib import Path
import sys

IGNORED_DIRS = {
    ".git",
    "node_modules",
    ".venv",
    "venv",
    "__pycache__",
    ".pytest_cache",
    ".mypy_cache",
    ".ruff_cache",
    "build",
    "dist",
    ".wrangler",
    ".cache",
}
EXEMPT_EXTENSIONS = {".md", ".png", ".jpg", ".jpeg", ".webp", ".svg", ".ico"}
EXEMPT_FILES = {"LICENSE", "package-lock.json"}
MAX_LINES = 200


def check_line_limits(root: Path = Path(".")) -> int:
    violations: list[tuple[str, int]] = []
    for path in sorted(root.rglob("*")):
        if not path.is_file():
            continue
        if any(part in IGNORED_DIRS for part in path.parts):
            continue
        if path.suffix.lower() in EXEMPT_EXTENSIONS or path.name in EXEMPT_FILES:
            continue
        line_count = len(path.read_text(encoding="utf-8", errors="ignore").splitlines())
        if line_count > MAX_LINES:
            violations.append((str(path), line_count))
    for file_path, count in violations:
        print(f"LINE LIMIT EXCEEDED ({count} > {MAX_LINES}): {file_path}")
    return 1 if violations else 0


if __name__ == "__main__":
    sys.exit(check_line_limits())
