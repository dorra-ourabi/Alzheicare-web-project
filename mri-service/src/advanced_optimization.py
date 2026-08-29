

import os
import tensorflow as tf
from tensorflow.keras.applications import EfficientNetB3
from tensorflow.keras import layers, Model
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint, TensorBoard
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import numpy as np
from sklearn.utils.class_weight import compute_class_weight
from datetime import datetime


def build_model_optimized(dropout_rate=0.5):
    
    base = EfficientNetB3(
        weights='imagenet',
        include_top=False,
        input_shape=(128, 128, 3)
    )
    base.trainable = False

    x = base.output
    x = layers.GlobalAveragePooling2D()(x)

    # First dense block
    x = layers.Dense(512, activation='relu')(x)
    x = layers.BatchNormalization(momentum=0.99)(x)  # ← GPU-optimized momentum
    x = layers.Dropout(dropout_rate)(x)

    # Second dense block
    x = layers.Dense(256, activation='relu')(x)
    x = layers.BatchNormalization(momentum=0.99)(x)
    x = layers.Dropout(dropout_rate * 0.6)(x)

    # Output
    output = layers.Dense(4, activation='softmax')(x)

    model = Model(inputs=base.input, outputs=output)
    return model, base

def progressive_unfreezing_strategy(base, num_stages=3):
    """
    Gradually unfreeze base model layers for more stable training.
    
    Instead of unfreezing last 60 layers at once,
    gradually unfreeze in stages.
    """
    total_layers = len(base.layers)
    layers_per_stage = total_layers // num_stages
    
    strategies = []
    for stage in range(num_stages):
        unfreeze_from = total_layers - (stage + 1) * layers_per_stage
        strategies.append({
            'stage': stage + 1,
            'unfreeze_from': unfreeze_from,
            'num_layers': (stage + 1) * layers_per_stage,
            'learning_rate': 5e-5 / (10 ** stage)  # Decrease LR each stage
        })
    
    print("\nProgressive Unfreezing Strategy:")
    for s in strategies:
        print(f"  Stage {s['stage']}: Unfreeze last {s['num_layers']} layers (LR: {s['learning_rate']:.0e})")
    
    return strategies


def get_advanced_generators(data_dir):
    """
    Enhanced data generators with medical imaging best practices.
    """
    
    train_datagen = ImageDataGenerator(
        rotation_range=20,
        zoom_range=0.15,
        horizontal_flip=True,
        brightness_range=[0.85, 1.15],
        width_shift_range=0.1,
        height_shift_range=0.1,
        fill_mode='nearest',
        shear_range=0.1, 
        vertical_flip=True 
    )

    test_datagen = ImageDataGenerator()

    train_gen = train_datagen.flow_from_directory(
        f'{data_dir}/train',
        target_size=(128, 128),
        batch_size=32, 
        class_mode='categorical',
        shuffle=True
    )

    test_gen = test_datagen.flow_from_directory(
        f'{data_dir}/test',
        target_size=(128, 128),
        batch_size=32,
        class_mode='categorical',
        shuffle=False
    )

    return train_gen, test_gen


def train_with_validation_early_stopping(model, train_gen, test_gen, 
                                        epochs=80, class_weights=None):
    
    best_val_acc = 0
    patience_counter = 0
    patience = 20  # More patient with GPU
    
    for epoch in range(epochs):
        print(f"\nEpoch {epoch + 1}/{epochs}")
        
       
        history = model.fit(
            train_gen,
            epochs=1,
            verbose=1,
            class_weight=class_weights
        )
        
        
        val_results = model.evaluate(test_gen, verbose=0)
        val_loss, val_acc = val_results
        
        
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            patience_counter = 0
            model.save('models/efficientnetb3_best.keras')
            print(f"✓ New best: {val_acc:.4f}")
        else:
            patience_counter += 1
            if patience_counter >= patience:
                print(f"\nEarly stopping after {epoch + 1} epochs")
                break


def create_lr_schedule(initial_lr=5e-4, warmup_epochs=3, total_epochs=15):
    
    def lr_schedule(epoch):
        if epoch < warmup_epochs:
            # Linear warmup
            return initial_lr * (epoch + 1) / warmup_epochs
        else:
            # Exponential decay
            return initial_lr * 0.95 ** (epoch - warmup_epochs)
    
    return tf.keras.callbacks.LearningRateScheduler(lr_schedule)

def validate_training(model, test_gen):
    
    print("\n" + "="*70)
    print("VALIDATION RESULTS")
    print("="*70)
    
   
    results = model.evaluate(test_gen, verbose=0)
    print(f"Test Loss: {results[0]:.4f}")
    print(f"Test Accuracy: {results[1]:.4f}")
    
    
    print("\nPer-class predictions:")
    predictions = model.predict(test_gen)
    pred_classes = np.argmax(predictions, axis=1)
    
    classes = test_gen.class_indices
    class_names = {v: k for k, v in classes.items()}
    
    for class_idx in range(len(classes)):
        mask = test_gen.classes == class_idx
        class_acc = (pred_classes[mask] == class_idx).mean()
        class_name = class_names[class_idx]
        num_samples = mask.sum()
        print(f"  {class_name}: {class_acc:.4f} ({num_samples} samples)")



if __name__ == "__main__":
    print("Advanced optimization strategies available. See comments for usage.")
    print("\nKey improvements demonstrated:")
    print("  1. Progressive unfreezing")
    print("  2. Better data augmentation")
    print("  3. Learning rate scheduling")
    print("  4. Improved early stopping")
