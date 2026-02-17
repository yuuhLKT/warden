use tokio::process::Command;

#[tauri::command]
pub async fn clone(url: String, destination: String) -> Result<String, String> {
    if destination.is_empty() {
        return Err("O caminho de destino não pode estar vazio.".to_string());
    }

    let output = Command::new("git")
        .arg("clone")
        .arg(&url)
        .current_dir(&destination)
        .output()
        .await
        .map_err(|e| format!("Falha ao invocar o git: {}", e))?;

    if output.status.success() {
        Ok("Clone concluído com sucesso!".to_string())
    } else {
        let erro = String::from_utf8_lossy(&output.stderr).to_string();
        Err(erro)
    }
}
