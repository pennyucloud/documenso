import type { HTMLAttributes } from 'react';
import { useState } from 'react';

import { Trans } from '@lingui/react/macro';
import { KeyboardIcon, QrCodeIcon, UploadCloudIcon } from 'lucide-react';
import { match } from 'ts-pattern';

import { DocumentSignatureType } from '@documenso/lib/constants/document';
import { isBase64Image } from '@documenso/lib/constants/signatures';

import { SignatureIcon } from '../../icons/signature';
import { cn } from '../../lib/utils';
import { SignaturePadDraw } from './signature-pad-draw';
import { SignaturePadQr } from './signature-pad-qr';
import { SignaturePadType } from './signature-pad-type';
import { SignaturePadUpload } from './signature-pad-upload';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './signature-tabs';

export type SignaturePadValue = {
  type: DocumentSignatureType;
  value: string;
};

export type SignaturePadProps = Omit<HTMLAttributes<HTMLCanvasElement>, 'onChange'> & {
  fullName?: string;
  value?: string;
  onChange?: (_value: SignaturePadValue) => void;

  disabled?: boolean;

  typedSignatureEnabled?: boolean;
  uploadSignatureEnabled?: boolean;
  drawSignatureEnabled?: boolean;
  qrSignatureEnabled?: boolean;

  /**
   * The document QR verification URL (e.g. https://app.documenso.com/share/qr_xxx).
   * Required for the QR signature tab to function.
   */
  qrVerificationUrl?: string;

  onValidityChange?: (isValid: boolean) => void;
};

export const SignaturePad = ({
  fullName,
  value = '',
  onChange,
  disabled = false,
  typedSignatureEnabled = true,
  uploadSignatureEnabled = true,
  drawSignatureEnabled = true,
  qrSignatureEnabled = true,
  qrVerificationUrl,
}: SignaturePadProps) => {
  const [imageSignature, setImageSignature] = useState(isBase64Image(value) ? value : '');
  const [drawSignature, setDrawSignature] = useState(isBase64Image(value) ? value : '');
  const [typedSignature, setTypedSignature] = useState(isBase64Image(value) ? '' : value);
  const [qrSignatureValue, setQrSignatureValue] = useState(
    value.startsWith('__qr__:') ? value : '',
  );

  /**
   * This is cooked.
   *
   * Get the first enabled tab that has a signature if possible, otherwise just get
   * the first enabled tab.
   */
  const [tab, setTab] = useState(
    ((): 'draw' | 'text' | 'image' | 'qr' => {
      // First passthrough to check to see if there's a signature for a given tab.
      if (drawSignatureEnabled && drawSignature) {
        return 'draw';
      }

      if (typedSignatureEnabled && typedSignature) {
        return 'text';
      }

      if (uploadSignatureEnabled && imageSignature) {
        return 'image';
      }

      if (qrSignatureEnabled && qrSignatureValue) {
        return 'qr';
      }

      // Second passthrough to just select the first avaliable tab.
      if (drawSignatureEnabled) {
        return 'draw';
      }

      if (typedSignatureEnabled) {
        return 'text';
      }

      if (uploadSignatureEnabled) {
        return 'image';
      }

      if (qrSignatureEnabled) {
        return 'qr';
      }

      throw new Error('No signature enabled');
    })(),
  );

  const onImageSignatureChange = (value: string) => {
    setImageSignature(value);

    onChange?.({
      type: DocumentSignatureType.UPLOAD,
      value,
    });
  };

  const onDrawSignatureChange = (value: string) => {
    setDrawSignature(value);

    onChange?.({
      type: DocumentSignatureType.DRAW,
      value,
    });
  };

  const onTypedSignatureChange = (value: string) => {
    setTypedSignature(value);

    onChange?.({
      type: DocumentSignatureType.TYPE,
      value,
    });
  };

  const onQrSignatureChange = (value: string) => {
    setQrSignatureValue(value);

    onChange?.({
      type: DocumentSignatureType.QR,
      value,
    });
  };

  const onTabChange = (value: 'draw' | 'text' | 'image' | 'qr') => {
    if (disabled) {
      return;
    }

    setTab(value);

    match(value)
      .with('draw', () => {
        onDrawSignatureChange(drawSignature);
      })
      .with('text', () => {
        onTypedSignatureChange(typedSignature);
      })
      .with('image', () => {
        onImageSignatureChange(imageSignature);
      })
      .with('qr', () => {
        onQrSignatureChange(qrSignatureValue);
      })
      .exhaustive();
  };

  if (!drawSignatureEnabled && !typedSignatureEnabled && !uploadSignatureEnabled && !qrSignatureEnabled) {
    return null;
  }

  return (
    <Tabs
      defaultValue={tab}
      className={cn({
        'pointer-events-none': disabled,
      })}
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      onValueChange={(value) => onTabChange(value as 'draw' | 'text' | 'image' | 'qr')}
    >
      <TabsList>
        {drawSignatureEnabled && (
          <TabsTrigger value="draw">
            <SignatureIcon className="mr-2 size-4" />
            <Trans context="Draw signature">Draw</Trans>
          </TabsTrigger>
        )}

        {typedSignatureEnabled && (
          <TabsTrigger value="text">
            <KeyboardIcon className="mr-2 size-4" />
            <Trans context="Type signature">Type</Trans>
          </TabsTrigger>
        )}

        {uploadSignatureEnabled && (
          <TabsTrigger value="image">
            <UploadCloudIcon className="mr-2 size-4" />
            <Trans context="Upload signature">Upload</Trans>
          </TabsTrigger>
        )}

        {qrSignatureEnabled && (
          <TabsTrigger value="qr">
            <QrCodeIcon className="mr-2 size-4" />
            <Trans context="QR Code signature">QR Code</Trans>
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent
        value="draw"
        className="relative flex aspect-signature-pad items-center justify-center rounded-md border border-border bg-neutral-50 text-center dark:bg-background"
      >
        <SignaturePadDraw
          className="h-full w-full"
          onChange={onDrawSignatureChange}
          value={drawSignature}
        />
      </TabsContent>

      <TabsContent
        value="text"
        className="relative flex aspect-signature-pad items-center justify-center rounded-md border border-border bg-neutral-50 text-center dark:bg-background"
      >
        <SignaturePadType
          value={typedSignature}
          defaultValue={fullName}
          onChange={onTypedSignatureChange}
        />
      </TabsContent>

      <TabsContent
        value="image"
        className={cn(
          'relative aspect-signature-pad rounded-md border border-border bg-neutral-50 dark:bg-background',
          {
            'bg-white': imageSignature,
          },
        )}
      >
        <SignaturePadUpload value={imageSignature} onChange={onImageSignatureChange} />
      </TabsContent>

      <TabsContent
        value="qr"
        className="relative flex aspect-signature-pad items-center justify-center rounded-md border border-border bg-neutral-50 dark:bg-background"
      >
        <SignaturePadQr
          className="h-full w-full"
          verificationUrl={qrVerificationUrl ?? ''}
          onChange={onQrSignatureChange}
        />
      </TabsContent>
    </Tabs>
  );
};
