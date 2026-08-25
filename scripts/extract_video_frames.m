#import <Foundation/Foundation.h>
#import <AVFoundation/AVFoundation.h>
#import <ImageIO/ImageIO.h>
#import <UniformTypeIdentifiers/UniformTypeIdentifiers.h>

int main(int argc, const char * argv[]) {
    @autoreleasepool {
        if (argc < 3) {
            fprintf(stderr, "Usage: extract_video_frames <video> <output-dir> [frame-count]\n");
            return 1;
        }

        NSString *inputPath = [NSString stringWithUTF8String:argv[1]];
        NSString *outputPath = [NSString stringWithUTF8String:argv[2]];
        NSInteger frameCount = argc >= 4 ? MAX(2, atoi(argv[3])) : 8;
        [[NSFileManager defaultManager] createDirectoryAtPath:outputPath
                                  withIntermediateDirectories:YES
                                                   attributes:nil
                                                        error:nil];

        AVURLAsset *asset = [AVURLAsset URLAssetWithURL:[NSURL fileURLWithPath:inputPath] options:nil];
        Float64 duration = CMTimeGetSeconds(asset.duration);
        if (!isfinite(duration) || duration <= 0) {
            fprintf(stderr, "Could not read video duration\n");
            return 2;
        }

        AVAssetImageGenerator *generator = [[AVAssetImageGenerator alloc] initWithAsset:asset];
        generator.appliesPreferredTrackTransform = YES;
        generator.requestedTimeToleranceBefore = kCMTimeZero;
        generator.requestedTimeToleranceAfter = kCMTimeZero;
        NSString *stem = [[inputPath lastPathComponent] stringByDeletingPathExtension];

        for (NSInteger index = 0; index < frameCount; index++) {
            double fraction = ((double)index + 0.5) / (double)frameCount;
            double seconds = duration * fraction;
            CMTime time = CMTimeMakeWithSeconds(seconds, 600);
            NSError *error = nil;
            CGImageRef image = [generator copyCGImageAtTime:time actualTime:NULL error:&error];
            if (!image) {
                fprintf(stderr, "Frame %ld failed: %s\n", (long)index + 1,
                        error.localizedDescription.UTF8String);
                continue;
            }

            NSString *filename = [NSString stringWithFormat:@"%@-%02ld-%05.1fs.png",
                                  stem, (long)index + 1, seconds];
            NSURL *outputURL = [NSURL fileURLWithPath:[outputPath stringByAppendingPathComponent:filename]];
            CGImageDestinationRef destination = CGImageDestinationCreateWithURL(
                (__bridge CFURLRef)outputURL,
                (__bridge CFStringRef)UTTypePNG.identifier,
                1,
                NULL
            );
            CGImageDestinationAddImage(destination, image, NULL);
            CGImageDestinationFinalize(destination);
            CFRelease(destination);
            CGImageRelease(image);
            printf("%s\n", filename.UTF8String);
        }
    }
    return 0;
}

