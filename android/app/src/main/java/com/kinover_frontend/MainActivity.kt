package com.kinover_frontend

import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

// import com.swmansion.gesturehandler.react.RNGestureHandlerEnabledRootView;

class MainActivity : ReactActivity() {

    override fun getMainComponentName(): String = "kinover_frontend"

    override fun createReactActivityDelegate(): ReactActivityDelegate =
            DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

    override fun onCreate(savedInstanceState: Bundle?) {
        setTheme(R.style.AppTheme) // 👈 이 줄이 없으면 SplashTheme 그대로임!
        super.onCreate(savedInstanceState) // 🟢 `null` 제거 후 정상 호출
    }
}