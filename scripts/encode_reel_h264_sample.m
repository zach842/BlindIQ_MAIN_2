#import <Foundation/Foundation.h>
#import <AVFoundation/AVFoundation.h>
#import <AppKit/AppKit.h>

static CGImageRef LoadImage(NSString *path) {
    NSImage *image = [[NSImage alloc] initWithContentsOfFile:path];
    if (!image) return NULL;
    NSRect rect = NSMakeRect(0, 0, image.size.width, image.size.height);
    return CGImageRetain([image CGImageForProposedRect:&rect context:nil hints:nil]);
}

static void DrawImage(CGContextRef context, CGImageRef image, CGFloat width, CGFloat height, CGFloat scale, CGFloat alpha) {
    CGFloat drawWidth = width * scale;
    CGFloat drawHeight = height * scale;
    CGFloat x = (width - drawWidth) / 2.0;
    CGFloat y = (height - drawHeight) / 2.0;
    CGContextSaveGState(context);
    CGContextSetAlpha(context, alpha);
    CGContextTranslateCTM(context, 0, height);
    CGContextScaleCTM(context, 1, -1);
    CGContextDrawImage(context, CGRectMake(x, y, drawWidth, drawHeight), image);
    CGContextRestoreGState(context);
}

int main(int argc, const char *argv[]) {
    @autoreleasepool {
        if (argc < 4) return 1;
        NSString *sceneDirectory = [NSString stringWithUTF8String:argv[1]];
        NSURL *outputURL = [NSURL fileURLWithPath:[NSString stringWithUTF8String:argv[2]]];
        NSInteger fps = MAX(12, atoi(argv[3]));
        NSArray<NSNumber *> *durations = @[@2.4, @2.8, @2.6, @2.8, @2.8, @2.8, @3.4];
        NSMutableArray<NSValue *> *images = [NSMutableArray array];
        for (NSInteger index = 1; index <= 7; index++) {
            NSString *filename = [NSString stringWithFormat:@"scene-%02ld.png", (long)index];
            CGImageRef image = LoadImage([sceneDirectory stringByAppendingPathComponent:filename]);
            if (!image) return 2;
            [images addObject:[NSValue valueWithPointer:image]];
        }

        [[NSFileManager defaultManager] removeItemAtURL:outputURL error:nil];
        NSError *error = nil;
        AVAssetWriter *writer = [[AVAssetWriter alloc] initWithURL:outputURL fileType:AVFileTypeMPEG4 error:&error];
        NSDictionary *settings = @{
            AVVideoCodecKey: AVVideoCodecTypeH264,
            AVVideoWidthKey: @1080,
            AVVideoHeightKey: @1920,
            AVVideoCompressionPropertiesKey: @{
                AVVideoAverageBitRateKey: @8000000,
                AVVideoExpectedSourceFrameRateKey: @(fps),
                AVVideoMaxKeyFrameIntervalKey: @(fps * 2),
            },
        };
        AVAssetWriterInput *input = [AVAssetWriterInput assetWriterInputWithMediaType:AVMediaTypeVideo outputSettings:settings];
        input.expectsMediaDataInRealTime = NO;
        if (![writer canAddInput:input]) return 3;
        [writer addInput:input];
        if (![writer startWriting]) {
            fprintf(stderr, "Writer start failed: %s\n", writer.error.localizedDescription.UTF8String);
            return 4;
        }
        [writer startSessionAtSourceTime:kCMTimeZero];

        NSInteger globalFrame = 0;
        NSInteger transitionFrames = llround(0.28 * fps);
        for (NSInteger scene = 0; scene < images.count; scene++) {
            NSInteger frameCount = llround(durations[scene].doubleValue * fps);
            for (NSInteger localFrame = 0; localFrame < frameCount; localFrame++) {
                while (!input.readyForMoreMediaData) usleep(2000);
                CVPixelBufferRef buffer = NULL;
                CVReturn result = CVPixelBufferCreate(kCFAllocatorDefault, 1080, 1920,
                                                      kCVPixelFormatType_32BGRA, NULL, &buffer);
                if (result != kCVReturnSuccess || !buffer) return 5;
                CVPixelBufferLockBaseAddress(buffer, 0);
                void *base = CVPixelBufferGetBaseAddress(buffer);
                size_t bytesPerRow = CVPixelBufferGetBytesPerRow(buffer);
                CGColorSpaceRef colorSpace = CGColorSpaceCreateDeviceRGB();
                CGContextRef context = CGBitmapContextCreate(base, 1080, 1920, 8, bytesPerRow, colorSpace,
                                                              kCGImageAlphaPremultipliedFirst | kCGBitmapByteOrder32Little);
                CGColorSpaceRelease(colorSpace);
                if (!context) return 6;
                CGContextSetRGBFillColor(context, 0.02, 0.08, 0.06, 1.0);
                CGContextFillRect(context, CGRectMake(0, 0, 1080, 1920));
                CGFloat progress = (CGFloat)localFrame / MAX(1, frameCount - 1);
                DrawImage(context, [images[scene] pointerValue], 1080, 1920, 1.0 + progress * 0.022, 1.0);
                if (scene + 1 < images.count && localFrame >= frameCount - transitionFrames) {
                    CGFloat fade = (CGFloat)(localFrame - (frameCount - transitionFrames)) / MAX(1, transitionFrames - 1);
                    DrawImage(context, [images[scene + 1] pointerValue], 1080, 1920, 1.0, fade);
                }
                CGContextRelease(context);
                CVPixelBufferUnlockBaseAddress(buffer, 0);

                CMVideoFormatDescriptionRef format = NULL;
                OSStatus formatStatus = CMVideoFormatDescriptionCreateForImageBuffer(kCFAllocatorDefault, buffer, &format);
                if (formatStatus != noErr || !format) return 7;
                CMSampleTimingInfo timing = {
                    .duration = CMTimeMake(1, (int32_t)fps),
                    .presentationTimeStamp = CMTimeMake(globalFrame, (int32_t)fps),
                    .decodeTimeStamp = kCMTimeInvalid,
                };
                CMSampleBufferRef sample = NULL;
                OSStatus sampleStatus = CMSampleBufferCreateReadyWithImageBuffer(kCFAllocatorDefault, buffer,
                                                                                  format, &timing, &sample);
                CFRelease(format);
                CVPixelBufferRelease(buffer);
                if (sampleStatus != noErr || !sample) return 8;
                BOOL appended = [input appendSampleBuffer:sample];
                CFRelease(sample);
                if (!appended) {
                    fprintf(stderr, "Append failed at frame %ld: status=%ld, %s\n", (long)globalFrame,
                            (long)writer.status, writer.error.localizedDescription.UTF8String ?: "unknown error");
                    return 9;
                }
                globalFrame++;
            }
        }

        [input markAsFinished];
        dispatch_semaphore_t semaphore = dispatch_semaphore_create(0);
        [writer finishWritingWithCompletionHandler:^{ dispatch_semaphore_signal(semaphore); }];
        dispatch_semaphore_wait(semaphore, DISPATCH_TIME_FOREVER);
        for (NSValue *value in images) CGImageRelease([value pointerValue]);
        if (writer.status != AVAssetWriterStatusCompleted) {
            fprintf(stderr, "%s\n", writer.error.localizedDescription.UTF8String ?: "Movie export failed");
            return 10;
        }
        printf("%s\n", outputURL.path.UTF8String);
    }
    return 0;
}
