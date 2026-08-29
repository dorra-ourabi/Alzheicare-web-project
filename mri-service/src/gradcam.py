import numpy as np
import cv2
import base64
import tensorflow as tf
from PIL import Image
import io

def get_last_conv_layer_name(model):
    """
    Finds the name of the last convolutional layer in EfficientNetB3.
    We need this layer for Grad-CAM.
    """
    for layer in reversed(model.layers):
        if isinstance(layer, tf.keras.layers.Conv2D):
            print(f"Last conv layer found: {layer.name}")
            return layer.name
    raise ValueError("No Conv2D layer found in model")

def make_gradcam_heatmap(img_array, model, last_conv_layer_name):
    """
    Computes the Grad-CAM heatmap.
    
    How it works:
    1. Run image through model, capture both the last conv layer output AND the final prediction
    2. Compute gradients: how much does each conv feature map affect the winning class?
    3. Average the gradients → importance weight per feature map
    4. Multiply feature maps by their weights and sum → heatmap
    5. Apply ReLU (only keep positive activations)
    """
    grad_model = tf.keras.Model(
        inputs=model.input,
        outputs=[
            model.get_layer(last_conv_layer_name).output,  # feature maps
            model.output                                     # final predictions
        ]
    )

    with tf.GradientTape() as tape:
        conv_outputs, predictions = grad_model(img_array)
        pred_index = tf.argmax(predictions[0])           # winning class
        class_channel = predictions[:, pred_index]       # score for winning class

    # How much does each feature map pixel affect the prediction?
    grads = tape.gradient(class_channel, conv_outputs)

    # Average across spatial dimensions → one importance value per feature map
    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))

    # Weight each feature map by its importance
    conv_outputs = conv_outputs[0]
    heatmap = conv_outputs @ pooled_grads[..., tf.newaxis]
    heatmap = tf.squeeze(heatmap)

    # Normalize to [0, 1] and keep only positive values
    heatmap = tf.maximum(heatmap, 0)
    heatmap = heatmap / (tf.math.reduce_max(heatmap) + 1e-8)

    return heatmap.numpy(), int(pred_index)

def overlay_gradcam_on_image(original_img_bytes, heatmap, alpha=0.4):
    """
    Overlays the colorized heatmap on the original MRI image.
    Returns the result encoded as base64 string (for JSON response).
    
    alpha controls heatmap opacity: 0.0 = invisible, 1.0 = no original image
    """
    # Load original image
    img = Image.open(io.BytesIO(original_img_bytes)).convert('RGB')
    img_np = np.array(img.resize((128, 128)))
    img_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)

    # Resize heatmap to match image size
    heatmap_resized = cv2.resize(heatmap, (128, 128))

    # Apply JET colormap (blue=low activation, red=high activation)
    heatmap_colored = cv2.applyColorMap(
        np.uint8(255 * heatmap_resized),
        cv2.COLORMAP_JET
    )

    # Blend original image with colored heatmap
    superimposed = cv2.addWeighted(img_bgr, 1 - alpha, heatmap_colored, alpha, 0)

    # Encode result to base64 for JSON
    _, buffer = cv2.imencode('.jpg', superimposed)
    b64_string = base64.b64encode(buffer).decode('utf-8')
    return b64_string