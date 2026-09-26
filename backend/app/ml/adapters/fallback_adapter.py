"""
OpenCV / NumPy zero-dependency relative depth adapter.
Acts as a robust fallback when deep learning backends (PyTorch / GPU)
are not installed in the runtime environment.
Computes relief elevation and topographic depth using multi-scale morphological
filtering, bilateral smoothing, and luminance structure.
"""
import numpy as np
import cv2

from app.ml.adapters.base import DepthAdapter


class FallbackDepthAdapter(DepthAdapter):
    name = "opencv_heuristic"

    def is_available(self) -> bool:
        return True

    def predict(self, image_bgr: np.ndarray) -> np.ndarray:
        gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY).astype(np.float32)
        h, w = gray.shape[:2]

        # Edge-preserving smoothing to retain sharp ridge lines and structural contours
        blurred = cv2.bilateralFilter(gray, 9, 75, 75)

        # Multi-scale top-hat and black-hat morphological transforms for topographical features
        k_size = max(7, min(h, w) // 32)
        if k_size % 2 == 0:
            k_size += 1
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k_size, k_size))
        tophat = cv2.morphologyEx(blurred, cv2.MORPH_TOPHAT, kernel)
        blackhat = cv2.morphologyEx(blurred, cv2.MORPH_BLACKHAT, kernel)

        # Gradient / terrain relief
        sobelx = cv2.Sobel(blurred, cv2.CV_32F, 1, 0, ksize=3)
        sobely = cv2.Sobel(blurred, cv2.CV_32F, 0, 1, ksize=3)
        grad = np.sqrt(sobelx ** 2 + sobely ** 2)
        grad_norm = grad / (np.max(grad) + 1e-6)

        # Synthesize relative elevation: higher luminance/tophat represents higher terrain/structures
        elevation = 0.55 * (blurred / 255.0) + 0.35 * (tophat / 255.0) - 0.15 * (blackhat / 255.0) + 0.05 * grad_norm

        e_min, e_max = float(np.min(elevation)), float(np.max(elevation))
        if e_max > e_min:
            depth = (elevation - e_min) / (e_max - e_min)
        else:
            depth = np.full_like(elevation, 0.5)

        return depth.astype(np.float32)
