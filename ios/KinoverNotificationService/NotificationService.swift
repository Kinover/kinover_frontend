import UserNotifications

final class NotificationService: UNNotificationServiceExtension {

  private var contentHandler: ((UNNotificationContent) -> Void)?
  private var bestAttemptContent: UNMutableNotificationContent?

  override func didReceive(
    _ request: UNNotificationRequest,
    withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void
  ) {
    self.contentHandler = contentHandler
    self.bestAttemptContent = (request.content.mutableCopy() as? UNMutableNotificationContent)

    guard let bestAttemptContent else {
      contentHandler(request.content)
      return
    }

    let userInfo = bestAttemptContent.userInfo

    // ✅ 1) firstImageUrl 우선
    if let first = userInfo["firstImageUrl"] as? String, !first.isEmpty {
      attachImage(from: first, to: bestAttemptContent, contentHandler: contentHandler)
      return
    }

    // ✅ 2) imageUrls(JSON) fallback
    if let jsonStr = userInfo["imageUrls"] as? String,
       let first = parseFirstImageUrl(fromJsonString: jsonStr) {
      attachImage(from: first, to: bestAttemptContent, contentHandler: contentHandler)
      return
    }

    contentHandler(bestAttemptContent)
  }

  override func serviceExtensionTimeWillExpire() {
    if let contentHandler, let bestAttemptContent {
      contentHandler(bestAttemptContent)
    }
  }

  private func parseFirstImageUrl(fromJsonString s: String) -> String? {
    guard let data = s.data(using: .utf8) else { return nil }
    do {
      let arr = try JSONSerialization.jsonObject(with: data) as? [String]
      let first = arr?.first?.trimmingCharacters(in: .whitespacesAndNewlines)
      if let first, !first.isEmpty { return first }
      return nil
    } catch {
      return nil
    }
  }

  private func attachImage(
    from urlString: String,
    to content: UNMutableNotificationContent,
    contentHandler: @escaping (UNNotificationContent) -> Void
  ) {
    guard let url = URL(string: urlString) else {
      contentHandler(content)
      return
    }

    URLSession.shared.downloadTask(with: url) { tempUrl, response, error in
      guard let tempUrl, error == nil else {
        contentHandler(content)
        return
      }

      let ext = self.guessFileExtension(url: url, response: response) ?? "jpg"
      let fm = FileManager.default
      let tmpDir = URL(fileURLWithPath: NSTemporaryDirectory())
      let localUrl = tmpDir.appendingPathComponent("kinover_push_image.\(ext)")

      do {
        if fm.fileExists(atPath: localUrl.path) {
          try fm.removeItem(at: localUrl)
        }
        try fm.copyItem(at: tempUrl, to: localUrl)

        let att = try UNNotificationAttachment(identifier: "image", url: localUrl, options: nil)
        content.attachments = [att]
        contentHandler(content)
      } catch {
        contentHandler(content)
      }
    }.resume()
  }

  private func guessFileExtension(url: URL, response: URLResponse?) -> String? {
    let ext = url.pathExtension.lowercased()
    if !ext.isEmpty { return ext }

    if let mime = response?.mimeType?.lowercased() {
      if mime.contains("png") { return "png" }
      if mime.contains("jpeg") || mime.contains("jpg") { return "jpg" }
      if mime.contains("gif") { return "gif" }
      if mime.contains("webp") { return "webp" }
    }
    return nil
  }
}
