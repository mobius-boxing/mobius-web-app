import React, { useEffect, useState } from 'react';
import { FileRecord } from '../../types';
import { filesApi } from '../../services/api';
import FileUploader from './FileUploader';

interface FileRefUploaderProps {
  /** The stored files.uuid reference (entities persist only the uuid). */
  value?: string | null;
  onChange: (fileUuid: string | null) => void;
  label?: string;
  accept?: string;
  disabled?: boolean;
}

/**
 * Bridges uuid-referencing entity fields to the FileRecord-based FileUploader:
 * resolves the uuid to metadata for display, and reports back only the uuid.
 */
const FileRefUploader: React.FC<FileRefUploaderProps> = ({ value, onChange, label, accept, disabled }) => {
  const [record, setRecord] = useState<FileRecord | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!value) {
      setRecord(null);
      return;
    }
    if (record?.uuid === value) return;
    filesApi.getFile(value).then((file) => {
      if (!cancelled) setRecord(file);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <FileUploader
      value={record}
      onChange={(file) => {
        setRecord(file);
        onChange(file?.uuid ?? null);
      }}
      label={label}
      accept={accept}
      disabled={disabled}
    />
  );
};

export default FileRefUploader;
