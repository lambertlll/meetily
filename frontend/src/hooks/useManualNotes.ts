// ============================================================
// 新增文件: frontend/src/hooks/useManualNotes.ts
// 
// 手动笔记 React Hook — 自动加载、自动保存（防抖）
// ============================================================

import { useState, useEffect, useCallback, useRef } from "react";
import { saveManualNotes, getManualNotes } from "@/services/manualNotes";

interface UseManualNotesOptions {
  /** 自动保存延迟（毫秒），默认 2000 */
  autoSaveDelay?: number;
}

interface UseManualNotesReturn {
  content: string;
  setContent: (text: string) => void;
  isSaving: boolean;
  isLoading: boolean;
  lastSavedAt: Date | null;
  save: () => Promise<void>;
  error: string | null;
}

export function useManualNotes(
  meetingId: string | null,
  options: UseManualNotesOptions = {}
): UseManualNotesReturn {
  const { autoSaveDelay = 2000 } = options;

  const [content, setContentState] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef(content);

  // 保持 ref 同步
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  // 加载已有笔记
  useEffect(() => {
    if (!meetingId) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    getManualNotes(meetingId)
      .then((res) => {
        if (!cancelled) {
          setContentState(res.content || "");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Failed to load notes:", err);
          // 如果是表不存在的错误，不显示（首次使用）
          if (!String(err).includes("no such table")) {
            setError("加载笔记失败");
          }
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [meetingId]);

  // 手动保存
  const save = useCallback(async () => {
    if (!meetingId) return;

    setIsSaving(true);
    setError(null);
    try {
      await saveManualNotes(meetingId, contentRef.current);
      setLastSavedAt(new Date());
    } catch (err) {
      console.error("Failed to save notes:", err);
      setError("保存失败");
    } finally {
      setIsSaving(false);
    }
  }, [meetingId]);

  // 自动保存（防抖）
  const setContent = useCallback(
    (text: string) => {
      setContentState(text);

      if (!meetingId) return;

      // 清除之前的定时器
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      // 设置新的延迟保存
      saveTimerRef.current = setTimeout(async () => {
        setIsSaving(true);
        try {
          await saveManualNotes(meetingId, text);
          setLastSavedAt(new Date());
          setError(null);
        } catch (err) {
          console.error("Auto-save failed:", err);
          setError("自动保存失败");
        } finally {
          setIsSaving(false);
        }
      }, autoSaveDelay);
    },
    [meetingId, autoSaveDelay]
  );

  // 组件卸载时清理定时器并保存
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      // 卸载时保存一次
      if (meetingId && contentRef.current) {
        saveManualNotes(meetingId, contentRef.current).catch(console.error);
      }
    };
  }, [meetingId]);

  return {
    content,
    setContent,
    isSaving,
    isLoading,
    lastSavedAt,
    save,
    error,
  };
}
