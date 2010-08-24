/*
 * Copyright (c) 2010 Tim Baumann
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */


var ColorTriangle = (function(win, doc, M, undefined) {
	var PI = M.PI;
	
	// Check for Canvas Support
	if(typeof doc.createElement('canvas').getContext != 'function') {
		return null;
	}
	
	
	/*******************
	* Helper functions *
	*******************/
	
	function times(i, fn) {
		for(var j = 0; j < i; j++) {
			fn(j);
		}
	}
	
	function each(obj, fn) {
		if(obj.length) {
			times(obj.length, function(i) {
				fn(obj[i], i);
			});
		} else {
			for(var key in obj) {
				if(obj.hasOwnProperty(key)) {
					fn(obj[key], key);
				}
			}
		}
	}
	
	function getOffsets(el) {
		var left = 0,
		    top  = 0;
		while(el) {
			left += el.offsetLeft;
			top  += el.offsetTop;
			el = el.offsetParent;
		}
		return [left, top];
	}
	
	
	/*******************
	* Color conversion *
	*******************/
	
	function hue_to_rgb(v1, v2, h) {
		if(h < 0) { h += 1; }
		if(h > 1) { h -= 1; }
		
		if((6 * h) < 1) { return v1 + (v2 - v1) * 6 * h; }
		if((2 * h) < 1) { return v2; }
		if((3 * h) < 2) { return v1 + (v2 - v1) * ((2 / 3) - h) * 6; }
		return v1;
	}
	function hsl_to_rgb(h, s, l) {
		h /= 2 * PI;
		var r, g, b;
		
		if(s == 0) {
			r = g = b = l;
		} else {
			var var_1, var_2;
			if(l < 0.5) { var_2 = l * (1 + s); }
			else        { var_2 = (l + s) - (s * l); }
			
			var_1 = 2 * l - var_2;
			
			r = hue_to_rgb(var_1, var_2, h + (1/3));
			g = hue_to_rgb(var_1, var_2, h);
			b = hue_to_rgb(var_1, var_2, h - (1/3));
		}
		return [r, g, b];
	}
	
	function rgb_to_hsl(r, g, b) {
		var min = M.min(r, g, b),
		    max = M.max(r, g, b),
		    d   = max - min; // delta
		
		var h, s, l;
		
		l = (max + min) / 2;
		
		if(d == 0) {
			// gray
			h = s = 0; // HSL results from 0 to 1
		} else {
			// chroma
			if(l < 0.5) { s = d / (max + min); }
			else        { s = d / (2 - max - min); }
			
			var d_r = (((max - r) / 6) + (d / 2)) / d
			,   d_g = (((max - g) / 6) + (d / 2)) / d
			,   d_b = (((max - b) / 6) + (d / 2)) / d; // deltas
			
			if      (r == max) { h =         d_b - d_g; }
			else if (g == max) { h = (1/3) + d_r - d_b; }
			else if (b == max) { h = (2/3) + d_g - d_r; }
			
			if(h < 0)      { h += 1; }
			else if(h > 1) { h -= 1; }
		}
		h *= 2 * PI;
		return [h, s, l];
	}
	
	function hex_to_rgb(hex) {
		var groups = hex.match(/^#([A-Fa-f0-9]+)$/);
		if(groups && groups[1].length % 3 == 0) {
			hex = groups[1];
			var bytes = hex.length / 3;
			var max = Math.pow(16, bytes) - 1,
			    r = parseInt(hex.slice(0 * bytes, 1 * bytes), 16) / max,
			    g = parseInt(hex.slice(1 * bytes, 2 * bytes), 16) / max,
			    b = parseInt(hex.slice(2 * bytes, 3 * bytes), 16) / max;
			return [r, g, b];
		}
	}
	
	function pad(n) {
		if(n.length == 1) {
			n = '0' + n;
		}
		return n;
	}
	function rgb_to_hex(r, g, b) {
		r = Math.round(r * 255).toString(16);
		g = Math.round(g * 255).toString(16);
		b = Math.round(b * 255).toString(16);
		return '#' + pad(r) + pad(g) + pad(b);
	}
	
	
	/*********
	* Mixins *
	*********/
	
	function mixin(obj, mixin) {
		each(mixin, function(val, key) {
			obj[key] = val;
		});
	}
	
	var Options = {
		_setOptions: function(opts) {
			opts = opts || {};
			var dflt    = this.options,
			    options = this.options = {};
			
			each(dflt, function(val, key) {
				options[key] = (opts.hasOwnProperty(key))
					? opts[key]
					: val;
			});
		}
	};
	
	var Events = {
		addEventListener: function(type, fn) {
			if(!this.events) {
				this.events = {};
			}
			if(!this.events[type]) {
				this.events[type] = [];
			}
			this.events[type].push(fn);
		},
		removeEventListener: function(type, fn) {
			if(this.events) {
				var fns = this.events[type];
				for(var i = 0, l = fns.length; i < l; i += 1) {
					if(fns[i] == fn) {
						fns.splice(i, 1);
						break;
					}
				}
			}
		},
		_fireEvent: function(type) {
			if(this.events) {
				var evts = this.events[type];
				if(evts) {
					var args = Array.prototype.slice.call(arguments, 1);
					each(evts, function(evt) {
						evt.apply(null, args);
					});
				}
			}
		}
	};
	
	
	/****************
	* ColorTriangle *
	****************/
	
	// Constructor function:
	function ColorTriangle(color, options) {
		this._setOptions(options);
		this._calculateProperties();
		
		this._createContainer();
		this._createTriangle();
		this._createWheel();
		this._createWheelPointer();
		this._createTrianglePointer();
		this._attachEvents();
		
		color = color || '#f00';
		if(typeof color == 'string') {
			this.setHEX(color);
		} else if(this.setColor) {
			this.setColor(color);
		}
	}
	
	// Methods:
	ColorTriangle.prototype = {
		constructor: ColorTriangle,
		
		options: {
			size: 150,
			padding: 10,
			triangleSize: .8,
			wheelPointerColor1: '#444',
			wheelPointerColor2: '#eee',
			trianglePointerSize: 20,
			trianglePointerColor1: '#eee',
			trianglePointerColor2: '#444',
			background: 'transparent'
		},
		
		_calculateProperties: function() {
			var opts            = this.options;
			
			this.padding        = opts.padding;
			this.innerSize      = opts.size - 2*opts.padding
			this.triangleSize   = opts.triangleSize * this.innerSize;
			this.wheelThickness = (this.innerSize - this.triangleSize) / 2;
			this.wheelPointerSize = this.wheelThickness;
			
			this.wheelRadius    = this.innerSize / 2;
			this.triangleRadius = this.triangleSize / 2;
			this.triangleSideLength = M.sqrt(3) * this.triangleRadius;
		},
		_calculatePositions: function() {
			var r = this.triangleRadius,
			    hue = this.hue,
			    third = (2/3) * PI,
			    s = this.saturation,
			    l = this.lightness;
			
			// Colored point
			var hx = this.hx =  M.cos(hue) * r;
			var hy = this.hy = -M.sin(hue) * r;
			// Black point
			var sx = this.sx =  M.cos(hue - third) * r;
			var sy = this.sy = -M.sin(hue - third) * r;
			// White point
			var vx = this.vx =  M.cos(hue + third) * r;
			var vy = this.vy = -M.sin(hue + third) * r;
			// Current point
			var mx = (sx + vx) / 2,
			    my = (sy + vy) / 2,
			    a  = (1 - 2 * M.abs(l - .5)) * s;
			this.x = sx + (vx - sx) * l + (hx - mx) * a;
			this.y = sy + (vy - sy) * l + (hy - my) * a;
		},
		
		_createContainer: function() {
			var c = this.container = doc.createElement('div');
			c.className = 'color-triangle';
			
			c.style.display    = 'block';
			c.style.padding    = this.padding + 'px';
			c.style.position   = 'relative';
			c.style.width      = c.style.height = this.innerSize + 'px';
			c.style.background = this.options.background;
		},
		_createWheel: function() {
			var c = this.wheel = doc.createElement('canvas');
			c.width = c.height = this.innerSize;
			c.style.position = 'absolute';
			c.style.margin = c.style.padding = '0';
			c.style.left = c.style.top = this.padding + 'px';
			
			this._drawWheel(c.getContext('2d'));
			this.container.appendChild(c);
		},
		_drawWheel: function(ctx) {
			var s, i, rad;
			
			ctx.save();
			ctx.translate(this.wheelRadius, this.wheelRadius);
			s = this.wheelRadius - this.triangleRadius;
			// Draw a circle for every color
			for(i = 0; i < 360; i++) {
				rad = i * PI / 180;
				ctx.rotate(PI / -180); // rotate one degree
				ctx.beginPath();
				ctx.fillStyle = 'hsl(' + i + ', 100%, 50%)';
				ctx.arc(this.wheelRadius - (s / 2), 0, s / 2, 0, PI * 2, true);
				ctx.fill();
			}
			ctx.restore();
		},
		_createTriangle: function() {
			var c = this.triangle = doc.createElement('canvas');
			c.width = c.height = this.innerSize;
			c.style.position = 'absolute';
			c.style.margin = c.style.padding = '0';
			c.style.left = c.style.top = this.padding + 'px';
			
			this.triangleCtx = c.getContext('2d');
			
			this.container.appendChild(c);
		},
		_drawTriangle: function() {
			var hx = this.hx,
			    hy = this.hy,
			    sx = this.sx,
			    sy = this.sy,
			    vx = this.vx,
			    vy = this.vy,
			    size = this.innerSize;
			
			var ctx = this.triangleCtx;
			
			// clear
			ctx.clearRect(0, 0, size, size);
			
			ctx.save();
			ctx.translate(this.wheelRadius, this.wheelRadius);
			
			// make a triangle
			ctx.beginPath();
			ctx.moveTo(hx, hy);
			ctx.lineTo(sx, sy);
			ctx.lineTo(vx, vy);
			ctx.closePath();
			ctx.clip();
			
			ctx.fillStyle = '#000';
			ctx.fillRect(-this.wheelRadius, -this.wheelRadius, size, size);
			// => black triangle
			
			// create gradient from hsl(hue, 1, 1) to transparent
			var grad0 = ctx.createLinearGradient(hx, hy, (sx + vx) / 2, (sy + vy) / 2);
			var hsla = 'hsla(' + M.round(this.hue * (180/PI)) + ', 100%, 50%, ';
			grad0.addColorStop(0, hsla + '1)');
			grad0.addColorStop(1, hsla + '0)');
			ctx.fillStyle = grad0;
			ctx.fillRect(-this.wheelRadius, -this.wheelRadius, size, size);
			// => gradient: one side of the triangle is black, the opponent angle is $color
			
			// create color gradient from white to transparent
			var grad1 = ctx.createLinearGradient(vx, vy, (hx + sx) / 2, (hy + sy) / 2);
			grad1.addColorStop(0, '#fff');
			grad1.addColorStop(1, 'rgba(255, 255, 255, 0)');
			ctx.globalCompositeOperation = 'lighter';
			ctx.fillStyle = grad1;
			ctx.fillRect(-this.wheelRadius, -this.wheelRadius, size, size);
			// => white angle
			
			ctx.restore();
		},
		
		// The two pointers
		_createWheelPointer: function() {
			var c = this.wheelPointer = doc.createElement('canvas');
			var size = this.wheelPointerSize;
			c.width = c.height = size;
			c.style.position = 'absolute';
			c.style.margin = c.style.padding = '0';
			this._drawPointer(c.getContext('2d'), size/2, this.options.wheelPointerColor1, this.options.wheelPointerColor2);
			this.container.appendChild(c);
		},
		_moveWheelPointer: function(hue) {
			var r = this.wheelPointerSize / 2,
			    s = this.wheelPointer.style;
			s.top  = this.padding + this.wheelRadius - M.sin(this.hue) * (this.triangleRadius + this.wheelThickness/2) - r + 'px';
			s.left = this.padding + this.wheelRadius + M.cos(this.hue) * (this.triangleRadius + this.wheelThickness/2) - r + 'px';
		},
		_createTrianglePointer: function() { // create pointer in the triangle
			var c = this.trianglePointer = doc.createElement('canvas');
			var size = this.options.trianglePointerSize;
			c.width = c.height = size;
			c.style.position = 'absolute';
			c.style.margin = c.style.padding = '0';
			this._drawPointer(c.getContext('2d'), size/2, this.options.trianglePointerColor1, this.options.trianglePointerColor2);
			this.container.appendChild(c);
		},
		_moveTrianglePointer: function(x, y) {
			var s = this.trianglePointer.style,
			    r = this.options.trianglePointerSize / 2;
			s.top  = (this.y + this.wheelRadius + this.padding - r) + 'px';
			s.left = (this.x + this.wheelRadius + this.padding - r) + 'px';
		},
		_drawPointer: function(ctx, r, color1, color2) {	
			ctx.fillStyle = color2;
			ctx.beginPath();
			ctx.arc(r, r, r, 0, PI * 2, true);
			ctx.fill(); // => black circle
			ctx.fillStyle = color1;
			ctx.beginPath();
			ctx.arc(r, r, r - 2, 0, PI * 2, true);
			ctx.fill(); // => white circle with 1px black border
			ctx.fillStyle = color2;
			ctx.beginPath();
			ctx.arc(r, r, r / 4 + 2, 0, PI * 2, true);
			ctx.fill(); // => black circle with big white border and a small black border
			ctx.globalCompositeOperation = 'destination-out';
			ctx.beginPath();
			ctx.arc(r, r, r / 4, 0, PI * 2, true);
			ctx.fill(); // => transparent center
		},
		
		// The Element and the DOM
		inject: function(parent) {
			parent.appendChild(this.container);
			
			// calculate canvas position on page
			var offsets = getOffsets(this.triangle);
			this.offset = {
				x: offsets[0],
				y: offsets[1]
			};
		},
		dispose: function() {
			var parent = this.container.parentNode;
			if(parent) {
				parent.removeChild(this.container);
			}
		},
		getElement: function() {
			return this.container;
		},
		
		// Color accessors
		getCSS: function() {
			return 'hsl(' + Math.round(this.hue * (180/PI)) + ', '
			     + Math.round(this.saturation * 100) + '%, '
			     + Math.round(this.lightness * 100) + '%)';
		},
		getHEX: function() {
			return rgb_to_hex.apply(null, this.getRGB());
		},
		setHEX: function(hex) {
			this.setRGB.apply(this, hex_to_rgb(hex));
		},
		getRGB: function() {
			return hsl_to_rgb.apply(null, this.getHSL());
		},
		setRGB: function(r, g, b) {
			this.setHSL.apply(this, rgb_to_hsl(r, g, b));
		},
		getHSL: function() {
			return [this.hue, this.saturation, this.lightness];
		},
		setHSL: function(h, s, l) {
			this.hue = h;
			this.saturation = s;
			this.lightness = l;
			
			this._initColor();
		},
		_initColor: function() {
			this._calculatePositions();
			this._moveWheelPointer();
			this._drawTriangle();
			this._moveTrianglePointer();
		},
		
		// Mouse event handling
		_attachEvents: function() {
			this.down = null;
			
			var _this = this;
			function mousedown(evt) {
				evt.stopPropagation();
				evt.preventDefault();
				
				doc.body.addEventListener('mousemove', mousemove, false);
				doc.body.addEventListener('mouseup',   mouseup,   false);
				_this._map(evt.pageX, evt.pageY);
			}
			function mousemove(evt) {
				_this._move(evt.pageX, evt.pageY);
			}
			function mouseup() {
				if(_this.down) {
					_this.down = null;
					_this._fireEvent('dragend');
				}
				doc.body.removeEventListener('mousemove', mousemove, false);
				doc.body.removeEventListener('mouseup',   mouseup,   false);
			}
			
			this.container.addEventListener('mousedown', mousedown, false);
			this.container.addEventListener('mousemove', mousemove, false);
		},
		_map: function(x, y) {
			var ox = x,
			    oy = y;
			
			x -= this.offset.x + this.wheelRadius;
			y -= this.offset.y + this.wheelRadius;
			
			var r = M.sqrt(x*x + y*y); // Pythagoras
			if(r > this.triangleRadius && r < this.wheelRadius) {
				// Wheel
				this.down = 'wheel';
				this._fireEvent('dragstart');
				this._move(ox, oy);
			} else if(r < this.triangleRadius) {
				// Inner circle
				this.down = 'triangle';
				this._fireEvent('dragstart');
				this._move(ox, oy);
			}
		},
		_move: function(x, y) {
			if(!this.down) { return; }
			
			x -= this.offset.x + this.wheelRadius;
			y -= this.offset.y + this.wheelRadius;
			
			var rad = M.atan2(-y, x);
			if(rad < 0) {
				rad += 2 * PI;
			}
			
			if(this.down == 'wheel') {
				this.hue = rad;
				this._initColor();
				this._fireEvent('drag');
			} else if(this.down == 'triangle') {
				// get radius and max radius
				var rad0 = (rad + 2*PI - this.hue) % (2*PI),
				    rad1 = rad0 % ((2/3) * PI) - (PI/3),
				    a    = 0.5 * this.triangleRadius,
				    b    = M.tan(rad1) * a,
				    r    = M.sqrt(x*x + y*y),  // Pythagoras
				    maxR = M.sqrt(a*a + b*b); // Pythagoras
				
				if(r > maxR) {
					var dx = M.tan(rad1) * r;
					var rad2 = M.atan(dx / maxR);
					if(rad2 > PI/3) {
						rad2 = PI/3;
					} else if(rad2 < -PI/3) {
						rad2 = -PI/3;
					}
					rad += rad2 - rad1;
					
					rad0 = (rad + 2*PI - this.hue) % (2*PI);
					rad1 = rad0 % ((2/3) * PI) - (PI/3);
					b    = M.tan(rad1) * a;
					r = maxR = M.sqrt(a*a + b*b); // Pythagoras
				}
				
				x = M.round( M.cos(rad) * r);
				y = M.round(-M.sin(rad) * r);
				
				var l = this.lightness = ((M.sin(rad0) * r) / this.triangleSideLength) + 0.5
				
				var widthShare = 1 - (M.abs(l - 0.5) * 2);
				var s = this.saturation = (((M.cos(rad0) * r) + (this.triangleRadius / 2)) / (1.5 * this.triangleRadius)) / widthShare;
				s = M.max(0, s); // cannot be lower than 0
				s = M.min(1, s); // cannot be greater than 1
				
				this.lightness = l;
				this.saturation = s;
				
				this.x = x;
				this.y = y;
				this._moveTrianglePointer();
				
				this._fireEvent('drag');
			}
		}
	};
	
	if(win.net && win.net.brehaut && win.net.brehaut.Color) {
		var Color = win.net.brehaut.Color;
		
		ColorTriangle.prototype.setColor = function(colorObj) {
			var hsl = colorObj.getHSL();
			this.hue        = hsl.hue * (PI/180);
			this.saturation = hsl.saturation;
			this.lightness  = hsl.lightness;
			this._initColor();
		};
		ColorTriangle.prototype.getColor = function() {
			return Color({
				hue:        this.hue * (180/PI),
				saturation: this.saturation,
				lightness:  this.lightness
			});
		};
	}
	
	mixin(ColorTriangle.prototype, Options);
	mixin(ColorTriangle.prototype, Events);
	
	
	/***************
	* Init helpers *
	***************/
	
	ColorTriangle.initInput = function(input, options) {
		options = options || {};
		
		var ct;
		function openColorTriangle() {
			if(!ct) {
				options.size = options.size || input.offsetWidth;
				options.background = win.getComputedStyle(input, null).backgroundColor;
				options.margin = options.margin || 10;
				options.event = options.event || 'dragend';
				
				ct = new ColorTriangle(input.value, options);
				ct.addEventListener(options.event, function() {
					input.value = ct.getHEX();
					fireChangeEvent();
				});
			} else {
				ct.setHEX(input.value);
			}
				
			var top = input.offsetTop;
			if(win.innerHeight - input.getBoundingClientRect().top > input.offsetHeight + options.margin + options.size) {
				top += input.offsetHeight + options.margin; // below
			} else {
				top -= options.margin + options.size; // above
			}
			
			var el = ct.getElement();
			el.style.position = 'absolute';
			el.style.left     = input.offsetLeft + 'px';
			el.style.top      = top + 'px';
			el.style.zIndex   = '1338'; // above everything
			
			ct.inject(input.parentNode);
		}
		function closeColorTriangle() {
			if(ct) {
				ct.dispose();
			}
		}
		function fireChangeEvent() {
			var evt = doc.createEvent('HTMLEvents');
			evt.initEvent('change', true, false); // bubbles = true, cancable = false
			input.dispatchEvent(evt); // fire event
		}
		
		input.addEventListener('focus', openColorTriangle, false);
		input.addEventListener('blur', closeColorTriangle, false);
		input.addEventListener('keyup', function() {
			var val = input.value;
			if(val.match(/^#((?:[0-9A-Fa-f]{3})|(?:[0-9A-Fa-f]{6}))$/)) {
				openColorTriangle();
				fireChangeEvent();
			} else {
				closeColorTriangle();
			}
		}, false);
	};
	
	ColorTriangle.initColorInputs = function(options) {
		var inputs = doc.getElementsByTagName('input');
		each(inputs, function(input) {
			if(input.getAttribute('type') == 'color') {
				ColorTriangle.initInput(input, options);
			}
		});
	};
	
	return ColorTriangle;
	
})(window, document, Math); // end closure
