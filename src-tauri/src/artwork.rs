use std::time::Duration;

use tauri::WebviewWindow;
use tauri_plugin_dialog::DialogExt;

#[tauri::command]
pub async fn native_artwork_download(
    window: WebviewWindow,
    url: String,
    name: String,
) -> Result<(), String> {
    if window.label() != "main" {
        return Err("Artwork can only be downloaded from the main window.".into());
    }

    let response = reqwest::Client::builder()
        .https_only(true)
        .timeout(Duration::from_secs(30))
        .build()
        .map_err(|cause| cause.without_url().to_string())?
        .get(url)
        .send()
        .await
        .and_then(reqwest::Response::error_for_status)
        .map_err(|cause| cause.without_url().to_string())?;

    let content_type = response
        .headers()
        .get(reqwest::header::CONTENT_TYPE)
        .and_then(|value| value.to_str().ok())
        .unwrap_or("")
        .split(';')
        .next()
        .unwrap_or("")
        .trim();
    let extension = match content_type {
        "image/jpeg" => "jpg",
        "image/png" => "png",
        "image/webp" => "webp",
        "image/avif" => "avif",
        "image/gif" => "gif",
        _ => return Err("The artwork did not return a supported image.".into()),
    };
    let bytes = response
        .bytes()
        .await
        .map_err(|cause| cause.without_url().to_string())?;
    let name: String = name
        .chars()
        .take(120)
        .map(|character| {
            if character.is_control() || "<>:\"/\\|?*".contains(character) {
                '_'
            } else {
                character
            }
        })
        .collect();

    tauri::async_runtime::spawn_blocking(move || {
        let path = window
            .dialog()
            .file()
            .set_parent(&window)
            .set_title("Save artwork")
            .set_file_name(format!("{} - artwork.{extension}", name.trim()))
            .add_filter("Artwork", &[extension])
            .blocking_save_file();
        let Some(path) = path else {
            return Ok(());
        };
        let path = path.into_path().map_err(|cause| cause.to_string())?;
        std::fs::write(path, bytes).map_err(|cause| cause.to_string())
    })
    .await
    .map_err(|_| "Could not save the artwork.".to_owned())?
}
