use sqlx::SqlitePool;
use tracing::{error, info};

pub struct ManualNotesRepository;

impl ManualNotesRepository {
    /// Save or update manual notes (upsert into existing meeting_notes table)
    pub async fn save_notes(
        pool: &SqlitePool,
        meeting_id: &str,
        content: &str,
    ) -> Result<(), sqlx::Error> {
        let now = chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string();

        sqlx::query(
            r#"
            INSERT INTO meeting_notes (meeting_id, notes_markdown, created_at, updated_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(meeting_id) DO UPDATE SET
                notes_markdown = excluded.notes_markdown,
                updated_at = excluded.updated_at
            "#,
        )
        .bind(meeting_id)
        .bind(content)
        .bind(&now)
        .bind(&now)
        .execute(pool)
        .await?;

        info!("Manual notes saved for meeting: {}", meeting_id);
        Ok(())
    }

    /// Get manual notes (markdown) for a specific meeting
    pub async fn get_notes(
        pool: &SqlitePool,
        meeting_id: &str,
    ) -> Result<Option<String>, sqlx::Error> {
        let row: Option<(Option<String>,)> =
            sqlx::query_as("SELECT notes_markdown FROM meeting_notes WHERE meeting_id = ?")
                .bind(meeting_id)
                .fetch_optional(pool)
                .await?;

        Ok(row.and_then(|(content,)| content))
    }

    /// Delete manual notes for a specific meeting
    pub async fn delete_notes(
        pool: &SqlitePool,
        meeting_id: &str,
    ) -> Result<bool, sqlx::Error> {
        let result = sqlx::query("DELETE FROM meeting_notes WHERE meeting_id = ?")
            .bind(meeting_id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }
}
