from tensorflow.keras.preprocessing.image import ImageDataGenerator

IMG_SIZE = 128
BATCH_SIZE = 32
CLASSES = ['Mild Impairment', 'Moderate Impairment', 'No Impairment', 'Very Mild Impairment']

def get_generators(data_dir):
  

    train_datagen = ImageDataGenerator(
        rotation_range=15,
        zoom_range=0.10,
        horizontal_flip=True,
        brightness_range=[0.90, 1.10],
        width_shift_range=0.05,
        height_shift_range=0.05,
        fill_mode='nearest'
        # NO rescale here — EfficientNetB3 has rescaling built in
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