// ============================================================
// 新增文件: frontend/src/components/ManualNotesPanel.tsx
// 
// 手动笔记编辑面板 — 在录音界面左侧显示
// ============================================================

"use client";

import React, { useCallback, useRef } from "react";
import { useManualNotes } from "@/hooks/useManualNotes";

interface ManualNotesPanelProps {
  meetingId: string | null;
  isRecording: boolean;
  className?: string;
}

export default function ManualNotesPanel({
  meetingId,
  isRecording,
  className = "",
}: ManualNotesPanelProps) {
  const {
    content,
    setContent,
    isSaving,
    isLoading,
    lastSavedAt,
    save,
    error,
  } = useManualNotes(meetingId);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 键盘快捷键
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Ctrl/Cmd + S: 立即保存
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        save();
        return;
      }

      // Tab: 插入缩进
      if (e.key === "Tab") {
        e.preventDefault();
        const textarea = e.currentTarget;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const indent = "  ";

        const newContent =
          content.substring(0, start) + indent + content.substring(end);
        setContent(newContent);

        // 延迟恢复光标
        requestAnimationFrame(() => {
          textarea.selectionStart = textarea.selectionEnd =
            start + indent.length;
        });
        return;
      }

      // Enter: 自动续列表符号
      if (e.key === "Enter") {
        const textarea = e.currentTarget;
        const pos = textarea.selectionStart;
        const lines = content.substring(0, pos).split("\n");
        const currentLine = lines[lines.length - 1];

        // 匹配 "- " 或 "* " 或 "1. " 等列表前缀
        const listMatch = currentLine.match(/^(\s*)([-*]|\d+\.)\s/);
        if (listMatch) {
          // 如果当前行只有列表符号没有内容，取消列表
          const lineContent = currentLine.replace(/^\s*([-*]|\d+\.)\s*/, "");
          if (!lineContent.trim()) {
            e.preventDefault();
            // 删除当前行的列表符号，换行
            const beforeLine = content.substring(
              0,
              pos - currentLine.length
            );
            const after = content.substring(pos);
            setContent(beforeLine + "\n" + after);
            return;
          }

          e.preventDefault();
          const prefix = listMatch[1]; // 缩进
          const marker = listMatch[2]; // 列表符号

          // 数字列表自增
          let newMarker = marker;
          if (/^\d+$/.test(marker.replace(".", ""))) {
            newMarker = parseInt(marker) + 1 + ".";
          }

          const insertion = `\n${prefix}${newMarker} `;
          const newContent =
            content.substring(0, pos) + insertion + content.substring(pos);
          setContent(newContent);

          requestAnimationFrame(() => {
            textarea.selectionStart = textarea.selectionEnd =
              pos + insertion.length;
          });
        }
      }
    },
    [content, setContent, save]
  );

  return (
    <div
      className={`flex flex-col h-full bg-white dark:bg-gray-900 ${className}`}
    >
      {/* 头部栏 */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center gap-2">
          <span className="text-base">📝</span>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            手动笔记
          </h3>
          {isRecording && (
            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">
              实时记录中
            </span>
          )}
        </div>

        {/* 保存状态 */}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          {error && (
            <span className="text-red-500 dark:text-red-400">{error}</span>
          )}
          {isSaving && (
            <span className="flex items-center gap-1 text-blue-500">
              <svg
                className="animate-spin h-3 w-3"
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
              保存中
            </span>
          )}
          {!isSaving && lastSavedAt && (
            <span>已保存 {lastSavedAt.toLocaleTimeString("zh-CN")}</span>
          )}
        </div>
      </div>

      {/* 提示信息 */}
      {isRecording && (
        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-800/30">
          <p className="text-xs text-blue-600 dark:text-blue-400">
            💡 边听边记要点，会后 AI 会结合录音转录自动生成完整纪要
          </p>
        </div>
      )}

      {/* 编辑区 */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <span className="text-sm">加载中...</span>
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          className="flex-1 w-full p-4 resize-none bg-transparent
                     text-sm text-gray-800 dark:text-gray-200
                     placeholder-gray-400 dark:placeholder-gray-600
                     focus:outline-none font-mono leading-relaxed
                     scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
          placeholder={`在此记录会议要点...

快捷操作：
- Ctrl+S 手动保存
- Tab 缩进
- 输入 "- " 自动续列表

格式建议：
# 议题一
- 要点 1
- 要点 2
  - 子要点

# 议题二
- 决策：xxxxx
- TODO：某人负责 xxx

> 重要发言/引用`}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          disabled={false}
        />
      )}

      {/* 底部状态栏 */}
      <div className="flex items-center justify-between px-4 py-1.5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-[11px] text-gray-400">
        <span>{content.length} 字</span>
        <span>Markdown 格式 · Ctrl+S 保存</span>
      </div>
    </div>
  );
}
