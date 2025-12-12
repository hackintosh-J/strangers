export const compressImage = async (file, type = 'storage') => {
    if (!file.type.startsWith('image/')) return file;

    // Configuration
    // storage: Aggressive for chat/storage (Save BW/Storage)
    // ai: Moderate for AI analysis (Need detail, but stay under limits)
    const config = type === 'ai'
        ? { maxWidth: 1920, quality: 0.8 }
        : { maxWidth: 1280, quality: 0.6 };

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // One-shot Resize
                if (width > config.maxWidth || height > config.maxWidth) {
                    if (width > height) {
                        height = Math.round((height * config.maxWidth) / width);
                        width = config.maxWidth;
                    } else {
                        width = Math.round((width * config.maxWidth) / height);
                        height = config.maxWidth;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // One-shot Compression
                canvas.toBlob((blob) => {
                    if (!blob) {
                        reject(new Error('Canvas empty'));
                        return;
                    }
                    const compressedFile = new File([blob], file.name, {
                        type: 'image/jpeg',
                        lastModified: Date.now(),
                    });

                    // console.log(`Compressed: ${file.size/1024|0}KB -> ${compressedFile.size/1024|0}KB`);
                    resolve(compressedFile);
                }, 'image/jpeg', config.quality);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};
