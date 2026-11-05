package com.vidbear.app;

import android.app.DownloadManager;
import android.content.Context;
import android.net.Uri;
import android.os.Environment;
import android.webkit.URLUtil;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.JSObject;

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

        if (!fileName.contains(".")) {
            fileName += ".mp4";
        }

        try {
            Context context = getContext();

            DownloadManager manager =
                (DownloadManager) context.getSystemService(Context.DOWNLOAD_SERVICE);

            DownloadManager.Request request =
                new DownloadManager.Request(uri);

            request.setTitle(fileName);
            request.setDescription("Downloading with VidBear");
            request.setMimeType("video/mp4");
            request.setNotificationVisibility(
                DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED
            );

            request.setAllowedOverMetered(true);
            request.setAllowedOverRoaming(false);

            request.setDestinationInExternalPublicDir(
                Environment.DIRECTORY_MOVIES,
                "VidBear/" + fileName
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
}
