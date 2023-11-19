document.addEventListener('DOMContentLoaded', function () {
    // WebGL setup
    const canvas = document.getElementById('webgl-canvas');
    const gl = canvas.getContext('webgl');

    // Image processing parameters
    let brightness = 0;
    let contrast = 1;
    let saturation = 1;
    let isGreyscale = false;

    // GUI elements
    const brightnessInput = document.getElementById('brightness');
    const contrastInput = document.getElementById('contrast');
    const saturationInput = document.getElementById('saturation');
    const toggleButton = document.getElementById('toggle-mode');
    const brightnessContrastButton = document.getElementById('brightness-contrast');
    const loadRandomImageButton = document.getElementById('load-random-image');

    // WebGL program and shader variables
    let program;
    let vertexShaderSource, fragmentShaderSource;
    let vertexShader, fragmentShader;
    let positionBuffer;
    let texture;

    // Load and initialize shaders, buffers, and other WebGL setup
    initializeWebGL();

    // Event listeners for GUI elements
    brightnessInput.addEventListener('input', updateBrightness);
    contrastInput.addEventListener('input', updateContrast);
    saturationInput.addEventListener('input', updateSaturation);
    toggleButton.addEventListener('click', toggleGreyscale);
    brightnessContrastButton.addEventListener('click', applyBrightnessContrast);
    loadRandomImageButton.addEventListener('click', loadRandomImage);

    // Image processing functions
    function updateBrightness() {
        brightness = parseFloat(brightnessInput.value);
        applyImageProcessing();
    }

    function updateContrast() {
        contrast = parseFloat(contrastInput.value);
        applyImageProcessing();
    }

    function updateSaturation() {
        saturation = parseFloat(saturationInput.value);
        applyImageProcessing();
    }

    function applyBrightnessContrast() {
        gl.useProgram(program);

        const combinedValue = calculateCombinedValue();

        gl.uniform1f(gl.getUniformLocation(program, 'u_combinedValue'), combinedValue);
        gl.uniform1f(gl.getUniformLocation(program, 'u_saturation'), saturation);
        gl.uniform1i(gl.getUniformLocation(program, 'u_isGreyscale'), isGreyscale);

        // Other uniform updates if needed

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    function calculateCombinedValue() {
        // Implement the combined equation based on your needs
        // Example: return a * (color.rgb) + b;
    }

    function toggleGreyscale() {
        isGreyscale = !isGreyscale;
        applyImageProcessing();
    }

    function initializeWebGL() {
        if (!gl) {
            console.error('Unable to initialize WebGL. Your browser may not support it.');
            return;
        }

        vertexShaderSource = `
            attribute vec2 a_position;
            varying vec2 vTexCoord;

            void main() {
                vec2 clipspace = ((a_position + 1.0) / 2.0) * vec2(2.0, -2.0) - vec2(1.0, -1.0);
                gl_Position = vec4(clipspace, 0, 1);
                vTexCoord = (a_position + 1.0) / 2.0;
            }
        `;

        fragmentShaderSource = `
            precision mediump float;
            uniform sampler2D u_texture;
            uniform float u_brightness;
            uniform float u_contrast;
            uniform float u_saturation;
            uniform bool u_isGreyscale;
            varying vec2 vTexCoord;

            void main() {
                vec4 color = texture2D(u_texture, vTexCoord);

                if (u_isGreyscale) {
                    float grey = (color.r + color.g + color.b) / 3.0;
                    color = vec4(vec3(grey), color.a);
                } else {
                    // Apply RGB to HSL conversion and back
                    // ... (implement this part based on your needs)
                    // Example: color = rgbToHsl(color);
                }

                color.rgb = color.rgb * u_contrast + u_brightness;

                // Apply saturation
                // ... (implement this part based on your needs)
                // Example: color.rgb = saturate(color.rgb, u_saturation);

                gl_FragColor = color;
            }
        `;

        vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
        fragmentShader = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);

        if (!vertexShader || !fragmentShader) {
            console.error('Failed to compile shaders.');
            return;
        }

        program = linkProgram(gl, vertexShader, fragmentShader);

        if (!program) {
            console.error('Failed to link shader program.');
            return;
        }

        gl.useProgram(program);

        positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        const positions = [
            -1.0, -1.0,
            1.0, -1.0,
            -1.0, 1.0,
            1.0, 1.0,
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

        const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

        texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        loadRandomImage();

        // Other setup code for textures and uniforms
        // ... (implement this part based on your needs)
    }

    function compileShader(gl, source, type) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error(`Error compiling shader: ${gl.getShaderInfoLog(shader)}`);
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    function linkProgram(gl, vertexShader, fragmentShader) {
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error(`Unable to initialize the shader program: ${gl.getProgramInfoLog(program)}`);
            return null;
        }

        return program;
    }

    function applyImageProcessing() {
        gl.useProgram(program);

        gl.uniform1f(gl.getUniformLocation(program, 'u_brightness'), brightness);
        gl.uniform1f(gl.getUniformLocation(program, 'u_contrast'), contrast);
        gl.uniform1f(gl.getUniformLocation(program, 'u_saturation'), saturation);
        gl.uniform1i(gl.getUniformLocation(program, 'u_isGreyscale'), isGreyscale);

        // Other uniform updates if needed

        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    function loadRandomImage() {
        const image = new Image();
        image.crossOrigin = 'Anonymous';
        image.src = 'https://source.unsplash.com/random';

        image.onload = function () {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            applyImageProcessing();
        };
    }
});
