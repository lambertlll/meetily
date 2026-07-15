use crate::notes::repository::ManualNotesRepository;
use crate::state::AppState;
use log::{error as log_error, info as log_info};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Runtime};

#[derive(Debug, Serialize, Deserialize)]
pub struct NotesResponse {
    pub meeting_id: String,
    pub content: String,
    pub success: bool,
}

/// Save manual notes for a meeting
#[tauri::command]
pub async fn api_save_manual_notes<R: Runtime>(
    _app: AppHandle<R>,
    state: tauri::State<'_, AppState>,
    meeting_id: String,
    content: String,
) -> Result<NotesResponse, String> {
    log_info!("api_save_manual_notes called for meeting_id: {}", meeting_id);

    let pool = state.db_manager.pool();

    ManualNotesRepository::save_notes(pool, &meeting_id, &content)
        .await
        .map_err(|e| {
            log_error!("Failed to save manual notes: {}", e);
            format!("Failed to save notes: {}", e)
        })?;

    Ok(NotesResponse {
        meeting_id,
        content,
        success: true,
    })
}

/// Get manual notes for a meeting
#[tauri::command]
pub async fn api_get_manual_notes<R: Runtime>(
    _app: AppHandle<R>,
    state: tauri::State<'_, AppState>,
    meeting_id: String,
) -> Result<NotesResponse, String> {
    log_info!("api_get_manual_notes called for meeting_id: {}", meeting_id);

    let pool = state.db_manager.pool();

    let content = ManualNotesRepository::get_notes(pool, &meeting_id)
        .await
        .map_err(|e| {
            log_error!("Failed to get manual notes: {}", e);
            format!("Failed to get notes: {}", e)
        })?
        .unwrap_or_default();

    Ok(NotesResponse {
        meeting_id,
        content,
        success: true,
    })
}

/// Delete manual notes for a meeting
#[tauri::command]
pub async fn api_delete_manual_notes<R: Runtime>(
    _app: AppHandle<R>,
    state: tauri::State<'_, AppState>,
    meeting_id: String,
) -> Result<NotesResponse, String> {
    log_info!(
        "api_delete_manual_notes called for meeting_id: {}",
        meeting_id
    );

    let pool = state.db_manager.pool();

    ManualNotesRepository::delete_notes(pool, &meeting_id)
        .await
        .map_err(|e| {
            log_error!("Failed to delete manual notes: {}", e);
            format!("Failed to delete notes: {}", e)
        })?;

    Ok(NotesResponse {
        meeting_id,
        content: String::new(),
        success: true,
    })
}
