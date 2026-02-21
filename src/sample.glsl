// Hash function - pseudo-random number from a float
float hash(float n) {
    return fract(sin(n) * 43758.5453);
}

// 3D value noise - smooth random values in space
float noise(vec3 x) {
    vec3 p = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);

    float n = p.x + p.y * 57.0 + 113.0 * p.z;

    return mix(
        mix(mix(hash(n + 0.0), hash(n + 1.0), f.x),
            mix(hash(n + 57.0), hash(n + 58.0), f.x), f.y),
        mix(mix(hash(n + 113.0), hash(n + 114.0), f.x),
            mix(hash(n + 170.0), hash(n + 171.0), f.x), f.y),
        f.z
    );
}

// Fractal Brownian Motion - layers of noise for natural detail
float fbm(vec3 p) {
    float f = 0.0;
    f += 0.5000 * noise(p); p *= 2.02;
    f += 0.2500 * noise(p); p *= 2.03;
    f += 0.1250 * noise(p); p *= 2.01;
    f += 0.0625 * noise(p);
    return f;
}

// Terrain height at a 2D position using fbm
float terrain(vec2 p) {
    float h = fbm(vec3(p * 0.4, 0.0));
    h = h * 2.5 - 1.0;
    h += 0.3 * fbm(vec3(p * 1.2, 3.7));
    return h;
}

// Scene distance function - terrain as a heightfield
float scene(vec3 p) {
    return p.y - terrain(p.xz);
}

// Surface normal via central differences
vec3 getNormal(vec3 p) {
    vec2 e = vec2(0.01, 0.0);
    return normalize(vec3(
        scene(p + e.xyy) - scene(p - e.xyy),
        scene(p + e.yxy) - scene(p - e.yxy),
        scene(p + e.yyx) - scene(p - e.yyx)
    ));
}

// Sky color with sun glow
vec3 sky(vec3 rd, vec3 sunDir) {
    float sunDot = max(dot(rd, sunDir), 0.0);
    vec3 base = mix(vec3(0.2, 0.05, 0.1), vec3(0.8, 0.3, 0.1), exp(-3.0 * rd.y));
    vec3 sunGlow = vec3(1.0, 0.6, 0.2) * pow(sunDot, 8.0);
    vec3 sunDisc = vec3(1.0, 0.9, 0.7) * pow(sunDot, 256.0);
    return base + sunGlow + sunDisc;
}

// Volumetric fog - thicker at lower altitudes
float fog(float dist, float y) {
    float density = 0.04;
    float heightFalloff = exp(-max(y, 0.0) * 0.3);
    return 1.0 - exp(-dist * density * heightFalloff);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    // Normalized coordinates centered on screen
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;

    // Sun direction - slowly orbiting
    vec3 sunDir = normalize(vec3(cos(iTime * 0.1), 0.35, sin(iTime * 0.1)));

    // Camera setup - orbiting the terrain
    float camAngle = iTime * 0.08;
    vec3 ro = vec3(sin(camAngle) * 6.0, 2.5, cos(camAngle) * 6.0);
    vec3 target = vec3(0.0, 0.5, 0.0);

    // Camera matrix (look-at)
    vec3 forward = normalize(target - ro);
    vec3 right = normalize(cross(forward, vec3(0.0, 1.0, 0.0)));
    vec3 up = cross(right, forward);
    vec3 rd = normalize(forward * 1.5 + right * uv.x + up * uv.y);

    // Sky background
    vec3 col = sky(rd, sunDir);

    // Raymarching loop
    float t = 0.0;
    for (int i = 0; i < 100; i++) {
        vec3 p = ro + rd * t;
        float d = scene(p);
        if (d < 0.005 || t > 40.0) break;
        t += d * 0.6;
    }

    // Surface shading
    if (t < 40.0) {
        vec3 p = ro + rd * t;
        vec3 n = getNormal(p);

        // Diffuse lighting from sun
        float diff = max(dot(n, sunDir), 0.0);

        // Specular highlight
        float spec = pow(max(dot(reflect(-sunDir, n), -rd), 0.0), 16.0);

        // Fake ambient occlusion from normal direction
        float ao = 0.5 + 0.5 * n.y;

        // Terrain color by height - green valleys to brown peaks
        vec3 matColor = mix(
            vec3(0.15, 0.35, 0.1),
            vec3(0.5, 0.35, 0.2),
            smoothstep(0.0, 1.5, p.y)
        );

        // Snow on high, flat surfaces
        float snow = smoothstep(0.8, 1.2, p.y) * smoothstep(0.5, 0.9, n.y);
        matColor = mix(matColor, vec3(0.9, 0.92, 0.95), snow);

        // Combine lighting
        vec3 sunColor = vec3(1.0, 0.8, 0.5);
        vec3 ambColor = vec3(0.15, 0.1, 0.2);
        col = matColor * (diff * sunColor * ao + ambColor) + spec * sunColor * 0.3;

        // Distance fog blending into sky
        float f = fog(t, p.y);
        vec3 fogColor = sky(rd, sunDir);
        col = mix(col, fogColor, f);
    }

    // Gamma correction
    col = pow(col, vec3(0.4545));

    fragColor = vec4(col, 1.0);
}
