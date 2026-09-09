mod cli_detector;

#[tauri::command]
fn detect_clis() -> Vec<cli_detector::CliStatus> {
    cli_detector::detect_all()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![detect_clis])
        .run(tauri::generate_context!())
        .expect("error while running Grows Agent");
}
