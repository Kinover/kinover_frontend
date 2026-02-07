import UIKit
import React
import KakaoSDKAuth
import KakaoSDKCommon
import UserNotifications
import FirebaseCore

@main
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate {

  var window: UIWindow?
  var bridge: RCTBridge?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {

    // ✅ Firebase
    FirebaseApp.configure()

    // ✅ Kakao SDK init (권장)
    // Info.plist에 KAKAO_NATIVE_APP_KEY 같은 키로 넣어두고 읽는 방식 추천
    if let kakaoAppKey = Bundle.main.object(forInfoDictionaryKey: "KAKAO_NATIVE_APP_KEY") as? String,
       !kakaoAppKey.isEmpty {
      KakaoSDK.initSDK(appKey: kakaoAppKey)
    }

    // ✅ Push
    UNUserNotificationCenter.current().delegate = self
    application.registerForRemoteNotifications()

    // ✅ React Native Bridge (단 1회)
    self.bridge = RCTBridge(delegate: self, launchOptions: launchOptions)

    let rootView = RCTRootView(
      bridge: self.bridge!,
      moduleName: "kinover_frontend",
      initialProperties: nil
    )

    let rootViewController = UIViewController()
    rootViewController.view = rootView

    self.window = UIWindow(frame: UIScreen.main.bounds)
    self.window?.rootViewController = rootViewController
    self.window?.makeKeyAndVisible()

    return true
  }

  // ✅ URL Scheme / Deep Link
  func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey : Any] = [:]
  ) -> Bool {

    // 1) Kakao 로그인 URL이면 Kakao가 처리
    if AuthApi.isKakaoTalkLoginUrl(url) {
      return AuthController.handleOpenUrl(url: url)
    }

    // 2) 그 외는 React Native Linking으로 전달 (중요!)
    return RCTLinkingManager.application(app, open: url, options: options)
  }

  // ✅ Universal Links (필요하면)
  func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    return RCTLinkingManager.application(
      application,
      continue: userActivity,
      restorationHandler: restorationHandler
    )
  }
}

// MARK: - RCTBridgeDelegate
extension AppDelegate: RCTBridgeDelegate {
  func sourceURL(for bridge: RCTBridge!) -> URL! {
    #if DEBUG
      return RCTBundleURLProvider.sharedSettings()
        .jsBundleURL(forBundleRoot: "index", fallbackExtension: "jsbundle")
    #else
      return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
    #endif
  }
}
