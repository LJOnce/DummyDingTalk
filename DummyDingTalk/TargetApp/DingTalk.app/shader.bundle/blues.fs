precision mediump float;
uniform sampler2D inputTextureY;
uniform sampler2D inputTextureU;
uniform sampler2D inputTextureV;
uniform sampler2D effect_map;
varying vec2 textureCoordinate ;

void main(void)
{
    float nx,ny,r,g,b,y,u,v;
    mediump vec4 txl,ux,vx;
    nx=textureCoordinate[0];
    ny=textureCoordinate[1];
    y=texture2D(inputTextureY,vec2(nx,ny)).r;
    u=texture2D(inputTextureU,vec2(nx,ny)).r;
    v=texture2D(inputTextureV,vec2(nx,ny)).r;

      //"  y = v;\n"+
    y=1.1643*(y-0.0625);
    u=u-0.5;
    v=v-0.5;

    r=y+1.5958*v;
    g=y-0.39173*u-0.81290*v;
    b=y+2.017*u;

    //mediump vec4 texel = texture2D( inputImageTexture, textureCoordinate);
    mediump vec4 texel = vec4(r, g, b, 1.0);
    mediump vec4 maptexel = texture2D( effect_map, textureCoordinate);

    texel.r= texture2D(effect_map,vec2(texel.r,1)).r;
    texel.g= texture2D(effect_map,vec2(texel.g,1)).g;
    texel.b= texture2D(effect_map,vec2(texel.b,1)).b;
    gl_FragColor = texel;
}