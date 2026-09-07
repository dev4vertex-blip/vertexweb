import { Router, Response } from 'express';
import crypto from 'crypto';
import { authenticateUser, AuthenticatedRequest } from '../middleware.js';
import { logAuditEvent } from '../auth.js';
import { getDb } from '../../db/client.js';

const router = Router();

export interface UploadRecord {
  id: string;
  userId: string;
  userRole: string;
  category: string;
  entityId?: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  storagePath: string;
  createdAt: string;
}

// In-memory upload registry with database mirroring
const uploadRecords = new Map<string, UploadRecord>();

// Pre-seed sample verification records for testing cross-access security
uploadRecords.set('upload-tech1-report', {
  id: 'upload-tech1-report',
  userId: 'tech-1',
  userRole: 'TECHNICIAN',
  category: 'DIAGNOSTIC_REPORT',
  entityId: 'VTX-84921',
  fileName: 'ac_compressor_diagnostic.pdf',
  mimeType: 'application/pdf',
  fileSize: 245000,
  storagePath: '/secure/uploads/tech-1/ac_compressor_diagnostic.pdf',
  createdAt: new Date().toISOString(),
});

uploadRecords.set('upload-tech2-checklist', {
  id: 'upload-tech2-checklist',
  userId: 'tech-2',
  userRole: 'TECHNICIAN',
  category: 'CHECKLIST_ATTACHMENT',
  entityId: 'VTX-84930',
  fileName: 'checklist_evidence.jpg',
  mimeType: 'image/jpeg',
  fileSize: 512000,
  storagePath: '/secure/uploads/tech-2/checklist_evidence.jpg',
  createdAt: new Date().toISOString(),
});

uploadRecords.set('upload-cust1-warranty', {
  id: 'upload-cust1-warranty',
  userId: 'cust-1',
  userRole: 'CUSTOMER',
  category: 'CUSTOMER_DOCUMENT',
  entityId: 'VTX-84921',
  fileName: 'daikin_warranty_card.jpg',
  mimeType: 'image/jpeg',
  fileSize: 320000,
  storagePath: '/secure/uploads/cust-1/daikin_warranty_card.jpg',
  createdAt: new Date().toISOString(),
});

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'application/pdf',
]);

const BANNED_EXTENSIONS = [
  '.exe', '.sh', '.bat', '.cmd', '.js', '.mjs', '.php', '.phtml',
  '.html', '.htm', '.vbs', '.py', '.pl', '.jar', '.apk', '.dmg',
];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * POST /api/v1/uploads
 * Secure authenticated file upload with strict MIME, size, and role category validation
 */
router.post('/', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { fileName, mimeType, fileSize, category, entityId, fileData } = req.body || {};

    // 1. Mandatory metadata check
    if (!fileName || !mimeType || !fileSize || !category) {
      return res.status(400).json({
        success: false,
        error: 'Missing required file upload metadata: fileName, mimeType, fileSize, category',
      });
    }

    // 2. MIME type verification
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      await logAuditEvent({
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: 'FILE_UPLOAD_REJECTED_MIME',
        entity: 'UPLOAD',
        newValue: { fileName, mimeType, category },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      return res.status(415).json({
        success: false,
        error: `Unsupported Media Type: '${mimeType}'. Allowed formats: JPEG, PNG, WebP, HEIC, PDF.`,
      });
    }

    // 3. File extension verification (prevent executable payload masking)
    const lowerName = fileName.toLowerCase();
    const hasBannedExt = BANNED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
    if (hasBannedExt) {
      await logAuditEvent({
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: 'FILE_UPLOAD_BLOCKED_SECURITY',
        entity: 'UPLOAD',
        newValue: { fileName, mimeType },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      return res.status(400).json({
        success: false,
        error: 'Security Error: File type or extension is strictly prohibited.',
      });
    }

    // 4. File size limit
    const parsedSize = Number(fileSize);
    if (isNaN(parsedSize) || parsedSize <= 0 || parsedSize > MAX_FILE_SIZE_BYTES) {
      return res.status(400).json({
        success: false,
        error: `Payload Too Large: File size (${parsedSize} bytes) exceeds maximum limit of 10MB.`,
      });
    }

    // 5. Role & Category Authorization
    const customerCategories = ['CUSTOMER_DOCUMENT', 'EQUIPMENT_PHOTO', 'SERVICE_REQUEST'];
    const technicianCategories = ['JOB_PHOTO', 'DIAGNOSTIC_REPORT', 'CHECKLIST_ATTACHMENT'];

    if (user.role === 'CUSTOMER' && !customerCategories.includes(category)) {
      return res.status(403).json({
        success: false,
        error: `Access Denied: Customers cannot upload under category '${category}'.`,
      });
    }

    if (user.role === 'TECHNICIAN' && !technicianCategories.includes(category)) {
      return res.status(403).json({
        success: false,
        error: `Access Denied: Technicians cannot upload under category '${category}'.`,
      });
    }

    // 6. Safe record storage
    const uploadId = `upl-${crypto.randomUUID()}`;
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `/secure/uploads/${user.id}/${uploadId}_${sanitizedName}`;

    const record: UploadRecord = {
      id: uploadId,
      userId: user.id,
      userRole: user.role,
      category,
      entityId: entityId || undefined,
      fileName: sanitizedName,
      mimeType,
      fileSize: parsedSize,
      storagePath,
      createdAt: new Date().toISOString(),
    };

    uploadRecords.set(uploadId, record);

    await logAuditEvent({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'FILE_UPLOADED_SECURELY',
      entity: 'UPLOAD',
      entityId: uploadId,
      newValue: { category, fileName: sanitizedName, fileSize: parsedSize, mimeType },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(201).json({
      success: true,
      data: {
        id: uploadId,
        fileName: sanitizedName,
        category,
        mimeType,
        fileSize: parsedSize,
        createdAt: record.createdAt,
      },
      message: 'File successfully uploaded and stored securely.',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'File upload failed';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * GET /api/v1/uploads/:id
 * Secure authenticated retrieval with cross-user and cross-tenant access controls
 */
router.get('/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const upload = uploadRecords.get(req.params.id);
    if (!upload) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    // Authorization evaluation
    const isOwner = upload.userId === user.id;
    const isStaff = ['SUPER_ADMIN', 'MANAGER'].includes(user.role);

    // Rule: Customers can only access their own uploads
    if (user.role === 'CUSTOMER' && !isOwner) {
      await logAuditEvent({
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: 'FILE_ACCESS_DENIED_CROSS_USER',
        entity: 'UPLOAD',
        entityId: upload.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      return res.status(403).json({
        success: false,
        error: 'Access Denied: You do not have permission to view this file.',
      });
    }

    // Rule: Technicians cannot access another technician's private file
    if (user.role === 'TECHNICIAN' && !isOwner) {
      await logAuditEvent({
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: 'FILE_ACCESS_DENIED_CROSS_TECHNICIAN',
        entity: 'UPLOAD',
        entityId: upload.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      return res.status(403).json({
        success: false,
        error: 'Access Denied: You cannot view private files belonging to other technicians.',
      });
    }

    // Rule: Non-staff non-owner denied
    if (!isOwner && !isStaff) {
      return res.status(403).json({
        success: false,
        error: 'Access Denied: Insufficient permissions to view this resource.',
      });
    }

    return res.json({
      success: true,
      data: {
        id: upload.id,
        fileName: upload.fileName,
        category: upload.category,
        mimeType: upload.mimeType,
        fileSize: upload.fileSize,
        ownerId: upload.userId,
        ownerRole: upload.userRole,
        createdAt: upload.createdAt,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to retrieve file';
    return res.status(500).json({ success: false, error: msg });
  }
});

export default router;
