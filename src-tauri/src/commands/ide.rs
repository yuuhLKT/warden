use std::process::Stdio;
use tokio::process::Command;

#[tauri::command]
pub async fn open_in_ide(path: String, ide_command: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        open_in_ide_windows(&path, &ide_command).await
    }

    #[cfg(not(target_os = "windows"))]
    {
        open_in_ide_unix(&path, &ide_command).await
    }
}

// ---------------------------------------------------------------------------
// Windows
// ---------------------------------------------------------------------------
// On Windows the user PATH is always inherited by child processes, so we can
// spawn the IDE command directly via `cmd /c start "" /b <command> <path>`.
// `/b` keeps it in the background (no new console window).
#[cfg(target_os = "windows")]
async fn open_in_ide_windows(path: &str, ide_command: &str) -> Result<(), String> {
    // Split the command into program + args to handle multi-word commands like
    // "code --reuse-window" correctly.
    let mut parts = ide_command.split_whitespace();
    let program = parts.next().unwrap_or(ide_command);
    let mut extra_args: Vec<&str> = parts.collect();
    extra_args.push(path);

    // `start /b` runs the process in the background without opening a new
    // console window. We use `cmd /c` as the host so the PATH lookup works
    // the same way it does in a regular Command Prompt.
    let mut args = vec!["/c", "start", "", "/b", program];
    args.extend_from_slice(&extra_args);

    Command::new("cmd")
        .args(&args)
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|e| format!("Failed to open IDE '{}': {}", ide_command, e))?;

    Ok(())
}

// ---------------------------------------------------------------------------
// Linux / macOS
// ---------------------------------------------------------------------------
// On Unix, GUI applications launched by Tauri do not inherit the user's full
// shell PATH (e.g. ~/.local/bin set in .zshrc is missing). We source the
// user's shell profile first, then exec the IDE in the background — no
// terminal window is opened.
//
// Strategy:
//   1. Detect the user's login shell ($SHELL, default /bin/sh).
//   2. Run `<shell> -i -c '<ide_command> <path> & disown'`.
//      - `-i` makes the shell interactive → sources .zshrc / .bashrc.
//      - `& disown` detaches the IDE process from the shell so it stays alive
//        after the shell exits and never produces a visible window.
#[cfg(not(target_os = "windows"))]
async fn open_in_ide_unix(path: &str, ide_command: &str) -> Result<(), String> {
    let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/sh".to_string());

    // Single-quote the path so spaces (e.g. "Área de trabalho") are safe.
    let escaped_path = shell_escape(path);

    // Build: `<ide_command> '<path>' & disown`
    // `disown` removes the job from the shell's job table so it survives
    // the shell exiting. The `&` sends it to the background immediately.
    let cmd = format!("{} {} & disown", ide_command, escaped_path);

    Command::new(&shell)
        .args(["-ic", &cmd])
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|e| format!("Failed to open IDE '{}': {}", ide_command, e))?;

    Ok(())
}

/// Wraps a string in single quotes and escapes any contained single quotes,
/// producing a safe POSIX shell word even for paths with spaces.
#[cfg(not(target_os = "windows"))]
fn shell_escape(s: &str) -> String {
    format!("'{}'", s.replace('\'', "'\\''"))
}
