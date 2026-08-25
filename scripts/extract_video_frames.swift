import Foundation
import AVFoundation
import AppKit

guard CommandLine.arguments.count >= 3 else {
    fputs("Usage: extract_video_frames.swift <video> <output-dir> [frame-count]\n", stderr)
    exit(1)
}

let inputURL = URL(fileURLWithPath: CommandLine.arguments[1])
let outputURL = URL(fileURLWithPath: CommandLine.arguments[2], isDirectory: true)
let requestedCount = CommandLine.arguments.count >= 4 ? (Int(CommandLine.arguments[3]) ?? 8) : 8
let frameCount = max(2, requestedCount)

try FileManager.default.createDirectory(at: outputURL, withIntermediateDirectories: true)

let asset = AVURLAsset(url: inputURL)
let duration = CMTimeGetSeconds(asset.duration)
guard duration.isFinite, duration > 0 else {
    fputs("Could not read video duration\n", stderr)
    exit(2)
}

let generator = AVAssetImageGenerator(asset: asset)
generator.appliesPreferredTrackTransform = true
generator.requestedTimeToleranceBefore = .zero
generator.requestedTimeToleranceAfter = .zero

let stem = inputURL.deletingPathExtension().lastPathComponent
for index in 0..<frameCount {
    let fraction = (Double(index) + 0.5) / Double(frameCount)
    let seconds = duration * fraction
    let time = CMTime(seconds: seconds, preferredTimescale: 600)
    do {
        let cgImage = try generator.copyCGImage(at: time, actualTime: nil)
        let bitmap = NSBitmapImageRep(cgImage: cgImage)
        guard let png = bitmap.representation(using: .png, properties: [:]) else { continue }
        let filename = String(format: "%@-%02d-%05.1fs.png", stem, index + 1, seconds)
        try png.write(to: outputURL.appendingPathComponent(filename))
        print(filename)
    } catch {
        fputs("Frame \(index + 1) failed: \(error)\n", stderr)
    }
}

