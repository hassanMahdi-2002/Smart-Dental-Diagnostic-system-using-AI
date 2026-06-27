import os
import shutil
import random

source_images = r"D:\Dental_AI_Project\01_Data\02_Detection Data\all_images"
source_labels = r"D:\Dental_AI_Project\01_Data\02_Detection Data\all_labels"
dest_dir = r"D:\Dental_AI_Project\01_Data\02_Detection Data\dataset_final"

def split_dataset():
    if not os.path.exists(source_images) or not os.path.exists(source_labels):
        print(" No source paths found!")
        return
    
    if os.path.exists(dest_dir):
        print(f"Deleting the old folder: {dest_dir} to ensure a clean partition...")
        shutil.rmtree(dest_dir)
        
    os.makedirs(dest_dir)
    
    for split in ['train', 'valid', 'test']:
        os.makedirs(os.path.join(dest_dir, split, 'images'))
        os.makedirs(os.path.join(dest_dir, split, 'labels'))

    valid_extensions = ('.jpg', '.jpeg', '.png')
    files = [f for f in os.listdir(source_images) if f.lower().endswith(valid_extensions)]
    random.shuffle(files)
    total_files = len(files)
    print(f"Splitting {total_files} image...")
    
    train_count = int(total_files * 0.70) # 70%
    val_count = int(total_files * 0.20)   # 20%

    train_files = files[:train_count]
    val_files = files[train_count:train_count + val_count]
    test_files = files[train_count + val_count:]

    def copy_files(file_list, split_name):
        print(f"Copying {len(file_list)} files to {split_name}...")
        for filename in file_list:
            
            src_img = os.path.join(source_images, filename)
            dst_img = os.path.join(dest_dir, split_name, 'images', filename)
            shutil.copy(src_img, dst_img)
            
            label_name = os.path.splitext(filename)[0] + ".txt"
            src_lbl = os.path.join(source_labels, label_name)
            dst_lbl = os.path.join(dest_dir, split_name, 'labels', label_name)
            
            if os.path.exists(src_lbl):
                shutil.copy(src_lbl, dst_lbl)
                
    copy_files(train_files, 'train')
    copy_files(val_files, 'valid')
    copy_files(test_files, 'test')

    print("-" * 50)
    print("Splitting process completed successfully!")
    print(f"Training Set: {len(train_files)} images")
    print(f"Validation Set: {len(val_files)} images")
    print(f"Test Set: {len(test_files)} images")
    print(f"Final path: {dest_dir}")
    print("You are now ready to run Run 5!")
    
if __name__ == "__main__":
    split_dataset()