/**
 * Animated Background
 * Based on https://tympanus.net/Development/AnimatedHeaderBackgrounds/
 */

export default class AnimatedBackground {
  constructor(el) {
    this.el = el;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.points = [];
    this.target = {
      x: this.width / 2,
      y: this.height / 2
    };
    this.animateHeader = true;
    
    // Main initialization
    this.initHeader();
    this.initAnimation();
    this.addListeners();
  }
  
  // Initialize header animation
  initHeader() {
    // Add canvas to the header
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.zIndex = '0';
    this.canvas.style.pointerEvents = 'none';
    this.el.appendChild(this.canvas);
    
    // Create points
    this.points = [];
    for (let x = 0; x < this.width; x = x + this.width / 20) {
      for (let y = 0; y < this.height; y = y + this.height / 20) {
        const px = x + Math.random() * this.width / 20;
        const py = y + Math.random() * this.height / 20;
        const p = { 
          x: px, 
          originX: px, 
          y: py, 
          originY: py,
          vx: 0,
          vy: 0,
          targetX: px,
          targetY: py
        };
        this.points.push(p);
      }
    }
    
    // For each point find the 5 closest points
    for (let i = 0; i < this.points.length; i++) {
      const closest = [];
      const p1 = this.points[i];
      
      for (let j = 0; j < this.points.length; j++) {
        const p2 = this.points[j];
        
        if (p1 !== p2) {
          let placed = false;
          
          for (let k = 0; k < 5; k++) {
            if (!placed) {
              if (closest[k] === undefined) {
                closest[k] = p2;
                placed = true;
              }
            }
          }
          
          for (let k = 0; k < 5; k++) {
            if (!placed) {
              if (this.getDistance(p1, p2) < this.getDistance(p1, closest[k])) {
                closest[k] = p2;
                placed = true;
              }
            }
          }
        }
      }
      
      p1.closest = closest;
    }
    
    // Assign a circle to each point
    for (let i in this.points) {
      const c = new Circle(this.ctx, this.points[i], 2 + Math.random() * 2, 'rgba(124, 77, 255,0.3)');
      this.points[i].circle = c;
    }
  }
  
  // Event handling
  addListeners() {
    window.addEventListener('mousemove', this.mouseMove.bind(this));
    window.addEventListener('scroll', this.scrollCheck.bind(this));
    window.addEventListener('resize', this.resize.bind(this));
  }
  
  mouseMove(e) {
    let posx = 0;
    let posy = 0;
    
    if (e.pageX || e.pageY) {
      posx = e.pageX;
      posy = e.pageY;
    } else if (e.clientX || e.clientY) {
      posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
      posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }
    
    this.target.x = posx;
    this.target.y = posy;
  }
  
  scrollCheck() {
    if (document.body.scrollTop > this.height) {
      this.animateHeader = false;
    } else {
      this.animateHeader = true;
    }
  }
  
  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }
  
  initAnimation() {
    this.animate();
    
    for (let i in this.points) {
      this.shiftPoint(this.points[i]);
    }
  }
  
  animate() {
    if (this.animateHeader) {
      this.ctx.clearRect(0, 0, this.width, this.height);
      
      for (let i in this.points) {
        // Detect points in range
        if (Math.abs(this.getDistance(this.target, this.points[i])) < 4000) {
          this.points[i].active = 0.3;
          this.points[i].circle.active = 0.6;
        } else if (Math.abs(this.getDistance(this.target, this.points[i])) < 20000) {
          this.points[i].active = 0.1;
          this.points[i].circle.active = 0.3;
        } else if (Math.abs(this.getDistance(this.target, this.points[i])) < 40000) {
          this.points[i].active = 0.02;
          this.points[i].circle.active = 0.1;
        } else {
          this.points[i].active = 0;
          this.points[i].circle.active = 0;
        }
        
        this.drawLines(this.points[i]);
        this.points[i].circle.draw();
      }
    }
    
    requestAnimationFrame(this.animate.bind(this));
  }
  
  shiftPoint(p) {
    // Instead of using TweenLite, we'll implement our own simple animation
    p.targetX = p.originX - 50 + Math.random() * 100;
    p.targetY = p.originY - 50 + Math.random() * 100;
    
    // Update point position in the animation loop
    const updatePoint = () => {
      // Calculate distance to target
      const dx = p.targetX - p.x;
      const dy = p.targetY - p.y;
      
      // Apply easing
      p.vx += dx * 0.01;
      p.vy += dy * 0.01;
      
      // Apply friction
      p.vx *= 0.95;
      p.vy *= 0.95;
      
      // Update position
      p.x += p.vx;
      p.y += p.vy;
      
      // Check if close to target
      if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
        // Set new target
        p.targetX = p.originX - 50 + Math.random() * 100;
        p.targetY = p.originY - 50 + Math.random() * 100;
      }
      
      // Continue animation
      requestAnimationFrame(updatePoint);
    };
    
    updatePoint();
  }
  
  drawLines(p) {
    if (!p.active) return;
    
    for (let i in p.closest) {
      this.ctx.beginPath();
      this.ctx.moveTo(p.x, p.y);
      this.ctx.lineTo(p.closest[i].x, p.closest[i].y);
      this.ctx.strokeStyle = 'rgba(124, 77, 255,' + p.active + ')';
      this.ctx.stroke();
    }
  }
  
  getDistance(p1, p2) {
    return Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);
  }
  
  // Clean up event listeners when component unmounts
  destroy() {
    window.removeEventListener('mousemove', this.mouseMove);
    window.removeEventListener('scroll', this.scrollCheck);
    window.removeEventListener('resize', this.resize);
    
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}

// Circle class
class Circle {
  constructor(ctx, pos, rad, color) {
    this.ctx = ctx;
    this.pos = pos || null;
    this.radius = rad || null;
    this.color = color || null;
    this.active = 0.3;
  }
  
  draw() {
    if (!this.active) return;
    
    this.ctx.beginPath();
    this.ctx.arc(this.pos.x, this.pos.y, this.radius, 0, 2 * Math.PI, false);
    this.ctx.fillStyle = 'rgba(124, 77, 255,' + this.active + ')';
    this.ctx.fill();
  }
} 