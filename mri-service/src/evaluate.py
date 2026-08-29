import tensorflow as tf
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import classification_report, confusion_matrix
import os, sys

sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))
from preprocessing import get_generators

CLASSES = ['Mild Impairment', 'Moderate Impairment', 'No Impairment', 'Very Mild Impairment']


def evaluate(model_path=None, data_dir='data'):
    if model_path is None:
        model_path = os.path.join(os.path.dirname(__file__), '..', 'models', 'efficientnetb0_savedmodel')

    
    model = tf.saved_model.load(model_path)
    infer = model.signatures['serving_default']
    print(f"Model loaded from {model_path}")

    
    _, test_gen = get_generators(data_dir)
    test_gen.reset()

    
    all_preds = []
    steps = len(test_gen)
    for i in range(steps):
        batch, _ = test_gen[i]
        batch_tensor = tf.constant(batch, dtype=tf.float32)
        result = infer(batch_tensor)
        probs = list(result.values())[0].numpy()
        all_preds.append(probs)
        if i % 5 == 0:
            print(f"  Step {i+1}/{steps}")

    y_pred_probs = np.concatenate(all_preds, axis=0)
    y_pred = np.argmax(y_pred_probs, axis=1)
    y_true = test_gen.classes

    
    min_len = min(len(y_pred), len(y_true))
    y_pred = y_pred[:min_len]
    y_true = y_true[:min_len]

    
    print("\n── Classification Report ──")
    print(classification_report(y_true, y_pred, target_names=CLASSES))

    
    cm = confusion_matrix(y_true, y_pred)
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt='d',
                xticklabels=CLASSES,
                yticklabels=CLASSES,
                cmap='Blues')
    plt.title('Confusion Matrix — AlzheivCare MRI Classifier')
    plt.ylabel('True Label')
    plt.xlabel('Predicted Label')
    plt.tight_layout()
    plt.savefig('confusion_matrix.png')
    print("Confusion matrix saved to confusion_matrix.png")


if __name__ == '__main__':
    evaluate()