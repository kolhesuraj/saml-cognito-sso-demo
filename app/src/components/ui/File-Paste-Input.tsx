import React, { useRef, useState } from "react";
import { File, FileUp } from "lucide-react";
import { Textarea } from "./textarea";
import { Button } from "./Button";

interface FilePasteInputProps {
  onChange: (content: string) => void;
  value?: string;
  name?: string;
  accept?: string;
}

const FilePasteInput: React.FC<FilePasteInputProps> = ({
  onChange,
  value,
  accept,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFileUploaded, setIsFileUploaded] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        const fileContent = typeof result === "string" ? result : "";
        onChange(fileContent);
        setIsFileUploaded(true);
      };
      reader.readAsText(file);
    }
  };

  const handlePaste = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    onChange(newContent);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setUploadedFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        const fileContent = typeof result === "string" ? result : "";
        onChange(fileContent);
        setIsFileUploaded(true);
      };
      reader.readAsText(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleClearSelection = () => {
    onChange("");
    setIsFileUploaded(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full">
      <div className="flex gap-4">
        <div className="w-1/3">
          <div
            className="h-[7rem] border-2 border-dashed border-gray-300 p-2 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition-colors"
            onClick={handleClick}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept={accept}
            />

            {isFileUploaded && uploadedFileName ? (
              <div className="mt-2 text-sm text-gray-700 text-center">
                <div className="flex flex-col items-center">
                  <File className="text-gray-500 mb-1" size={20} />
                  <strong>{uploadedFileName}</strong>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-2">
                <p className="text-gray-600">
                  Drop your x509.xml file here or click to browse
                </p>
                <p className="text-sm text-gray-500">Supported file: .cert</p>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-center text-sm text-gray-500">
          Or
        </div>
        <div className="w-2/3">
          <div className="relative h-[7rem]">
            <div className="absolute left-3 top-3 text-gray-500">
              <FileUp size={20} />
            </div>
            <Textarea
              className="w-full h-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Paste metadata content directly here..."
              value={value}
              onChange={handlePaste}
              disabled={isFileUploaded}
            />
          </div>
        </div>
      </div>
      {isFileUploaded && (
        <div className="mt-4 flex justify-tart">
          <Button
            onClick={handleClearSelection}
            className="px-4 py-2 bg-slate-400 text-white rounded-lg hover:bg-slate-600 transition-colors"
          >
            Clear Selection
          </Button>
        </div>
      )}
    </div>
  );
};

export default FilePasteInput;
