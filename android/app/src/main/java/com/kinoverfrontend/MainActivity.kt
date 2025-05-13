package com.kinoverfrontend

import android.os.Bundle
import com.facebook.react.ReactActivity
import com.kakao.sdk.common.KakaoSdk
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags // ✅ 이거 import
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint // ✅ 추가
import com.facebook.react.defaults.DefaultReactActivityDelegate // ✅ 추가

class MainActivity : ReactActivity() {
    override fun getMainComponentName(): String = "kinoverfrontend"

    override fun onCreate(savedInstanceState: Bundle?) {
        // ✅ New Architecture Feature Flag 설정
        ReactNativeFeatureFlags.useTurboModules = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
        super.onCreate(savedInstanceState)

        // ✅ 카카오 초기화
        KakaoSdk.init(this, "bce05be0c0a25b65bbb43adf582ff2f8")
    }

    override fun createReactActivityDelegate(): ReactActivityDelegate {
        return DefaultReactActivityDelegate(this, mainComponentName, defaultFabricEnabled())
    }

    private fun defaultFabricEnabled(): Boolean {
        return BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
    }
}
