import { useRef } from 'react';
import { Button, Message, Space, Typography } from '@arco-design/web-react';
import { IconFile, IconUpload } from '@arco-design/web-react/icon';
import {
  SCRIPT_FILE_ACCEPT,
  SCRIPT_FILE_EXTENSIONS,
  SCRIPT_FILE_MAX_SIZE,
  SCRIPT_FILE_TIP,
} from '../../api/testScripts';
import { formatFileSize } from '../../utils/format';
import './ScriptFilePicker.scss';

function validateFile(file) {
  const extension = `.${file.name.split('.').pop()?.toLowerCase() || ''}`;
  if (!SCRIPT_FILE_EXTENSIONS.includes(extension)) {
    return `不支持 ${extension || '无扩展名'} 文件`;
  }
  if (file.size > SCRIPT_FILE_MAX_SIZE) {
    return `文件不能超过 ${formatFileSize(SCRIPT_FILE_MAX_SIZE)}`;
  }
  return null;
}

/**
 * 脚本文件选择器。
 *
 * 只负责选择本地文件，真正上传由保存动作调用 API 完成。
 * 编辑时如果没有选择新文件，展示当前文件信息。
 */
export default function ScriptFilePicker({
  value,
  onChange,
  disabled = false,
  currentFileName,
  currentFileSize,
}) {
  const inputRef = useRef(null);
  const selectedFile = value instanceof File ? value : null;

  const handleSelect = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      Message.error(error);
      return;
    }
    onChange?.(file);
  };

  const handleRemove = () => {
    onChange?.(null);
  };

  return (
    <div
      className={`script-file-picker ${selectedFile ? 'script-file-picker--selected' : ''}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={SCRIPT_FILE_ACCEPT}
        hidden
        disabled={disabled}
        onChange={handleSelect}
      />
      <div className="script-file-picker__body">
        <div className="script-file-picker__icon">
          <IconFile />
        </div>
        <div className="script-file-picker__meta">
          <Typography.Text className="script-file-picker__name">
            {selectedFile?.name || currentFileName || '尚未选择脚本文件'}
          </Typography.Text>
          <Typography.Text type="secondary" className="script-file-picker__hint">
            {selectedFile
              ? `新文件 · ${formatFileSize(selectedFile.size)}`
              : currentFileName
                ? `当前文件 · ${formatFileSize(currentFileSize)}`
                : '点击右侧按钮选择本地脚本文件'}
          </Typography.Text>
        </div>
        <Space>
          <Button
            type={selectedFile ? 'secondary' : 'primary'}
            icon={<IconUpload />}
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
          >
            {selectedFile ? '重新选择' : currentFileName ? '替换文件' : '选择文件'}
          </Button>
          {selectedFile && (
            <Button type="text" disabled={disabled} onClick={handleRemove}>
              移除
            </Button>
          )}
        </Space>
      </div>
      <Typography.Text type="secondary" className="script-file-picker__tip">
        {SCRIPT_FILE_TIP}
      </Typography.Text>
    </div>
  );
}
