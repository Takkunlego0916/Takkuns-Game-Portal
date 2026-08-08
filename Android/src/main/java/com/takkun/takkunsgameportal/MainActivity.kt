package com.takkun.takkunsgameportal

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.ViewGroup
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback

class MainActivity : ComponentActivity() {

    private lateinit var webView: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        webView = WebView(this)
        setContentView(webView)

        configureSettings(webView.settings)

        webView.webViewClient = PortalWebViewClient()
        webView.webChromeClient = PortalWebChromeClient()

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })

        if (savedInstanceState == null) {
            webView.loadUrl(ASSET_ROOT + "index.html")
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    override fun onRestoreInstanceState(savedInstanceState: Bundle) {
        super.onRestoreInstanceState(savedInstanceState)
        webView.restoreState(savedInstanceState)
    }

    private fun configureSettings(settings: WebSettings) {
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true

        settings.allowFileAccess = false
        settings.allowContentAccess = false
        settings.allowFileAccessFromFileURLs = false
        settings.allowUniversalAccessFromFileURLs = false

        settings.javaScriptCanOpenWindowsAutomatically = true
        settings.setSupportMultipleWindows(true)

        settings.mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
        settings.cacheMode = WebSettings.LOAD_DEFAULT
    }

    private fun isInAppUrl(url: String): Boolean {
        return url.startsWith(ASSET_ROOT)
    }

    private fun openInExternalBrowser(url: String) {
        if (url.startsWith("http://") || url.startsWith("https://")) {
            try {
                startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
            } catch (_: Exception) {
            }
        }
    }

    private inner class PortalWebViewClient : WebViewClient() {
        override fun shouldOverrideUrlLoading(
            view: WebView,
            request: WebResourceRequest
        ): Boolean {
            val url = request.url.toString()
            if (isInAppUrl(url)) {
                return false
            }
            openInExternalBrowser(url)
            return true
        }
    }

    private inner class PortalWebChromeClient : WebChromeClient() {
        override fun onCreateWindow(
            view: WebView,
            isDialog: Boolean,
            isUserGesture: Boolean,
            resultMsg: android.os.Message
        ): Boolean {
            val transport = resultMsg.obj as? WebView.WebViewTransport ?: return false

            val popup = WebView(view.context)
            popup.layoutParams = ViewGroup.LayoutParams(0, 0)
            configureSettings(popup.settings)

            popup.webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(
                    childView: WebView,
                    request: WebResourceRequest
                ): Boolean {
                    val url = request.url.toString()
                    if (isInAppUrl(url)) {
                        webView.loadUrl(url)
                    } else {
                        openInExternalBrowser(url)
                    }
                    popup.destroy()
                    return true
                }
            }

            transport.webView = popup
            resultMsg.sendToTarget()
            return true
        }
    }

    private companion object {
        const val ASSET_ROOT = "file:///android_asset/"
    }
}
