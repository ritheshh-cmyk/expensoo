import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Loader2 } from 'lucide-react';

interface AvatarDropzoneProps {
  /** Called with the accepted File when user drops or picks one */
  onFile: (file: File) => void;
  /** Whether an upload is currently in progress */
  uploading?: boolean;
}

/**
 * AvatarDropzone
 * Drag-and-drop zone for profile avatar uploads.
 * Accepts image files up to 5 MB. Shows active drag state.
 */
export function AvatarDropzone({ onFile, uploading = false }: AvatarDropzoneProps) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted[0]) onFile(accepted[0]);
    },
    [onFile]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxSize: 5 * 1024 * 1024, // 5 MB
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <div
      {...getRootProps()}
      className={[
        'border-2 border-dashed rounded-xl p-5 text-center cursor-pointer select-none',
        'transition-all duration-200',
        isDragActive && !isDragReject
          ? 'border-primary bg-primary/10 scale-[1.02] shadow-inner'
          : isDragReject
          ? 'border-destructive bg-destructive/10'
          : 'border-border hover:border-primary/50 hover:bg-muted/40',
        uploading ? 'opacity-50 cursor-not-allowed pointer-events-none' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <input {...getInputProps()} />

      {uploading ? (
        <Loader2 className="h-7 w-7 mx-auto mb-2 text-primary animate-spin" />
      ) : (
        <Upload
          className={`h-7 w-7 mx-auto mb-2 transition-colors ${
            isDragActive ? 'text-primary' : 'text-muted-foreground'
          }`}
        />
      )}

      <p className="text-sm font-medium text-foreground">
        {uploading
          ? 'Uploading…'
          : isDragActive
          ? 'Drop your photo here!'
          : isDragReject
          ? 'Only image files are accepted'
          : 'Drag & drop or click to upload photo'}
      </p>
      <p className="text-xs text-muted-foreground/70 mt-1">
        PNG, JPG, WEBP · Max 5 MB
      </p>
    </div>
  );
}
