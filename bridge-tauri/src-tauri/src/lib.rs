mod cli_detector;
mod cli_installer;

#[tauri::command]
fn detect_clis() -> Vec<cli_detector::CliStatus> {
    cli_detector::detect_all()
}

#[tauri::command]
fn install_cli(id: String) -> cli_installer::InstallResult {
    cli_installer::install(&id)
}

#[tauri::command]
fn login_cli(id: String, bin: String) -> cli_installer::InstallResult {
    cli_installer::open_login(&id, std::path::Path::new(&bin))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![detect_clis, install_cli, login_cli])
        .run(tauri::generate_context!())
        .expect("error while running Grows Agent");
}
