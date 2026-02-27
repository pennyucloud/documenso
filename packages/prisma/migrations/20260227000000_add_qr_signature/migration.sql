-- AlterTable: Add qrSignatureEnabled to DocumentMeta
ALTER TABLE "DocumentMeta" ADD COLUMN "qrSignatureEnabled" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable: Add qrSignatureEnabled to OrganisationGlobalSettings
ALTER TABLE "OrganisationGlobalSettings" ADD COLUMN "qrSignatureEnabled" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable: Add qrSignatureEnabled to TeamGlobalSettings
ALTER TABLE "TeamGlobalSettings" ADD COLUMN "qrSignatureEnabled" BOOLEAN;

-- AlterTable: Add qrSignature flag to Signature
ALTER TABLE "Signature" ADD COLUMN "qrSignature" BOOLEAN;
