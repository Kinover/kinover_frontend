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
        super.onCreate(savedInstanceState)  // 🟢 `null` 제거 후 정상 호출
    }
}
