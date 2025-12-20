"""
File system utilities for the RAG platform
"""
import os
import shutil
import tempfile
import pathlib
from typing import Optional, List, Dict, Any, Union
from pathlib import Path
import logging
import hashlib
from datetime import datetime

logger = logging.getLogger(__name__)


class FileSystemUtils:
    """File system utility functions"""

    @staticmethod
    def ensure_directory(path: Union[str, Path]) -> Path:
        """Ensure directory exists, create if necessary"""
        path = Path(path)
        path.mkdir(parents=True, exist_ok=True)
        return path

    @staticmethod
    def safe_delete(path: Union[str, Path]) -> bool:
        """Safely delete file or directory"""
        try:
            path = Path(path)
            if path.is_file():
                path.unlink()
            elif path.is_dir():
                shutil.rmtree(path)
            return True
        except Exception as e:
            logger.error(f"Failed to delete {path}: {e}")
            return False

    @staticmethod
    def get_file_info(path: Union[str, Path]) -> Optional[Dict[str, Any]]:
        """Get file information"""
        try:
            path = Path(path)
            if not path.exists():
                return None

            stat = path.stat()
            return {
                "name": path.name,
                "path": str(path),
                "size": stat.st_size,
                "modified": datetime.fromtimestamp(stat.st_mtime),
                "created": datetime.fromtimestamp(stat.st_ctime),
                "is_file": path.is_file(),
                "is_dir": path.is_dir(),
                "extension": path.suffix if path.is_file() else None
            }
        except Exception as e:
            logger.error(f"Failed to get file info for {path}: {e}")
            return None

    @staticmethod
    def list_files(directory: Union[str, Path], pattern: str = "*",
                  recursive: bool = False) -> List[Path]:
        """List files in directory with optional pattern matching"""
        try:
            path = Path(directory)
            if not path.is_dir():
                return []

            if recursive:
                return list(path.rglob(pattern))
            else:
                return list(path.glob(pattern))
        except Exception as e:
            logger.error(f"Failed to list files in {directory}: {e}")
            return []

    @staticmethod
    def calculate_directory_size(directory: Union[str, Path]) -> int:
        """Calculate total size of directory"""
        try:
            path = Path(directory)
            if not path.is_dir():
                return 0

            total_size = 0
            for file_path in path.rglob("*"):
                if file_path.is_file():
                    total_size += file_path.stat().st_size

            return total_size
        except Exception as e:
            logger.error(f"Failed to calculate directory size for {directory}: {e}")
            return 0

    @staticmethod
    def create_temp_file(suffix: str = "", prefix: str = "tmp_",
                        directory: Optional[str] = None) -> Path:
        """Create a temporary file"""
        try:
            fd, path = tempfile.mkstemp(suffix=suffix, prefix=prefix, dir=directory)
            os.close(fd)  # Close the file descriptor
            return Path(path)
        except Exception as e:
            logger.error(f"Failed to create temp file: {e}")
            raise

    @staticmethod
    def create_temp_directory(prefix: str = "tmp_",
                             directory: Optional[str] = None) -> Path:
        """Create a temporary directory"""
        try:
            path = tempfile.mkdtemp(prefix=prefix, dir=directory)
            return Path(path)
        except Exception as e:
            logger.error(f"Failed to create temp directory: {e}")
            raise

    @staticmethod
    def copy_file(src: Union[str, Path], dst: Union[str, Path]) -> bool:
        """Copy file from source to destination"""
        try:
            shutil.copy2(src, dst)
            return True
        except Exception as e:
            logger.error(f"Failed to copy {src} to {dst}: {e}")
            return False

    @staticmethod
    def move_file(src: Union[str, Path], dst: Union[str, Path]) -> bool:
        """Move file from source to destination"""
        try:
            shutil.move(src, dst)
            return True
        except Exception as e:
            logger.error(f"Failed to move {src} to {dst}: {e}")
            return False

    @staticmethod
    def get_file_hash(path: Union[str, Path], algorithm: str = 'sha256') -> Optional[str]:
        """Get hash of file content"""
        try:
            path = Path(path)
            if not path.is_file():
                return None

            hash_obj = hashlib.new(algorithm)
            with open(path, 'rb') as f:
                for chunk in iter(lambda: f.read(4096), b""):
                    hash_obj.update(chunk)

            return hash_obj.hexdigest()
        except Exception as e:
            logger.error(f"Failed to hash file {path}: {e}")
            return None

    @staticmethod
    def is_safe_path(base_path: Union[str, Path], target_path: Union[str, Path]) -> bool:
        """Check if target path is safe (within base path)"""
        try:
            base = Path(base_path).resolve()
            target = Path(target_path).resolve()

            # Check if target is within base directory
            return target.is_relative_to(base)
        except Exception:
            return False


class PathUtils:
    """Path manipulation utilities"""

    @staticmethod
    def normalize_path(path: Union[str, Path]) -> Path:
        """Normalize path"""
        return Path(path).resolve()

    @staticmethod
    def get_relative_path(base: Union[str, Path], target: Union[str, Path]) -> Optional[Path]:
        """Get relative path from base to target"""
        try:
            base_path = Path(base).resolve()
            target_path = Path(target).resolve()
            return target_path.relative_to(base_path)
        except Exception:
            return None

    @staticmethod
    def join_paths(*paths: Union[str, Path]) -> Path:
        """Join multiple paths"""
        return Path(*paths)

    @staticmethod
    def get_file_extension(path: Union[str, Path]) -> str:
        """Get file extension"""
        return Path(path).suffix.lower()

    @staticmethod
    def change_extension(path: Union[str, Path], new_extension: str) -> Path:
        """Change file extension"""
        path = Path(path)
        return path.with_suffix(new_extension if new_extension.startswith('.') else f'.{new_extension}')


# Convenience functions
def ensure_dir(path: Union[str, Path]) -> Path:
    """Ensure directory exists"""
    return FileSystemUtils.ensure_directory(path)


def safe_remove(path: Union[str, Path]) -> bool:
    """Safely remove file or directory"""
    return FileSystemUtils.safe_delete(path)


def list_files(directory: Union[str, Path], pattern: str = "*") -> List[Path]:
    """List files in directory"""
    return FileSystemUtils.list_files(directory, pattern)
