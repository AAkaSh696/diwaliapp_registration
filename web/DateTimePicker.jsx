
import React from 'react';

export default function DateTimePicker({
  value,
  mode = 'date',
  minimumDate,
  onChange,
}) {
  const date = value instanceof Date ? value : new Date();

  const pad = (number) => String(number).padStart(2, '0');

  const inputValue =
    mode === 'time'
      ? `${pad(date.getHours())}:${pad(date.getMinutes())}`
      : `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

  const minimumValue =
    minimumDate instanceof Date
      ? `${minimumDate.getFullYear()}-${pad(minimumDate.getMonth() + 1)}-${pad(minimumDate.getDate())}`
      : undefined;

  const handleChange = (event) => {
    const selectedValue = event.target.value;

    if (!selectedValue) {
      onChange({ type: 'dismissed' }, undefined);
      return;
    }

    let selectedDate;

    if (mode === 'time') {
      const [hours, minutes] = selectedValue.split(':').map(Number);

      selectedDate = new Date(date);
      selectedDate.setHours(hours, minutes, 0, 0);
    } else {
      const [year, month, day] = selectedValue.split('-').map(Number);

      selectedDate = new Date(
        year,
        month - 1,
        day,
        date.getHours(),
        date.getMinutes(),
        0,
        0
      );
    }

    onChange({ type: 'set' }, selectedDate);
  };

  return (
    <input
      type={mode === 'time' ? 'time' : 'date'}
      value={inputValue}
      min={mode === 'date' ? minimumValue : undefined}
      onChange={handleChange}
      aria-label={mode === 'time' ? 'Select expiry time' : 'Select expiry date'}
      style={{
        padding: 10,
        marginTop: 8,
        marginBottom: 8,
        border: '1px solid #ccc',
        borderRadius: 6,
        fontSize: 16,
        backgroundColor: '#fff',
      }}
    />
  );
}
