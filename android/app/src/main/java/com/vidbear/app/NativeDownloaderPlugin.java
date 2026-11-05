package com.vidbear.app;

import android.app.DownloadManager;
import android.content.ContentValues;
import android.content.Context;
import android.net.Uri;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.URLUtil;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.JSObject;

import java.io.OutputStream;

@CapacitorPlugin(name = "NativeDownloader")
public class NativeDownloaderPlugin extends Plugin {

    @PluginMethod
    public void download(PluginCall call) {
        String url = call.getString("url");
        String fileName = call.getString("fileName");

        if (url == null || url.trim().isEmpty()) {
            call.reject("Video URL is missing");
            return;
        }

        Uri uri = Uri.parse(url.trim());

        if (!("https".equalsIgnoreCase(uri.getScheme()) ||
              "http".equalsIgnoreCase(uri.getScheme()))) {
            call.reject("Invalid video URL");
            return;
        }

        if (fileName == null || fileName.trim().isEmpty()) {
            fileName = URLUtil.guessFileName(url, null, "video/mp4");
        }

        fileName = fileName.replaceAll("[^a-zA-Z0-9._-]", "_");
        if (!fileName.contains(".")) fileName += ".mp4";

        try {
            Context context = getContext();
            DownloadManager manager =
                (DownloadManager) context.getSystemService(Context.DOWNLOAD_SERVICE);

            DownloadManager.Request request = new DownloadManager.Request(uri);
            request.setTitle(fileName);
            request.setDescription("Downloading with VidBear");
            request.setMimeType("video/mp4");
            request.setNotificationVisibility(
                DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED
            );
            request.setAllowedOverMetered(true);
            request.setAllowedOverRoaming(false);
            request.setDestinationInExternalPublicDir(
                Environment.DIRECTORY_MOVIES, "VidBear/" + fileName
            );

            long downloadId = manager.enqueue(request);

            JSObject result = new JSObject();
            result.put("downloadId", downloadId);
            result.put("fileName", fileName);
            result.put("folder", "Movies/VidBear");
            call.resolve(result);

        } catch (Exception e) {
            call.reject("Download failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void saveBase64(PluginCall call) {
        String data = call.getString("data");
        String fileName = call.getString("fileName");

        if (data == null || data.isEmpty()) {
            call.reject("MP3 data is missing");
            return;
        }

        if (fileName == null || fileName.trim().isEmpty()) {
            fileName = "VidBear.mp3";
        }

        fileName = fileName.replaceAll("[^a-zA-Z0-9._-]", "_");
        if (!fileName.toLowerCase().endsWith(".mp3")) {
            fileName += ".mp3";
        }

        Uri savedUri = null;

        try {
            byte[] bytes = Base64.decode(data, Base64.DEFAULT);

            ContentValues values = new ContentValues();
            values.put(MediaStore.Audio.Media.DISPLAY_NAME, fileName);
            values.put(MediaStore.Audio.Media.MIME_TYPE, "audio/mpeg");
            values.put(MediaStore.Audio.Media.RELATIVE_PATH,
                Environment.DIRECTORY_MUSIC + "/VidBear");
            values.put(MediaStore.Audio.Media.IS_PENDING, 1);

            savedUri = getContext().getContentResolver().insert(
                MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, values
            );

            if (savedUri == null) {
                call.reject("Could not create MP3 file");
                return;
            }

            try (OutputStream output = getContext().getContentResolver()
                    .openOutputStream(savedUri)) {
                if (output == null) throw new Exception("Cannot open output file");
                output.write(bytes);
                output.flush();
            }

            ContentValues complete = new ContentValues();
            complete.put(MediaStore.Audio.Media.IS_PENDING, 0);
            getContext().getContentResolver().update(savedUri, complete, null, null);

            JSObject result = new JSObject();
            result.put("fileName", fileName);
            result.put("folder", "Music/VidBear");
            call.resolve(result);

        } catch (Exception e) {
            if (savedUri != null) {
                getContext().getContentResolver().delete(savedUri, null, null);
            }
            call.reject("MP3 save failed: " + e.getMessage());
        }
    }
}
