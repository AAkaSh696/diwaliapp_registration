
import React, { useEffect, useState } from 'react';
import { Image } from 'react-native';
import QRCodeGenerator from 'qrcode';

export default function QRCode({
  value,
  size = 220,
  backgroundColor = 'white',
}) {
  const [qrImage, setQrImage] = useState(null);

  useEffect(() => {
    let cancelled = false;

    QRCodeGenerator.toDataURL(String(value ?? ''), {
      width: size,
      margin: 1,
      color: {
        dark: '#000000',
        light: backgroundColor,
      },
    })
      .then((url) => {
        if (!cancelled) setQrImage(url);
      })
      .catch((error) => {
        console.error('QR generation failed:', error);
      });

    return () => {
      cancelled = true;
    };
  }, [value, size, backgroundColor]);

  if (!qrImage) return null;

  return (
    <Image
      source={{ uri: qrImage }}
      style={{ width: size, height: size }}
      resizeMode="contain"
      accessibilityLabel="Student QR code"
    />
  );
}
