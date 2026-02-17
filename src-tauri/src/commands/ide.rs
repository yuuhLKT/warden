use std::process::Command;

#[tauri::command]
pub fn open_in_ide(path: String, ide_command: String) -> Result<(), String> {
    Command::new(&ide_command)
        .arg(&path)
        .spawn()
        .map_err(|e| format!("Failed to open IDE: {}", e))?;

    Ok(())
}
