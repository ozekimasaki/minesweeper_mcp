export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    let result = '';
    for (let i = 0; i < 16; i++) {
      result += array[i].toString(16).padStart(2, '0');
    }
    return (
      result.slice(0, 8) +
      '-' +
      result.slice(8, 12) +
      '-' +
      result.slice(12, 16) +
      '-' +
      result.slice(16, 20) +
      '-' +
      result.slice(20)
    );
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
