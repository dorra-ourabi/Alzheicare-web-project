import os
import numpy as np
from PIL import Image
from tensorflow.keras.preprocessing.image import ImageDataGenerator, img_to_array, array_to_img


MODERATE_DIR = 'C:/Users/nerim/OneDrive/Bureau/GL3/ML model PPP/data/Alzheimer_s Dataset/train/ModerateDemented'
TARGET_COUNT = 400   
IMG_SIZE = 128


augmentor = ImageDataGenerator(
    rotation_range=25,
    zoom_range=0.20,
    horizontal_flip=True,
    brightness_range=[0.80, 1.20],
    width_shift_range=0.10,
    height_shift_range=0.10,
    fill_mode='nearest'
)

def augment_minority_class(folder, target_count):
    existing = [f for f in os.listdir(folder) if f.endswith('.jpg')]
    current_count = len(existing)
    print(f"Found {current_count} images. Generating until {target_count}...")

    generated = 0
    i = 0
    while current_count + generated < target_count:
       
        img_path = os.path.join(folder, existing[i % current_count])
        img = Image.open(img_path).convert('RGB').resize((IMG_SIZE, IMG_SIZE))
        arr = img_to_array(img)
        arr = arr.reshape((1,) + arr.shape)  
        
    
        for batch in augmentor.flow(arr, batch_size=1):
            aug_img = array_to_img(batch[0])
            save_path = os.path.join(folder, f'aug_{generated:04d}.jpg')
            aug_img.save(save_path)
            generated += 1
            break  

        i += 1

    print(f"Done. ModerateDemented now has {current_count + generated} images.")

if __name__ == '__main__':
    augment_minority_class(MODERATE_DIR, TARGET_COUNT)