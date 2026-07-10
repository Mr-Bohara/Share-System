import { useRef, useState, DragEvent, ChangeEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Upload, X, AlertCircle, CheckCircle, RotateCw, File as FileIcon, FileText, Send, ShieldAlert, Globe, Lock, Pause, Play } from "lucide-react";
import { ActiveUpload } from "../types";

interface UploadZoneProps {
  activeUploads: ActiveUpload[];
  onFilesSelected: (files: FileList, isPrivate: boolean, secretCode: string, isHidden: boolean) => void;
  onClearCompletedUploads: () => void;
  onShareText: (text: string, title?: string, isPrivate?: boolean, secretCode?: string, isHidden?: boolean) => void;
}

export default function UploadZone({
  activeUploads,
  onFilesSelected,
  onClearCompletedUploads,
  onShareText,
}: UploadZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [activeTab, setActiveTab] = useState<"file" | "text">("file");
  const [textContent, setTextContent] = useState("");
  const [textTitle, setTextTitle] = useState("");
  const [isSubmittingText, setIsSubmittingText] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [secretCode, setSecretCode] = useState("");
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
    if (isPrivate && !secretCode.trim()) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files, isPrivate, secretCode, isHidden);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (isPrivate && !secretCode.trim()) return;
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files, isPrivate, secretCode, isHidden);
    }
  };

  const triggerFileInput = () => {
    if (isPrivate && !secretCode.trim()) return;
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

  const hasMissingCode = isPrivate && !secretCode.trim();

  return (
    <div id="upload-zone-container" className="w-full flex flex-col gap-6">
      {/* Tabs Header */}
      <div id="upload-tabs" className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 shadow-xs">
        <button
          id="tab-file-btn"
          type="button"
          onClick={() => setActiveTab("file")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "file"
              ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-xs"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Upload Files</span>
        </button>
        <button
          id="tab-text-btn"
          type="button"
          onClick={() => setActiveTab("text")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "text"
              ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-xs"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Share Text</span>
        </button>
      </div>

      {/* Security Options Card */}
      <div className="p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex flex-col gap-3 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-indigo-500" />
            <span>Sharing Security</span>
          </span>
          <div className="flex bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/40 dark:border-slate-800/60">
            <button
              type="button"
              onClick={() => {
                setIsPrivate(false);
                setSecretCode("");
              }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                !isPrivate
                  ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-xs border border-slate-100 dark:border-slate-750"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              }`}
            >
              <Globe className="w-3 h-3" />
              <span>Public</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsPrivate(true);
                setSecretCode(Math.floor(1000 + Math.random() * 9000).toString());
              }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                isPrivate
                  ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-xs border border-slate-100 dark:border-slate-750"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              }`}
            >
              <Lock className="w-3 h-3" />
              <span>Private</span>
            </button>
          </div>
        </div>

        {isPrivate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="space-y-2 border-t border-slate-100 dark:border-slate-800/40 pt-3 flex flex-col"
          >
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Secret Access Code
              </label>
              <button
                type="button"
                onClick={() => setSecretCode(Math.floor(1000 + Math.random() * 9000).toString())}
                className="text-[10px] text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold flex items-center gap-1 cursor-pointer"
              >
                <RotateCw className="w-3 h-3" />
                <span>Regenerate</span>
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={16}
                placeholder="Type access code (e.g. 1234, secret)"
                value={secretCode}
                onChange={(e) => setSecretCode(e.target.value.replace(/\s+/g, ""))}
                className={`flex-1 px-3 py-2 rounded-xl border bg-slate-50/50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-200 text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${
                  hasMissingCode ? "border-rose-500 ring-2 ring-rose-500/10" : "border-slate-200 dark:border-slate-800"
                }`}
              />
            </div>
            {hasMissingCode ? (
              <p className="text-[10px] text-rose-500 font-semibold flex items-center gap-1 animate-pulse">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Secret code is required to lock private shares!</span>
              </p>
            ) : (
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                🔒 Files are encrypted on-the-fly. Decryption requires this exact code.
              </p>
            )}

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsHidden(!isHidden)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                  isHidden
                    ? "bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500"
                }`}
              >
                <div className={`w-8 h-4 rounded-full relative transition-colors ${isHidden ? "bg-indigo-500" : "bg-slate-300 dark:bg-slate-700"}`}>
                  <motion.div
                    animate={{ x: isHidden ? 18 : 2 }}
                    className="absolute top-1 w-2 h-2 bg-white rounded-full shadow-sm"
                  />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider">Hide from Public List</span>
              </button>
            </div>
          </motion.div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "file" ? (
          /* Drag & Drop Area */
          <motion.div
            key="file-pane"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            id="drop-zone"
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={triggerFileInput}
            whileHover={hasMissingCode ? {} : { scale: 1.005 }}
            whileTap={hasMissingCode ? {} : { scale: 0.995 }}
            className={`relative overflow-hidden cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300 flex flex-col items-center justify-center min-h-[220px] glass-panel ${
              hasMissingCode
                ? "border-rose-300/60 dark:border-rose-950 bg-rose-50/5 dark:bg-rose-950/5 cursor-not-allowed"
                : isDragActive
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
              disabled={hasMissingCode}
              onChange={handleFileChange}
            />

            <div className="absolute inset-0 bg-radial from-transparent to-transparent pointer-events-none opacity-40 dark:opacity-20" />

            <div className="flex flex-col items-center gap-3 relative z-10 pointer-events-none">
              <motion.div
                animate={isDragActive ? { y: -8, scale: 1.1 } : { y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className={`p-4 rounded-full ${
                  hasMissingCode
                    ? "bg-rose-100 text-rose-500 dark:bg-rose-950/40 dark:text-rose-400"
                    : isDragActive
                    ? "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-800/80 dark:text-slate-400"
                }`}
              >
                {hasMissingCode ? <Lock className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
              </motion.div>

              <div className="space-y-1">
                <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
                  {hasMissingCode
                    ? "Security Lock Active"
                    : isDragActive
                    ? "Drop files to share them!"
                    : "Drag & drop files here"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {hasMissingCode ? (
                    <span className="text-rose-500 font-medium">Please enter a secret code above to enable uploading</span>
                  ) : (
                    <>
                      or <span className="text-blue-500 font-medium">browse files</span> from your device
                    </>
                  )}
                </p>
              </div>
              
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">
                {isPrivate ? "🔒 Files are automatically encrypted before upload" : "Public sharing: anyone can access downloaded files"}
              </p>
            </div>
          </motion.div>
        ) : (
          /* Text share area */
          <motion.div
            key="text-pane"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col gap-4 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-xs"
          >
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                Note Title (Optional)
              </label>
              <input
                id="text-share-title"
                type="text"
                placeholder="e.g. Code snippet, server config, meeting logs..."
                value={textTitle}
                onChange={(e) => setTextTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                Text Content
              </label>
              <textarea
                id="text-share-content"
                rows={6}
                placeholder="Paste or type your links, code snippet, logs, or text notes here..."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono resize-none leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold pl-1">
              <span>{textContent.length} characters • {new Blob([textContent]).size} B</span>
              <span className={isPrivate ? "text-indigo-500 font-bold" : "text-slate-400"}>
                {isPrivate ? "🔒 Encrypted • Expire in 4h" : "Auto-destructs in 4 hours"}
              </span>
            </div>

            <button
              id="share-text-submit-btn"
              type="button"
              onClick={async () => {
                if (!textContent.trim() || hasMissingCode) return;
                setIsSubmittingText(true);
                try {
                  await onShareText(textContent, textTitle, isPrivate, secretCode, isHidden);
                  setTextContent("");
                  setTextTitle("");
                } finally {
                  setIsSubmittingText(false);
                }
              }}
              disabled={!textContent.trim() || isSubmittingText || hasMissingCode}
              className="w-full py-2.5 rounded-xl bg-linear-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-slate-100 disabled:to-slate-100 dark:disabled:from-slate-800/80 dark:disabled:to-slate-800/80 disabled:text-slate-400 text-white font-bold text-xs shadow-md shadow-indigo-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmittingText ? "Sharing..." : isPrivate ? "Share Private Text" : "Share Text Note"}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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
                      {upload.status === "paused" && (
                        <span className="text-[10px] font-mono text-amber-500 font-medium animate-pulse">
                          Paused ({Math.round(upload.progress)}%)
                        </span>
                      )}
                      {upload.status === "completed" && (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      )}
                      {upload.status === "failed" && (
                        <AlertCircle className="w-4 h-4 text-rose-500" />
                      )}

                      {/* Action buttons (Pause / Play / Cancel) */}
                      {upload.status === "uploading" && upload.pause && (
                        <button
                          id={`pause-upload-${upload.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            upload.pause?.();
                          }}
                          className="text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          title="Pause Upload"
                        >
                          <Pause className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {upload.status === "paused" && upload.resume && (
                        <button
                          id={`resume-upload-${upload.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            upload.resume?.();
                          }}
                          className="text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          title="Resume Upload"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {(upload.status === "uploading" || upload.status === "paused") && upload.cancel && (
                        <button
                          id={`cancel-upload-${upload.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            upload.cancel?.();
                          }}
                          className="text-slate-400 hover:text-rose-500 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          title="Cancel Upload"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {(upload.status === "failed" || upload.status === "cancelled") && upload.resume && (
                        <button
                          id={`retry-upload-${upload.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            upload.resume?.();
                          }}
                          className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-center"
                          title="Retry Upload"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  {(upload.status === "uploading" || upload.status === "paused") && (
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 rounded-full overflow-hidden relative z-10">
                      <motion.div
                        className={`h-full rounded-full ${upload.status === "paused" ? "bg-amber-500" : "bg-linear-to-r from-blue-500 to-indigo-500"}`}
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
