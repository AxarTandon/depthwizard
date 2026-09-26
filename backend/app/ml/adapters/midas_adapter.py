"""
Intel MiDaS (free, MIT license) - loaded via torch.hub. Used as the secondary/
fallback adapter: no GPU required, well-documented, easy to debug.
"""
import numpy as np
import cv2

from app.ml.adapters.base import DepthAdapter


class MiDaSAdapter(DepthAdapter):
    name = "midas"
    _model = None
    _transform = None
    _device = None

    def __init__(self, model_type: str = "DPT_Hybrid"):
        self.model_type = model_type

    def is_available(self) -> bool:
        try:
            import torch  # noqa: F401
            return True
        except ImportError:
            return False

    def _load(self):
        if self._model is not None:
            return
        import torch
        self._device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self._model = torch.hub.load("intel-isl/MiDaS", self.model_type)
        self._model.to(self._device).eval()
        transforms = torch.hub.load("intel-isl/MiDaS", "transforms")
        self._transform = transforms.dpt_transform if "DPT" in self.model_type else transforms.small_transform

    def predict(self, image_bgr: np.ndarray) -> np.ndarray:
        if not self.is_available():
            from app.ml.adapters.fallback_adapter import FallbackDepthAdapter
            return FallbackDepthAdapter().predict(image_bgr)
        self._load()
        img_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
        input_batch = self._transform(img_rgb).to(self._device)
        with torch.no_grad():
            prediction = self._model(input_batch)
            prediction = torch.nn.functional.interpolate(
                prediction.unsqueeze(1), size=img_rgb.shape[:2],
                mode="bicubic", align_corners=False,
            ).squeeze()
        return prediction.cpu().numpy().astype(np.float32)
