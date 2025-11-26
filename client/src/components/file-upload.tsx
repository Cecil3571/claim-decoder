import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
}

export function FileUpload({ onFileSelect, selectedFile }: FileUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    multiple: false,
  });

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect(null);
  };

  if (selectedFile) {
    return (
      <div className="relative group overflow-hidden rounded-xl border border-primary/20 bg-primary/5 p-6 transition-all hover:border-primary/40">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <FileText className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {selectedFile.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • PDF Document
            </p>
          </div>
          <button
            onClick={removeFile}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
           <CheckCircle className="h-4 w-4 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative cursor-pointer flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 bg-card p-10 text-center transition-all duration-200 ease-in-out hover:border-primary/50 hover:bg-accent/5",
        isDragActive && "border-primary bg-accent/10"
      )}
    >
      <input {...getInputProps()} />
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/30 mb-4 shadow-inner">
        <Upload className={cn("h-8 w-8 text-muted-foreground transition-colors", isDragActive && "text-primary")} />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">
        {isDragActive ? "Drop the policy here" : "Upload Policy PDF"}
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        Drag & drop your Declarations Page or full policy packet here.
      </p>
      <div className="mt-4 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
        PDF up to 50MB
      </div>
    </div>
  );
}
