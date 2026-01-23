package com.kinover_frontend

import android.content.Context
import android.content.res.Configuration
import android.os.Bundle
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
    }

    /**
     * ✅ 시스템 폰트 크기(접근성 글자 크기) 무시: 항상 fontScale=1.0 유지
     * - JS의 allowFontScaling=false 가 전역으로 새는 케이스가 있어서
     *   Android 리소스 레벨에서 강제로 고정하는 방식이 제일 확실함.
     */
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
