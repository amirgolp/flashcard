import logging
import sys
from typing import Optional


class AppLogger:
    _instance: Optional[logging.Logger] = None

    @classmethod
    def get_logger(cls) -> logging.Logger:
        if cls._instance is None:
            logger = logging.getLogger("app")
            logger.setLevel(logging.DEBUG)

            handler = logging.StreamHandler(sys.stdout)
            handler.setLevel(logging.DEBUG)

            formatter = logging.Formatter(
                "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
            )
            handler.setFormatter(formatter)

            logger.addHandler(handler)

            cls._instance = logger

        return cls._instance


def get_logger() -> logging.Logger:
    return AppLogger.get_logger()
