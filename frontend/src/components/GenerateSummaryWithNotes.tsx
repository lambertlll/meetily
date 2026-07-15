// ============================================================
// 新增文件: frontend/src/components/GenerateSummaryWithNotes.tsx
// 
// "生成会议纪要"按钮组件
// 可以替换或补充现有的 Generate Summary 按钮
// ============================================================

"use client";

import React, { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

interface GenerateSummaryWithNotesProps {
  meetingId: string | null;
  transcript: string;
  disabled?: boolean;
  onComplete?: (summary: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

export default function GenerateSummaryWithNotes({
  meetingId,
  transcript,
  disabled = false,
  onComplete,
  onError,
  className = "",
}: GenerateSummaryWithNotesProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState<string>("");

  const handleGenerate = async () => {
    if (!meetingId || !transcript || isGenerating) return;

    setIsGenerating(true);
    setStatus("正在读取笔记和转录文本...");

    try {
      // 调用现有的 api_process_transcript 命令
      // 后端会自动读取 manual_notes 并合并生成
      const response = await invoke<{ message: string; process_id: string }>(
        "api_process_transcript",
        {
          text: transcript,
          model: "ollama", // 可从 settings 读取
          modelName: "qwen2.5:14b", // 可从 settings 读取
          meetingId,
          templateId: "chinese_meeting_minutes", // 使用中文模板
          summaryLanguage: "zh",
        }
      );

      setStatus("AI 正在生成会议纪要...");

      // 轮询状态直到完成
      const pollInterval = setInterval(async () => {
        try {
          const summary = await invoke<{
            status: string;
            data: any;
            error?: string;
          }>("api_get_summary", { meetingId });

          if (summary.status === "completed" && summary.data) {
            clearInterval(pollInterval);
            setIsGenerating(false);
            setStatus("✅ 会议纪要生成完成");
            onComplete?.(summary.data.markdown || "");
            setTimeout(() => setStatus(""), 3000);
          } else if (summary.status === "failed") {
            clearInterval(pollInterval);
            setIsGenerating(false);
            const errMsg = summary.error || "生成失败";
            setStatus(`❌ ${errMsg}`);
            onError?.(errMsg);
          }
        } catch (e) {
          // 继续轮询
        }
      }, 2000);

      // 超时保护：5分钟
      setTimeout(() => {
        clearInterval(pollInterval);
        if (isGenerating) {
          setIsGenerating(false);
          setStatus("⏰ 生成超时，请重试");
        }
      }, 300000);
    } catch (err) {
      setIsGenerating(false);
      const errMsg = err instanceof Error ? err.message : String(err);
      setStatus(`❌ ${errMsg}`);
      onError?.(errMsg);
    }
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        onClick={handleGenerate}
        disabled={disabled || isGenerating || !meetingId || !transcript}
        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium 
          transition-all duration-200 shadow-sm
          ${
            isGenerating
              ? "bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-wait"
              : disabled || !meetingId || !transcript
              ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg active:scale-[0.98]"
          }`}
      >
        {isGenerating ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            生成中...
          </>
        ) : (
          <>
            <span>✨</span>
            生成会议纪要
          </>
        )}
      </button>

      {status && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {status}
        </span>
      )}
    </div>
  );
}
