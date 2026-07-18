import React, { useRef, useState } from 'react';
import { Upload, Download, X, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FileRecord } from '../../types';
import { filesApi } from '../../services/api';
import Button from './Button';
import { logger } from '../../utils/logger';

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

interface FileUploaderProps {
  value?: FileRecord | null;
  onChange: (file: FileRecord | null) => void;
  label?: string;
  accept?: string;
  disabled?: boolean;
}

const formatSize = (bytes?: number | null): string => {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Generic attachment control backed by /api/files. Removing clears the
 * reference only (onChange(null)) — the file row stays server-side; deletion
 * belongs to the consuming entity's lifecycle.
 */
const FileUploader: React.FC<FileUploaderProps> = ({
  value,
  onChange,
  label,
  accept,
  disabled,
}) => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePick = () => {
    setError(null);
    inputRef.current?.click();
  };

  const handleFileSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(t('fileUploader.tooLarge'));
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const created = await filesApi.uploadFile(file);
      onChange(created);
    } catch (err: any) {
      logger.error('File upload failed:', err);
      setError(err?.response?.data?.message || t('fileUploader.uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async () => {
    if (!value) return;
    try {
      await filesApi.downloadFile(value);
    } catch (err: any) {
      logger.error('File download failed:', err);
      setError(t('fileUploader.downloadFailed'));
    }
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-secondary-700 mb-1">
          {label}
        </label>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelected}
        className="hidden"
      />

      {value ? (
        <div className="flex items-center justify-between rounded-md border border-secondary-200 bg-secondary-50 px-3 py-2">
          <div className="flex items-center space-x-2 min-w-0">
            <FileText className="h-4 w-4 text-secondary-400 shrink-0" />
            <span className="text-sm text-secondary-900 truncate">
              {value.originalName}
            </span>
            {value.sizeBytes ? (
              <span className="text-xs text-secondary-500 shrink-0">
                {formatSize(value.sizeBytes)}
              </span>
            ) : null}
          </div>
          <div className="flex items-center space-x-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              disabled={disabled}
              title={t('fileUploader.download')}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange(null)}
              disabled={disabled}
              className="text-red-600 hover:text-red-700"
              title={t('fileUploader.remove')}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="secondary"
          onClick={handlePick}
          disabled={disabled || uploading}
          className="inline-flex items-center"
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? t('fileUploader.uploading') : t('fileUploader.choose')}
        </Button>
      )}

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default FileUploader;
