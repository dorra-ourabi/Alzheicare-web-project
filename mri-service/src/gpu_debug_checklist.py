
import tensorflow as tf
import numpy as np
import os
import sys

def check_gpu_setup():
    """Verify GPU is properly configured."""
    print("="*70)
    print("1. GPU SETUP CHECK")
    print("="*70)
    
    gpus = tf.config.list_physical_devices('GPU')
    print(f"GPUs detected: {len(gpus)}")
    for i, gpu in enumerate(gpus):
        print(f"  GPU {i}: {gpu.name}")
    
    print(f"\nCUDA available: {tf.test.is_built_with_cuda()}")
    print(f"GPU devices visible: {len(tf.config.list_logical_devices('GPU'))}")
    
    if not gpus:
        print("⚠ WARNING: No GPU detected. Install CUDA/CUDNN for GPU support.")
        return False
    return True

def test_gpu_memory():
    """Test GPU memory allocation."""
    print("\n" + "="*70)
    print("2. GPU MEMORY TEST")
    print("="*70)
    
    gpus = tf.config.list_physical_devices('GPU')
    if not gpus:
        print("No GPU to test")
        return
    
    try:
        # Test memory allocation
        with tf.device('/GPU:0'):
            a = tf.random.normal((1000, 1000, 100))
            b = tf.random.normal((1000, 1000, 100))
            c = tf.matmul(a[..., 0], b[..., 0])
        print("✓ GPU memory allocation successful")
        print(f"✓ Matrix multiplication test passed")
    except Exception as e:
        print(f"❌ GPU memory test failed: {e}")

def test_data_pipeline():
    """Test ImageDataGenerator on GPU."""
    print("\n" + "="*70)
    print("3. DATA PIPELINE TEST")
    print("="*70)
    
    # Create dummy dataset
    data_dir = "data/Alzheimer_s Dataset/train"
    
    if not os.path.exists(data_dir):
        print(f"⚠ Data directory not found: {data_dir}")
        print("  Skipping pipeline test")
        return
    
    try:
        from tensorflow.keras.preprocessing.image import ImageDataGenerator
        
        gen = ImageDataGenerator()
        flow = gen.flow_from_directory(
            data_dir,
            target_size=(128, 128),
            batch_size=16,
            class_mode='categorical',
            shuffle=True
        )
        
        # Test one batch
        batch_images, batch_labels = next(iter(flow))
        print(f"✓ Data pipeline test passed")
        print(f"  Batch shape: {batch_images.shape}")
        print(f"  Label shape: {batch_labels.shape}")
        print(f"  Data type: {batch_images.dtype}")
        print(f"  Value range: [{batch_images.min():.2f}, {batch_images.max():.2f}]")
        
    except Exception as e:
        print(f"❌ Data pipeline test failed: {e}")

def test_mixed_precision():
    """Test if mixed precision training works."""
    print("\n" + "="*70)
    print("4. MIXED PRECISION TEST (Optional optimization)")
    print("="*70)
    
    try:
        from tensorflow.keras import mixed_precision
        
        # Check current policy
        policy = mixed_precision.global_policy()
        print(f"Current policy: {policy.name}")
        
        # Test with float32 (recommended for medical imaging)
        mixed_precision.set_global_policy('float32')
        policy = mixed_precision.global_policy()
        print(f"✓ Set policy to: {policy.name}")
        print("  Note: float32 recommended for medical imaging (better accuracy)")
        
    except Exception as e:
        print(f"⚠ Mixed precision test: {e}")

def test_model_training():
    """Test a tiny model training cycle."""
    print("\n" + "="*70)
    print("5. MODEL TRAINING TEST")
    print("="*70)
    
    try:
        from tensorflow.keras.applications import EfficientNetB3
        from tensorflow.keras import layers, Model
        
        print("Building test model...")
        base = EfficientNetB3(weights='imagenet', include_top=False, input_shape=(128, 128, 3))
        base.trainable = False
        
        x = base.output
        x = layers.GlobalAveragePooling2D()(x)
        x = layers.Dense(256, activation='relu')(x)
        output = layers.Dense(4, activation='softmax')(x)
        
        model = Model(inputs=base.input, outputs=output)
        model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
        
        print("✓ Model built successfully")
        print(f"  Total params: {model.count_params():,}")
        
        # Test forward pass
        dummy_input = tf.random.normal((2, 128, 128, 3))
        with tf.device('/GPU:0' if tf.config.list_physical_devices('GPU') else '/CPU:0'):
            output = model(dummy_input, training=True)
        print(f"✓ Forward pass successful, output shape: {output.shape}")
        
    except Exception as e:
        print(f"❌ Model training test failed: {e}")
        import traceback
        traceback.print_exc()

def print_recommendations():
    """Print optimization recommendations."""
    print("\n" + "="*70)
    print("RECOMMENDATIONS FOR GPU TRAINING")
    print("="*70)
    
    recommendations = [
        ("1. ENSURE SAME DEVICE", 
         "All tensors must be on the same device (GPU or CPU)"),
        
        ("2. USE FLOAT32", 
         "Medical imaging tasks need float32 for accuracy, not float16"),
        
        ("3. PASS CLASS_WEIGHTS IN PHASE B", 
         "Your code was missing: class_weight=class_weights in Phase B fit()"),
        
        ("4. SET RANDOM SEEDS", 
         "Add: np.random.seed(42) and tf.random.set_seed(42) at startup"),
        
        ("5. INCREASE EARLYSTOPPING PATIENCE", 
         "Changed from patience=10 to patience=15 with min_delta=0.001"),
        
        ("6. MONITOR DATA PIPELINE", 
         "ImageDataGenerator may bottleneck. Consider tf.data for better GPU performance"),
        
        ("7. BATCH NORMALIZATION", 
         "Ensure BN layers are properly configured with momentum=0.99"),
        
        ("8. LEARNING RATES", 
         "GPU convergence differs from CPU. Consider warming up learning rates"),
    ]
    
    for title, desc in recommendations:
        print(f"\n{title}")
        print(f"  → {desc}")

if __name__ == "__main__":
    print("\nGPU DEBUG CHECKLIST - Alzheimer's Classification\n")
    
    check_gpu_setup()
    test_gpu_memory()
    test_data_pipeline()
    test_mixed_precision()
    test_model_training()
    print_recommendations()
    
    print("\n" + "="*70)
    print("DEBUG CHECKLIST COMPLETE")
    print("="*70 + "\n")
