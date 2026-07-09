import { useRef, useState, DragEvent, ChangeEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Upload, X, AlertCircle, CheckCircle, RotateCw, File as FileIcon } from "lucide-react";
import { ActiveUpload } from "../types";

interface UploadZoneProps {
  activeUploads: ActiveUpload[];
  onFilesSelected: (files: FileList) => void;
  onClearCompletedUploads: () => void;
}

export default function UploadZone({
  activeUploads,
  onFilesSelected,
  onClearCompletedUploads,
}: UploadZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Helper to format sizes nicely
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const completedUploads = activeUploads.filter((u) => u.status === "completed");

  return (
    <div id="upload-zone-container" className="w-full flex flex-col gap-6">
      {/* Drag & Drop Area */}
      <motion.div
        id="drop-zone"
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.995 }}
        className={`relative overflow-hidden cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300 flex flex-col items-center justify-center min-h-[220px] glass-panel ${
          isDragActive
            ? "border-blue-500 bg-blue-50/20 dark:bg-blue-950/10 shadow-indigo-500/10 shadow-xl"
            : "border-slate-300 dark:border-slate-700/80 hover:border-slate-400 dark:hover:border-slate-500/80 hover:shadow-lg hover:shadow-slate-500/5 dark:hover:shadow-indigo-500/5"
        }`}
      >
        <input
          id="file-input"
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          onChange={handleFileChange}
        />

        <div className="absolute inset-0 bg-radial from-transparent to-transparent pointer-events-none opacity-40 dark:opacity-20" />

        <div className="flex flex-col items-center gap-3 relative z-10 pointer-events-none">
          <motion.div
            animate={isDragActive ? { y: -8, scale: 1.1 } : { y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            className={`p-4 rounded-full ${
              isDragActive
                ? "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
                : "bg-slate-100 text-slate-500 dark:bg-slate-800/80 dark:text-slate-400"
            }`}
          >
            <Upload className="w-8 h-8" />
          </motion.div>

          <div className="space-y-1">
            <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
              {isDragActive ? "Drop files to share them!" : "Drag & drop files here"}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              or <span className="text-blue-500 font-medium">browse files</span> from your device
            </p>
          </div>
          
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">
            Supports any file format (Images, PDF, Video, Audio, Archives) up to 10 GB
          </p>
        </div>
      </motion.div>

      {/* Active & Historical Upload Progress Tracker */}
      {activeUploads.length > 0 && (
        <div id="uploads-tracker" className="glass-panel border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              Uploading Queue ({activeUploads.length})
            </h3>
            {completedUploads.length > 0 && (
              <button
                id="clear-completed-uploads"
                onClick={onClearCompletedUploads}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                Clear Completed
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {activeUploads.map((upload) => (
                <motion.div
                  key={upload.id}
                  id={`upload-item-${upload.id}`}
                  initial={{ opacity: 0, height: 0, scale: 0.95 }}
                  animate={{ opacity: 1, height: "auto", scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.95, transition: { duration: 0.2 } }}
                  className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col gap-2.5 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-3 relative z-10">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg shrink-0">
                        <FileIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate pr-2">
                          {upload.filename}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {formatBytes(upload.size)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {upload.status === "uploading" && (
                        <span className="text-[10px] font-mono text-blue-500 font-medium">
                          {Math.round(upload.progress)}%
                        </span>
                      )}
                      {upload.status === "completed" && (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      )}
                      {upload.status === "failed" && (
                        <AlertCircle className="w-4 h-4 text-rose-500" />
                      )}

                      {/* Action buttons (Cancel / Retry) */}
                      {upload.status === "uploading" && upload.cancel && (
                        <button
                          id={`cancel-upload-${upload.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            upload.cancel?.();
                          }}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          title="Cancel Upload"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {(upload.status === "failed" || upload.status === "cancelled") && upload.retry && (
                        <button
                          id={`retry-upload-${upload.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            upload.retry?.();
                          }}
                          className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-center"
                          title="Retry Upload"
                        >
                          <RotateCw className="w-3.5 h-3.5 animate-hover:spin" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  {upload.status === "uploading" && (
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 rounded-full overflow-hidden relative z-10">
                      <motion.div
                        className="bg-linear-to-r from-blue-500 to-indigo-500 h-full rounded-full"
                        style={{ width: `${upload.progress}%` }}
                        transition={{ duration: 0.1 }}
                      />
                    </div>
                  )}

                  {upload.status === "failed" && (
                    <p className="text-[10px] font-medium text-rose-500 leading-normal pl-0.5">
                      Error: {upload.error || "Upload failed. Please check network."}
                    </p>
                  )}

                  {upload.status === "cancelled" && (
                    <p className="text-[10px] font-medium text-slate-500 leading-normal pl-0.5">
                      Upload cancelled.
                    </p>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
