// ============================================================
// 新增文件: frontend/src/components/MeetingWorkspace.tsx
// 
// 会议工作区容器 — 左右分栏：手动笔记 | 实时转录
// 用于包裹现有的录音/转录组件
// ============================================================

"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import ManualNotesPanel from "./ManualNotesPanel";

interface MeetingWorkspaceProps {
  meetingId: string | null;
  isRecording: boolean;
  children: React.ReactNode; // 现有的转录/摘要内容
}

export default function MeetingWorkspace({
  meetingId,
  isRecording,
  children,
}: MeetingWorkspaceProps) {
  const [showNotes, setShowNotes] = useState(true);
  const [panelWidth, setPanelWidth] = useState(300); // 笔记面板宽度（px）
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 拖拽调整面板宽度
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = e.clientX - rect.left;
      // 限制范围：250px ~ 60% 容器宽度
      const minWidth = 200;
      const maxWidth = rect.width * 0.6;
      setPanelWidth(Math.min(maxWidth, Math.max(minWidth, newWidth)));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div ref={containerRef} className="flex flex-col h-full">
      {/* 工具栏 */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <button
          onClick={() => setShowNotes(!showNotes)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all
            ${
              showNotes
                ? "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
                : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
            }`}
        >
          <span>{showNotes ? "📝" : "📝"}</span>
          {showNotes ? "隐藏笔记" : "显示笔记"}
        </button>

        {isRecording && (
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            <span className="text-xs font-medium text-red-600 dark:text-red-400">
              录音中
            </span>
          </div>
        )}
      </div>

      {/* 主内容区 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧：手动笔记面板 */}
        {showNotes && (
          <>
            <div
              className="flex-shrink-0 border-r border-gray-200 dark:border-gray-700 overflow-hidden"
              style={{ width: `${panelWidth}px` }}
            >
              <ManualNotesPanel
                meetingId={meetingId}
                isRecording={isRecording}
              />
            </div>

            {/* 拖拽手柄 */}
            <div
              className={`w-1 flex-shrink-0 cursor-col-resize transition-colors
                ${
                  isDragging
                    ? "bg-blue-400"
                    : "bg-transparent hover:bg-gray-300 dark:hover:bg-gray-600"
                }`}
              onMouseDown={handleMouseDown}
            />
          </>
        )}

        {/* 右侧：原有内容（转录/摘要） */}
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  );
}
