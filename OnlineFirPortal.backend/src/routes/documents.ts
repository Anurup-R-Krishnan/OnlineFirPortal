import express from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, requireRole } from '../lib/auth-middleware';
import { logAudit } from '../lib/audit-logger';
import { encryptData, decryptData, sanitizeInput } from '../lib/security';
import { UserRole, DocumentType } from '@prisma/client';

const router = express.Router();

const getIp = (req: express.Request): string => req.ip || req.socket.remoteAddress || 'unknown';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'video/mp4',
    'video/webm',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user!.userId;
        const userRole = req.user!.role as UserRole;
        const { page = '1', limit = '20' } = req.query;

        const where: any = {};

        if (userRole === 'CITIZEN') {
            where.uploadedById = userId;
        } else if (userRole === 'OFFICER' || userRole === 'SHO') {
            // For now, officers see documents they uploaded or related to their assigned FIRs?
            // Simplified: only their uploads or all if admin. 
            // Better logic: documents linked to FIRs assigned to them.
            // But for "My Documents" page, usually implies "Uploaded by Me"
            where.uploadedById = userId;
        }

        const skip = (parseInt(String(page)) - 1) * parseInt(String(limit));

        const [documents, total] = await Promise.all([
            prisma.document.findMany({
                where,
                select: {
                    id: true,
                    filename: true,
                    mimetype: true,
                    size: true,
                    documentType: true,
                    verified: true,
                    verifiedAt: true,
                    createdAt: true,
                    fir: {
                        select: {
                            id: true,
                            referenceNumber: true,
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(String(limit)),
            }),
            prisma.document.count({ where }),
        ]);

        res.json({
            documents,
            total,
            page: parseInt(String(page)),
            limit: parseInt(String(limit)),
            pages: Math.ceil(total / parseInt(String(limit))),
        });
    } catch (error: any) {
        console.error('[list my documents error]', error);
        res.status(500).json({ error: 'failed to list documents' });
    }
});

router.post('/upload', authenticateToken, async (req, res) => {
    try {
        const userId = req.user!.userId;
        const userRole = req.user!.role as UserRole;
        const ipAddress = getIp(req);

        const {
            firId,
            filename,
            mimetype,
            size,
            documentType,
            content, // base64 encoded file content
        } = req.body;

        if (!firId || !filename || !mimetype || !size || !content) {
            res.status(400).json({ error: 'missing required fields' });
            return;
        }

        if (size > MAX_FILE_SIZE) {
            res.status(400).json({ error: `file size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}mb` });
            return;
        }

        if (!ALLOWED_MIME_TYPES.includes(mimetype)) {
            res.status(400).json({ error: 'file type not allowed' });
            return;
        }

        const fir = await prisma.fIR.findUnique({
            where: { id: String(firId) },
        });

        if (!fir) {
            res.status(404).json({ error: 'fir not found' });
            return;
        }

        if (userRole === 'CITIZEN' && fir.reporterId !== userId) {
            res.status(403).json({ error: 'not authorized to upload documents for this fir' });
            return;
        }

        const encryptedContent = await encryptData(content);

        const document = await prisma.document.create({
            data: {
                firId: String(firId),
                uploadedById: userId,
                filename: sanitizeInput(filename),
                mimetype,
                size: parseInt(String(size)),
                documentType: (documentType as DocumentType) || 'OTHER',
                encryptedContent,
                verified: false,
            },
        });

        await logAudit({
            action: 'UPLOAD_DOCUMENT',
            userId,
            userRole,
            changes: { documentId: document.id, firId, filename, size },
            ipAddress,
        });

        res.status(201).json({
            success: true,
            id: document.id,
            filename: document.filename,
            message: 'document uploaded successfully',
        });
    } catch (error: any) {
        console.error('[upload document error]', error);
        res.status(500).json({ error: 'failed to upload document' });
    }
});

router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const userId = req.user!.userId;
        const userRole = req.user!.role as UserRole;
        const ipAddress = getIp(req);
        const { id } = req.params;

        const document = await prisma.document.findUnique({
            where: { id: String(id) },
            include: {
                fir: {
                    select: {
                        id: true,
                        reporterId: true,
                        assignedOfficerId: true,
                    },
                },
                uploadedBy: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                    },
                },
            },
        });

        if (!document) {
            res.status(404).json({ error: 'document not found' });
            return;
        }

        const canAccess =
            userRole === 'ADMIN' ||
            userRole === 'SUPER_ADMIN' ||
            document.uploadedById === userId ||
            document.fir.reporterId === userId ||
            document.fir.assignedOfficerId === userId;

        if (!canAccess) {
            res.status(403).json({ error: 'not authorized to access this document' });
            return;
        }

        const decryptedContent = await decryptData(document.encryptedContent);

        await logAudit({
            action: 'DOWNLOAD_DOCUMENT',
            userId,
            userRole,
            changes: { documentId: document.id, firId: document.firId, filename: document.filename },
            ipAddress,
        });

        res.json({
            id: document.id,
            filename: document.filename,
            mimetype: document.mimetype,
            size: document.size,
            documentType: document.documentType,
            content: decryptedContent,
            verified: document.verified,
            uploadedBy: document.uploadedBy,
            createdAt: document.createdAt,
        });
    } catch (error: any) {
        console.error('[download document error]', error);
        res.status(500).json({ error: 'failed to download document' });
    }
});

router.get('/fir/:firId', authenticateToken, async (req, res) => {
    try {
        const userId = req.user!.userId;
        const userRole = req.user!.role as UserRole;
        const { firId } = req.params;

        const fir = await prisma.fIR.findUnique({
            where: { id: String(firId) },
        });

        if (!fir) {
            res.status(404).json({ error: 'fir not found' });
            return;
        }

        const canAccess =
            userRole === 'ADMIN' ||
            userRole === 'SUPER_ADMIN' ||
            fir.reporterId === userId ||
            fir.assignedOfficerId === userId;

        if (!canAccess) {
            res.status(403).json({ error: 'not authorized to access documents for this fir' });
            return;
        }

        const documents = await prisma.document.findMany({
            where: { firId: String(firId) },
            select: {
                id: true,
                filename: true,
                mimetype: true,
                size: true,
                documentType: true,
                verified: true,
                verifiedBy: true,
                verifiedAt: true,
                createdAt: true,
                uploadedBy: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json({
            firId,
            total: documents.length,
            documents,
        });
    } catch (error: any) {
        console.error('[list documents error]', error);
        res.status(500).json({ error: 'failed to list documents' });
    }
});

router.post('/:id/verify', authenticateToken, requireRole(['OFFICER', 'SHO', 'ADMIN', 'SUPER_ADMIN']), async (req, res) => {
    try {
        const userId = req.user!.userId;
        const userRole = req.user!.role as UserRole;
        const ipAddress = getIp(req);
        const { id } = req.params;

        const document = await prisma.document.findUnique({
            where: { id: String(id) },
        });

        if (!document) {
            res.status(404).json({ error: 'document not found' });
            return;
        }

        if (document.verified) {
            res.status(400).json({ error: 'document already verified' });
            return;
        }

        const updatedDocument = await prisma.document.update({
            where: { id: String(id) },
            data: {
                verified: true,
                verifiedBy: userId,
                verifiedAt: new Date(),
            },
        });

        await logAudit({
            action: 'UPLOAD_DOCUMENT',
            userId,
            userRole,
            changes: { documentId: document.id, action: 'verified', firId: document.firId },
            ipAddress,
        });

        res.json({
            success: true,
            id: updatedDocument.id,
            verified: updatedDocument.verified,
            message: 'document verified successfully',
        });
    } catch (error: any) {
        console.error('[verify document error]', error);
        res.status(500).json({ error: 'failed to verify document' });
    }
});

router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const userId = req.user!.userId;
        const userRole = req.user!.role as UserRole;
        const ipAddress = getIp(req);
        const { id } = req.params;

        const document = await prisma.document.findUnique({
            where: { id: String(id) },
            include: {
                fir: {
                    select: {
                        reporterId: true,
                        status: true,
                    },
                },
            },
        });

        if (!document) {
            res.status(404).json({ error: 'document not found' });
            return;
        }

        const canDelete =
            userRole === 'ADMIN' ||
            userRole === 'SUPER_ADMIN' ||
            (document.uploadedById === userId && document.fir.status === 'DRAFT');

        if (!canDelete) {
            res.status(403).json({ error: 'not authorized to delete this document' });
            return;
        }

        await prisma.document.delete({
            where: { id: String(id) },
        });

        await logAudit({
            action: 'DELETE_DOCUMENT',
            userId,
            userRole,
            changes: { documentId: document.id, firId: document.firId, filename: document.filename },
            ipAddress,
        });

        res.json({
            success: true,
            message: 'document deleted successfully',
        });
    } catch (error: any) {
        console.error('[delete document error]', error);
        res.status(500).json({ error: 'failed to delete document' });
    }
});

export default router;
