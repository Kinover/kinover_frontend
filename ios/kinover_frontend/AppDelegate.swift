import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import KakaoSDKAuth
import UserNotifications
import FirebaseCore

@main
class AppDelegate: RCTAppDelegate, UNUserNotificationCenterDelegate {

  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil
  ) -> Bool {
    self.moduleName = "kinover_frontend"
    self.dependencyProvider = RCTAppDependencyProvider()

    FirebaseApp.configure() // RNFB가 이 설정을 사용함
    UNUserNotificationCenter.current().delegate = self
    application.registerForRemoteNotifications()

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  override func sourceURL(for bridge: RCTBridge) -> URL? { self.bundleURL() }
  override func bundleURL() -> URL? {
  #if DEBUG
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
  #else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
  #endif
  }

  override func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey : Any] = [:]) -> Bool {
    if AuthApi.isKakaoTalkLoginUrl(url) { return AuthController.handleOpenUrl(url: url) }
    return super.application(app, open: url, options: options)
  }

  // (didRegisterForRemoteNotificationsWithDeviceToken / MessagingDelegate 등은 필요 없음)
}
