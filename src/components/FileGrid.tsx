import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  ArrowUpDown,
  Download,
  Eye,
  Trash2,
  Clock,
  File as FileIcon,
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  Music as MusicIcon,
  Archive,
  Code2,
  ListFilter,
  Grid,
  List,
  Copy,
  Check,
  QrCode
} from "lucide-react";
import { SharedFile, SortField } from "../types";
import QrModal from "./QrModal";

interface FileGridProps {
  files: SharedFile[];
  onDelete: (file: SharedFile) => void;
  onPreview: (file: SharedFile) => void;
  onDownload: (file: SharedFile) => void;
  onExpired: (file: SharedFile) => void;
  loading: boolean;
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  currentAuthUid: string | null;
}

export default function FileGrid({
  files,
  onDelete,
  onPreview,
  onDownload,
  onExpired,
  loading,
  addToast,
  currentAuthUid
}: FileGridProps) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("newest");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeQrFile, setActiveQrFile] = useState<SharedFile | null>(null);

  // Keep current time updated every second for countdowns
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Copy download link to clipboard
  const handleCopyLink = async (file: SharedFile, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(file.downloadUrl);
      setCopiedId(file.id);
      addToast("Download link copied to clipboard!", "success");
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      addToast("Failed to copy link.", "error");
    }
  };

  // Helper to format bytes
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // Helper to get matching Lucide icon and color
  const getFileIcon = (file: SharedFile) => {
    const ext = file.filename.split(".").pop()?.toLowerCase();
    const mime = file.mimeType.toLowerCase();

    if (mime.startsWith("image/")) {
      return {
        icon: <ImageIcon className="w-5 h-5 text-indigo-500" />,
        bg: "bg-indigo-50 dark:bg-indigo-950/20"
      };
    }
    if (mime.startsWith("video/")) {
      return {
        icon: <VideoIcon className="w-5 h-5 text-purple-500" />,
        bg: "bg-purple-50 dark:bg-purple-950/20"
      };
    }
    if (mime.startsWith("audio/")) {
      return {
        icon: <MusicIcon className="w-5 h-5 text-emerald-500" />,
        bg: "bg-emerald-50 dark:bg-emerald-950/20"
      };
    }
    if (mime === "application/pdf" || ext === "pdf") {
      return {
        icon: <FileText className="w-5 h-5 text-rose-500" />,
        bg: "bg-rose-50 dark:bg-rose-950/20"
      };
    }
    const archiveExtensions = ["zip", "rar", "tar", "gz", "7z"];
    if (archiveExtensions.includes(ext || "")) {
      return {
        icon: <Archive className="w-5 h-5 text-amber-500" />,
        bg: "bg-amber-50 dark:bg-amber-950/20"
      };
    }
    const codeExtensions = ["js", "ts", "tsx", "jsx", "html", "css", "py", "json", "md", "cpp", "java", "sh"];
    if (codeExtensions.includes(ext || "")) {
      return {
        icon: <Code2 className="w-5 h-5 text-blue-500" />,
        bg: "bg-blue-50 dark:bg-blue-950/20"
      };
    }
    return {
      icon: <FileIcon className="w-5 h-5 text-slate-500" />,
      bg: "bg-slate-50 dark:bg-slate-900/30"
    };
  };

  // Filters & categorization logic
  const getFileCategory = (file: SharedFile): string => {
    const mime = file.mimeType.toLowerCase();
    const ext = file.filename.split(".").pop()?.toLowerCase();
    
    if (mime.startsWith("image/")) return "images";
    if (mime.startsWith("video/") || mime.startsWith("audio/")) return "media";
    if (mime === "application/pdf" || ext === "pdf" || ext === "doc" || ext === "docx" || ext === "txt") return "documents";
    return "others";
  };

  // Process live countdown and handle expiry
  const renderCountdown = (file: SharedFile) => {
    const timeLeft = file.expiresAt - currentTime;
    
    if (timeLeft <= 0) {
      // Trigger live expiry
      setTimeout(() => onExpired(file), 0);
      return "Expired";
    }

    const totalSeconds = Math.floor(timeLeft / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    return `${minutes}m ${seconds}s`;
  };

  // Filter and Search
  const filteredFiles = files.filter((file) => {
    // 1. Skip expired files on frontend
    if (file.expiresAt <= currentTime) return false;

    // 2. Search query match
    const ext = file.filename.split(".").pop()?.toLowerCase() || "";
    const matchesSearch =
      file.filename.toLowerCase().includes(search.toLowerCase()) ||
      ext.includes(search.toLowerCase()) ||
      file.mimeType.toLowerCase().includes(search.toLowerCase());

    // 3. Category match
    const category = getFileCategory(file);
    const matchesCategory = activeCategory === "all" || category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  // Sort files
  const sortedFiles = [...filteredFiles].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return b.uploadedAt - a.uploadedAt;
      case "oldest":
        return a.uploadedAt - b.uploadedAt;
      case "name":
        return a.filename.localeCompare(b.filename);
      case "size":
        return b.size - a.size;
      case "type":
        return a.mimeType.localeCompare(b.mimeType);
      default:
        return 0;
    }
  });

  const categories = [
    { id: "all", label: "All Files" },
    { id: "images", label: "Images" },
    { id: "media", label: "Audio & Video" },
    { id: "documents", label: "Documents" },
    { id: "others", label: "Others" },
  ];

  return (
    <div id="file-grid-container" className="w-full flex flex-col gap-6">
      {/* Control Panel: Search, Sort, View, Filters */}
      <div className="flex flex-col gap-4">
        {/* Search & Sort Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 dark:text-slate-500" />
            <input
              id="file-search-input"
              type="text"
              placeholder="Search by filename, extension, or type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10.5 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-xs"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Sort Select */}
            <div className="relative flex-1 sm:flex-none">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
              <select
                id="file-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortField)}
                className="w-full sm:w-[150px] pl-9.5 pr-8 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-xs appearance-none cursor-pointer font-medium"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="name">Name A-Z</option>
                <option value="size">Size (Large)</option>
                <option value="type">File Type</option>
              </select>
            </div>

            {/* Layout Toggle */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-1 flex items-center bg-white/50 dark:bg-slate-900/40 shadow-xs">
              <button
                id="view-grid-btn"
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                }`}
                title="Grid View"
              >
                <Grid className="w-4.5 h-4.5" />
              </button>
              <button
                id="view-list-btn"
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === "list"
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                }`}
                title="List View"
              >
                <List className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Categories / Filter Chips */}
        <div id="filter-chips-container" className="flex items-center gap-1.5 overflow-x-auto pb-1 pr-4 no-scrollbar">
          <ListFilter className="w-4 h-4 text-slate-400 shrink-0 mr-1.5 hidden md:block" />
          {categories.map((category) => (
            <button
              key={category.id}
              id={`filter-chip-${category.id}`}
              onClick={() => setActiveCategory(category.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 cursor-pointer transition-all ${
                activeCategory === category.id
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200/85 dark:hover:bg-slate-800 border border-slate-200/20 dark:border-slate-800/20"
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* File Listings */}
      {loading ? (
        /* Loading Skeletons */
        <div
          id="loading-skeletons"
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
              : "flex flex-col gap-3"
          }
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="p-5 border border-slate-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 animate-pulse flex flex-col gap-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded-sm w-3/4" />
                  <div className="h-2.5 bg-slate-200 dark:bg-slate-800 rounded-sm w-1/3" />
                </div>
              </div>
              <div className="h-12 bg-slate-100 dark:bg-slate-800/50 rounded-xl w-full" />
            </div>
          ))}
        </div>
      ) : sortedFiles.length === 0 ? (
        /* Empty State */
        <motion.div
          id="empty-files-panel"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-12 text-center rounded-2xl border border-slate-200/50 dark:border-slate-800/50 glass-panel shadow-xs flex flex-col items-center justify-center min-h-[250px]"
        >
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-full text-slate-400 dark:text-slate-500 mb-4">
            <FileIcon className="w-8 h-8" />
          </div>
          <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
            {search || activeCategory !== "all" ? "No matching files" : "No files shared yet"}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 leading-normal">
            {search || activeCategory !== "all"
              ? "Try adjusting your search query or select another category filter above."
              : "Grab a file from your file explorer and drop it in the box above to get started."}
          </p>
        </motion.div>
      ) : (
        /* Main Grid/List Container */
        <div id="file-listing-grid" className="relative">
          <AnimatePresence mode="popLayout">
            {viewMode === "grid" ? (
              /* GRID VIEW */
              <motion.div
                layout
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
              >
                {sortedFiles.map((file) => {
                  const fileIconInfo = getFileIcon(file);
                  const isOwner = file.uploaderUid === currentAuthUid;
                  
                  return (
                    <motion.div
                      layout
                      key={file.id}
                      id={`file-card-${file.id}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                      className="group border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-4 flex flex-col gap-4 relative overflow-hidden glass-panel hover:border-slate-300 dark:hover:border-slate-700/80 transition-all hover:shadow-md"
                    >
                      {/* Top Row: Icon, Title & Actions */}
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`p-3 rounded-xl ${fileIconInfo.bg} shrink-0`}>
                            {fileIconInfo.icon}
                          </div>
                          <div className="min-w-0">
                            <h4
                              className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate pr-1 cursor-pointer hover:text-blue-500 transition-colors"
                              onClick={() => onPreview(file)}
                              title="Click to preview file"
                            >
                              {file.filename}
                            </h4>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {formatBytes(file.size)}
                            </p>
                          </div>
                        </div>

                        {/* Owner Badge / Action Drop */}
                        {isOwner && (
                          <span className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 rounded-md shrink-0">
                            Uploader
                          </span>
                        )}
                      </div>

                      {/* Expiry Tracker Card */}
                      <div className="py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/50 flex items-center justify-between text-[10px] font-medium text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Expires In:</span>
                        </span>
                        <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                          {renderCountdown(file)}
                        </span>
                      </div>

                      {/* Bottom Quick-Action Panel */}
                      <div className="grid grid-cols-5 gap-1.5 mt-auto">
                        <button
                          id={`preview-btn-${file.id}`}
                          onClick={() => onPreview(file)}
                          className="flex items-center justify-center gap-1 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all text-[11px] font-semibold cursor-pointer"
                          title="Preview File"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`download-btn-${file.id}`}
                          onClick={() => onDownload(file)}
                          className="flex items-center justify-center gap-1 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all text-[11px] font-semibold cursor-pointer"
                          title="Download File"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`qr-btn-${file.id}`}
                          onClick={() => setActiveQrFile(file)}
                          className="flex items-center justify-center gap-1 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all text-[11px] font-semibold cursor-pointer"
                          title="Share QR Code"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`copy-btn-${file.id}`}
                          onClick={(e) => handleCopyLink(file, e)}
                          className="flex items-center justify-center gap-1 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all text-[11px] font-semibold cursor-pointer relative"
                          title="Copy Link"
                        >
                          {copiedId === file.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          id={`delete-btn-${file.id}`}
                          onClick={() => onDelete(file)}
                          className="flex items-center justify-center gap-1 py-1.5 rounded-lg border border-rose-100 hover:border-rose-200 dark:border-rose-950/40 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/15 cursor-pointer transition-all text-[11px] font-semibold"
                          title="Delete File Permanently"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              /* LIST VIEW */
              <motion.div
                layout
                className="flex flex-col gap-2"
              >
                {sortedFiles.map((file) => {
                  const fileIconInfo = getFileIcon(file);
                  const isOwner = file.uploaderUid === currentAuthUid;

                  return (
                    <motion.div
                      layout
                      key={file.id}
                      id={`file-row-${file.id}`}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="group border border-slate-200/50 dark:border-slate-800/60 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 glass-panel hover:border-slate-300 dark:hover:border-slate-700/85 transition-all shadow-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`p-2.5 rounded-xl ${fileIconInfo.bg} shrink-0`}>
                          {fileIconInfo.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4
                            className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate cursor-pointer hover:text-blue-500 transition-colors pr-4"
                            onClick={() => onPreview(file)}
                          >
                            {file.filename}
                          </h4>
                          <div className="flex items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                            <span>{formatBytes(file.size)}</span>
                            <span>•</span>
                            <span className="truncate max-w-[150px]">{file.mimeType}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                        {/* Countdown in row */}
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          <Clock className="w-3.5 h-3.5 text-indigo-500" />
                          <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold shrink-0">
                            {renderCountdown(file)}
                          </span>
                        </div>

                        {/* Inline controls */}
                        <div className="flex items-center gap-1.5">
                          <button
                            id={`row-preview-btn-${file.id}`}
                            onClick={() => onPreview(file)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                            title="Preview File"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`row-download-btn-${file.id}`}
                            onClick={() => onDownload(file)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                            title="Download File"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`row-qr-btn-${file.id}`}
                            onClick={() => setActiveQrFile(file)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                            title="Share QR Code"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`row-copy-btn-${file.id}`}
                            onClick={(e) => handleCopyLink(file, e)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer relative"
                            title="Copy Link"
                          >
                            {copiedId === file.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            id={`row-delete-btn-${file.id}`}
                            onClick={() => onDelete(file)}
                            className="p-1.5 rounded-lg border border-rose-100 hover:border-rose-200 dark:border-rose-950/40 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/15 cursor-pointer transition-colors"
                            title="Delete File Permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Share QR Code Modal Overlay */}
      {activeQrFile && (
        <QrModal
          file={activeQrFile}
          onClose={() => setActiveQrFile(null)}
          addToast={addToast}
        />
      )}
    </div>
  );
}
