precision mediump float;
uniform sampler2D inputTextureY;
uniform sampler2D inputTextureU;
uniform sampler2D inputTextureV;
varying vec2 textureCoordinate;
uniform sampler2D map;
uniform sampler2D metal;
uniform sampler2D edge_burn;
uniform sampler2D gradient_map;
uniform sampler2D soft_light_map;

void main ()
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

	mediump vec3 texel = vec3(r, g, b);

	mediump vec3 edge = texture2D(edge_burn, textureCoordinate).rgb;
	texel = texel * edge;

	texel = vec3(texture2D(map, vec2(texel.r, .5)).r,
	texture2D(map, vec2(texel.g, .5)).g,
	texture2D(map, vec2(texel.b, .5)).b);

	mediump vec3 luma = vec3(.30, .59, .11);
	mediump vec3 gradSample = texture2D(gradient_map, vec2(dot(luma, texel), .5)).rgb;
	mediump vec3 final = vec3(texture2D(soft_light_map, vec2(gradSample.r, texel.r)).r,
	texture2D(soft_light_map, vec2(gradSample.g, texel.g)).g,
	texture2D(soft_light_map, vec2(gradSample.b, texel.b)).b);

	mediump vec3 metalSample = texture2D(metal, textureCoordinate).rgb;
	mediump vec3 metaled = vec3(texture2D(soft_light_map, vec2(metalSample.r, final.r)).r,
	texture2D(soft_light_map, vec2(metalSample.g, final.g)).g,
	texture2D(soft_light_map, vec2(metalSample.b, final.b)).b);
	gl_FragColor = vec4(metaled, 1.0);
}