use std::process::Stdio;
use tokio::process::Command;

/// Execute a scaffold command in the specified working directory.
///
/// The command string is passed verbatim to the shell (`sh -c`) so that
/// quoted arguments (e.g. `--import-alias "@/*"`) are handled correctly.
#[tauri::command]
pub async fn execute_scaffold(working_dir: String, command: String) -> Result<String, String> {
    if command.trim().is_empty() {
        return Err("Empty command".to_string());
    }

    let output = Command::new("sh")
        .args(["-c", &command])
        .current_dir(&working_dir)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .await
        .map_err(|e| format!("Failed to execute command: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);

    if !output.status.success() {
        return Err(format!(
            "Command failed with exit code {}\nSTDOUT: {}\nSTDERR: {}",
            output
                .status
                .code()
                .map_or_else(|| "unknown".to_string(), |c| c.to_string()),
            stdout,
            stderr
        ));
    }

    Ok(stdout.to_string())
}
