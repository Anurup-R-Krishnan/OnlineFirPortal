"use client";

import React, { useRef, useState } from "react";
import { Upload, X, FileText, Image as ImageIcon, Film, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export interface FileWithPreview {
    file: File;
    preview?: string;
    progress: number;
    status: "pending" | "uploading" | "completed" | "error";
    error?: string;
    uploadedId?: string;
}

interface EvidenceUploadProps {
    files: FileWithPreview[];
    onFilesChange: (files: FileWithPreview[]) => void;
    maxFiles?: number;
    maxSizeMB?: number;
    acceptedTypes?: string[];
    disabled?: boolean;
}

export function EvidenceUpload({
    files,
    onFilesChange,
    maxFiles = 5,
    maxSizeMB = 10,
    acceptedTypes = [".jpg", ".jpeg", ".png", ".gif", ".pdf", ".mp4", ".webm", ".doc", ".docx"],
    disabled = false
}: EvidenceUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragActive, setDragActive] = useState(false);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    const handleFileSelect = (newFiles: FileList | null) => {
        if (!newFiles) return;

        const validFiles: FileWithPreview[] = [];
        const currentCount = files.length;
        const errors: string[] = [];
        const allowedMimeTypes = new Set([
            "image/jpeg",
            "image/png",
            "image/gif",
            "application/pdf",
            "video/mp4",
            "video/webm",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ]);
        const allowedExtensions = new Set([
            "jpg",
            "jpeg",
            "png",
            "gif",
            "pdf",
            "mp4",
            "webm",
            "doc",
            "docx",
        ]);

        Array.from(newFiles).forEach((file, index) => {
            if (currentCount + validFiles.length >= maxFiles) {
                errors.push(`"${file.name}" skipped: maximum ${maxFiles} files allowed.`);
                return;
            }

            if (file.size > maxSizeMB * 1024 * 1024) {
                errors.push(`"${file.name}" rejected: file size exceeds ${maxSizeMB}MB.`);
                return;
            }

            const ext = file.name.includes(".")
                ? file.name.split(".").pop()?.toLowerCase() || ""
                : "";

            const isMimeAllowed = allowedMimeTypes.has(file.type);
            const isExtensionAllowed = allowedExtensions.has(ext);

            if (!isMimeAllowed && !isExtensionAllowed) {
                errors.push(`"${file.name}" rejected: unsupported file type.`);
                return;
            }

            validFiles.push({
                file,
                preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
                progress: 0,
                status: "pending"
            });
        });

        setValidationErrors(errors);
        onFilesChange([...files, ...validFiles]);
    };

    const removeFile = (index: number) => {
        const newFiles = [...files];
        const removed = newFiles.splice(index, 1);
        if (removed[0]?.preview) {
            URL.revokeObjectURL(removed[0].preview);
        }
        onFilesChange(newFiles);
    };

    const getFileIcon = (type: string) => {
        if (type.startsWith("image/")) return <ImageIcon className="h-5 w-5 text-blue-500" />;
        if (type.startsWith("video/")) return <Film className="h-5 w-5 text-purple-500" />;
        return <FileText className="h-5 w-5 text-gray-500" />;
    };

    return (
        <div className="space-y-4">
            <div
                className={cn(
                    "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-6 transition-colors",
                    dragActive ? "border-primary bg-primary/5" : "hover:bg-muted/50",
                    disabled && "opacity-50 cursor-not-allowed"
                )}
                onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setDragActive(false);
                    if (!disabled) handleFileSelect(e.dataTransfer.files);
                }}
            >
                <Upload className="mb-4 h-10 w-10 text-muted-foreground" />
                <h3 className="mb-2 font-semibold">Upload Evidence</h3>
                <p className="mb-4 text-center text-sm text-muted-foreground">
                    Drag & drop or Click to select files<br />
                    (Max {maxSizeMB}MB each)
                </p>
                <Button
                    type="button"
                    variant="secondary"
                    disabled={disabled}
                    onClick={() => fileInputRef.current?.click()}
                >
                    Select Files
                </Button>
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    accept={acceptedTypes.join(",")}
                    onChange={(e) => handleFileSelect(e.target.files)}
                    disabled={disabled}
                />
            </div>

            {validationErrors.length > 0 && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
                    <div className="mb-1 text-sm font-medium text-destructive">Some files were not added:</div>
                    <ul className="space-y-1 text-xs text-destructive">
                        {validationErrors.map((msg, idx) => (
                            <li key={idx}>{msg}</li>
                        ))}
                    </ul>
                </div>
            )}

            {files.length > 0 && (
                <div className="space-y-3">
                    {files.map((item, idx) => (
                        <div key={idx} className="relative flex items-center gap-3 rounded-lg border bg-card p-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                                {item.preview ? (
                                    <img src={item.preview} alt="Preview" className="h-full w-full object-cover rounded" />
                                ) : (
                                    getFileIcon(item.file.type)
                                )}
                            </div>

                            <div className="flex-1 overflow-hidden">
                                <div className="flex items-center justify-between">
                                    <span className="truncate text-sm font-medium">{item.file.name}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeFile(idx)}
                                        className="text-muted-foreground hover:text-destructive"
                                        disabled={disabled || item.status === "uploading"}
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>

                                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>{(item.file.size / 1024 / 1024).toFixed(2)} MB</span>
                                    {item.status === 'uploading' && <span>• Uploading...</span>}
                                    {item.status === 'completed' && <span className="text-green-600 font-medium">• Uploaded</span>}
                                    {item.status === 'error' && <span className="text-destructive font-medium">• Failed</span>}
                                </div>

                                {item.status !== "pending" && (
                                    <Progress value={item.status === 'completed' ? 100 : item.progress} className="mt-2 h-1.5" />
                                )}

                                {item.error && (
                                    <div className="mt-1 flex items-center gap-1 text-xs text-destructive">
                                        <AlertCircle className="h-3 w-3" />
                                        <span>{item.error}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
