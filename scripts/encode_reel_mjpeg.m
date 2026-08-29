#import <Foundation/Foundation.h>
#import <AVFoundation/AVFoundation.h>
#import <AppKit/AppKit.h>
#import <ImageIO/ImageIO.h>

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
    CGContextDrawImage(context, CGRectMake(x, y, drawWidth, drawHeight), image);
    CGContextRestoreGState(context);
}

static NSData *JPEGDataForFrame(CGImageRef current, CGImageRef next, CGFloat progress, CGFloat fade) {
    const size_t width = 1080;
    const size_t height = 1920;
    CGColorSpaceRef colorSpace = CGColorSpaceCreateDeviceRGB();
    CGContextRef context = CGBitmapContextCreate(NULL, width, height, 8, width * 4, colorSpace,
                                                  kCGImageAlphaPremultipliedLast | kCGBitmapByteOrder32Big);
    CGColorSpaceRelease(colorSpace);
    if (!context) return nil;

    CGContextSetRGBFillColor(context, 0.02, 0.08, 0.06, 1.0);
    CGContextFillRect(context, CGRectMake(0, 0, width, height));
    DrawImage(context, current, width, height, 1.0 + progress * 0.022, 1.0);
    if (next && fade > 0) DrawImage(context, next, width, height, 1.0, fade);

    CGImageRef frame = CGBitmapContextCreateImage(context);
    CGContextRelease(context);
    if (!frame) return nil;

    NSMutableData *data = [NSMutableData data];
    CGImageDestinationRef destination = CGImageDestinationCreateWithData((__bridge CFMutableDataRef)data,
                                                                         CFSTR("public.jpeg"), 1, NULL);
    NSDictionary *properties = @{(__bridge NSString *)kCGImageDestinationLossyCompressionQuality: @0.88};
    CGImageDestinationAddImage(destination, frame, (__bridge CFDictionaryRef)properties);
    BOOL ok = CGImageDestinationFinalize(destination);
    CFRelease(destination);
    CGImageRelease(frame);
    return ok ? data : nil;
}

int main(int argc, const char *argv[]) {
    @autoreleasepool {
        if (argc < 4) {
            fprintf(stderr, "Usage: encode_reel_mjpeg <scene-dir> <output.mov> <fps>\n");
            return 1;
        }

        NSString *sceneDirectory = [NSString stringWithUTF8String:argv[1]];
        NSURL *outputURL = [NSURL fileURLWithPath:[NSString stringWithUTF8String:argv[2]]];
        NSInteger fps = MAX(12, atoi(argv[3]));
        NSArray<NSNumber *> *durations = @[@2.4, @2.8, @2.6, @2.8, @2.8, @2.8, @3.4];
        NSMutableArray<NSValue *> *images = [NSMutableArray array];
        for (NSInteger index = 1; index <= 7; index++) {
            NSString *filename = [NSString stringWithFormat:@"scene-%02ld.png", (long)index];
            CGImageRef image = LoadImage([sceneDirectory stringByAppendingPathComponent:filename]);
            if (!image) {
                fprintf(stderr, "Could not load %s\n", filename.UTF8String);
                return 2;
            }
            [images addObject:[NSValue valueWithPointer:image]];
        }

        [[NSFileManager defaultManager] removeItemAtURL:outputURL error:nil];
        NSError *error = nil;
        CMVideoFormatDescriptionRef format = NULL;
        OSStatus formatStatus = CMVideoFormatDescriptionCreate(kCFAllocatorDefault, kCMVideoCodecType_JPEG,
                                                                1080, 1920, NULL, &format);
        if (formatStatus != noErr || !format) return 3;

        BOOL mp4Output = [[outputURL.pathExtension lowercaseString] isEqualToString:@"mp4"];
        AVFileType outputType = mp4Output ? AVFileTypeMPEG4 : AVFileTypeQuickTimeMovie;
        AVAssetWriter *writer = [[AVAssetWriter alloc] initWithURL:outputURL fileType:outputType error:&error];
        if (!writer) {
            fprintf(stderr, "%s\n", error.localizedDescription.UTF8String);
            CFRelease(format);
            return 4;
        }
        AVAssetWriterInput *input = [AVAssetWriterInput assetWriterInputWithMediaType:AVMediaTypeVideo
                                                                       outputSettings:nil
                                                                    sourceFormatHint:format];
        input.expectsMediaDataInRealTime = NO;
        [writer addInput:input];
        [writer startWriting];
        [writer startSessionAtSourceTime:kCMTimeZero];

        NSInteger globalFrame = 0;
        NSInteger transitionFrames = llround(0.28 * fps);
        for (NSInteger scene = 0; scene < images.count; scene++) {
            NSInteger frameCount = llround(durations[scene].doubleValue * fps);
            for (NSInteger localFrame = 0; localFrame < frameCount; localFrame++) {
                while (!input.readyForMoreMediaData) usleep(2000);
                CGFloat progress = (CGFloat)localFrame / MAX(1, frameCount - 1);
                CGFloat fade = 0;
                CGImageRef next = NULL;
                if (scene + 1 < images.count && localFrame >= frameCount - transitionFrames) {
                    fade = (CGFloat)(localFrame - (frameCount - transitionFrames)) / MAX(1, transitionFrames - 1);
                    next = [images[scene + 1] pointerValue];
                }
                NSData *jpeg = JPEGDataForFrame([images[scene] pointerValue], next, progress, fade);
                if (!jpeg) return 5;

                CMBlockBufferRef block = NULL;
                OSStatus blockStatus = CMBlockBufferCreateWithMemoryBlock(kCFAllocatorDefault, NULL, jpeg.length,
                                                                          kCFAllocatorDefault, NULL, 0, jpeg.length,
                                                                          kCMBlockBufferAssureMemoryNowFlag, &block);
                if (blockStatus != noErr || !block) return 6;
                CMBlockBufferReplaceDataBytes(jpeg.bytes, block, 0, jpeg.length);

                CMSampleTimingInfo timing = {
                    .duration = CMTimeMake(1, (int32_t)fps),
                    .presentationTimeStamp = CMTimeMake(globalFrame, (int32_t)fps),
                    .decodeTimeStamp = kCMTimeInvalid,
                };
                size_t sampleSize = jpeg.length;
                CMSampleBufferRef sample = NULL;
                OSStatus sampleStatus = CMSampleBufferCreateReady(kCFAllocatorDefault, block, format, 1, 1,
                                                                  &timing, 1, &sampleSize, &sample);
                CFRelease(block);
                if (sampleStatus != noErr || !sample) return 7;
                BOOL appended = [input appendSampleBuffer:sample];
                CFRelease(sample);
                if (!appended) {
                    fprintf(stderr, "Append failed at frame %ld: %s\n", (long)globalFrame,
                            writer.error.localizedDescription.UTF8String ?: "unknown error");
                    return 8;
                }
                globalFrame++;
            }
        }

        [input markAsFinished];
        dispatch_semaphore_t semaphore = dispatch_semaphore_create(0);
        [writer finishWritingWithCompletionHandler:^{ dispatch_semaphore_signal(semaphore); }];
        dispatch_semaphore_wait(semaphore, DISPATCH_TIME_FOREVER);

        for (NSValue *value in images) CGImageRelease([value pointerValue]);
        CFRelease(format);
        if (writer.status != AVAssetWriterStatusCompleted) {
            fprintf(stderr, "%s\n", writer.error.localizedDescription.UTF8String ?: "Movie export failed");
            return 9;
        }
        printf("%s\n", outputURL.path.UTF8String);
    }
    return 0;
}
