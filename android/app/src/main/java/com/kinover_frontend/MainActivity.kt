package com.kinover_frontend

import android.content.Context
import android.content.res.Configuration
import android.os.Bundle
import androidx.core.view.WindowCompat
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

    override fun getMainComponentName(): String = "kinover_frontend"

    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

    override fun onCreate(savedInstanceState: Bundle?) {
        setTheme(R.style.AppTheme) // SplashTheme 방지
        super.onCreate(savedInstanceState)

        // ✅ edge-to-edge: 시스템 바 아래까지 콘텐츠 렌더링 허용
        WindowCompat.setDecorFitsSystemWindows(window, false)
    }

    override fun attachBaseContext(newBase: Context) {
        val config = newBase.resources.configuration
        if (config.fontScale != 1.0f) {
            val newConfig = Configuration(config)
            newConfig.fontScale = 1.0f
            val context = newBase.createConfigurationContext(newConfig)
            super.attachBaseContext(context)
        } else {
            super.attachBaseContext(newBase)
        }
    }

    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        if (newConfig.fontScale != 1.0f) {
            newConfig.fontScale = 1.0f
            resources.updateConfiguration(newConfig, resources.displayMetrics)
        }
    }
}
