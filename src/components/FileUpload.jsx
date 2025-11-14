// src/components/FileUpload.jsx
'use client';

import { useState, useRef } from 'react';
import { Upload } from 'lucide-react';

export default function FileUpload({ 
  onUpload, 
  accept = "image/*,video/*",
  multiple = true,
  disabled = false,
  className = ""
}) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await handleFiles(files);
    }
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      await handleFiles(files);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFiles = async (files) => {
    setUploading(true);
    try {
      await onUpload(files);
    } catch (error) {
      console.error('Upload error:', error);
      alert(error.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={className}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-lg p-8
          transition-all cursor-pointer
          ${dragging 
            ? 'border-gold-500 bg-gold-500/10' 
            : 'border-border bg-surface/30 hover:bg-surface/50'
          }
          ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          disabled={disabled || uploading}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center gap-3 text-center">
          <div className={`rounded-full p-4 ${dragging ? 'bg-gold-500/20' : 'bg-surface/70'}`}>
            <Upload className={`h-8 w-8 ${dragging ? 'text-gold-500' : 'text-muted'}`} />
          </div>

          {uploading ? (
            <>
              <p className="text-base font-medium text-text">Uploading files...</p>
              <div className="w-48 h-2 bg-surface rounded-full overflow-hidden">
                <div className="h-full bg-gold-500 animate-pulse" style={{ width: '100%' }} />
              </div>
            </>
          ) : (
            <>
              <p className="text-base font-medium text-text">
                {dragging ? 'Drop files here' : 'Drop files here or click to browse'}
              </p>
              <p className="text-sm text-muted">
                Supports images and videos • {multiple ? 'Multiple files' : 'Single file'}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
