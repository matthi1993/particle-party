export const sceneRenderShader = `
    struct VertexOutput {
        @builtin(position) position: vec4f,
        @location(1) color: vec4f,
        @location(2) uv: vec2<f32>,
        @location(3) selected: f32,
        @location(4) hovered: f32,
        @location(5) size: f32,
        @location(6) @interpolate(flat) trailStretch: f32,
    };

    struct Particle {
        position: vec4f,
        velocity: vec4f,
        particleAttributes: vec4f
    }

    struct ParticleType {
        color: vec4f,    // 16 bytes
        id: f32,         // 4 bytes
        radius: f32,     // 4 bytes
        size: f32,       // 4 bytes
        _padding: f32,   // 4 bytes (to align the struct to 16 bytes)
    }

    struct Uniforms {
        viewProjectionMatrix: mat4x4<f32>,
        selectionCoordinates: vec2f,
        selectionRadius: f32,
        motionBlurStrength: f32,
    }

    @group(0) @binding(0) var<storage> dataIn: array<Particle>;
    @group(0) @binding(1) var<storage> particleTypes: array<ParticleType>;
    @group(0) @binding(2) var<uniform> uniforms: Uniforms;

    @vertex
    fn vertexMain(
        @location(0) position: vec2f,
        @builtin(instance_index) instance: u32
    ) -> VertexOutput {

        let myType = particleTypes[i32(dataIn[instance].particleAttributes.x)];
        let vel = dataIn[instance].velocity.xy;
        let speed = length(vel);

        var output: VertexOutput;
        let mvp = uniforms.viewProjectionMatrix;

        let blurStrength = uniforms.motionBlurStrength;
        let trailLength = min(speed * blurStrength, 20.0);

        if (speed > 0.1 && blurStrength > 0.0 && trailLength > 0.01) {
            let velDir = vel / speed;
            let perpDir = vec2f(-velDir.y, velDir.x);

            // Total half-length along velocity: particle radius + trail behind
            let halfSize = myType.size; // the particle half-extent
            let totalHalfLen = halfSize + trailLength;

            // Map position.x (-1..1) to the stretched range
            let alongVel = mix(-totalHalfLen, halfSize, (position.x + 1.0) * 0.5);
            let perpVel = position.y * halfSize;

            let worldOffset = velDir * alongVel + perpDir * perpVel;
            let worldPos = dataIn[instance].position + vec4f(worldOffset, 0, 0);
            output.position = mvp * worldPos;

            // UV: x maps 0..1 along the stretched direction, y maps 0..1 perpendicular
            output.uv = vec2f((position.x + 1.0) * 0.5, (position.y + 1.0) * 0.5);
            output.trailStretch = trailLength / halfSize;
        } else {
            let worldPos = dataIn[instance].position + vec4f(position * myType.size, 0, 0);
            output.position = mvp * worldPos;
            output.uv = position * 0.5 + 0.5;
            output.trailStretch = 0.0;
        }

        output.color = myType.color;
        output.size = 0.5 * myType.size;

        let clickDist = length(uniforms.selectionCoordinates - dataIn[instance].position.xy);
        if (clickDist < uniforms.selectionRadius) {
            output.hovered = 1;
        }
        output.selected = dataIn[instance].particleAttributes.z;

        return output;
    }

    @fragment
    fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {

        let stretch = input.trailStretch;

        if (stretch > 0.01) {
            // Capsule / trail rendering
            // UV: x=0 is tail, x=1 is head. y=0..1 perpendicular.
            //
            // The capsule radius in UV space must match the normal circle rendering size
            // Normal circle uses: size = 0.5 * input.size (where input.size = 0.5 * myType.size)
            // So the visible radius in UV space is 0.5 * input.size
            let capsuleRadius = 0.5 * input.size; // = 0.5 * myType.size, matches normal circle rendering

            let aspectRatio = 1.0 + stretch;

            // Remap to centered coords: px in [-aspectRatio/2, aspectRatio/2], py in [-0.5, 0.5]
            let px = (input.uv.x - 0.5) * aspectRatio; // head side is positive
            let py = input.uv.y - 0.5;

            // Capsule SDF: segment from tail-center to head-center, with capsuleRadius
            let headCx = aspectRatio * 0.5 - capsuleRadius;
            let tailCx = -aspectRatio * 0.5 + capsuleRadius;

            let clampedX = clamp(px, tailCx, headCx);
            let dx = px - clampedX;
            let dist = sqrt(dx * dx + py * py);

            let edge = capsuleRadius;
            let softness = 0.02;
            let circle = smoothstep(edge - softness, edge, dist);

            if (circle >= 1.0) {
                discard;
            }

            // Fade from tail (dim) to head (bright)
            let segLen = max(headCx - tailCx, 0.001);
            let t = clamp((clampedX - tailCx) / segLen, 0.0, 1.0);
            let fadeFactor = 0.15 + 0.85 * t * t;

            let alpha = (1.0 - circle) * fadeFactor;

            // Selection/hover border
            if (dist > (edge - 0.08) && dist < edge) {
                if (input.hovered == 1) {
                    return vec4f(1.0, 1.0, 0.0, 1.0);
                }
                if (input.selected == 1) {
                    return vec4f(1.0, 0.0, 0.0, 1.0);
                }
            }

            return vec4f(input.color.xyz * alpha, alpha);
        }

        // --- Normal circle rendering (no motion blur) ---
        let center = vec2<f32>(0.5, 0.5);
        let size = 0.5 * input.size;
        let softness = 0.01;

        let dist = distance(input.uv, center);
        let circle = smoothstep(size - softness, size, dist);

        if (dist > (size - 0.1) && dist < size) {
            if (input.hovered == 1) {
                return vec4f(1.0, 1.0, 0.0, 1.0);
            }
            if (input.selected == 1) {
                return vec4f(1.0, 0.0, 0.0, 1.0);
            }
        }

        if (dist < size) {
            let alpha = 1.0 - circle;
            return vec4f(input.color.xyz * alpha, alpha);
        }

        // Glow
        let fade = smoothstep(size, size + 0.4, dist);
        let glowAlpha = (1.0 - fade) * 0.3;

        if (glowAlpha < 0.001) {
            discard;
        }

        return vec4f(input.color.xyz * glowAlpha, glowAlpha);
    }
`;
