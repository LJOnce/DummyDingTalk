precision mediump float;
uniform sampler2D inputTextureY;
uniform sampler2D inputTextureU;
uniform sampler2D inputTextureV;
uniform sampler2D overlay_map;
uniform sampler2D blackboard;
uniform sampler2D map;
varying vec2 textureCoordinate;
void main()
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

	//mediump vec3 texel = (texture2D(inputImageTexture, textureCoordinate)).rgb;
	mediump vec3 texel = vec3(r, g, b);
	mediump vec3 bbTexel = texture2D(blackboard, textureCoordinate).rgb;

	texel.r = texture2D(overlay_map, vec2(bbTexel.r, texel.r)).r;
	texel.g = texture2D(overlay_map, vec2(bbTexel.g, texel.g)).g;
	texel.b = texture2D(overlay_map, vec2(bbTexel.b, texel.b)).b;

	texel.r = texture2D(map, vec2(texel.r, .5)).r;
	texel.g = texture2D(map, vec2(texel.g, .5)).g;
	texel.b = texture2D(map, vec2(texel.b, .5)).b;
	gl_FragColor = vec4(texel, 1.0);
}