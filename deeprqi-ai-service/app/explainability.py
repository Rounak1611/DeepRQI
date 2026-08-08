"""
EigenCAM for YOLO26.

Why EigenCAM and not classic Grad-CAM: classic Grad-CAM needs gradients tied to
a specific class score, which doesn't wire up cleanly on anchor-free,
NMS-free detector heads like YOLO26's. EigenCAM sidesteps this entirely -- it's
gradient-free. It hooks the activations of the last convolutional feature map
before the detection head, takes the principal component (via SVD) across
channels, and uses that as the saliency map. No class-target wiring needed,
which is exactly why it's the standard practical choice for YOLO explainability.

Trade-off, stated plainly: EigenCAM is class-agnostic -- it shows "where the
network was looking overall" across the whole feature map, not "why it called
this specific detection a pothole." That's an accepted limitation of the
technique, not a bug in this implementation.
"""
import cv2
import numpy as np
import torch


def get_target_layer(yolo_model):
    """
    Grabs the layer immediately before the Detect head in the underlying
    nn.Sequential (`model.model.model`). This is the standard target layer
    convention used across YOLOv8/11/26 CAM implementations -- the last
    feature-rich conv block before detection-specific processing.
    """
    modules = yolo_model.model.model
    return modules[-2]


class EigenCAM:
    def __init__(self, yolo_model, target_layer=None, img_size: int = 640):
        self.yolo_model = yolo_model
        self.raw_model = yolo_model.model  # underlying nn.Module
        self.img_size = img_size
        self._activations = None

        layer = target_layer or get_target_layer(yolo_model)
        layer.register_forward_hook(self._hook)

    def _hook(self, module, input, output):
        # Some YOLO layers output a list/tuple (multi-scale); grab the last one.
        if isinstance(output, (list, tuple)):
            output = output[-1]
        self._activations = output.detach()

    def _preprocess(self, img_bgr: np.ndarray) -> torch.Tensor:
        img_resized = cv2.resize(img_bgr, (self.img_size, self.img_size))
        img_rgb = cv2.cvtColor(img_resized, cv2.COLOR_BGR2RGB)
        img_norm = img_rgb.astype(np.float32) / 255.0
        tensor = torch.from_numpy(img_norm).permute(2, 0, 1).unsqueeze(0)  # 1,C,H,W
        device = next(self.raw_model.parameters()).device
        return tensor.to(device)

    def generate(self, img_bgr: np.ndarray) -> np.ndarray:
        """
        Returns a heatmap (uint8, BGR, same size as the input image) ready to
        be blended or saved directly.
        """
        tensor = self._preprocess(img_bgr)

        with torch.no_grad():
            self.raw_model.eval()
            self.raw_model(tensor)

        if self._activations is None:
            raise RuntimeError(
                "EigenCAM hook never fired -- target layer may be wrong for this model version."
            )

        activations = self._activations[0].cpu().numpy()  # C, H, W
        c, h, w = activations.shape
        reshaped = activations.reshape(c, -1)
        reshaped = reshaped - reshaped.mean(axis=0, keepdims=True)

        # SVD across the flattened spatial dimension; first right-singular
        # vector is the dominant activation pattern -- this IS EigenCAM.
        _, _, vt = np.linalg.svd(reshaped, full_matrices=False)
        cam = vt[0].reshape(h, w)

        cam = np.maximum(cam, 0)
        cam = cam - cam.min()
        cam = cam / (cam.max() + 1e-8)

        cam_resized = cv2.resize(cam, (img_bgr.shape[1], img_bgr.shape[0]))
        heatmap = cv2.applyColorMap((cam_resized * 255).astype(np.uint8), cv2.COLORMAP_JET)
        overlay = cv2.addWeighted(img_bgr, 0.6, heatmap, 0.4, 0)
        return overlay
