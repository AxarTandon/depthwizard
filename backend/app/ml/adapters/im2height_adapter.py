"""
Adapter for https://github.com/dettmar/im2height - a fully-convolutional
network purpose-built for single-image height estimation from remote sensing
imagery (unlike MiDaS, which is trained on ground-level/egocentric photos).

IMPORTANT — integration note:
This adapter could not be wired against the real im2height weights/checkpoint
format in this environment (no network access to clone the repo and inspect
its actual architecture/state-dict layout). The class below defines the
correct SHAPE of the integration (same `predict()` contract as every other
adapter) and a placeholder network you should replace with the real
im2height architecture once you've cloned the repo and confirmed:
  1. its input preprocessing (resize/normalize convention),
  2. its exact layer definitions (so a state_dict loads cleanly),
  3. whether its output is already metric or still relative.

`is_available()` returns False until IM2HEIGHT_WEIGHTS_PATH points at a real
checkpoint, so the pipeline safely falls back to the MiDaS adapter or demo
mode instead of silently returning wrong numbers.
"""
import os

import numpy as np
import cv2

from app.ml.adapters.base import DepthAdapter


class Im2HeightAdapter(DepthAdapter):
    name = "im2height"
    _model = None
    _device = None

    def __init__(self, weights_path: str):
        self.weights_path = weights_path

    def is_available(self) -> bool:
        return bool(self.weights_path) and os.path.exists(self.weights_path)

    def _load(self):
        if self._model is not None:
            return
        import torch
        import torch.nn as nn

        # PLACEHOLDER architecture - replace with the real im2height network
        # (see module docstring) before relying on this for real inference.
        class _PlaceholderFCN(nn.Module):
            def __init__(self):
                super().__init__()
                self.net = nn.Sequential(
                    nn.Conv2d(3, 32, 3, padding=1), nn.ReLU(),
                    nn.Conv2d(32, 32, 3, padding=1), nn.ReLU(),
                    nn.Conv2d(32, 1, 3, padding=1),
                )

            def forward(self, x):
                return self.net(x)

        self._device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self._model = _PlaceholderFCN().to(self._device)
        state = torch.load(self.weights_path, map_location=self._device, weights_only=True)
        self._model.load_state_dict(state)
        self._model.eval()

    def predict(self, image_bgr: np.ndarray) -> np.ndarray:
        import torch
        self._load()
        img_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0
        tensor = torch.from_numpy(img_rgb.transpose(2, 0, 1)).unsqueeze(0).to(self._device)
        with torch.no_grad():
            out = self._model(tensor).squeeze().cpu().numpy()
        return out.astype(np.float32)
