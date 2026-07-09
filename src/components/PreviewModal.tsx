import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Download, FileText, File as FileIcon, ExternalLink, RefreshCw, AlertCircle } from "lucide-react";
import { SharedFile } from "../types";

interface PreviewModalProps {
  file: SharedFile | null;
  onClose: () => void;
  onDownload: (file: SharedFile) => void;
}

export default function PreviewModal({ file, onClose, onDownload }: PreviewModalProps) {
  const [textContent, setTextContent] = useState<string>("");
  const [loadingText, setLoadingText] = useState<boolean>(false);
  const [textError, setTextError] = useState<boolean>(false);

  // Determine file categories from mimeType or extension
  const isImage = file?.mimeType.startsWith("image/") && !file?.isText;
  const isVideo = file?.mimeType.startsWith("video/") && !file?.isText;
  const isAudio = file?.mimeType.startsWith("audio/") && !file?.isText;
  const isPDF = (file?.mimeType === "application/pdf" || file?.filename.toLowerCase().endsWith(".pdf")) && !file?.isText;
  
  const textExtensions = [".txt", ".js", ".ts", ".tsx", ".json", ".html", ".css", ".md", ".xml", ".csv", ".yml", ".yaml"];
  const isText = file?.isText ||
                 file?.mimeType.startsWith("text/") || 
                 (file && textExtensions.some(ext => file.filename.toLowerCase().endsWith(ext))) ||
                 file?.mimeType === "application/json";

  useEffect(() => {
    if (file && isText) {
      if (file.isText && file.textContent !== undefined) {
        setTextContent(file.textContent);
        setLoadingText(false);
        setTextError(false);
        return;
      }
      setLoadingText(true);
      setTextError(false);
      setTextContent("");
      
      fetch(file.downloadUrl)
        .then((res) => {
          if (!res.ok) throw new Error("Could not read file");
          return res.text();
        })
        .then((text) => {
          // Limit preview to first 100KB for performance
          if (text.length > 100000) {
            setTextContent(text.substring(0, 100000) + "\n\n... [Content truncated for preview performance] ...");
          } else {
            setTextContent(text);
          }
          setLoadingText(false);
        })
        .catch((err) => {
          console.error("Error loading text preview:", err);
          setTextError(true);
          setLoadingText(false);
        });
    }
  }, [file, isText]);

  if (!file) return null;

  return (
    <AnimatePresence>
      <div id="preview-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm dark:bg-black/80"
        />

        {/* Modal Panel */}
        <motion.div
          id="preview-modal-panel"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", duration: 0.4 }}
          className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/60 dark:border-slate-800/80 overflow-hidden flex flex-col max-h-[85vh] z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-950/20">
            <div className="flex items-center gap-3 min-w-0 pr-4">
              <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg shrink-0">
                <FileIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                  {file.filename}
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Type: {file.mimeType}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                id="modal-download-btn"
                onClick={() => onDownload(file)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white shadow-sm transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
              <button
                id="modal-close-btn"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/20 dark:bg-slate-950/40 flex items-center justify-center min-h-[300px]">
            {/* 1. Image Preview */}
            {isImage && (
              <div className="flex flex-col items-center justify-center w-full h-full max-h-[60vh]">
                <img
                  id="preview-img"
                  src={file.downloadUrl}
                  alt={file.filename}
                  referrerPolicy="no-referrer"
                  className="max-w-full max-h-[55vh] object-contain rounded-lg border border-slate-200/50 dark:border-slate-800 shadow-md bg-white dark:bg-slate-900"
                />
              </div>
            )}

            {/* 2. Video Preview */}
            {isVideo && (
              <div className="w-full max-w-2xl aspect-video rounded-xl overflow-hidden border border-slate-200/50 dark:border-slate-800 shadow-lg bg-black flex items-center justify-center">
                <video
                  id="preview-video"
                  src={file.downloadUrl}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            {/* 3. Audio Preview */}
            {isAudio && (
              <div className="w-full max-w-md flex flex-col items-center gap-6 p-8 rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900/90 text-center">
                {/* Vinyl sound animation */}
                <div className="relative flex items-center justify-center w-28 h-28 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-inner">
                  <div className="absolute inset-4 rounded-full border-4 border-slate-300 dark:border-slate-600 animate-spin [animation-duration:8s] flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-slate-950 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[280px]">
                    {file.filename}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Audio stream player
                  </p>
                </div>

                <audio
                  id="preview-audio"
                  src={file.downloadUrl}
                  controls
                  autoPlay
                  className="w-full focus:outline-hidden"
                />
              </div>
            )}

            {/* 4. PDF Preview */}
            {isPDF && (
              <div className="w-full h-full min-h-[50vh] flex flex-col items-center gap-4">
                <iframe
                  id="preview-pdf-frame"
                  src={`${file.downloadUrl}#toolbar=0`}
                  title={file.filename}
                  className="w-full flex-1 min-h-[48vh] rounded-xl border border-slate-200 dark:border-slate-800 shadow-md bg-white"
                />
                <a
                  id="preview-pdf-external"
                  href={file.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 font-medium transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open PDF in new tab if embed is blocked</span>
                </a>
              </div>
            )}

            {/* 5. Text / Code Preview */}
            {isText && (
              <div className="w-full h-full max-h-[55vh] flex flex-col rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-inner bg-slate-950 text-slate-200 overflow-hidden font-mono text-xs">
                {loadingText && (
                  <div className="flex flex-col items-center justify-center flex-1 p-12 gap-3 text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                    <p>Fetching text contents...</p>
                  </div>
                )}

                {textError && (
                  <div className="flex flex-col items-center justify-center flex-1 p-12 gap-3 text-rose-400 text-center">
                    <AlertCircle className="w-6 h-6 shrink-0" />
                    <p>Failed to load preview for this file.</p>
                    <p className="text-[10px] text-slate-500 max-w-sm">
                      This can occur due to CORS boundaries on fresh Firebase assets. You can still download the file directly.
                    </p>
                  </div>
                )}

                {!loadingText && !textError && (
                  <pre className="flex-1 overflow-auto p-4 leading-relaxed text-left max-h-[50vh] whitespace-pre-wrap selection:bg-blue-600 selection:text-white">
                    {textContent || "[Empty text file]"}
                  </pre>
                )}
              </div>
            )}

            {/* 6. Unsupported Fallback */}
            {!isImage && !isVideo && !isAudio && !isPDF && !isText && (
              <div className="text-center p-8 max-w-sm flex flex-col items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 shadow-lg rounded-2xl">
                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400">
                  <FileText className="w-10 h-10" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    No preview available
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                    Format (.{file.filename.split(".").pop()}) is not supported for browser inline preview. Please download the file to inspect it on your device.
                  </p>
                </div>
                <button
                  id="fallback-download-btn"
                  onClick={() => onDownload(file)}
                  className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-xs font-semibold bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white transition-all shadow-sm cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download File</span>
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
