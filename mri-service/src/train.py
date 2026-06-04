import os
import tensorflow as tf
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras import layers, Model
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import numpy as np
import matplotlib.pyplot as plt

np.random.seed(42)
tf.random.set_seed(42)

CLASSES = ['Mild Impairment', 'Moderate Impairment', 'No Impairment', 'Very Mild Impairment']
IMG_SIZE = 128
BATCH_SIZE = 32

def get_generators(data_dir):
    train_datagen = ImageDataGenerator(
        rotation_range=20,
        zoom_range=0.15,
        horizontal_flip=True,
        brightness_range=[0.85, 1.15],
        width_shift_range=0.10,
        height_shift_range=0.10,
        shear_range=0.10,
        fill_mode='nearest'
        # NO rescale — EfficientNetB0 normalizes internally
    )
    test_datagen = ImageDataGenerator()

    train_gen = train_datagen.flow_from_directory(
        f'{data_dir}/train',
        target_size=(IMG_SIZE, IMG_SIZE),
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        classes=CLASSES,
        shuffle=True
    )
    test_gen = test_datagen.flow_from_directory(
        f'{data_dir}/test',
        target_size=(IMG_SIZE, IMG_SIZE),
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        classes=CLASSES,
        shuffle=False
    )
    return train_gen, test_gen

class BestModelSaver(tf.keras.callbacks.Callback):
    def __init__(self, filepath):
        super().__init__()
        self.filepath = filepath
        self.best = -1

    def on_epoch_end(self, epoch, logs=None):
        current = logs.get('val_accuracy', 0)
        if current > self.best:
            self.best = current
            self.model.save(self.filepath)
            print(f'\nEpoch {epoch+1}: val_accuracy improved to {current:.5f} — model saved')

def build_model():
    base = EfficientNetB0(
        weights='imagenet',
        include_top=False,
        input_shape=(IMG_SIZE, IMG_SIZE, 3)
    )
    base.trainable = False

    x = base.output
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.BatchNormalization()(x)

    x = layers.Dense(512, activation='relu',
                     kernel_regularizer=tf.keras.regularizers.l2(0.001))(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.5)(x)

    x = layers.Dense(256, activation='relu',
                     kernel_regularizer=tf.keras.regularizers.l2(0.001))(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.3)(x)

    output = layers.Dense(4, activation='softmax')(x)
    model = Model(inputs=base.input, outputs=output)
    return model, base

def save_curves(history, filename='training_curves.png'):
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))
    ax1.plot(history.history['accuracy'], label='Train')
    ax1.plot(history.history['val_accuracy'], label='Val')
    ax1.set_title('Accuracy')
    ax1.legend()
    ax2.plot(history.history['loss'], label='Train')
    ax2.plot(history.history['val_loss'], label='Val')
    ax2.set_title('Loss')
    ax2.legend()
    plt.tight_layout()
    plt.savefig(filename)
    print(f"Curves saved to {filename}")

def train(data_dir, epochs_phase_a=15, epochs_phase_b=100):
    train_gen, test_gen = get_generators(data_dir)
    model, base = build_model()

    os.makedirs('models', exist_ok=True)

    # ── PHASE A ───────────────────────────────
    print("\n=== PHASE A: Training head only ===")
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    # No class_weight — dataset is perfectly balanced
    model.fit(
        train_gen,
        epochs=epochs_phase_a,
        validation_data=test_gen,
        verbose=1
    )
    print("Phase A done.")

    # ── PHASE B ───────────────────────────────
    print("\n=== PHASE B: Fine-tuning ===")
    base.trainable = True
    for layer in base.layers:
        if isinstance(layer, tf.keras.layers.BatchNormalization):
            layer.trainable = False

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=5e-5),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )

    callbacks = [
        EarlyStopping(
            monitor='val_accuracy',
            patience=20,
            restore_best_weights=True,
            verbose=1
        ),
        ReduceLROnPlateau(
            monitor='val_accuracy',
            factor=0.5,
            patience=8,
            min_lr=1e-7,
            verbose=1
        ),
        BestModelSaver('models/efficientnetb0_best.keras')
    ]

    # No class_weight — dataset is perfectly balanced
    history = model.fit(
        train_gen,
        epochs=epochs_phase_b,
        validation_data=test_gen,
        callbacks=callbacks,
        verbose=1
    )

    model.save('models/efficientnetb0_alzheimer.keras')
    print("\nModels saved.")
    save_curves(history)
    return model, history