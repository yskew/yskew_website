import { Renderer, Transform, Vec3, Color, Polyline } from 'ogl';

class Ribbons {
  constructor(container, options = {}) {
    this.container = container;
    this.colors = options.colors || ['#ffffff']; // Updated default color to white
    this.baseSpring = options.baseSpring || 0.03;
    this.baseFriction = options.baseFriction || 0.9;
    this.baseThickness = options.baseThickness || 40; // Increased base thickness to 40
    this.offsetFactor = options.offsetFactor || 0.05;
    this.maxAge = options.maxAge !== undefined ? options.maxAge : 500;
    this.pointCount = options.pointCount || 50;
    this.speedMultiplier = options.speedMultiplier !== undefined ? options.speedMultiplier : 0.55;
    this.enableFade = options.enableFade !== undefined ? options.enableFade : false; // Default fade off
    this.enableShaderEffect = options.enableShaderEffect !== undefined ? options.enableShaderEffect : true; // Default shader on
    this.effectAmplitude = options.effectAmplitude || 2;
    this.backgroundColor = options.backgroundColor || [0, 0, 0, 0];

    this.init();
  }

  init() {
    this.renderer = new Renderer({ dpr: window.devicePixelRatio || 2, alpha: true });
    const gl = this.renderer.gl;

    if (Array.isArray(this.backgroundColor) && this.backgroundColor.length === 4) {
      gl.clearColor(this.backgroundColor[0], this.backgroundColor[1], this.backgroundColor[2], this.backgroundColor[3]);
    } else {
      gl.clearColor(0, 0, 0, 0);
    }

    gl.canvas.style.position = 'absolute';
    gl.canvas.style.top = '0';
    gl.canvas.style.left = '0';
    gl.canvas.style.width = '100%';
    gl.canvas.style.height = '100%';
    gl.canvas.style.pointerEvents = 'none'; // CRITICAL: Let clicks pass through to the game
    gl.canvas.style.zIndex = '0'; // Put it behind the game elements but above background

    this.container.appendChild(gl.canvas);

    this.scene = new Transform();
    this.lines = [];

    const vertex = `
      precision highp float;
      
      attribute vec3 position;
      attribute vec3 next;
      attribute vec3 prev;
      attribute vec2 uv;
      attribute float side;
      
      uniform vec2 uResolution;
      uniform float uDPR;
      uniform float uThickness;
      uniform float uTime;
      uniform float uEnableShaderEffect;
      uniform float uEffectAmplitude;
      
      varying vec2 vUV;
      
      vec4 getPosition() {
          vec4 current = vec4(position, 1.0);
          vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
          vec2 nextScreen = next.xy * aspect;
          vec2 prevScreen = prev.xy * aspect;
          vec2 tangent = normalize(nextScreen - prevScreen);
          vec2 normal = vec2(-tangent.y, tangent.x);
          normal /= aspect;
          normal *= mix(1.0, 0.1, pow(abs(uv.y - 0.5) * 2.0, 2.0));
          float dist = length(nextScreen - prevScreen);
          normal *= smoothstep(0.0, 0.02, dist);
          float pixelWidthRatio = 1.0 / (uResolution.y / uDPR);
          float pixelWidth = current.w * pixelWidthRatio;
          normal *= pixelWidth * uThickness;
          current.xy -= normal * side;
          if(uEnableShaderEffect > 0.5) {
            current.xy += normal * sin(uTime + current.x * 10.0) * uEffectAmplitude;
          }
          return current;
      }
      
      void main() {
          vUV = uv;
          gl_Position = getPosition();
      }
    `;

    const fragment = `
      precision highp float;
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform float uEnableFade;
      varying vec2 vUV;
      void main() {
          float fadeFactor = 1.0;
          if(uEnableFade > 0.5) {
              fadeFactor = 1.0 - smoothstep(0.0, 1.0, vUV.y);
          }
          gl_FragColor = vec4(uColor, uOpacity * fadeFactor);
      }
    `;

    this.resize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      this.renderer.setSize(width, height);
      this.lines.forEach(line => line.polyline.resize());
    };
    window.addEventListener('resize', this.resize);

    const center = (this.colors.length - 1) / 2;
    this.colors.forEach((color, index) => {
      const spring = this.baseSpring + (Math.random() - 0.5) * 0.05;
      const friction = this.baseFriction + (Math.random() - 0.5) * 0.05;
      const thickness = this.baseThickness + (Math.random() - 0.5) * 3;
      const mouseOffset = new Vec3(
        (index - center) * this.offsetFactor + (Math.random() - 0.5) * 0.01,
        (Math.random() - 0.5) * 0.1,
        0
      );

      const line = {
        spring,
        friction,
        mouseVelocity: new Vec3(),
        mouseOffset
      };

      const count = this.pointCount;
      const points = [];
      for (let i = 0; i < count; i++) {
        points.push(new Vec3());
      }
      line.points = points;

      line.polyline = new Polyline(gl, {
        points,
        vertex,
        fragment,
        uniforms: {
          uColor: { value: new Color(color) },
          uThickness: { value: thickness },
          uOpacity: { value: 1.0 },
          uTime: { value: 0.0 },
          uEnableShaderEffect: { value: this.enableShaderEffect ? 1.0 : 0.0 },
          uEffectAmplitude: { value: this.effectAmplitude },
          uEnableFade: { value: this.enableFade ? 1.0 : 0.0 }
        }
      });
      line.polyline.mesh.setParent(this.scene);
      this.lines.push(line);
    });

    this.resize();

    this.mouse = new Vec3();
    
    // We bind the mousemove to the window to track across the whole screen
    this.updateMouse = (e) => {
      let x, y;
      if (e.changedTouches && e.changedTouches.length) {
        x = e.changedTouches[0].clientX;
        y = e.changedTouches[0].clientY;
      } else {
        x = e.clientX;
        y = e.clientY;
      }
      const width = window.innerWidth;
      const height = window.innerHeight;
      this.mouse.set((x / width) * 2 - 1, (y / height) * -2 + 1, 0);
    };
    
    window.addEventListener('mousemove', this.updateMouse);
    window.addEventListener('touchstart', this.updateMouse);
    window.addEventListener('touchmove', this.updateMouse);

    this.tmp = new Vec3();
    this.lastTime = performance.now();
    
    this.update = () => {
      this.frameId = requestAnimationFrame(this.update);
      const currentTime = performance.now();
      const dt = currentTime - this.lastTime;
      this.lastTime = currentTime;

      this.lines.forEach(line => {
        this.tmp.copy(this.mouse).add(line.mouseOffset).sub(line.points[0]).multiply(line.spring);
        line.mouseVelocity.add(this.tmp).multiply(line.friction);
        line.points[0].add(line.mouseVelocity);

        for (let i = 1; i < line.points.length; i++) {
          if (isFinite(this.maxAge) && this.maxAge > 0) {
            const segmentDelay = this.maxAge / (line.points.length - 1);
            const alpha = Math.min(1, (dt * this.speedMultiplier) / segmentDelay);
            line.points[i].lerp(line.points[i - 1], alpha);
          } else {
            line.points[i].lerp(line.points[i - 1], 0.9);
          }
        }
        if (line.polyline.mesh.program.uniforms.uTime) {
          line.polyline.mesh.program.uniforms.uTime.value = currentTime * 0.001;
        }
        line.polyline.updateGeometry();
      });

      this.renderer.render({ scene: this.scene });
    };
    
    this.update();
  }
}

// Initialize the Ribbons effect when the document loads
document.addEventListener('DOMContentLoaded', () => {
  // Create a container for the ribbons that spans the whole screen
  const ribbonsContainer = document.createElement('div');
  ribbonsContainer.style.position = 'fixed';
  ribbonsContainer.style.top = '0';
  ribbonsContainer.style.left = '0';
  ribbonsContainer.style.width = '100vw';
  ribbonsContainer.style.height = '100vh';
  ribbonsContainer.style.pointerEvents = 'none'; // Critical so it doesn't block clicks
  ribbonsContainer.style.zIndex = '5'; // Above background, below game UI (z-10)
  
  // Insert it right after the body tag opens
  document.body.insertBefore(ribbonsContainer, document.body.firstChild);
  
  // Start the effect
  new Ribbons(ribbonsContainer, {
    colors: ['#cccccc'], // White/grey color as requested
    baseThickness: 40,
    speedMultiplier: 0.55,
    maxAge: 500,
    enableFade: false,
    enableShaderEffect: true
  });
});