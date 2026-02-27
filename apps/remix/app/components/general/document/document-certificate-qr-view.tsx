import { lazy, useEffect, useState } from 'react';

import { Trans } from '@lingui/react/macro';
import {
  type DocumentData,
  DocumentStatus,
  type EnvelopeItem,
  EnvelopeType,
  RecipientRole,
  SigningStatus,
} from '@prisma/client';
import { CheckCircle2Icon, DownloadIcon, ShieldCheckIcon, UserIcon } from 'lucide-react';
import { DateTime } from 'luxon';

import {
  EnvelopeRenderProvider,
  useCurrentEnvelopeRender,
} from '@documenso/lib/client-only/providers/envelope-render-provider';
import { formatDocumentsPath } from '@documenso/lib/utils/teams';
import { trpc } from '@documenso/trpc/react';
import PDFViewerKonvaLazy from '@documenso/ui/components/pdf-viewer/pdf-viewer-konva-lazy';
import { Badge } from '@documenso/ui/primitives/badge';
import { Button } from '@documenso/ui/primitives/button';
import { Card, CardContent, CardHeader, CardTitle } from '@documenso/ui/primitives/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@documenso/ui/primitives/dialog';
import { PDFViewerLazy } from '@documenso/ui/primitives/pdf-viewer/lazy';

import { EnvelopeDownloadDialog } from '~/components/dialogs/envelope-download-dialog';

import { EnvelopeRendererFileSelector } from '../envelope-editor/envelope-file-selector';

const EnvelopeGenericPageRenderer = lazy(
  async () => import('~/components/general/envelope-editor/envelope-generic-page-renderer'),
);

type Signer = {
  id: number;
  name: string;
  email: string;
  role: RecipientRole;
  signedAt: Date | null;
  signingStatus: SigningStatus;
};

export type DocumentCertificateQRViewProps = {
  documentId: number;
  envelopeId: string;
  title: string;
  internalVersion: number;
  envelopeItems: (EnvelopeItem & { documentData: DocumentData })[];
  documentTeamUrl: string;
  recipientCount?: number;
  completedDate?: Date;
  signers?: Signer[];
  token: string;
};

export const DocumentCertificateQRView = ({
  documentId,
  envelopeId,
  title,
  internalVersion,
  envelopeItems,
  documentTeamUrl,
  recipientCount = 0,
  completedDate,
  signers = [],
  token,
}: DocumentCertificateQRViewProps) => {
  const { data: documentViaUser } = trpc.document.get.useQuery({
    documentId,
  });

  const [isDialogOpen, setIsDialogOpen] = useState(() => !!documentViaUser);

  const formattedDate = completedDate
    ? DateTime.fromJSDate(completedDate).toLocaleString(DateTime.DATETIME_MED)
    : '';

  useEffect(() => {
    if (documentViaUser) {
      setIsDialogOpen(true);
    }
  }, [documentViaUser]);

  return (
    <div className="mx-auto w-full max-w-screen-md space-y-8 px-4 py-8 md:px-0">
      {/* Dialog for internal document link */}
      {documentViaUser && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                <Trans>Document found in your account</Trans>
              </DialogTitle>

              <DialogDescription>
                <Trans>
                  This document is available in your Documenso account. You can view more details,
                  recipients, and audit logs there.
                </Trans>
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="flex flex-row justify-end gap-2">
              <Button asChild>
                <a
                  href={`${formatDocumentsPath(documentTeamUrl)}/${documentViaUser.envelopeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Trans>Go to document</Trans>
                </a>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Verification badge */}
      <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-800 dark:bg-green-950">
        <ShieldCheckIcon className="h-6 w-6 shrink-0 text-green-600 dark:text-green-400" />
        <div>
          <p className="text-sm font-semibold text-green-700 dark:text-green-300">
            <Trans>Document Verified</Trans>
          </p>
          <p className="text-xs text-green-600 dark:text-green-400">
            <Trans>
              This document has been signed and its authenticity is verified by Documenso.
            </Trans>
          </p>
        </div>
      </div>

      {internalVersion === 2 ? (
        <EnvelopeRenderProvider
          envelope={{
            envelopeItems,
            status: DocumentStatus.COMPLETED,
            type: EnvelopeType.DOCUMENT,
          }}
          token={token}
        >
          <DocumentCertificateQrV2
            title={title}
            envelopeId={envelopeId}
            recipientCount={recipientCount}
            formattedDate={formattedDate}
            signers={signers}
            token={token}
          />
        </EnvelopeRenderProvider>
      ) : (
        <>
          <DocumentHeader
            title={title}
            recipientCount={recipientCount}
            formattedDate={formattedDate}
            envelopeId={envelopeId}
            envelopeItems={envelopeItems}
            token={token}
          />

          <AuditTrailCard signers={signers} />

          <div className="w-full">
            <PDFViewerLazy
              key={envelopeItems[0].id}
              envelopeItem={envelopeItems[0]}
              token={token}
              version="signed"
            />
          </div>
        </>
      )}
    </div>
  );
};

type DocumentHeaderProps = {
  title: string;
  recipientCount: number;
  formattedDate: string;
  envelopeId: string;
  envelopeItems: (EnvelopeItem & { documentData: DocumentData })[];
  token: string;
};

const DocumentHeader = ({
  title,
  recipientCount,
  formattedDate,
  envelopeId,
  envelopeItems,
  token,
}: DocumentHeaderProps) => (
  <div className="flex w-full flex-col justify-between gap-4 md:flex-row md:items-end">
    <div className="space-y-1">
      <h1 className="text-xl font-medium">{title}</h1>
      <div className="flex flex-col gap-0.5 text-sm text-muted-foreground">
        <p>
          <Trans>{recipientCount} recipients</Trans>
        </p>
        <p>
          <Trans>Completed on {formattedDate}</Trans>
        </p>
      </div>
    </div>

    <EnvelopeDownloadDialog
      envelopeId={envelopeId}
      envelopeStatus={DocumentStatus.COMPLETED}
      envelopeItems={envelopeItems}
      token={token}
      trigger={
        <Button type="button" variant="outline" className="w-fit">
          <DownloadIcon className="mr-2 h-5 w-5" />
          <Trans>Download</Trans>
        </Button>
      }
    />
  </div>
);

type AuditTrailCardProps = {
  signers: Signer[];
};

const AuditTrailCard = ({ signers }: AuditTrailCardProps) => {
  if (signers.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CheckCircle2Icon className="h-5 w-5 text-green-600" />
          <Trans>Audit Trail</Trans>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {signers.map((signer) => (
            <div
              key={signer.id}
              className="flex items-start gap-3 rounded-md border border-border p-3"
            >
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{signer.name || signer.email}</span>
                  <Badge variant="secondary" className="text-xs">
                    <Trans>{formatRecipientRole(signer.role)}</Trans>
                  </Badge>
                  {signer.signingStatus === SigningStatus.SIGNED && (
                    <Badge
                      variant="outline"
                      className="border-green-300 bg-green-50 text-xs text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300"
                    >
                      <CheckCircle2Icon className="mr-1 h-3 w-3" />
                      <Trans>Signed</Trans>
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{signer.email}</p>
                {signer.signedAt && (
                  <p className="text-xs text-muted-foreground">
                    <Trans>
                      Signed on{' '}
                      {DateTime.fromJSDate(signer.signedAt).toLocaleString(DateTime.DATETIME_MED)}
                    </Trans>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const formatRecipientRole = (role: RecipientRole): string => {
  switch (role) {
    case RecipientRole.SIGNER:
      return 'Signer';
    case RecipientRole.APPROVER:
      return 'Approver';
    case RecipientRole.VIEWER:
      return 'Viewer';
    case RecipientRole.CC:
      return 'CC';
    case RecipientRole.ASSISTANT:
      return 'Assistant';
    default:
      return role;
  }
};

type DocumentCertificateQrV2Props = {
  title: string;
  envelopeId: string;
  recipientCount: number;
  formattedDate: string;
  signers: Signer[];
  token: string;
};

const DocumentCertificateQrV2 = ({
  title,
  envelopeId,
  recipientCount,
  formattedDate,
  signers,
  token,
}: DocumentCertificateQrV2Props) => {
  const { envelopeItems } = useCurrentEnvelopeRender();

  return (
    <div className="flex min-h-screen flex-col items-start gap-8">
      <DocumentHeader
        title={title}
        recipientCount={recipientCount}
        formattedDate={formattedDate}
        envelopeId={envelopeId}
        envelopeItems={envelopeItems}
        token={token}
      />

      <AuditTrailCard signers={signers} />

      <div className="w-full">
        <EnvelopeRendererFileSelector className="mb-4 p-0" fields={[]} secondaryOverride={''} />

        <PDFViewerKonvaLazy renderer="preview" customPageRenderer={EnvelopeGenericPageRenderer} />
      </div>
    </div>
  );
};
