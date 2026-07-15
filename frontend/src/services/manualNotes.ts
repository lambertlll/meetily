// ============================================================
// 新增文件: frontend/src/services/manualNotes.ts
// 
// 手动笔记的 Tauri IPC 调用封装
// ============================================================

import { invoke } from "@tauri-apps/api/core";

export interface NotesResponse {
  meeting_id: string;
  content: string;
  success: boolean;
}

/**
 * 保存手动笔记（自动防抖调用）
 */
export async function saveManualNotes(
  meetingId: string,
  content: string
): Promise<NotesResponse> {
  return await invoke<NotesResponse>("api_save_manual_notes", {
    meetingId,
    content,
  });
}

/**
 * 获取指定会议的手动笔记
 */
export async function getManualNotes(
  meetingId: string
): Promise<NotesResponse> {
  return await invoke<NotesResponse>("api_get_manual_notes", {
    meetingId,
  });
}

/**
 * 删除手动笔记
 */
export async function deleteManualNotes(
  meetingId: string
): Promise<NotesResponse> {
  return await invoke<NotesResponse>("api_delete_manual_notes", {
    meetingId,
  });
}
