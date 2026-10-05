import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Minimal clipboard hook — a local replacement for the unmaintained
 * `react-hook-clipboard` package, whose ESM-only build breaks this
 * project's jest setup.
 *
 * Returns [clipboardText, copyToClipboard].
 * `clipboardText` live-updates by polling clipboard-read (when permitted);
 * `copyToClipboard(text, onCopy?, onWriteError?)` writes to the clipboard.
 */
export const useClipboard = ({ updateFrequency = 1000 } = {}, onReadError) => {
  const [clipboard, setClipboard] = useState('');
  const onReadErrorRef = useRef(onReadError);
  onReadErrorRef.current = onReadError;

  const copyToClipboard = useCallback((text, onCopy = () => {}, onWriteError = () => {}) => {
    if (!navigator.clipboard) {
      onWriteError({ message: 'Clipboard API is not available in this browser.' });
      return;
    }
    navigator.clipboard.writeText(text).then(
      () => {
        setClipboard(text);
        onCopy(text);
      },
      (err) => onWriteError(err)
    );
  }, []);

  useEffect(() => {
    let intervalId;
    if (navigator.permissions && navigator.clipboard) {
      navigator.permissions
        .query({ name: 'clipboard-read' })
        .then(
          ({ state }) => {
            if (['granted', 'prompt'].includes(state)) {
              intervalId = setInterval(() => {
                navigator.clipboard.readText().then(setClipboard, (e) => onReadErrorRef.current?.(e));
              }, updateFrequency);
            } else {
              onReadErrorRef.current?.({ message: 'ClipboardRead permission has been blocked by the user.' });
            }
          },
          (e) => onReadErrorRef.current?.(e)
        );
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [updateFrequency]);

  return [clipboard, copyToClipboard];
};

export default useClipboard;
