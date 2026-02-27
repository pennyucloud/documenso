import { useEffect, useRef } from 'react';

import { Trans } from '@lingui/react/macro';
import { QrCodeIcon } from 'lucide-react';

import { cn } from '../../lib/utils';

export type SignaturePadQrProps = {
  className?: string;
  /**
   * The verification URL for the document (e.g., https://app.documenso.com/share/qr_xxx).
   * When provided, a QR code is rendered and the QR signature value is set to this URL.
   */
  verificationUrl: string;
  onChange: (_value: string) => void;
};

/**
 * Renders a preview QR code pointing to the document verification URL.
 * Selecting this tab automatically confirms the QR signature using the
 * document's qrToken-based verification link.
 */
export const SignaturePadQr = ({ className, verificationUrl, onChange }: SignaturePadQrProps) => {
  const $canvas = useRef<HTMLCanvasElement>(null);
  const hasRendered = useRef(false);

  useEffect(() => {
    if (!verificationUrl || hasRendered.current) {
      return;
    }

    // Use dynamic import to avoid bundling uqr in the UI package.
    void import('uqr').then(({ renderSVG }) => {
      if (!$canvas.current) {
        return;
      }

      const svgString = renderSVG(verificationUrl, {
        ecc: 'M',
      });

      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);

      const img = new Image();

      img.onload = () => {
        const canvas = $canvas.current;

        if (!canvas) {
          URL.revokeObjectURL(svgUrl);
          return;
        }

        const ctx = canvas.getContext('2d');

        if (!ctx) {
          URL.revokeObjectURL(svgUrl);
          return;
        }

        const size = Math.min(canvas.width, canvas.height);
        const x = (canvas.width - size) / 2;
        const y = (canvas.height - size) / 2;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, x, y, size, size);

        URL.revokeObjectURL(svgUrl);
        hasRendered.current = true;

        // Export the rendered QR as the signature value.
        onChange(canvas.toDataURL('image/png'));
      };

      img.src = svgUrl;
    });
  }, [verificationUrl, onChange]);

  // Immediately signal the value when the URL is available (even before the canvas renders).
  useEffect(() => {
    if (verificationUrl) {
      // We pass the verification URL as the QR signature value marker.
      // The actual image is set once the canvas finishes rendering above.
      // Using the sentinel prefix so sign-field-with-token can identify this as a QR signature.
      onChange(`__qr__:${verificationUrl}`);
    }
  }, [verificationUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={cn('relative flex h-full w-full flex-col items-center justify-center', className)}>
      {verificationUrl ? (
        <>
          <canvas
            ref={$canvas}
            width={200}
            height={200}
            className="max-h-full max-w-full"
            aria-label="QR Code signature"
          />
          <p className="mt-2 max-w-xs px-2 text-center text-xs text-muted-foreground">
            <Trans>
              This QR code will be embedded in your signature. Anyone who scans it can verify this
              document is authentic.
            </Trans>
          </p>
        </>
      ) : (
        <div className="flex flex-col items-center text-muted-foreground">
          <QrCodeIcon className="h-10 w-10" />
          <p className="mt-2 text-sm">
            <Trans>QR code not available for this document.</Trans>
          </p>
        </div>
      )}
    </div>
  );
};
