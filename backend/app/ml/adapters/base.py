"""
Common interface every depth/height model adapter must implement, so the
processing pipeline can swap models without changing any calling code.
"""
from abc import ABC, abstractmethod

import numpy as np


class DepthAdapter(ABC):
    name: str = "base"

    @abstractmethod
    def is_available(self) -> bool:
        """Return False if weights/dependencies are missing - triggers demo mode."""
        raise NotImplementedError

    @abstractmethod
    def predict(self, image_bgr: np.ndarray) -> np.ndarray:
        """Return a relative depth map, same H x W as the input, float32.
        Higher value = higher elevation (adapters normalize to this convention)."""
        raise NotImplementedError
