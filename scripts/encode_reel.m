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

int main(int argc, const char * argv[]) {
    @autoreleasepool {
        if (argc < 4) {
            fprintf(stderr, "Usage: encode_reel <scene-dir> <output.mp4> <fps>\n");
            return 1;
        }
        NSString *sceneDirectory = [NSString stringWithUTF8String:argv[1]];
        NSURL *outputURL = [NSURL fileURLWithPath:[NSString stringWithUTF8String:argv[2]]];
        NSInteger fps = MAX(12, atoi(argv[3]));
        NSArray<NSNumber *> *durations = @[@2.4, @2.8, @2.6, @2.8, @2.8, @2.8, @3.4];
        NSMutableArray *images = [NSMutableArray array];
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
        BOOL intermediateMovie = [[outputURL.pathExtension lowercaseString] isEqualToString:@"mov"];
        AVFileType fileType = intermediateMovie ? AVFileTypeQuickTimeMovie : AVFileTypeMPEG4;
        AVAssetWriter *writer = [[AVAssetWriter alloc] initWithURL:outputURL fileType:fileType error:&error];
        if (!writer) {
            fprintf(stderr, "%s\n", error.localizedDescription.UTF8String);
            return 3;
        }
        NSDictionary *settings = intermediateMovie ? @{
            AVVideoCodecKey: AVVideoCodecTypeJPEG,
            AVVideoWidthKey: @1080,
            AVVideoHeightKey: @1920,
            AVVideoCompressionPropertiesKey: @{
                AVVideoQualityKey: @0.82,
            },
        } : @{
            AVVideoCodecKey: AVVideoCodecTypeH264,
            AVVideoWidthKey: @1080,
            AVVideoHeightKey: @1920,
            AVVideoCompressionPropertiesKey: @{
                AVVideoAverageBitRateKey: @8000000,
                AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
            },
        };
        AVAssetWriterInput *input = [AVAssetWriterInput assetWriterInputWithMediaType:AVMediaTypeVideo outputSettings:settings];
        input.expectsMediaDataInRealTime = NO;
        NSDictionary *attributes = @{
            (NSString *)kCVPixelBufferPixelFormatTypeKey: @(kCVPixelFormatType_32BGRA),
            (NSString *)kCVPixelBufferWidthKey: @1080,
            (NSString *)kCVPixelBufferHeightKey: @1920,
            (NSString *)kCVPixelBufferCGImageCompatibilityKey: @YES,
            (NSString *)kCVPixelBufferCGBitmapContextCompatibilityKey: @YES,
        };
        AVAssetWriterInputPixelBufferAdaptor *adaptor = [AVAssetWriterInputPixelBufferAdaptor assetWriterInputPixelBufferAdaptorWithAssetWriterInput:input sourcePixelBufferAttributes:attributes];
        [writer addInput:input];
        [writer startWriting];
        [writer startSessionAtSourceTime:kCMTimeZero];

        NSInteger globalFrame = 0;
        CGFloat transitionSeconds = 0.28;
        for (NSInteger scene = 0; scene < images.count; scene++) {
            NSInteger frameCount = llround(durations[scene].doubleValue * fps);
            for (NSInteger localFrame = 0; localFrame < frameCount; localFrame++) {
                while (!input.readyForMoreMediaData) usleep(2000);
                CVPixelBufferRef buffer = NULL;
                CVReturn status = kCVReturnInvalidArgument;
                if (adaptor.pixelBufferPool) {
                    status = CVPixelBufferPoolCreatePixelBuffer(NULL, adaptor.pixelBufferPool, &buffer);
                }
                if (status != kCVReturnSuccess || !buffer) {
                    status = CVPixelBufferCreate(
                        kCFAllocatorDefault,
                        1080,
                        1920,
                        kCVPixelFormatType_32BGRA,
                        NULL,
                        &buffer
                    );
                }
                if (status != kCVReturnSuccess || !buffer) return 4;
                CVPixelBufferLockBaseAddress(buffer, 0);
                void *base = CVPixelBufferGetBaseAddress(buffer);
                size_t bytesPerRow = CVPixelBufferGetBytesPerRow(buffer);
                CGColorSpaceRef space = CGColorSpaceCreateDeviceRGB();
                CGContextRef context = CGBitmapContextCreate(base, 1080, 1920, 8, bytesPerRow, space, kCGImageAlphaPremultipliedFirst | kCGBitmapByteOrder32Little);
                CGContextSetRGBFillColor(context, 0.02, 0.08, 0.06, 1.0);
                CGContextFillRect(context, CGRectMake(0, 0, 1080, 1920));
                CGFloat progress = (CGFloat)localFrame / MAX(1, frameCount - 1);
                CGFloat scale = 1.0 + progress * 0.022;
                CGImageRef current = [[images objectAtIndex:scene] pointerValue];
                DrawImage(context, current, 1080, 1920, scale, 1.0);
                NSInteger transitionFrames = llround(transitionSeconds * fps);
                if (scene + 1 < images.count && localFrame >= frameCount - transitionFrames) {
                    CGFloat fade = (CGFloat)(localFrame - (frameCount - transitionFrames)) / MAX(1, transitionFrames - 1);
                    CGImageRef next = [[images objectAtIndex:scene + 1] pointerValue];
                    DrawImage(context, next, 1080, 1920, 1.0, fade);
                }
                CGContextRelease(context);
                CGColorSpaceRelease(space);
                CVPixelBufferUnlockBaseAddress(buffer, 0);
                CMTime time = CMTimeMake(globalFrame, (int32_t)fps);
                if (![adaptor appendPixelBuffer:buffer withPresentationTime:time]) {
                    fprintf(stderr, "Frame append failed at %ld; writer status=%ld; %s\n", (long)globalFrame, (long)writer.status, writer.error.localizedDescription.UTF8String ?: "no writer error");
                    CVPixelBufferRelease(buffer);
                    return 5;
                }
                CVPixelBufferRelease(buffer);
                globalFrame++;
            }
        }

        [input markAsFinished];
        dispatch_semaphore_t semaphore = dispatch_semaphore_create(0);
        [writer finishWritingWithCompletionHandler:^{ dispatch_semaphore_signal(semaphore); }];
        dispatch_semaphore_wait(semaphore, DISPATCH_TIME_FOREVER);
        for (NSValue *value in images) CGImageRelease([value pointerValue]);
        if (writer.status != AVAssetWriterStatusCompleted) {
            fprintf(stderr, "%s\n", writer.error.localizedDescription.UTF8String);
            return 6;
        }
        printf("%s\n", outputURL.path.UTF8String);
    }
    return 0;
}
