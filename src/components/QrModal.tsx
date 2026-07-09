import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Download, Copy, Check, ExternalLink, QrCode } from "lucide-react";
import { SharedFile } from "../types";
import QRCode from "qrcode";

interface QrModalProps {
  file: SharedFile | null;
  onClose: () => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function QrModal({ file, onClose, addToast }: QrModalProps) {
  const [qrSrc, setQrSrc] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (file) {
      // Generate clean QR code offline
      QRCode.toDataURL(
        file.downloadUrl,
        {
          width: 300,
          margin: 1.5,
          color: {
            dark: "#0f172a", // slate-900 for premium contrast
            light: "#ffffff",
          },
          errorCorrectionLevel: "H",
        },
        (err, url) => {
          if (err) {
            console.error("QR Code generation error:", err);
            addToast("Failed to generate QR code", "error");
          } else {
            setQrSrc(url);
          }
        }
      );
    }
  }, [file, addToast]);

  if (!file) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(file.downloadUrl);
      setCopied(true);
      addToast("Download link copied to clipboard!", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      addToast("Failed to copy link.", "error");
    }
  };

  const handleDownloadQr = () => {
    if (!qrSrc) return;
    const link = document.createElement("a");
    link.href = qrSrc;
    // Sanitize filename to avoid weird characters in download filename
    const safeName = file.filename.replace(/[^a-z0-9.]/gi, "_");
    link.download = `${safeName}-qr-code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast("QR Code image downloaded!", "success");
  };

  return (
    <AnimatePresence>
      <div id="qr-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
          id="qr-modal-panel"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", duration: 0.4 }}
          className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/60 dark:border-slate-800/80 overflow-hidden flex flex-col z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-950/20">
            <div className="flex items-center gap-2.5 min-w-0 pr-4">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 rounded-lg shrink-0">
                <QrCode className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                  Share QR Code
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  {file.filename}
                </p>
              </div>
            </div>

            <button
              id="qr-modal-close-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 flex flex-col items-center gap-5 text-center">
            {/* QR Card Container */}
            <div className="relative group p-4 bg-white rounded-2xl shadow-md border border-slate-100/80 flex items-center justify-center">
              {qrSrc ? (
                <motion.img
                  id="qr-code-image"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  src={qrSrc}
                  alt="Download link QR code"
                  className="w-48 h-48 block rounded-lg select-none"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-slate-400 dark:text-slate-600">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal max-w-xs">
                Scan this QR code with any mobile camera to download the file directly to another device.
              </p>
            </div>

            {/* Input field with Copy link */}
            <div className="w-full flex items-center gap-2 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 text-left">
              <span className="text-[11px] text-slate-600 dark:text-slate-400 font-mono truncate flex-1 pl-2 select-all">
                {file.downloadUrl}
              </span>
              <button
                id="qr-modal-copy-btn"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-xs"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-500 animate-scale" />
                    <span className="text-emerald-500">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Footer Action Panel */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-950/20 flex gap-2">
            <button
              id="qr-modal-download-image-btn"
              onClick={handleDownloadQr}
              disabled={!qrSrc}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5" />
              Download QR Image
            </button>
            <a
              id="qr-modal-external-link"
              href={file.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 transition-all cursor-pointer"
              title="Open link in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
