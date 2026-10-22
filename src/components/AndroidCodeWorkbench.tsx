import React, { useState } from 'react';
import { Download, Copy, Check, FileCode, Folder, Terminal, ExternalLink } from 'lucide-react';
import JSZip from 'jszip';
import { ANDROID_PROJECT_FILES } from '../data/androidProjectFiles';
import { AndroidFileItem } from '../types/navigation';

export const AndroidCodeWorkbench: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<AndroidFileItem>(ANDROID_PROJECT_FILES[9]); // Default to MainActivity.kt
  const [copied, setCopied] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();

      // Add each project file into its exact folder hierarchy
      for (const item of ANDROID_PROJECT_FILES) {
        zip.file(item.path, item.content);
      }

      // Add placeholder for model asset with download instructions
      zip.file(
        'app/src/main/assets/DOWNLOAD_MODEL_HERE.txt',
        `Download the pretrained MiDaS v2.1 Small model:
URL: https://github.com/isl-org/MiDaS/releases/download/v2_1/model-small.tflite
Save as: app/src/main/assets/midas_small.tflite
`
      );

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'SpatialNavAI-AndroidProject.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to create zip:', err);
    } finally {
      setIsZipping(false);
    }
  };

  const categories = ['ALL', 'KOTLIN_SRC', 'GRADLE', 'MANIFEST', 'RESOURCES', 'UNIT_TESTS', 'DOCS'];
  const filteredFiles = filterCategory === 'ALL'
    ? ANDROID_PROJECT_FILES
    : ANDROID_PROJECT_FILES.filter((f) => f.category === filterCategory);

  return (
    <div className="space-y-6">
      {/* Header with Export Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-[#12161f] p-6">
        <div>
          <h2 className="text-xl font-bold text-white">Android Studio Project Source Repository</h2>
          <p className="text-xs text-slate-400 mt-1">
            Fully structured production codebase: CameraX, LiteRT/TFLite, AudioTrack stereo panner, and accessibility controls.
          </p>
        </div>

        <button
          onClick={handleDownloadZip}
          disabled={isZipping}
          className="flex items-center justify-center gap-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 px-5 py-3 text-xs font-extrabold tracking-wide shadow-md transition-all shrink-0 cursor-pointer disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          <span>{isZipping ? 'PACKAGING ZIP...' : 'DOWNLOAD ANDROID PROJECT (.ZIP)'}</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterCategory === cat
                ? 'bg-slate-700 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            {cat.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Two-Column Workbench: File Explorer + Source Code Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* File Explorer (4 Columns) */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-800 bg-[#12161f] p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300 px-2 pb-2 border-b border-slate-800">
            <Folder className="h-4 w-4 text-yellow-400" />
            <span>Project File Tree ({filteredFiles.length} files)</span>
          </div>

          <div className="space-y-1 max-h-[560px] overflow-y-auto pr-1">
            {filteredFiles.map((file) => (
              <button
                key={file.path}
                onClick={() => setSelectedFile(file)}
                className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start gap-3 ${
                  selectedFile.path === file.path
                    ? 'bg-yellow-400/15 border border-yellow-400/40 text-yellow-300'
                    : 'border border-transparent hover:bg-slate-800/60 text-slate-400 hover:text-white'
                }`}
              >
                <FileCode className="h-4 w-4 shrink-0 mt-0.5 text-slate-400" />
                <div className="truncate">
                  <div className="text-xs font-medium text-white truncate">{file.path}</div>
                  <div className="text-[10px] text-slate-500 truncate">{file.title}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Source Code Viewer (8 Columns) */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-800 bg-[#12161f] overflow-hidden flex flex-col">
          {/* File Tab Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/70">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-semibold text-yellow-400">{selectedFile.path}</span>
              <span className="text-xs text-slate-500 hidden sm:inline">&middot; {selectedFile.title}</span>
            </div>

            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:text-white font-medium transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>

          {/* Description banner */}
          <div className="px-5 py-2.5 bg-slate-900/40 border-b border-slate-800/60 text-xs text-slate-400">
            {selectedFile.description}
          </div>

          {/* Code block with line numbers */}
          <div className="p-5 font-mono text-xs overflow-x-auto max-h-[500px] leading-relaxed text-slate-300 bg-[#0a0d12]">
            <pre className="select-text">
              <code>{selectedFile.content}</code>
            </pre>
          </div>
        </div>
      </div>

      {/* Build and Device Execution Quickstart */}
      <div className="rounded-2xl border border-slate-800 bg-[#12161f] p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <Terminal className="h-4 w-4 text-cyan-400" />
          <span>Command-Line Build &amp; Deployment Instructions</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="font-bold text-yellow-400">Step 1: Download Model</div>
            <p className="text-slate-400">Fetch the official pretrained MiDaS v2.1 Small model:</p>
            <div className="p-2 bg-black rounded font-mono text-[11px] text-slate-300 overflow-x-auto">
              curl -L -o app/src/main/assets/midas_small.tflite &quot;https://github.com/isl-org/MiDaS/releases/download/v2_1/model-small.tflite&quot;
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="font-bold text-yellow-400">Step 2: Run Unit Tests</div>
            <p className="text-slate-400">Verify hysteresis, thresholds, and dimensions:</p>
            <div className="p-2 bg-black rounded font-mono text-[11px] text-slate-300 overflow-x-auto">
              ./gradlew test
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="font-bold text-yellow-400">Step 3: Assemble &amp; Install</div>
            <p className="text-slate-400">Build APK and install to connected phone:</p>
            <div className="p-2 bg-black rounded font-mono text-[11px] text-slate-300 overflow-x-auto">
              ./gradlew installDebug
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
