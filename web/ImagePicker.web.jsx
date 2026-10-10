import { useRef } from 'react';

export function launchImageLibrary(options = {}, callback) {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = options.mediaType === 'photo' ? 'image/*' : '*/*';
    input.multiple = Boolean(options.selectionLimit > 1);

    input.onchange = () => {
      const files = Array.from(input.files || []);

      if (!files.length) {
        const result = { didCancel: true };
        callback?.(result);
        resolve(result);
        return;
      }

      const assets = files.map((file) => ({
        uri: URL.createObjectURL(file),
        fileName: file.name,
        type: file.type,
        fileSize: file.size,
        file,
      }));

      const result = { didCancel: false, assets };
      callback?.(result);
      resolve(result);
    };

    input.oncancel = () => {
      const result = { didCancel: true };
      callback?.(result);
      resolve(result);
    };

    input.click();
  });
}

export function launchCamera(options = {}, callback) {
  const result = {
    didCancel: true,
    errorCode: 'camera_unavailable',
    errorMessage: 'Use the browser image upload option on web.',
  };

  callback?.(result);
  return Promise.resolve(result);
}

export default { launchImageLibrary, launchCamera };
