import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Paperclip, FileText, Image, Loader2, X } from 'lucide-react';
import { AspectRatio } from './aspect-ratio';

interface ReceiptFile {
  name: string;
  preview?: string;
  type: string;
}

interface ReceiptDropzoneProps {
  /** Called when files are accepted */
  onFiles: (files: File[]) => void;
  /** Currently attached files to display */
  attachedFiles?: ReceiptFile[];
  /** Called when user removes an attached file */
  onRemove?: (index: number) => void;
  /** Whether upload is in progress */
  uploading?: boolean;
  /** Max number of files allowed. Default: 3 */
  maxFiles?: number;
}

/**
 * ReceiptDropzone
 * Drag-and-drop zone for attaching receipts, invoices, and bill photos
 * to expenditure records. Accepts images and PDFs.
 */
export function ReceiptDropzone({
  onFiles,
  attachedFiles = [],
  onRemove,
  uploading = false,
  maxFiles = 3,
}: ReceiptDropzoneProps) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted.length > 0) onFiles(accepted);
    },
    [onFiles]
  );

  const remaining = maxFiles - attachedFiles.length;

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'application/pdf': ['.pdf'],
    },
    maxSize: 10 * 1024 * 1024, // 10 MB per file
    maxFiles: remaining,
    disabled: uploading || remaining <= 0,
  });

  return (
    <div className="space-y-2">
      {/* Drop Zone */}
      {remaining > 0 && (
        <div
          {...getRootProps()}
          className={[
            'border-2 border-dashed rounded-lg p-4 text-center cursor-pointer select-none',
            'transition-all duration-200',
            isDragActive && !isDragReject
              ? 'border-primary bg-primary/10'
              : isDragReject
              ? 'border-destructive bg-destructive/10'
              : 'border-border hover:border-primary/40 hover:bg-muted/30',
            uploading ? 'opacity-50 cursor-not-allowed pointer-events-none' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <input {...getInputProps()} />

          {uploading ? (
            <Loader2 className="h-5 w-5 mx-auto mb-1 text-primary animate-spin" />
          ) : (
            <Paperclip
              className={`h-5 w-5 mx-auto mb-1 ${
                isDragActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            />
          )}

          <p className="text-xs font-medium text-foreground">
            {isDragActive
              ? 'Drop receipt here!'
              : isDragReject
              ? 'Only images and PDFs accepted'
              : `Attach receipt or invoice (${remaining} remaining)`}
          </p>
          <p className="text-[10px] text-muted-foreground/60 mt-0.5">
            PNG, JPG, PDF · Max 10 MB each
          </p>
        </div>
      )}

      {/* Attached Files List */}
      {attachedFiles.length > 0 && (
        <div className="space-y-1">
          {attachedFiles.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 p-2 bg-muted/40 rounded-md border border-border"
            >
              {file.type.startsWith('image/') && file.preview ? (
                <div className="w-8 h-8 rounded overflow-hidden shrink-0 border border-border bg-muted">
                  <AspectRatio ratio={1} className="w-full h-full">
                    <img src={file.preview} alt={file.name} className="w-full h-full object-cover" />
                  </AspectRatio>
                </div>
              ) : file.type.startsWith('image/') ? (
                <div className="w-8 h-8 rounded overflow-hidden shrink-0 bg-blue-500/10 flex items-center justify-center border border-border">
                  <AspectRatio ratio={1} className="w-full h-full flex items-center justify-center">
                    <Image className="h-4 w-4 text-blue-500" />
                  </AspectRatio>
                </div>
              ) : (
                <div className="w-8 h-8 rounded overflow-hidden shrink-0 bg-red-500/10 flex items-center justify-center border border-border">
                  <AspectRatio ratio={1} className="w-full h-full flex items-center justify-center">
                    <FileText className="h-4 w-4 text-red-500" />
                  </AspectRatio>
                </div>
              )}
              <span className="text-xs text-foreground flex-1 truncate">{file.name}</span>
              {onRemove && (
                <button
                  type="button"
                  onClick={() => onRemove(idx)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
