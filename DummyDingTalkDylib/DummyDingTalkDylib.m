//  weibo: http://weibo.com/xiaoqing28
//  blog:  http://www.alonemonkey.com
//
//  DummyDingTalkDylib.m
//  DummyDingTalkDylib
//
//  Created by 刘江 on 2018/6/18.
//  Copyright (c) 2018年 Liujiang. All rights reserved.
//

#import "DummyDingTalkDylib.h"
#import <CaptainHook/CaptainHook.h>
#import <UIKit/UIKit.h>
#import <Cycript/Cycript.h>
#import <MDCycriptManager.h>
#import "DingtalkPod.h"

CHConstructor{
    NSLog(INSERT_SUCCESS_WELCOME);
    
    [[NSNotificationCenter defaultCenter] addObserverForName:UIApplicationDidFinishLaunchingNotification object:nil queue:[NSOperationQueue mainQueue] usingBlock:^(NSNotification * _Nonnull note) {
        
#ifndef __OPTIMIZE__
        CYListenServer(6666);
        MDCycriptManager* manager = [MDCycriptManager sharedInstance];
        [manager loadCycript:NO];
        NSError* error;
        NSString* result = [manager evaluateCycript:@"UIApp" error:&error];
        NSLog(@"result: %@", result);
        if(error.code != 0){
            NSLog(@"error: %@", error.localizedDescription);
        }
#endif
        //DTConversationListController
    }];
//    [DingtalkPod setLocation:CLLocationCoordinate2DMake(31.1706, 121.39268)];
}

CHDeclareClass(UIViewController)
CHDeclareClass(UIAlertView)
CHDeclareClass(DTInfoPlist)
CHDeclareClass(DTMessageCollectionViewCellIncoming)
CHDeclareClass(DTHotPatchManager)
//CHDeclareClass(H5AMApp)
//CHDeclareClass(DTBizMicroAppModel)
//CHDeclareClass(BLAppInfoUtil)
CHDeclareClass(BLAlimeiAPIClient)
CHDeclareClass(BLAPICheckAppVersionRequest)
CHDeclareClass(DTDatabaseUpdating)
CHDeclareClass(BLAPICheckAppVersionResponse)
//CHDeclareClass(DTALocationManager)
//CHDeclareClass(DTCLocationManager)
//CHDeclareClass(LALocationManager)
CHDeclareClass(BLNetworkHelper)
CHDeclareClass(LWPNetwork)
CHOptimizedMethod0(self, void, UIAlertView, show){


}
CHOptimizedMethod3(self, void, UIViewController, presentViewController, UIViewController *, viewControllerToPresent, animated, BOOL, flag, completion, id, completion) {
    if ([viewControllerToPresent isKindOfClass:[UIAlertController class]]) {
        if ([[(UIAlertController *) viewControllerToPresent title] containsString:@"检测"] || [[(UIAlertController *) viewControllerToPresent title] containsString:@"检查"] || [[(UIAlertController *) viewControllerToPresent title] containsString:@"版本"] || [[(UIAlertController *) viewControllerToPresent message] containsString:@"检测"] || [[(UIAlertController *) viewControllerToPresent message] containsString:@"检查"] || [[(UIAlertController *) viewControllerToPresent message] containsString:@"版本"]) {

        }else {
            UIViewController * controller = [UIApplication sharedApplication].keyWindow.rootViewController;
            while (controller.presentedViewController) {
                controller = controller.presentedViewController;
            }
            CHSuper3(UIViewController, presentViewController, viewControllerToPresent, animated, flag, completion, completion);
        }
    }else {
        UIViewController * controller = [UIApplication sharedApplication].keyWindow.rootViewController;
        while (controller.presentedViewController) {
            controller = controller.presentedViewController;
        }
        CHSuper3(UIViewController, presentViewController, viewControllerToPresent, animated, flag, completion, completion);
    }
}

CHOptimizedClassMethod1(self, id, DTMessageCollectionViewCellIncoming, cellReuseIdentifierWithMessageType, long long, arg1) {
    id returnObj = CHSuper1(DTMessageCollectionViewCellIncoming, cellReuseIdentifierWithMessageType, arg1);
    NSLog(@"cellReuseIdentifierWithMessageType--><%@, %@>", arg1, returnObj);
    
    return returnObj;
}
CHOptimizedClassMethod0(self, id, DTInfoPlist, device) {
   id obj = CHSuper0(DTInfoPlist, device);
    NSLog(@"infoplist---device--%@", obj);
    return obj;
}
CHOptimizedClassMethod0(self, bool, DTInfoPlist, isZhuoJiPackage) {
    bool obj = CHSuper0(DTInfoPlist, isZhuoJiPackage);
     NSLog(@"infoplist---isZhuoJiPackage--%@", obj);
    return obj;
}
CHOptimizedClassMethod0(self, bool, DTInfoPlist, isGrayPackage) {
    bool obj = CHSuper0(DTInfoPlist, isGrayPackage);
     NSLog(@"infoplist---isGrayPackage--%@", obj);
    return obj;
}
CHOptimizedClassMethod0(self, long long, DTInfoPlist, packageBuildTimestamp) {
    long long obj = CHSuper0(DTInfoPlist, packageBuildTimestamp);
     NSLog(@"infoplist---packageBuildTimestamp--%@", obj);
    return obj;
}
CHOptimizedClassMethod0(self, long long, DTInfoPlist, packageValidDay) {
   long long obj = CHSuper0(DTInfoPlist, packageValidDay);
     NSLog(@"infoplist---packageValidDay--%@", obj);
    return obj;
}
CHOptimizedClassMethod0(self, bool, DTInfoPlist, isCurrentVersionEnterprise) {
    bool obj = CHSuper0(DTInfoPlist, isCurrentVersionEnterprise);
     NSLog(@"infoplist---isCurrentVersionEnterprise--%@", obj);
    return obj;;
}
CHOptimizedClassMethod0(self, id, DTInfoPlist, getHttpUserAgent) {
   id obj = CHSuper0(DTInfoPlist, getHttpUserAgent);
     NSLog(@"infoplist---getHttpUserAgent--%@", obj);
    return obj;
}
CHOptimizedClassMethod0(self, id, DTInfoPlist, getUserAgent) {
    id obj = CHSuper0(DTInfoPlist, getUserAgent);
     NSLog(@"infoplist---%@", obj);
     return obj;
}
CHOptimizedClassMethod0(self, id, DTInfoPlist, getAppBundleId) {
    id obj = CHSuper0(DTInfoPlist, getAppBundleId);
     NSLog(@"infoplist---getUserAgent--%@", obj);
     return obj;
}
CHOptimizedClassMethod0(self, id, DTInfoPlist, getAppMTLUpdateVersion) {
    id obj = CHSuper0(DTInfoPlist, getAppMTLUpdateVersion);
     NSLog(@"infoplist---getAppMTLUpdateVersion--%@", obj);
    return @"4.3.10";
}
CHOptimizedClassMethod0(self, id, DTInfoPlist, getAppFullVersion) {
    id obj = CHSuper0(DTInfoPlist, getAppFullVersion);
     NSLog(@"infoplist---getAppFullVersion--%@", obj);
    return obj;
}
CHOptimizedClassMethod0(self, id, DTInfoPlist, getAppBuildNumber) {
    id obj = CHSuper0(DTInfoPlist, getAppBuildNumber);
     NSLog(@"infoplist---getAppBuildNumber--%@", obj);
     return @"10078671";
}
CHOptimizedClassMethod0(self, id, DTInfoPlist, getAppVersion) {
    id obj = CHSuper0(DTInfoPlist, getAppVersion);
     NSLog(@"infoplist---getAppVersion--%@", obj);
     return @"4.3.10";
}
CHOptimizedClassMethod0(self, id, DTInfoPlist, getAppName) {
    id obj = CHSuper0(DTInfoPlist, getAppName);
     NSLog(@"infoplist---getAppName--%@", obj);
     return obj;
}
CHOptimizedClassMethod0(self, void, DTHotPatchManager, setupHotpatchService) {
    
}
CHOptimizedMethod4(self, id, BLAlimeiAPIClient, checkAppVersionFromSender, id, arg1, masterAccount, id, arg2, completionBlock, id, arg3, failedBlock, id, arg4) {
    id obj = CHSuper4(BLAlimeiAPIClient, checkAppVersionFromSender, arg1, masterAccount, arg2, completionBlock, arg3, failedBlock, arg4);
    return obj;
}
CHOptimizedMethod1(self, id, BLAPICheckAppVersionRequest, parseResponse, id, arg1) {
    id obj = CHSuper1(BLAPICheckAppVersionRequest, parseResponse, arg1);
    return obj;
}
CHOptimizedMethod0(self, id, DTDatabaseUpdating, lastLaunchAppVersion) {
    id obj = CHSuper0(DTDatabaseUpdating, lastLaunchAppVersion);
    return @"4.3.10";
}
CHOptimizedMethod0(self, void, DTDatabaseUpdating, updateLastLaunchAppVersion) {
    
}
CHOptimizedMethod1(self, void, DTDatabaseUpdating, checkUpdatingIfNeed, id, arg1) {
    CHSuper1(DTDatabaseUpdating, checkUpdatingIfNeed, arg1);
//    ((void(*)(id,SEL))objc_msgSend)(self, @selector(closeWindow));
    NSLog(@"%@", arg1);
}
CHOptimizedMethod0(self, id, BLAPICheckAppVersionResponse, appVersion) {
    return @"4.3.10";
}
CHOptimizedMethod0(self, BOOL, BLNetworkHelper, isNetworkReachabilityStatusReachable) {
    return YES;
}
CHOptimizedMethod0(self, BOOL, LWPNetwork, isReachable) {
    return YES;
}

CHOptimizedMethod0(self, BOOL, LWPNetwork, isNotReachable) {
    return NO;
}

CHConstructor{

    CHLoadLateClass(UIViewController);
    CHClassHook3(UIViewController, presentViewController, animated, completion);
    
    CHLoadLateClass(UIAlertView);
    CHHook0(UIAlertView, show);
    
    CHLoadLateClass(DTHotPatchManager);
    CHHook0(DTHotPatchManager, setupHotpatchService);
    
    CHLoadLateClass(BLAlimeiAPIClient);
    CHHook4(BLAlimeiAPIClient, checkAppVersionFromSender, masterAccount, completionBlock, failedBlock);
    
    CHLoadLateClass(BLAPICheckAppVersionRequest);
    CHHook1(BLAPICheckAppVersionRequest, parseResponse);
    
    CHLoadLateClass(DTDatabaseUpdating);
    CHHook0(DTDatabaseUpdating, lastLaunchAppVersion);
    CHHook0(DTDatabaseUpdating, updateLastLaunchAppVersion);
    CHHook1(DTDatabaseUpdating, checkUpdatingIfNeed);
    
    CHLoadLateClass(BLAPICheckAppVersionResponse);
    CHHook0(BLAPICheckAppVersionResponse, appVersion);
    //    CHLoadLateClass(DTMessageCollectionViewCellIncoming);
//    CHClassHook1(DTMessageCollectionViewCellIncoming, cellReuseIdentifierWithMessageType);
    CHLoadLateClass(DTInfoPlist);
    CHHook0(DTInfoPlist, device);
    CHHook0(DTInfoPlist, isZhuoJiPackage);
    CHHook0(DTInfoPlist, isGrayPackage);
    CHHook0(DTInfoPlist, packageBuildTimestamp);
    CHHook0(DTInfoPlist, packageValidDay);
    CHHook0(DTInfoPlist, isCurrentVersionEnterprise);
    CHHook0(DTInfoPlist, getHttpUserAgent);
    CHHook0(DTInfoPlist, getUserAgent);
    CHHook0(DTInfoPlist, getAppBundleId);
    CHHook0(DTInfoPlist, getAppMTLUpdateVersion);
    CHHook0(DTInfoPlist, getAppFullVersion);
    CHHook0(DTInfoPlist, getAppBuildNumber);
    CHHook0(DTInfoPlist, getAppVersion);
    CHHook0(DTInfoPlist, getAppName);
    
    CHLoadLateClass(BLNetworkHelper);
    CHHook0(BLNetworkHelper, isNetworkReachabilityStatusReachable);
    CHLoadLateClass(LWPNetwork);
    CHHook0(LWPNetwork, isReachable);
    CHHook0(LWPNetwork, isNotReachable);









}

/*
CHDeclareClass(CustomViewController)

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wstrict-prototypes"

//add new method
CHDeclareMethod1(void, CustomViewController, newMethod, NSString*, output){
    NSLog(@"This is a new method : %@", output);
}
#pragma clang diagnostic pop

CHOptimizedClassMethod0(self, void, CustomViewController, classMethod){
    NSLog(@"hook class method");
    CHSuper0(CustomViewController, classMethod);
}

CHOptimizedMethod0(self, NSString*, CustomViewController, getMyName){
    //get origin value
    NSString* originName = CHSuper(0, CustomViewController, getMyName);
    
    NSLog(@"origin name is:%@",originName);
    
    //get property
    NSString* password = CHIvar(self,_password,__strong NSString*);
    
    NSLog(@"password is %@",password);
    
    [self newMethod:@"output"];
    
    //set new property
    self.newProperty = @"newProperty";
    
    NSLog(@"newProperty : %@", self.newProperty);
    
    //change the value
    return @"刘江";
    
}

//add new property
CHPropertyRetainNonatomic(CustomViewController, NSString*, newProperty, setNewProperty);

CHConstructor{
    CHLoadLateClass(CustomViewController);
    CHClassHook0(CustomViewController, getMyName);
    CHClassHook0(CustomViewController, classMethod);
    
    CHHook0(CustomViewController, newProperty);
    CHHook1(CustomViewController, setNewProperty);
}
*/
