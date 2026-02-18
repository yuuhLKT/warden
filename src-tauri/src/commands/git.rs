use tokio::process::Command;

#[tauri::command]
pub async fn clone(url: String, destination: String) -> Result<String, String> {
    if destination.is_empty() {
        return Err("Destination path cannot be empty.".to_string());
    }

    let output = Command::new("git")
        .arg("clone")
        .arg(&url)
        .current_dir(&destination)
        .output()
        .await
        .map_err(|e| format!("Failed to invoke git: {}", e))?;

    if output.status.success() {
        Ok("Repository cloned successfully.".to_string())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        Err(stderr)
    }
}
