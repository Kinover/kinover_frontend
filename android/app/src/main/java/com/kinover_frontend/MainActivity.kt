// MainActivity.kt
package com.kinover_frontend

import android.os.Bundle
import com.facebook.react.ReactActivity
import com.kakao.sdk.common.KakaoSdk
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags



class MainActivity : ReactActivity() {
    override fun getMainComponentName(): String = "kinover_frontend"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        KakaoSdk.init(this, "bce05be0c0a25b65bbb43adf582ff2f8") // ✅ 이 줄 없으면 바로 crash
    }
}
