export const compressImage = async (file, targetSizeKB = 200) => {
    if (!file.type.startsWith('image/')) return file;

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

                // Initial Resize: Limit max dimension to 1280 (was 1920) for better start
                const MAX_DIM = 1280;
                if (width > MAX_DIM || height > MAX_DIM) {
                    if (width > height) {
                        height = Math.round((height * MAX_DIM) / width);
                        width = MAX_DIM;
                    } else {
                        width = Math.round((width * MAX_DIM) / height);
                        height = MAX_DIM;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Aggressive Iteration
                let quality = 0.7;
                let minQuality = 0.1;

                const tryCompress = (q) => {
                    canvas.toBlob((blob) => {
                        if (!blob) {
                            reject(new Error('Canvas empty'));
                            return;
                        }

                        // Check size
                        if (blob.size / 1024 <= targetSizeKB || q <= minQuality) {
                            const compressedFile = new File([blob], file.name, {
                                type: 'image/jpeg',
                                lastModified: Date.now(),
                            });
                            resolve(compressedFile);
                        } else {
                            // Retry with lower quality
                            tryCompress(Math.max(q - 0.1, minQuality));
                        }
                    }, 'image/jpeg', q);
                };

                tryCompress(quality);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};
