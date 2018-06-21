//
//  VSShader.h
//  Pods
//
//  Created by pengshuang on 3/1/16.
//
//

#ifndef VSGLShader_h
#define VSGLShader_h

#define STRINGIZE(x) #x
#define STRINGIZE2(x) STRINGIZE(x)
#define SHADER_STRING(text) @ STRINGIZE2(text)

/* Map filter
 */
NSString *const kMapVertexShaderString = SHADER_STRING
(
 attribute vec4 vertexIn;
 attribute vec2 textureIn;
 varying vec2 textureOut;
 void main(void)
{
    gl_Position = vertexIn;
    textureOut = textureIn;
}
 );

NSString *const kMapFragmentShaderString = SHADER_STRING
(
 precision mediump float;
 varying vec2 textureOut;
 uniform sampler2D Texture;
 uniform sampler2D toneCurveTexture;
 uniform lowp float vignetteStart;
 uniform lowp float vignetteEnd;
 void main(void)
{
    highp vec4 rgb;
    rgb = texture2D(Texture, textureOut);
    lowp float d = distance(textureOut, vec2(0.5,0.5));
    d = 1.0 - smoothstep(vignetteStart, vignetteEnd, d);
    rgb *= d;
    lowp vec4 outputColor = rgb;
    lowp float redCurveValue  = texture2D(toneCurveTexture, vec2(outputColor.r, 0.0)).r;
    lowp float greenCurveValue = texture2D(toneCurveTexture, vec2(outputColor.g, 0.0)).g;
    lowp float blueCurveValue  = texture2D(toneCurveTexture, vec2(outputColor.b, 0.0)).b;
    outputColor = vec4(redCurveValue, greenCurveValue, blueCurveValue,outputColor.a);
    gl_FragColor = outputColor;
}
 );


NSString *const kMapFragmentShader420String = SHADER_STRING
(
 precision mediump float;
 varying vec2 textureOut;
 uniform sampler2D TextureY;
 uniform sampler2D TextureUV;
 uniform sampler2D toneCurveTexture;
 uniform lowp float vignetteStart;
 uniform lowp float vignetteEnd;
 uniform mediump mat3 colorConversionMatrix;
 void main(void)
{
    vec3 yuv;
    vec3 rgb;
    yuv.x = texture2D(TextureY, textureOut).r;
    yuv.yz = texture2D(TextureUV, textureOut).ra - vec2(0.5, 0.5);
    rgb = colorConversionMatrix * yuv;
    lowp float d = distance(textureOut, vec2(0.5,0.5));
    d = 1.0 - smoothstep(vignetteStart, vignetteEnd, d);
    rgb *= d;
    lowp vec4 outputColor = vec4(rgb,1.0);
    lowp float redCurveValue  = texture2D(toneCurveTexture, vec2(outputColor.r, 0.0)).r;
    lowp float greenCurveValue = texture2D(toneCurveTexture, vec2(outputColor.g, 0.0)).g;
    lowp float blueCurveValue  = texture2D(toneCurveTexture, vec2(outputColor.b, 0.0)).b;
    outputColor = vec4(redCurveValue, greenCurveValue, blueCurveValue,outputColor.a);
    gl_FragColor = outputColor;
}

 );
/* beautify filter
 */
NSString *const kBeautifyVertexShaderString = SHADER_STRING
(
 attribute vec4 vertexIn;
 attribute vec2 textureIn;
 varying vec2 textureOut;
 void main(void)
{
    gl_Position = vertexIn;
    textureOut = textureIn;
}
 );

NSString *const kBeautifyFragmentShaderString = SHADER_STRING
(
 precision mediump float;
 varying vec2 textureOut;
 uniform sampler2D TextureY;
 uniform sampler2D TextureUV;
 uniform sampler2D toneCurveTexture;
 uniform lowp float vignetteStart;
 uniform lowp float vignetteEnd;
 uniform mediump mat3 colorConversionMatrix;
 void main(void)
{
    vec3 yuv;
    vec3 rgb;
    yuv.x = texture2D(TextureY, textureOut).r;
    yuv.yz = texture2D(TextureUV, textureOut).ra - vec2(0.5, 0.5);
    rgb = colorConversionMatrix * yuv;
    lowp float d = distance(textureOut, vec2(0.5,0.5));
    d = 1.0 - smoothstep(vignetteStart, vignetteEnd, d);
    rgb *= d;
    lowp vec4 outputColor = vec4(rgb,1.0);
    lowp float redCurveValue  = texture2D(toneCurveTexture, vec2(outputColor.r, 0.0)).r;
    lowp float greenCurveValue = texture2D(toneCurveTexture, vec2(outputColor.g, 0.0)).g;
    lowp float blueCurveValue  = texture2D(toneCurveTexture, vec2(outputColor.b, 0.0)).b;
    outputColor = vec4(redCurveValue, greenCurveValue, blueCurveValue,outputColor.a);
    gl_FragColor = outputColor;
}
 );

#endif /* VSGLShader_h */
