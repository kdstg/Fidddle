export type FieldType = 'signature' | 'initials' | 'date' | 'text' | 'checkbox';

export type DocumentStatus = 'draft' | 'pending' | 'completed' | 'declined';

export interface Signer {
    id: string;
    email: string;
    name?: string;
    color: string; // Hex color for bounding box UI (e.g., #3B82F6)
    accessToken: string;
    status: 'pending' | 'viewed' | 'signed';
    signedAt?: string;
}

export interface DocumentField {
    id: string;
    documentId: string;
    pageNumber: number;
    type: FieldType;
    xPct: number;      // 0.0 to 1.0 (normalized left coordinate)
    yPct: number;      // 0.0 to 1.0 (normalized top coordinate)
    widthPct: number;  // 0.0 to 1.0 (normalized width)
    heightPct: number; // 0.0 to 1.0 (normalized height)
    recipientId: string;
    value?: string;    // Base64 image data for signatures or plain text
    isRequired: boolean;
}

export interface Document {
    id: string;
    title: string;
    fileUrl: string;
    signedFileUrl?: string;
    status: DocumentStatus;
    initialHash?: string;
    finalHash?: string;
    createdAt: string;
    updatedAt: string;
    signers: Signer[];
    fields: DocumentField[];
}

export interface AuditLog {
    id: string;
    documentId: string;
    actorEmail: string;
    eventType: 'viewed' | 'signed' | 'completed' | 'declined';
    ipAddress?: string;
    userAgent?: string;
    timestamp: string;
}